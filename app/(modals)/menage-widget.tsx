// app/(modals)/manage-widget.tsx
import { AVAILABLE_WIDGETS, WidgetType, WidgetConfig } from '@/config/widgetConfig';
import { useWidgetStore, useWidgetStoreHydrated } from '@/stores/widgetStore';
import { X, GripVertical, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import Sortable from 'react-native-sortables';
import type { SortableGridDragEndParams, SortableGridRenderItem } from 'react-native-sortables';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function ManageWidgetModal() {
  const router = useRouter();
  const hasHydrated = useWidgetStoreHydrated();

  // Get state and actions from Zustand store
  const { activeWidgets: storeActiveWidgets, setActiveWidgets } = useWidgetStore();

  const [activeWidgets, setActiveWidgetsLocal] = useState<WidgetType[]>(storeActiveWidgets || []);

  useEffect(() => {
    setActiveWidgetsLocal(storeActiveWidgets || []);
  }, [storeActiveWidgets]);

  const inactiveWidgets = useMemo<WidgetType[]>(() => {
    return Object.keys(AVAILABLE_WIDGETS).filter(
      (id) => !activeWidgets.includes(id as WidgetType)
    ) as WidgetType[];
  }, [activeWidgets]);

  // Group inactive widgets by category for horizontal carousels
  // Each category will be rendered as a separate horizontal FlatList
  const inactiveWidgetsByCategory = useMemo(() => {
    return inactiveWidgets.reduce<Partial<Record<WidgetConfig['category'], WidgetType[]>>>(
      (acc, widgetId) => {
        const category = AVAILABLE_WIDGETS[widgetId].category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category]!.push(widgetId);
        return acc;
      },
      {}
    );
  }, [inactiveWidgets]);

  const availableCategories = useMemo(
    () => Object.keys(inactiveWidgetsByCategory) as WidgetConfig['category'][],
    [inactiveWidgetsByCategory]
  );

  const [selectedCategory, setSelectedCategory] = useState<WidgetConfig['category'] | null>(
    availableCategories[0] ?? null
  );

  useEffect(() => {
    if (availableCategories.length === 0) {
      if (selectedCategory !== null) {
        setSelectedCategory(null);
      }
      return;
    }

    if (!selectedCategory || !availableCategories.includes(selectedCategory)) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  const displayedInactiveWidgets = useMemo(() => {
    if (!selectedCategory) return [];
    return inactiveWidgetsByCategory[selectedCategory] ?? [];
  }, [inactiveWidgetsByCategory, selectedCategory]);

  const handleAddWidget = useCallback((widgetId: WidgetType) => {
    setActiveWidgetsLocal((prev) => {
      if (prev.includes(widgetId)) {
        return prev;
      }
      const updated = [...prev, widgetId];
      setActiveWidgets(updated);
      return updated;
    });
  }, [setActiveWidgets]);

  const handleRemoveWidget = useCallback((widgetId: WidgetType) => {
    setActiveWidgetsLocal((prev) => {
      const updated = prev.filter((id) => id !== widgetId);
      setActiveWidgets(updated);
      return updated;
    });
  }, [setActiveWidgets]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Save to store after drag ends
  const handleDragEnd = useCallback(({ data }: SortableGridDragEndParams<WidgetType>) => {
    setActiveWidgetsLocal(data);
    setActiveWidgets(data);
  }, [setActiveWidgets]);

  const renderInactiveWidget = useCallback(
    (widgetId: WidgetType) => {
      const widget = AVAILABLE_WIDGETS[widgetId];

      const Icon = widget.icon;

      return (
        <View style={styles.widgetItem}>
          <View style={styles.widgetInfo}>
            <View style={styles.widgetIconBadge}>
              <Icon size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.widgetText}>
              <Text style={styles.widgetTitle}>{widget.title}</Text>
              <Text style={styles.widgetDescription}>{widget.description}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleAddWidget(widgetId)} style={styles.actionButton}>
            <View style={[styles.actionIcon, styles.addIcon]}>
              <Plus color={Colors.textPrimary} size={18} />
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleAddWidget]
  );

  const renderActiveWidget = useCallback<SortableGridRenderItem<WidgetType>>(
    ({ item: widgetId }) => {
      const widget = AVAILABLE_WIDGETS[widgetId];
      const Icon = widget.icon;

      const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
      ) => {
        const scale = dragX.interpolate({
          inputRange: [-100, 0],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            style={[
              styles.deleteAction,
              {
                transform: [{ scale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveWidget(widgetId)}
            >
              <Trash2 color={Colors.textPrimary} size={24} />
            </TouchableOpacity>
          </Animated.View>
        );
      };

      return (
        <Swipeable
          renderRightActions={renderRightActions}
          overshootRight={false}
          friction={2}
        >
          <View style={styles.widgetItem}>
            <Sortable.Handle>
              <View style={styles.dragHandle}>
                <GripVertical color={Colors.textSecondary} size={24} />
              </View>
            </Sortable.Handle>

            <View style={styles.widgetInfo}>
              <View style={styles.widgetIconBadge}>
                <Icon size={18} color={Colors.textPrimary} />
              </View>
              <View style={styles.widgetText}>
                <Text style={styles.widgetTitle}>{widget.title}</Text>
                <Text style={styles.widgetDescription}>{widget.description}</Text>
              </View>
            </View>
          </View>
        </Swipeable>
      );
    },
    [handleRemoveWidget]
  );

  // Show loading while store is hydrating from persistent storage
  if (!hasHydrated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={Colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Widgets</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.success} />
          <Text style={styles.loadingText}>Loading widgets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X color={Colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Widgets</Text>
      </View>

      {/* Main vertical FlatList - replaces ScrollView to avoid Android nesting issues */}
      {/* Available widgets at TOP, Active widgets at BOTTOM */}
      <FlatList
        data={[]} // Empty data array - all content is in ListHeaderComponent
        renderItem={null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainListContent}
        ListHeaderComponent={
          <>
            {/* Available Widgets Section - AT THE TOP */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AVAILABLE WIDGETS</Text>
              <Text style={styles.sectionSubtitle}>Tap plus to add</Text>

              {availableCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>All widgets are active</Text>
                </View>
              ) : (
                <>
                  {/* Category Tab Bar - horizontal scroll for category selection */}
                  <FlatList
                    data={availableCategories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(category) => category}
                    renderItem={({ item: category }) => (
                      <TouchableOpacity
                        style={[
                          styles.categoryChip,
                          selectedCategory === category && styles.categoryChipActive,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            selectedCategory === category && styles.categoryChipTextActive,
                          ]}
                        >
                          {CATEGORY_LABELS[category] ?? category}
                        </Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.categoryTabBar}
                    ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                  />

                  {/* Horizontal FlatList for widgets in selected category */}
                  {/* DO NOT use ScrollView here - FlatList horizontal mode prevents Android gesture conflicts */}
                  {displayedInactiveWidgets.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No widgets available in this category</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={displayedInactiveWidgets}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(widgetId) => widgetId}
                      renderItem={({ item: widgetId }) => (
                        <View style={styles.horizontalWidgetItem}>
                          {renderInactiveWidget(widgetId)}
                        </View>
                      )}
                      contentContainerStyle={styles.horizontalWidgetList}
                      ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                    />
                  )}
                </>
              )}
            </View>

            {/* Active Widgets Section - AT THE BOTTOM */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACTIVE WIDGETS</Text>
              <Text style={styles.sectionSubtitle}>Drag to reorder • Swipe left to remove</Text>

              {activeWidgets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No active widgets</Text>
                  <Text style={styles.emptySubtext}>Add widgets from above</Text>
                </View>
              ) : (
                <View style={styles.sortableContainer}>
                  <Sortable.Grid
                    activeItemScale={1.05}
                    columns={1}
                    data={activeWidgets}
                    overDrag="vertical"
                    renderItem={renderActiveWidget}
                    rowGap={12}
                    customHandle
                    onDragEnd={handleDragEnd}
                  />
                </View>
              )}
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
}

const CATEGORY_LABELS: Record<WidgetConfig['category'], string> = {
  planner: 'Planner',
  finance: 'Finance',
  ai: 'AI',
  health: 'Health',
  insights: 'Insights',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  // Main FlatList content container - adds bottom padding for scroll comfort
  mainListContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  // Header section for Available Widgets (appears after Active Widgets)
  availableSectionHeader: {
    marginTop: 32,
  },
  sortableContainer: {
    flex: 1,
  },
  // Category tab bar - horizontal list of category chips
  categoryTabBar: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(166,166,185,0.12)',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: Colors.textPrimary,
  },
  // Horizontal FlatList content container for widgets
  horizontalWidgetList: {
    paddingRight: 16,
  },
  // Wrapper for each widget in horizontal carousel
  // Fixed width ensures consistent card sizes in horizontal scroll
  horizontalWidgetItem: {
    width: 280,
  },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  widgetInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  widgetIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetText: {
    flex: 1,
    gap: 4,
  },
  widgetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  widgetDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    backgroundColor: Colors.primary,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginLeft: 12,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
