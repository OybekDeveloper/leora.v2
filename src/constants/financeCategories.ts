import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  Bus,
  CalendarCheck,
  DollarSign,
  Film,
  GraduationCap,
  Heart,
  PiggyBank,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react-native';

import type { ThemeColors } from '@/constants/theme';

export type FinanceCategoryType = 'income' | 'outcome' | 'both';

type CategoryColorToken = keyof Pick<
  ThemeColors,
  'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'textSecondary'
>;

export interface FinanceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  type: FinanceCategoryType;
  colorToken: CategoryColorToken;
}

export const FINANCE_CATEGORIES: FinanceCategory[] = [
  {
    id: 'income-salary',
    name: 'Salary',
    icon: Briefcase,
    type: 'income',
    colorToken: 'success',
  },
  {
    id: 'income-business',
    name: 'Business',
    icon: DollarSign,
    type: 'income',
    colorToken: 'primary',
  },
  {
    id: 'income-investment',
    name: 'Investment',
    icon: ArrowUpCircle,
    type: 'income',
    colorToken: 'info',
  },
  {
    id: 'income-gift',
    name: 'Gift',
    icon: Sparkles,
    type: 'income',
    colorToken: 'secondary',
  },
  {
    id: 'outcome-food',
    name: 'Food & Dining',
    icon: UtensilsCrossed,
    type: 'outcome',
    colorToken: 'danger',
  },
  {
    id: 'outcome-transport',
    name: 'Transportation',
    icon: Bus,
    type: 'outcome',
    colorToken: 'info',
  },
  {
    id: 'outcome-shopping',
    name: 'Shopping',
    icon: ShoppingBag,
    type: 'outcome',
    colorToken: 'secondary',
  },
  {
    id: 'outcome-entertainment',
    name: 'Entertainment',
    icon: Film,
    type: 'outcome',
    colorToken: 'primary',
  },
  {
    id: 'outcome-bills',
    name: 'Bills & Utilities',
    icon: Wallet,
    type: 'outcome',
    colorToken: 'warning',
  },
  {
    id: 'outcome-health',
    name: 'Healthcare',
    icon: Activity,
    type: 'outcome',
    colorToken: 'success',
  },
  {
    id: 'outcome-education',
    name: 'Education',
    icon: GraduationCap,
    type: 'outcome',
    colorToken: 'info',
  },
  {
    id: 'outcome-charity',
    name: 'Charity',
    icon: Heart,
    type: 'outcome',
    colorToken: 'secondary',
  },
  {
    id: 'debt-repayment',
    name: 'Debt Repayment',
    icon: ArrowDownCircle,
    type: 'both',
    colorToken: 'danger',
  },
  {
    id: 'transfer',
    name: 'Transfer',
    icon: ArrowDownCircle,
    type: 'both',
    colorToken: 'textSecondary',
  },
  {
    id: 'savings',
    name: 'Savings',
    icon: PiggyBank,
    type: 'both',
    colorToken: 'primary',
  },
  {
    id: 'other',
    name: 'Other',
    icon: CalendarCheck,
    type: 'both',
    colorToken: 'textSecondary',
  },
];

export const getCategoriesForType = (type: 'income' | 'outcome') =>
  FINANCE_CATEGORIES.filter((category) => category.type === type || category.type === 'both');

export const findCategoryByName = (name: string) =>
  FINANCE_CATEGORIES.find((category) => category.name === name);
