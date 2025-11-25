# PLANNER_DETAILED_SPEC_v2.md

> **Дизайн НЕ менять.** Реализуем механику, события и локализацию (RU/UZ/EN/TR/AR).
> **Офлайн‑первый.** Все изменения живут локально; сеть нужна только для AI и курсов (вне PLANNER).

---

## 0) Что это и как этим пользоваться

**Цель файла:** дать один источник правды для реализации PLANNER и его связей.
**Что делать агенту/Codex:**

1. Прочитать этот файл.
2. Выполнить задачи по чек‑листам (ниже) **в указанном порядке**.
3. После каждого шага вернуть короткий отчёт в формате:

```text
[STEP] <ID из чек-листа> — <кратко, что сделано> — commit:<SHA> — status: done/blocked — notes:<короткий комментарий>
```

---

## 1) TypeScript типы данных (ОБЯЗАТЕЛЬНО к реализации)

### 1.1. FinanceRule для привычек

```typescript
type FinanceRule =
  | { type: 'no_spend_in_categories'; categoryIds: string[] }
  | { type: 'spend_in_categories'; categoryIds: string[]; minAmount?: number }
  | { type: 'has_any_transaction'; accountIds?: string[] }
  | { type: 'daily_spend_under'; amount: number; currency: string };
```

### 1.2. FinanceLink для задач

```typescript
type FinanceLink =
  | { action: 'pay_debt'; debtId: string; minAmount?: number }
  | { action: 'review_budget'; budgetId: string }
  | { action: 'record_expenses'; categoryId: string; minCount?: number }
  | { action: 'transfer_money'; fromAccountId: string; toAccountId: string; amount: number };
```

### 1.3. RiskFlag для целей

```typescript
type RiskFlag =
  | 'deadline_soon' // < 7 дней до дедлайна и прогресс < 70%
  | 'no_progress' // нет изменений 14+ дней
  | 'budget_overrun' // траты превысили план
  | 'habits_failing'; // < 50% выполнения привычек за неделю
```

---

## 2) Формулы прогресса (ВАЖНО!)

### 2.1. Прогресс цели (Goal.progressPercent)

```typescript
function computeGoalProgress(goal: Goal, habits: Habit[], tasks: Task[]): number {
  const metricProgress = goal.initialValue / goal.targetValue;

  const linkedHabits = habits.filter(h => h.goalId === goal.id);
  const habitsProgress = linkedHabits.length > 0
    ? linkedHabits.reduce((sum, h) => sum + h.completionRate30d, 0) / linkedHabits.length
    : 0;

  const linkedTasks = tasks.filter(t => t.goalId === goal.id);
  const tasksProgress = linkedTasks.length > 0
    ? linkedTasks.filter(t => t.status === 'completed').length / linkedTasks.length
    : 0;

  // Адаптивные веса
  if (!linkedHabits.length && !linkedTasks.length) {
    return clamp(metricProgress, 0, 1); // Только метрика
  }
  if (!linkedHabits.length) {
    return clamp(0.6 * metricProgress + 0.4 * tasksProgress, 0, 1);
  }
  if (!linkedTasks.length) {
    return clamp(0.6 * metricProgress + 0.4 * habitsProgress, 0, 1);
  }

  // Все три компонента
  return clamp(0.4 * metricProgress + 0.3 * habitsProgress + 0.3 * tasksProgress, 0, 1);
}
```

### 2.2. ETA (Estimated Time to Achieve)

```typescript
function computeGoalETA(goal: Goal): string | undefined {
  if (!goal.targetDate) return undefined;
  if (goal.progressPercent >= 1.0) return 'Completed';

  const now = Date.now();
  const deadline = new Date(goal.targetDate).getTime();
  const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline <= 0) return 'Overdue';

  const started = new Date(goal.startDate).getTime();
  const daysSinceStart = (now - started) / (1000 * 60 * 60 * 24);

  if (daysSinceStart <= 0 || goal.progressPercent <= 0) {
    return formatDuration(daysUntilDeadline); // "5 days" | "2 weeks" | "3 months"
  }

  const progressPerDay = goal.progressPercent / daysSinceStart;
  const remainingProgress = 1.0 - goal.progressPercent;
  const estimatedDaysToComplete = remainingProgress / progressPerDay;

  if (estimatedDaysToComplete > daysUntilDeadline * 1.2) {
    return 'At risk';
  }

  return formatDuration(estimatedDaysToComplete);
}
```

---

## 3) Агрегаты (экраны читают только их)

**1.1. `TaskSummary`**
`taskId, title, status, priority, dueDate?, timeOfDay?, estimatedMin?, goalId?, habitId?, financeLink?, focusTotalMin, nextAction?, badges{overdue,today,planned}, subtasksDone/total`

**1.2. `GoalSummary`**
`goalId, title, type, unit/currency?, target, current?, progressPercent, deadline?, eta?, riskFlags[], milestonesDone/total, badges{habitsToday, nextTask, financeLink}, nextAction?`

**1.3. `HabitSummary`**
`habitId, title, frequency, completionMode(boolean/numeric), targetPerDay?, unit?, todayStatus(done/remainingValue), streakCurrent, streakBest, completionRate30d, goalId?, financeRule?`

**1.4. `HomeSnapshot`**
`date, rings{goals%, habits%, productivity%, finance%}, today{tasksDue, habitsDue, nextEvents[]}, alerts{atRiskGoals[], budgetRisk[], debtDue[]}`

> **Важно:** экраны **не пересчитывают** — только подписываются на изменения агрегатов.

---

## 2) События (контракт синхронизации)

**PLANNER публикует:**
`planner.task.created/updated/completed/canceled`
`planner.goal.created/updated/progress_updated/completed/archived`
`planner.habit.created/updated/day_evaluated`
`planner.focus.started/completed`

**PLANNER слушает:**
`finance.tx.created`, `finance.budget.spending_changed`,
`finance.debt.created`, `finance.debt.payment_added/status_changed`,
`insights.actions.apply`

**На любое событие:** пересчитать соответствующие `*Summary` + `HomeSnapshot` и **обновить UI без перезахода**.

---

## 3) Вкладки и их поведение (дизайн не менять)

### 3.1. **Tasks**

* Секции: **Today / Upcoming / Overdue / Completed**.
* Карточка: title, due(+overdue), чип Goal/Habit, фокус‑минуты, чекбокс done.
* Быстрые действия: **Start focus / Mark done / Reschedule**.
* Добавление: **Add Task** (быстрый → Inbox; расширенный — due/priority/goal/habit/**financeLink**).

**Синхронизация:** события `planner.task.* / focus.*` мгновенно переносят карточку между секциями и обновляют KPI.

---

### 3.2. **Goals**

* Секции: **At risk / Active / Completed/Archived**.
* Карточка: **кольцо %**, подпись по типу:

  * *Financial:* `Saved {current}/{target} {CUR}`
  * *Weight (decrease/increase):* `±Δ of Total kg`
  * *Hours/Items:* `{current}/{target}`
  * *Quality:* `{done}/{total} milestones`
* Бейджи: `Habits today`, `Next task`, `Budget/Debt (Linked|Need link)`.
* Быстрые действия по типу: Financial—**Top up/Pay debt**; Weight—**Log weight**; Hours—**Start focus**; Count—**Mark iteration**.
* Тап → экран цели.

**Синхронизация:** `goal.*`, `habit.day_evaluated`, `task.*`, `finance.*` → плавная анимация кольца и обновление подписи/бейджей.

---

### 3.3. **Habits**

* Секции: **Today / This week / Paused**.
* Карточка: чек‑поинт дня (boolean/numeric), streak, % за 30d, связь с Goal.
* Быстрые действия: **Mark done / Enter value / Skip day**.
* Автооценка (если `financeRule`): на `finance.tx.created` день ставится pass/fail.

---

## 4) Модалы Add/Edit (поведение)

### 4.1. **Add Goal / Edit Goal** (дизайн вашего модала, механика ниже)

* **Create goal** — создать минимальную цель.
* **Create and more** — открыть “автоплан”: предложить 1–3 **Habits**, 2–3 **Tasks**; для Financial — **линковку бюджета/долга**.
* **Counting type = единица** (money/kg/km/hours/items/custom). **Money** включает выбор валюты.
* **Amount = target** (для *Quality* скрыт; прогресс через milestones).
* **Deadline** создаёт/сдвигает weekly review (задачу).
* **Milestones** — пресеты по типу: деньги (10%), вес (–5 кг), время/дистанция (шаг 10/25/100), quality — «Модуль 1/2/3…».
* **Edit:** безопасные правки (title/desc/deadline/milestones/weights); смена метрики/валюты → диалог *ребейз / новая цель*.
* **События:** `planner.goal.created/updated` (+ `progress_updated` при пересчёте).

**Прогресс цели (по умолчанию):** `0.4*метрика + 0.3*привычки + 0.3*задачи`.

* *Financial* — из **Budget/Project/Debt** в **валюте цели**; курс фиксируется **на дату операции**.
* *Weight* — по **сглаженной** метрике (медиана/EMA 7d), достижение — устойчиво (≥3 из 5 дней ≤/≥ цели).
* *Hours/Items* — накопление/лучшая попытка.
* *Quality* — доля выполненных milestones (+ вклад задач).

---

### 4.2. **Add Habit / Edit Habit**

* Поля: title, frequency (daily/weekly/custom), completionMode (boolean/numeric), targetPerDay?, unit?, timeOfDay?, goalId?, reminders, **financeRule?**
* **financeRule**: `no_spend_in_categories` / `spend_in_categories` / `has_any_transactions`.
* Сохранение → события `planner.habit.created/updated`; на транзакции — `habit.day_evaluated`.

---

### 4.3. **Add Task / Edit Task**

* Быстрый ввод → Inbox; расширенный — due/start, priority, energy, goal/habit/milestone, **financeLink** (`record_expenses / pay_debt / review_budget / transfer_money`).
* **Focus**: старт/стоп → `planner.focus.started/completed` (+ инкремент фокус‑минут).
* Корректная операция в FINANCE по `financeLink` **автоматически закрывает** задачу.

---

## 5) Home (KPI‑rings и виджеты)

`HomeSnapshot.rings` обновляются при событиях из таблицы ниже.

* **Goals%** — средний прогресс активных целей (или взвешенный по важности).
* **Habits%** — % выполненных привычек за сегодня (или 7‑дневное среднее — по дизайну).
* **Productivity%** — фокус‑минуты / дневная цель (например, 120 мин).
* **Finance%** — индекс из Finance Summary (соблюдение бюджетов/накоплений).
* Тап по кольцу → соответствующая вкладка, отфильтрованная по “At risk/Today”.

---

## 6) Таблица обновлений (подписаться обязательно)

| Событие                                         | Источник | Обновить                                                                                              |
| ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `planner.goal.created/updated/progress_updated` | PLANNER  | Goals (карточка), Goal Screen (хедер/график/вехи), Home KPI (Goals%)                                  |
| `planner.habit.created/updated/day_evaluated`   | PLANNER  | Habits (карточка), Goal Screen (Сегодня), Home KPI (Habits%), Goal progress (поведенческий вклад)     |
| `planner.task.created/updated/completed`        | PLANNER  | Tasks (списки), Goal Screen (Next step), Home KPI (Productivity%), Goal progress (задачи/вехи)        |
| `planner.focus.completed`                       | PLANNER  | Home KPI (Productivity%), TaskSummary.focusTotalMin                                                   |
| `finance.tx.created/updated`                    | FINANCE  | GoalSummary для финансовых целей (current/%, подпись), Goal Screen (бюджет/долг), Home KPI (Finance%) |
| `finance.budget.spending_changed`               | FINANCE  | riskFlags/ETA, бары бюджета                                                                           |
| `finance.debt.payment_added/status_changed`     | FINANCE  | Остаток долга, автозакрытие задач `pay_debt`                                                          |
| `insights.actions.apply`                        | INSIGHTS | Создать задачи/привычки/бюджеты и отразить на соответствующих вкладках                                |

---

## 7) Локализация (RU/UZ/EN/TR/AR)

* Подключить ключи для вкладок, модалов и быстрых действий (см. существующие таблицы i18n в проекте).
* **AR — RTL**: выравнивание, порядок икон/текста, форматы чисел/дат/валют по CLDR.
* Денежные форматы: UZS без копеек; остальные по локали профиля.

---

## 8) Чек‑листы (выполнять и отмечать)

### 8.1. Базовая подписка и перерисовка

* [x] **PL‑01** Подписать Tasks/Goals/Habits/Home на события из §6; обновления без перезахода.
* [x] **PL‑02** Пересчитывать `*Summary` + `HomeSnapshot` на каждое событие.
* [x] **PL‑03** KPI‑rings обновляются за <1 с после события.

### 8.2. Модалы

* [x] **PL‑10** Add Goal: `Create goal` и `Create and more` с автопланом (habits/tasks + finance‑линковка).
* [ ] **PL‑11** Edit Goal: безопасные правки + диалог при смене метрики/валюты (ребейз / новая цель).
* [ ] **PL‑12** Add/Edit Habit: частоты, completion, goalLink, financeRule, автооценка дня.
* [ ] **PL‑13** Add/Edit Task: Inbox→Planned, goal/habit/milestone, financeLink, Focus.

### 8.3. Экран цели

* [ ] **PL‑20** Хедер: кольцо %, подпись по типу (см. §4), бейджи.
* [ ] **PL‑21** Панель метрики: мини‑граф (quant) / бюджет/долг (financial) / список вех (quality).
* [ ] **PL‑22** Блок “Сегодня”: привычки (чек), ближайшая задача (Start focus).
* [ ] **PL‑23** Автообновление при транзакциях/логах/отметках.

### 8.4. Связки с FINANCE/INSIGHTS

* [ ] **PL‑30** Долг → задача `pay_debt` на dueDate; платёж → автозакрытие.
* [ ] **PL‑31** Бюджет/проект обновляет прогресс финансовой цели (курс — на дату).
* [ ] **PL‑32** INSIGHTS actions создают объекты, публикуются события.

### 8.5. Оффлайн

* [ ] **PL‑40** Все изменения пишутся локально с флагом pending; UI показывает индикатор.
* [ ] **PL‑41** При сети — синхронизация и очистка pending; KPI/карточки обновляются.

### 8.6. Локализация

* [ ] **PL‑L‑01** RU/UZ/EN/TR/AR подключены; AR — RTL‑режим.
* [ ] **PL‑L‑02** Числа/даты/валюты форматируются по локали.

---

## 9) Acceptance (коротко)

1. Создание/редактирование в модале **мгновенно** отражается на вкладках и на Home KPI.
2. Финансовые действия по связанным целям меняют прогресс **без перезахода**; курс — зафиксирован на дату.
3. Привычки с financeRule автоматически оцениваются по транзакциям; ручная отметка не ломается.
4. Задача с financeLink закрывается автоматически после правильной операции.
5. Весь текст — на RU/UZ/EN/TR/AR; арабский — RTL корректно.

---

### Конец файла
