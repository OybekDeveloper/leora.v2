

1. **Патч‑спека** (как у INSIGHTS/PLANNER, но про GPT‑интеграцию во все модули).
2. **Промпт‑пакет** (system/dev/templates) для продакшн‑вызовов модели.

Скопируй каждый блок в отдельные `.md`/`.txt` файлы у себя в проекте.

---

## 📝 ЧАСТЬ 1. LEORA — GPT Analyzer Integration v1.0 — **ПАТЧ К ТЕКУЩЕЙ РЕАЛИЗАЦИИ**

````markdown
# 🤖 LEORA — GPT Analyzer Integration v1.0 — ПАТЧ К ТЕКУЩЕЙ РЕАЛИЗАЦИИ

Этот патч дополняет существующие модули (PLANNER, INSIGHTS, FINANCE, HOME, MORE),
встраивая GPT как **аналитический и советующий слой** (Insight/Advisor Engine).
Не ломаем текущий UX/навигацию — добавляем *связность, действия и стабильность*.

---

## 0. Цели интеграции (конкурент мирового уровня)
- Действие, а не лекция: каждая карточка рекомендации = **1 понятная CTA**.
- Связность: **цели ↔ задачи ↔ привычки ↔ финансы ↔ инсайты**.
- Оффлайн‑первый, приватный; GPT получает **агрегаты**, не «сырые» PII.
- 5 языков (EN/RU/UZ/TR/AR с RTL), строгий i18n по ключам.
- Метрики качества: p95 UI < 150 мс (после кеша), «CTA acted %» растёт спринт‑к‑спринту.

---

## 1. Где вызываем GPT (потоки)
- **Daily Overview (утро/первый вход):** главный инсайт дня + 2–4 доп., 1–3 вопроса.
- **Event triggers:** крупная трата/аномалия бюджета, просрочка IOU, провал/успех привычки, окончание фокус‑сессии, завал задач.
- **Weekly/Monthly review:** обобщающие инсайты, мини‑план от «советника».

> Все три потока используют один контракт I/O, различаются только «user‑prompt template» и объёмом контекста.

---

## 2. Архитектура рантайма
- **Client Aggregator (App):** собирает *сжатые снапшоты* из PLANNER/FINANCE/Activity/History.
- **aiAdapter (App/Server):** 
  - маскирует PII, форматирует input,
  - вызывает модель, валидирует JSON ответ по схеме,
  - кеширует дневные результаты, делает backoff/retry.
- **Fallback Engine (локально):** если GPT недоступен — простые эвристики → 1–2 подсказки без «советников».

---

## 3. Контракты данных (минимум)

### 3.1. Вход в GPT (InputSnapshot, агрегаты)
```json
{
  "meta": { "locale": "ru-RU", "rtl": false, "tz": "Asia/Tashkent", "today": "2025-11-15", "app_version": "x.y.z" },
  "flags": { "ai_mode": "moderate", "privacy_mode": true, "ab_bucket": "insight_v2" },

  "planner": {
    "tasks": [{ "id":"t1","title":"Call client","date":"2025-11-15","time":"15:00","status":"planned","priority":"high","energy":2,"goalId":"g1" }],
    "habits": [{ "id":"h1","title":"10k steps","streak":12,"linkedGoalIds":["g2"] }],
    "goals":  [{ "id":"g1","title":"Launch feature","type":"professional","progress":0.42 }]
  },

  "finance": {
    "budgets": [{ "id":"b1","cat":"Dining","limit":1000000,"spent_mtd":200000,"currency":"UZS" }],
    "txns_sample": [{ "dt":"2025-11-13","amount":-120000,"currency":"UZS","cat":"Dining" }],
    "iou": [{ "id":"i1","name_alias":"Aziz","amount":500000,"currency":"UZS","due":"2025-11-28","status":"active" }]
  },

  "activity": { "steps_today": 3200, "health_linked": true },

  "history": {
    "insights_recent": [{ "id":"ins1","type":"finance","acted":true }],
    "questions_recent": [{ "id":"q1","answered":true }]
  }
}
````

### 3.2. Выход из GPT (OutputPayload, **только i18n‑ключи**)

```json
{
  "indexes": {
    "personalPerformance": 7.6, "financialHealth": 6.8, "productivity": 7.9,
    "workLifeBalance": 6.1, "discipline": 6.9, "achievingGoals": 7.2
  },
  "main_insight": {
    "type": "finance",
    "title_key": "insights.main.dinners_over.title",
    "description_key": "insights.main.dinners_over.desc",
    "severity": "warning",
    "cta": {
      "type": "create_rule",
      "label_key": "insights.main.dinners_over.cta",
      "payload": { "targetView":"finance_budgets", "suggestedValue":"80000 UZS/day" }
    }
  },
  "secondary_insights": [
    {
      "type":"habit",
      "title_key":"insights.habit.steps_low.title",
      "description_key":"insights.habit.steps_low.desc",
      "severity":"info",
      "cta":{ "type":"create_habit","label_key":"insights.habit.steps_low.cta","payload":{"habitId":null,"suggestedValue":10000} }
    }
  ],
  "questions": [
    {
      "id":"q_steps_barrier",
      "text_key":"questions.steps_barrier.text",
      "choices":[
        {"id":"no_time","label_key":"questions.steps_barrier.no_time"},
        {"id":"forget","label_key":"questions.steps_barrier.forget"},
        {"id":"no_value","label_key":"questions.steps_barrier.no_value"}
      ],
      "allowFreeText": true,
      "contextKey": "activity_barrier"
    }
  ],
  "advice":[{ "advisor":"stoic", "plan":[{"key":"advice.stoic.step1"},{"key":"advice.stoic.step2"}] }]
}
```

**CTA types (жёстко):**
`open_view | create/update_budget | create/update_rule | create/update_task | reschedule_tasks | create/update_habit | adjust_goal | adjust_iou`

---

## 4. Встраивание по модулям

### 4.1 INSIGHTS

* Показывает `main_insight` крупной карточкой (1 CTA), далее `secondary_insights`.
* Блок «Вопросы на сегодня» (1–3), ответы → мгновенный пересчёт.
* Экран «История инсайтов»: acted/dismissed/read + фильтры.

### 4.2 PLANNER

* После Focus‑сессии → event trigger в GPT → возможный инсайт: «закрыть/перенести».
* Add Task/Habit/Goal формы: AI‑блок «Применить рекомендации».
* Связи `task.goalId`, `habit.linkedGoalIds[]` — выводим бейджи на карточках.

### 4.3 FINANCE

* Аномалии/перерасход → инсайты с CTA: создать лимит/правило, перенести IOU.
* Бюджеты с rollover, IOU с мягкой реструктуризацией — всё доступно в CTA.

### 4.4 HOME

* Ежедневное резюме (2–3 строки) + quick‑actions (log expense / add task / mark habit / start focus).

---

## 5. Приватность/стоимость/надёжность

* **PII** маскируем (имена → псевдонимы), передаём агрегаты.
* **Rate‑limits:** не более X вызовов/сутки/пользователь (daily + 2 события).
* **Кеш:** дневной результат; принудительная регенерация по триггерам.
* **Fallback:** эвристики (без GPT) на случай недоступности.
* **Логи:** без PII, опциональные в MORE; хранение — минимум для истории.

---

## 6. i18n (EN/RU/UZ/TR/AR)

* Модель возвращает **только ключи**, тексты — из локализации.
* RTL (AR) проверяется визуально; числовые/валютные форматы — локальные (в т.ч. UZS).

---

## 7. Аналитика (минимум)

* `insight_shown`, `insight_cta_clicked`, `question_answered`
* `planner_task_created|completed|moved`, `planner_focus_started|finished`
* `finance_tx_added`, `budget_rule_created`, `iou_rescheduled`
* Все события: `{ locale, tz, app_version, ab_flag }`, без PII.

---

## 8. Производительность

* p95: формирование UI блока инсайтов ≤100 мс (после кеша).
* Один вызов модели (без кеша) — бюджет ≤ 600–800 мс на ответ (зависит от модели/сети).
* Виртуализация списков, мемо‑селекторы, батч‑апдейты.

---

## 9. Definition of Done (ship‑блокеры)

* [ ] Контракт I/O зафиксирован в JSON‑схеме, валидируется рантаймом.
* [ ] Все CTA кликабельны и приводят к действию/навигации.
* [ ] Фоллбек при ошибке GPT работает, UX не сыпется.
* [ ] Новые тексты вынесены в i18n (EN/RU/UZ/TR/AR); RTL ок.
* [ ] Аналитика событий подключена (моки/стабы).
* [ ] p95 метрики в бюджете; тесты (unit/E2E) зелёные.

````

---

## ⚙️ ЧАСТЬ 2. **Промпт‑пакет** для GPT Analyzer (прод)

Сохрани как `prompts/gpt_analyzer_bundle.md`.

```markdown
# 🎛️ LEORA — GPT Analyzer · Production Prompt Bundle

> Модель выдаёт **только JSON по контракту** (см. схему).
> Никаких рассуждений/объяснений в ответе — рендер текста делает приложение по i18n‑ключам (EN/RU/UZ/TR/AR).

---

## 1) SYSTEM PROMPT (общий для всех потоков)

You are LEORA’s Insight & Advisor Engine.
Your job: turn summarized user data into calm, human, **actionable** recommendations.
**Every recommendation has exactly ONE clear CTA** with a minimal payload.
**Return ONLY valid JSON matching the contract.**  
Use **i18n keys** for all user-facing strings (titles, descriptions, labels) for EN/RU/UZ/TR/AR; the app renders texts.
If data is insufficient or conflicting, generate up to **3 QUESTIONS** (each with short choices + allowFreeText if helpful).
**Never output chain-of-thought or extra prose.** No PII, no bank logins.

Constraints:
- Insights: 1 `main_insight` + up to 4 `secondary_insights`.
- Severity: one of `info | warning | opportunity`.
- CTA types (enum): `open_view | create/update_budget | create/update_rule | create/update_task | reschedule_tasks | create/update_habit | adjust_goal | adjust_iou`.
- Use the user’s currency symbol/ISO provided in input.
- Avoid repeating same insight on consecutive days unless data changed.

---

## 2) DEVELOPER PROMPT (политики и форматы)

Formatting:
- Output MUST be a single JSON object with fields: `indexes`, `main_insight`, `secondary_insights`, `questions`, `advice`.
- All string fields shown to users must be **i18n keys** (e.g., `insights.main.dinners_over.title`).
- For CTAs include the minimal actionable payload: `{ targetView?, entityId?, suggestedValue?, suggestedDate? }`.

Policies:
- Respect minimal context: prioritize high-impact, low-friction actions.
- Prefer habit/goal/task alignment and budget rules to lecturing.
- Don’t invent screens/actions: use only allowed `targetView` and `cta` enums.
- Keep numbers consistent and realistic; if uncertain, ask a QUESTION rather than guessing.

---

## 3) USER PROMPT TEMPLATES

### 3.1. DAILY OVERVIEW (утро/первый запуск дня)

User locale: {{locale}}, RTL: {{rtl}}, TZ: {{tz}}, Today: {{today}}
Context flags: {{flags_json}}

Data snapshots (summaries):
- Planner: {{planner_summary_json}}
- Finance: {{finance_summary_json}}
- Activity: {{activity_summary_json}}
- History: {{history_summary_json}}

Task:
1) Compute 6 indexes [0..10].
2) Produce ONE `main_insight` (with single actionable CTA).
3) Up to 4 `secondary_insights` (each with CTA).
4) Up to 3 `questions` if data is missing/conflicting.
5) Optional `advice` (1 advisor, up to 3 steps).

Return strictly valid JSON per the contract. No prose.

---

### 3.2. EVENT TRIGGER (событийный вызов)

Trigger: {{event_type}}  
Example values: `finance_tx_added | budget_anomaly | iou_overdue | habit_broken | focus_finished | tasks_overdue`

User locale: {{locale}}, RTL: {{rtl}}, TZ: {{tz}}, Today: {{today}}
Data deltas: {{delta_json}}
Small context: {{small_context_json}}

Task:
- Re-evaluate only affected areas.
- If a new **high-impact** insight emerged, include it; otherwise, return empty `secondary_insights`.
- No more than 1 QUESTION unless essential.
- Keep output JSON minimal and valid.

---

### 3.3. WEEKLY/MONTHLY REVIEW

User locale: {{locale}}, RTL: {{rtl}}, TZ: {{tz}}
Period: {{period_range}}  // e.g., "2025-11-10..2025-11-16"

Summaries:
- Planner weekly stats: {{planner_week_json}}
- Finance weekly stats: {{finance_week_json}}
- Habits weekly stats: {{habits_week_json}}

Task:
- Compute indexes with weekly context.
- Provide 1 `main_insight` and up to 3 `secondary_insights`.
- Provide advisor `plan` (max 3 steps) using i18n keys.
- Return strict JSON.

---

## 4) JSON SCHEMA (контуры для валидации)

- Indexes: numbers (0..10).
- main_insight/secondary_insights:
  - `type`: enum
  - `title_key`, `description_key`: string
  - `severity`: enum
  - `cta`: { `type`: enum, `label_key`: string, `payload`?: object }
- questions:
  - `id`: string, `text_key`: string, `choices`?: [{ id, label_key }], `allowFreeText`: boolean, `contextKey`: string.
- advice: [{ advisor: string, plan: [{ key: string }] }]

(Реальная схема хранится в коде проекта и валидируется рантаймом.)

---

## 5) I18N ПРИМЕРЫ (5 языков, ключи)

```json
{
  "insights.main.dinners_over.title": {
    "en": "Weekday dinners exceed your baseline",
    "ru": "Ужины в будни выходят за рамки",
    "uz": "Ish kunlari kechki ovqatlar me’yoridan oshgan",
    "tr": "Hafta içi akşam yemekleri sınırı aşıyor",
    "ar": "عشاء أيام الأسبوع يتجاوز المستوى المعتاد"
  },
  "insights.main.dinners_over.desc": {
    "en": "Dining-out is +35% vs. norm. Let’s calmly cap it.",
    "ru": "Расходы на рестораны выше нормы на +35%. Ограничим их спокойно.",
    "uz": "Tashqarida ovqatlanish odatdagidan +35% ko‘p. Buni sokin cheklaymiz.",
    "tr": "Dışarıda yemek harcaması normunun %35 üzerinde. Sakince sınırlandıralım.",
    "ar": "إنفاق المطاعم أعلى بنسبة %35 من المعتاد. لِنحدد سقفًا بهدوء."
  },
  "insights.main.dinners_over.cta": {
    "en": "Create dinner limit",
    "ru": "Создать лимит на ужины",
    "uz": "Kechki ovqat uchun limit qo‘yish",
    "tr": "Akşam yemeği limiti oluştur",
    "ar": "إنشاء حد للعشاء"
  },
  "questions.steps_barrier.text": {
    "en": "What usually prevents you from walking?",
    "ru": "Что чаще всего мешает вам ходить?",
    "uz": "Yurishga odatda nima xalal beradi?",
    "tr": "Yürümeyi genelde ne engelliyor?",
    "ar": "ما الذي يمنعك عادةً من المشي؟"
  }
}
````

---

## 6) CHECKLIST перед прод‑включением

* Contract JSON валидируется, ошибки парсинга безопасны.
* Фоллбек (эвристики) даёт 1–2 подсказки, если GPT недоступен.
* Кеш и rate‑limits настроены (daily + 2 event triggers).
* Все новые ключи в i18n на **EN/RU/UZ/TR/AR**, RTL проверен.
* Аналитика: `insight_shown`, `insight_cta_clicked`, `question_answered` отправляются.

