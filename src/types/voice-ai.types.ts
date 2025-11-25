export type AIStage = 'idle' | 'listening' | 'thinking' | 'confirm' | 'editing' | 'success';

export interface ParsedData {
  type: 'expense' | 'income' | 'transfer' | 'debt_given' | 'custom';
  amount?: string;
  category?: string;
  account?: string;
  person?: string;
  from?: string;
  to?: string;
  description?: string;
  [key: string]: any; // AI может добавить любые поля
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}
