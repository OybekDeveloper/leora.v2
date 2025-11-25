import 'react-native-reanimated';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { getTheme } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import LeoraSplashScreen from '@/components/screens/splash/LeoraSplashScreen';
import { useLockStore } from '@/stores/useLockStore';
import { UserInactiveProvider } from '@/providers/UserInactiveProvider';
import { useFocusLiveActivitySync } from '@/features/focus/live-activity/useFocusLiveActivitySync';
import { useFocusSettingsStore } from '@/features/focus/useFocusSettingsStore';
import { TECHNIQUES } from '@/features/focus/types';
import { useFocusTimerStore } from '@/features/focus/useFocusTimerStore';
import * as Linking from 'expo-linking';
import '@/stores/usePlannerAggregatesStore';
import { initHabitAutoEvaluator } from '@/services/habitAutoEvaluator';
import { initTaskAutoCompleter } from '@/services/taskAutoCompleter';
import { initFinancePlannerLinker } from '@/services/financePlannerLinker';
import { initDebtTransactionLinker } from '@/services/debtTransactionLinker';
import ProfileHeader from './(tabs)/more/_components/ProfileHeader';
import { useLocalization } from '@/localization/useLocalization';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import FocusSettingsModal from '@/components/modals/FocusSettingsModal';
import { useModalStore } from '@/stores/useModalStore';
import { RealmProvider } from '@/utils/RealmContext';
import { useRealmDiagnostics } from '@/hooks/useRealmDiagnostics';
import { useFinanceRealmSync } from '@/hooks/useFinanceRealmSync';
import { usePlannerRealmSync } from '@/hooks/usePlannerRealmSync';
import Realm from 'realm';

enableScreens(true);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const realmRef = useRef<Realm | null>(null);
  const [realmKey, setRealmKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAssets = async () => {
      try {
        const assetPromise = Asset.loadAsync([
          require('@assets/images/icon.png'),
          require('@assets/images/authBackground.png'),
          require('@assets/images/darkFub.png'),
          require('@assets/images/notifImage.jpg'),
          require('@assets/images/bg.png'),
        ]);

        const fontPromise = Font.loadAsync({
          ...Ionicons.font,
          ...MaterialCommunityIcons.font,
        });

        await Promise.all([assetPromise, fontPromise]);
      } catch (error) {
        console.warn('[RootLayout] Failed to preload assets', error);
      } finally {
        if (isMounted) {
          setAssetsReady(true);
        }
      }
    };

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (assetsReady && animationFinished) {
      setHasBooted(true);
      // Initialize habit auto-evaluator
      initHabitAutoEvaluator();
      // Initialize task auto-completer
      initTaskAutoCompleter();
      // Initialize Finance ↔ Planner linker
      initFinancePlannerLinker();
      // Initialize Debt ↔ Transaction linker
      initDebtTransactionLinker();
    }
  }, [assetsReady, animationFinished]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    if (realmRef.current && !realmRef.current.isClosed) {
      realmRef.current.close();
    }
    realmRef.current = null;
    setRealmKey((prev) => prev + 1);
  }, [isAuthenticated]);

  const handleSplashComplete = useCallback(() => {
    setAnimationFinished(true);
  }, []);

  const navigator = (
    <RootNavigator hasBooted={hasBooted} assetsReady={assetsReady} onSplashComplete={handleSplashComplete} />
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <BottomSheetModalProvider>
          <ThemeProvider>
            {isAuthenticated ? (
              <RealmProvider
                key={realmKey}
                realmRef={realmRef}
                fallback={<RealmLoadingFallback />}
              >
                <RealmSyncBoundary>{navigator}</RealmSyncBoundary>
              </RealmProvider>
            ) : (
              navigator
            )}
          </ThemeProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

type RootNavigatorProps = {
  hasBooted: boolean;
  assetsReady: boolean;
  onSplashComplete: () => void;
};

function RootNavigator({
  hasBooted,
  assetsReady,
  onSplashComplete,
}: RootNavigatorProps): ReactElement {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const setLoggedIn = useLockStore((state) => state.setLoggedIn);
  const setLocked = useLockStore((state) => state.setLocked);
  const updateLastActive = useLockStore((state) => state.updateLastActive);
  const lockIsLoggedIn = useLockStore((state) => state.isLoggedIn);
  const lockIsLocked = useLockStore((state) => state.isLocked);
  const router = useRouter();
  const segments = useSegments();
  const techniqueKey = useFocusSettingsStore((state) => state.techniqueKey);
  const recordSession = useFocusSettingsStore((state) => state.recordSession);
  const openFocusSettingsModal = useModalStore((state) => state.openFocusSettingsModal);
  const focusSegments = segments.join('/');

  const ensureRoute = useCallback(
    (target: string) => {
      const normalized = target.replace(/^\//, '');
      if (focusSegments === normalized) return;
      router.push(target as any);
    },
    [focusSegments, router],
  );

  const focusTaskName = useMemo(() => {
    const technique = TECHNIQUES.find((item) => item.key === techniqueKey) ?? TECHNIQUES[0];
    const label = technique.label.trim();
    if (!label) return 'Focus session';
    if (label.toLowerCase().includes('focus')) return label;
    return `Working on ${label}`;
  }, [techniqueKey]);

  useFocusLiveActivitySync({ taskName: focusTaskName });

  const handleRemoteCompletion = useCallback(
    (completed: boolean) => {
      const timerStore = useFocusTimerStore.getState();
      const elapsed = timerStore.syncElapsed();
      const focusSeconds = Math.min(elapsed, timerStore.totalSeconds);
      recordSession(focusSeconds, completed);
      timerStore.reset();
    },
    [recordSession],
  );

  const handleFocusAction = useCallback(
    (action?: string) => {
      if (!action) return;
      const timerStore = useFocusTimerStore.getState();

      switch (action) {
        case 'pause':
          if (timerStore.timerState === 'running') {
            timerStore.pause();
          }
          ensureRoute('/focus-mode');
          break;
        case 'resume':
          if (timerStore.timerState === 'paused') {
            timerStore.resume();
          }
          ensureRoute('/focus-mode');
          break;
        case 'start':
          if (timerStore.timerState === 'ready') {
            timerStore.start();
          }
          ensureRoute('/focus-mode');
          break;
        case 'stop':
          handleRemoteCompletion(false);
          ensureRoute('/focus-mode');
          break;
        case 'finish':
          handleRemoteCompletion(true);
          ensureRoute('/focus-mode');
          break;
        default:
          break;
      }
    },
    [ensureRoute, handleRemoteCompletion],
  );

  const processIncomingUrl = useCallback(
    (incomingUrl?: string | null) => {
      if (!incomingUrl) return;
      const parsed = Linking.parse(incomingUrl);
      const route = parsed.path ?? parsed.hostname ?? '';
      const action = typeof parsed.queryParams?.action === 'string' ? parsed.queryParams.action : undefined;

      if (route === 'focus-settings') {
        ensureRoute('/focus-mode');
        openFocusSettingsModal();
        return;
      }

      if (route === 'focus-action') {
        handleFocusAction(action);
        return;
      }

      if (route === 'focus-mode') {
        ensureRoute('/focus-mode');
      }
    },
    [ensureRoute, handleFocusAction, openFocusSettingsModal],
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => processIncomingUrl(url));
    Linking.getInitialURL().then(processIncomingUrl).catch(() => undefined);
    return () => subscription.remove();
  }, [processIncomingUrl]);

  // Protect routes based on authentication status
  useEffect(() => {
    if (!hasBooted) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, hasBooted, router]);

  useEffect(() => {
    if (!hasBooted) return;

    if (isAuthenticated) {
      if (!lockIsLoggedIn) {
        setLoggedIn(true);
      }
      updateLastActive({ keepInactive: true });
    } else {
      if (lockIsLoggedIn) {
        setLoggedIn(false);
      }
      if (lockIsLocked) {
        setLocked(false);
      }
    }
  }, [
    hasBooted,
    isAuthenticated,
    lockIsLoggedIn,
    lockIsLocked,
    setLoggedIn,
    setLocked,
    updateLastActive,
  ]);

  const palette = useMemo(() => getTheme(theme).colors, [theme]);
  const navigationTheme = useMemo(() => {
    if (theme === 'dark') {
      return {
        ...DarkTheme,
        dark: true,
        colors: {
          ...DarkTheme.colors,
          background: palette.background,
          card: palette.surface,
          border: palette.border,
          primary: palette.primary,
          text: palette.textPrimary,
        },
      };
    }

    return {
      ...DefaultTheme,
      dark: false,
      colors: {
        ...DefaultTheme.colors,
        background: palette.background,
        card: palette.surface,
        border: palette.border,
        primary: palette.primary,
        text: palette.textPrimary,
      },
    };
  }, [palette, theme]);
  const { strings } = useLocalization();

  const statusBarStyle = theme === 'dark' ? 'light' : 'dark';
  const profileStrings = strings.profile;

  if (!hasBooted) {
    return <LeoraSplashScreen ready={assetsReady} onAnimationComplete={onSplashComplete} />;
  }

  const navigatorContent: ReactElement = (
    <UserInactiveProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.background },
          fullScreenGestureEnabled: true,
          ...(Platform.OS === 'android' ? { statusBarStyle } : {}),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title={profileStrings.title}
              changeTitle=""
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
        }} />
        <Stack.Screen
          name="(modals)/search"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/notifications"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/calendar"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/voice-ai"
          options={{
            presentation: 'modal',
            headerTitle: 'Voice Mode',
            headerShown: false,
            headerStyle: { backgroundColor: palette.surface },
            headerTintColor: palette.textPrimary,
          }}
        />
        <Stack.Screen
          name="(modals)/voice-new"
          options={{
            presentation: 'modal',
            headerTitle: 'Voice Mode',
            headerShown: false,
            headerStyle: { backgroundColor: palette.surface },
            headerTintColor: palette.textPrimary,
          }}
        />
        <Stack.Screen
          name="(modals)/menage-widget"
          options={{
            headerShown: false,
            presentation: 'modal',
            headerTitle: 'Menage Widget',
            headerStyle: { backgroundColor: palette.surface },
            headerTintColor: palette.textPrimary,
          }}
        />
        <Stack.Screen
          name="(modals)/lock"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="focus-mode"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="(modals)/change-password"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/forgot-passcode"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="progress/[metric]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="progress/[metric]/info"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        {/* Planner modals */}
        <Stack.Screen
          name="(modals)/planner/habit"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/planner/goal"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/planner/task"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/planner/goal-details"
          options={{
            presentation: 'modal',
            animation: "slide_from_bottom",
            headerShown: false,
          }}
        />
        {/* Finance Screen Modals */}
        <Stack.Screen
          name="(modals)/finance-currency"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/finance-stats"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/finance-export"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/finance-search"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(modals)/finance/add-account"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/budget"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/budget-detail"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/budget-add-value"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/transaction"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/transaction-filter"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/quick-exp"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/debt"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/fx-override"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/account-filter"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/transaction-monitor"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(modals)/finance/transaction-detail"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
      {/* {canManageStatusBar && (
        <StatusBar  style={statusBarStyle} backgroundColor={palette.background} animated />
      )} */}
    </UserInactiveProvider>
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <>
        {navigatorContent}
        <LoadingOverlay />
        <FocusSettingsModal />
      </>
    </NavigationThemeProvider>
  );
}

const RealmSyncBoundary = ({ children }: { children: ReactNode }) => {
  useRealmDiagnostics();
  useFinanceRealmSync();
  usePlannerRealmSync();
  return <>{children}</>;
};

const RealmLoadingFallback = () => {
  const { theme } = useTheme();
  const palette = useMemo(() => getTheme(theme).colors, [theme]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
      <ActivityIndicator size="large" color={palette.primary} />
    </View>
  );
};
