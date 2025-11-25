import type { AccountDAO, BudgetDAO, CounterpartyDAO, DebtDAO, FxRateDAO, TransactionDAO } from './FinanceDAO';

export type FinanceDaoRegistry = {
  accounts: AccountDAO;
  transactions: TransactionDAO;
  budgets: BudgetDAO;
  debts: DebtDAO;
  fxRates: FxRateDAO;
  counterparties: CounterpartyDAO;
};

let registry: FinanceDaoRegistry | null = null;

export const setFinanceDaoRegistry = (value: FinanceDaoRegistry | null) => {
  registry = value;
};

export const getFinanceDaoRegistry = () => {
  if (!registry) {
    throw new Error('[FinanceDAO] Registry not initialized');
  }
  return registry;
};

export const hasFinanceDaoRegistry = () => registry !== null;
