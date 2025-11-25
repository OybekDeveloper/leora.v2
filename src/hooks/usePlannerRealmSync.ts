import { useEffect } from 'react';
import { useRealm } from '@/utils/RealmContext';
import { usePlannerDaos } from './usePlannerDaos';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { setPlannerDaoRegistry } from '@/database/dao/plannerDaoRegistry';

export const usePlannerRealmSync = () => {
  const realm = useRealm();
  const daos = usePlannerDaos();
  const hydrate = usePlannerDomainStore((state) => state.hydrateFromRealm);

  useEffect(() => {
    if (!realm || realm.isClosed) {
      return;
    }
    setPlannerDaoRegistry(daos);
    const emitSnapshot = () => {
      if (!realm || realm.isClosed) {
        hydrate({
          goals: [],
          habits: [],
          tasks: [],
          focusSessions: [],
        });
        return;
      }
      const goals = daos.goals.list();
      const habits = daos.habits.list();
      const tasks = daos.tasks.list();
      const focusSessions = daos.focusSessions.list();

      // Avoid wiping hydrated Zustand state if Realm is empty (first run)
      if (goals.length === 0 && habits.length === 0 && tasks.length === 0 && focusSessions.length === 0) {
        const existing = usePlannerDomainStore.getState();
        if (existing.goals.length || existing.habits.length || existing.tasks.length || existing.focusSessions.length) {
          return;
        }
      }

      hydrate({
        goals,
        habits,
        tasks,
        focusSessions,
      });
    };

    emitSnapshot();

    const collections = realm.isClosed
      ? []
      : [
          realm.objects('Goal'),
          realm.objects('Habit'),
          realm.objects('Task'),
          realm.objects('FocusSession'),
        ];

    collections.forEach((collection) => collection.addListener(emitSnapshot));

    return () => {
      collections.forEach((collection) => collection.removeListener(emitSnapshot));
      setPlannerDaoRegistry(null);
    };
  }, [realm, daos, hydrate]);
};
