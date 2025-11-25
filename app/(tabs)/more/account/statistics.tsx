import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useAccountLocalization } from '@/localization/more/account';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: 32
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.xl,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    sectionCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    infoRow: {
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(34,36,48,0.85)'
          : 'rgba(229,232,240,0.88)',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    infoLabelGroup: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    infoMeta: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    infoValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    chartsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      flexWrap: 'wrap',
    },
    radialCard: {
      flex: 1,
      minWidth: 180,
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(32,34,44,0.9)'
          : 'rgba(226,232,240,0.85)',
    },
    radialLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    radialValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    improvementGrid: {
      gap: theme.spacing.sm,
    },
    improvementRow: {
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(35,39,51,0.85)'
          : 'rgba(229,232,240,0.88)',
      gap: theme.spacing.xs,
    },
    improvementHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    improvementTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    improvementScore: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    improvementBar: {
      height: 6,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.15)'
          : 'rgba(15,23,42,0.08)',
      overflow: 'hidden',
    },
    improvementFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
    },
    insightCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    insightRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'flex-start',
    },
    bullet: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
      backgroundColor: theme.colors.primary,
    },
    insightText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

const CircleChart: React.FC<{ size: number; stroke: number; progress: number; label: string }> = ({
  size,
  stroke,
  progress,
  label,
}) => {
  const theme = useAppTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = circumference - circumference * clamped;
  const percentage = Math.round(clamped * 100);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        <Svg width={size} height={size}>
          <Circle
            stroke="rgba(148,163,184,0.18)"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
          />
          <Circle
            stroke="rgba(226,232,240,0.85)"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <Text
          style={{
            position: 'absolute',
            top: size / 2 - 12,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.textPrimary,
          }}
        >
          {percentage}%
        </Text>
      </View>
      <Text style={{ marginTop: 8, fontSize: 12, color: theme.colors.textSecondary }}>{label}</Text>
    </View>
  );
};

const StatisticsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { statistics: copy } = useAccountLocalization();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={{ gap: theme.spacing.md }}>
          <Text style={styles.sectionHeader}>{copy.sections.focus}</Text>
          <AdaptiveGlassView style={styles.sectionCard}>
            {copy.focusStats.map((stat) => (
              <View key={stat.label} style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Text style={styles.infoLabel}>{stat.label}</Text>
                  <Text style={styles.infoMeta}>{stat.meta}</Text>
                </View>
                <Text style={styles.infoValue}>{stat.value}</Text>
              </View>
            ))}
          </AdaptiveGlassView>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <Text style={styles.sectionHeader}>{copy.sections.visual}</Text>
          <View style={styles.chartsRow}>
            <AdaptiveGlassView style={styles.radialCard}>
              <CircleChart size={140} stroke={12} progress={copy.visualBreakdown.first.progress} label={copy.visualBreakdown.first.label} />
              <Text style={styles.radialLabel}>{copy.visualBreakdown.first.label}</Text>
              <Text style={styles.radialValue}>{copy.visualBreakdown.first.value}</Text>
              <Text style={styles.infoMeta}>{copy.visualBreakdown.first.meta}</Text>
            </AdaptiveGlassView>

            <AdaptiveGlassView style={styles.radialCard}>
              <CircleChart size={140} stroke={12} progress={copy.visualBreakdown.second.progress} label={copy.visualBreakdown.second.label} />
              <Text style={styles.radialLabel}>{copy.visualBreakdown.second.label}</Text>
              <Text style={styles.radialValue}>{copy.visualBreakdown.second.value}</Text>
              <Text style={styles.infoMeta}>{copy.visualBreakdown.second.meta}</Text>
            </AdaptiveGlassView>
          </View>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <Text style={styles.sectionHeader}>{copy.sections.improvements}</Text>
          <AdaptiveGlassView style={styles.sectionCard}>
            <View style={styles.improvementGrid}>
              {copy.improvementAreas.map((area) => (
                <View key={area.label} style={styles.improvementRow}>
                  <View style={styles.improvementHeader}>
                    <Text style={styles.improvementTitle}>{area.label}</Text>
                    <Text style={styles.improvementScore}>{Math.round(area.score * 100)}%</Text>
                  </View>
                  <View style={styles.improvementBar}>
                    <View style={[styles.improvementFill, { width: `${Math.round(area.score * 100)}%` }]} />
                  </View>
                  <Text style={styles.infoMeta}>{area.description}</Text>
                </View>
              ))}
            </View>
          </AdaptiveGlassView>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <Text style={styles.sectionHeader}>{copy.sections.insights}</Text>
          <AdaptiveGlassView style={styles.insightCard}>
            {copy.aiInsights.map((insight) => (
              <View key={insight} style={styles.insightRow}>
                <View style={styles.bullet} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </AdaptiveGlassView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatisticsScreen;
