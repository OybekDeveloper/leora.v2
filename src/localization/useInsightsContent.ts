import { useMemo } from 'react';

import { INSIGHTS_TRANSLATIONS, type InsightsTranslations } from './insightsContent';
import { useLocalization } from './useLocalization';

export const useInsightsContent = (): InsightsTranslations => {
  const { language } = useLocalization();

  return useMemo(() => INSIGHTS_TRANSLATIONS[language] ?? INSIGHTS_TRANSLATIONS.en, [language]);
};
