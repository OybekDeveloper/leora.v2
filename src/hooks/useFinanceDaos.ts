import { useMemo } from 'react';
import { useRealm } from '@/utils/RealmContext';
import { AccountDAO, BudgetDAO, CounterpartyDAO, DebtDAO, FxRateDAO, TransactionDAO } from '@/database/dao/FinanceDAO';

export const useFinanceDaos = () => {
  const realm = useRealm();

  return useMemo(
    () => ({
      accounts: new AccountDAO(realm),
      transactions: new TransactionDAO(realm),
      budgets: new BudgetDAO(realm),
      debts: new DebtDAO(realm),
      fxRates: new FxRateDAO(realm),
      counterparties: new CounterpartyDAO(realm),
    }),
    [realm],
  );
};
