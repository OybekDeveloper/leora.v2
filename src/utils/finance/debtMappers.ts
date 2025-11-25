import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { Debt as DomainDebt } from '@/domain/finance/types';
import type { Debt as LegacyDebt } from '@/types/store.types';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';

export const mapDomainDebtToLegacy = (debt: DomainDebt): LegacyDebt => {
  const currency = normalizeFinanceCurrency(debt.principalCurrency as FinanceCurrency);
  const type: LegacyDebt['type'] = debt.direction === 'they_owe_me' ? 'lent' : 'borrowed';
  const status: LegacyDebt['status'] =
    debt.status === 'paid' ? 'settled' : debt.status === 'overdue' ? 'overdue' : 'active';

  return {
    id: debt.id,
    person: debt.counterpartyName,
    amount: debt.principalOriginalAmount ?? debt.principalAmount,
    remainingAmount: debt.principalAmount,
    type,
    currency,
    date: new Date(debt.startDate),
    expectedReturnDate: debt.dueDate ? new Date(debt.dueDate) : undefined,
    reminderEnabled: debt.reminderEnabled,
    reminderTime: debt.reminderTime,
    note: debt.description,
    status,
    createdAt: new Date(debt.createdAt),
    accountId: debt.fundingAccountId ?? '',
    transactionId: debt.fundingTransactionId,
  } satisfies LegacyDebt;
};
