import { useEffect } from 'react';
import type Realm from 'realm';
import { useRealm } from '@/utils/RealmContext';
import { useFinanceDaos } from './useFinanceDaos';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { setFinanceDaoRegistry } from '@/database/dao/financeDaoRegistry';

const mapBudgetEntryRecord = (record: Realm.Object) => ({
  id: (record as any)._id.toHexString(),
  budgetId: (record as any).budgetId.toHexString(),
  transactionId: (record as any).transactionId.toHexString(),
  appliedAmountBudgetCurrency: (record as any).appliedAmountBudgetCurrency,
  rateUsedTxnToBudget: (record as any).rateUsedTxnToBudget,
  snapshottedAt: ((record as any).snapshottedAt as Date).toISOString(),
});

export const useFinanceRealmSync = () => {
  const realm = useRealm();
  const daos = useFinanceDaos();
  const hydrate = useFinanceDomainStore((state) => state.hydrateFromRealm);

  useEffect(() => {
    if (!realm || realm.isClosed) {
      return;
    }

    setFinanceDaoRegistry(daos);

    const emitSnapshot = () => {
      if (!realm || realm.isClosed) {
        hydrate({
          accounts: [],
          transactions: [],
          budgets: [],
          debts: [],
          fxRates: [],
          budgetEntries: [],
          debtPayments: [],
          counterparties: [],
        });
        return;
      }
      const accounts = daos.accounts.list();
      const transactions = daos.transactions.list();
      const budgets = daos.budgets.list();
      const debts = daos.debts.list();
      const fxRates = daos.fxRates.list();
      const counterparties = daos.counterparties.list();
      const budgetEntries = realm.objects('BudgetEntry').map(mapBudgetEntryRecord);
      const debtPayments = debts.flatMap((debt) => daos.debts.listPayments(debt.id));

      hydrate({
        accounts,
        transactions,
        budgets,
        debts,
        fxRates,
        budgetEntries,
        debtPayments,
        counterparties,
      });
      useFinancePreferencesStore.getState().hydrateFxRates();
    };

    emitSnapshot();

    const collections = realm.isClosed
      ? []
      : [
          realm.objects('Account'),
          realm.objects('Transaction'),
          realm.objects('Budget'),
          realm.objects('BudgetEntry'),
          realm.objects('Debt'),
          realm.objects('FxRate'),
          realm.objects('Counterparty'),
        ];

    collections.forEach((collection) => collection.addListener(emitSnapshot));

    return () => {
      collections.forEach((collection) => collection.removeListener(emitSnapshot));
      setFinanceDaoRegistry(null);
    };
  }, [realm, daos, hydrate]);
};
