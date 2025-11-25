// ==================== utils/aiParser.ts ====================

// ParsedData type definition (agar alohida types.ts bo'lmasa)
export interface ParsedData {
  type: 'expense' | 'income' | 'transfer' | 'debt_given' | 'custom';
  amount?: string;
  category?: string;
  account?: string;
  person?: string;
  from?: string;
  to?: string;
  description?: string;
  notes?: string;
  confidence?: string;
  dueDate?: string;
  taxable?: string;
  fee?: string;
  [key: string]: any; // AI может добавить любые поля
}

export const extractAmount = (text: string): string => {
  const numbers = text.match(/\d+/g);
  if (numbers) {
    const amount = numbers.join('');
    if (text.includes('доллар') || text.includes('$')) return `$${amount}`;
    if (text.includes('сум')) return `${amount} UZS`;
    if (text.includes('миллион')) return `${amount},000,000 UZS`;
    if (text.includes('тысяч')) return `${amount},000 UZS`;
    return amount;
  }
  return '0';
};

export const smartCategoryDetection = (text: string): string => {
  const categories: Record<string, string[]> = {
    'Рестораны': ['ресторан', 'кафе', 'обед', 'ужин'],
    'Продукты': ['продукт', 'магазин', 'супермаркет', 'еда'],
    'Транспорт': ['такси', 'транспорт', 'метро', 'автобус', 'бензин'],
    'Развлечения': ['кино', 'театр', 'игра', 'концерт'],
    'Здоровье': ['аптека', 'врач', 'больница', 'лекарство'],
    'Одежда': ['магазин', 'одежда', 'обувь', 'мода'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return category;
    }
  }
  return 'Другое';
};

export const extractPerson = (text: string): string => {
  const names = ['Азизу', 'Джовзоду', 'Aziz', 'Jovzod', 'Алишер', 'Фарход'];
  for (let name of names) {
    if (text.toLowerCase().includes(name.toLowerCase())) return name;
  }
  return 'Не указан';
};

export const parseCommandWithAI = (text: string): ParsedData => {
  const lower = text.toLowerCase();
  
  const baseData: ParsedData = {
    type: 'expense',
    description: text,
  };

  if (lower.includes('потратил') || lower.includes('расход')) {
    baseData.type = 'expense';
    baseData.amount = extractAmount(text);
    baseData.category = smartCategoryDetection(text);
    baseData.account = 'Cash';
    baseData.notes = 'Автоматически определено AI';
    baseData.confidence = '95%';
  } else if (lower.includes('отдал долг') || lower.includes('дал в долг')) {
    baseData.type = 'debt_given';
    baseData.amount = extractAmount(text);
    baseData.person = extractPerson(text);
    baseData.dueDate = 'Не указан';
    baseData.confidence = '90%';
  } else if (lower.includes('получил') || lower.includes('заработал') || lower.includes('зарплат')) {
    baseData.type = 'income';
    baseData.amount = extractAmount(text);
    baseData.category = 'Зарплата';
    baseData.account = 'Cash';
    baseData.taxable = 'Да';
    baseData.confidence = '98%';
  } else if (lower.includes('перевести') || lower.includes('перевод')) {
    baseData.type = 'transfer';
    baseData.amount = extractAmount(text);
    baseData.from = 'Cash';
    baseData.to = 'Card';
    baseData.fee = '0';
    baseData.confidence = '92%';
  }

  return baseData;
};

// ==================== ALTERNATIVE: Agar types/ folder bo'lsa ====================
// types/index.ts file yarating va shu kodni qo'ying:

/*
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
  notes?: string;
  confidence?: string;
  dueDate?: string;
  taxable?: string;
  fee?: string;
  [key: string]: any;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}
*/

// Keyin utils/aiParser.ts da shunchaki import qiling:
// import { ParsedData } from '@/types';