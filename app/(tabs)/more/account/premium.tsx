// app/(tabs)/more/account/premium.tsx
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, createThemedStyles } from '@/constants/theme';
import GradientText from '@/components/ui/GradientText';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import GradientBox from '@/components/ui/GradientBox';
import { Infinity, Check, X } from 'lucide-react-native';

import { useAccountLocalization } from '@/localization/more/account';

type PlanVariant = 'premium' | 'free';

type PremiumProps = {
  variant?: PlanVariant;
  onManageSubscription?: () => void;
  onChangePlan?: () => void;
  onPaymentHistory?: () => void;
  onSelectMonthly?: () => void;
  onSelectYearly?: () => void;
};

type Benefit =
  | {
    label: string;
    kind: 'compare';
    premium: string;
    free: string;
  }
  | {
    label: string;
    kind: 'check';
    premiumHas: boolean;
  };

export default function Premium({
  variant = 'premium',
  onManageSubscription,
  onChangePlan,
  onPaymentHistory,
  onSelectMonthly,
  onSelectYearly,
}: PremiumProps) {
  const theme = useAppTheme();
  const styles = useStyles();
  const { premium: premiumCopy } = useAccountLocalization();

  const chipBackground = theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const isPremium = variant === 'premium';
  const header = isPremium ? premiumCopy.header.premium : premiumCopy.header.free;
  const benefits = premiumCopy.benefits;
  const usage = isPremium ? premiumCopy.usage.premium : premiumCopy.usage.free;

  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectMonthly = () => {
    setSelectedBilling('monthly');
    onSelectMonthly?.();
  };

  const handleSelectYearly = () => {
    setSelectedBilling('yearly');
    onSelectYearly?.();
  };

  const Row = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowInner}>{children}</View>
    </View>
  );

  const Chip = ({
    text,
    backgroundColor,
    textColor,
  }: {
    text: string;
    backgroundColor?: string;
    textColor?: string;
  }) => (
    <View style={[styles.chip, backgroundColor ? { backgroundColor } : null]}>
      <Text style={[styles.chipText, textColor ? { color: textColor } : null]}>{text}</Text>
    </View>
  );

  const PlanOptionCard = ({
    title,
    price,
    subtitle,
    chip,
    rightChip,
    isSelected,
    onPress,
  }: {
    title: string;
    price: string;
    subtitle: string;
    chip?: string;
    rightChip?: string;
    isSelected?: boolean;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        pressed && styles.pressed,
        isSelected && styles.optionSelected,
      ]}
    >
      <View style={styles.optionLeft}>
        <GradientBox style={styles.pricePill}>
          <Text style={styles.priceText}>{price}</Text>
        </GradientBox>
        <View>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSub}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.optionRight}>
        {chip ? <Chip text={chip} backgroundColor={chipBackground} /> : null}
        {rightChip ? (
          <Chip
            text={rightChip}
            backgroundColor={chipBackground}
            textColor={theme.colors.textPrimary}
          />
        ) : null}
      </View>
    </Pressable>
  );

  const PrimaryButton = ({ label, onPress }: { label: string; onPress?: () => void }) => (
    <AdaptiveGlassView style={[styles.primaryBtn, {
      backgroundColor: theme.colors.card
    }]} >
      <Pressable onPress={onPress}>
        <Text style={[styles.primaryBtnText, {
          backgroundColor: "transparent"
        }]}>{label}</Text>
      </Pressable>
    </AdaptiveGlassView>
  );

  const GhostButton = ({ label, onPress }: { label: string; onPress?: () => void }) => (
    <Pressable style={styles.primaryBtn} onPress={onPress}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>

  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 2,
          paddingBottom: 10
        }}>
          <Text style={styles.sectionOverline}>{premiumCopy.planOverline}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={styles.card}>
            {isPremium ? (
              <GradientText style={styles.planTitle}>
                {header.title}
              </GradientText>
            ) : (
              <Text style={styles.planTitle}>{header.title}</Text>
            )}

            <View style={styles.headerLine}>
              <Text style={styles.headerKey}>{header.planLabel}:</Text>
              <Text style={styles.headerValue}>{header.planText}</Text>
            </View>

            {isPremium ? (
              <View style={styles.headerLine}>
                <Text style={styles.headerKey}>{premiumCopy.header.premium.activeLabel}:</Text>
                <Text style={styles.headerValue}>{premiumCopy.header.premium.activeUntil}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={onManageSubscription}
              style={({ pressed }) => [styles.linkWrap, pressed && styles.pressed]}
            >
              <Text style={styles.link}>{premiumCopy.manageSubscription}</Text>
            </Pressable>
          </View>
          {/* <View style={{ width: 120, alignItems: 'center', justifyContent: 'center' }}>
            {!isPremium ? (
              <Text style={[styles.badgeText, !isPremium && styles.badgeTextStrong]}>
                FREE
              </Text>
            ) : (
              <Image source={require("@assets/images/premium.png")} style={styles.premiumBadgeIcon} />
            )}
          </View> */}
        </View>

        <View style={{
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 2,
          paddingBottom: 10
        }}>
          <Text style={styles.sectionOverline}>
            {isPremium ? premiumCopy.benefitsSectionTitle.premium : premiumCopy.benefitsSectionTitle.free}
          </Text>
        </View>

        <View style={styles.card}>
          {benefits.map((benefit, idx) => (
            <Row key={benefit.label} isLast={idx === benefits.length - 1}>
              <Text style={styles.rowLabel}>{benefit.label}</Text>
              {benefit.kind === 'compare' ? (
                <View style={styles.compareContainer}>
                  {benefit.premium === '∞' ? (
                    <Infinity size={18} color={theme.colors.primary} strokeWidth={2.5} />
                  ) : (
                    <Text style={styles.em}>{benefit.premium}</Text>
                  )}
                  <Text style={styles.vs}>vs</Text>
                  <Text style={styles.freeText}>{benefit.free}</Text>
                </View>
              ) : (
                <View style={styles.compareContainer}>
                  <Check size={18} color={theme.colors.success} strokeWidth={2.5} />
                  <Text style={styles.vs}>vs</Text>
                  <X size={18} color={theme.colors.danger} strokeWidth={2.5} />
                </View>
              )}
            </Row>
          ))}
        </View>

        <View style={{
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 2,
          paddingBottom: 10
        }}>
          <Text style={styles.sectionOverline}>
            {premiumCopy.usageSectionTitle}
          </Text>
        </View>

        <View style={styles.card}>
          {usage.map((item, idx) => (
            <Row key={item.label} isLast={idx === usage.length - 1}>
              <Text style={styles.rowLabel}>{item.label}:</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </Row>
          ))}
        </View>

        <View style={{
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 2,
          paddingBottom: 10
        }}>
          <Text style={styles.sectionOverline}>
            {isPremium ? premiumCopy.upgradeSectionTitle.premium : premiumCopy.upgradeSectionTitle.free}
          </Text>
        </View>

        <View style={styles.planOptions}>
          <PlanOptionCard
            title={premiumCopy.planOptions.monthly.title}
            price={premiumCopy.planOptions.monthly.price}
            subtitle={premiumCopy.planOptions.monthly.subtitle}
            rightChip={premiumCopy.planOptions.monthly.rightChip}
            isSelected={selectedBilling === 'monthly'}
            onPress={handleSelectMonthly}
          />
          <PlanOptionCard
            title={premiumCopy.planOptions.yearly.title}
            price={premiumCopy.planOptions.yearly.price}
            subtitle={premiumCopy.planOptions.yearly.subtitle}
            chip={premiumCopy.planOptions.yearly.chip}
            isSelected={selectedBilling === 'yearly'}
            onPress={handleSelectYearly}
          />
        </View>

        <View style={styles.footerButtons}>
          <PrimaryButton label={premiumCopy.buttons.changePlan} onPress={onChangePlan} />
          <GhostButton label={premiumCopy.buttons.paymentHistory} onPress={onPaymentHistory} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.xxxl,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl * 2,
    gap: theme.spacing.xl,
  },
  sectionOverline: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  premiumBadgeIcon: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  card: {
    gap: theme.spacing.md,
  },
  cardRow: {
    fontSize: 24,
  },
  planTitle: {
    color: theme.colors.textSecondary,
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  badgeRight: {
    minWidth: 68,
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
  },
  badgeGem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.primary,
  },
  badgeFree: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.info,
  },
  badgeText: {
    color: theme.colors.textSecondary,
    fontSize: 32,
    fontWeight: '400',
  },
  badgeTextStrong: {
    letterSpacing: 0.4,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerKey: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  headerValue: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '100',
  },
  linkWrap: {
    marginTop: theme.spacing.sm,
  },
  link: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  planOptions: {
    gap: theme.spacing.md,
  },
  row: {
    backgroundColor: "transparent",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  rowLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  rowValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  compareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  em: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  freeText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  vs: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  check: {
    fontWeight: '700',
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: theme.colors.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  optionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  optionSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  pricePill: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
  },
  priceText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  chip: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  ghostBtn: {
    flex: 1,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
}));
