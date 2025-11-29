// src/components/ui/FloatList.tsx
import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItem,
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

  const renderListItem: ListRenderItem<T> = useCallback(
    ({ item, index }) => {
      const isSelected = selectedId === item.id;
      const isLast = index === items.length - 1;

      return (
        <Pressable
          onPress={() => onSelect(item)}
          style={[
            styles.pressable,
            { marginRight: isLast ? 0 : gap },
          ]}
        >
          {renderItem ? renderItem(item, isSelected) : renderDefaultItem(item, isSelected)}
        </Pressable>
      );
    },
    [selectedId, onSelect, renderItem, renderDefaultItem, gap, items.length, styles.pressable],
  );

  const keyExtractor = useCallback((item: T) => item.id, []);

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderListItem}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={showScrollIndicator}
      showsVerticalScrollIndicator={showScrollIndicator}
      contentContainerStyle={[
        styles.listContent,
        { paddingHorizontal: contentPadding },
      ]}
      style={styles.list}
    />
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
