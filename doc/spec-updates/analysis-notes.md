# Что уже известно по анализу репозитория

1. **AiGateway отсутствует (в работе).** Хук `src/hooks/useInsightsData.ts` теперь запрашивает дневные инсайты через `src/services/ai/insightsService.ts` и отображает их из `useInsightsStore`, но ещё требуется полный контроль квот/кеша/логов и запуск `AiAction` через шину событий.
2. **Голосовой ассистент ограничен.** Модал `app/(modals)/voice-new.tsx` использует простой RegExp‑парсер (`executePlannerVoiceIntent`) и не поддерживает финансовые/навигационные команды, нет STT→GPT канала.
3. **Нет шины событий и саг.** Planner и Finance живут в отдельных Zustand‑сторах, сценарии из §7/§11 (goal↔budget, debt↔task, habit auto-check) не выполняются.
4. **Доменные модели Finance/Planner упрощены.** `useFinanceStore` работает на моках (нет полей `baseCurrency`, `rateUsedToBase`, `BudgetEntry`, `DebtPayment`, связей), Planner использует статические шаблоны. Доменные сторы (`useFinanceDomainStore`, `usePlannerDomainStore`) созданы, Goals/Habits читают данные из нового Planner стора, но UI и Realm ещё нужно полностью мигрировать.
5. **HOME и агрегаты**: Домашний экран читает статические снапшоты (`src/data/homeDashboardData.ts`), Planner/Goals/Habits заполнены шаблонами, а не пользовательскими данными.
6. **NET/FX/региональные настройки не завязаны на приложение.** `useFinancePreferencesStore` хранит только валюты и курс, нет провайдеров и ручных override по спецификации.
7. **Офлайн-первый подход не реализован.** Все данные persist'ятся через AsyncStorage, отсутствуют миграции/идемпотентные ключи, нет матрицы офлайн/онлайн.

Эти выводы нужно учесть при дальнейшем обновлении спецификации и планировании задач. Приоритет — восстановление доменной модели Finance (см. `doc/spec-updates/finance_domain_plan.md`) и Planner (`doc/spec-updates/planner_domain_plan.md`), а затем интеграция с Home/AiGateway.

## Текущий порядок работы
1. Обновления выполняем последовательно (AiGateway/инсайты → Planner/Finance → платформа/FX), фиксируя результат после каждого шага.
2. После каждой завершённой подзадачи обновляем соответствующие файлы в `doc/spec-updates`.
