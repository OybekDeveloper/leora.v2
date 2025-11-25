import { AiGateway, AI_ACTION_COMMAND_MAP } from '@/services/ai/AiGateway';
import { buildDailyContext } from '@/services/ai/contextBuilders';
import { useInsightsStore } from '@/stores/useInsightsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { AiResponse, AiActionDto } from '@/types/ai-gateway';
import type { Insight, InsightScope, InsightActionRecord } from '@/types/insights';

const ENDPOINT = process.env.EXPO_PUBLIC_AI_ENDPOINT ?? '';
const API_KEY = process.env.EXPO_PUBLIC_AI_KEY ?? '';

let gatewayInstance: AiGateway | null | undefined;

const getGateway = (): AiGateway | null => {
  if (gatewayInstance !== undefined) {
    return gatewayInstance;
  }

  if (!ENDPOINT || !API_KEY) {
    console.warn('[AiGateway] endpoint или apiKey не заданы');
    gatewayInstance = null;
    return gatewayInstance;
  }

  gatewayInstance = new AiGateway({
    endpoint: ENDPOINT,
    apiKey: API_KEY,
  });
  return gatewayInstance;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
};

const mapActions = (actions: AiActionDto[] | undefined): InsightActionRecord[] | undefined => {
  if (!actions || actions.length === 0) {
    return undefined;
  }
  return actions.map((action) => ({
    type: action.type,
    action: AI_ACTION_COMMAND_MAP[action.type],
    payload: action.payload,
    confidence: action.confidence,
    priority: action.priority,
  }));
};

const mapResponseToInsights = (response: AiResponse, scope: InsightScope): Insight[] => {
  const nowIso = new Date().toISOString();
  const actions = mapActions(response.actions);
  return (response.insights ?? []).map((insight, index) => {
    const fingerprint = `${insight.kind}-${insight.title}-${insight.body}-${index}`;
    return {
      id: `${scope}-${hashString(fingerprint)}`,
      kind: insight.kind,
      level: insight.level,
      scope,
      title: insight.title,
      body: insight.body,
      payload: insight,
      related: insight.related,
      actions,
      createdAt: nowIso,
      validUntil: scope === 'daily' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
      source: 'chatgpt',
    } satisfies Insight;
  });
};

export const requestDailyInsights = async (
  date: Date,
  options?: { force?: boolean },
): Promise<AiResponse | null> => {
  const gateway = getGateway();
  if (!gateway) {
    return null;
  }

  const authState = useAuthStore.getState();
  const userId = authState.user?.id ?? 'local-user';
  const ctx = buildDailyContext(date);
  const store = useInsightsStore.getState();

  try {
    const response = await gateway.generateDailyInsights(ctx, {
      userId,
      force: options?.force,
      offlineFallbackText: 'Инсайты недоступны офлайн',
    });
    const mapped = mapResponseToInsights(response, 'daily');
    store.addInsights(mapped, { replace: !!options?.force });
    store.setLastFetchedAt(ctx.date);
    return response;
  } catch (error) {
    console.warn('[AiGateway] Не удалось получить инсайты', error);
    throw error;
  }
};
