// src/components/widget/UniversalWidget.tsx
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AVAILABLE_WIDGETS, WidgetType } from '@/config/widgetConfig';
import { useWidgetStoreHydrated } from '@/stores/widgetStore';
import { useAppTheme } from '@/constants/theme';

interface UniversalWidgetProps {
  widgetId: WidgetType;
  onRemove?: () => void;
  editMode?: boolean;
  dataState?: {
    hasData?: boolean;
    props?: Record<string, unknown>;
  };
  isLoading?: boolean;
  dateLabel: string;
}

export default function UniversalWidget({
  widgetId,
  dataState,
  isLoading = false,
  dateLabel,
}: UniversalWidgetProps) {
  const hasHydrated = useWidgetStoreHydrated();
  const widget = AVAILABLE_WIDGETS[widgetId];
  const theme = useAppTheme();
  const hasData = dataState?.hasData ?? false;

  const widgetProps = useMemo(() => {
    if (isLoading || !widget) {
      return null;
    }
    const baseDefaults = hasData ? widget.defaultProps ?? {} : {};
    const externalProps = dataState?.props ?? {};
    return {
      ...baseDefaults,
      ...externalProps,
      hasData,
      dateLabel,
    };
  }, [dataState?.props, hasData, isLoading, widget, dateLabel]);

  if (!hasHydrated) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (!widget) {
    return null;
  }

  const WidgetComponent = widget.component;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.skeletonCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View
            style={[styles.skeletonHeader, { backgroundColor: `${theme.colors.textSecondary}20` }]}
          />
          <View style={[styles.skeletonLine, { backgroundColor: `${theme.colors.textPrimary}1A` }]} />
          <View
            style={[styles.skeletonLineHalf, { backgroundColor: `${theme.colors.textSecondary}26` }]}
          />
        </View>
      </View>
    );
  }

  if (!widgetProps) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WidgetComponent {...widgetProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    position: 'relative',
  },
  loadingContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCard: {
    minHeight: 180,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    justifyContent: 'center',
  },
  skeletonHeader: {
    height: 18,
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  skeletonLineHalf: {
    height: 10,
    borderRadius: 6,
    width: '60%',
  },
});
