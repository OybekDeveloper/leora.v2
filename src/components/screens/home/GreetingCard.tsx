import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { isSameDay } from '@/utils/calendar';

interface GreetingCardProps {
  userName?: string;
  date?: Date;
  statusLabel?: string;
  statusTone?: 'online' | 'offline' | 'muted';
}

export default function GreetingCard({
  userName,
  date,
  statusLabel,
  statusTone = 'online',
}: GreetingCardProps) {
  const theme = useAppTheme();
  const displayDate = date ?? new Date();
  const { strings, locale } = useLocalization();

  const greetingText = useMemo(() => {
    const now = new Date();
    const baseDate = date ? new Date(date) : now;
    const reference = isSameDay(now, baseDate)
      ? now
      : new Date(baseDate.setHours(9, 0, 0, 0));

    const hour = reference.getHours();
    if (hour >= 5 && hour < 12) {
      return strings.home.greeting.morning;
    }
    if (hour >= 12 && hour < 18) {
      return strings.home.greeting.afternoon;
    }
    if (hour >= 18 && hour < 22) {
      return strings.home.greeting.evening;
    }
    return strings.home.greeting.night;
  }, [
    date,
    strings.home.greeting.afternoon,
    strings.home.greeting.evening,
    strings.home.greeting.morning,
    strings.home.greeting.night,
  ]);

  const formattedDate = useMemo(() => {
    return displayDate.toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [displayDate, locale]);

  const resolvedName = userName?.trim().split(' ')[0] ?? strings.home.greeting.defaultName;
  const styles = createStyles(theme);
  const statusColors = {
    online: theme.colors.success,
    offline: theme.colors.danger,
    muted: theme.colors.textSecondary,
  };

  return (
    <AdaptiveGlassView style={styles.card}>
      <View style={styles.content}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
            {greetingText}, {resolvedName}
          </Text>
          <Text style={[styles.date, { color: theme.colors.textMuted }]}>{formattedDate}</Text>
        </View>
        {statusLabel ? (
          <View
            style={[
              styles.statusPill,
              { borderColor: `${statusColors[statusTone]}60`, backgroundColor: `${statusColors[statusTone]}12` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColors[statusTone] },
              ]}
            />
            <Text style={[styles.statusLabel, { color: theme.colors.textPrimary }]}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>
    </AdaptiveGlassView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.card,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
