# AdaptiveGlassView Audit & Migration Plan

## Background
- В iOS 18 liquid glass (UIGlassEffect) стал заметно темнее и почти не формирует контрастных границ, если `tintColor` совпадает с цветом основного фона. Поэтому карточки/инпуты, обернутые в `AdaptiveGlassView`, визуально сливаются с бэкграундом.
- Компонент `AdaptiveGlassView` (`src/components/ui/AdaptiveGlassView.tsx`) рендерит:
  - Android → обычный `View` с `borderWidth: 1` и темing border;
  - iOS → `<GlassView tintColor={theme.colors.background} glassEffectStyle="clear">` без дополнительного слоя.
- 62 файлов импортируют `AdaptiveGlassView`, т.е. дефект затрагивает практически все основные экраны (Focus/Planner, Finance, Insights, More, модалки).

## Usage Inventory
| Зона | Кол-во файлов | Примеры |
| --- | --- | --- |
| `app/(tabs)/more/*` | 14 | профиль, настройки, интеграции |
| `app/(tabs)/(finance)/*` | 5 | accounts, budgets, analytics, debts, index |
| `app/(tabs)/(insights)/*` | 6 | history, questions, вкладки finance/productivity/wisdom |
| `app/(tabs)/(planner)/*` | 3 | goals, habits, index |
| `app/(modals)/*` | 5 | add-goal, change-password, voice-new, и т.п. |
| Прочие `app/*` | 3 | `app/focus-mode.tsx`, `app/profile.tsx`, `app/progress/[metric]/info.tsx` |
| `src/components/modals/*` | 9 | финансовые и планнер модалки, `FocusSettingsModal` |
| `src/components/widget/*` | 11 | CashFlow, DailyTasks, Goals, Transactions, Habits, и т.д. |
| Прочие `src/components/*` | 5 | `screens/home/GreetingCard`, `planner/goals/GoalCard`, `shared/LevelProgress`, `features/more/components`, `screens/finance/transactions/TransactionGroup` |

### Детальный список по зонам
- **Focus / Planner критические:**
  - `app/focus-mode.tsx`
  - `src/components/modals/FocusSettingsModal.tsx`
  - `src/components/modals/planner/AddTaskSheet.tsx`
  - `src/components/modals/planner/GoalModal.tsx`
  - `src/components/modals/planner/HabitModal.tsx`
  - `app/(tabs)/(planner)/(tabs)/{goals,habits,index}.tsx`
- **Finance (модалки + табы):**
  - `src/components/modals/finance/{AddAccountSheet,DedbtModal,FilterTransactionSheet,IncomeOutcomeModal,TransactionModal}.tsx`
  - `app/(tabs)/(finance)/(tabs)/{accounts,budgets,analytics,debts,index}.tsx`
  - `src/components/screens/finance/transactions/TransactionGroup.tsx`
  - `src/components/widget/{CashFlowWidget,TransactionsWidget,BudgetProgressWidget}.tsx`
- **Insights:**
  - `app/(tabs)/(insights)/history.tsx`
  - `app/(tabs)/(insights)/questions.tsx`
  - `app/(tabs)/(insights)/(tabs)/{index,finance,productivity,wisdom}.tsx`
  - `src/components/widget/{DailyTasksWidget,ProductivityInsightsWidget,WeeklyReviewWidget,FocusSessionsWidget,WellnessOverviewWidget,HabitsWidget}.tsx`
- **More / Settings / Account:**
  - Все 14 файлов внутри `app/(tabs)/more/*` + `app/profile.tsx`
  - `src/features/more/components.tsx`
  - `src/components/screens/home/GreetingCard.tsx`
  - `src/components/shared/LevelProgress.tsx`
- **Прочие модалки:** `app/(modals)/{add-goal,goal-details,change-password,forgot-passcode,voice-new}.tsx`

## Observations & Risks
- Большинство вызовов передают собственные стили (`backgroundColor`, `borderRadius`, `padding`). Любые изменения внутри `AdaptiveGlassView` должны уважать переданный `style`.
- Есть глубокая вложенность (карточка → иконка → чекбокс), поэтому слишком жирный fallback border может визуально дублироваться.
- В `FocusSettingsModal` и финансовых формах `AdaptiveGlassView` используется как контейнер для `TextInput`; требуется сохранить clipped borders и нормальные hit targets.
- Некоторым карточкам требуется твердое покрытие (например, `CashFlowWidget` задает `backgroundColor: theme.colors.card`). Нужно дать возможность включать “плоский” режим без glass, иначе tint + overlay может давать неожиданные оттенки.
- Expo `GlassView` реально работает только на iOS 17+ и “по-настоящему” — на iOS 18+. Мы хотим сохранить эффект для новых устройств, но добавить fallback, чтобы бордеры не зависели от поведения системного blur.

## Change Strategy
1. **Расширить базовый компонент.**
   - Добавить пропсы вроде `appearance="glass" | "surface"` и `forceBorder?: boolean`.
   - На iOS: рендерить стекло + прозрачный `View`-overlay (hairline border + слегка подсвеченный фон), чтобы бордер был стабильным.
   - На Android: оставить текущий `View`, но включить те же новые пропсы для консистентности.
2. **Ввести набор токенов (`theme.elevation.glassBorder`, `glassBackground`)**, чтобы фон/бордер легко настраивался из темы.
3. **Мигрировать экраны пакетами**, чтобы проверять визуально и не ловить гигантский diff. При необходимости временно разрешить `appearance="surface"` там, где стекло не нужно.
4. **Добавить визуальную регрессионную проверку** (скриншоты в Expo Go или E2E тест для ключевых экранов) после каждой фазы.

## Tasks
### 1. Core component & theme
- [ ] В `src/components/ui/AdaptiveGlassView.tsx` добавить новые пропсы: `appearance`, `overlayIntensity`, `borderOpacity`.
- [ ] Ввести новые токены в `src/constants/theme.ts` (например, `glass.border`, `glass.overlay`), чтобы не хардкодить цвета в компоненте.
- [ ] Обновить все импорты `AdaptiveGlassView`, чтобы они явно указывали `appearance` при необходимости (постепенно, начиная с критичных экранов).
- [ ] Добавить сторибук или пример screen (можно в `doc/loading.md`) с разными вариантами, чтобы QA быстро проверял изменения.

### 2. Focus & Planner
- [ ] Проверить `app/focus-mode.tsx` (таймер, переключатели, статистика).
- [ ] Проверить `src/components/modals/FocusSettingsModal.tsx`.
- [ ] Проверить `src/components/modals/planner/{AddTaskSheet,GoalModal,HabitModal}.tsx`.
- [ ] Проверить `app/(tabs)/(planner)/(tabs)/{goals,habits,index}.tsx` и `app/(modals)/add-goal.tsx`.
- [ ] Собрать новые скриншоты (iOS 16/17/18) для сравнения.

### 3. Finance (высокий приоритет)
- [ ] Обновить `src/components/modals/finance/*` файлы (5 шт.) и убедиться, что инпуты / суммы сохранили четкие рамки.
- [ ] Обновить `app/(tabs)/(finance)/(tabs)/*` (accounts, budgets, analytics, debts, index).
- [ ] В виджетах (`CashFlowWidget`, `BudgetProgressWidget`, `TransactionsWidget`) проверить комбинацию `appearance="surface"` vs “glass”.
- [ ] В `src/components/screens/finance/transactions/TransactionGroup.tsx` удостовериться, что swipe-элементы не сломаны.

### 4. Insights
- [ ] Таб `app/(tabs)/(insights)/*` и связанные виджеты (`DailyTasksWidget`, `WeeklyReviewWidget`, `ProductivityInsightsWidget`, `FocusSessionsWidget`, `WellnessOverviewWidget`, `HabitsWidget`).
- [ ] Обновить placeholder-состояния (у многих карточек нет данных → серые бордеры должны быть видимы).

### 5. More / Settings / Profile
- [ ] `app/(tabs)/more/*`, `app/profile.tsx`, `src/features/more/components.tsx`, `src/components/screens/home/GreetingCard.tsx`, `src/components/shared/LevelProgress.tsx`.
- [ ] Выработать правило, где используем `appearance="surface"` (например, для длинных форм в Settings) и где оставляем стекло.

### 6. Остальные модалки
- [ ] `app/(modals)/{change-password,forgot-passcode,goal-details,voice-new}`.
- [ ] Проверить, не перекрывают ли новые бордеры иконки + CTA.

### 7. QA / Regression
- [ ] Собрать Expo build на iOS 16/17/18, сделать контрольные скрины для Focus Mode и Finance.
- [ ] Отразить изменения в `README.md` (секция “Focus Mode UI”) и при необходимости в `doc/loading.md`.
- [ ] Зафиксировать визуальные снапшоты для будущих регрессий.

> Предложенный порядок даст возможность раскатывать изменения пакетами: сначала компонент и critical flows, затем остальной продукт. Каждый блок можно брать отдельной задачей/PR.
