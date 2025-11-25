// app/(tabs)/(finance)/(tabs)/_layout.tsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);

const Layout = () => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const tabTitles = strings.financeScreens.tabs;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.background,
          paddingBottom: 32,
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
          height: 1,
          borderRadius: 1,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabItem: {
          width: 'auto',
          overflow: 'hidden',
          paddingHorizontal: 10,
        },
        indicatorContainer: {
          paddingHorizontal: 20,
        },
      }),
    [theme],
  );

  const screenOptions = useMemo(
    () => ({
      tabBarStyle: styles.tabBar,
      tabBarIndicatorStyle: styles.indicator,
      tabBarLabelStyle: styles.label,
      tabBarActiveTintColor: theme.colors.textPrimary,
      tabBarInactiveTintColor: theme.colors.textMuted,
      tabBarItemStyle: styles.tabItem,
      tabBarIndicatorContainerStyle: styles.indicatorContainer,
      tabBarScrollEnabled: true,
    }),
    [styles, theme.colors.textMuted, theme.colors.textPrimary],
  );

  return (
    <MaterialTopTabs
      style={styles.container}
      screenOptions={screenOptions}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: tabTitles.review,
        }}
      />
      <MaterialTopTabs.Screen
        name="accounts"
        options={{ title: tabTitles.accounts }}
      />
      <MaterialTopTabs.Screen
        name="transactions"
        options={{ title: tabTitles.transactions }}
      />
      <MaterialTopTabs.Screen
        name="budgets"
        options={{ title: tabTitles.budgets }}
      />
      <MaterialTopTabs.Screen
        name="analytics"
        options={{ title: tabTitles.analytics }}
      />
      <MaterialTopTabs.Screen
        name="debts"
        options={{ title: tabTitles.debts }}
      />
    </MaterialTopTabs>
  );
};

export default Layout;
