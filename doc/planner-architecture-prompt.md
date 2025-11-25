# Planner App - Comprehensive Architecture Prompt

## Project Overview

Build a comprehensive planner application with three core modules: **Goals**, **Habits**, and **Tasks**. These modules are interconnected where Goals serve as the root system, with Habits and Tasks as branches feeding into goal achievement.

---

## 1. TASK MODULE

### 1.1 Task Types

The application supports two distinct task types:

#### A. Standard Task
#### B. Goal-Linked Task

### 1.2 Task Properties (All Types)

**CRITICAL: Existing UI is already implemented. DO NOT remove existing UI code. Only enhance and fix functionality while preserving current UI structure.**

| Property | Description | UI Component | Validation Rules |
|----------|-------------|--------------|------------------|
| **Name** | Task title | Text input | Required, max 100 chars |
| **Description** | Detailed task info | Textarea | Optional, max 500 chars |
| **Goal Association** | Link to goal (optional) | Dropdown | Can be null for standard tasks |
| **Scheduling** | When to execute | Date/Time picker | - Must be future date/time only<br>- Cannot select past dates<br>- Cannot select past time for today<br>- Options: Today, Tomorrow, Custom |
| **Context/Tags** | Categorization | Tag input | Multiple tags, used for filtering by type |
| **Energy Level** | Difficulty rating | Dropdown | Options: Easy, Medium, Hard |
| **Priority** | Importance level | Dropdown | Options: Critical, High, Medium, Low |
| **Finance Link** | Financial category | Dropdown (conditional) | Only shown if task is finance-related<br>Select specific finance category |
| **Reminder** | Push notification | Toggle + Time selector | Push notification at specified time |
| **Repeat/Recurrence** | Auto-repeat interval | Interval selector | Examples:<br>- Every 10 days<br>- Every 1 day (daily)<br>- Every 10 minutes<br>Auto-creates new task instance |
| **Focus Mode** | Enable focus session | Checkbox | When checked, clicking task opens focus mode timer |
| **Subtasks** | Breakdown items | Nested list | Optional checklist items |

### 1.3 Task Behavior Rules

```typescript
// Date/Time Validation Logic
function validateTaskDateTime(selectedDate: Date, selectedTime: Time): boolean {
  const now = new Date();
  
  if (selectedDate < now.toDateString()) {
    return false; // Cannot select past dates
  }
  
  if (selectedDate === now.toDateString() && selectedTime < now.toTimeString()) {
    return false; // Cannot select past time for today
  }
  
  return true;
}

// Goal-Linked Task Behavior
When task is linked to goal:
- Task appears in goal's detail view
- Task completion affects goal progress calculation
- Task is recorded in goal's history (current + historical)
- Progress contribution = (task weight / total goal weight) * 100
```

### 1.4 UI Enhancement Requirements

- **Preserve existing UI**: Do NOT delete current UI code
- **Add dropdowns**: Implement dropdowns for all selection fields
- **Date/Time picker**: Enforce validation rules (no past dates/times)
- **Conditional rendering**: Show finance dropdown only when finance-related is toggled
- **Focus mode integration**: Implement click-to-focus functionality

---

## 2. HABIT MODULE

### 2.1 Habit Properties

**CRITICAL: Existing UI is ready but needs architectural improvements. Use horizontal scroll/carousel instead of flex-wrap. Reference Figma design for layout. Backup old code to `/backup` folder before major changes.**

| Property | Description | UI Component | Notes |
|----------|-------------|--------------|-------|
| **Name** | Habit title | Text input | Required |
| **Description** | Habit details | Textarea | Optional |
| **Type** | Habit category | Horizontal carousel | Predefined: Health, Finance, Productivity, Education, Personal, Custom |
| **Type-Specific Data** | Dynamic fields | Dynamic form | Changes based on selected type |
| **Goal Association** | Link to goal | Dropdown | Optional, directly connects to goal |
| **Frequency** | Tracking period | Selector | Daily, Weekly, Monthly, Custom interval |
| **Tracking View** | Progress display | Calendar/List view | Shows done/missed status per period |

### 2.2 Habit Type System

```typescript
// Type Structure
type HabitType = 'health' | 'finance' | 'productivity' | 'education' | 'personal' | 'custom';

interface HabitTypeConfig {
  type: HabitType;
  icon: IconComponent; // NEED TO ADD: Icons for each type
  dataFields: DynamicField[]; // Type-specific fields
  trackingMetrics: string[]; // What to measure
}

// Type-Specific Examples
Health: {
  dataFields: ['exercise_type', 'duration', 'calories'],
  trackingMetrics: ['completion', 'duration_total']
}

Finance: {
  dataFields: ['amount', 'category', 'budget_id'],
  trackingMetrics: ['total_saved', 'budget_progress']
}

Productivity: {
  dataFields: ['focus_time', 'pomodoro_count'],
  trackingMetrics: ['total_focus_hours', 'completion_rate']
}
```

### 2.3 UI Transformation Required

**Current State**: Using flex-wrap
**Target State**: Horizontal scrollable carousel

```
BEFORE (flex-wrap):
[Health] [Finance] [Productivity]
[Education] [Personal] [Custom]

AFTER (carousel):
← [Health] [Finance] [Productivity] [Education] [Personal] [Custom] →
```

**Implementation Steps:**
1. Backup existing habit.tsx to `/backup/habit_original.tsx`
2. Replace flex-wrap container with horizontal ScrollView/Carousel
3. Add type icons (currently missing)
4. Maintain all existing functionality
5. Match Figma design layout

### 2.4 Habit Tracking Display

Weekly view (default on habit.tsx screen):
```
Mon  Tue  Wed  Thu  Fri  Sat  Sun
✓    ✓    ✗    ✓    —    —    —
(done)(done)(miss)(done)(today)(future)(future)
```

### 2.5 Goal-Linked Habit Behavior

```typescript
When habit is linked to goal:
- Habit completion contributes to goal progress
- Appears in goal's current habits list
- Tracked in goal's history (current + past)
- Progress calculation:
  - Daily: streak_days / target_days
  - Weekly: weeks_completed / target_weeks
  - Monthly: months_completed / target_months
```

---

## 3. GOAL MODULE

### 3.1 Goal as System Core

**Concept**: Goal is the root system of the planner. If the planner is a tree:
- **Goal** = Root (foundation)
- **Habits** = Branches
- **Tasks** = Branches
- All growth flows back to strengthen the root

### 3.2 Goal Types & Units

Goals are measured in three primary unit types:

| Unit Type | Use Cases | Examples | Finance Integration |
|-----------|-----------|----------|-------------------|
| **Dona (Count)** | Quantity-based goals | - Read 50 books<br>- Complete 100 workouts<br>- Finish 10 courses | Can link to budget for purchasing items |
| **Summa (Money)** | Financial goals | - Save $10,000<br>- Earn $5,000 extra<br>- Reduce debt by $20,000 | **Direct finance screen integration**<br>Budget allocation & tracking |
| **Kilogram (Weight)** | Mass-based goals | - Lose 15 kg<br>- Gain 5 kg muscle<br>- Reduce waste by 100 kg | Can link to budget for nutrition/gym |

### 3.3 Goal Properties

**CRITICAL: UI is already complete. Only need to adjust steppers to be dynamic based on goal type (Dona/Summa/Kilogram). All goal types connect to finance screen.**

| Property | Description | Implementation |
|----------|-------------|----------------|
| **Type** | Unit of measurement | Dropdown: Dona, Summa, Kilogram |
| **Target Value** | End goal amount | Number input (changes label based on type) |
| **Current Value** | Progress tracker | Auto-calculated from linked tasks/habits |
| **Stepper Components** | Progress increments | **Dynamic**: Adjust based on goal type<br>- Dona: +1, +5, +10<br>- Summa: +100, +1000, +5000<br>- Kilogram: +0.5, +1, +5 |
| **Linked Tasks** | Contributing tasks | List view in goal-details |
| **Linked Habits** | Contributing habits | List view in goal-details |
| **Budget** | Financial allocation | **Finance screen connection**<br>Example: "Buy car" goal → allocate monthly budget |
| **History** | Progress timeline | Current + Historical view |

### 3.4 Goal-Finance Integration

```typescript
// Finance Integration Flow
Goal (Type: Summa) "Buy Car - $30,000"
  ↓
Finance Screen:
  - Budget: Monthly allocation ($500/month)
  - Current savings: $8,500
  - Projected completion: 43 months
  - Linked transactions: All savings deposits
  
Goal Progress:
  - Progress bar: 28.3% ($8,500 / $30,000)
  - Contributions from:
    * Linked Task: "Freelance project" → +$2,000
    * Linked Habit: "Daily savings" → +$150/month
    * Manual updates from finance screen
```

### 3.5 Goal Progress Calculation

```typescript
function calculateGoalProgress(goal: Goal): number {
  let totalProgress = 0;
  
  // From completed tasks
  goal.linkedTasks.forEach(task => {
    if (task.completed) {
      totalProgress += task.contributionWeight;
    }
  });
  
  // From habit completions
  goal.linkedHabits.forEach(habit => {
    const completionRate = habit.completedCount / habit.targetCount;
    totalProgress += habit.contributionWeight * completionRate;
  });
  
  // From direct stepper updates
  totalProgress += goal.manualProgress;
  
  // From finance contributions (for Summa type)
  if (goal.type === 'summa') {
    totalProgress += goal.financeContributions;
  }
  
  return (totalProgress / goal.targetValue) * 100;
}
```

### 3.6 Goal Details Screen

```
Goal Details View:
├── Header (Name, Type, Progress %)
├── Progress Stepper (Dynamic based on type)
├── Current Status
│   ├── Active Tasks (list)
│   ├── Active Habits (list)
│   └── Recent Contributions
├── History
│   ├── Completed Tasks (timeline)
│   ├── Habit Streaks (timeline)
│   └── Milestones Achieved
└── Finance Panel (if type = Summa)
    ├── Budget Allocation
    ├── Spending vs Saving
    └── Transaction History
```

---

## 4. SYSTEM INTERCONNECTIONS

### 4.1 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         GOAL                            │
│  (Root: Type = Dona/Summa/Kilogram)                    │
│  - Target: 50                                           │
│  - Current: 23 (46%)                                    │
└──────────────┬────────────────────────┬─────────────────┘
               │                        │
       ┌───────▼────────┐       ┌──────▼──────────┐
       │     TASKS      │       │     HABITS      │
       │  (Branches)    │       │   (Branches)    │
       ├────────────────┤       ├─────────────────┤
       │ Task A: +5     │       │ Daily: +1/day   │
       │ Task B: +10    │       │ Weekly: +7/week │
       │ Task C: +3     │       └─────────────────┘
       └────────────────┘
               │                        │
               └────────────┬───────────┘
                            │
                   ┌────────▼─────────┐
                   │  PROGRESS: 23/50 │
                   │     (46%)        │
                   └──────────────────┘
```

### 4.2 Screen Navigation Flow

```
Main Navigation (Bottom Tabs):
├── Tasks Screen
│   ├── Create Task (Standard or Goal-Linked)
│   ├── Task List (Filtered by context/tags)
│   └── Task Details → Focus Mode (if enabled)
│
├── Habits Screen
│   ├── Create Habit (Type selection carousel)
│   ├── Habit List (Weekly tracking view)
│   └── Habit Details → Tracking Calendar
│
├── Goals Screen ⭐ (Primary Hub)
│   ├── Create Goal (Type: Dona/Summa/Kilogram)
│   ├── Goal List (All active goals)
│   └── Goal Details
│       ├── Linked Tasks (from Tasks screen)
│       ├── Linked Habits (from Habits screen)
│       ├── Progress Stepper (dynamic)
│       └── History (current + past)
│
└── Finance Screen
    ├── Budget Management
    ├── Transaction History
    └── Goal-Linked Budgets (Summa type goals)
```

---

## 5. TECHNICAL REQUIREMENTS

### 5.1 Code Quality Standards

```typescript
// CRITICAL RULES
1. DO NOT delete existing UI code
2. Preserve all current functionality
3. Only add/enhance, never remove without backup
4. Use TypeScript for type safety
5. Follow component-based architecture
```

### 5.2 Required Implementations

#### High Priority
- [ ] Task date/time validation (no past dates/times)
- [ ] Habit type icons (currently missing)
- [ ] Habit UI transformation (flex-wrap → carousel)
- [ ] Goal stepper dynamic adjustment (Dona/Summa/Kilogram)
- [ ] Goal-Finance integration (budget allocation)
- [ ] Progress calculation engine (tasks + habits → goal)

#### Medium Priority
- [ ] Dropdown components for all selectors
- [ ] Focus mode integration
- [ ] Push notification system (reminders)
- [ ] Repeat/recurrence logic (auto-create tasks)
- [ ] History tracking system (current + past)

#### Enhancement
- [ ] Tag-based filtering system
- [ ] Search functionality
- [ ] Data export/import
- [ ] Analytics dashboard

### 5.3 Backup Protocol

Before making major changes:
```bash
# Create backup folder structure
/backup
  ├── habit_original.tsx
  ├── task_original.tsx
  ├── goal_original.tsx
  └── README.md (document changes)
```

---

## 6. IMPLEMENTATION APPROACH

### Phase 1: Foundation (Week 1)
1. Audit existing UI code
2. Create backup of all current files
3. Set up TypeScript interfaces for all modules
4. Implement data validation layer

### Phase 2: Task Module (Week 2)
1. Add date/time validation
2. Implement dropdowns
3. Add focus mode integration
4. Build repeat/recurrence system
5. Test goal-linking functionality

### Phase 3: Habit Module (Week 3)
1. Add type icons
2. Transform UI to carousel layout
3. Implement type-specific data fields
4. Build tracking calendar
5. Test goal-linking functionality

### Phase 4: Goal Module (Week 4)
1. Implement dynamic steppers
2. Build progress calculation engine
3. Create goal-details view
4. Integrate finance screen
5. Test entire interconnected system

### Phase 5: Polish & Testing (Week 5)
1. Cross-module testing
2. Performance optimization
3. UI/UX refinements
4. Documentation
5. Deployment preparation

---

## 7. SUCCESS METRICS

The implementation is successful when:

✅ All modules are interconnected (Goal ← Tasks + Habits)
✅ Progress flows correctly from branches to root
✅ Finance integration works for Summa-type goals
✅ UI matches Figma design while preserving functionality
✅ No existing features are broken or removed
✅ Date/time validation prevents past selections
✅ Habit carousel works smoothly
✅ Goal steppers adjust dynamically
✅ History tracking captures all changes
✅ System is scalable and maintainable

---

## 8. FINAL NOTES

**Design Philosophy**: 
Think of this planner as an ecosystem where:
- **Goals** are the foundation (roots)
- **Tasks & Habits** nourish the goals (branches)
- **Progress** flows upward (nutrients)
- **Achievement** is the fruit (visible growth)

**Development Approach**:
- Professional, production-ready code
- Preserve existing work
- Enhance, don't rebuild
- Test thoroughly
- Document extensively

**User Experience**:
- Intuitive navigation
- Clear visual feedback
- Seamless interconnections
- Motivating progress tracking
- Professional polish

---

*End of Architecture Prompt*

**Next Steps**: Use this prompt with Claude, Codex, or other AI assistants to implement the architecture professionally while preserving existing UI and adding required functionality.