import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useLockStore } from '@/stores/useLockStore';
const LOCK_ROUTE = '/(modals)/lock';

interface UserInactiveContextValue {
  registerActivity: () => void;
}

const UserInactiveContext = createContext<UserInactiveContextValue>({
  registerActivity: () => undefined,
});

export const useUserInactive = () => useContext(UserInactiveContext);

export function UserInactiveProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const isLoggedIn = useLockStore((state) => state.isLoggedIn);
  const isLocked = useLockStore((state) => state.isLocked);
  const setLocked = useLockStore((state) => state.setLocked);
  const updateLastActive = useLockStore((state) => state.updateLastActive);
  const setLastBackgrounded = useLockStore((state) => state.setLastBackgrounded);
  const lastBackgrounded = useLockStore((state) => state.lastBackgrounded);
  const lockEnabled = useLockStore((state) => state.lockEnabled);
  const lastActive = useLockStore((state) => state.lastActive);
  const autoLockTimeoutMs = useLockStore((state) => state.autoLockTimeoutMs);
  const unlockGraceMs = useLockStore((state) => state.unlockGraceMs);

  const currentModalRef = useRef<string | null>(null);
  const lastAppStateRef = useRef<AppStateStatus>(AppState.currentState ?? 'active');
  const isMountedRef = useRef(false);
  const [lockHydrated, setLockHydrated] = useState(() => {
    const hasHydrated = useLockStore.persist?.hasHydrated?.();
    if (typeof hasHydrated === 'boolean') {
      return hasHydrated;
    }
    return true;
  });

  useEffect(() => {
    if (lockHydrated) return;
    const finishHydration = () => setLockHydrated(true);
    useLockStore.persist?.onFinishHydration?.(finishHydration);
  }, [lockHydrated]);

  const dismissModal = useCallback(() => {
    if (!lockHydrated) return;
    if (currentModalRef.current) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
      currentModalRef.current = null;
    }
  }, [lockHydrated, router]);

  const presentModal = useCallback(
    (route: string) => {
      if (currentModalRef.current === route) return;
      if (!isMountedRef.current) return;
      if (!lockHydrated) return;

      dismissModal();
      // Use setTimeout to ensure navigation happens after the Root Layout is mounted
      setTimeout(() => {
        if (isMountedRef.current) {
          router.push(route);
          currentModalRef.current = route;
        }
      }, 0);
    },
    [dismissModal, lockHydrated, router]
  );

  const handleActivity = useCallback(() => {
    if (!lockHydrated) return;
    if (!isLoggedIn || isLocked) return;
    updateLastActive();
  }, [isLocked, isLoggedIn, lockHydrated, updateLastActive]);

  // Track when component is mounted
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!lockHydrated) {
      return;
    }

    if (!isLoggedIn) {
      dismissModal();
      setLocked(false);
      setLastBackgrounded(null);
      return;
    }
  }, [dismissModal, isLoggedIn, lockHydrated, setLastBackgrounded, setLocked]);

  useEffect(() => {
    if (!lockHydrated) {
      return;
    }
    if (!isLoggedIn || !lockEnabled) {
      return;
    }

    if (autoLockTimeoutMs <= 0) {
      return;
    }

    const shouldLock =
      typeof lastActive === 'number' && Date.now() - lastActive >= autoLockTimeoutMs;

    if (shouldLock && !isLocked) {
      setLocked(true);
    }
  }, [autoLockTimeoutMs, isLoggedIn, isLocked, lastActive, lockEnabled, lockHydrated, setLocked]);

  useEffect(() => {
    if (!lockHydrated) {
      return;
    }
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (!isLoggedIn) {
        lastAppStateRef.current = nextState;
        return;
      }

      const prevState = lastAppStateRef.current;

      if (nextState === 'inactive') {
        updateLastActive();
      }

      if (nextState === 'background') {
        setLastBackgrounded(Date.now());
        updateLastActive();
      }

      if (prevState === 'background' && nextState === 'active') {
        const elapsed = lastBackgrounded ? Date.now() - lastBackgrounded : 0;
        const exceededAutoLock =
          autoLockTimeoutMs > 0 ? elapsed >= autoLockTimeoutMs : false;
        const exceededUnlockGrace = elapsed >= unlockGraceMs;
        const shouldLock =
          lockEnabled && (exceededAutoLock || exceededUnlockGrace);

        if (shouldLock) {
          setLocked(true);
          presentModal(LOCK_ROUTE);
          setLastBackgrounded(null);
          updateLastActive();
        } else {
          setLocked(false);
          dismissModal();
          updateLastActive();
          setLastBackgrounded(null);
        }
      } else if (prevState === 'inactive' && nextState === 'active') {
        updateLastActive();
      }

      lastAppStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [
    dismissModal,
    autoLockTimeoutMs,
    isLoggedIn,
    lastBackgrounded,
    lockEnabled,
    lockHydrated,
    presentModal,
    setLastBackgrounded,
    setLocked,
    unlockGraceMs,
    updateLastActive,
  ]);

  useEffect(() => {
    if (!lockHydrated) {
      return;
    }
    if (!isLoggedIn) return;

    if (isLocked && lockEnabled) {
      presentModal(LOCK_ROUTE);
    } else if (currentModalRef.current === LOCK_ROUTE) {
      currentModalRef.current = null;
    }

    if (isLocked && !lockEnabled) {
      setLocked(false);
    }
  }, [isLoggedIn, isLocked, lockEnabled, lockHydrated, presentModal, setLocked]);

  const value = useMemo(
    () => ({
      registerActivity: handleActivity,
    }),
    [handleActivity]
  );

  return (
    <UserInactiveContext.Provider value={value}>
      <View
        style={styles.container}
        onStartShouldSetResponderCapture={() => {
          handleActivity();
          return false;
        }}
        onTouchStart={handleActivity}
      >
        {children}
      </View>
    </UserInactiveContext.Provider>
  );
}

export default UserInactiveProvider;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
