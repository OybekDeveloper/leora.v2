import { getTheme, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ThemeAwareProps = {
  light?: string;
  dark?: string;
};

export function useThemeColor(props: ThemeAwareProps, colorName: keyof ThemeColors) {
  const { theme } = useTheme();
  const palette = getTheme(theme).colors;
  const override = props[theme];

  return override ?? palette[colorName];
}
