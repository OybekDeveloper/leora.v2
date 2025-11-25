# Задачи: AI Gateway, Инсайты и Голос (LEORA Spec v1.2)

## 1. Реализация AiGateway (§8, §8A)
- [x] Спроектировать модуль `AiGateway` (single entry point для INSIGHTS и VOICE) с методами `generateDailyInsights`, `generatePeriodSummary`, `answerUserQuestion`, `parseVoiceIntent` (файл `src/services/ai/AiGateway.ts`).
- [x] Сформировать JSON-схему ответа (`schemas/AiResponse.schema.json`) и типы `AiResponse/AiAction` (`src/types/ai-gateway.ts`).
- [x] Реализовать сбор базовых контекстов (`UserDailyContext/Period/Short`) из стораджей Planner/Finance (`src/services/ai/contextBuilders.ts`).
- [x] Добавить локальное хранилище инсайтов (`src/stores/useInsightsStore.ts`, обновлённые типы в `src/types/insights.ts`) с историей и очисткой.
- [x] Интегрировать `AiGateway` с ежедневными запросами (сервис `src/services/ai/insightsService.ts`, вызовы из `useInsightsData`), сохранять инсайты и отображать их в UI.
- [ ] Реализовать политику ретраев/квот/кеша в связке с хранилищем пользователя и логированием (§8A.3, §8A.5).
- Формировать payload с `system`/`instructions`/`context`/`output_schema` как в примере (§8A.2), передав контексты `UserDailyContext`, `UserPeriodContext`, `UserShortContext`.
- Проверять ответы по `schemas/AiResponse.schema.json`, логировать `schemaValidation`, `latency`, `token_usage`, `hash(prompt)` без ПДн (§8A.5).
- Реализовать retry-политику (таймаут ≤6s, backoff 1s/2s/4s), квоты `daily=1–2`, `period=1`, `qa=10` на пользователя в сутки и кеширование daily по ключу `date|hash(context)` (§8A.3).

## 2. Инсайты и хранилище (§8)
- Сформировать локальные агрегаты `financeSummary`, `plannerSummary`, индекс `finance/productivity/habits/overall` из данных модулей.
- Сохранять инсайты в схему `Insight {kind, level, scope, title, body, payload, relatedGoalId?, ... , actions[]}` с `source:'chatgpt'` (§8.4).
- Преобразовывать `AiAction` → команды модулей по таблице (§8A.4) и запускать их через шину событий/командный диспетчер.
- Реализовать fallback на «безопасный текст» при невалидном JSON и логировать `schemaValidation=fail`.

## 3. Клиент INSIGHTS (§8)
- Обновить UI вкладок (overview/finance/productivity/wisdom) для работы с `AiResponse`, хранением истории `InsightHistorySnapshot`, вопросами и CTA.
- Добавить управление квотой и кнопки запроса дневных/периодических инсайтов с учётом офлайн-режима.

## 4. Голосовой ассистент (§9)
- Построить поток STT → `AiGateway.parseVoiceIntent` → dispatcher → команды (planner, finance, insights, навигация).
- Поддержать интенты `create_task|habit|goal|transaction|debt`, `start_focus|pause|stop`, `complete_task`, `query_*`, `ask_advice`, `navigate`, а также офлайн-ограничения (только локальные сценарии).
- Реализовать подтверждающий экран/очередь действий с возможностью редактирования, логирование истории голосовых сессий и синхронизацию с интеграционным слоем.
