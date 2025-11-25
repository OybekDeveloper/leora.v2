# План восстановления доменной модели Finance/Planner

## 1. Текущая ситуация
- `useFinanceStore` и связанные экраны работают на демо-данных: транзакции, счета, бюджеты и долги хранятся в Zustand/AsyncStorage без полей Spec v1.2.
- Нет привязки к курсам валют (поля `baseCurrency`, `rateUsedToBase`, `convertedAmountToBase`), нет `TransactionSplit`, `BudgetEntry`, `DebtPayment`, ручных курсов и связей с целями/привычками.
- Planner использует статические шаблоны, не реагирует на финсобытия; нет саг и шины (§7/§11).

## 2. Минимальный набор для оживления Finance
1. **Слой данных (Realm/SQLite)**
   - Реализовать модели Realm: `Account`, `Transaction`, `TransactionSplit`, `Budget`, `BudgetEntry`, `Debt`, `DebtPayment`, `FxRate` (см. §6.1).
   - Настроить `RealmContext` и сервисы доступа (`AccountRepository`, `TransactionRepository`, `BudgetRepository`, `DebtRepository`, `FxRepository`).
   - Синхронизировать Zustand-сторы с Realm (или перейти на React Query + Realm subscriptions).
2. **Типы и API**
   - Обновить TS-типы и DTO (`src/types/finance.ts`) с полной схемой.
   - Создать сервисы/команды: `createAccount/archive`, `createTransaction/update/delete`, `createBudget/update/archive/recalc`, `createDebt/addDebtPayment/update`, `getRate/overrideRate`, `getFinanceSummaryDaily/Monthly`.
3. **Логика/инварианты**
   - Фиксировать курс при создании транзакций, хранить `rateUsedToBase`, `convertedAmountToBase`, `effectiveRateFromTo`.
   - При каждой транзакции создавать `BudgetEntry` в валюте бюджета.
   - Долги: платежи в иных валютах, пересчёт остатка в валюте долга, статусы `active/paid/overdue`, ссылка на задачи/цели.
   - Ручные курсы (`source='manual'`) приоритетнее провайдеров, история `FxRate`.
4. **Связь с UI**
   - Экран транзакций/бюджетов/долгов переключить на новые сервисы.
   - Добавить формы создания/редактирования с реальными полями (валюта, курс, linkedGoalId, attachments).

## 3. Интеграция Planner ↔ Finance
1. **События и шина**
   - Ввести Event Bus (локальный pub/sub + персистентный лог) с конвертами `eventId/commandId`, `correlationId`, `idempotencyKey`.
   - Из Finance публиковать события `finance.account.created`, `finance.tx.created/updated/deleted`, `finance.budget.spending_changed`, `finance.debt.created/payment_added`, `finance.fx.rates_updated`.
2. **Саги (§7)**
   - `FinancialGoalSaga`: `planner.goal.created` → `finance.budget.create` → `planner.goal.link_budget`.
   - `DebtSaga`: долговые события → создание/закрытие задач `pay_debt`, обновление прогресса целей `debt_close`.
   - `HabitFinanceRuleSaga`: `finance.tx.created` → проверка `habit.financeRule` → `habit.day_evaluated`.
   - `BudgetReviewSaga`: `finance.budget.updated` → автозадача `review_budget` (окно 24ч).
3. **Planner**
   - Импортировать реальные задачи/привычки/цели в Realm, добавить поля `financeLink`, `stats.financialProgressPercent`, `habitsProgressPercent`, `tasksProgressPercent`.
  - Обновить UI и сторы (полный переход на `usePlannerDomainStore`, `useInsightsData`) для работы с настоящими данными.

## 4. HOME и отчёты
- Пересобрать `useHomeDashboard` на базе агрегатов `getFinanceSummaryDaily/Monthly`, `getPlannerSummary`, `useInsightsStore`.
- Добавить индикатор онлайн/офлайн, быстрые действия, привязку к шине событий.

## 5. Порядок реализации
1. **Шаг 1**: Реализовать модели/DAO в Realm + сервисы Finance (счета, транзакции, бюджеты, долги, курсы).
2. **Шаг 2**: Перевести UI Finance на новые сервисы, добавить формы создания.
3. **Шаг 3**: Ввести Event Bus и финансы → Planner события, реализовать саги.
4. **Шаг 4**: Мигрировать Planner и HOME на реальные данные.
5. **Шаг 5**: Покрыть интеграции тестами, добавить миграции и feature flags (§17–18).
