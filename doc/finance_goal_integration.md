# Finance-Goal Integration Tasks

## Task 1: Move Finance Modals to Proper Location

PRIORITY: Do this first before other tasks.

Find all add/edit modals in the finance page (like add transaction, edit budget, add category, etc).

Move them to the proper modal folder structure: (modals)/finance/

Structure should match how add-account modal is organized. Each finance modal should be in its own folder under (modals)/finance/:
- (modals)/finance/transaction =>TransactionModal
- (modals)/finance/budget => budget screen CustomSheet Modal
- (modals)/finance/quick-exp=>IncomeOutcomeModal
- (modals)/finance/filter-transaction =>FilterTransactionSheet
- etc.

Update all imports and navigation paths after moving the files.

---

## Task 2: Add Back Navigation After Habit Check-in from Goal Details

When user is in goal-details screen and checks in a habit (marks it as done), after the check-in is complete, navigate back to the previous screen automatically.

Find the habit check-in handler in goal-details screen.
After successful check-in, add navigation back: router.back() or equivalent.

User flow should be:
- User opens goal-details
- Clicks on a habit to check it in
- Habit is marked as done
- Screen automatically returns to goal-details view

---

## Task 3: Finance-Goal Transaction Tracking

When user creates a goal that is linked to a finance category, all financial changes related to that goal must appear in two places:
1. Finance page transactions list
2. Goal-details activity/history tab

Implementation requirements:

**3.1 Finance Page Transactions**
- When goal is linked to finance category (like Budget, Savings, Investment)
- Any money added to that goal should create a transaction entry in finance page
- Transaction should show: amount, date, goal name, category
- Transaction type should be marked as "Goal Contribution" or similar

**3.2 Goal-Details Activity**
- Same transaction must also appear in goal-details screen under activity or history tab
- Should show when money was added, how much, from which budget/category
- If transaction is edited in finance page, it should update in goal-details too
- If transaction is deleted in finance page, it should be removed from goal-details too

**3.3 Bidirectional Sync**
- Changes in finance page affect goal progress
- Changes in goal (check-in with amount) affect finance transactions
- Keep both places synchronized at all times

---

## Task 4: Budget Selection and Creation Flow

**Scenario 1: Goal Creation with Budget**
When user creates a goal that needs a budget (like "Save money for car"):
- Show budget selector dropdown
- List all available budgets user has created
- If no budgets exist, or user wants new one, show option to create budget

**Scenario 2: Budget Doesn't Exist**
If user selects "Create New Budget" or chosen budget doesn't exist:
- Open add-budget modal immediately (the one you moved to modals/finance)
- User creates budget in the modal
- After budget is created, automatically link it to the goal
- Close modal and return to goal creation with budget now selected

**Scenario 3: Adding Money to Budget from Goal**
When user does "check-in today" on a goal that has budget linked:
- If budget is already linked, add the amount directly to that budget
- Create transaction record in both finance and goal-details
- Update goal progress bar
- If NO budget is linked yet, show modal asking "Which budget should this go to?"
- User selects budget from list or creates new one
- Then add the amount to selected budget

**Scenario 4: Money Transfer from Budget**
When user transfers money from budget to goal in finance page:
- Update goal progress immediately
- Create transaction visible in goal-details
- Show notification or confirmation

**Key Requirements:**
- Budget modal should open inline (not navigate to new page)
- After creating budget, user stays in current flow (goal creation or check-in)
- No broken navigation - user should complete their original task
- All transactions must be recorded in both finance and goal screens

---

## Task 5: Transaction Visibility Rules

Make sure transactions appear correctly:

**In Finance Page:**
- Show ALL finance-related transactions
- Include manual transactions
- Include goal-linked transactions (mark them with goal icon or tag)
- Group by date or category as usual

**In Goal-Details Activity Tab:**
- Show ONLY transactions related to this specific goal
- Include manual check-ins
- Include budget contributions
- Include habit completions that affect goal
- Show task completions that contribute to goal
- Sort by date, newest first

**Transaction Properties to Track:**
- Amount (money added or deducted)
- Date/time
- Source (manual, budget transfer, habit, task)
- Goal ID (for filtering)
- Budget/Category ID (for finance page)
- Description/note
- Transaction type (contribution, withdrawal, transfer)

---

## Summary of Changes Needed:

1. Move all finance modals to (modals)/finance/ folder structure
2. Add auto-navigation back after habit check-in in goal-details
3. Create transaction records for goal-finance interactions
4. Show transactions in both finance page and goal-details
5. Add budget selection dropdown in goal creation
6. Open budget creation modal when budget doesn't exist
7. Handle budget linking during goal check-in
8. Sync all changes bidirectionally between finance and goal screens

Test the complete flow:
- Create goal with finance category
- Add budget or select existing
- Do check-in from goal (add money)
- Verify transaction appears in finance page
- Verify transaction appears in goal-details
- Edit transaction in finance, check it updates in goal
- Transfer money from budget, check goal progress updates
