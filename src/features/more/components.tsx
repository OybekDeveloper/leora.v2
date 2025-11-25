import React from 'react';
import {
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { createThemedStyles, useAppTheme } from '@/constants/theme';


type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, contentStyle }) => {
  const styles = useCardStyles();
  const theme = useAppTheme();
  const backgroundColor =
    theme.mode === 'dark'
      ? 'rgba(38, 38, 48, 0.72)'
      : 'rgba(255, 255, 255, 0.82)';
  const borderColor =
    theme.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(15, 23, 42, 0.08)';

  return (
    <View style={[styles.shadowWrapper, style]}>
      <AdaptiveGlassView
        style={[
          styles.glassContainer,
          {
            borderColor,
            borderRadius: theme.radius.xl,
            backgroundColor,
          },
        ]}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </AdaptiveGlassView>
    </View>
  );
};

type SectionHeaderProps = {
  title?: string | null;
  style?: StyleProp<TextStyle>;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, style }) => {
  const styles = useCardStyles();
  if (!title) return null;

  return (
    <Text style={[styles.sectionHeader, style]}>
      {title.toUpperCase()}
    </Text>
  );
};

type LucideIcon = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

type ListItemProps = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  rightAccessory?: React.ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
  disabled?: boolean;
};

export const ListItem: React.FC<ListItemProps> = ({
  icon: Icon,
  label,
  subtitle,
  value,
  onPress,
  rightAccessory,
  showChevron = true,
  isLast,
  disabled,
}) => {
  const styles = useCardStyles();
  const theme = useAppTheme();

  const rippleColor =
    theme.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(15, 23, 42, 0.08)';

  const pressableStyle = ({ pressed }: PressableStateCallbackType) => [
    styles.listItem,
    {
      opacity: pressed ? 0.95 : 1,
      transform: [{ scale: pressed ? 0.98 : 1 }],
    },
    isLast && { borderBottomWidth: 0 },
  ];

  return (
    <AdaptiveGlassView
      style={[styles.listItemWrapper, disabled && { opacity: 0.6 }]}
    >
      <Pressable
        android_ripple={{ color: rippleColor }}
        disabled={disabled}
        onPress={onPress}
        style={pressableStyle}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                theme.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(15, 23, 42, 0.06)',
            },
          ]}
        >
          <Icon color={theme.mode === 'dark' ? '#DADAE5' : '#1F2937'} size={20} />
        </View>

        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: theme.colors.textPrimary }]}>{label}</Text>
          {subtitle ? (
            <Text style={[styles.subtitleText, { color: theme.colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>

        {value ? (
          <Text style={[styles.valueText, { color: theme.colors.textMuted }]}>{value}</Text>
        ) : null}

        {rightAccessory}

        {showChevron && !rightAccessory ? (
          <ChevronRight size={18} color={theme.colors.textMuted} />
        ) : null}
      </Pressable>
    </AdaptiveGlassView>
  );
};

const useCardStyles = createThemedStyles((theme) => ({
  shadowWrapper: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    ...theme.shadows.medium,
  },
  glassContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  content: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.textMuted,
  },
  listItemWrapper: {
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    borderRadius: 16
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
    gap: 2,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 13,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: theme.spacing.sm,
  },
}));
