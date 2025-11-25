# Budget & Goal Finance Logic Guide

This document summarizes how the Budget flow works across Finance and Planner, how amounts are stored, converted, and synced with Goals, and what to watch out for when adding new features.

Use this unified Budget & Goal Finance Logic Guide as the core specification for all Finance, Budget, Goal, Debt, Account, and Planner interactions. Every new feature, modal, transaction, or sync operation must follow this spec, because it guarantees:
- Consistent multi-currency handling (budget/base currency alignment and rate usage).
- Budget progress always rebuilds from transaction-derived entries.
- Account balances, budget usage, and goal progress stay in sync via shared transactions.
- Debt and planner integrations react to the same finance events without divergence.

## Core Entities
- **Budget** (`src/domain/finance/types.ts`): has `currency`, `limitAmount`, `spentAmount`, `remainingAmount`, `percentUsed`, `linkedGoalId`, `accountId`, `transactionType`.
- **BudgetEntry**: per-transaction application snapshot stored in Realm; used to recalc `spentAmount`/progress.
- **Transaction**: carries `budgetId`, `goalId`, `accountId`, `currency`, `baseCurrency`, `rateUsedToBase`, `convertedAmountToBase`, `relatedBudgetId`, `relatedDebtId`.

## Currency & Conversion Rules
- All conversions go through `useFinancePreferencesStore.convertAmount`.
- A transaction is applied to a budget if:
  - `transaction.type` is not `transfer`
  - `transaction.budgetId` matches, **and**
  - `budget.currency === transaction.currency` **or** `budget.currency === transaction.baseCurrency`
- `buildBudgetEntriesForTransaction` stores `appliedAmountBudgetCurrency = Math.abs(transaction.amount) * rate`, where `rate` is `1` if currencies match, otherwise `transaction.rateUsedToBase`.
- Progress recalculation (`recalcBudgetsFromEntries`) sums `appliedAmountBudgetCurrency` per budget, updating `spentAmount`, `remainingAmount`, `percentUsed`, `currentBalance`.

**Important:** When creating transactions for a budget, set:
- `budgetId` to the target budget
- `baseCurrency` to the budget currency (or ensure `baseCurrency` equals the budget currency)
- `rateUsedToBase` to the conversion from transaction currency → budget currency
This guarantees the transaction is picked up by `buildBudgetEntriesForTransaction`.

## Account Balance Updates
- `applyTransactionToAccounts` adjusts accounts:
  - `income`: increases `account.currentBalance`
  - `expense`: decreases `account.currentBalance`
  - `transfer`: moves between accounts
- For custom flows where the visual intent is “fund budget but reduce account”, you can post an `income` transaction and then adjust the account down after creation (as done in `budget-add-value`), or choose `expense` when the spend should reduce both account and budget.

## Goal ↔ Budget Sync
- **Linking:** `useGoalFinanceLink` ensures:
  - When a budget is created/linked from a goal, `goal.linkedBudgetId` is set and `goal.currency` is synced to the budget currency.
  - Linking an existing budget sets `goal.currency` to the budget’s currency.
- **Contributions from Finance to Goals:** `applyFinanceContributionToGoals` (in `useFinanceDomainStore`) runs on transaction create/update:
  - Finds goal IDs from `budgetId`/`relatedBudgetId`/`debt` links.
  - Converts transaction amount into goal currency.
  - Adds a goal check-in and increments `goal.currentValue` unless blocked by `__skipBudgetSync`.
- **Contributions from Goals to Finance:** Manual goal check-ins for monetary goals (`addGoalCheckIn`) route through `createGoalFinanceTransaction` to create a Finance transaction so budgets and accounts stay in sync.
- **Flow direction:** `createGoalFinanceTransaction` sets `type` via `resolveFlowDirection`:
  - `goal.financeMode === 'save'` → `income` (budget/goal increase; account normally increases, so adjust account if you want account to decrease)
  - Else defaults to `expense`.

## Budget Add Value Modal
- `app/(modals)/finance/budget-add-value.tsx`:
  - Lets user choose amount, type (`income`/`expense`), and account.
  - Creates a transaction with `budgetId`, `baseCurrency` = budget currency, and `rateUsedToBase` derived from account → budget currency to ensure a budget entry is recorded.
  - For `income`, it leaves the transaction as income (so budget increases) and manually adjusts the account balance downward if the UX expects “funding” to reduce the account.

## Progress Calculation
- `recalcBudgetsFromEntries`:
  - `spentAmount` = sum of applied entries.
  - `remainingAmount` = `limitAmount - spentAmount` (or `limitAmount + spentAmount` for income budgets).
  - `percentUsed` = `spentAmount / limitAmount` (clamped in UI when displayed).
- UI aggregates (budgets list) convert budget amounts to the global currency before rendering.

## Common Pitfalls
- Missing conversion alignment: if `budget.currency` ≠ `transaction.currency` and `transaction.baseCurrency` ≠ `budget.currency`, the budget will not update.
- Negative amounts: `BudgetEntry` uses `Math.abs(transaction.amount)`; ensure transactions that should increase budget are positive.
- Account selection: ensure a valid `accountId` is passed; otherwise account/balance won’t update.
- Goal currency drift: always sync goal currency to the budget when linking.

## Checklist for Adding Budget-Affecting Features
1. Set `budgetId` on the transaction.
2. Set `baseCurrency` = budget currency; set `rateUsedToBase` for account → budget currency.
3. Use positive `amount` for contributions that should increase budget progress.
4. Ensure `accountId` is set so balances update.
5. If linked to a goal, expect `applyFinanceContributionToGoals` to add goal progress automatically.
6. For “save” goals, prefer `income` type so budget progress increases; adjust account balance as needed for UX.

## Implementation Checklist (practical)

1) **Transaction creation**
- Always set `budgetId`, `baseCurrency = budget.currency`, `rateUsedToBase = convert(account.currency → budget.currency)`, `amount > 0`.
- Use `accountId` (required) so balances move.
- For “save” flows where account must go down but budget up, either:
  - Use `income` + manual account adjustment (as in `budget-add-value`), or
  - Use `expense` if you want both account down and “consumption” semantics.

2) **Budget entries & recalc**
- Ensure `buildBudgetEntriesForTransaction` is triggered (non-transfer, currency alignment).
- After mutations, `recalcBudgetsFromEntries` must run (already in domain store create/update/remove transaction).

3) **Goal sync**
- Link budget to goal: set `goal.linkedBudgetId`, `goal.currency = budget.currency`.
- Ensure `applyFinanceContributionToGoals` runs (wired in transaction create/update/remove).
- When adding goal progress manually, route through `createGoalFinanceTransaction` to keep Finance in sync.

4) **Debt sync**
- Include `relatedDebtId`/`debtId` on transactions for debt-linked budgets.
- Use existing debt payment flows to update debts and emit budget entries.

5) **Planner sync**
- Habits/Tasks auto-rules consume Finance events; keep `plannerEventBus` emits intact (`finance.tx.*`, `finance.budget.*`, `finance.debt.*`).

6) **UI flows**
- Budget list: convert `spent/limit` to global currency before display.
- Budget detail: progress uses `budgetEntries`-derived amounts.
- Add-value modal: pick account, type, amount; block invalid spends (optional guard per spec).

7) **Currency**
- Use `useFinancePreferencesStore.convertAmount` for all conversions.
- When in doubt, set `baseCurrency` to the target container (budget/debt) and store `rateUsedToBase`.

## Edge Cases & Guards
- Prevent negative/zero amounts for budget entries.
- Block spends that exceed spending budget limit (optional UX guard).
- For saving budgets, block withdrawals that exceed accumulated value (if withdrawal is enabled).
- Handle missing account gracefully (disable submit).
- Ensure transaction removal rolls back budget/goal/debt via existing domain store handlers.

## Testing Scenarios
- Add value to saving budget (income type): budget up, account down, goal up.
- Spend against spending budget (expense type): budget usage up, account down, goal up (if linked).
- Link/unlink goal to budget: currencies sync; goal currency matches budget.
- Transactions with different account currency: verify `rateUsedToBase` and budget entry creation.
- Delete/update transaction: budget and goal progress adjust accordingly.
- Debt-linked budget payment: debt principal and budget entries reflect the payment.

## Notes for Future Extensions
- If adding withdrawals from saving budgets, emit transactions with negative effect on budget entries (or dedicated type) and adjust account accordingly.
- For multi-currency UI, display both budget currency and global currency equivalents.
- Consider enforcing direction per budget type in UI (save budgets default to income; spend budgets default to expense) while still allowing corrections.
