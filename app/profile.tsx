import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { LevelProgress } from '@/components/shared/LevelProgress';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useLocalization } from '@/localization/useLocalization';
import type { AppTranslations } from '@/localization/strings';
import type { User } from '@/types/auth.types';
import CustomBottomSheet, { BottomSheetHandle } from '@/components/modals/BottomSheet';
import {
  AVAILABLE_FINANCE_CURRENCIES,
  FINANCE_REGION_PRESETS,
  type FinanceCurrency,
  type FinanceRegion,
  getFinanceRegionPreset,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { FxProviderId } from '@/services/fx/providers';

type VisibilityOption = NonNullable<User['visibility']> | 'public' | 'friends' | 'private';
type EditProfileFormState = {
  fullName: string;
  email: string;
  username: string;
  phoneNumber: string;
  bio: string;
  visibility: VisibilityOption;
};

type PreferenceKey = 'showLevel' | 'showAchievements' | 'showStatistics';

const XP_PER_LEVEL = 500;
const XP_ACTIONS = [
  { label: 'Daily Login', value: '+10 XP' },
  { label: 'Add Transaction', value: '+5 XP' },
  { label: 'Complete Task', value: '+10 XP' },
  { label: 'Reach Daily Goal', value: '+50 XP' },
  { label: 'Week Streak', value: '+100 XP' },
  { label: 'New Habit 7 Days', value: '+200 XP' },
];

const LEVEL_REWARDS = [
  { label: 'Level 15', value: 'New Mentor Unlocked' },
  { label: 'Level 20', value: 'Exclusive Theme Unlocked' },
  { label: 'Level 25', value: 'VIP Community Status' },
  { label: 'Level 30', value: '1 Month Premium for Free' },
];

const CURRENCY_LABELS: Record<FinanceCurrency, string> = {
  UZS: 'Uzbekistani Som',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  TRY: 'Turkish Lira',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham',
  USDT: 'Tether (USDT)',
  RUB: 'Russian Ruble',
};

const ProfileScreen = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useStyles();
  const { strings, locale } = useLocalization();
  const profileStrings = strings.profile;
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const logout = useAuthStore((state) => state.logout);
  const tasks = usePlannerDomainStore((state) => state.tasks);
  const editSheetRef = useRef<BottomSheetHandle>(null);
  const regionSheetRef = useRef<BottomSheetHandle>(null);
  const currencySheetRef = useRef<BottomSheetHandle>(null);

  const [formState, setFormState] = useState<EditProfileFormState>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    bio: user?.bio ?? '',
    visibility: (user?.visibility ?? 'friends') as VisibilityOption,
  });
  const [confirmAction, setConfirmAction] = useState<'delete' | 'logout' | null>(null);
  const [currencyQuery, setCurrencyQuery] = useState('');
  const [currencySheetMode, setCurrencySheetMode] = useState<'display' | 'override'>('display');
  const [syncingRates, setSyncingRates] = useState(false);
  const [overrideInput, setOverrideInput] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<FxProviderId>('central_bank_stub');
  const [fxSyncStatus, setFxSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const {
    region: financeRegion,
    baseCurrency,
    globalCurrency,
    setRegion: applyFinanceRegion,
    setGlobalCurrency,
    syncExchangeRates,
    overrideExchangeRate,
  } = useFinancePreferencesStore(
    useShallow((state) => ({
      region: state.region,
      baseCurrency: state.baseCurrency,
      globalCurrency: state.globalCurrency,
      setRegion: state.setRegion,
      setGlobalCurrency: state.setGlobalCurrency,
      syncExchangeRates: state.syncExchangeRates,
      overrideExchangeRate: state.overrideExchangeRate,
    })),
  );
  const [overrideCurrency, setOverrideCurrency] = useState<FinanceCurrency>(() => {
    if (globalCurrency !== baseCurrency) {
      return globalCurrency;
    }
    const fallback = AVAILABLE_FINANCE_CURRENCIES.find((code) => code !== baseCurrency) ?? baseCurrency;
    return fallback;
  });

  const closeEditSheet = useCallback(() => {
    editSheetRef.current?.dismiss();
  }, []);

  useEffect(() => {
    setFormState({
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      username: user?.username ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      bio: user?.bio ?? '',
      visibility: (user?.visibility ?? 'friends') as VisibilityOption,
    });
  }, [user]);

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed').length,
    [tasks],
  );
  const activeTasks = useMemo(() => tasks.length - completedTasks, [tasks, completedTasks]);
  const xp = completedTasks * 50 + activeTasks * 20;
  const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;

  const createdAt = useMemo(
    () => (user?.createdAt ? new Date(user.createdAt) : null),
    [user?.createdAt],
  );
  const joinedLabel = createdAt
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(createdAt)
    : '—';

  const initials = useMemo(() => {
    const source = user?.fullName || user?.username || 'U';
    return source.slice(0, 2).toUpperCase();
  }, [user]);

  const preferences = useMemo(
    () =>
      user?.preferences ?? {
        showLevel: true,
        showAchievements: true,
        showStatistics: false,
      },
    [user?.preferences],
  );
  const financeRegionPreset = useMemo(
    () => getFinanceRegionPreset(financeRegion),
    [financeRegion],
  );
  const currencyOptions = useMemo(
    () =>
      AVAILABLE_FINANCE_CURRENCIES.map((code) => ({
        code,
        label: CURRENCY_LABELS[code],
      })),
    [],
  );
  const filteredCurrencies = useMemo(() => {
    if (!currencyQuery.trim()) {
      return currencyOptions;
    }
    const needle = currencyQuery.trim().toLowerCase();
    return currencyOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(needle) ||
        option.label.toLowerCase().includes(needle),
    );
  }, [currencyOptions, currencyQuery]);
  const currencyDisplayLabel = useMemo(
    () => `${globalCurrency} · ${CURRENCY_LABELS[globalCurrency] ?? globalCurrency}`,
    [globalCurrency],
  );
  const currencySheetTitle =
    currencySheetMode === 'override'
      ? profileStrings.finance.fxOverrideSheetTitle
      : profileStrings.finance.currencySheetTitle;
  const currencySheetActiveCode = currencySheetMode === 'override' ? overrideCurrency : globalCurrency;
  const providerOptions = useMemo(
    () =>
      [
        { id: 'central_bank_stub' as FxProviderId, label: profileStrings.finance.fxProviders.central_bank_stub },
        { id: 'market_stub' as FxProviderId, label: profileStrings.finance.fxProviders.market_stub },
      ],
    [profileStrings.finance.fxProviders],
  );
  const lastSyncLabel = useMemo(() => {
    if (!lastSyncedAt) {
      return null;
    }
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(lastSyncedAt);
  }, [lastSyncedAt, locale]);

  const statCards = useMemo(
    () => [
      { label: profileStrings.stats.daysWithApp, value: String(Math.max(1, Math.floor((Date.now() - (createdAt?.getTime() ?? Date.now())) / (1000 * 60 * 60 * 24)))) },
      { label: profileStrings.stats.completedTasks, value: completedTasks.toString() },
      { label: profileStrings.stats.activeTasks, value: Math.max(activeTasks, 0).toString() },
      { label: profileStrings.stats.level, value: level.toString() },
    ],
    [profileStrings.stats, completedTasks, activeTasks, level, createdAt],
  );

  const handleTogglePreference = useCallback(
    (key: PreferenceKey, value: boolean) => {
      updateUser({
        preferences: {
          ...preferences,
          [key]: value,
        },
      });
    },
    [preferences, updateUser],
  );
  const handleSelectRegionPreference = useCallback(
    (regionId: FinanceRegion) => {
      applyFinanceRegion(regionId);
      regionSheetRef.current?.dismiss();
    },
    [applyFinanceRegion],
  );
  const handleSelectCurrencyPreference = useCallback(
    (currency: FinanceCurrency) => {
      if (currencySheetMode === 'override') {
        setOverrideCurrency(currency);
        setCurrencyQuery('');
        currencySheetRef.current?.dismiss();
        return;
      }
      setGlobalCurrency(currency);
      setCurrencyQuery('');
      currencySheetRef.current?.dismiss();
    },
    [currencySheetMode, setGlobalCurrency],
  );
  const openRegionSheet = useCallback(() => {
    regionSheetRef.current?.present();
  }, []);
  const openCurrencySheet = useCallback((mode: 'display' | 'override' = 'display') => {
    setCurrencySheetMode(mode);
    currencySheetRef.current?.present();
  }, []);

  const handleSaveProfile = useCallback(() => {
    updateUser({
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      username: formState.username.trim(),
      phoneNumber: formState.phoneNumber?.trim() || undefined,
      bio: formState.bio.trim(),
      visibility: formState.visibility as User['visibility'],
    });
    editSheetRef.current?.dismiss();
  }, [formState, updateUser]);

  useEffect(() => {
    if (overrideCurrency === baseCurrency) {
      const fallback = AVAILABLE_FINANCE_CURRENCIES.find((code) => code !== baseCurrency) ?? baseCurrency;
      setOverrideCurrency(fallback);
    }
  }, [baseCurrency, overrideCurrency]);

  useEffect(() => {
    setOverrideError(null);
    setOverrideSuccess(null);
  }, [overrideCurrency, overrideInput]);

  const handleSyncRates = useCallback(async () => {
    setFxSyncStatus(null);
    try {
      setSyncingRates(true);
      await syncExchangeRates(selectedProvider);
      setLastSyncedAt(new Date());
      const providerLabel = providerOptions.find((item) => item.id === selectedProvider)?.label ?? '';
      setFxSyncStatus({
        type: 'success',
        message: profileStrings.finance.fxSyncSuccess.replace('{provider}', providerLabel),
      });
    } catch (error) {
      setFxSyncStatus({ type: 'error', message: profileStrings.finance.fxSyncError });
    } finally {
      setSyncingRates(false);
    }
  }, [profileStrings.finance.fxSyncError, profileStrings.finance.fxSyncSuccess, providerOptions, selectedProvider, syncExchangeRates]);

  const handleApplyOverride = useCallback(() => {
    const sanitizedInput = overrideInput.replace(/\s+/g, '').replace(',', '.');
    const normalizedValue = Number(sanitizedInput);
    if (overrideCurrency === baseCurrency) {
      setOverrideError(profileStrings.finance.fxOverrideBaseError);
      return;
    }
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
      setOverrideError(profileStrings.finance.fxOverrideError);
      return;
    }
    overrideExchangeRate(overrideCurrency, normalizedValue);
    setOverrideInput('');
    setOverrideSuccess(
      profileStrings.finance.fxOverrideSuccess.replace(
        '{currency}',
        `${overrideCurrency} · ${CURRENCY_LABELS[overrideCurrency] ?? overrideCurrency}`,
      ),
    );
  }, [baseCurrency, overrideCurrency, overrideExchangeRate, overrideInput, profileStrings.finance.fxOverrideBaseError, profileStrings.finance.fxOverrideError, profileStrings.finance.fxOverrideSuccess]);

  const pickProfileImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      updateUser({ profileImage: result.assets[0].uri });
    }
  }, [updateUser]);

  const handleRemoveProfileImage = useCallback(() => {
    updateUser({ profileImage: undefined });
  }, [updateUser]);

  const handleDeleteAccount = useCallback(async () => {
    setConfirmAction(null);
    const success = await deleteAccount();
    if (success) {
      router.replace('/(auth)/login');
    }
  }, [deleteAccount, router]);

  const handleLogout = useCallback(async () => {
    setConfirmAction(null);
    await logout();
    router.replace('/(auth)/login');
  }, [logout, router]);

  const avatarElement = user?.profileImage ? (
    <Image source={user.profileImage} style={styles.avatarImage} />
  ) : (
    <View style={[styles.avatarFallback, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.avatarInitials, { color: theme.colors.textPrimary }]}>{initials}</Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>{profileStrings.title}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
          >
            {strings.more.helpItems.support}
          </Text>
          <Pressable style={[styles.primaryButton, styles.fullWidth]} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.primaryButtonLabel}>{strings.more.logout}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <SectionHeader label={profileStrings.title} />
          <View style={styles.profileHero}>
            <View style={styles.heroActions}>
              <Pressable
                style={[styles.changeAction]}
                onPress={pickProfileImage}
              >
                <View style={[styles.changeActionIcon, { backgroundColor: theme.colors.card }]}> 
                  <Feather name="image" size={18} color={theme.colors.textPrimary} />
                </View>
                <Text style={[styles.changeActionText, { color: theme.colors.textPrimary }]}>
                  {profileStrings.buttons.changePhoto}
                </Text>
                <Feather name="arrow-up-right" size={18} color={theme.colors.textSecondary} />
              </Pressable>
              {user.profileImage ? (
                <Pressable
                  style={[styles.removeAction]}
                  onPress={handleRemoveProfileImage}
                >
                  <Feather name="trash-2" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.removeActionText, { color: theme.colors.textSecondary }]}>
                    {profileStrings.buttons.removePhoto}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <AdaptiveGlassView style={[styles.avatarGlass]}> 
              <Pressable onPress={pickProfileImage} style={styles.avatarPressable}>
                {avatarElement}
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader label={profileStrings.sections.personal} />
          <InfoRow
            label={profileStrings.fields.fullName}
            value={user.fullName ?? '—'}
            onPress={() => editSheetRef.current?.present()}
          />
          <InfoRow
            label={profileStrings.fields.email}
            value={user.email ?? '—'}
            onPress={() => editSheetRef.current?.present()}
          />
          <InfoRow
            label={profileStrings.fields.phone}
            value={user.phoneNumber ?? '—'}
            onPress={() => editSheetRef.current?.present()}
          />
          <InfoRow
            label={profileStrings.fields.username}
            value={user.username ?? '—'}
            onPress={() => editSheetRef.current?.present()}
          />
          <InfoRow
            label={profileStrings.fields.joined}
            value={joinedLabel}
            showIcon={false}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader label={profileStrings.sections.stats} />
          {statCards.map((stat) => (
            <StatRow key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader label={profileStrings.sections.finance} />
          <InfoRow
            label={profileStrings.finance.regionLabel}
            value={`${financeRegionPreset.label} · ${financeRegionPreset.currency}`}
            onPress={openRegionSheet}
            trailingIcon="chevron-down"
          />
          <InfoRow
            label={profileStrings.finance.currencyLabel}
            value={currencyDisplayLabel}
            onPress={() => openCurrencySheet('display')}
            trailingIcon="chevron-down"
          />
          <AdaptiveGlassView style={styles.fxCard}>
            <Text style={[styles.fxTitle, { color: theme.colors.textPrimary }]}>{profileStrings.finance.fxTitle}</Text>
            <Text style={[styles.fxSubtitle, { color: theme.colors.textSecondary }]}>
              {profileStrings.finance.fxDescription}
            </Text>
            <Text style={[styles.fxMetaLabel, { color: theme.colors.textSecondary }]}>
              {profileStrings.finance.fxProviderLabel}
            </Text>
            <View style={styles.fxProviderRow}>
              {providerOptions.map((option) => {
                const isActive = option.id === selectedProvider;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedProvider(option.id)}
                    style={({ pressed }) => [
                      styles.fxProviderChip,
                      {
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isActive ? `${theme.colors.primary}22` : theme.colors.card,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fxProviderChipLabel,
                        { color: isActive ? theme.colors.primary : theme.colors.textPrimary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={[styles.primaryButton, syncingRates && styles.primaryButtonDisabled]}
              disabled={syncingRates}
              onPress={handleSyncRates}
            >
              <Text style={styles.primaryButtonLabel}>
                {syncingRates ? profileStrings.finance.fxSyncing : profileStrings.finance.fxSyncButton}
              </Text>
            </Pressable>
            {fxSyncStatus ? (
              <Text
                style={[
                  styles.fxStatusText,
                  { color: fxSyncStatus.type === 'error' ? theme.colors.danger : theme.colors.success },
                ]}
              >
                {fxSyncStatus.message}
              </Text>
            ) : null}
            {lastSyncLabel ? (
              <Text style={[styles.fxStatusText, { color: theme.colors.textSecondary }]}>
                {profileStrings.finance.fxLastSync.replace('{value}', lastSyncLabel)}
              </Text>
            ) : null}
          </AdaptiveGlassView>
          <AdaptiveGlassView style={styles.fxCard}>
            <Text style={[styles.fxTitle, { color: theme.colors.textPrimary }]}>{profileStrings.finance.fxManualTitle}</Text>
            <Text style={[styles.fxSubtitle, { color: theme.colors.textSecondary }]}>
              {profileStrings.finance.fxManualHint.replace('{base}', baseCurrency)}
            </Text>
            <View style={styles.fxOverrideRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.fxCurrencyButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={() => openCurrencySheet('override')}
              >
                <Text style={[styles.fxCurrencyLabel, { color: theme.colors.textSecondary }]}>
                  {profileStrings.finance.fxManualCurrencyLabel}
                </Text>
                <Text style={[styles.fxCurrencyValue, { color: theme.colors.textPrimary }]}>{overrideCurrency}</Text>
              </Pressable>
              <TextInput
                value={overrideInput}
                onChangeText={setOverrideInput}
                keyboardType="decimal-pad"
                placeholder={profileStrings.finance.fxOverridePlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                style={[
                  styles.fxRateInput,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
              />
            </View>
            <Pressable style={styles.secondaryButton} onPress={handleApplyOverride}>
              <Text style={styles.secondaryButtonLabel}>{profileStrings.finance.fxOverrideButton}</Text>
            </Pressable>
            {overrideError ? (
              <Text style={[styles.fxStatusText, { color: theme.colors.danger }]}>{overrideError}</Text>
            ) : null}
            {overrideSuccess ? (
              <Text style={[styles.fxStatusText, { color: theme.colors.success }]}>{overrideSuccess}</Text>
            ) : null}
          </AdaptiveGlassView>
        </View>

        <View style={styles.section}>
          <SectionHeader label={profileStrings.sections.preferences} />
          <InfoRow
            label={profileStrings.fields.visibility}
            value={profileStrings.fields.visibilityOptions[formState.visibility]}
            onPress={() => {
              const options: VisibilityOption[] = ['public', 'friends', 'private'];
              const idx = options.indexOf(formState.visibility);
              const next = options[(idx + 1) % options.length];
              setFormState((prev) => ({ ...prev, visibility: next }));
              updateUser({ visibility: next });
            }}
            trailingIcon="chevron-down"
          />
          <PreferenceCheckbox
            label={profileStrings.fields.showLevel}
            value={!!preferences.showLevel}
            onToggle={(value) => handleTogglePreference('showLevel', value)}
          />
          <PreferenceCheckbox
            label={profileStrings.fields.showAchievements}
            value={!!preferences.showAchievements}
            onToggle={(value) => handleTogglePreference('showAchievements', value)}
          />
          <PreferenceCheckbox
            label={profileStrings.fields.showStatistics}
            value={!!preferences.showStatistics}
            onToggle={(value) => handleTogglePreference('showStatistics', value)}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader label={profileStrings.fields.bio} />
          <AdaptiveGlassView style={[styles.bioCard]}> 
            <Text style={[styles.bioText, { color: theme.colors.textPrimary }]}>
              {user.bio?.trim() || profileStrings.fields.bio}
            </Text>
          </AdaptiveGlassView>
        </View>

        <View style={styles.section}>
          <SectionHeader label={profileStrings.xp.label} />
          <AdaptiveGlassView style={[styles.levelHighlight]}> 
            <View style={[styles.levelCircle, { backgroundColor: theme.colors.surface }]}> 
              <Text style={[styles.levelCircleText, { color: theme.colors.textPrimary }]}>{level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.levelLabel, { color: theme.colors.textPrimary }]}>
                {strings.more.values.level} {level}
              </Text>
              <Text style={[styles.levelDescription, { color: theme.colors.textSecondary }]}>
                {profileStrings.xp.toNext.replace('{value}', xpToNextLevel.toString())}
              </Text>
            </View>
          </AdaptiveGlassView>
          <AdaptiveGlassView style={[styles.levelProgressCard]}> 
            <View style={styles.progressHeader}>
              <Text style={[styles.levelLabel, { color: theme.colors.textPrimary }]}>{profileStrings.xp.label}</Text>
              <View style={styles.progressValueWrap}>
                <Feather name="star" size={14} color={theme.colors.warning} />
                <Text style={[styles.progressValue, { color: theme.colors.textPrimary }]}>
                  {`${xpIntoLevel}/${XP_PER_LEVEL} XP`}
                </Text>
              </View>
            </View>
            <LevelProgress
              level={level}
              nextLevel={level + 1}
              currentXp={xpIntoLevel}
              targetXp={XP_PER_LEVEL}
            />
          </AdaptiveGlassView>
          <SectionHeader label="How to earn XP" />
          {XP_ACTIONS.map((item) => (
            <KeyValueRow key={item.label} label={item.label} value={item.value} />
          ))}
          <SectionHeader label="Level-up rewards" />
          {LEVEL_REWARDS.map((reward) => (
            <KeyValueRow key={reward.label} label={reward.label} value={reward.value} />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader label={profileStrings.sections.actions} />
          <Pressable style={[styles.secondaryButton]} onPress={() => setConfirmAction('logout')}>
            <Text style={styles.secondaryButtonLabel}>{profileStrings.buttons.logout}</Text>
          </Pressable>
          <Pressable style={[styles.dangerButton]} onPress={() => setConfirmAction('delete')}>
            <Text style={styles.dangerButtonLabel}>{profileStrings.buttons.delete}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <EditProfileSheet
        ref={editSheetRef}
        formState={formState}
        onChange={setFormState}
        onSave={handleSaveProfile}
        onClose={closeEditSheet}
        strings={profileStrings}
      />
      <ConfirmDialog
        visible={confirmAction !== null}
        title=
          {confirmAction === 'delete'
            ? profileStrings.buttons.confirmDeleteTitle
            : strings.more.confirmLogout.title}
        message=
          {confirmAction === 'delete'
            ? profileStrings.buttons.confirmDeleteMessage
            : strings.more.confirmLogout.message}
        confirmLabel=
          {confirmAction === 'delete'
            ? profileStrings.buttons.confirmDeleteConfirm
            : strings.more.confirmLogout.confirm}
        cancelLabel=
          {confirmAction === 'delete'
            ? profileStrings.buttons.confirmDeleteCancel
            : strings.more.confirmLogout.cancel}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmAction === 'delete' ? handleDeleteAccount : handleLogout}
      />
      <CustomBottomSheet
        ref={regionSheetRef}
        snapPoints={['60%']}
        enableDynamicSizing
        scrollable
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
            {profileStrings.finance.regionSheetTitle}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {FINANCE_REGION_PRESETS.map((preset) => {
              const isActive = preset.id === financeRegion;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelectRegionPreference(preset.id as FinanceRegion)}
                  style={({ pressed }) => [styles.preferencePressable, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.preferenceCard,
                      {
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: theme.colors.card,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.preferenceCardTitle, { color: theme.colors.textPrimary }]}>
                        {preset.label}
                      </Text>
                      <Text style={[styles.preferenceCardSubtitle, { color: theme.colors.textSecondary }]}>
                        {preset.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.preferenceBadge,
                        {
                          borderColor: isActive ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isActive ? `${theme.colors.primary}22` : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.preferenceBadgeText, { color: theme.colors.textPrimary }]}>
                        {preset.currency}
                      </Text>
                    </View>
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </CustomBottomSheet>
      <CustomBottomSheet
        ref={currencySheetRef}
        snapPoints={['65%']}
        enableDynamicSizing
        scrollable
        onDismiss={() => setCurrencyQuery('')}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
            {currencySheetTitle}
          </Text>
          <AdaptiveGlassView
            style={[
              styles.currencySearchContainer,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
            ]}
          >
            <BottomSheetTextInput
              value={currencyQuery}
              onChangeText={setCurrencyQuery}
              placeholder={profileStrings.finance.currencySearchPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.currencySearchInput, { color: theme.colors.textPrimary }]}
            />
          </AdaptiveGlassView>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.currencyList}
          >
            {filteredCurrencies.map((option) => {
              const isActive = option.code === currencySheetActiveCode;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => handleSelectCurrencyPreference(option.code)}
                  style={({ pressed }) => [styles.currencyRowPressable, pressed && styles.pressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.currencyRow,
                      {
                        borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        backgroundColor: theme.colors.card,
                      },
                    ]}
                  >
                    <View>
                      <Text style={[styles.currencyCode, { color: theme.colors.textPrimary }]}>
                        {option.code}
                      </Text>
                      <Text style={[styles.currencyLabel, { color: theme.colors.textSecondary }]}>
                        {option.label}
                      </Text>
                    </View>
                    {isActive && (
                      <Feather name="check" size={16} color={theme.colors.primary} />
                    )}
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </CustomBottomSheet>
    </SafeAreaView>
  );
};

const SectionHeader = ({ label }: { label: string }) => {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View style={[styles.sectionDivider, { backgroundColor: theme.colors.border }]} />
    </View>
  );
};

const InfoRow = ({
  label,
  value,
  onPress,
  trailingIcon,
  showIcon = true,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  trailingIcon?: keyof typeof Feather.glyphMap;
  showIcon?: boolean;
}) => {
  const styles = useStyles();
  const theme = useAppTheme();
  const content = (
    <View style={styles.rowContent}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {value || '—'}
        </Text>
      </View>
      {showIcon && onPress && (
        <View style={styles.rowAction}>
          <Feather name={trailingIcon ?? 'edit-3'} size={16} color={theme.colors.textSecondary} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable style={[styles.rowContainer, { borderColor: theme.colors.border }]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.rowContainer, { borderColor: theme.colors.border }]}>{content}</View>
  );
};

const StatRow = ({ label, value }: { label: string; value: string }) => {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <View style={[styles.rowContainer, { borderColor: theme.colors.border }]}>
      <View style={styles.rowContent}>
        <Text style={[styles.statLabelText, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValueText, { color: theme.colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
};

const PreferenceCheckbox = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: (value: boolean) => void }) => {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <Pressable style={styles.checkboxRow} onPress={() => onToggle(!value)}>
      <View
        style={[
          styles.checkboxBox,
          {
            borderColor: value ? theme.colors.card : theme.colors.textSecondary,
            backgroundColor: value ? theme.colors.card : 'transparent',
          },
        ]}
      >
        {value && <Feather name="check" size={12} color={theme.colors.white} />}
      </View>
      <Text style={[styles.checkboxLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
};

const KeyValueRow = ({ label, value }: { label: string; value: string }) => {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <View style={[styles.keyValueRow, { borderColor: theme.colors.border }]}> 
      <Text style={[styles.keyValueLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.keyValueValue, { color: theme.colors.textPrimary }]}>{value}</Text>
    </View>
  );
};

const EditProfileSheet = React.forwardRef<BottomSheetHandle, {
  formState: EditProfileFormState;
  onChange: React.Dispatch<React.SetStateAction<EditProfileFormState>>;
  onSave: () => void;
  onClose: () => void;
  strings: AppTranslations['profile'];
}>(({ formState, onChange, onSave, onClose, strings }, ref) => {
  const styles = useStyles();
  const theme = useAppTheme();

  const handleChange = (key: keyof EditProfileFormState, value: string) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <CustomBottomSheet ref={ref} snapPoints={['70%']} enableDynamicSizing scrollable>
      <View style={styles.sheetContent}>
        <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>{strings.buttons.edit}</Text>
        <TextInput
          value={formState.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
          placeholder={strings.fields.fullName}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          value={formState.email}
          onChangeText={(text) => handleChange('email', text)}
          placeholder={strings.fields.email}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={formState.username}
          onChangeText={(text) => handleChange('username', text)}
          placeholder={strings.fields.username}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          value={formState.phoneNumber}
          onChangeText={(text) => handleChange('phoneNumber', text)}
          placeholder={strings.fields.phone}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="phone-pad"
        />
        <TextInput
          value={formState.bio}
          onChangeText={(text) => handleChange('bio', text)}
          placeholder={strings.fields.bio}
          style={[
            styles.input,
            styles.multilineInput,
            { borderColor: theme.colors.border, color: theme.colors.textPrimary },
          ]}
          placeholderTextColor={theme.colors.textMuted}
          multiline
        />
        <View style={styles.sheetActions}>
          <Pressable style={[styles.secondaryButton, styles.flexButton]} onPress={onClose}>
            <Text style={styles.secondaryButtonLabel}>{strings.buttons.cancel}</Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, styles.flexButton]} onPress={onSave}>
            <Text style={styles.primaryButtonLabel}>{strings.buttons.save}</Text>
          </Pressable>
        </View>
      </View>
    </CustomBottomSheet>
  );
});

EditProfileSheet.displayName = 'EditProfileSheet';

const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmBackdrop}>
        <AdaptiveGlassView style={[styles.confirmCard, { backgroundColor: theme.colors.card }]}> 
          <Text style={[styles.confirmTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.confirmMessage, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={styles.confirmActions}>
            <Pressable style={[styles.secondaryButton, styles.flexButton]} onPress={onCancel}>
              <Text style={styles.secondaryButtonLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[styles.dangerButton, styles.flexButton]} onPress={onConfirm}>
              <Text style={styles.dangerButtonLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </AdaptiveGlassView>
      </View>
    </Modal>
  );
};

const useStyles = createThemedStyles((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl * 2,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.xxl,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    gap: theme.spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  heroActions: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  changeAction: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  changeActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  removeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  removeActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  avatarGlass: {
    borderRadius: 28,
  },
  avatarPressable: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius:28
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius:28
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
  },
  rowContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingVertical: 12,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowAction: {
    paddingLeft: theme.spacing.sm,
  },
  statLabelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statValueText: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor:theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  dangerButton: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: "white",
  },
  flexButton: {
    flex: 1,
  },
  levelHighlight: {
    borderRadius: 24,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  levelCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleText: {
    fontSize: 20,
    fontWeight: '700',
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  levelDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  levelProgressCard: {
    borderRadius: 22,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  progressValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  bioCard: {
    borderRadius: 22,
    padding: theme.spacing.lg,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
  keyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  keyValueLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  keyValueValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  fxCard: {
    borderRadius: 22,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  fxTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fxSubtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  fxMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fxProviderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  fxProviderChip: {
    borderRadius: 16,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fxProviderChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  fxStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fxOverrideRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  fxCurrencyButton: {
    flexDirection: 'column',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flex: 0.5,
    minWidth: 130,
  },
  fxCurrencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fxCurrencyValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  fxRateInput: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  preferencePressable: {
    marginBottom: theme.spacing.md,
  },
  preferenceCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  preferenceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  preferenceCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  preferenceBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  preferenceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sheetContent: {
    gap: 12,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  currencySearchContainer: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  currencySearchInput: {
    borderWidth: 0,
  },
  currencyList: {
    paddingBottom: 24,
  },
  currencyRowPressable: {
    marginBottom: 10,
  },
  currencyRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '700',
  },
  currencyLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmMessage: {
    fontSize: 14,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
}));

export default ProfileScreen;
