// app/(tabs)/(insights)/(tabs)/_layout.tsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useAppTheme } from '@/constants/theme';
import { useInsightsContent } from '@/localization/useInsightsContent';

const { Navigator } = createMaterialTopTabNavigator();

export const InsightsTopTabs = withLayoutContext(Navigator);

const InsightsTabsLayout = () => {
  const theme = useAppTheme();
  const { tabs } = useInsightsContent();
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
          backgroundColor: theme.colors.textPrimary,
          height: 2,
          borderRadius: 1,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabItem: {
          width: 'auto',
        },
      }),
    [theme],
  );

  return (
    <InsightsTopTabs
      style={styles.container}
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarIndicatorStyle: styles.indicator,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarItemStyle: styles.tabItem,
        tabBarScrollEnabled: false,
      }}
    >
      <InsightsTopTabs.Screen name="index" options={{ title: tabs.overview }} />
      <InsightsTopTabs.Screen name="finance" options={{ title: tabs.finance }} />
      <InsightsTopTabs.Screen
        name="productivity"
        options={{ title: tabs.productivity }}
      />
      <InsightsTopTabs.Screen name="wisdom" options={{ title: tabs.wisdom }} />
    </InsightsTopTabs>
  );
};

export default InsightsTabsLayout;
