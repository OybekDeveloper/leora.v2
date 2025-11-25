import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorageAdapter } from '@/utils/storage';

const sanitizePin = (pin: string) => pin.replace(/\D/g, '').slice(0, 4);

export const DEFAULT_AUTO_LOCK_MS = 60 * 1000; // 1 minute
export const DEFAULT_UNLOCK_GRACE_MS = 30 * 1000; // 30 seconds

const storage = createJSONStorage(() => mmkvStorageAdapter);

interface LockState {
  isLocked: boolean;
  isLoggedIn: boolean;
  lastActive: number;
  pin: string | null;
  isInactive: boolean;
  lastBackgrounded: number | null;
  lockEnabled: boolean;
  biometricsEnabled: boolean;
  autoLockTimeoutMs: number;
  unlockGraceMs: number;
  setLocked: (locked: boolean) => void;
  lockNow: () => void;
  setLoggedIn: (loggedIn: boolean) => void;
  updateLastActive: (options?: { keepInactive?: boolean }) => void;
  verifyPin: (input: string) => boolean;
  setInactive: (inactive: boolean) => void;
  setLastBackgrounded: (value: number | null) => void;
  setPin: (pin: string) => void;
  resetPin: () => void;
  setLockEnabled: (enabled: boolean) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  setAutoLockTimeoutMs: (value: number) => void;
  setUnlockGraceMs: (value: number) => void;
}

export const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      isLocked: false,
      isLoggedIn: false,
      lastActive: Date.now(),
      pin: null,
      isInactive: false,
      lastBackgrounded: null,
      lockEnabled: false,
      biometricsEnabled: false,
      autoLockTimeoutMs: DEFAULT_AUTO_LOCK_MS,
      unlockGraceMs: DEFAULT_UNLOCK_GRACE_MS,
      setLocked: (locked) =>
        set((state) => ({
          isLocked: state.lockEnabled ? locked : false,
          isInactive: locked ? false : state.isInactive,
          lastActive: locked ? state.lastActive : Date.now(),
        })),
      lockNow: () =>
        set((state) =>
          state.lockEnabled
            ? { isLocked: true, isInactive: false }
            : { isLocked: state.isLocked, isInactive: false }
        ),
      setLoggedIn: (loggedIn) =>
        set((state) => ({
          isLoggedIn: loggedIn,
          isLocked: loggedIn ? state.isLocked : false,
          isInactive: loggedIn ? state.isInactive : false,
          lastActive: Date.now(),
          lastBackgrounded: null,
        })),
      updateLastActive: ({ keepInactive = false } = {}) =>
        set((state) => ({
          lastActive: Date.now(),
          isInactive: keepInactive ? state.isInactive : false,
        })),
      verifyPin: (input) => {
        const currentPin = get().pin;
        if (!currentPin) return false;
        return sanitizePin(input) === currentPin;
      },
      setInactive: (inactive) => set({ isInactive: inactive }),
      setLastBackgrounded: (value) => set({ lastBackgrounded: value }),
      setPin: (pin) => {
        const normalized = sanitizePin(pin);
        if (normalized.length === 4) {
          set({ pin: normalized, lockEnabled: true });
        }
      },
      resetPin: () =>
        set({
          pin: null,
          lockEnabled: false,
          isLocked: false,
          isInactive: false,
          lastBackgrounded: null,
          biometricsEnabled: false,
        }),
      setLockEnabled: (enabled) =>
        set((state) => ({
          lockEnabled: enabled,
          isLocked: enabled ? state.isLocked : false,
          isInactive: enabled ? state.isInactive : false,
          biometricsEnabled: enabled ? state.biometricsEnabled : false,
          lastActive: enabled ? Date.now() : state.lastActive,
        })),
      setBiometricsEnabled: (enabled) =>
        set((state) => ({
          biometricsEnabled: state.lockEnabled ? enabled : false,
        })),
      setAutoLockTimeoutMs: (value) =>
        set({ autoLockTimeoutMs: value <= 0 ? 0 : Math.max(5 * 1000, value) }),
      setUnlockGraceMs: (value) =>
        set({ unlockGraceMs: Math.max(0, value) }),
    }),
    {
      name: 'lock-storage',
      storage,
      partialize: (state) => ({
        isLocked: state.isLocked,
        isLoggedIn: state.isLoggedIn,
        lastActive: state.lastActive,
        pin: state.pin,
        lockEnabled: state.lockEnabled,
        biometricsEnabled: state.biometricsEnabled,
        autoLockTimeoutMs: state.autoLockTimeoutMs,
        unlockGraceMs: state.unlockGraceMs,
      }),
    }
  )
);

const evaluateLockHydration = () => {
  const { lockEnabled, lastActive, autoLockTimeoutMs } = useLockStore.getState();

  if (!lockEnabled) {
    useLockStore.setState({ isLocked: false });
    return;
  }

  if (typeof lastActive === 'number') {
    if (autoLockTimeoutMs <= 0) {
      useLockStore.setState({ isLocked: false });
      return;
    }
    const shouldLock = Date.now() - lastActive >= autoLockTimeoutMs;
    if (shouldLock) {
      useLockStore.setState({ isLocked: true });
      return;
    }
  }

  useLockStore.setState({ isLocked: false });
};

useLockStore.persist?.onFinishHydration(() => {
  evaluateLockHydration();
});
