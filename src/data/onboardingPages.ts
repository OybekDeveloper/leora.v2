// Onboarding sahifalari konfiguratsiyasi
// 12 ta sahifa - har hafta 3 tasi ko'rsatiladi

export type OnboardingCategory = 'finance' | 'planner' | 'insight';
export type MockupType =
  | 'budget'
  | 'debt'
  | 'analytics'
  | 'accounts'
  | 'goals'
  | 'tasks'
  | 'habits'
  | 'focus'
  | 'ai-analysis'
  | 'voice'
  | 'reminders'
  | 'predictions';

export interface OnboardingPageConfig {
  id: string;
  index: number;
  category: OnboardingCategory;
  icon: string; // lucide-react-native icon name
  mockupType: MockupType;
}

// 12 ta onboarding sahifasi
export const ONBOARDING_PAGES: OnboardingPageConfig[] = [
  // === FINANCE (0-3) ===
  {
    id: 'budget',
    index: 0,
    category: 'finance',
    icon: 'PieChart',
    mockupType: 'budget',
  },
  {
    id: 'debt',
    index: 1,
    category: 'finance',
    icon: 'HandCoins',
    mockupType: 'debt',
  },
  {
    id: 'analytics',
    index: 2,
    category: 'finance',
    icon: 'TrendingUp',
    mockupType: 'analytics',
  },
  {
    id: 'accounts',
    index: 3,
    category: 'finance',
    icon: 'Wallet',
    mockupType: 'accounts',
  },

  // === PLANNER (4-7) ===
  {
    id: 'goals',
    index: 4,
    category: 'planner',
    icon: 'Target',
    mockupType: 'goals',
  },
  {
    id: 'tasks',
    index: 5,
    category: 'planner',
    icon: 'CheckSquare',
    mockupType: 'tasks',
  },
  {
    id: 'habits',
    index: 6,
    category: 'planner',
    icon: 'Flame',
    mockupType: 'habits',
  },
  {
    id: 'focus',
    index: 7,
    category: 'planner',
    icon: 'Timer',
    mockupType: 'focus',
  },

  // === INSIGHT/AI (8-11) ===
  {
    id: 'ai-analysis',
    index: 8,
    category: 'insight',
    icon: 'Sparkles',
    mockupType: 'ai-analysis',
  },
  {
    id: 'voice',
    index: 9,
    category: 'insight',
    icon: 'Mic',
    mockupType: 'voice',
  },
  {
    id: 'reminders',
    index: 10,
    category: 'insight',
    icon: 'Bell',
    mockupType: 'reminders',
  },
  {
    id: 'predictions',
    index: 11,
    category: 'insight',
    icon: 'Lightbulb',
    mockupType: 'predictions',
  },
];

// Fake data for mockups
export const MOCKUP_DATA = {
  budget: {
    name: 'Oziq-ovqat',
    spent: 450000,
    limit: 600000,
    currency: 'UZS',
    percentage: 75,
    categoryIcon: 'ShoppingCart',
  },
  debt: {
    given: {
      name: 'Akbar',
      amount: 500000,
      currency: 'UZS',
      dueIn: 5,
    },
    taken: {
      name: 'Sardor',
      amount: 300000,
      currency: 'UZS',
      dueIn: 10,
    },
  },
  analytics: {
    income: 5000000,
    expense: 3200000,
    savings: 1800000,
    trend: 12, // +12%
    topCategory: 'Transport',
    topAmount: 800000,
  },
  accounts: {
    cards: [
      { name: 'Asosiy karta', balance: 2500000, type: 'card', currency: 'UZS' },
      { name: 'Jamg\'arma', balance: 5000000, type: 'savings', currency: 'UZS' },
    ],
  },
  goals: {
    name: 'Yangi laptop',
    current: 3500000,
    target: 10000000,
    percentage: 35,
    icon: 'Laptop',
  },
  tasks: {
    items: [
      { title: 'Loyiha taqdimoti', priority: 'high', done: false },
      { title: 'Hisobot yozish', priority: 'medium', done: true },
      { title: 'Email javoblash', priority: 'low', done: false },
    ],
  },
  habits: {
    name: 'Suv ichish',
    streak: 7,
    record: 21,
    days: [true, true, false, true, true, true, true, true, false, true],
  },
  focus: {
    task: 'Kod yozish',
    duration: 25,
    completed: 3,
    total: 4,
  },
  'ai-analysis': {
    insight: 'Bu oyda transport xarajatlari 23% oshdi',
    suggestion: 'Jamoat transportidan foydalaning',
    icon: 'Car',
  },
  voice: {
    command: '"500 ming so\'m oziq-ovqatga"',
    result: 'Xarajat qo\'shildi',
  },
  reminders: {
    items: [
      { title: 'Qarz to\'lash', time: 'Bugun 18:00', type: 'debt' },
      { title: 'Budjet limiti', time: 'Oziq-ovqat 90%', type: 'budget' },
    ],
  },
  predictions: {
    prediction: 'Keyingi oyda ~4.2M xarajat',
    tip: 'O\'tgan oy naqadinasiga nisbatan 8% kam',
    accuracy: 94,
  },
};

// Get pages for current week set
export const getPagesForSet = (setIndex: number): OnboardingPageConfig[] => {
  const startIndex = setIndex * 3;
  return ONBOARDING_PAGES.slice(startIndex, startIndex + 3);
};
