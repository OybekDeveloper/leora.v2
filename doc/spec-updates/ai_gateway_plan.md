# План внедрения AiGateway (этап 1)

## 1. Текущее состояние
- **Инсайты**: хук `src/hooks/useInsightsData.ts` (стр. 1-360) рассчитывает карточки из локальных Zustand-сторов (`useFinanceStore`, `useTaskStore`), GPT не вызывается, структура ответа ограничена `InsightCardEntity`.
- **Вкладки Insights**: экраны `app/(tabs)/(insights)/(tabs)/*.tsx` и стор `src/stores/useInsightsExperienceStore.ts` работают только с локальными карточками и историей без `AiResponse`.
- **Голос**: `app/(modals)/voice-new.tsx` (стр. 798+) и `src/features/planner/voiceIntentHandler.ts` (стр. 1-182) используют RegExp-парсер и затрагивают только Planner; нет STT→GPT→dispatcher.
- **Инфраструктура**: каталог `schemas/` отсутствует, типы `AiResponse/AiAction` не описаны, логи/квоты/кеш не ведутся.

## 2. Целевая архитектура
1. **Сервис `AiGateway`** (`src/services/ai/AiGateway.ts`):
   - Методы: `generateDailyInsights`, `generatePeriodSummary`, `answerUserQuestion`, `parseVoiceIntent`.
   - Использует HTTP‑клиент для ChatGPT (через конфиг), собирает payload `system+instructions+context+output_schema` как в §8A.2.
   - JSON‑валидация результата по `schemas/AiResponse.schema.json` (добавить каталог `schemas/`).
   - Логи: `{requestId, method, latency, tokenUsage, schemaValidation, promptHash}` без ПДн.
   - Retry/backoff 1s/2s/4s, таймаут ≤6s, circuit breaker по количеству ошибок.
   - Квоты: `dailyInsights`, `periodSummary`, `qa` (конфигурируемые) + кэш дневных инсайтов `date|hash(context)`.
2. **Типы и схемы**:
   - `AiResponse`, `AiInsightDto`, `AiActionDto` с полями `kind/level/title/body/related`, `actions` и маппинг `AiAction → команды` (таблица §8A.4).
   - Контексты `UserDailyContext`, `UserPeriodContext`, `UserShortContext` с агрегатами из Planner/Finance.
3. **Хранилище инсайтов**:
   - Realm/Async слой `InsightStore` с моделью `Insight { kind, level, scope, title, body, payload, related*, actions[], source }` и историей `InsightHistorySnapshot`.
   - API для запроса, кеша и статусов (new/viewed/completed/dismissed).
4. **Интеграция с UI**:
   - `useInsightsData` переходит на `AiGateway`: при запросе → ожидать `AiResponse`, сохранять инсайты и запускать `AiAction` (через event bus). При офлайн/ошибке — fallback.
   - Экран вопросов/истории обновляется для работы с Realm‑сущностями и квотами.
5. **Голосовой поток**:
   - В `voice-new` и `voice-ai` добавить этап STT → отправка транскрипта в `AiGateway.parseVoiceIntent`.
   - Результат `{intent, slots, response}` передаётся в dispatcher, который формирует команды Planner/Finance/Insights/Навигация, поддерживая офлайн-ограничения.
   - История распознанных команд сохраняется для ревью.

## 3. Очерёдность реализации
1. Описать типы `AiResponse/AiAction`, JSON‑схему и контексты, подготовить storage для квот/логов.
2. Реализовать модуль `AiGateway` с HTTP‑клиентом, retry, кешем, квотами.
3. Добавить хранилище инсайтов + сервис для их записи/чтения.
4. Переписать `useInsightsData` и вкладки Insights на работу через `AiGateway` / новое хранилище.
5. Интегрировать `AiGateway.parseVoiceIntent` в голосовые модалы, добавить dispatcher и историю действий.
6. Связать `AiAction` с командным/событийным слоем (после реализации event bus).
