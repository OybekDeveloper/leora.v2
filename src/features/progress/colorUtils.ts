import type { Theme } from '@/constants/theme';

export type ProgressBucket = 'high' | 'mid' | 'low';

export const getProgressBucket = (value?: number | null): ProgressBucket => {
  if (value == null) {
    return 'low';
  }

  if (value >= 67) {
    return 'high';
  }

  if (value >= 34) {
    return 'mid';
  }

  return 'low';
};

export const getProgressColor = (
  theme: Theme,
  value?: number | null,
  hasContent = true,
): string => {
  if (!hasContent || value == null) {
    return theme.colors.border;
  }

  const bucket = getProgressBucket(value);

  switch (bucket) {
    case 'high':
      return theme.colors.success;
    case 'mid':
      return theme.colors.warning;
    default:
      return theme.colors.danger;
  }
};

