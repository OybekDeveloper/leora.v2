// app/(tabs)/(planner)/(tabs)/_layout.tsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

const { Navigator } = createMaterialTopTabNavigator();
export const PlannerTopTabs = withLayoutContext(Navigator);

const PlannerTabsLayout = () => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const tabTitles = strings.plannerScreens.tabs;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.background,
        },
        tabBar: {
          backgroundColor: theme.colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        indicator: {
          backgroundColor: theme.colors.textTertiary,
          height: 2,
          borderRadius: 1,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
      }),
    [theme],
  );

  return (
    <PlannerTopTabs
      style={styles.container}
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarIndicatorStyle: styles.indicator,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        // ⭐️ scroll o'chirilgan bo'lsa, kengliklar avtomatik teng taqsimlanadi
        tabBarScrollEnabled: false,
        // tabBarItemStyle: styles.tabItem, // <-- olib tashlandi
      }}
    >
      <PlannerTopTabs.Screen name="index" options={{ title: tabTitles.tasks }} />
      <PlannerTopTabs.Screen name="goals" options={{ title: tabTitles.goals }} />
      <PlannerTopTabs.Screen name="habits" options={{ title: tabTitles.habits }} />
    </PlannerTopTabs>
  );
};

export default PlannerTabsLayout;
