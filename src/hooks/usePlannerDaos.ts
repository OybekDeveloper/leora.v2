import { useMemo } from 'react';
import { useRealm } from '@/utils/RealmContext';
import { FocusSessionDAO, GoalDAO, HabitDAO, TaskDAO } from '@/database/dao/PlannerDAO';

export const usePlannerDaos = () => {
  const realm = useRealm();

  return useMemo(
    () => ({
      goals: new GoalDAO(realm),
      habits: new HabitDAO(realm),
      tasks: new TaskDAO(realm),
      focusSessions: new FocusSessionDAO(realm),
    }),
    [realm],
  );
};
