import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AccountIconId, CustomAccountType } from '@/types/accounts';
import { mmkvStorageAdapter } from '@/utils/storage';

const generateId = () => `custom-type-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface CustomAccountTypesStore {
  customTypes: CustomAccountType[];
  addCustomType: (label: string, icon: AccountIconId) => CustomAccountType;
  upsertCustomType: (type: CustomAccountType) => void;
  removeCustomType: (id: string) => void;
}

export const useCustomAccountTypesStore = create<CustomAccountTypesStore>()(
  persist(
    (set, get) => ({
      customTypes: [],
      addCustomType: (label, icon) => {
        const trimmed = label.trim();
        const type: CustomAccountType = {
          id: generateId(),
          label: trimmed || 'Custom type',
          icon,
        };
        set((state) => ({ customTypes: [...state.customTypes, type] }));
        return type;
      },
      upsertCustomType: (type) => {
        set((state) => {
          const exists = state.customTypes.some((item) => item.id === type.id);
          if (exists) {
            return {
              customTypes: state.customTypes.map((item) =>
                item.id === type.id ? { ...item, ...type } : item,
              ),
            };
          }
          return { customTypes: [...state.customTypes, type] };
        });
      },
      removeCustomType: (id) => {
        // When removing a custom type, we need to update all accounts using this type
        // to fall back to 'other' type by clearing their customTypeId
        // This is handled in the finance domain store via a subscription
        set((state) => ({
          customTypes: state.customTypes.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: 'custom-account-types',
      storage: createJSONStorage(() => mmkvStorageAdapter),
      partialize: (state) => ({ customTypes: state.customTypes }),
    },
  ),
);
