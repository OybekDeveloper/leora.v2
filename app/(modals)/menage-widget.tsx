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
  Animated,
  ActivityIndicator,
} from 'react-native';
import { FlashList as FlashListBase } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import Sortable from 'react-native-sortables';
import type { SortableGridDragEndParams, SortableGridRenderItem } from 'react-native-sortables';
import { useRouter } from 'expo-router';
import { Theme, useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
const FlashList = FlashListBase as any;

export default function ManageWidgetModal() {
  const router = useRouter();
  const hasHydrated = useWidgetStoreHydrated();
  const { strings } = useLocalization();
  const widgetStrings = strings.modals.manageWidget;
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      const localizedWidget = widgetStrings.widgetTitles[widgetId];
      const widgetTitle = localizedWidget?.title ?? widget.title;
      const widgetDescription = localizedWidget?.description ?? widget.description;

      return (
        <View style={styles.widgetItem}>
          <View style={styles.widgetInfo}>
            <View style={styles.widgetIconBadge}>
              <Icon size={18} color={colors.textPrimary} />
            </View>
            <View style={styles.widgetText}>
              <Text style={styles.widgetTitle}>{widgetTitle}</Text>
              <Text style={styles.widgetDescription}>{widgetDescription}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleAddWidget(widgetId)} style={styles.actionButton}>
            <View style={[styles.actionIcon, styles.addIcon]}>
              <Plus color={colors.textPrimary} size={18} />
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleAddWidget, widgetStrings.widgetTitles]
  );

  const renderActiveWidget = useCallback<SortableGridRenderItem<WidgetType>>(
    ({ item: widgetId }) => {
      const widget = AVAILABLE_WIDGETS[widgetId];
      const Icon = widget.icon;
      const localizedWidget = widgetStrings.widgetTitles[widgetId];
      const widgetTitle = localizedWidget?.title ?? widget.title;
      const widgetDescription = localizedWidget?.description ?? widget.description;

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
              <Trash2 color={colors.textPrimary} size={24} />
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
                <GripVertical color={colors.textSecondary} size={24} />
              </View>
            </Sortable.Handle>

            <View style={styles.widgetInfo}>
              <View style={styles.widgetIconBadge}>
                <Icon size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.widgetText}>
                <Text style={styles.widgetTitle}>{widgetTitle}</Text>
                <Text style={styles.widgetDescription}>{widgetDescription}</Text>
              </View>
            </View>
          </View>
        </Swipeable>
      );
    },
    [handleRemoveWidget, widgetStrings.widgetTitles]
  );

  // Show loading while store is hydrating from persistent storage
  if (!hasHydrated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{widgetStrings.title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={styles.loadingText}>{widgetStrings.loadingWidgets}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{widgetStrings.title}</Text>
      </View>

      {/* Main vertical FlashList - replaces ScrollView to avoid Android nesting issues */}
      {/* Available widgets at TOP, Active widgets at BOTTOM */}
      <FlashList
        data={[1]} // Dummy data for FlashList
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={100}
        contentContainerStyle={styles.mainListContent}
        ListHeaderComponent={
          <>
            {/* Available Widgets Section - AT THE TOP */}
            <View style={styles.sectionFullWidth}>
              <Text style={[styles.sectionTitle, styles.sectionTitleWithPadding]}>{widgetStrings.availableWidgets}</Text>
              <Text style={[styles.sectionSubtitle, styles.sectionTitleWithPadding]}>{widgetStrings.tapToAdd}</Text>

              {availableCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{widgetStrings.allWidgetsActive}</Text>
                </View>
              ) : (
                <>
                  {/* Category Tab Bar - horizontal scroll for category selection */}
                  <View style={styles.categoryListContainer}>
                    <FlashList
                      data={availableCategories}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(category: WidgetConfig['category']) => category}
                      estimatedItemSize={100}
                      renderItem={({ item: category }: { item: WidgetConfig['category'] }) => (
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
                            {widgetStrings.categories[category] ?? category}
                          </Text>
                        </TouchableOpacity>
                      )}
                      ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                      ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                      ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                    />
                  </View>

                  {/* Horizontal FlashList for widgets in selected category */}
                  {displayedInactiveWidgets.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>{widgetStrings.noWidgetsInCategory}</Text>
                    </View>
                  ) : (
                    <View style={styles.widgetListContainer}>
                      <FlashList
                        data={displayedInactiveWidgets}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(widgetId: WidgetType) => widgetId}
                        estimatedItemSize={280}
                        renderItem={({ item: widgetId }: { item: WidgetType }) => (
                          <View style={styles.horizontalWidgetItem}>
                            {renderInactiveWidget(widgetId)}
                          </View>
                        )}
                        ListHeaderComponent={<View style={styles.listEdgeSpacer} />}
                        ItemSeparatorComponent={() => <View style={styles.widgetSeparator} />}
                        ListFooterComponent={<View style={styles.listEdgeSpacer} />}
                      />
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Active Widgets Section - AT THE BOTTOM */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{widgetStrings.activeWidgets}</Text>
              <Text style={styles.sectionSubtitle}>{widgetStrings.dragToReorder}</Text>

              {activeWidgets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{widgetStrings.noActiveWidgets}</Text>
                  <Text style={styles.emptySubtext}>{widgetStrings.addWidgetsFromAbove}</Text>
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    mainListContent: {
      paddingBottom: 100,
    },
    section: {
      paddingHorizontal: 16,
      marginTop: 24,
    },
    sectionFullWidth: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    sectionTitleWithPadding: {
      paddingHorizontal: 16,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    availableSectionHeader: {
      marginTop: 32,
    },
    sortableContainer: {
      flex: 1,
    },
    listEdgeSpacer: {
      width: 16,
    },
    horizontalSeparator: {
      width: 8,
    },
    widgetSeparator: {
      width: 12,
    },
    categoryListContainer: {
      height: 44,
      marginBottom: 12,
    },
    widgetListContainer: {
      height: 80,
    },
    categoryTabBar: {
      paddingVertical: 8,
      paddingHorizontal: 0,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.cardItem,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.card,
    },
    categoryChipText: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    categoryChipTextActive: {
      color: theme.colors.textPrimary,
    },
    horizontalWidgetList: {
      paddingRight: 16,
    },
    horizontalWidgetItem: {
      width: 280,
    },
    widgetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 12,
      minHeight: 72,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      backgroundColor: theme.colors.surfaceElevated,
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
      color: theme.colors.textPrimary,
    },
    widgetDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
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
      backgroundColor: theme.colors.card,
    },
    deleteAction: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      marginLeft: 12,
    },
    deleteButton: {
      backgroundColor: theme.colors.danger,
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
      color: theme.colors.textPrimary,
    },
    emptySubtext: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  });
