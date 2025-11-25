// src/config/widgetConfig.tsx
import React from 'react';
import {
  Activity,
  BarChart3,
  BarChart4,
  CheckSquare,
  CreditCard,
  DollarSign,
  TrendingUp,
  PieChart,
  Target,
  Timer,
} from 'lucide-react-native';

import DailyTasksWidget from '@/components/widget/DailyTasksWidget';
import GoalsWidget from '@/components/widget/GoalsWidget';
import HabitsWidget from '@/components/widget/HabitsWidget';
import WeeklyReviewWidget from '@/components/widget/WeeklyReviewWidget';
import FocusSessionsWidget from '@/components/widget/FocusSessionsWidget';
import TransactionsWidget from '@/components/widget/TransactionsWidget';
import SpendingSummaryWidget from '@/components/widget/SpendingSummaryWidget';
import BudgetProgressWidget from '@/components/widget/BudgetProgressWidget';
import CashFlowWidget from '@/components/widget/CashFlowWidget';
import ProductivityInsightsWidget from '@/components/widget/ProductivityInsightsWidget';
import WellnessOverviewWidget from '@/components/widget/WellnessOverviewWidget';

export type WidgetType = 
  | 'daily-tasks' 
  | 'goals' 
  | 'habits' 
  | 'weekly-review'
  | 'focus-sessions'
  | 'transactions'
  | 'spending-summary'
  | 'budget-progress'
  | 'cash-flow'
  | 'productivity-insights'
  | 'wellness-overview';

type WidgetIcon = React.ComponentType<{ size?: number; color?: string }>;

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  icon: WidgetIcon;
  description: string;
  component: React.ComponentType<any>;
  category: 'planner' | 'finance' | 'ai' | 'health' | 'insights';
  defaultProps?: any;
}

export const AVAILABLE_WIDGETS: Record<WidgetType, WidgetConfig> = {
  'daily-tasks': {
    id: 'daily-tasks',
    title: 'Daily Tasks',
    icon: CheckSquare,
    description: "Today's task list",
    component: DailyTasksWidget,
    category: 'planner',
  },
  'goals': {
    id: 'goals',
    title: 'Goals',
    icon: Target,
    description: 'Track your goals',
    component: GoalsWidget,
    category: 'planner',
  },
  'habits': {
    id: 'habits',
    title: 'Habits',
    icon: Activity,
    description: 'Daily habits tracker',
    component: HabitsWidget,
    category: 'planner',
  },
  'weekly-review': {
    id: 'weekly-review',
    title: 'Weekly Review',
    icon: BarChart3,
    description: 'Week progress overview',
    component: WeeklyReviewWidget,
    category: 'planner',
  },
  'focus-sessions': {
    id: 'focus-sessions',
    title: 'Focus Sessions',
    icon: Timer,
    description: 'Pomodoro timer & tracking',
    component: FocusSessionsWidget,
    category: 'planner',
  },
  'transactions': {
    id: 'transactions',
    title: 'Transactions',
    icon: CreditCard,
    description: 'Recent financial activity',
    component: TransactionsWidget,
    category: 'finance',
  },
  'spending-summary': {
    id: 'spending-summary',
    title: 'Spending Summary',
    icon: PieChart,
    description: 'Top categories this month',
    component: SpendingSummaryWidget,
    category: 'finance',
  },
  'budget-progress': {
    id: 'budget-progress',
    title: 'Budget Progress',
    icon: BarChart4,
    description: 'Actual vs planned spending',
    component: BudgetProgressWidget,
    category: 'finance',
  },
  'cash-flow': {
    id: 'cash-flow',
    title: 'Cash Flow',
    icon: DollarSign,
    description: 'Weekly income vs expenses',
    component: CashFlowWidget,
    category: 'finance',
  },
  'productivity-insights': {
    id: 'productivity-insights',
    title: 'Productivity Insights',
    icon: TrendingUp,
    description: 'Focus trend & completion',
    component: ProductivityInsightsWidget,
    category: 'insights',
  },
  'wellness-overview': {
    id: 'wellness-overview',
    title: 'Wellness Overview',
    icon: Activity,
    description: 'Energy & mood snapshot',
    component: WellnessOverviewWidget,
    category: 'insights',
  },
};
