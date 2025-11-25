import { useMemo } from 'react';

import { useSettingsStore, SupportedLanguage } from '@/stores/useSettingsStore';

import { APP_TRANSLATIONS, LANGUAGE_LOCALE_MAP } from './strings';

export const useLocalization = () => {
  const language = useSettingsStore((state) => state.language as SupportedLanguage);

  return useMemo(() => {
    const locale = LANGUAGE_LOCALE_MAP[language] ?? LANGUAGE_LOCALE_MAP.en;
    const strings = APP_TRANSLATIONS[language] ?? APP_TRANSLATIONS.en;
    return { language, locale, strings };
  }, [language]);
};
