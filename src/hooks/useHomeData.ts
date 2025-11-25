import type { Goal, ProgressData, Task } from '@/types/home';
import { useCallback, useEffect, useState } from 'react';

interface HomeData {
  tasks: Task[];
  goals: Goal[];
  progress: ProgressData;
  loading: boolean;
  error: Error | null;
}

export function useHomeData(): HomeData {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<ProgressData>({
    tasks: 50,
    budget: 62,
    focus: 75,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace mock data with API call
      setTasks([]);
      setGoals([]);
      setProgress((prev) => ({ ...prev }));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHomeData();
  }, [fetchHomeData]);

  return { tasks, goals, progress, loading, error };
}
