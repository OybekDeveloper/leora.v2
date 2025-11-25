# Goal Direction Fix - Documentation

## Problem Statement
The goal creation validation was blocking users from creating "decrease" goals (e.g., weight loss from 150kg → 100kg) because it enforced that target values must be greater than current values.

## Root Cause
The validation logic assumed all goals were "increase" type goals and rejected any case where `target < current`.

## Solution Overview
Implemented proper support for bidirectional goals by:
1. Removing incorrect validation constraints
2. Automatically determining goal direction based on target vs current values
3. Fixing progress calculation logic to respect goal direction
4. Updating financial progress calculations for budget and debt-linked goals

---

## Changes Made

### 1. GoalModal.tsx - Validation Logic
**File:** `src/components/modals/planner/GoalModal.tsx`

**Lines Modified:** 269-298

**Changes:**
- ❌ Removed: `if (formData.targetValue <= 0)` validation
- ✅ Added: `if (isNaN(formData.targetValue))` validation
- Simplified equality check to allow any numeric values

**Result:**
- Users can now create goals with target < current (decrease goals)
- Users can now create goals with target > current (increase goals)
- Validation only ensures target is a valid number and different from current

---

### 2. Goal Direction Calculation
**File:** `src/components/modals/planner/GoalModal.tsx`

**Lines:** 318-331 (already existed, no changes needed)

**Logic:**
```typescript
const calculateDirection = (): 'increase' | 'decrease' | 'neutral' => {
  if (formData.targetValue > formData.currentValue) {
    return 'increase';
  } else if (formData.targetValue < formData.currentValue) {
    return 'decrease';
  } else {
    return 'neutral';
  }
};
```

**Result:**
- Direction is automatically set when goal is created/updated
- No user input required for direction

---

### 3. Display Logic - "Left" Value Calculation
**File:** `src/features/planner/goals/data.ts`

**Lines Modified:** 104-114

**Changes:**
```typescript
// Before:
const leftValue = Math.max(targetValue - currentValue, 0);

// After:
const leftValue =
  targetValue != null && currentValue != null
    ? goal.direction === 'decrease'
      ? Math.max(currentValue - targetValue, 0) // For decrease goals
      : Math.max(targetValue - currentValue, 0) // For increase goals
    : undefined;
```

**Examples:**
- **Increase goal** (Save $5000): Current $1000 → Target $5000 = **$4000 left**
- **Decrease goal** (Lose weight): Current 150kg → Target 100kg = **50kg left**

---

### 4. Financial Progress Calculation - Budget Goals
**File:** `src/services/financePlannerLinker.ts`

**Lines Modified:** 57-86

**Changes:**
- Added direction-aware progress calculation for budget-linked goals
- Different formulas for increase vs decrease goals

**Logic:**
```typescript
if (goal.direction === 'increase') {
  // For savings goals: progress = (current - initial) / (target - initial)
  const gained = budget.spentAmount - goal.initialValue;
  const needed = goal.targetValue - goal.initialValue;
  newProgressPercent = needed > 0 ? Math.min(gained / needed, 1) : 0;
} else if (goal.direction === 'decrease') {
  // For spend-limiting goals: progress = (initial - current) / (initial - target)
  const reduced = goal.initialValue - budget.spentAmount;
  const needed = goal.initialValue - goal.targetValue;
  newProgressPercent = needed > 0 ? Math.min(reduced / needed, 1) : 0;
}
```

**Result:**
- Savings goals correctly track progress as money accumulates
- Budget-limiting goals correctly track progress as spending decreases

---

### 5. Financial Progress Calculation - Debt Goals
**File:** `src/services/financePlannerLinker.ts`

**Lines Modified:** 113-138

**Changes:**
- Added direction-aware progress calculation for debt-linked goals
- Proper tracking of debt payoff progress

**Logic:**
```typescript
if (goal.direction === 'decrease') {
  // For debt payoff goals: progress = (initial - remaining) / (initial - target)
  const remaining = debt.principalAmount - totalPaid;
  const reduced = goal.initialValue - remaining;
  const needed = goal.initialValue - goal.targetValue;
  newProgressPercent = needed > 0 ? Math.min(reduced / needed, 1) : 0;
}
```

**Result:**
- Debt payoff goals correctly track progress as payments are made
- Progress calculation respects initial debt amount and target payoff amount

---

## Type System

**File:** `src/domain/planner/types.ts`

The following types already existed (no changes needed):

```typescript
export type GoalDirection = 'increase' | 'decrease' | 'neutral';

export interface Goal {
  // ... other fields
  direction?: GoalDirection;
  initialValue?: number;
  targetValue?: number;
  // ... other fields
}
```

---

## Testing Scenarios

### ✅ Scenario 1: Weight Loss Goal (Decrease)
- **Input:** Current 150kg → Target 100kg
- **Expected:** Direction = 'decrease', Left = 50kg
- **Progress:** Updates correctly as weight decreases

### ✅ Scenario 2: Savings Goal (Increase)
- **Input:** Current $1000 → Target $5000
- **Expected:** Direction = 'increase', Left = $4000
- **Progress:** Updates correctly as savings increase

### ✅ Scenario 3: Debt Payoff (Decrease)
- **Input:** Current $10,000 → Target $0
- **Expected:** Direction = 'decrease', Left = $10,000
- **Progress:** Updates correctly as payments are made

### ✅ Scenario 4: Budget Limit (Decrease)
- **Input:** Current $2000 spent → Target $1000 spent
- **Expected:** Direction = 'decrease', Left = $1000
- **Progress:** Updates correctly as spending is controlled

---

## Files Modified

1. ✅ `src/components/modals/planner/GoalModal.tsx` - Validation logic
2. ✅ `src/features/planner/goals/data.ts` - Display calculation
3. ✅ `src/services/financePlannerLinker.ts` - Financial progress tracking

---

## Migration Notes

### For Existing Goals
Goals created before this fix may not have a `direction` field set. The system handles this gracefully:

1. **GoalModal:** When editing an existing goal, direction will be recalculated on save
2. **Display Logic:** Falls back to increase logic if direction is undefined
3. **Financial Progress:** Falls back to simple percentage if direction is undefined

### Recommendation
Consider running a migration script to set `direction` for all existing goals:

```typescript
goals.forEach(goal => {
  if (!goal.direction && goal.targetValue && goal.initialValue) {
    const direction =
      goal.targetValue > goal.initialValue ? 'increase' :
      goal.targetValue < goal.initialValue ? 'decrease' :
      'neutral';
    updateGoal(goal.id, { direction });
  }
});
```

---

## Performance Impact
- ✅ No significant performance impact
- ✅ All calculations remain O(1)
- ✅ No additional API calls required

---

## Validation Rules Summary

### Before Fix
- ❌ Target must be > 0
- ❌ Target must be >= current
- ✅ Target must be different from current

### After Fix
- ✅ Target must be a valid number (any value)
- ✅ Target must be different from current
- ✅ Automatic direction detection

---

## Conclusion

The fix successfully enables both increase and decrease goals while maintaining data integrity and proper progress tracking. All goal types (financial, health, education, productivity, personal) now support bidirectional goal setting.
