import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CameraOff,
  CheckCircle,
  Cloud,
  CloudUpload,
  Database,
  EyeOff,
  Fingerprint,
  HardDrive,
  KeyRound,
  Lock,
  RefreshCcw,
  ShieldCheck,
  ShieldHalf,
  Smartphone,
  Sparkles,
  Target,
  Timer,
  Users,
  WifiOff,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import {
  DEFAULT_AUTO_LOCK_MS,
  DEFAULT_UNLOCK_GRACE_MS,
  useLockStore,
} from '@/stores/useLockStore';

type SectionKey =
  | 'security-type'
  | 'data-security'
  | 'data-backup'
  | 'tasks-goals'
  | 'privacy'
  | 'sessions'
  | 'emergency';

const SECTION_KEYS: SectionKey[] = [
  'security-type',
  'data-security',
  'data-backup',
  'tasks-goals',
  'privacy',
  'sessions',
  'emergency',
];

const SCROLL_OFFSET = 96;

const AUTO_LOCK_OPTIONS = [
  { label: '30 sec', value: 30 * 1000 },
  { label: '1 min', value: 60 * 1000 },
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '10 min', value: 10 * 60 * 1000 },
  { label: 'Never', value: 0 },
] as const;

const UNLOCK_GRACE_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: '15 sec', value: 15 * 1000 },
  { label: '30 sec', value: 30 * 1000 },
  { label: '1 min', value: 60 * 1000 },
] as const;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl + 32,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.xl,
    },
    heroCard: {
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xxl,
      gap: theme.spacing.md,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    heroBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.success,
      letterSpacing: 0.3,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
    },
    heroDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      gap: theme.spacing.xs / 1.5,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    card: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: theme.spacing.md,
    },
    iconBadge: {
      width: 42,
      height: 42,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(15,23,42,0.06)',
    },
    rowLabels: {
      flex: 1,
      gap: 4,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.15,
    },
    rowDescription: {
      fontSize: 12,
      color: theme.colors.textMuted,
      lineHeight: 17,
    },
    rowMeta: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: theme.colors.textSecondary,
    },
    chip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(15,23,42,0.08)',
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
      color: theme.colors.textSecondary,
    },
    chipActive: {
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(226,232,240,0.18)'
          : 'rgba(71,85,105,0.16)',
    },
    chipActiveText: {
      color: theme.colors.textPrimary,
    },
    chipDisabled: {
      opacity: 0.4,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    codeGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    codeInput: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: theme.radius.lg,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      borderWidth: StyleSheet.hairlineWidth,
      letterSpacing: 2,
    },
    codeFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    codeStatus: {
      fontSize: 12,
      color: theme.colors.textMuted,
      letterSpacing: 0.3,
    },
    link: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    buttonPrimary: {
      borderRadius: theme.radius.full,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    buttonPrimaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
    buttonGhost: {
      borderRadius: theme.radius.full,
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(15,23,42,0.08)',
    },
    buttonGhostText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    emergencyButton: {
      borderRadius: theme.radius.full,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(248,113,113,0.18)'
          : 'rgba(239,68,68,0.14)',
    },
    emergencyText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.danger,
    },
    emergencySecondary: {
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(129,140,248,0.16)'
          : 'rgba(79,70,229,0.12)',
    },
    emergencySecondaryText: {
      color:
        theme.mode === 'dark'
          ? 'rgba(196,181,253,1)'
          : theme.colors.primary,
    },
    sessionList: {
      gap: theme.spacing.sm,
    },
    sessionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    sessionDevice: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    sessionMeta: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
  });

const useSectionRegistry = (
  scrollViewRef: React.RefObject<ScrollView | null>,
) => {
  const sectionYRef = useRef<Partial<Record<SectionKey, number>>>({});
  const pendingRef = useRef<SectionKey | null>(null);

  const scrollTo = useCallback(
    (key: SectionKey) => {
      const position = sectionYRef.current[key];
      if (typeof position === 'number') {
        scrollViewRef.current?.scrollTo({
          y: Math.max(position - SCROLL_OFFSET, 0),
          animated: true,
        });
      }
    },
    [scrollViewRef],
  );

  const register = useCallback(
    (key: SectionKey) => (event: LayoutChangeEvent) => {
      sectionYRef.current[key] = event.nativeEvent.layout.y;
      if (pendingRef.current === key) {
        pendingRef.current = null;
        requestAnimationFrame(() => scrollTo(key));
      }
    },
    [scrollTo],
  );

  const schedule = useCallback(
    (key: SectionKey) => {
      pendingRef.current = key;
      requestAnimationFrame(() => scrollTo(key));
    },
    [scrollTo],
  );

  return { register, schedule };
};

const SecuritySettingsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { register, schedule } = useSectionRegistry(scrollRef);

  const { section } = useLocalSearchParams<{ section?: string }>();
  const normalizedSection = (section?.toLowerCase() ?? undefined) as
    | SectionKey
    | undefined;

  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const lockEnabled = useLockStore((state) => state.lockEnabled);
  const setLockEnabledStore = useLockStore((state) => state.setLockEnabled);
  const setBiometricsEnabledStore = useLockStore((state) => state.setBiometricsEnabled);
  const resetPinStore = useLockStore((state) => state.resetPin);
  const autoLockTimeoutMs = useLockStore((state) => state.autoLockTimeoutMs);
  const unlockGraceMs = useLockStore((state) => state.unlockGraceMs);
  const setAutoLockTimeoutMsStore = useLockStore((state) => state.setAutoLockTimeoutMs);
  const setUnlockGraceMsStore = useLockStore((state) => state.setUnlockGraceMs);
  const biometricsEnabledStore = useLockStore((state) => state.biometricsEnabled);
  const storedPin = useLockStore((state) => state.pin);

  const securityOff = !lockEnabled;

  const [biometricInfo, setBiometricInfo] = useState({
    available: false,
    enrolled: false,
    supportsFaceId: false,
    supportsFingerprint: false,
  });
  const [biometricLoading, setBiometricLoading] = useState(true);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(
    () => biometricsEnabledStore,
  );
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(() => Boolean(storedPin));
  const [hasPassword, setHasPassword] = useState(() => Boolean(storedPin));
  const [askOnLaunch, setAskOnLaunch] = useState(true);
  const [databaseEncrypted, setDatabaseEncrypted] = useState(true);
  const [hidePreview, setHidePreview] = useState(true);
  const [screenshotBlock, setScreenshotBlock] = useState(false);
  const [fakeAccount, setFakeAccount] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [taskReminder, setTaskReminder] = useState(true);
  const [deadlineReminder, setDeadlineReminder] = useState(true);
  const [goalProgress, setGoalProgress] = useState(true);
  const [taskReschedule, setTaskReschedule] = useState(false);
  const [anonymousAnalytics, setAnonymousAnalytics] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [dataAccess, setDataAccess] = useState(true);
  const [sharePartners, setSharePartners] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const supported = hasHardware
          ? await LocalAuthentication.supportedAuthenticationTypesAsync()
          : [];
        const enrolled = hasHardware
          ? await LocalAuthentication.isEnrolledAsync()
          : false;
        const supportsFaceId = supported.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        );
        const supportsFingerprint = supported.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        );
        if (isMounted) {
          setBiometricInfo({
            available: hasHardware,
            enrolled,
            supportsFaceId,
            supportsFingerprint,
          });
          const shouldEnable =
            hasHardware &&
            enrolled &&
            biometricsEnabledStore &&
            !securityOff;
          setBiometricsEnabledState(shouldEnable);
          setFaceIdEnabled(shouldEnable && supportsFaceId);
          setFingerprintEnabled(shouldEnable && supportsFingerprint);
          if (!hasHardware || !enrolled) {
            setBiometricsEnabledStore(false);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Unable to fetch biometric capabilities', error);
        }
        if (isMounted) {
          setBiometricInfo({
            available: false,
            enrolled: false,
            supportsFaceId: false,
            supportsFingerprint: false,
          });
          setBiometricsEnabledState(false);
          setFaceIdEnabled(false);
          setFingerprintEnabled(false);
          setBiometricsEnabledStore(false);
        }
      } finally {
        if (isMounted) {
          setBiometricLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [biometricsEnabledStore, securityOff, setBiometricsEnabledStore]);

  useEffect(() => {
    if (normalizedSection && SECTION_KEYS.includes(normalizedSection)) {
      schedule(normalizedSection);
    }
  }, [normalizedSection, schedule]);

  const biometricUnavailable =
    !biometricInfo.available || !biometricInfo.enrolled;
  const supportsFaceId = biometricInfo.supportsFaceId;
  const supportsFingerprint = biometricInfo.supportsFingerprint;
  const securityControlsDisabled = securityOff;
  const faceIdRowDisabled =
    !supportsFaceId || biometricUnavailable || securityControlsDisabled;
  const fingerprintRowDisabled =
    !supportsFingerprint || biometricUnavailable || securityControlsDisabled;
  const faceIdDescription = supportsFaceId
    ? 'Require Face ID whenever launching the app.'
    : 'Face ID is not available on this device.';
  const fingerprintDescription = supportsFingerprint
    ? 'Unlock with your saved fingerprint on this device.'
    : 'Fingerprint unlock is not supported on this device.';

  const autoLockLabel = useMemo(() => {
    if (autoLockTimeoutMs <= 0) {
      return 'Never';
    }
    const preset = AUTO_LOCK_OPTIONS.find(
      (option) => option.value === autoLockTimeoutMs,
    );
    if (preset) return preset.label;
    if (autoLockTimeoutMs % (60 * 1000) === 0) {
      return `${Math.round(autoLockTimeoutMs / (60 * 1000))} min`;
    }
    return `${Math.round(autoLockTimeoutMs / 1000)} sec`;
  }, [autoLockTimeoutMs]);

  const unlockGraceLabel = useMemo(() => {
    const preset = UNLOCK_GRACE_OPTIONS.find(
      (option) => option.value === unlockGraceMs,
    );
    if (preset) return preset.label;
    if (unlockGraceMs % (60 * 1000) === 0) {
      return `${Math.round(unlockGraceMs / (60 * 1000))} min`;
    }
    return `${Math.round(unlockGraceMs / 1000)} sec`;
  }, [unlockGraceMs]);

  const handleOpenPasswordModal = useCallback(
    (mode: 'create' | 'update') => {
      router.push({
        pathname: '/(modals)/change-password',
        params: { source: 'security', mode },
      });
      if (mode === 'create') {
        setHasPassword(true);
      }
    },
    [router, setHasPassword],
  );

  const handlePinToggle = useCallback(
    (value: boolean) => {
      setPinEnabled(value);
      if (!value) {
        resetPinStore();
        return;
      }
      if (value && !hasPassword) {
        handleOpenPasswordModal('create');
      }
      setLockEnabledStore(true);
    },
    [hasPassword, handleOpenPasswordModal, resetPinStore, setLockEnabledStore],
  );

  const handleToggleBiometrics = useCallback(
    (value: boolean) => {
      if (securityControlsDisabled || biometricUnavailable) {
        setBiometricsEnabledState(false);
        setBiometricsEnabledStore(false);
        return;
      }
      setBiometricsEnabledState(value);
      setBiometricsEnabledStore(value);
      if (!value) {
        setFaceIdEnabled(false);
        setFingerprintEnabled(false);
      } else {
        setLockEnabledStore(true);
      }
    },
    [
      biometricUnavailable,
      securityControlsDisabled,
      setLockEnabledStore,
      setBiometricsEnabledStore,
    ],
  );

  const handleToggleSecurityOff = useCallback(
    (value: boolean) => {
      if (value) {
        setLockEnabledStore(false);
        setBiometricsEnabledState(false);
        setBiometricsEnabledStore(false);
        setFaceIdEnabled(false);
        setFingerprintEnabled(false);
        setPinEnabled(false);
        resetPinStore();
      } else {
        setLockEnabledStore(true);
        if (autoLockTimeoutMs <= 0) {
          setAutoLockTimeoutMsStore(DEFAULT_AUTO_LOCK_MS);
        }
        if (unlockGraceMs < 0) {
          setUnlockGraceMsStore(DEFAULT_UNLOCK_GRACE_MS);
        }
      }
    },
    [
      autoLockTimeoutMs,
      resetPinStore,
      setAutoLockTimeoutMsStore,
      setBiometricsEnabledState,
      setBiometricsEnabledStore,
      setFaceIdEnabled,
      setFingerprintEnabled,
      setLockEnabledStore,
      setPinEnabled,
      setUnlockGraceMsStore,
      unlockGraceMs,
    ],
  );

  const handleSelectAutoLock = useCallback(
    (value: number) => {
      if (securityControlsDisabled) {
        return;
      }
      setAutoLockTimeoutMsStore(value);
    },
    [securityControlsDisabled, setAutoLockTimeoutMsStore],
  );

  const handleSelectUnlockGrace = useCallback(
    (value: number) => {
      if (securityControlsDisabled) {
        return;
      }
      setUnlockGraceMsStore(value);
    },
    [securityControlsDisabled, setUnlockGraceMsStore],
  );

  useEffect(() => {
    if (!supportsFaceId) {
      setFaceIdEnabled(false);
    }
    if (!supportsFingerprint) {
      setFingerprintEnabled(false);
    }
  }, [supportsFaceId, supportsFingerprint]);

  useEffect(() => {
    if (securityControlsDisabled || biometricUnavailable) {
      setBiometricsEnabledState(false);
      setFaceIdEnabled(false);
      setFingerprintEnabled(false);
      return;
    }
    setBiometricsEnabledState(biometricsEnabledStore);
  }, [
    biometricUnavailable,
    biometricsEnabledStore,
    securityControlsDisabled,
  ]);

  useEffect(() => {
    if (!biometricsEnabled) {
      setFaceIdEnabled(false);
      setFingerprintEnabled(false);
      return;
    }
    setFaceIdEnabled(supportsFaceId);
    setFingerprintEnabled(supportsFingerprint);
  }, [biometricsEnabled, supportsFaceId, supportsFingerprint]);

  useEffect(() => {
    const pinPresent = Boolean(storedPin);
    setPinEnabled(pinPresent);
    setHasPassword((prev) => prev || pinPresent);
  }, [storedPin]);

  const handleSignOutAll = useCallback(() => {
    console.log('Sign out all sessions');
  }, []);

  const handleDeactivateAccount = useCallback(() => {
    console.log('Deactivate account');
  }, []);

  const handleWipeData = useCallback(() => {
    console.log('Wipe all data');
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AdaptiveGlassView style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <CheckCircle size={18} color={theme.colors.success} />
              <Text style={styles.heroBadgeText}>Security posture good</Text>
            </View>
            <Text style={styles.heroTitle}>Protect your LEORA workspace</Text>
            <Text style={styles.heroDescription}>
              Enable the controls below to keep personal data safe across
              devices. Manage biometrics, two-factor verification, and backup
              routines from one place.
            </Text>
          </AdaptiveGlassView>

          <View style={styles.section} onLayout={register('security-type')}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Security type</Text>
              <Text style={styles.sectionSubtitle}>
                Configure how the app unlocks and how quickly it locks again.
              </Text>
            </View>
            <AdaptiveGlassView style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <ShieldCheck size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Biometrics</Text>
                    <Text style={styles.rowDescription}>
                      Use Face ID or fingerprint to unlock instantly.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleToggleBiometrics}
                  disabled={biometricLoading || biometricUnavailable || securityControlsDisabled}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              {isIOS && (
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconBadge}>
                      <Lock size={18} color={theme.colors.iconText} />
                    </View>
                    <View style={styles.rowLabels}>
                      <Text style={styles.rowLabel}>Face ID</Text>
                      <Text style={styles.rowDescription}>
                        {faceIdDescription}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={faceIdEnabled}
                    onValueChange={setFaceIdEnabled}
                    disabled={!biometricsEnabled || faceIdRowDisabled}
                    trackColor={{
                      false: 'rgba(148,163,184,0.35)',
                      true: theme.colors.primary,
                    }}
                    thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                  />
                </View>
              )}

              {isAndroid && (
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconBadge}>
                      <Fingerprint size={18} color={theme.colors.iconText} />
                    </View>
                    <View style={styles.rowLabels}>
                      <Text style={styles.rowLabel}>Fingerprint</Text>
                      <Text style={styles.rowDescription}>
                        {fingerprintDescription}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={fingerprintEnabled}
                    onValueChange={setFingerprintEnabled}
                    disabled={!biometricsEnabled || fingerprintRowDisabled}
                    trackColor={{
                      false: 'rgba(148,163,184,0.35)',
                      true: theme.colors.primary,
                    }}
                    thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                  />
                </View>
              )}

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <KeyRound size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>PIN code</Text>
                    <Text style={styles.rowDescription}>
                      Set a 4-digit fallback when biometrics are unavailable.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={pinEnabled}
                  onValueChange={handlePinToggle}
                  disabled={securityControlsDisabled}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <Pressable
                onPress={() =>
                  handleOpenPasswordModal(hasPassword ? 'update' : 'create')
                }
              >
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconBadge}>
                      <Lock size={18} color={theme.colors.iconText} />
                    </View>
                    <View style={styles.rowLabels}>
                      <Text style={styles.rowLabel}>Password</Text>
                      <Text style={styles.rowDescription}>
                        {hasPassword
                          ? 'Change the main account password.'
                          : 'Create a password to secure your data.'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.rowMeta}>
                    {hasPassword ? 'Change' : 'Create'}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <WifiOff size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Turn security off</Text>
                    <Text style={styles.rowDescription}>
                      Disable all security checks on launch.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={securityOff}
                  onValueChange={handleToggleSecurityOff}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Timer size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Ask when launch</Text>
                    <Text style={styles.rowDescription}>
                      Prompt for security credentials on every start.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={askOnLaunch}
                  onValueChange={setAskOnLaunch}
                  disabled={securityControlsDisabled}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Smartphone size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Autoblock after</Text>
                    <Text style={styles.rowDescription}>
                      Choose how long the app stays unlocked when inactive.
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowMeta}>{autoLockLabel}</Text>
              </View>
              <View style={styles.chipRow}>
                {AUTO_LOCK_OPTIONS.map((option) => {
                  const active = option.value === autoLockTimeoutMs;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      disabled={securityControlsDisabled}
                      onPress={() => handleSelectAutoLock(option.value)}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                        securityControlsDisabled && styles.chipDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipActiveText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Timer size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Unlock grace period</Text>
                    <Text style={styles.rowDescription}>
                      Decide how soon the lock appears after leaving the app.
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowMeta}>{unlockGraceLabel}</Text>
              </View>
              <View style={styles.chipRow}>
                {UNLOCK_GRACE_OPTIONS.map((option) => {
                  const active = option.value === unlockGraceMs;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      disabled={securityControlsDisabled}
                      onPress={() => handleSelectUnlockGrace(option.value)}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                        securityControlsDisabled && styles.chipDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipActiveText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </AdaptiveGlassView>
          </View>

          <View style={styles.section} onLayout={register('data-security')}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Data security</Text>
              <Text style={styles.sectionSubtitle}>
                Protect stored data and sensitive information in the UI.
              </Text>
            </View>
            <AdaptiveGlassView style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Database size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Database encryption</Text>
                    <Text style={styles.rowDescription}>
                      Encrypt data at rest with AES-256.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={databaseEncrypted}
                  onValueChange={setDatabaseEncrypted}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <EyeOff size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Hide balances on preview</Text>
                    <Text style={styles.rowDescription}>
                      Blur financial numbers until the app is unlocked.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={hidePreview}
                  onValueChange={setHidePreview}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <CameraOff size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Screenshot block</Text>
                    <Text style={styles.rowDescription}>
                      Prevent screenshots on sensitive screens.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={screenshotBlock}
                  onValueChange={setScreenshotBlock}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <AlertCircle size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Fake account</Text>
                    <Text style={styles.rowDescription}>
                      Display a decoy workspace when under pressure.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={fakeAccount}
                  onValueChange={setFakeAccount}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>
            </AdaptiveGlassView>
          </View>

          <View style={styles.section} onLayout={register('data-backup')}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Data backup</Text>
              <Text style={styles.sectionSubtitle}>
                Control how often LEORA syncs and stores encrypted backups.
              </Text>
            </View>
            <AdaptiveGlassView style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Cloud size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Automatic backup</Text>
                    <Text style={styles.rowDescription}>
                      Securely save your data in the cloud.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={autoBackup}
                  onValueChange={setAutoBackup}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Timer size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Frequency</Text>
                    <Text style={styles.rowDescription}>
                      Automatically backs up every day.
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowMeta}>Every day</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <HardDrive size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Storage</Text>
                    <Text style={styles.rowDescription}>
                      Selected storage location for secure backups.
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowMeta}>iCloud</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <CloudUpload size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Last sync</Text>
                    <Text style={styles.rowDescription}>
                      Timestamp for the most recent backup.
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowMeta}>3 days ago</Text>
              </View>

              <Pressable onPress={() => console.log('Create backup now')}>
                <AdaptiveGlassView style={styles.buttonGhost}>
                  <Text style={styles.buttonGhostText}>Create backup now</Text>
                </AdaptiveGlassView>
              </Pressable>
            </AdaptiveGlassView>
          </View>

          <View
            style={styles.section}
            onLayout={register('tasks-goals')}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Task & goals</Text>
              <Text style={styles.sectionSubtitle}>
                Decide when security reminders apply to planning tools.
              </Text>
            </View>
            <AdaptiveGlassView style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Bell size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Task reminder</Text>
                    <Text style={styles.rowDescription}>
                      Notify 15 minutes before a secure task.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={taskReminder}
                  onValueChange={setTaskReminder}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <CalendarClock size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Deadline</Text>
                    <Text style={styles.rowDescription}>
                      Remind you one day before due dates.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={deadlineReminder}
                  onValueChange={setDeadlineReminder}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Target size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Goal progress</Text>
                    <Text style={styles.rowDescription}>
                      Record secure progress updates daily.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={goalProgress}
                  onValueChange={setGoalProgress}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <RefreshCcw size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Task reschedule suggestion</Text>
                    <Text style={styles.rowDescription}>
                      Suggest rescheduling if a secure task is missed.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={taskReschedule}
                  onValueChange={setTaskReschedule}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>
            </AdaptiveGlassView>
          </View>

          <View style={styles.section} onLayout={register('privacy')}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Privacy</Text>
              <Text style={styles.sectionSubtitle}>
                Control the analytics and data sharing options in LEORA.
              </Text>
            </View>
            <AdaptiveGlassView style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <ShieldHalf size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Anonymous analytics</Text>
                    <Text style={styles.rowDescription}>
                      Share usage metrics without personal data.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={anonymousAnalytics}
                  onValueChange={setAnonymousAnalytics}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Sparkles size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Personalized advertising</Text>
                    <Text style={styles.rowDescription}>
                      Allow relevant suggestions based on activity.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={personalizedAds}
                  onValueChange={setPersonalizedAds}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Lock size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Data delete access</Text>
                    <Text style={styles.rowDescription}>
                      Allow deleting data from connected widgets.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={dataAccess}
                  onValueChange={setDataAccess}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBadge}>
                    <Users size={18} color={theme.colors.iconText} />
                  </View>
                  <View style={styles.rowLabels}>
                    <Text style={styles.rowLabel}>Share data with partners</Text>
                    <Text style={styles.rowDescription}>
                      Allow aggregated insights with selected partners.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={sharePartners}
                  onValueChange={setSharePartners}
                  trackColor={{
                    false: 'rgba(148,163,184,0.35)',
                    true: theme.colors.primary,
                  }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                />
              </View>
            </AdaptiveGlassView>
          </View>

          <View style={styles.section} onLayout={register('sessions')}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active sessions</Text>
              <Text style={styles.sectionSubtitle}>
                Review signed-in devices and revoke access if something looks
                suspicious.
              </Text>
            </View>
            <AdaptiveGlassView style={styles.card}>
              <View style={styles.sessionList}>
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionDevice}>iPhone 14 Pro</Text>
                  <Text style={styles.sessionMeta}>Current device</Text>
                </View>
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionDevice}>iPad Air</Text>
                  <Text style={styles.sessionMeta}>Yesterday, 19:30</Text>
                </View>
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionDevice}>MacBook Pro</Text>
                  <Text style={styles.sessionMeta}>3 days ago</Text>
                </View>
              </View>

              <Pressable onPress={handleSignOutAll}>
                <AdaptiveGlassView style={styles.buttonGhost}>
                  <Text style={styles.buttonGhostText}>End all other sessions</Text>
                </AdaptiveGlassView>
              </Pressable>
            </AdaptiveGlassView>
          </View>

          <View style={styles.section} onLayout={register('emergency')}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency actions</Text>
              <Text style={styles.sectionSubtitle}>
                Quick responses when your device is lost or compromised.
              </Text>
            </View>
            <AdaptiveGlassView style={styles.card}>
              <Pressable onPress={handleDeactivateAccount}>
                <AdaptiveGlassView style={styles.emergencyButton}>
                  <Text style={styles.emergencyText}>Deactivate account</Text>
                </AdaptiveGlassView>
              </Pressable>
              <Pressable onPress={handleWipeData}>
                <AdaptiveGlassView
                  style={[styles.emergencyButton, styles.emergencySecondary]}
                >
                  <Text
                    style={[
                      styles.emergencyText,
                      styles.emergencySecondaryText,
                    ]}
                  >
                    Wipe all data
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SecuritySettingsScreen;
