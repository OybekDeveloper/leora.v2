import { useLocalization } from '@/localization/useLocalization';
import { SupportedLanguage } from '@/stores/useSettingsStore';

export type AchievementsLocalization = {
  title: string;
  completionLabel: string;
  lastAchievementLabel: string;
  completion: {
    done: number;
    total: number;
    percent: number;
    last: {
      title: string;
      subtitle: string;
      details: string;
    };
  };
  recentlyUnlocked: {
    title: string;
    items: {
      title: string;
      time: string;
      subtitle: string;
      details: string;
    }[];
  };
  closeToUnlocking: {
    title: string;
    items: {
      title: string;
      progress: string;
      subtitle: string;
      details: string;
    }[];
  };
  categories: {
    title: string;
    tabs: { key: string; label: string }[];
    list: { name: string; count: string }[];
    showAll: string;
  };
};

export type PremiumLocalization = {
  planOverline: string;
  manageSubscription: string;
  benefitsSectionTitle: {
    premium: string;
    free: string;
  };
  usageSectionTitle: string;
  upgradeSectionTitle: {
    premium: string;
    free: string;
  };
  header: {
    premium: {
      title: string;
      planLabel: string;
      activeLabel: string;
      planText: string;
      activeUntil: string;
    };
    free: {
      title: string;
      planLabel: string;
      planText: string;
    };
  };
  benefits: (
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
      }
  )[];
  usage: {
    premium: { label: string; value: string }[];
    free: { label: string; value: string }[];
  };
  planOptions: {
    monthly: { title: string; price: string; subtitle: string; rightChip: string };
    yearly: { title: string; price: string; subtitle: string; chip: string };
  };
  buttons: {
    changePlan: string;
    paymentHistory: string;
  };
};

export type StatisticsLocalization = {
  sections: {
    focus: string;
    visual: string;
    improvements: string;
    insights: string;
  };
  focusStats: { label: string; value: string; meta: string }[];
  visualBreakdown: {
    first: {
      label: string;
      meta: string;
      value: string;
      progress: number;
    };
    second: {
      label: string;
      meta: string;
      value: string;
      progress: number;
    };
  };
  improvementAreas: { label: string; score: number; description: string }[];
  aiInsights: string[];
};

export type AccountLocalization = {
  achievements: AchievementsLocalization;
  premium: PremiumLocalization;
  statistics: StatisticsLocalization;
};

const EN: AccountLocalization = {
  achievements: {
    title: 'Achievements',
    completionLabel: 'Completion',
    lastAchievementLabel: 'Last achievement',
    completion: {
      done: 23,
      total: 50,
      percent: 46,
      last: {
        title: 'Marathoner',
        subtitle: '42 days streak',
        details: '+500 XP   Rare   (15% users)',
      },
    },
    recentlyUnlocked: {
      title: 'Recently unlocked',
      items: [
        {
          title: 'Marathoner',
          time: '3 days ago',
          subtitle: '42‑Day Streak Without Breaks',
          details: '+500 XP   Rare   (15% users)',
        },
        {
          title: 'Financial GURU',
          time: 'Week ago',
          subtitle: 'Budget kept 3 Months in a Row',
          details: '+300 XP   Unusual   (13% users)',
        },
        {
          title: 'Goal Sniper',
          time: '2 weeks ago',
          subtitle: '10 goals accomplished',
          details: '+200 XP   Casual   (35% users)',
        },
      ],
    },
    closeToUnlocking: {
      title: 'Close to unlocking',
      items: [
        {
          title: 'Hot Streak',
          progress: '95% (46/50)',
          subtitle: 'Active 50 days straight',
          details: '+1000 XP   Epic   (2% users)',
        },
        {
          title: 'Habit master',
          progress: '80% (4/5)',
          subtitle: '5 Habits for 30 Days',
          details: '+750 XP   Rare   (18% users)',
        },
      ],
    },
    categories: {
      title: 'Categories',
      tabs: [
        { key: 'all', label: 'All' },
        { key: 'financial', label: 'Financial' },
        { key: 'efficiency', label: 'Efficiency' },
        { key: 'habits', label: 'Habits' },
        { key: 'social', label: 'Social' },
        { key: 'special', label: 'Spec' },
      ],
      list: [
        { name: 'Finance', count: '8/15' },
        { name: 'Efficiency', count: '6/12' },
        { name: 'Habits', count: '5/10' },
        { name: 'Social', count: '2/8' },
        { name: 'Special', count: '2/5' },
        { name: 'Hidden', count: '???' },
      ],
      showAll: 'Show all',
    },
  },
  premium: {
    planOverline: 'Plan',
    manageSubscription: 'Manage your subscription',
    benefitsSectionTitle: {
      premium: 'Your PREMIUM benefits',
      free: 'PREMIUM benefits',
    },
    usageSectionTitle: "This Month's Usage",
    upgradeSectionTitle: {
      premium: 'Upgrade your plan',
      free: 'Upgrade to PREMIUM',
    },
    header: {
      premium: {
        title: 'PREMIUM',
        planLabel: 'Plan',
        activeLabel: 'Active until',
        planText: 'Monthly plan ($9.99/mon)',
        activeUntil: 'March 15, 2025 (68 days)',
      },
      free: {
        title: 'FREE PLAN',
        planLabel: 'Plan',
        planText: 'Free',
      },
    },
    benefits: [
      { label: 'Unlimited transactions', kind: 'compare', premium: '∞', free: '50' },
      { label: 'All AI features', kind: 'compare', premium: '∞', free: '10/mon' },
      { label: '10+ virtual mentors', kind: 'compare', premium: '10', free: '1' },
      { label: 'Synchronized devices', kind: 'compare', premium: '5', free: '1' },
      { label: 'Cloud Backup', kind: 'check', premiumHas: true },
      { label: 'Premium Support', kind: 'compare', premium: '<1h', free: '24h' },
      { label: 'Exclusive styles', kind: 'compare', premium: '8', free: '2' },
      { label: 'API access', kind: 'check', premiumHas: true },
    ],
    usage: {
      premium: [
        { label: 'Transactions', value: '248 added' },
        { label: 'AI requests', value: '89 used' },
        { label: 'Devices', value: '3/5 connected' },
        { label: 'Cloud', value: '2.3 GB / 10 GB' },
      ],
      free: [
        { label: 'Transactions', value: '35 added' },
        { label: 'AI requests', value: '13 used' },
        { label: 'Devices', value: '1 connected' },
        { label: 'Cloud', value: '2.3 GB / 3 GB' },
      ],
    },
    planOptions: {
      monthly: {
        title: 'Monthly',
        price: '$9.99',
        subtitle: '$9.99 / month',
        rightChip: 'Current',
      },
      yearly: {
        title: 'Yearly',
        price: '$99',
        subtitle: '$99 / year',
        chip: 'SAVE $20',
      },
    },
    buttons: {
      changePlan: 'Change plan',
      paymentHistory: 'Payment history',
    },
  },
  statistics: {
    sections: {
      focus: 'Focus performance',
      visual: 'Visual breakdown',
      improvements: 'Improvement areas',
      insights: 'AI insights',
    },
    focusStats: [
      { label: 'Total focus hours', value: '182 h', meta: '+12% vs last month' },
      { label: 'Deep sessions', value: '64', meta: 'Avg 2.8 h' },
      { label: 'Tasks completed', value: '326', meta: '78% completion rate' },
    ],
    visualBreakdown: {
      first: {
        label: 'Weekly focus ratio',
        meta: 'Best performance on Wednesday',
        value: '68%',
        progress: 0.68,
      },
      second: {
        label: 'Goal attainment',
        meta: '10 of 12 weekly goals completed',
        value: '82%',
        progress: 0.82,
      },
    },
    improvementAreas: [
      { label: 'Productivity', score: 0.82, description: 'Consistent daily focus streaks' },
      { label: 'Wellbeing', score: 0.68, description: 'Break balance improving, hydrate more' },
      { label: 'Collaboration', score: 0.75, description: 'Team check-ins on track' },
    ],
    aiInsights: [
      'Focus quality rises when sessions start before 10:00 AM.',
      'You achieve 30% more completed tasks when using focus playlists.',
      'Scheduling breaks at the 90-minute mark reduced context switching.',
    ],
  },
};

const buildAccountLocalization = (): Record<SupportedLanguage, AccountLocalization> => {
  const languages: SupportedLanguage[] = ['en', 'ru', 'uz', 'ar', 'tr'];
  return languages.reduce<Record<SupportedLanguage, AccountLocalization>>((acc, lang) => {
    acc[lang] = EN;
    return acc;
  }, {} as Record<SupportedLanguage, AccountLocalization>);
};

export const ACCOUNT_LOCALIZATION = buildAccountLocalization();

export const useAccountLocalization = () => {
  const { language } = useLocalization();
  return ACCOUNT_LOCALIZATION[language] ?? ACCOUNT_LOCALIZATION.en;
};
