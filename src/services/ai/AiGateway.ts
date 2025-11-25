import type {
  AiActionCommandMap,
  AiActionDto,
  AiActionType,
  AiGatewayConfig,
  AiGatewayRequestOptions,
  AiGatewayVoiceResult,
  AiInsightDto,
  AiResponse,
  UserDailyContext,
  UserPeriodContext,
  UserShortContext,
} from '@/types/ai-gateway';

const DEFAULT_RETRY_DELAYS = [1000, 2000, 4000];
const DEFAULT_TIMEOUT = 6000;
const DEFAULT_CACHE_TTL = 1000 * 60 * 60; // 1 час

export type AiGatewayChannel = 'daily' | 'period' | 'qa' | 'voice';

interface CacheEntry {
  expiresAt: number;
  response: AiResponse;
}

interface QuotaTracker {
  used: number;
  resetAt: number;
}

interface InvokePayload {
  model: AiGatewayChannel;
  prompt: Record<string, unknown>;
}

export class AiGatewayError extends Error {
  constructor(message: string, readonly meta?: Record<string, unknown>) {
    super(message);
    this.name = 'AiGatewayError';
  }
}

export class AiGateway {
  private cache = new Map<string, CacheEntry>();
  private quotas = new Map<string, Record<AiGatewayChannel, QuotaTracker>>();
  private logger = this.config.logger ?? console;
  private retryDelays = this.config.retryDelaysMs ?? DEFAULT_RETRY_DELAYS;
  private cacheTtl = this.config.cacheTtlMs ?? DEFAULT_CACHE_TTL;
  private timeout = this.config.timeoutMs ?? DEFAULT_TIMEOUT;

  constructor(private readonly config: AiGatewayConfig) {
    if (!config.endpoint || !config.apiKey) {
      throw new Error('AiGateway: endpoint и apiKey обязательны');
    }
  }

  async generateDailyInsights(
    ctx: UserDailyContext,
    options: AiGatewayRequestOptions,
  ): Promise<AiResponse> {
    const cacheKey = this.buildCacheKey('daily', options.userId, ctx.date, ctx);
    if (!options.force) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.response;
      }
    }

    this.ensureQuota(options.userId, 'daily');
    const payload = this.buildPrompt('daily', ctx, options.locale);
    const response = await this.invokeModel(payload, options);

    this.cache.set(cacheKey, { response, expiresAt: Date.now() + this.cacheTtl });
    return response;
  }

  async generatePeriodSummary(
    ctx: UserPeriodContext,
    options: AiGatewayRequestOptions,
  ): Promise<AiResponse> {
    this.ensureQuota(options.userId, 'period');
    const payload = this.buildPrompt('period', ctx, options.locale);
    return this.invokeModel(payload, options);
  }

  async answerUserQuestion(
    question: string,
    ctx: UserShortContext,
    options: AiGatewayRequestOptions,
  ): Promise<AiResponse> {
    this.ensureQuota(options.userId, 'qa');
    const payload = this.buildPrompt('qa', { question, ctx }, options.locale);
    return this.invokeModel(payload, options);
  }

  async parseVoiceIntent(
    utterance: string,
    locale: string,
    shortCtx: UserShortContext,
    options: AiGatewayRequestOptions,
  ): Promise<AiGatewayVoiceResult> {
    this.ensureQuota(options.userId, 'voice');
    const prompt = {
      system:
        'Вы — AiGateway LEORA. Распознайте интент пользователя и верните JSON intent+slots+response.',
      locale,
      utterance,
      context: shortCtx,
      output: 'voice_intent_schema',
    };

    try {
      const response = await this.invokeModel({ model: 'voice', prompt }, options);
      const intent = response.actions[0]?.payload?.intent as string | undefined;
      return {
        intent: intent ?? 'unknown',
        slots: (response.actions[0]?.payload?.slots as Record<string, unknown>) ?? {},
        response: response.narration,
      };
    } catch (error) {
      this.logger.error('AiGateway voice intent failed', { error });
      return {
        intent: 'unknown',
        slots: {},
        response: options.offlineFallbackText,
      };
    }
  }

  private buildPrompt(
    channel: AiGatewayChannel,
    context: unknown,
    locale?: string,
  ): InvokePayload {
    const base = {
      locale,
      timestamp: new Date().toISOString(),
    };

    switch (channel) {
      case 'daily':
        return {
          model: 'daily',
          prompt: {
            ...base,
            system: 'Сформируй дневные инсайты LEORA по JSON-схеме AiResponse',
            context,
          },
        };
      case 'period':
        return {
          model: 'period',
          prompt: {
            ...base,
            system: 'Сформируй недельное/месячное резюме LEORA по JSON-схеме AiResponse',
            context,
          },
        };
      case 'qa':
        return {
          model: 'qa',
          prompt: {
            ...base,
            system: 'Ответь на вопрос пользователя, верни AiResponse и действующие рекомендации',
            context,
          },
        };
      default:
        return {
          model: 'voice',
          prompt: {
            ...base,
            context,
          },
        };
    }
  }

  private ensureQuota(userId: string, channel: AiGatewayChannel) {
    const quotas = this.config.quotas ?? {
      dailyInsights: 2,
      periodSummary: 1,
      qa: 10,
    };

    const limitMap: Record<AiGatewayChannel, number | undefined> = {
      daily: quotas.dailyInsights,
      period: quotas.periodSummary,
      qa: quotas.qa,
      voice: quotas.qa,
    };

    const limit = limitMap[channel];
    if (!limit) {
      return;
    }

    const key = `${userId}:${channel}`;
    let tracker = this.quotas.get(key)?.[channel];
    const now = Date.now();

    if (!tracker || tracker.resetAt < now) {
      tracker = {
        used: 0,
        resetAt: now + 24 * 60 * 60 * 1000,
      };
      const entry = this.quotas.get(key) ?? ({} as Record<AiGatewayChannel, QuotaTracker>);
      entry[channel] = tracker;
      this.quotas.set(key, entry);
    }

    if (tracker.used >= limit) {
      throw new AiGatewayError('Превышена квота AiGateway', { userId, channel });
    }

    tracker.used += 1;
  }

  private async invokeModel(
    payload: InvokePayload,
    options: AiGatewayRequestOptions,
  ): Promise<AiResponse> {
    const requestId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const body = JSON.stringify(payload.prompt);

    for (let attempt = 0; attempt <= this.retryDelays.length; attempt += 1) {
      try {
        const result = await this.performRequest(body);
        const parsed = this.parseResponse(result, requestId, payload.model);
        return parsed;
      } catch (error) {
        const isLastAttempt = attempt === this.retryDelays.length;
        if (isLastAttempt) {
          this.logger.error('AiGateway request failed', { requestId, error, payload: payload.model });
          return this.buildFallback(options.offlineFallbackText ?? 'AiGateway недоступен');
        }
        const delay = this.retryDelays[attempt];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return this.buildFallback('Неизвестная ошибка AiGateway');
  }

  private async performRequest(body: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AiGatewayError('AiGateway HTTP error', { status: response.status });
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseResponse(data: unknown, requestId: string, model: AiGatewayChannel): AiResponse {
    const parsed = data as Partial<AiResponse>;
    const isValid =
      parsed && Array.isArray(parsed.insights) && Array.isArray(parsed.actions);

    if (!isValid) {
      this.logger.warn('AiGateway schema validation failed', { requestId, model });
      return this.buildFallback('Ответ ИИ не прошёл валидацию', parsed?.narration);
    }

    return {
      narration: parsed.narration,
      insights: parsed.insights as AiInsightDto[],
      actions: parsed.actions as AiActionDto[],
      rawText: (parsed as AiResponse).rawText,
    };
  }

  private buildFallback(reason: string, narration?: string): AiResponse {
    return {
      narration: narration ?? reason,
      insights: [
        {
          kind: 'combined',
          level: 'info',
          title: 'Нет свежих инсайтов',
          body: reason,
        },
      ],
      actions: [],
    };
  }

  private buildCacheKey(
    channel: AiGatewayChannel,
    userId: string,
    date: string,
    ctx: unknown,
  ) {
    const hash = this.hashPayload(ctx);
    return `${userId}:${channel}:${date}:${hash}`;
  }

  private hashPayload(payload: unknown) {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;  
    }
    return hash.toString(16);
  }
}

export const AI_ACTION_COMMAND_MAP: AiActionCommandMap = {
  create_task: 'open_tasks',
  create_habit: 'open_habits',
  create_budget: 'open_budgets',
  create_debt: 'open_debt',
  start_focus: 'open_tasks',
  open_budget: 'open_budgets',
  open_goal: 'open_goals',
  review_budget: 'review_budget',
};
