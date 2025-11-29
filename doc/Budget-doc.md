# BUDGET–PLANNER INTEGRATION & FIX TASK (FULL PROJECT ANALYSIS REQUIRED)

This document is a full specification and prompt for AI (Claude/Codex) to:
- analyze the whole project,
- fix the Budget system,
- integrate Budget with Transactions, Categories, Goals, Habits, and Tasks,
- and maintain a rollback document for all code changes.

---

## 1. CURRENT PROBLEM

The current **Budget** implementation is broken:

- When creating a Budget (spending or saving), it is not connected to:
  - transactions,
  - transfers (income/outcome),
  - categories,
  - or Planner entities (goals/habits/tasks).
- Adding value to the Budget does nothing.
- Any transfer or transaction in the correct category does NOT cause the Budget to grow or change.
- ProgressIndicators use incorrect data (often all days / 100%) instead of the correct scope (like chosen date or budget period).

**Summary:**  
The Budget is not linked to anything, does not change, and does not reflect real finance activity.

---

## 2. DESIRED BUDGET BEHAVIOR

### 2.1 Budget types

There are two main modes:

#### a) Spending Budget (“xarajat”)

- Created when the user chooses **expense** type.
- The user selects a category (e.g., Food).
- Any **category-related activity** such as:
  - expenses,
  - transfers,
  - income/outcome movements involving that category
  must be reflected in this Budget.
- Example:
  - Category: Food
  - Every Food-related outcome/transaction updates this Budget’s spending and progress.

#### b) Saving Budget (“jamg‘arma”)

- Created when the user chooses **saving/income** type.
- It accumulates money over time for a particular purpose (e.g., buying a car, Umrah).
- It is also tied to some category (Car, Health, etc.).
- It grows when:
  - The user directly adds value via an **add value** action on the Budget,
  - The user adds value to a linked Goal,
  - The user uses transfers or other movements that should contribute to this Budget.
- If linked to a Goal:
  - Adding value to the Goal increases the Budget.
  - Adding value to the Budget increases the Goal’s progress.

---

### 2.2 Category-based behavior

- For **Spending** Budgets:
  - Choose a category (Food, Transport, etc.).
  - All activity for that category (transactions, transfers, outcomes) should:
    - count toward this Budget’s usage,
    - adjust its internal fields (`spentAmount`, `remainingAmount`, `percentUsed`).
- For **Saving** Budgets:
  - Choose a category related to the savings purpose.
  - All contributions for that category should:
    - increase its `contributedAmount`,
    - move it toward its target amount.

---

### 2.3 Integration with Goals, Habits, and Tasks

- A Saving Budget can be linked directly to a Goal:
  - Adding value to the Goal must update the Budget.
  - Adding value to the Budget must update the Goal’s progress.
- Habits and Tasks can have financial effects:
  - Completion can add savings to a Saving Budget.
  - Completion can add spending to a Spending Budget.
- Right now, this entire linkage is missing or non-functional:
  - Budgets are not affected by goals/habits/tasks.
  - Budgets do not respond to transfers or category-based changes.

---

## 3. YOUR JOB (FOR THE AI)

You must:

1. **Analyze the entire project**  
   - Find where Budgets, Transactions, Categories, Goals, Habits, Tasks are defined and managed.
   - Understand existing store/state management.
   - Understand current (even if broken) Budget logic.

2. **Design a clean data flow**  
   - For Spending Budgets: define how category-based events update them.
   - For Saving Budgets: define how contributions (from Goal, Budget “add value”, transfers) update them.
   - For Planner: define how goals/habits/tasks call into Budget logic.

3. **Implement the logic**  
   - Connect Budgets to:
     - category-based transactions/transfers,
     - Planner actions,
     - manual value additions.
   - Implement recalculation functions that:
     - recompute `spentAmount`, `remainingAmount`, `percentUsed` for spending budgets,
     - recompute `contributedAmount`, `remainingAmount`, `percentSaved` for saving budgets.
   - Hook these recalculation functions into the appropriate events (transaction created/updated/deleted, goal/habit/task changes, manual add value).

4. **Fix UI and ProgressIndicators**  
   - Ensure Budget-related widgets and ProgressIndicators:
     - use the correctly updated budget state,
     - respect date filters or budget periods,
     - no longer show constant 100% or global data.

5. **Keep everything in sync**  
   - Budget ↔ Transactions
   - Budget ↔ Categories
   - Budget ↔ Goals
   - Budget ↔ Habits / Tasks
   - Budget ↔ Widgets / ProgressIndicators

---

## 4. STEP-BY-STEP EXECUTION PLAN

You must work in **phases** and not move to the next phase until the current one is complete:

1. **Phase 1 – Project Analysis**
   - Locate all relevant modules.
   - Produce a short internal summary (in comments or rollback doc).

2. **Phase 2 – Data Flow Design**
   - Describe which functions and layers will handle:
     - category events,
     - transaction events,
     - planner events.

3. **Phase 3 – Core Budget Logic**
   - Implement recalculation and update functions.
   - Wire them into stores and APIs.

4. **Phase 4 – Category & Planner Integration**
   - Ensure budgets update from goals/habits/tasks and category-based transactions.

5. **Phase 5 – UI & Progress Fix**
   - Fix widgets and ProgressIndicators to reflect correct, filtered budget data.

6. **Phase 6 – Final Review**
   - Run through scenarios:
     - spending budget with category,
     - saving budget tied to a goal,
     - habit/task-triggered finance actions,
     - manual add value, transfers, etc.

---

## 5. ROLLBACK / CHANGE-LOG DOCUMENT

As you modify the code, you must maintain a document for manual rollback, e.g.:

`docs/budget_integration_changes.md`

Each entry should include:

- File path
- Short description of the change
- Before (original behavior/snippet)
- After (new behavior/snippet)

This allows me to revert your changes later if needed.

Do not consider this task complete until:
- The Budget behaves as described,
- And this rollback document is fully updated.

---

## 6. RULES

- Do NOT change the conceptual meaning of Spending vs Saving Budgets.
- Do NOT remove existing functionality (only fix or correctly wire it).
- Do NOT skip phases or leave partial integrations.
- Focus on:
  - correctness,
  - stability,
  - clear data flow,
  - and traceability through the rollback doc.
