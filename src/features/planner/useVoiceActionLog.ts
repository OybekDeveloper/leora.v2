import { create } from 'zustand';

export type PlannerVoiceGoal = {
  id: string;
  title: string;
  deadlineLabel?: string;
};

export type PlannerVoiceHabit = {
  id: string;
  title: string;
  schedule?: string;
};

type PlannerVoiceActionStore = {
  goals: PlannerVoiceGoal[];
  habits: PlannerVoiceHabit[];
  logGoal: (goal: PlannerVoiceGoal) => void;
  logHabit: (habit: PlannerVoiceHabit) => void;
};

const MAX_LOG = 10;

export const usePlannerVoiceActionStore = create<PlannerVoiceActionStore>((set) => ({
  goals: [],
  habits: [],
  logGoal: (goal) =>
    set((state) => ({
      goals: [goal, ...state.goals].slice(0, MAX_LOG),
    })),
  logHabit: (habit) =>
    set((state) => ({
      habits: [habit, ...state.habits].slice(0, MAX_LOG),
    })),
}));
