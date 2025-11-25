# PlannerTasksTab Restore Guide

- **Backup file:** `docs/backup/PlannerTasksTab-old.tsx`
- **Updated file:** `app/(tabs)/(planner)/(tabs)/index.tsx`
- **Related new helper:** `src/features/planner/hooks/usePlannerTasksForDay.ts`

## What changed
- Planner tasks tab now reads daily data via a typed hook that centralizes filtering, grouping, and summary counts from the persistent `usePlannerDomainStore` instead of template data.
- History rendering uses the persisted `taskHistory` log with restore/remove actions, keeping archived/completed entries stable across reloads.
- Daily summary counts (tasks/habits/goals) now come from real goals/habits/tasks scheduled for the selected day, aligning with the planner spec while leaving UI intact.
- Actions were rewired to domain store commands (`restoreTaskFromHistory`, `removeHistoryEntry`) to avoid stale references and keep goal/habit links consistent.

## How to restore the old screen
1. Copy the backup over the current screen:
   - `cp docs/backup/PlannerTasksTab-old.tsx app/(tabs)/(planner)/(tabs)/index.tsx`
2. Remove the helper hook import from the restored file if present.
3. Optionally delete `src/features/planner/hooks/usePlannerTasksForDay.ts` if it is no longer used anywhere else.
4. Restart Metro/bundler to pick up the restored file.

## How to cherry-pick/merge changes
- To keep the old layout but use the new data flow, import and call `usePlannerTasksForDay` in your version of the screen for grouped tasks, history, and summary counts.
- If you want the new history behavior only, wire the history list to `usePlannerDomainStore().taskHistory` and use `restoreTaskFromHistory`/`removeHistoryEntry` for the swipe actions.
- If you prefer the previous deletion semantics, swap `removeHistoryEntry` with `deleteTaskPermanently`, but keep the derived summary counts from the new hook.

## Compatibility notes
- The new screen assumes `usePlannerDomainStore` is hydrated (MMKV/Realm) and that `taskHistory` is persisted; restoring the old file will drop those safeguards.
- `usePlannerTasksForDay` depends on `useSelectedDayStore`; if you remove the hook, ensure any replacement still normalizes the selected date to avoid off-by-one filtering.
