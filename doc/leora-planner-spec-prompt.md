
# Leora Planner System – Goal / Habit / Task Specification  
**Prompt for: Code assistants (e.g. Codex, Claude, GPT), for an existing React Native + Expo project**

The project already has **most of the UI implemented** for Goal, Habit and Task screens.  
Your job is to wire up and improve the **logic, data model and screen architecture** **without destroying the existing UI**.

> ⚠️ Important constraints  
> - Do **NOT** delete or radically rewrite my existing UI components.  
> - You may **add** components/logic, adjust layout, and slightly reorganize JSX, but the visual style must stay close to my current design.  
> - If you really need to do a big refactor of some file, **move the old version into a `docs/backup/` folder** instead of deleting it.  
> - The app uses a dark, monochrome-ish theme similar to the provided Habit screenshot. Keep design consistent with the design system and theme tokens.

The system has **3 core entities**:

- **Goal** – the “root” of planning (like the tree trunk).  
- **Habit** – recurring behaviors that support goals (like branches).  
- **Task** – concrete actions, either standalone or linked to a goal (like leaves).  

All three must work together in a **professional, well-architected way**, with persistent data and clear relations.

---

## 1. TASK SPECIFICATION

### 1.1 Task types

There are **two task types**:

1. **Regular Task** – independent task not tied to a goal.  
2. **Goal-linked Task** – directly attached to a specific goal and affects that goal’s progress.

Use a field like:

```ts
type TaskType = "regular" | "goal-linked";

interface Task {
  id: string;
  type: TaskType;
  name: string;
  description?: string;
  goalId?: string;        // required when type = "goal-linked"
  ...
}
```

### 1.2 Common Task fields & behavior

The following UI is **already implemented** – just connect it to logic, validation, and storage:

- **Name** (required)
- **Description** (optional)
- **Goal link** (optional for regular task, required for goal-linked task):
  - A dropdown / picker to choose which goal it belongs to.
- **Date / time scheduling**:
  - User selects: **Today**, **Tomorrow**, or **Custom** date.
  - For tasks, **past dates must NOT be allowed**:
    - Cannot select a day before **today**.
    - Cannot select a time earlier than **current time** on the chosen day.
  - Reason: tasks are meant for the **future**, not the past.
- **Context / tag** (string or enum):
  - Used later for searching and filtering tasks by context/type.
- **Difficulty / Energy**:
  - Options: **Easy**, **Medium**, **Hard** (may be labeled as “Energy”).  
  - Implemented as a toggle group / segmented buttons.
- **Priority**:
  - e.g. **High**, **Medium**, **Low**, or similar.  
  - Shown in a dropdown. Only one priority can be active at a time.
- **Finance link (optional)**:
  - If the task is related to the Finance module, user can pick **which part** it is linked to (e.g. specific budget, account, category, etc.).  
  - The link is optional.
- **Reminder**:
  - Push notification reminder at selected time/date.
  - Use Expo Notifications or the existing notification abstraction.
- **Repeat (“Reply”)**:
  - Task can repeat on a custom interval:
    - Example: every 10 days → remind & recreate every 10 days.  
    - 1 day → daily.  
    - 10 minutes → every 10 minutes.  
  - This should be stored as an interval (e.g. minutes) or structured recurrence rule.
- **Focus mode toggle**:
  - If enabled, tapping the task lets the user start a **focus-mode session** for this task (timer, distraction blocking, etc.).  
  - Use existing Focus Mode infrastructure if present; otherwise, create a clear entrypoint for it.
- **Subtasks**:
  - UI for adding a list of subtasks is already there.  
  - Wire it to the data model so subtasks can be:
    - Created, checked off, and persisted.

### 1.3 Goal-linked Task behavior

For **goal-linked tasks** (type `"goal-linked"`):

- The user **must** select which goal it belongs to.  
- When this task is **completed**:
  - It **updates the linked goal’s progress**, according to the goal’s type (see Goal section below).  
  - It is recorded in the **Goal details history** (both current & historical records).
- In the **Goal details** screen / modal:
  - All tasks linked to that goal should be visible, along with their completion status and contribution to progress.

Again: **do not remove** my existing Task UI; only hook up logic, validation, persistence, and dropdowns.

---

## 2. HABIT SPECIFICATION

Habits represent repeated behaviors (daily / weekly / monthly etc.).  
The Habit creation UI is mostly designed already (see attached screenshot).  
You must align the **architecture and logic** with that design.

### 2.1 Core Habit fields

- **Name**
- **Description** (optional)
- **Habit type**:
  - Predefined categories:
    - `health`, `finance`, `productivity`, `education`, `personal`
  - For each type:
    - Use a specific icon and styling (icons are shown in the Figma/screenshot).
    - The list of suggested data / presets can change based on type.
  - **Custom type**:
    - The user can create their own category & choose icon/title manually.
- **Goal link (optional/required depending on context)**:
  - User can pick which **goal** this habit supports.
  - When linked, habit completions should be visible in that goal’s **history** and affect its **progress**.
- **Frequency / schedule**:
  - Habit can be daily, weekly, monthly, etc.
  - On `habit.tsx`, the default view is **weekly**:
    - Each day shows whether the habit is **done** or **missed**.
- **Reminder(s)**:
  - Time-based reminders with push notifications.
  - UI similar to screenshot: toggle for reminder on/off, time picker, add/delete reminder.
- **Streak**:
  - UI is already present in the design (7, 21, 30, 66, 100 days, etc.).  
  - Implement streak logic and link it to completion data.

### 2.2 Habit UI behavior (based on screenshot)

Use the screenshot as the reference layout for **New Habit**:

- Top carousel: **Popular habits** (e.g. Morning workout, Meditation, etc.) in a **horizontal scroll** (not flex-wrap).  
- Section: **Goal title / title input** with icon & text field.  
- Section: **Description** text field.  
- Section: **Type / icons row**:
  - Replace flex-wrap with **horizontal carousel** of icons/types.  
  - Selectable states must match theme (pressed card, glow, etc.).
- Section: **Counting type** (Create / Quit etc.).  
- Section: **Categories** (Health, Work, Food, etc.).  
- Section: **Difficulty** (Easy, Medium, Hard).  
- Section: **Reminder** toggle & time.  
- Section: **Streak presets** and AI tips.

**Important**:  
> My current Habit UI code is mostly there. You should **not delete it**.  
> - You may clean it, reorganize it, and add logic.  
> - If you must do a large refactor, move the old implementation into `docs/backup/habit_old.tsx` (for example) instead of deleting it.

### 2.3 Habit data & Goal integration

- When a habit is linked to a goal:
  - Each **completion** should:
    - Update that goal’s current progress (according to goal type).
    - Add an entry in the goal’s history (with date, type = habit, value).
- The weekly habit view should read from a persistent data source and **not reset** on reload.

---

## 3. GOAL SPECIFICATION (THE “HEART” OF THE APP)

Goal is **the central entity** that connects Tasks, Habits, and Finance.  
Think of the Planner as a tree:

- **Goal** = root/roots
- **Habits** and **Tasks** = branches/leaf nodes that grow from the goal

### 3.1 Goal types

Goal has a **main type** which determines its unit and how progress is calculated:

- **“Count” (pieces / items)** – e.g. “Read 10 books”, “Do 30 workouts”.
- **“Sum / Money”** – e.g. “Save \$5,000”, “Invest \$1,000 per month”.
- **“Kilograms / Weight”** – e.g. “Go from 150kg to 100kg”.

The existing stepper UI in Goal screens should:

- Adapt to the chosen goal type (count, sum, kg).  
- Increment/decrement appropriately.  
- Always keep `currentValue`, `targetValue` and **percentage** consistent.

### 3.2 Goal fields

Basic structure:

```ts
type GoalType = "count" | "sum" | "weight";

interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description?: string;
  currentValue: number;
  targetValue: number;
  unit: "pcs" | "kg" | "currency";  // or a more flexible unit system
  // Relations
  taskIds: string[];
  habitIds: string[];
  // Progress & history
  history: GoalEvent[];
}
```

`GoalEvent` example:

```ts
type GoalEventSource = "manual" | "task" | "habit" | "finance";

interface GoalEvent {
  id: string;
  goalId: string;
  date: string;   // ISO
  value: number;
  source: GoalEventSource;
  refId?: string; // taskId, habitId, financeId, etc.
  note?: string;
}
```

### 3.3 Finance integration for “sum” goals

For goals of type **“sum” / money**:

- They must be linked to the **Finance** module.  
- Example: “Buy a car for \$10,000”:
  - Finance screen can add **budgets / contributions** towards this goal.
  - Each contribution updates the goal’s `currentValue` and adds a `GoalEvent` with `source = "finance"`.
- The relationship must be **two-way consistent**:
  - Editing or deleting a finance contribution reflects correctly in the goal’s progress and history.

### 3.4 Progress calculation & display

For **goal-details modal/screen**:

- The progress bar must be filled according to percentage:

```ts
const progress = clamp(currentValue / targetValue, 0, 1);
```

- At creation, progress = 0.  
- As tasks, habits, finance and manual check-ins add value, progress increases.  
- Do **not** show the bar as always full; it should faithfully represent real progress.

### 3.5 Goal as a central hub

In goal-details:

- Show:
  - Goal main info (type, target, current value, unit, etc.).  
  - Linked **tasks** (with status and contributions).  
  - Linked **habits** (with weekly completion and contributions).  
  - **History list** of `GoalEvent` items (current + past).  
- When a **goal-linked task** is completed:
  - Add an event with source `"task"`.
- When a **linked habit** is checked:
  - Add an event with source `"habit"`.
- For finance-linked goals:
  - Contributions show up with source `"finance"`.

---

## 4. DATA PERSISTENCE & ARCHITECTURE

### 4.1 Persistence

A critical requirement: **Goals, Habits, and Tasks must NOT disappear on reload.**

- Use the same persistence approach as the Finance screen:
  - Likely **Realm**, or a hydrated store (e.g. Zustand with async storage).  
- Ensure that all of these are persisted:
  - Goals
  - Habits
  - Tasks
  - Subtasks
  - Recurrence settings
  - GoalEvents (history)
  - Relations between all entities

Make sure no component relies solely on ephemeral `useState` for critical data.

### 4.2 Relations & consistency

- Implement relations in a way that is:
  - Type-safe (TypeScript)
  - Easy to query:
    - e.g. `getTasksForGoal(goalId)`, `getHabitsForGoal(goalId)`
  - Resistant to dangling references (when deleting or archiving items).

- Deletion / archiving logic (high-level rule):
  - Prefer **soft delete** (archive/history) to protect user data.  
  - Only perform hard delete manually from history if needed.

---

## 5. IMPLEMENTATION NOTES & STYLE GUIDELINES

- Framework: **React Native + Expo + Expo Router**.
- Theme: dark, monochrome, with glassy cards as per provided Habit screenshot.
- Icons: use the project’s chosen library consistently (lucide or similar).
- Do **not** abruptly change the overall look & feel:
  - Keep spacing, card shapes, typography in line with existing design.
- If you need to add new components (e.g. dropdowns, carousels):
  - Reuse existing primitives / theme components where possible.
- When doing bigger refactors:
  - Move old files into `docs/backup/` instead of deleting them.

---

## 6. WHAT TO OUTPUT

When implementing or refactoring, the assistant should output:

1. **Updated TypeScript models** for `Goal`, `Habit`, `Task`, `GoalEvent`.  
2. **Updated screens/components** for:
   - Task creation / editing (regular + goal-linked).  
   - Habit creation / editing (aligned with the Figma-like screenshot).  
   - Goal creation / details / progress.  
3. **Storage and hooks** for:
   - Reading & writing goals, habits, tasks, events.  
   - Computing progress and linking entities.  
4. Any **migration helpers** needed to move from old structures to new ones, without losing existing UI.

All code should be clean, strongly typed, and structured for long-term maintainability.
