import type { InsightActionType } from '@/types/insights';

export type AiInsightKind = 'finance' | 'planner' | 'habit' | 'focus' | 'combined' | 'wisdom';
export type AiInsightLevel = 'info' | 'warning' | 'critical' | 'celebration';
export type AiActionType =
  | 'create_task'
  | 'create_habit'
  | 'create_budget'
  | 'create_debt'
  | 'start_focus'
  | 'open_budget'
  | 'open_goal'
  | 'review_budget';

export interface AiActionDto {
  type: AiActionType;
  payload: Record<string, unknown>;
  confidence?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface AiInsightDto {
  kind: AiInsightKind;
  level: AiInsightLevel;
  title: string;
  body: string;
  related?: {
    goalId?: string;
    budgetId?: string;
    debtId?: string;
    habitId?: string;
    taskId?: string;
  };
  tags?: string[];
}

export interface AiResponse {
  narration?: string;
  insights: AiInsightDto[];
  actions: AiActionDto[];
  rawText?: string;
}

export interface UserDailyContext {
  date: string;
  region: string;
  baseCurrency: string;
  language: string;
  indices: {
    financeIndex: number;
    productivityIndex: number;
    habitsIndex: number;
    overallIndex: number;
  };
  financeSummary: Record<string, unknown>;
  plannerSummary: Record<string, unknown>;
}

export interface UserPeriodContext extends UserDailyContext {
  periodType: 'week' | 'month' | 'custom';
  from: string;
  to: string;
}

export interface UserShortContext {
  language: string;
  baseCurrency: string;
  keyFinanceFacts: Record<string, unknown>;
  keyPlannerFacts: Record<string, unknown>;
}

export interface AiGatewayLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

export interface AiGatewayQuotaConfig {
  dailyInsights: number;
  periodSummary: number;
  qa: number;
}

export interface AiGatewayConfig {
  endpoint: string;
  apiKey: string;
  timeoutMs?: number;
  retryDelaysMs?: number[];
  quotas?: AiGatewayQuotaConfig;
  cacheTtlMs?: number;
  logger?: AiGatewayLogger;
}

export interface AiGatewayRequestOptions {
  userId: string;
  locale?: string;
  force?: boolean;
  offlineFallbackText?: string;
}

export interface AiGatewayVoiceResult {
  intent: string;
  slots: Record<string, unknown>;
  response?: string;
}

export type AiActionCommandMap = Partial<Record<AiActionType, InsightActionType>>;
