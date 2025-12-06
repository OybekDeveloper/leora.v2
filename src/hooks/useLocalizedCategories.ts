import { useMemo } from 'react';
import { useLocalization } from '@/localization/useLocalization';
import { FINANCE_CATEGORIES, type FinanceCategory } from '@/constants/financeCategories';

type CategoryKey =
  | 'salary'
  | 'business'
  | 'investment'
  | 'gift'
  | 'foodDining'
  | 'transportation'
  | 'shopping'
  | 'entertainment'
  | 'billsUtilities'
  | 'healthcare'
  | 'education'
  | 'charity'
  | 'debtRepayment'
  | 'transfer'
  | 'savings'
  | 'other';

// Map from English category name to localization key
const CATEGORY_NAME_TO_KEY: Record<string, CategoryKey> = {
  'Salary': 'salary',
  'Business': 'business',
  'Investment': 'investment',
  'Gift': 'gift',
  'Food & Dining': 'foodDining',
  'Transportation': 'transportation',
  'Shopping': 'shopping',
  'Entertainment': 'entertainment',
  'Bills & Utilities': 'billsUtilities',
  'Healthcare': 'healthcare',
  'Education': 'education',
  'Charity': 'charity',
  'Debt Repayment': 'debtRepayment',
  'Transfer': 'transfer',
  'Savings': 'savings',
  'Other': 'other',
};

export type LocalizedFinanceCategory = FinanceCategory & {
  localizedName: string;
};

export function useLocalizedCategories() {
  const { strings } = useLocalization();
  const categoryStrings = (strings as any).financeScreens?.categories ?? {};

  const localizedCategories = useMemo((): LocalizedFinanceCategory[] => {
    return FINANCE_CATEGORIES.map((category) => {
      const key = CATEGORY_NAME_TO_KEY[category.name];
      const localizedName = key ? (categoryStrings[key] ?? category.name) : category.name;
      return {
        ...category,
        localizedName,
      };
    });
  }, [categoryStrings]);

  const getLocalizedCategoryName = useMemo(() => {
    return (englishName: string): string => {
      const key = CATEGORY_NAME_TO_KEY[englishName];
      if (key && categoryStrings[key]) {
        return categoryStrings[key];
      }
      return englishName;
    };
  }, [categoryStrings]);

  const getCategoriesForType = useMemo(() => {
    return (type: 'income' | 'outcome'): LocalizedFinanceCategory[] => {
      return localizedCategories.filter(
        (category) => category.type === type || category.type === 'both'
      );
    };
  }, [localizedCategories]);

  return {
    localizedCategories,
    getLocalizedCategoryName,
    getCategoriesForType,
  };
}
