import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

import type {
  FocusLiveActivityEndReason,
  FocusLiveActivityStartPayload,
  FocusLiveActivityUpdatePayload,
} from './FocusLiveActivity.types';

type FocusLiveActivityNativeModule = {
  isAvailableAsync(): Promise<boolean>;
  startActivityAsync(payload: FocusLiveActivityStartPayload): Promise<boolean>;
  updateActivityAsync(payload: FocusLiveActivityUpdatePayload): Promise<void>;
  stopActivityAsync(reason: FocusLiveActivityEndReason): Promise<void>;
};

let nativeModule: FocusLiveActivityNativeModule | null = null;

if (Platform.OS === 'ios') {
  try {
    nativeModule = requireNativeModule<FocusLiveActivityNativeModule>('FocusLiveActivity');
  } catch {
    // If the native module isn't linked yet we silently fall back to the no-op layer.
    nativeModule = null;
  }
}

const noop = async () => undefined;

export const FocusLiveActivityModule = {
  async isAvailable() {
    if (!nativeModule) return false;
    try {
      return await nativeModule.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async startActivity(payload: FocusLiveActivityStartPayload) {
    if (!nativeModule) return false;
    try {
      return await nativeModule.startActivityAsync(payload);
    } catch {
      return false;
    }
  },

  async updateActivity(payload: FocusLiveActivityUpdatePayload) {
    if (!nativeModule) return noop();
    try {
      await nativeModule.updateActivityAsync(payload);
    } catch {
      // Ignore update errors to avoid crashing the JS thread.
    }
  },

  async stopActivity(reason: FocusLiveActivityEndReason) {
    if (!nativeModule) return noop();
    try {
      await nativeModule.stopActivityAsync(reason);
    } catch {
      // Ending failures can be ignored safely.
    }
  },
};

export default FocusLiveActivityModule;
