import type { ComponentType } from 'react';

import { BookOpen, Brain, Dumbbell } from 'lucide-react-native';

import type { WidgetType } from '@/config/widgetConfig';
import type { Goal, ProgressData, Task } from '@/types/home';
import { toISODateKey } from '@/utils/calendar';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  icon: ComponentType<{ size?: number; color?: string }>;
}

interface WeeklyStats {
  tasksCompleted: number;
  totalTasks: number;
  focusHours: number;
  streak: number;
}

type WidgetPayload = {
  hasData: boolean;
  props?: Record<string, unknown>;
};

export interface DailySnapshot {
  progress?: ProgressData;
  widgets: Partial<Record<WidgetType, WidgetPayload>>;
}

interface FocusSession {
  id: string;
  task: string;
  duration: number;
  completed: boolean;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  date: string;
}

interface BudgetItem {
  label: string;
  used: number;
  total: number;
}

interface CashFlowDay {
  label: string;
  income: number;
  expense: number;
}

const novemberTasks: Task[] = [
  { id: 'n1', title: 'Leadership sync', time: '09:00', completed: true },
  { id: 'n2', title: 'Investor deck update', time: '11:30', completed: false },
  { id: 'n3', title: 'Customer interviews', time: '15:00', completed: true },
  { id: 'n4', title: 'Stretch & walk', time: '19:00', completed: false },
];

const novemberGoals: Goal[] = [
  {
    id: 'g1',
    title: 'Close Q4 funding',
    progress: 42,
    current: 420000,
    target: 1000000,
    unit: 'USD',
    category: 'professional',
  },
  {
    id: 'g2',
    title: 'Book 5 keynote talks',
    progress: 60,
    current: 3,
    target: 5,
    unit: 'talks',
    category: 'professional',
  },
  {
    id: 'g3',
    title: 'Read 4 books',
    progress: 50,
    current: 2,
    target: 4,
    unit: 'books',
    category: 'personal',
  },
];

const novemberHabits: Habit[] = [
  { id: 'h1', name: 'Morning workout', streak: 9, completed: true, icon: Dumbbell },
  { id: 'h2', name: 'Meditation', streak: 12, completed: true, icon: Brain },
  { id: 'h3', name: 'Read 20 min', streak: 7, completed: false, icon: BookOpen },
];

const novemberStats: WeeklyStats = {
  tasksCompleted: 26,
  totalTasks: 34,
  focusHours: 24,
  streak: 5,
};

const novemberFocusSessions = {
  sessions: [
    { id: 'fs-nov-1', task: 'Fundraising outreach', duration: 45, completed: true },
    { id: 'fs-nov-2', task: 'Product roadmap review', duration: 35, completed: true },
    { id: 'fs-nov-3', task: 'Inbox zero', duration: 25, completed: false },
  ] as FocusSession[],
  summary: {
    completed: 2,
    totalMinutes: 105,
    nextSessionMinutes: 25,
  },
};

const novemberTransactions: Transaction[] = [
  { id: 'tr-nov-1', type: 'income', amount: 8500, currency: 'USD', category: 'Retainer', date: '08:45' },
  { id: 'tr-nov-2', type: 'expense', amount: 220, currency: 'USD', category: 'Flights', date: '10:05' },
  { id: 'tr-nov-3', type: 'expense', amount: 48, currency: 'USD', category: 'Team lunch', date: '13:30' },
];

const novemberProductivity = {
  metrics: [
    { label: 'Focus score', value: '88', suffix: '/100' },
    { label: 'Tasks completed', value: '16', suffix: '/18' },
    { label: 'Deep work hrs', value: '6.7', suffix: 'h' },
  ],
  trend: [
    { label: 'Mon', value: 70 },
    { label: 'Tue', value: 74 },
    { label: 'Wed', value: 82 },
    { label: 'Thu', value: 86 },
    { label: 'Fri', value: 90 },
  ],
  trendDelta: 8,
};

const novemberSpending = {
  categories: [
    { label: 'Travel', amount: 220 },
    { label: 'Meals', amount: 48 },
    { label: 'Tools', amount: 65 },
  ],
  total: 333,
};

const novemberBudgets: BudgetItem[] = [
  { label: 'Travel', used: 720, total: 1200 },
  { label: 'Team', used: 410, total: 700 },
  { label: 'Learning', used: 190, total: 300 },
];

const novemberCashFlow: CashFlowDay[] = [
  { label: 'Mon', income: 420, expense: 280 },
  { label: 'Tue', income: 360, expense: 240 },
  { label: 'Wed', income: 580, expense: 320 },
  { label: 'Thu', income: 450, expense: 260 },
  { label: 'Fri', income: 490, expense: 310 },
];

const novemberWellness = {
  metrics: [
    { label: 'Energy', value: 84 },
    { label: 'Mood', value: 87 },
    { label: 'Sleep quality', value: 79 },
  ],
  statusMessage: 'Strong pace — remember to schedule an unplugged evening.',
};

const nov4Snapshot: DailySnapshot = {
  progress: { tasks: 10, budget: 49, focus: 70 },
  widgets: {
    'daily-tasks': { hasData: true, props: { initialTasks: novemberTasks } },
    goals: { hasData: true, props: { goals: novemberGoals } },
    habits: { hasData: true, props: { habits: novemberHabits } },
    'weekly-review': { hasData: true, props: { stats: novemberStats } },
    'focus-sessions': { hasData: true, props: novemberFocusSessions },
    transactions: { hasData: true, props: { transactions: novemberTransactions } },
    'productivity-insights': { hasData: true, props: novemberProductivity },
    'spending-summary': { hasData: true, props: novemberSpending },
    'budget-progress': { hasData: true, props: { budgets: novemberBudgets } },
    'cash-flow': { hasData: true, props: { days: novemberCashFlow } },
    'wellness-overview': { hasData: true, props: novemberWellness },
  },
};

const nov5Snapshot: DailySnapshot = {
  progress: { tasks: 65, budget: 32, focus: 90 },
  widgets: {
    'daily-tasks': {
      hasData: true,
      props: {
        initialTasks: [
          { id: 'n5-1', title: 'Hiring interviews', time: '10:00', completed: true },
          { id: 'n5-2', title: 'Ops sync', time: '12:30', completed: false },
          { id: 'n5-3', title: 'Press outreach', time: '17:00', completed: false },
        ],
      },
    },
    goals: { hasData: true, props: { goals: novemberGoals.map((goal) => ({ ...goal, progress: goal.progress + 4 })) } },
    habits: { hasData: true, props: { habits: novemberHabits.map((habit) => ({ ...habit, completed: habit.id !== 'h3' })) } },
    'weekly-review': { hasData: true, props: { stats: { tasksCompleted: 22, totalTasks: 32, focusHours: 21, streak: 5 } } },
    'focus-sessions': {
      hasData: true,
      props: {
        sessions: [
          { id: 'fs-n5-1', task: 'Pitch practice', duration: 30, completed: true },
          { id: 'fs-n5-2', task: 'Hiring plan', duration: 40, completed: false },
        ],
        summary: { completed: 1, totalMinutes: 70, nextSessionMinutes: 40 },
      },
    },
    transactions: {
      hasData: true,
      props: {
        transactions: [
          { id: 'tr-n5-1', type: 'income', amount: 2300, currency: 'USD', category: 'Speaking fee', date: '09:30' },
          { id: 'tr-n5-2', type: 'expense', amount: 32, currency: 'USD', category: 'Coffee shop', date: '11:15' },
        ],
      },
    },
    'productivity-insights': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Focus score', value: '81', suffix: '/100' },
          { label: 'Tasks completed', value: '12', suffix: '/15' },
          { label: 'Deep work hrs', value: '5.4', suffix: 'h' },
        ],
        trend: [
          { label: 'Mon', value: 66 },
          { label: 'Tue', value: 70 },
          { label: 'Wed', value: 78 },
          { label: 'Thu', value: 82 },
          { label: 'Fri', value: 85 },
        ],
        trendDelta: 6,
      },
    },
    'spending-summary': {
      hasData: true,
      props: {
        categories: [
          { label: 'Coffee shops', amount: 12 },
          { label: 'Ride share', amount: 18 },
          { label: 'Lunch', amount: 24 },
        ],
        total: 54,
      },
    },
    'budget-progress': {
      hasData: true,
      props: {
        budgets: [
          { label: 'Travel', used: 760, total: 1200 },
          { label: 'Team', used: 440, total: 700 },
          { label: 'Learning', used: 210, total: 300 },
        ],
      },
    },
    'cash-flow': {
      hasData: true,
      props: {
        days: [
          { label: 'Mon', income: 360, expense: 210 },
          { label: 'Tue', income: 420, expense: 240 },
          { label: 'Wed', income: 460, expense: 260 },
          { label: 'Thu', income: 490, expense: 270 },
          { label: 'Fri', income: 510, expense: 295 },
        ],
      },
    },
    'wellness-overview': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Energy', value: 82 },
          { label: 'Mood', value: 84 },
          { label: 'Sleep quality', value: 77 },
        ],
        statusMessage: 'Keep integrating recovery — today looks balanced.',
      },
    },
  },
};

const nov3Snapshot: DailySnapshot = {
  progress: { tasks: 58, budget: 44, focus: 55 },
  widgets: {
    'daily-tasks': {
      hasData: true,
      props: {
        initialTasks: [
          { id: 'n3-1', title: 'Board prep', time: '09:00', completed: true },
          { id: 'n3-2', title: 'Engineering sync', time: '11:00', completed: true },
          { id: 'n3-3', title: 'Mentor call', time: '17:30', completed: false },
        ],
      },
    },
    goals: { hasData: true, props: { goals: novemberGoals.map((goal) => ({ ...goal, progress: goal.progress - 5 })) } },
    habits: { hasData: true, props: { habits: novemberHabits.map((habit) => ({ ...habit, completed: habit.id === 'h1' })) } },
    'weekly-review': { hasData: true, props: { stats: { tasksCompleted: 18, totalTasks: 30, focusHours: 19, streak: 4 } } },
    'focus-sessions': {
      hasData: true,
      props: {
        sessions: [
          { id: 'fs-n3-1', task: 'Board memo writing', duration: 50, completed: true },
          { id: 'fs-n3-2', task: 'Hiring pipeline', duration: 35, completed: false },
        ],
        summary: { completed: 1, totalMinutes: 85, nextSessionMinutes: 35 },
      },
    },
    transactions: {
      hasData: true,
      props: {
        transactions: [
          { id: 'tr-n3-1', type: 'expense', amount: 14, currency: 'USD', category: 'Cafes', date: '08:15' },
          { id: 'tr-n3-2', type: 'expense', amount: 40, currency: 'USD', category: 'Lunch', date: '12:30' },
        ],
      },
    },
    'productivity-insights': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Focus score', value: '76', suffix: '/100' },
          { label: 'Tasks completed', value: '10', suffix: '/14' },
          { label: 'Deep work hrs', value: '4.5', suffix: 'h' },
        ],
        trend: [
          { label: 'Mon', value: 58 },
          { label: 'Tue', value: 64 },
          { label: 'Wed', value: 70 },
          { label: 'Thu', value: 74 },
          { label: 'Fri', value: 78 },
        ],
        trendDelta: 5,
      },
    },
    'spending-summary': {
      hasData: true,
      props: {
        categories: [
          { label: 'Dining', amount: 40 },
          { label: 'Cafes', amount: 14 },
          { label: 'Transit', amount: 10 },
        ],
        total: 64,
      },
    },
    'budget-progress': {
      hasData: true,
      props: {
        budgets: [
          { label: 'Travel', used: 690, total: 1200 },
          { label: 'Team', used: 390, total: 700 },
          { label: 'Learning', used: 170, total: 300 },
        ],
      },
    },
    'cash-flow': {
      hasData: true,
      props: {
        days: [
          { label: 'Mon', income: 300, expense: 180 },
          { label: 'Tue', income: 320, expense: 205 },
          { label: 'Wed', income: 350, expense: 220 },
          { label: 'Thu', income: 370, expense: 230 },
          { label: 'Fri', income: 390, expense: 245 },
        ],
      },
    },
    'wellness-overview': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Energy', value: 78 },
          { label: 'Mood', value: 81 },
          { label: 'Sleep quality', value: 75 },
        ],
        statusMessage: 'Good trend — hydration and sleep look on track.',
      },
    },
  },
};

const nov1Snapshot: DailySnapshot = {
  progress: { tasks: 48, budget: 30, focus: 76 },
  widgets: {
    'daily-tasks': {
      hasData: true,
      props: {
        initialTasks: [
          { id: 'n1-1', title: 'Weekly planning', time: '09:00', completed: true },
          { id: 'n1-2', title: 'Finance sync', time: '11:30', completed: false },
        ],
      },
    },
    goals: { hasData: false },
    habits: { hasData: false },
    'weekly-review': { hasData: false },
    'focus-sessions': { hasData: false },
    transactions: { hasData: false },
    'productivity-insights': { hasData: false },
    'spending-summary': { hasData: false },
    'budget-progress': { hasData: false },
    'cash-flow': { hasData: false },
    'wellness-overview': { hasData: false },
  },
};

const oct28Snapshot: DailySnapshot = {
  progress: { tasks: 64, budget: 48, focus: 60 },
  widgets: {
    'daily-tasks': {
      hasData: true,
      props: {
        initialTasks: [
          { id: 'o28-1', title: 'Roadmap check-in', time: '10:00', completed: true },
          { id: 'o28-2', title: 'Team retro draft', time: '14:30', completed: false },
          { id: 'o28-3', title: 'Gym session', time: '19:00', completed: true },
        ],
      },
    },
    goals: { hasData: true, props: { goals: novemberGoals.map((goal) => ({ ...goal, progress: goal.progress - 6 })) } },
    habits: { hasData: true, props: { habits: novemberHabits.map((habit) => ({ ...habit, streak: habit.streak - 2 })) } },
    'weekly-review': { hasData: true, props: { stats: { tasksCompleted: 24, totalTasks: 36, focusHours: 22, streak: 4 } } },
    'focus-sessions': {
      hasData: true,
      props: {
        sessions: [
          { id: 'fs-o28-1', task: 'Quarterly recap', duration: 40, completed: true },
          { id: 'fs-o28-2', task: 'Metrics deep dive', duration: 35, completed: true },
          { id: 'fs-o28-3', task: 'Inbox processing', duration: 20, completed: false },
        ],
        summary: { completed: 2, totalMinutes: 95, nextSessionMinutes: 20 },
      },
    },
    transactions: {
      hasData: true,
      props: {
        transactions: [
          { id: 'tr-o28-1', type: 'income', amount: 9800, currency: 'USD', category: 'Consulting', date: '08:10' },
          { id: 'tr-o28-2', type: 'expense', amount: 38, currency: 'USD', category: 'Breakfast', date: '09:35' },
          { id: 'tr-o28-3', type: 'expense', amount: 52, currency: 'USD', category: 'Taxi', date: '17:50' },
        ],
      },
    },
    'productivity-insights': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Focus score', value: '84', suffix: '/100' },
          { label: 'Tasks completed', value: '14', suffix: '/17' },
          { label: 'Deep work hrs', value: '6.1', suffix: 'h' },
        ],
        trend: [
          { label: 'Mon', value: 68 },
          { label: 'Tue', value: 73 },
          { label: 'Wed', value: 79 },
          { label: 'Thu', value: 82 },
          { label: 'Fri', value: 86 },
        ],
        trendDelta: 7,
      },
    },
    'spending-summary': {
      hasData: true,
      props: {
        categories: [
          { label: 'Transport', amount: 52 },
          { label: 'Meals', amount: 38 },
          { label: 'Office', amount: 24 },
        ],
        total: 114,
      },
    },
    'budget-progress': {
      hasData: true,
      props: {
        budgets: [
          { label: 'Travel', used: 820, total: 1200 },
          { label: 'Team', used: 520, total: 700 },
          { label: 'Learning', used: 220, total: 300 },
        ],
      },
    },
    'cash-flow': {
      hasData: true,
      props: {
        days: [
          { label: 'Mon', income: 380, expense: 240 },
          { label: 'Tue', income: 420, expense: 250 },
          { label: 'Wed', income: 470, expense: 270 },
          { label: 'Thu', income: 510, expense: 290 },
          { label: 'Fri', income: 540, expense: 310 },
        ],
      },
    },
    'wellness-overview': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Energy', value: 80 },
          { label: 'Mood', value: 82 },
          { label: 'Sleep quality', value: 74 },
        ],
        statusMessage: 'Solid energy — keep up with hydration between meetings.',
      },
    },
  },
};

const oct24Snapshot: DailySnapshot = {
  progress: { tasks: 21, budget: 40, focus: 68 },
  widgets: {
    'daily-tasks': {
      hasData: true,
      props: {
        initialTasks: [
          { id: 'o24-1', title: 'Podcast recording', time: '10:30', completed: true },
          { id: 'o24-2', title: 'Design critique', time: '13:00', completed: false },
        ],
      },
    },
    goals: { hasData: false },
    habits: { hasData: true, props: { habits: novemberHabits.map((habit) => ({ ...habit, completed: habit.id === 'h2' })) } },
    'weekly-review': { hasData: false },
    'focus-sessions': { hasData: false },
    transactions: {
      hasData: true,
      props: {
        transactions: [
          { id: 'tr-o24-1', type: 'expense', amount: 18, currency: 'USD', category: 'Breakfast', date: '08:55' },
          { id: 'tr-o24-2', type: 'expense', amount: 20, currency: 'USD', category: 'Music', date: '19:00' },
        ],
      },
    },
    'productivity-insights': { hasData: false },
    'spending-summary': {
      hasData: true,
      props: {
        categories: [
          { label: 'Cafes', amount: 18 },
          { label: 'Entertainment', amount: 20 },
        ],
        total: 38,
      },
    },
    'budget-progress': { hasData: false },
    'cash-flow': { hasData: false },
    'wellness-overview': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Energy', value: 72 },
          { label: 'Mood', value: 70 },
          { label: 'Sleep quality', value: 68 },
        ],
        statusMessage: 'Energy a bit lower — consider a lighter evening schedule.',
      },
    },
  },
};

const oct21Snapshot: DailySnapshot = {
  progress: { tasks: 61, budget: 46, focus: 57 },
  widgets: {
    'daily-tasks': {
      hasData: true,
      props: {
        initialTasks: [
          { id: 'o21-1', title: 'Strategy off-site planning', time: '09:30', completed: true },
          { id: 'o21-2', title: 'Marketing review', time: '14:00', completed: false },
          { id: 'o21-3', title: 'Run club', time: '19:30', completed: true },
        ],
      },
    },
    goals: { hasData: true, props: { goals: novemberGoals.map((goal) => ({ ...goal, progress: goal.progress - 12 })) } },
    habits: { hasData: true, props: { habits: novemberHabits.map((habit) => ({ ...habit, completed: habit.id !== 'h2' })) } },
    'weekly-review': { hasData: true, props: { stats: { tasksCompleted: 20, totalTasks: 33, focusHours: 20, streak: 3 } } },
    'focus-sessions': {
      hasData: true,
      props: {
        sessions: [
          { id: 'fs-o21-1', task: 'Q&A prep', duration: 30, completed: true },
          { id: 'fs-o21-2', task: 'OKR alignment', duration: 40, completed: true },
        ],
        summary: { completed: 2, totalMinutes: 70, nextSessionMinutes: null },
      },
    },
    transactions: {
      hasData: true,
      props: {
        transactions: [
          { id: 'tr-o21-1', type: 'income', amount: 1500, currency: 'USD', category: 'Workshop', date: '08:10' },
          { id: 'tr-o21-2', type: 'expense', amount: 65, currency: 'USD', category: 'Fitness', date: '20:00' },
        ],
      },
    },
    'productivity-insights': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Focus score', value: '79', suffix: '/100' },
          { label: 'Tasks completed', value: '11', suffix: '/15' },
          { label: 'Deep work hrs', value: '5.0', suffix: 'h' },
        ],
        trend: [
          { label: 'Mon', value: 62 },
          { label: 'Tue', value: 68 },
          { label: 'Wed', value: 73 },
          { label: 'Thu', value: 77 },
          { label: 'Fri', value: 80 },
        ],
        trendDelta: 5,
      },
    },
    'spending-summary': {
      hasData: true,
      props: {
        categories: [
          { label: 'Fitness', amount: 65 },
          { label: 'Cafes', amount: 15 },
        ],
        total: 80,
      },
    },
    'budget-progress': {
      hasData: true,
      props: {
        budgets: [
          { label: 'Travel', used: 600, total: 1200 },
          { label: 'Team', used: 340, total: 700 },
          { label: 'Learning', used: 140, total: 300 },
        ],
      },
    },
    'cash-flow': {
      hasData: true,
      props: {
        days: [
          { label: 'Mon', income: 280, expense: 190 },
          { label: 'Tue', income: 300, expense: 210 },
          { label: 'Wed', income: 330, expense: 220 },
          { label: 'Thu', income: 360, expense: 240 },
          { label: 'Fri', income: 380, expense: 250 },
        ],
      },
    },
    'wellness-overview': {
      hasData: true,
      props: {
        metrics: [
          { label: 'Energy', value: 75 },
          { label: 'Mood', value: 76 },
          { label: 'Sleep quality', value: 72 },
        ],
        statusMessage: 'Good consistency. Keep mixing cardio and rest days.',
      },
    },
  },
};

export const HOME_DASHBOARD_DATA: Record<string, DailySnapshot> = {
  '2025-10-21': oct21Snapshot,
  '2025-10-24': oct24Snapshot,
  '2025-10-28': oct28Snapshot,
  '2025-11-01': nov1Snapshot,
  '2025-11-03': nov3Snapshot,
  '2025-11-04': nov4Snapshot,
  '2025-11-05': nov5Snapshot,
};

export const getSnapshotForDate = (input?: Date | string | null): DailySnapshot | undefined => {
  if (!input) {
    return undefined;
  }

  const dateKey = input instanceof Date
    ? toISODateKey(input)
    : String(input).split('T')[0]!;

  return HOME_DASHBOARD_DATA[dateKey];
};
