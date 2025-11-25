import { SupportedLanguage } from '@/stores/useSettingsStore';

export type LanguageOption = {
  value: SupportedLanguage;
  label: string;
  flag: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];
