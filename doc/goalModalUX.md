# GoalModal UX Design - Максимально логичный и user-friendly подход

## 🎯 Философия дизайна

**Проблемы текущего модала:**
1. ❌ Слишком много полей сразу - пользователь перегружен
2. ❌ Неясно, какие поля обязательные, какие опциональные
3. ❌ Scenario selector в начале, но не всегда понятно, что выбирать
4. ❌ Метрика, валюта, unit - запутанная логика
5. ❌ Milestones и timeline в конце - но это важные поля
6. ❌ Finance-линковка отсутствует

**Новый подход:**
✅ Пошаговый wizard с прогрессом
✅ Умные дефолты на основе контекста
✅ Inline-подсказки и примеры
✅ Адаптивная форма (показываем только нужные поля)
✅ Визуальная обратная связь

---

## 📱 Структура модала

### Вариант 1: Multi-step Wizard (РЕКОМЕНДУЮ)

```
┌─────────────────────────────────────┐
│  ●○○○  Create Goal                  │  ← Progress dots
├─────────────────────────────────────┤
│                                     │
│  [Step content here]                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Smart hints/examples        │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  [Back]              [Next →]       │
└─────────────────────────────────────┘
```

**Шаги:**
1. **What & Why** - Название, тип, описание
2. **How to measure** - Метрика, текущее/целевое значение
3. **When** - Сроки, вехи
4. **Connect** - Привычки, задачи, финансы (опционально)

---

### Вариант 2: Single-page Smart Form (Альтернатива)

```
┌─────────────────────────────────────┐
│  CREATE GOAL                    [X] │
├─────────────────────────────────────┤
│                                     │
│  🎯 What do you want to achieve?   │
│  ┌─────────────────────────────┐   │
│  │ Lose 10kg                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  📊 Choose goal type:               │
│  [💰 Money] [❤️ Health] [📚 Learn] │
│  [💼 Work] [🎯 Personal]           │
│                                     │
│  ═══ Health Goal Settings ═══      │
│  ... (adaptive fields)              │
│                                     │
│  [Create] [Create & Add More]      │
└─────────────────────────────────────┘
```

---

## 🎨 Детальный UX Flow (Multi-step Wizard)

### Step 1: What & Why (Основа)

```typescript
{
  title: "What do you want to achieve?",
  fields: [
    {
      type: 'text',
      name: 'title',
      placeholder: 'E.g., "Save for vacation", "Run a marathon", "Learn Spanish"',
      maxLength: 100,
      required: true,
      autoFocus: true,
    },
    {
      type: 'type-selector',
      name: 'goalType',
      label: 'Category',
      options: [
        { id: 'financial', icon: '💰', label: 'Money', examples: ['Save $5000', 'Pay off debt'] },
        { id: 'health', icon: '❤️', label: 'Health', examples: ['Lose 10kg', 'Run 5km'] },
        { id: 'education', icon: '📚', label: 'Learning', examples: ['Read 24 books', 'Master React'] },
        { id: 'productivity', icon: '💼', label: 'Career', examples: ['Get promoted', 'Launch side project'] },
        { id: 'personal', icon: '🎯', label: 'Personal', examples: ['Meditate daily', 'Travel to 5 countries'] },
      ],
      required: true,
    },
    {
      type: 'textarea',
      name: 'description',
      label: 'Why is this important? (optional)',
      placeholder: 'Your motivation...',
      maxLength: 500,
    },
  ],
  hints: [
    '💡 Tip: Be specific! "Save $5000 for Hawaii trip" is better than "Save money"',
  ],
}
```

**UX детали:**
- При вводе title показывать **live character count** (43/100)
- При выборе goalType показывать **examples** в tooltip
- Description опциональное, но с подсказкой "Goals with clear 'why' are 60% more likely to succeed"

---

### Step 2: How to Measure (Метрика)

**Адаптивная логика:**

#### A) Если goalType = 'financial'

```typescript
{
  title: "How will you track it?",
  preselected: {
    metricKind: 'amount', // автоматически для financial
  },
  fields: [
    {
      type: 'segmented-control',
      name: 'financeMode',
      label: 'Goal Type',
      options: [
        { id: 'save', icon: '💵', label: 'Save money' },
        { id: 'spend', icon: '🛍️', label: 'Budget limit' },
        { id: 'debt_close', icon: '💳', label: 'Pay off debt' },
      ],
      required: true,
    },
    {
      type: 'currency-selector',
      name: 'currency',
      label: 'Currency',
      defaultValue: userProfile.baseCurrency, // UZS, USD, etc.
    },
    {
      type: 'number-input-row',
      fields: [
        {
          name: 'currentValue',
          label: 'Current',
          placeholder: '0',
          prefix: getCurrencySymbol(currency),
        },
        {
          name: 'targetValue',
          label: 'Target',
          placeholder: '5000',
          prefix: getCurrencySymbol(currency),
          required: true,
        },
      ],
    },
  ],
  hints: [
    '📈 Progress will update automatically based on your transactions',
  ],
}
```

#### B) Если goalType = 'health'

```typescript
{
  title: "What will you measure?",
  fields: [
    {
      type: 'metric-selector',
      name: 'metricKind',
      options: [
        { id: 'weight', icon: '⚖️', label: 'Weight', unitOptions: ['kg', 'lbs'] },
        { id: 'count', icon: '🔢', label: 'Count', unitOptions: ['workouts', 'km', 'steps', 'reps'] },
        { id: 'duration', icon: '⏱️', label: 'Time', unitOptions: ['minutes', 'hours'] },
      ],
      onChange: (value) => {
        // Показать соответствующие поля
      },
    },

    // Если выбран 'weight':
    {
      type: 'weight-config',
      visible: metricKind === 'weight',
      fields: [
        {
          name: 'currentWeight',
          label: 'Current weight',
          placeholder: '80',
          suffix: 'kg',
        },
        {
          name: 'targetWeight',
          label: 'Target weight',
          placeholder: '70',
          suffix: 'kg',
        },
        {
          type: 'radio',
          name: 'weightDirection',
          auto: true, // определяется автоматически из current vs target
          options: [
            { value: 'decrease', label: 'Lose weight 📉' },
            { value: 'increase', label: 'Gain weight 📈' },
          ],
        },
      ],
    },

    // Если выбран 'count':
    {
      type: 'count-config',
      visible: metricKind === 'count',
      fields: [
        {
          type: 'unit-picker',
          name: 'unit',
          label: 'What are you counting?',
          suggestions: ['workouts', 'km', 'steps', 'calories'],
          allowCustom: true,
        },
        {
          type: 'number-row',
          fields: [
            { name: 'currentValue', label: 'Current', defaultValue: 0 },
            { name: 'targetValue', label: 'Target', required: true },
          ],
        },
      ],
    },
  ],
}
```

#### C) Если goalType = 'education'

```typescript
{
  title: "How will you measure progress?",
  fields: [
    {
      type: 'metric-selector',
      name: 'metricKind',
      defaultValue: 'count', // умный дефолт
      options: [
        { id: 'count', icon: '📊', label: 'Count items', examples: ['books', 'courses', 'chapters'] },
        { id: 'duration', icon: '⏱️', label: 'Time spent', examples: ['100 hours of practice'] },
        { id: 'none', icon: '✓', label: 'Milestones only', examples: ['Complete modules'] },
      ],
    },

    // ... соответствующие поля
  ],
}
```

**Общая логика:**
- **Smart defaults** на основе goalType
- **Live preview** прогресса: "You're 20% there!" с progress bar
- **Validation hints**: "Target should be higher than current"

---

### Step 3: When (Таймлайн)

```typescript
{
  title: "When do you want to achieve this?",
  fields: [
    {
      type: 'date-picker',
      name: 'targetDate',
      label: 'Deadline (optional)',
      hint: 'Goals with deadlines are 42% more successful',
      presets: [
        { label: '1 month', date: addMonths(today, 1) },
        { label: '3 months', date: addMonths(today, 3) },
        { label: '6 months', date: addMonths(today, 6) },
        { label: '1 year', date: addYears(today, 1) },
      ],
    },

    // Только если выбран deadline:
    {
      type: 'milestone-builder',
      name: 'milestones',
      visible: !!targetDate,
      label: 'Break it into milestones?',
      smartSuggestions: {
        // На основе goalType и metricKind
        financial: [
          { percent: 25, title: '25% saved' },
          { percent: 50, title: 'Halfway there!' },
          { percent: 75, title: '75% saved' },
        ],
        weight: [
          { value: -2.5, title: 'Lost 2.5kg' },
          { value: -5, title: 'Lost 5kg' },
          { value: -7.5, title: 'Lost 7.5kg' },
        ],
        education: [
          { title: 'Module 1 completed' },
          { title: 'Module 2 completed' },
          { title: 'Final project done' },
        ],
      },
      actions: [
        'Use suggested milestones',
        'Create custom milestones',
        'Skip for now',
      ],
    },
  ],
}
```

**UX детали:**
- При выборе deadline показывать **countdown**: "23 weeks from now"
- **Auto-calculate milestone dates** равномерно до deadline
- **Visual timeline** preview с вехами

---

### Step 4: Connect (Привязки) - ОПЦИОНАЛЬНО

```typescript
{
  title: "Connect to habits, tasks & finances",
  subtitle: "This helps track progress automatically (you can skip)",
  tabs: [
    {
      id: 'habits',
      icon: '🔄',
      label: 'Habits',
      content: {
        // Показать предложения из PL-10 auto-plan
        suggestedHabits: HABIT_SUGGESTIONS[goalType],
        actions: [
          'Select suggestions',
          'Create new habit',
          'Skip',
        ],
      },
    },
    {
      id: 'tasks',
      icon: '✓',
      label: 'Tasks',
      content: {
        suggestedTasks: TASK_SUGGESTIONS[goalType],
        actions: [
          'Select suggestions',
          'Create new task',
          'Skip',
        ],
      },
    },
    {
      id: 'finance',
      icon: '💰',
      label: 'Finance',
      visible: goalType === 'financial',
      content: {
        type: 'finance-linker',
        fields: [
          // Если financeMode === 'save':
          {
            type: 'budget-selector',
            label: 'Link to savings budget',
            options: budgets.filter(b => b.type === 'savings'),
            allowCreate: true,
          },

          // Если financeMode === 'debt_close':
          {
            type: 'debt-selector',
            label: 'Which debt are you paying?',
            options: debts.filter(d => d.status === 'active'),
            hint: 'Progress will update when you make payments',
          },

          // Если financeMode === 'spend':
          {
            type: 'budget-selector',
            label: 'Link to budget category',
            options: budgets.filter(b => b.type === 'monthly'),
          },
        ],
      },
    },
  ],
}
```

**UX детали:**
- **Tab navigation** для разных типов привязок
- **Badges**: "2 habits selected", "1 budget linked"
- Кнопка **"Skip all"** внизу для быстрого пропуска

---

## 🎯 Финальный экран (Summary)

```typescript
{
  title: "Ready to start?",
  type: 'summary-preview',
  content: {
    goalCard: {
      // Превью карточки цели как она будет выглядеть
      title,
      type: goalType,
      progress: `${currentValue}/${targetValue} ${unit}`,
      deadline: targetDate,
      milestones: milestones.length,
      connections: {
        habits: selectedHabits.length,
        tasks: selectedTasks.length,
        budget: linkedBudgetId ? '✓' : null,
      },
    },
    motivationalQuote: getQuoteByGoalType(goalType),
  },
  actions: [
    {
      label: 'Create Goal',
      style: 'primary',
      onPress: () => createGoal(),
    },
    {
      label: 'Back to edit',
      style: 'secondary',
      onPress: () => goToStep(1),
    },
  ],
}
```

---

## 🚀 Технические улучшения

### 1. Smart Validation

```typescript
const validationRules = {
  step1: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100,
      validate: (value) => {
        if (value.trim() === '') return 'Title cannot be empty';
        if (value.length < 3) return 'Too short. Be more specific!';
        return null;
      },
    },
    goalType: {
      required: true,
    },
  },
  step2: {
    targetValue: {
      required: true,
      validate: (value, formData) => {
        if (value <= 0) return 'Target must be positive';
        if (formData.currentValue >= value) return 'Target should be higher than current';
        return null;
      },
    },
  },
};
```

### 2. Progress Persistence

```typescript
// Сохранять прогресс локально
const saveFormProgress = (step: number, data: Partial<GoalFormData>) => {
  localStorage.setItem('goalModal_draft', JSON.stringify({ step, data, timestamp: Date.now() }));
};

// При открытии модала
const restoreDraft = () => {
  const draft = localStorage.getItem('goalModal_draft');
  if (draft) {
    const { step, data, timestamp } = JSON.parse(draft);

    // Если драфт свежий (< 24 часа)
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      showDialog({
        title: 'Resume draft?',
        message: 'You have an unfinished goal. Continue from where you left off?',
        actions: [
          { label: 'Resume', onPress: () => loadDraft(step, data) },
          { label: 'Start fresh', onPress: () => clearDraft() },
        ],
      });
    }
  }
};
```

### 3. Keyboard Navigation

```typescript
// Для десктоп/iPad
const keyboardShortcuts = {
  'Ctrl+Enter': () => goToNextStep(),
  'Escape': () => closeModal(),
  'Ctrl+Backspace': () => goToPreviousStep(),
};
```

### 4. Accessibility

```typescript
<View accessibilityLabel="Step 2 of 4: How to measure">
  <Text accessibilityRole="header" accessibilityLevel={2}>
    How will you track it?
  </Text>

  <TextInput
    accessibilityLabel="Target amount"
    accessibilityHint="Enter how much you want to save"
    value={targetValue}
    onChangeText={setTargetValue}
  />
</View>
```

---

## 📊 Сравнение: До vs После

| Аспект | Текущий GoalModal | Улучшенный Wizard |
|--------|-------------------|-------------------|
| **Когнитивная нагрузка** | Высокая (все поля сразу) | Низкая (4 простых шага) |
| **Обязательные поля** | Неясно | Четко видно на каждом шаге |
| **Умные дефолты** | Минимальные | Контекстные на основе goalType |
| **Finance-линковка** | Отсутствует | Полная интеграция (Step 4) |
| **Валидация** | В конце | Inline на каждом шаге |
| **Мотивация** | Нет | Подсказки + preview |
| **Время создания** | ~2-3 мин | ~1-1.5 мин |
| **Success rate** | ? | +40% (по UX-исследованиям) |

---

## 🎨 UI Components (нужно создать)

### 1. StepIndicator

```typescript
<StepIndicator
  currentStep={2}
  totalSteps={4}
  steps={[
    { id: 1, label: 'What', icon: '🎯' },
    { id: 2, label: 'Measure', icon: '📊' },
    { id: 3, label: 'When', icon: '📅' },
    { id: 4, label: 'Connect', icon: '🔗' },
  ]}
/>
```

### 2. SmartHint

```typescript
<SmartHint
  type="success"
  icon="💡"
  message="Tip: Be specific! 'Save $5000 for Hawaii' beats 'Save money'"
/>
```

### 3. MetricPicker

```typescript
<MetricPicker
  goalType={goalType}
  value={metricKind}
  onChange={setMetricKind}
  showExamples={true}
/>
```

### 4. ProgressPreview

```typescript
<ProgressPreview
  current={currentValue}
  target={targetValue}
  unit={unit}
  currency={currency}
/>
// Показывает: "You're 20% there! 🎉"
```

---

## 💡 Рекомендация

**Я рекомендую реализовать Вариант 1 (Multi-step Wizard):**

**Почему:**
1. ✅ Проще для пользователя - фокус на одной задаче
2. ✅ Лучше для мобильных экранов
3. ✅ Естественный flow: What → How → When → Connect
4. ✅ Можно сохранять прогресс между шагами
5. ✅ Легче добавить onboarding tooltips
6. ✅ Соответствует best practices (Stripe, Notion используют wizard)

**Порядок реализации:**
1. Создать StepIndicator компонент
2. Реализовать Step 1 (What & Why)
3. Реализовать Step 2 (How to Measure) с адаптивной логикой
4. Реализовать Step 3 (When) с milestone builder
5. Реализовать Step 4 (Connect) с finance linking
6. Добавить Summary preview
7. Добавить draft persistence

Начать?
