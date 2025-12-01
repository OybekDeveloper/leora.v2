import { useMemo } from 'react';
import { useLocalization } from '@/localization/useLocalization';

import en from './en.json';
import ru from './ru.json';
import uz from './uz.json';
import ar from './ar.json';
import tr from './tr.json';

export type FocusModeStrings = typeof en.focusMode;
export type FocusSettingsStrings = typeof en.focusSettings;

export interface FocusLocalization {
  focusMode: FocusModeStrings;
  focusSettings: FocusSettingsStrings;
}

const FOCUS_LOCALIZATION: Record<string, FocusLocalization> = {
  en,
  ru,
  uz,
  ar,
  tr,
};

export const useFocusLocalization = (): FocusLocalization => {
  const { language } = useLocalization();

  return useMemo(() => {
    return FOCUS_LOCALIZATION[language] ?? FOCUS_LOCALIZATION.en;
  }, [language]);
};

export const useFocusModeStrings = (): FocusModeStrings => {
  const { focusMode } = useFocusLocalization();
  return focusMode;
};

export const useFocusSettingsStrings = (): FocusSettingsStrings => {
  const { focusSettings } = useFocusLocalization();
  return focusSettings;
};
