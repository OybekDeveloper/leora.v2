# Задачи: Planner ↔ Finance (LEORA Spec v1.2)

## 1. Planner (цели/привычки/задачи/фокус) (§5)
1. **Данные и модели**
   - [x] Описать доменные типы и стор `usePlannerDomainStore` (`Goal`, `Habit`, `Task`, `FocusSession`) с полями из §5.1.
   - [x] Удалить legacy `usePlannerTasksStore` и питать UI/модалки Planner напрямую из `usePlannerDomainStore` (добавлены дефолтные задачи и мапперы домен → view-model).
   - [ ] Перенести хранение в Realm/SQLite и синхронизировать UI (уйти от статических шаблонов/старых стор); часть UI (Goals/Habits) уже читает данные из доменного стора.
2. **CRUD и логика (§5.2)**
   - Реализовать команды: `createGoal/update/complete/archive`, `createHabit/update/log/pause/archive`, `createTask/update/complete/cancel/schedule`, `startFocus/pause/resume/finish/cancel`.
   - Прогресс целей = взвешенная сумма финансов/привычек/задач; хранить `stats.financialProgressPercent`, `habitsProgressPercent`, `tasksProgressPercent`, `focusMinutesLast30`.
     - [x] Добавлен пересчет `tasksProgressPercent`/`habitsProgressPercent`/`focusMinutesLast30` + агрегированный `progressPercent` внутри `usePlannerDomainStore`.
     - [x] В `usePlannerDomainStore` добавлены команды `completeGoal/archiveGoal/pauseGoal/resumeGoal`, `pauseHabit/resumeHabit/archiveHabit`, `completeTask/cancelTask/scheduleTask`, а также `startFocus/pauseFocus/resumeFocus/finishFocus/cancelFocus`.
     - [x] Экран Tasks и фокус-бридж теперь работают на `usePlannerDomainStore`, история задач восстанавливается из доменного стора (legacy `usePlannerTasksStore` не используется в UI).
   - Автооценка привычек по правилу `financeRule` (no_spend_in_categories, spend_in_categories, has_any_transactions, пороги) на основе событий Finance.

## 2. Finance (счета/транзакции/бюджеты/долги/курсы) (§6)
1. **Данные и хранилище**
   - [x] Описать доменные типы (`src/domain/finance/types.ts`) и создать базовый стор `src/stores/useFinanceDomainStore.ts` с CRUD для `Account/Transaction/Budget/Debt/FxRate`.
   - [ ] Ввести модели Realm/SQLite и DAO (`AccountRepository`, `TransactionRepository`, `BudgetRepository`, `DebtRepository`, `FxRepository`), синхронизировать сторы с БД.
   - [ ] Перенести UI на новый доменный слой (отказаться от моковых списков `useFinanceStore`).
     - [x] Модалки доходов/расходов и переводов используют `useFinanceDomainStore`, транзакции корректно пересчитывают счета и бюджеты.
     - [x] Долговая модалка, поиск и статистика теперь работают только с `useFinanceDomainStore` (данные поступают из доменного слоя).
     - [x] Убраны остаточные обращения к `useFinanceStore` (инсайты/долги), весь UI читает данные из доменных стораджей.
     - [x] Добавлены агрегаторы `getOutstandingDebts` и `getBudgetSnapshots` для построения обзоров (§6.3).
2. **Инварианты и логика**
   - Фиксировать курс на дату операции (поля `rateUsedToBase`, `convertedAmountToBase`, `effectiveRateFromTo`), не пересчитывать задним числом (§6.2).
   - `BudgetEntry` создаётся при каждой транзакции в валюте бюджета; кнопка «пересчитать период» — отдельная команда.
   - Долги поддерживают разные валюты платежей (`DebtPayment.rateUsedToDebt/ToBase`), статусы `active/paid/overdue/canceled`, ссылки на цели/бюджеты.
   - Ручные курсы (`source='manual'`) приоритетнее провайдеров, хранить историю `FxRate`.
3. **API и публичные методы**
   - Экспортировать команды/сервисы:
     - `AccountService`: `create/archive/list`, `linkGoal`, `applyBalanceChange`.
     - `TransactionService`: `create/update/delete/list`, `attachSplits`, `applyBudgetLinks`, `emitEvents`.
     - `BudgetService`: `create/update/archive/recalc`, `applyTransaction`, `notifyExceeded`.
     - `DebtService`: `createDebt/addDebtPayment/update/list`, `recalculateStatus`, `emitTaskEvents`.
     - `FxService`: `getRate(date, from, to)`, `overrideRate`, `syncProvider`.
   - Методы агрегатов: `getFinanceSummaryDaily`, `getFinanceSummaryMonthly`, `getOutstandingDebts`, `getBudgetSnapshots`.

## 3. Интеграция Planner ↔ Finance (§7)
- Реализовать события `planner.goal.*`, `planner.habit.*`, `planner.task.*`, `planner.focus.*`, `finance.account.*`, `finance.tx.*`, `finance.budget.*`, `finance.debt.*`, `finance.fx.rates_updated`, `insights.*`.
- Настроить саги `FinancialGoalSaga`, `DebtSaga`, `HabitFinanceRuleSaga`, `BudgetReviewSaga`, `RecordExpensesSaga` с идемпотентными ключами (`pay_debt|debtId`, `goalId|currency|limit`, ...).
- Матрица реакций (§7.1):
  - `planner.goal.created` → `finance.budget.create` → `planner.goal.link_budget`.
  - `finance.budget.spending_changed` → обновление `goal.stats.financialProgressPercent`.
  - `finance.debt.created` → `task(pay_debt)`; `finance.debt.payment_added` → обновление/закрытие задачи и прогресс цели `debt_close`.
  - `finance.tx.created` → автооценка `habit.financeRule` → `habit.day_evaluated`.
  - `finance.budget.updated` → автозакрытие `review_budget` в течение 24 часов.
  - [x] `useInsightsData` теперь читает агрегаты из `useFinanceDomainStore` и `usePlannerDomainStore`, убраны зависимости от мок‑сторанов (`useFinanceStore`, `useTaskStore`).
  - [x] Перенесены ключевые вкладки Finance на доменный слой: обзор (`/finance/index`), аналитика (`/finance/analytics`), счета (`/finance/accounts`), бюджеты (`/finance/budgets`), транзакции (`/finance/transactions`) и долги (`/finance/debts`) используют `useFinanceDomainStore` и мапперы «домен → view‑model`.

## 4. Realm/SQLite и офлайн-поддержка (§1–2, §13, §16)
- Хранить все доменные сущности в локальной БД с миграциями и состоянием синхронизации (`syncStatus`, `idempotencyKey`).
- Обеспечить офлайн-первый подход: CRUD и расчёты Planner/Finance локально, работа с сетевыми сервисами только для курсов и GPT.
- Вести логи ошибок, retry/идемпотентность команд, матрицу офлайн/онлайн возможностей (§13), обработку краевых случаев (§16).
