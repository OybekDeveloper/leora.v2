import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  UserRound,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import EmptyState from '@/components/shared/EmptyState';
import type { Theme } from '@/constants/theme';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useRouter } from 'expo-router';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { Debt as LegacyDebt } from '@/types/store.types';
import { mapDomainDebtToLegacy } from '@/utils/finance/debtMappers';

type DebtSectionData = {
  title: string;
  debts: LegacyDebt[];
  isIncoming: boolean;
};

const formatDueIn = (
  debt: LegacyDebt,
  timelineStrings: DebtsStrings['timeline'],
  fallback: string,
) => {
  if (!debt.expectedReturnDate) {
    return fallback;
  }
  const today = new Date();
  const due = new Date(debt.expectedReturnDate);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return timelineStrings.today;
  if (diff > 0) {
    return timelineStrings.inDays.replace('{count}', `${diff}`);
  }
  return timelineStrings.overdue.replace('{count}', `${Math.abs(diff)}`);
};

const formatCalendarDate = (value?: Date) => {
  if (!value) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(value);
  } catch {
    return value.toDateString();
  }
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    glassSurface: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    paddingBottom: 120,
      gap: theme.spacing.xxl,
    },
    summarySection: {
      gap: theme.spacing.md,
    },
    balanceCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    summaryBalanceLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    summaryBalanceValue: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    summaryMiniCard: {
      flex: 1,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    summaryMiniHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryMiniLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    summaryMiniValue: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    summaryMiniChange: {
      fontSize: 12,
      fontWeight: '500',
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    card: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    personBlock: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.08)',
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    description: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    amountBlock: {
      alignItems: 'flex-end',
      gap: 4,
    },
    amount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    secondary: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    timelineRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    timelineLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    timelineValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    timelineMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.lg,
    },
    timelineColumn: {
      flex: 1,
      gap: 2,
    },
    timelineColumnLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    timelineColumnValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
  });

const DebtCard = ({
  debt,
  strings,
  onPress,
  formatAmount,
}: {
  debt: LegacyDebt;
  strings: DebtsStrings;
  onPress?: () => void;
  formatAmount: (value: number, currency: FinanceCurrency) => string;
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isLent = debt.type === 'lent';
  const currency = normalizeFinanceCurrency(debt.currency);
  // Pul oqimi nuqtai nazaridan: lent = pul chiqdi (-), borrowed = pul kirdi (+)
  const signedAmount = `${isLent ? '−' : '+'}${formatAmount(debt.remainingAmount, currency)}`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.95 } : undefined)}>
      <AdaptiveGlassView style={[styles.glassSurface, styles.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.personBlock}>
            <View style={styles.avatar}>
              <UserRound size={18} color={theme.colors.textSecondary} />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={styles.name}>{debt.person}</Text>
              <Text style={styles.description}>{debt.note ?? strings.modal.defaults.description}</Text>
            </View>
          </View>
          <View style={styles.amountBlock}>
            <Text
              style={[
                styles.amount,
                { color: isLent ? theme.colors.danger : theme.colors.success },
              ]}
            >
              {signedAmount}
            </Text>
            {debt.remainingAmount !== debt.amount ? (
              <Text style={styles.secondary}>
                {formatAmount(debt.remainingAmount, currency)} / {formatAmount(debt.amount, currency)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.timelineRow}>
          <View style={styles.avatar}>
            <Calendar size={16} color={isLent ? theme.colors.danger : theme.colors.success} />
          </View>
          <View>
            <Text style={styles.timelineLabel}>
              {isLent ? strings.timeline.incoming : strings.timeline.outgoing}
            </Text>
            <Text style={styles.timelineValue}>
              {formatDueIn(debt, strings.timeline, strings.modal.defaults.due)}
            </Text>
          </View>
        </View>
        <View style={styles.timelineMeta}>
          <View style={styles.timelineColumn}>
            <Text style={styles.timelineColumnLabel}>{strings.modal.dateLabel}</Text>
            <Text style={styles.timelineColumnValue}>
              {formatCalendarDate(debt.date) ?? strings.modal.selectDate}
            </Text>
          </View>
          <View style={styles.timelineColumn}>
            <Text style={styles.timelineColumnLabel}>{strings.modal.expectedReturn}</Text>
            <Text style={styles.timelineColumnValue}>
              {formatCalendarDate(debt.expectedReturnDate) ?? strings.modal.expectedPlaceholder}
            </Text>
          </View>
        </View>
      </AdaptiveGlassView>
    </Pressable>
  );
};

const DebtSection = ({
  section,
  strings,
  onCardPress,
  formatAmount,
}: {
  section: DebtSectionData;
  strings: DebtsStrings;
  onCardPress?: (debt: LegacyDebt) => void;
  formatAmount: (value: number, currency: FinanceCurrency) => string;
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionDivider} />
      <View style={{ gap: theme.spacing.md }}>
        {section.debts.map((debt) => (
          <DebtCard
            key={debt.id}
            debt={debt}
            strings={strings}
            onPress={() => onCardPress?.(debt)}
            formatAmount={formatAmount}
          />
        ))}
      </View>
    </View>
  );
};


const DebtsScreen: React.FC = () => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const debtsStrings = strings.financeScreens.debts;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const domainDebts = useFinanceDomainStore((state) => state.debts);
  const debts = useMemo<LegacyDebt[]>(() => domainDebts.map(mapDomainDebtToLegacy), [domainDebts]);
  const {
    formatCurrency,
    convertAmount,
    globalCurrency,
    formatAccountAmount,
  } = useFinanceCurrency();

  const incoming = useMemo(() => debts.filter((debt) => debt.type === 'lent'), [debts]);
  const outgoing = useMemo(() => debts.filter((debt) => debt.type === 'borrowed'), [debts]);

  const summaryMetrics = useMemo(() => {
    const totalGiven = incoming.reduce(
      (sum, debt) => sum + convertAmount(debt.remainingAmount, normalizeFinanceCurrency(debt.currency), globalCurrency),
      0,
    );
    const totalTaken = outgoing.reduce(
      (sum, debt) => sum + convertAmount(debt.remainingAmount, normalizeFinanceCurrency(debt.currency), globalCurrency),
      0,
    );
    const formatValue = (value: number) =>
      formatCurrency(value, { fromCurrency: globalCurrency, convert: false });

    return {
      balance: formatValue(totalGiven - totalTaken),
      given: {
        amount: formatValue(totalGiven),
        change: debtsStrings.summary.givenChange,
      },
      taken: {
        amount: formatValue(totalTaken),
        change: debtsStrings.summary.takenChange,
      },
    };
  }, [convertAmount, debtsStrings.summary, formatCurrency, globalCurrency, incoming, outgoing]);

  const handleDebtPress = React.useCallback(
    (debt: LegacyDebt) => {
      router.push({ pathname: '/(modals)/finance/debt-detail', params: { id: debt.id } });
    },
    [router],
  );

  // Faqat ma'lumot bor bo'limlarni ko'rsatish
  const sections: DebtSectionData[] = useMemo(
    () => [
      { title: debtsStrings.sections.incoming, debts: incoming, isIncoming: true },
      { title: debtsStrings.sections.outgoing, debts: outgoing, isIncoming: false },
    ].filter((section) => section.debts.length > 0),
    [debtsStrings.sections, incoming, outgoing],
  );

  const isEmpty = debts.length === 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <EmptyState
            title={debtsStrings.empty.title}
            subtitle={debtsStrings.empty.subtitle}
          />
        ) : (
          <>
            <View style={styles.summarySection}>
              <AdaptiveGlassView
                style={[
                  styles.glassSurface,
                  styles.balanceCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Text style={[styles.summaryBalanceLabel, { color: theme.colors.textSecondary }]}>
                  {debtsStrings.summary.balanceLabel}
                </Text>
                <Text style={[styles.summaryBalanceValue, { color: theme.colors.textPrimary }]}>
                  {summaryMetrics.balance}
                </Text>
              </AdaptiveGlassView>
              <View style={styles.summaryRow}>
                <AdaptiveGlassView
                  style={[
                    styles.glassSurface,
                    styles.summaryMiniCard,
                    { backgroundColor: theme.colors.card },
                  ]}
                >
                  <View style={styles.summaryMiniHeader}>
                    <Text style={[styles.summaryMiniLabel, { color: theme.colors.textSecondary }]}>
                      {debtsStrings.summary.givenLabel}
                    </Text>
                    <TrendingUp size={14} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.summaryMiniValue, { color: theme.colors.success }]}>
                    {summaryMetrics.given.amount}
                  </Text>
                  <Text style={[styles.summaryMiniChange, { color: theme.colors.textSecondary }]}>
                    {summaryMetrics.given.change}
                  </Text>
                </AdaptiveGlassView>
                <AdaptiveGlassView
                  style={[
                    styles.glassSurface,
                    styles.summaryMiniCard,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                  ]}
                >
                  <View style={styles.summaryMiniHeader}>
                    <Text style={[styles.summaryMiniLabel, { color: theme.colors.textSecondary }]}>
                      {debtsStrings.summary.takenLabel}
                    </Text>
                    <TrendingDown size={14} color={theme.colors.danger} />
                  </View>
                  <Text style={[styles.summaryMiniValue, { color: theme.colors.danger }]}>
                    {summaryMetrics.taken.amount}
                  </Text>
                  <Text style={[styles.summaryMiniChange, { color: theme.colors.textSecondary }]}>
                    {summaryMetrics.taken.change}
                  </Text>
                </AdaptiveGlassView>
              </View>
            </View>

            {sections.map((section) => (
              <DebtSection
                key={section.title}
                section={section}
                strings={debtsStrings}
                onCardPress={handleDebtPress}
                formatAmount={formatAccountAmount}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default DebtsScreen;
type DebtsStrings = ReturnType<typeof useLocalization>['strings']['financeScreens']['debts'];
