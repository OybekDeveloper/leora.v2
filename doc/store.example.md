``` jsx
// utils/storage.ts
import { createMMKV } from 'react-native-mmkv'

// Global MMKV instance
export const mmkv = createMMKV({
  id: 'app-storage',
  encryptionKey: 'secure-key-123', // optional
})

// Adapter for Zustand persist (synchronous API)
export const mmkvStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      return mmkv.getString(key) ?? null
    } catch (error) {
      console.warn(`[MMKV:getItem] ${key} failed`, error)
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      mmkv.set(key, value)
    } catch (error) {
      console.warn(`[MMKV:setItem] ${key} failed`, error)
    }
  },
  removeItem: (key: string): void => {
    try {
      mmkv.remove(key)
    } catch (error) {
      console.warn(`[MMKV:removeItem] ${key} failed`, error)
    }
  },
}

// Helper for universal access (async-like API)
export const storage = {
  getItem: async (key: string) => mmkvStorageAdapter.getItem(key),
  setItem: async (key: string, value: string) => mmkvStorageAdapter.setItem(key, value),
  removeItem: async (key: string) => mmkvStorageAdapter.removeItem(key),
  getBoolean: async (key: string) => mmkv.getBoolean(key) ?? null,
  setBoolean: async (key: string, value: boolean) => mmkv.set(key, value),
  getNumber: async (key: string) => mmkv.getNumber(key) ?? null,
  setNumber: async (key: string, value: number) => mmkv.set(key, value),
  getString: async (key: string) => mmkv.getString(key) ?? null,
  setString: async (key: string, value: string) => mmkv.set(key, value),
  remove: async (key: string) => mmkv.remove(key),
  clearAll: async () => mmkv.clearAll(),
}
```