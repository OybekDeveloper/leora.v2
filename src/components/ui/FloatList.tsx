// src/components/ui/FloatList.tsx
import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { AdaptiveGlassView } from './AdaptiveGlassView';
import { createThemedStyles } from '@/constants/theme';

// Base item interface - extend this for specific use cases
export interface FloatListItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FloatListProps<T extends FloatListItem> {
  items: T[];
  selectedId?: string;
  onSelect: (item: T) => void;
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  horizontal?: boolean;
  showScrollIndicator?: boolean;
  itemWidth?: number;
  gap?: number;
  contentPadding?: number;
}

function FloatListComponent<T extends FloatListItem>({
  items,
  selectedId,
  onSelect,
  renderItem,
  horizontal = true,
  showScrollIndicator = false,
  itemWidth,
  gap = 10,
  contentPadding = 0,
}: FloatListProps<T>) {
  const styles = useStyles();

  const renderDefaultItem = useCallback(
    (item: T, isSelected: boolean) => (
      <AdaptiveGlassView
        style={[
          styles.itemContainer,
          itemWidth ? { width: itemWidth } : undefined,
          isSelected && styles.itemSelected,
        ]}
      >
        {item.icon && <View style={styles.iconContainer}>{item.icon}</View>}
        <Text
          style={[
            styles.itemLabel,
            isSelected && styles.itemLabelSelected,
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </AdaptiveGlassView>
    ),
    [styles, itemWidth],
  );

  return (
    <ScrollView
      horizontal={horizontal}
      showsHorizontalScrollIndicator={showScrollIndicator}
      showsVerticalScrollIndicator={showScrollIndicator}
      contentContainerStyle={[
        styles.listContent,
        { paddingHorizontal: contentPadding },
        horizontal && { flexDirection: 'row' },
      ]}
      style={styles.list}
    >
      {items.map((item, index) => {
        const isSelected = selectedId === item.id;
        const isLast = index === items.length - 1;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item)}
            style={[
              styles.pressable,
              { marginRight: isLast ? 0 : gap },
            ]}
          >
            {renderItem ? renderItem(item, isSelected) : renderDefaultItem(item, isSelected)}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = createThemedStyles((theme) => ({
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingVertical: 4,
  },
  pressable: {
    // Press feedback handled by item styling
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  itemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  itemLabelSelected: {
    color: theme.colors.primary,
  },
}));

// Export as generic component
export const FloatList = FloatListComponent;
export default FloatList;
