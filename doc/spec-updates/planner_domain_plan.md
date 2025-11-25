# План восстановления Planner (цели/привычки/задачи/фокус)

## 1. Текущее состояние
- Демо-задачи больше не живут в `usePlannerTasksStore` (legacy стор удалён); `usePlannerDomainStore` временно хранит моковые задачи/цели/привычки без реального CRUD/Realm и связей с Finance.
- Нет моделей Realm/SQLite, нет связей Planner ↔ Finance, прогресс целей/привычек не считается по фактическим данным.
- Фокус-сессии (`useFocusStore`) изолированы и не связаны с задачами/инсайтами.

## 2. Цель (спецификация §5)
1. **Модели**
   - `Goal { id, userId, goalType, status, metricType, unit, initialValue, targetValue, financeMode, currency, linkedBudgetId, startDate, targetDate, completedDate, progressPercent, stats, milestones, createdAt, updatedAt }`
   - `Habit { id, userId, title, habitType, status, goalId?, frequency, daysOfWeek?, timesPerWeek?, timeOfDay?, completionMode, targetPerDay?, unit?, financeRule?, streakCurrent, streakBest, completionRate30d, createdAt, updatedAt }`
   - `Task { id, userId, title, status, priority, goalId?, habitId?, financeLink?, dueDate?, startDate?, timeOfDay?, estimatedMinutes?, energyLevel?, checklist[], dependencies[], lastFocusSessionId?, focusTotalMinutes?, createdAt, updatedAt }`
   - `FocusSession { id, userId, taskId?, goalId?, plannedMinutes, actualMinutes, status, startedAt, endedAt?, interruptionsCount?, notes?, createdAt, updatedAt }`
2. **CRUD-операции**
   - `createGoal/update/complete/archive`, `createHabit/update/log/pause/archive`, `createTask/update/complete/cancel/schedule`, `startFocus/pause/resume/finish/cancel`.
   - Хранить историю (completed/moved/overdue), restore/delete, повторения и быстрые задачи.
3. **Прогресс и автооценка**
   - Прогресс цели = взвешенная сумма финансов/привычек/задач (см. §5.2). Хранить `stats.financialProgressPercent`, `habitsProgressPercent`, `tasksProgressPercent`, `focusMinutesLast30`.
   - Автооценка привычек по `financeRule` на основе событий Finance (`finance.tx.created`).
   - Финансовые задачи (`financeLink: record_expenses | pay_debt | review_budget | transfer_money`) закрываются при соответствующих событиях Finance.
4. **Интеграция с AiGateway/Voice**
   - `AiAction.create_task/create_habit/create_goal/start_focus` должны использовать новый доменный слой Planner.
   - Голосовые команды (`create task/habit/goal`, `start focus`) → команды Planner.

## 3. Шаги реализации
1. **Шаг A: доменные типы и хранилище**
   - [x] Создать `src/domain/planner/types.ts` и стор `usePlannerDomainStore` с CRUD по моделям §5.1.
  - [x] Мигрировать UI/сторы на доменные данные (legacy `usePlannerTasksStore` удалён, шаблоны goals/habits/модалки работают через `usePlannerDomainStore`).
2. **Шаг B: логика и события**
   - Реализовать методы/команды (create/update/complete/cancel), историю задач, чеклисты, зависимости, фокус-сессии.
   - Подключить события из Finance (`finance.tx.created`, `finance.budget.*`, `finance.debt.*`) для автообновления задач/привычек/целей.
3. **Шаг C: интеграция UI и AiGateway**
   - Обновить вкладки Planner/Habits/Goals для работы с доменными данными и состояниями (progress bars, streaks, linked tasks).
   - Integraция `AiGateway` и голосового ассистента с доменными командами Planner.
4. **Шаг D: тесты и миграции**
   - Написать unit/e2e-тесты (сквозные сценарии целей/привычек/задач/фокуса).
   - Добавить миграцию данных (из демо-хранилищ в Realm/Zustand), feature flags на включение нового Planner.
