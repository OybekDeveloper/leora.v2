
# LEORA · Спецификация (GPT‑enabled) — v1.2 · «N‑й вариант»
**Дата:** 2025‑11‑17  
**Назначение:** единый, офлайн‑первый продуктовый/технический документ для мобильного приложения LEORA с интеграцией внешнего ИИ (ChatGPT) через модуль AI Gateway.

---

## Содержание
1. [Введение и принципы](#1-введение-и-принципы)  
2. [Высокоуровневая архитектура (обновлено)](#2-высокоуровневая-архитектура-обновлено)  
3. [Мультирегион/язык/валюта (концепции)](#3-мультирегионязыковалюта-концепции)  
4. [Модуль MORE (профиль/регион/настройки)](#4-модуль-more-профильрегионнастройки)  
5. [Модуль PLANNER (цели/привычки/задачи/фокус) — детальное ТЗ](#5-модуль-planner-целипривычкизадачифокус--детальное-тз)  
6. [Модуль FINANCE (счета/транзакции/бюджеты/долги/курсы) — детальное ТЗ](#6-модуль-finance-счетатранзакциибюджетидолгикурсы--детальное-тз)  
7. [Интеграция PLANNER ↔ FINANCE: события/команды/саги](#7-интеграция-planner--finance-событиякомандысаги)  
8. [Модуль INSIGHTS (клиент ChatGPT)](#8-модуль-insights-клиент-chatgpt)  
8A. [AI Gateway / ChatGPT Integration](#8a-ai-gateway--chatgpt-integration)  
9. [Voice Assistant (обновлено под GPT)](#9-voice-assistant-обновлено-под-gpt)  
10. [HOME (дашборд дня)](#10-home-дашборд-дня)  
11. [Integration Layer (шина событий/саги/проекции)](#11-integration-layer-шина-событийсагипроекции)  
12. [FX (курсы валют): провайдеры/ручные курсы/инварианты](#12-fx-курсы-валют-провайдерыручные-курсынварианты)  
13. [Офлайн/онлайн матрица](#13-офлайнонлайн-матрица)  
14. [Приватность и безопасность (privacy-by-design)](#14-приватность-и-безопасность-privacy-by-design)  
15. [API интерфейсы модулей (сводно)](#15-api-интерфейсы-модулей-сводно)  
16. [Ошибки/идемпотентность/краевые случаи](#16-ошибкиидемпотентностькраевые-случаи)  
17. [Тест‑план и приёмка (acceptance)](#17-тестплан-и-приёмка-acceptance)  
18. [Миграция и фичефлаг (включение/откат)](#18-миграция-и-фичефлаг-включениеоткат)  
19. [Конфигурация (фрагмент)](#19-конфигурация-фрагмент)  
20. [Приложения (JSON‑schema/диаграммы/примеры)](#20-приложения-jsonscheмадиаграммыпримеры)

---

## 1) Введение и принципы
**LEORA** — офлайн‑первое мобильное приложение, которое помогает человеку управлять **деньгами** и **поведением**, чтобы достигать целей.

**Ключевые модули:** HOME, MORE, PLANNER, FINANCE, INSIGHTS, VOICE, Integration Layer.  
**ИИ:** ChatGPT (только онлайн) через модуль **AI Gateway**; локально храним **только агрегаты** и результаты инсайтов.

**Принципы:**
- **Офлайн‑первый:** все CRUD и расчёты в PLANNER/FINANCE локально; сеть нужна для курсов и ИИ.  
- **Мультивалюта и точность:** курс фиксируем **на дату операции**, не «переоцениваем» задним числом.  
- **Событийная интеграция:** любой факт публикует событие; кросс‑модульные процессы реализованы как **саги**.  
- **Приватность:** в ИИ отправляем **только агрегаты**, без ПДн/сырых транзакций.  
- **Идемпотентность:** повторная доставка/обработка событий и команд безопасны.

---

## 2) Высокоуровневая архитектура (обновлено)
```
[Мобильное приложение (локальная БД: SQLite/Realm)]
  ├─ MORE (регион/язык/валюта, курсы, фичефлаги ИИ/телеметрии)
  ├─ HOME (виджеты дня, быстрые действия)
  ├─ PLANNER (Goals/Habits/Tasks/Focus)
  ├─ FINANCE (Accounts/Transactions/Budgets/Debts/FX)
  ├─ INSIGHTS (агрегаты локально → вызовы ИИ через AiGateway)
  ├─ VOICE (STT → AiGateway.parseVoiceIntent → диспетчер команд)
  └─ Integration Layer (Event Bus, Orchestrator/Sagas, Projections, Notifications)

[AI Gateway]  ←HTTP/SDK→  [ChatGPT (внешний ИИ)]
     ↑    ↑
     |    └─ VOICE: NLU/ответы
     └─ INSIGHTS: daily/period insights, Q&A/advice
```
**Источник истины:** FINANCE и PLANNER. INSIGHTS — «умный слой», который **не хранит сырые операции**, а только агрегаты и результаты ИИ.

---

## 3) Мультирегион/язык/валюта (концепции)
- **Регионы:** Узбекистан, Россия, Турция, KSA, UAE, США, ЕС и др.  
- **Языки:** RU, UZ, EN, TR, AR (расширяемо).  
- **Базовая валюта отчётов** настраивается; валюта цели/бюджета может отличаться от базовой.  
- **Рабочая неделя/первый день недели** — из региона (важно для привычек/фокуса).  
- **Провайдер курсов** — из региона; ручные курсы имеют приоритет.

---

## 4) Модуль MORE (профиль/регион/настройки)
**Функции:** профиль пользователя, язык/регион/валюта, источники курсов, тумблер ИИ, приватность/телеметрия.

- Профиль: имя (опц.), часовой пояс, локаль.  
- Регион: базовая валюта, `weekPattern`, `fx_provider`.  
- Валюты: базовая валюта отчётов; ручные курсы на дату (override).  
- ИИ: тумблер «Использовать ChatGPT (нужен интернет)»; согласие на анонимную телеметрию (off by default).

---

## 5) Модуль PLANNER (цели/привычки/задачи/фокус) — детальное ТЗ
**Назначение:** превращает намерения в систему действий: **Goals → Habits → Tasks → Focus**.

### 5.1. Модели (выдержка)
```ts
type GoalType = 'financial'|'health'|'education'|'project'|'career'|'personal';
type GoalStatus = 'active'|'paused'|'completed'|'archived';
type MetricKind = 'none'|'amount'|'weight'|'count'|'duration'|'custom';
type FinanceMode = 'save'|'spend'|'debt_close';

interface Goal { id; userId; title; goalType; status; metricType; unit?; initialValue?; targetValue?;
  financeMode?; currency?; linkedBudgetId?; startDate?; targetDate?; completedDate?;
  progressPercent; stats: { financialProgressPercent?; habitsProgressPercent?; tasksProgressPercent?; focusMinutesLast30? };
  milestones?[]; createdAt; updatedAt;
}

type HabitStatus='active'|'paused'|'archived'; type HabitType='health'|'finance'|'productivity'|'education'|'personal';
type Frequency='daily'|'weekly'|'custom'; type CompletionMode='boolean'|'numeric';

interface Habit { id; userId; title; habitType; status; goalId?; frequency; daysOfWeek?; timesPerWeek?;
  timeOfDay?; completionMode; targetPerDay?; unit?; financeRule?; streakCurrent; streakBest; completionRate30d; createdAt; updatedAt;
}
// financeRule: no_spend_in_categories | spend_in_categories | has_any_transactions (+порог/валюта)

type TaskStatus='inbox'|'planned'|'in_progress'|'completed'|'canceled';

interface Task { id; userId; title; status; priority; goalId?; habitId?; financeLink?; dueDate?; startDate?; timeOfDay?;
  estimatedMinutes?; energyLevel?; checklist?[]; dependencies?[]; lastFocusSessionId?; focusTotalMinutes?; createdAt; updatedAt;
}
// financeLink: record_expenses | pay_debt | review_budget | transfer_money

type FocusStatus='in_progress'|'completed'|'canceled'|'paused';
interface FocusSession { id; userId; taskId?; goalId?; plannedMinutes; actualMinutes; status; startedAt; endedAt?; interruptionsCount?; notes?; createdAt; updatedAt; }
```

### 5.2. Логика
- **Цели:** мастер создания (тип/метрика/сроки/финсвязка/шаблоны). Прогресс = взвешенная сумма: `финансы/привычки/задачи`.  
- **Привычки:** boolean/numeric/financeRule; авто‑оценка по транзакциям; стрики/проценты.  
- **Задачи:** lifecycle; чеклист/зависимости; финансовые задачи автозакрываются по событиям FINANCE.  
- **Фокус:** устойчивый таймер, пауза/возобновление; лог в INSIGHTS.

Публичные методы: `createGoal/update/complete/archive`, `createHabit/update/log/pause/archive`, `createTask/update/complete/cancel/schedule`, `startFocus/pause/resume/finish/cancel`.

---

## 6) Модуль FINANCE (счета/транзакции/бюджеты/долги/курсы) — детальное ТЗ
**Назначение:** мультивалютный офлайн‑движок денег.

### 6.1. Модели (выдержка)
```ts
interface Account { id; userId; name; accountType; currency; initialBalance:Decimal; currentBalance:Decimal; linkedGoalId?; isArchived; createdAt; updatedAt; }
interface Category { id; parentId?; nameI18n; type:'expense'|'income'; isUserDefined; }

interface Transaction {
  id; userId; type:'income'|'expense'|'transfer'; accountId?; fromAccountId?; toAccountId?;
  amount:Decimal; currency; baseCurrency; rateUsedToBase:Decimal; convertedAmountToBase:Decimal;
  toAmount?; toCurrency?; effectiveRateFromTo?; feeAmount?; feeCategoryId?; categoryId?; subcategoryId?;
  description?; date; time?; goalId?; budgetId?; debtId?; habitId?; splits?[]; recurringId?; attachments?[]; tags?[]; createdAt; updatedAt;
}
interface TransactionSplit { splitId; categoryId; amount:Decimal; }

interface Budget { id; userId; name; budgetType:'category'|'project'; categoryIds?[]; linkedGoalId?; currency; limitAmount:Decimal;
  periodType:'none'|'weekly'|'monthly'|'custom_range'; startDate?; endDate?; spentAmount:Decimal; remainingAmount:Decimal; percentUsed:number; rolloverMode?; isArchived; createdAt; updatedAt; }
interface BudgetEntry { id; budgetId; transactionId; appliedAmountBudgetCurrency:Decimal; rateUsedTxnToBudget:Decimal; snapshottedAt; }

interface Debt { id; userId; direction:'i_owe'|'they_owe_me'; counterpartyName; description?; principalAmount:Decimal; principalCurrency;
  baseCurrency; rateOnStart:Decimal; principalBaseValue:Decimal; startDate; dueDate?; interestMode?; interestRateAnnual?; scheduleHint?; linkedGoalId?; linkedBudgetId?; status:'active'|'paid'|'overdue'|'canceled'; createdAt; updatedAt;
}
interface DebtPayment { id; debtId; amount:Decimal; currency; baseCurrency; rateUsedToBase:Decimal; convertedAmountToBase:Decimal; rateUsedToDebt:Decimal; convertedAmountToDebt:Decimal; paymentDate; relatedTransactionId?; createdAt; updatedAt; }

// FxRate хранится как "сколько toCurrency за 1 fromCurrency":
interface FxRate { id; date; fromCurrency; toCurrency; rate:Decimal; source:'central_bank'|'market_api'|'manual'; isOverridden:boolean; createdAt; updatedAt; }
```

### 6.2. Инварианты и логика
- **Курс фиксируется на дату операции** (`rateUsedToBase`/`convertedAmountToBase`), исторически не меняется.  
- **Межвалютные переводы:** фиксируем `toAmount` и `effectiveRateFromTo`; комиссия — через поле `feeAmount` и/или отдельную транзакцию.  
- **BudgetEntry:** фиксирует сумму в валюте бюджета на дату транзакции; задним числом не пересчитываем (кнопка «пересчитать период» — опционально).  
- **Долги:** платежи могут быть в иной валюте; остаток считается в валюте долга; статус `paid/overdue`.  
- **Ручные курсы** (source=`manual`) приоритетнее любых провайдеров.

Публичные методы (сокр.): `createAccount/archive/list`, `createTransaction/update/delete/list`, `createBudget/update/archive/recalc`, `createDebt/addDebtPayment/update/list`, `getRate/overrideRate`, `getFinanceSummaryDaily/Monthly`.

---

## 7) Интеграция PLANNER ↔ FINANCE: события/команды/саги
**Цель:** цели обеспечены бюджетами; финфакты рождают действия и закрывают их.

### 7.1. Матрица «событие → реакция» (кратко)
| Событие | Потребитель | Действие |
|---|---|---|
| `planner.goal.created (financial/project)` | Orchestrator | `finance.budget.create` (если нет связки) → `planner.goal.link_budget` |
| `finance.budget.spending_changed` | PLANNER | обновить `goal.stats.financialProgressPercent` |
| `finance.debt.created (dueDate)` | PLANNER | создать `task(pay_debt)` |
| `finance.debt.payment_added` | PLANNER | обновить/закрыть `task(pay_debt)`; цель `debt_close` — прогресс |
| `finance.tx.created` | PLANNER | авто‑оценка `habit.financeRule` → `habit.day_evaluated` |
| `finance.budget.updated` | PLANNER | автозакрыть `review_budget` (окно 24ч) |

**Саги:** `FinancialGoalSaga`, `DebtSaga`, `HabitFinanceRuleSaga`, `BudgetReviewSaga`, `RecordExpensesSaga`.  
**Идемпотентность:** ключи вида `pay_debt|debtId`, `goalId|currency|limit` и т.п.

(Полный контракт payload и последовательности — см. прикладные разделы и диаграммы ниже.)

---

## 8) Модуль INSIGHTS (клиент ChatGPT)
**Роль:** локальная агрегация + оркестрация ИИ через **AI Gateway**. Офлайн — показ последней сессии инсайтов + локальные индексы.

### 8.1. Локальные контексты
```ts
type Lang='ru'|'uz'|'en'|'tr'|'ar';
interface UserDailyContext { date; region; baseCurrency; language:Lang;
  indices:{ financeIndex; productivityIndex; habitsIndex; overallIndex };
  financeSummary: FinanceSummaryDailyMin;
  plannerSummary: PlannerSummaryDailyMin;
}
interface UserPeriodContext extends UserDailyContext { periodType:'week'|'month'|'custom'; from; to; }
interface UserShortContext { language:Lang; baseCurrency; keyFinanceFacts; keyPlannerFacts; }
```

### 8.2. Вызовы к ИИ
```ts
AiGateway.generateDailyInsights(ctx:UserDailyContext):Promise<AiResponse>
AiGateway.generatePeriodSummary(ctx:UserPeriodContext):Promise<AiResponse>
AiGateway.answerUserQuestion(question:string, ctx:UserShortContext):Promise<AiResponse>
```

### 8.3. Ответ ИИ (валидация по JSON‑Schema)
```ts
type InsightLevel='info'|'warning'|'critical'|'celebration';
type InsightKind='finance'|'planner'|'habit'|'focus'|'combined'|'wisdom';
interface AiResponse { narration?; insights: AiInsightDto[]; actions: AiActionDto[]; }
```
Фолбэк при невалидном JSON — безопасный текст без action‑кнопок, лог с пометкой `schemaValidation=fail` (без ПДн).

### 8.4. Хранение
```ts
interface Insight { id; userId; kind; level; scope:'daily'|'weekly'|'monthly'|'custom'; title; body; payload;
  relatedGoalId?; relatedBudgetId?; relatedDebtId?; relatedHabitId?; relatedTaskId?; actions?[]; createdAt; validUntil?; source:'chatgpt'; }
```

---

## 8A) AI Gateway / ChatGPT Integration
**Назначение:** единая точка ИИ для INSIGHTS и VOICE: промпты, валидация, ретраи, квоты, логирование без ПДн.

### 8A.1. Методы
```ts
generateDailyInsights(ctx):Promise<AiResponse>
generatePeriodSummary(ctx):Promise<AiResponse>
answerUserQuestion(question, ctx):Promise<AiResponse>
parseVoiceIntent(utterance, locale, shortCtx):Promise<{intent:string; slots:any; response?:string}>
```

### 8A.2. Формат запроса к ИИ (пример)
```json
{
  "system":"Вы — ассистент LEORA...",
  "instructions":"Сформируй до 5 инсайтов и до 3 действий. Верни JSON по схеме AiResponse.",
  "language":"ru",
  "context": { /* UserDailyContext (усечённый) */ },
  "output_schema":"AiResponse.schema.json#/"
}
```

### 8A.3. Ретраи/таймауты/квоты
- Таймаут ≤ 6s; backoff 1s/2s/4s; circuit breaker при N ошибках.  
- Квоты: `daily=1–2`, `period=1`, `qa=10` на пользователя/сутки (конфиг).  
- Кэширование daily по ключу `date|hash(context)`.

### 8A.4. Маппинг `AiAction → Команда`
| AiAction | Команда |
|---|---|
| `create_task` | `Planner.CreateTask` |
| `create_habit` | `Planner.CreateHabit` |
| `create_budget` | `Finance.CreateBudget` |
| `create_debt` | `Finance.CreateDebt` |
| `start_focus` | `Planner.StartFocus` |
| `open_budget` | Навигация Finance |
| `open_goal` | Навигация Planner |
| `review_budget` | `Planner.CreateTask{financeLink:'review_budget'}` |

### 8A.5. Логи без ПДн
Храним: `requestId`, метод, latency, token_usage, `schemaValidation`, `hash(prompt)`; не храним тексты/ПДн.

---

## 9) Voice Assistant (обновлено под GPT)
**Поток:** STT → `AiGateway.parseVoiceIntent` (онлайн) → `intent+slots` → диспетчер → команды PLANNER/FINANCE/INSIGHTS/Навигация.  
**Базовые интенты:** `create_task|habit|goal|transaction|debt`, `start_focus|pause|stop`, `complete_task`, `query_*`, `ask_advice`, `navigate`.  
**Офлайн:** умные сценарии выключены (опционально — минимальные локальные команды).

---

## 10) HOME (дашборд дня)
- Виджеты: «Сегодня» (задачи/привычки/фокус), краткая финсводка, карточки INSIGHTS (последние).  
- Быстрые действия: `+Расход`, `+Задача`, `Фокус`, `Голос`.  
- Состояние онлайн/офлайн явно отображается.

---

## 11) Integration Layer (шина событий/саги/проекции)
**Компоненты:** Event Bus (персистентный), Command Dispatcher, Orchestrator (саги), Projection Engine, Notifications Manager, Calendar Projector.  
**Envelope событий/команд:** `eventId/commandId`, `version`, `correlationId/causationId`, `idempotencyKey`.

**Ключевые события:**  
- PLANNER: `planner.goal.*`, `planner.habit.*`, `planner.task.*`, `planner.focus.*`  
- FINANCE: `finance.account.*`, `finance.tx.*`, `finance.budget.*`, `finance.debt.*`, `finance.fx.rates_updated`  
- INSIGHTS: `insights.daily_indices_computed`, `insights.insight_generated`

**Саги:** см. §7.

---

## 12) FX (курсы валют): провайдеры/ручные курсы/инварианты
- Абстракция `RateProvider.getRate(date, from, to)`.  
- Региональные провайдеры (ЦБ/рынок); **ручные** курсы `source='manual'` имеют приоритет.  
- Исторические операции **не** переоцениваем; пересчитываем только виджеты «оценочно».

---

## 13) Офлайн/онлайн матрица
| Возможность | Офлайн | Онлайн |
|---|:--:|:--:|
| PLANNER CRUD/логика | ✅ | ✅ |
| FINANCE CRUD/логика | ✅ | ✅ |
| Курсы провайдера | ❌ | ✅ |
| Ручные курсы | ✅ | ✅ |
| INSIGHTS: новые инсайты | ❌ | ✅ |
| VOICE: NLU/советы | ❌ | ✅ |
| Нотификации/таймеры | ✅ | ✅ |

---

## 14) Приватность и безопасность (privacy-by-design)
- В ИИ — **только агрегаты**; никакие реквизиты/номера/точные адреса не отправляются.  
- Локальная БД — опционально шифруется; вход по PIN/Face/Touch ID.  
- Экспорт/удаление данных; Логи ИИ — без ПДн, с TTL.  
- В MORE: тумблер ИИ и опция анонимной телеметрии (по умолчанию off).

---

## 15) API интерфейсы модулей (сводно)
- **PLANNER:** `createGoal/update/complete/archive`, `createHabit/update/log/pause/archive`, `createTask/update/complete/cancel/schedule`, `startFocus/...`.  
- **FINANCE:** `createAccount/...`, `createTransaction/...`, `createBudget/...`, `createDebt/addDebtPayment/...`, `getRate/overrideRate`, `getFinanceSummary*`.  
- **INSIGHTS/AiGateway:** `generateDaily/Period/answerUserQuestion/parseVoiceIntent`.  
- **VOICE:** `handleUtterance(utterance, locale) → AiGateway.parseVoiceIntent → dispatch`.  
- **MORE:** `setRegion/setLanguage/setBaseCurrency/toggleAI/toggleTelemetry`, `overrideRate()`.

---

## 16) Ошибки/идемпотентность/краевые случаи
- **Повторы событий/команд** — подавляются по `eventId/idempotencyKey`.  
- **Смена базовой валюты/региона** — не меняет историю; пересчитываются только проекции/виджеты.  
- **Автозакрытия задач** (`record_expenses`, `review_budget`, `pay_debt`) — работают в допусках по дате/сумме; иначе ручное подтверждение.  
- **Импорт транзакций** — drafts + сверка; защита от дублей по `idempotencyKey`.  
- **USDT/криптовалюты** — повышенная точность `minorUnits` (6–8), предупреждение о волатильности.

---

## 17) Тест‑план и приёмка (acceptance)
**Интеграционное покрытие (кратко):**
1) Goal→Budget (создание/связка, идемпотентность).  
2) Budget→Progress (разные валюты/даты, BudgetEntry).  
3) Debt→Task (dueDate), Payment→Close (остаток/автокомплит).  
4) Transactions→Habits (no_spend / spend / any, стрики).  
5) Task financeLink автозакрытия (`record_expenses/review_budget/transfer_money`).  
6) Focus (пауза/возобновление/kill‑app, единственная активная).  
7) AiGateway: daily/period/Q&A, JSON‑валидация, ретраи, офлайн‑фолбэк, квоты.

**Acceptance (P95/качество):**
- `feature.ai.enabled=on`: Daily insights — P95 ≤ 6s, валидный JSON ≥ 99%.  
- Приватность: 0 утечек ПДн в логах/запросах.  
- Офлайн: PLANNER/FINANCE полностью работоспособны; INSIGHTS показывает последнюю сессию.  
- Голос: базовые интенты RU/UZ/EN создают сущности и выполняют команды.

---

## 18) Миграция и фичефлаг (включение/откат)
- Флаг `feature.ai.enabled` (off по умолчанию).  
- Включение: первый вызов Daily; отображение ИИ‑карт и голосового NLU.  
- Откат: скрыть ИИ‑функции, инсайты остаются в истории (`source='chatgpt'`).  
- Старые инсайты (если были) помечаются `source='legacy'`.

---

## 19) Конфигурация (фрагмент)
```ini
# AI / Gateway
AI_ENABLED=false
AI_DAILY_TIMEOUT_MS=6000
AI_RETRY_COUNT=3
AI_QA_DAILY_LIMIT=10
AI_DAILY_LIMIT=2
AI_PERIOD_LIMIT=1

# FX
FX_PROVIDER_REGION=UZ
FX_CACHE_TTL_DAYS=7

# Habits
HABIT_DAILY_EVAL_TIME=22:00

# Budgets
BUDGET_THRESHOLD_WARN=0.70
BUDGET_THRESHOLD_CRIT=0.85
BUDGET_REVIEW_AUTOCOMPLETE_WINDOW_H=24
```

---

## 20) Приложения (JSON‑schema/диаграммы/примеры)

### 20.1. JSON‑Schema (сокращённо)
`schemas/AiResponse.schema.json`
```json
{
  "type":"object",
  "properties":{
    "narration":{"type":"string"},
    "insights":{"type":"array","items":{"$ref":"#/definitions/AiInsightDto"},"maxItems":8},
    "actions":{"type":"array","items":{"$ref":"#/definitions/AiActionDto"},"maxItems":6}
  },
  "required":["insights","actions"],
  "additionalProperties":false,
  "definitions":{
    "AiInsightDto":{
      "type":"object",
      "properties":{
        "kind":{"enum":["finance","planner","habit","focus","combined","wisdom"]},
        "level":{"enum":["info","warning","critical","celebration"]},
        "title":{"type":"string","minLength":3},
        "body":{"type":"string","minLength":3},
        "related":{"type":"object","properties":{"goalId":{"type":"string"},"budgetId":{"type":"string"},"debtId":{"type":"string"},"habitId":{"type":"string"},"taskId":{"type":"string"}},"additionalProperties":false}
      },
      "required":["kind","level","title","body"],
      "additionalProperties":true
    },
    "AiActionDto":{
      "type":"object",
      "properties":{
        "type":{"enum":["create_task","create_habit","create_budget","create_debt","start_focus","open_budget","open_goal","review_budget"]},
        "payload":{"type":"object"},
        "confidence":{"type":"number","minimum":0,"maximum":1},
        "priority":{"enum":["low","normal","high"]}
      },
      "required":["type","payload"],
      "additionalProperties":false
    }
  }
}
```

### 20.2. Диаграммы последовательностей (ASCII)
**Goal → Budget → Progress**
```
User ── CreateGoal(financial/project) ─▶ PLANNER
PLANNER ── planner.goal.created ─▶ BUS
Orchestrator ◀──────── BUS
Orchestrator ── finance.budget.create ─▶ FINANCE
FINANCE ── finance.budget.created ─▶ BUS
PLANNER ◀──────── BUS  (link goal↔budget)
... expenses ...
FINANCE ── finance.budget.spending_changed ─▶ BUS
PLANNER ◀──────── BUS  (update goal.financialProgressPercent)
```

**Debt → Task → Payment → Close**
```
FINANCE ── finance.debt.created ─▶ BUS
PLANNER ◀──────── BUS  (create Task pay_debt)
... partial payments ...
FINANCE ── finance.debt.payment_added ─▶ BUS
PLANNER ◀──────── BUS  (update/complete Task; goal progress update)
```

**Transactions → Habit auto‑check**
```
FINANCE ── finance.tx.created ─▶ BUS
PLANNER ◀──────── BUS (evaluate finance habits for that date)
PLANNER ── planner.habit.day_evaluated ─▶ BUS
```

### 20.3. Примеры JSON (фрагменты)
- Транзакция USD→UZS с ручным `toAmount`; BudgetEntry; Debt+Payment; FxRate — см. раздел FINANCE.

---

**© LEORA Team. Этот документ — «единый источник правды» для v1.2 (N‑й вариант).**
