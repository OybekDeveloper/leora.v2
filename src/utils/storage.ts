// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Adapter for Zustand persist (AsyncStorage)
export const mmkvStorageAdapter = AsyncStorage;

// Helper for universal access (async-like API)
export const storage = {
  getItem: async (key: string) => AsyncStorage.getItem(key),
  setItem: async (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: async (key: string) => AsyncStorage.removeItem(key),
  getBoolean: async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    return value != null ? value === 'true' : null;
  },
  setBoolean: async (key: string, value: boolean) =>
    AsyncStorage.setItem(key, value ? 'true' : 'false'),
  getNumber: async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    return value != null ? Number(value) : null;
  },
  setNumber: async (key: string, value: number) => AsyncStorage.setItem(key, String(value)),
  getString: async (key: string) => AsyncStorage.getItem(key),
  setString: async (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: async (key: string) => AsyncStorage.removeItem(key),
  clearAll: async () => AsyncStorage.clear(),
};
