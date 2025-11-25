import type { FocusSessionDAO, GoalDAO, HabitDAO, TaskDAO } from './PlannerDAO';

export type PlannerDaoRegistry = {
  goals: GoalDAO;
  habits: HabitDAO;
  tasks: TaskDAO;
  focusSessions: FocusSessionDAO;
};

let registry: PlannerDaoRegistry | null = null;

export const setPlannerDaoRegistry = (value: PlannerDaoRegistry | null) => {
  registry = value;
};

export const getPlannerDaoRegistry = () => {
  if (!registry) {
    throw new Error('[PlannerDAO] Registry not initialized');
  }
  return registry;
};

export const hasPlannerDaoRegistry = () => registry !== null;
