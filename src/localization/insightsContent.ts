import { SupportedLanguage } from '@/stores/useSettingsStore';
import type { InsightCategory, InsightStatus } from '@/types/insights';

export type OverviewComponentKey = 'financial' | 'productivity' | 'balance' | 'goals' | 'discipline';
export type OverviewQuickWinKey = 'tasks' | 'coffee' | 'meditation' | 'reading';
export type OverviewChangeGroupKey = 'upgrades' | 'attention';
export type IndicatorKey = 'liquidity' | 'savings' | 'debt' | 'capital' | 'goals';
export type WeeklyDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DayPartKey = 'morning' | 'day' | 'evening' | 'night';
export type SavingKey = 'subscriptions' | 'food' | 'transport' | 'coffee';
export type TimeDistributionKey = 'work' | 'sleep' | 'personal' | 'transport' | 'house' | 'dev' | 'rest';
export type ProductivityPeakKey = 'peak1' | 'peak2' | 'low';
export type FocusMetricKey = 'avg' | 'best' | 'worst' | 'interrupt';
export type TaskTypeKey = 'creative' | 'routine' | 'communication' | 'planning';
export type ContextKey = 'work' | 'home' | 'outside';
export type AdvisorKey = 'buffett' | 'musk' | 'marcus';

type QuickWinItem = {
  title: string;
  impact: string;
  meta: string;
};

type SavingsEntry = {
  title: string;
  impact: string;
  detail: string;
  alternative?: string;
  bullets: string[];
  actions: Record<string, string>;
};

type AdvisorContent = {
  name: string;
  role: string;
  insight: string;
  reminder: string;
  recommendation: string;
  challenge: string;
};

type ScenarioTranslation = {
  title: string;
  tones: {
    friend: string;
    strict: string;
    polite: string;
  };
  cta: string;
  push: string;
  explain: string;
};

type QuestionOption = {
  id: string;
  label: string;
};

type QuestionEntry = {
  prompt: string;
  description?: string;
  options?: QuestionOption[];
  allowFreeText?: boolean;
  customLabel?: string;
  category: InsightCategory;
};

type HistoryEntry = {
  title: string;
  summary: string;
  category: InsightCategory;
};

export type InsightsTranslations = {
  tabs: {
    overview: string;
    finance: string;
    productivity: string;
    wisdom: string;
  };
  overview: {
    sections: {
      mainInsight: string;
      personalIndex: string;
      questions: string;
      history: string;
      components: string;
      changes: string;
      quickWins: string;
      activeInsights: string;
    };
    deltaText: string;
    detailedAnalysis: string;
    strongLabel: string;
    growthLabel: string;
    mainInsightCard: {
      label: string;
      title: string;
      body: string;
      context: string;
      cta: string;
    };
    questionsBlock: {
      title: string;
      subtitle: string;
      viewAll: string;
      empty: string;
      customAnswer: string;
      submit: string;
      placeholder: string;
    };
    historyTeaser: {
      title: string;
      summary: string;
      cta: string;
    };
    components: Record<OverviewComponentKey, { label: string; strong: string; growth: string }>;
    changeGroups: Record<OverviewChangeGroupKey, { title: string; bullets: string[] }>;
    recommendation: {
      title: string;
      bullets: string[];
      link: string;
    };
    quickWins: {
      title: string;
      action: string;
      cta: string;
      items: Record<OverviewQuickWinKey, QuickWinItem>;
    };
  };
  finance: {
    sections: {
      health: string;
      indicators: string;
      patterns: string;
      savings: string;
    };
    patternTitles: { weekly: string; daily: string };
    anomaliesTitle: string;
    scoreLabel: string;
    indicators: Record<IndicatorKey, { label: string; metric: string; status: string }>;
    alert: { title: string; bullets: string[] };
    weeklyPattern: Record<WeeklyDayKey, { label: string; note: string }>;
    dayPattern: Record<DayPartKey, { label: string; range: string; note: string }>;
    anomalies: Record<'food' | 'night', { title: string; summary: string; recommendation: string; meta: string }>;
    reviewInsights: string;
    savingsSubtitle: string;
    savings: Record<SavingKey, SavingsEntry>;
    footerActions: { applyAll: string; adjustPlan: string };
  };
  productivity: {
    sections: { analyst: string; tasks: string };
    subtitles: {
      distribution: string;
      peaks: string;
      chart: string;
      focusMetrics: string;
      recommendation: string;
      stats: string;
      byType: string;
      byContext: string;
      procrastination: string;
    };
    timeDistribution: Record<TimeDistributionKey, string>;
    peaks: Record<ProductivityPeakKey, { label: string; note: string }>;
    focusMetrics: Record<FocusMetricKey, string>;
    focusMetricValues: Record<FocusMetricKey, string>;
    recommendations: string[];
    stats: {
      completed: string;
      onTime: string;
      postponed: string;
      deleted: string;
      byType: string;
      byContext: string;
      procrastination: string;
      footer: string;
    };
    taskTypes: Record<TaskTypeKey, string>;
    contexts: Record<ContextKey, string>;
    procrastination: string[];
    footerButton: string;
  };
  wisdom: {
    sections: {
      wisdomOfDay: string;
      application: string;
      library: string;
      challenge: string;
      advisors: string;
    };
    quoteDate: string;
    quoteActions: { add: string; another: string; share: string };
    quoteOfDay: { text: string; author: string; context: string };
    applicationCta: string;
    applicationMessage: string;
    categories: string[];
    favoritesTitle: string;
    favoritesLink: string;
    favoriteQuotes: { text: string; author: string }[];
    challenge: {
      title: string;
      status: string;
      progress: string;
      quote: { text: string; author: string; context: string };
      markComplete: string;
    };
    searchPlaceholder: string;
    advisorsHeaderAction: string;
    advisors: Record<AdvisorKey, AdvisorContent>;
    addMentor: string;
    actions: {
      contribute: string;
      askQuestion: string;
      actionPlan: string;
    };
  };
  questions: {
    entries: Record<string, QuestionEntry>;
    dailyOrder: string[];
  };
  history: {
    title: string;
    subtitle: string;
    empty: string;
    cta: string;
    statusLabel: Record<InsightStatus, string>;
    entries: Record<string, HistoryEntry>;
  };
  scenarios: {
    nightSpending: ScenarioTranslation;
    usdPayment: ScenarioTranslation;
    missingExpense: ScenarioTranslation;
    debtDueTomorrow: ScenarioTranslation;
  };
};

const english: InsightsTranslations = {
  tabs: {
    overview: 'Overview',
    finance: 'Finance',
    productivity: 'Productivity',
    wisdom: 'Wisdom',
  },
  overview: {
    sections: {
      mainInsight: 'Main insight of the day',
      personalIndex: 'Personal performance index',
      questions: 'Questions for today',
      history: 'Insight history',
      components: 'Index components',
      changes: 'Key changes over the month',
      quickWins: 'Quick wins',
      activeInsights: 'Active insights',
    },
    deltaText: '+0.5 compared to last month',
    detailedAnalysis: 'Detailed analysis',
    strongLabel: 'Strong sides',
    growthLabel: 'Growth zone',
    mainInsightCard: {
      label: 'Main insight of the day',
      title: 'Evening deliveries ate 30% of your food budget',
      body: 'Three late deliveries in a row increased your weekly burn. Move one dinner home-made and lock the savings.',
      context: 'AI picked this because emotions drive your evening decisions.',
      cta: 'Set a dinner limit',
    },
    questionsBlock: {
      title: 'Questions for clarifying your focus',
      subtitle: 'Answer 1-3 questions so AI can prioritise better.',
      viewAll: 'All questions',
      empty: 'You are all set for today. Come back tomorrow.',
      customAnswer: 'Custom answer',
      submit: 'Save answer',
      placeholder: 'Share what feels right…',
    },
    historyTeaser: {
      title: 'Insight history',
      summary: '{count} insights completed this week',
      cta: 'Open history',
    },
    components: {
      financial: {
        label: 'Financial health',
        strong: 'Saving, budgeting',
        growth: 'Investment',
      },
      productivity: {
        label: 'Productivity',
        strong: 'Focus sessions',
        growth: 'Morning productivity',
      },
      balance: {
        label: 'Work-life balance',
        strong: 'Night rest',
        growth: 'Weekends',
      },
      goals: {
        label: 'Achieving goals',
        strong: 'Consistency',
        growth: 'Completion speed',
      },
      discipline: {
        label: 'Discipline',
        strong: 'Habits',
        growth: 'Weekends',
      },
    },
    changeGroups: {
      upgrades: {
        title: 'Upgrades',
        bullets: [
          'Saving +35% vs December',
          'Focus time +2h/day',
          'Workout streak: 12 days',
          '3 new habits',
        ],
      },
      attention: {
        title: 'Need attention',
        bullets: [
          'Productivity after break -20%',
          'Skipped 3 days of meditation',
          'Overspend for food',
          'Tasks postponed until evening',
        ],
      },
    },
    recommendation: {
      title: 'AI recommendation',
      bullets: [
        '1. Move important tasks to the morning',
        '2. Set a limit on delivery',
        '3. Meditation after charging = 85% success',
      ],
      link: 'Show all 7 recommendations',
    },
    quickWins: {
      title: 'Quick wins',
      action: 'Refresh',
      cta: 'Start now',
      items: {
        tasks: {
          title: 'Complete 3 tasks before lunch',
          impact: 'Impact: +15% productivity',
          meta: 'Time: 2 hours',
        },
        coffee: {
          title: 'No more coffee to go',
          impact: 'Impact: 150k saved per month',
          meta: 'Difficulty: Easy',
        },
        meditation: {
          title: '5 minutes of meditation now',
          impact: 'Impact: +10% focus',
          meta: 'Time: 5 minutes',
        },
        reading: {
          title: 'Read 10 pages',
          impact: 'Impact: Goal progression +2%',
          meta: 'Time: 15 minutes',
        },
      },
    },
  },
  finance: {
    sections: {
      health: 'Financial health',
      indicators: 'Health indicators',
      patterns: 'Patterns and anomalies',
      savings: 'Saving potentials',
    },
    patternTitles: {
      weekly: 'Weekly pattern',
      daily: 'Daily pattern',
    },
    anomaliesTitle: 'Anomalies detected',
    scoreLabel: 'Score',
    indicators: {
      liquidity: { label: 'Liquidity', metric: '3.5 month reserve', status: 'Excellent' },
      savings: { label: 'Savings level', metric: '3.5 month reserve', status: 'Okay' },
      debt: { label: 'Debt burden', metric: '3.5 month reserve', status: 'Low' },
      capital: { label: 'Capital growth', metric: '3.5 month reserve', status: 'Okay' },
      goals: { label: 'Goals progress', metric: '3.5 month reserve', status: 'Excellent' },
    },
    alert: {
      title: 'Work-life balance',
      bullets: [
        'Investments: only 2% of income',
        'Subscriptions: 5 unused',
        'Impulsive purchases: +40%',
      ],
    },
    weeklyPattern: {
      mon: { label: 'Mon', note: 'Minimum spending' },
      tue: { label: 'Tue', note: 'Stable' },
      wed: { label: 'Wed', note: 'Peak: Groceries' },
      thu: { label: 'Thu', note: 'Frugal day' },
      fri: { label: 'Fri', note: 'Entertainment' },
      sat: { label: 'Sat', note: 'Weekly maximum' },
      sun: { label: 'Sun', note: 'Rest day' },
    },
    dayPattern: {
      morning: { label: 'Morning', range: '6-12', note: 'Transport, Coffee' },
      day: { label: 'Day', range: '12-18', note: 'Lunch, Shopping' },
      evening: { label: 'Evening', range: '18-22', note: 'Dinner, Entertainment' },
      night: { label: 'Night', range: '22-6', note: 'Spending – Impulsive' },
    },
    anomalies: {
      food: {
        title: 'Food spending +35% vs last month',
        summary: 'Recommendation: Return to home-cooked meals',
        recommendation: 'Potential savings: 2 hours',
        meta: 'Action plan',
      },
      night: {
        title: 'Night purchases >200k (3 times)',
        summary: 'Pattern: After 22:00 on Fridays',
        recommendation: 'Recommendation: Set a night limit',
        meta: 'Set rule',
      },
    },
    reviewInsights: 'Review insights',
    savingsSubtitle: 'Potential: 780k',
    savings: {
      subscriptions: {
        title: '1. Subscriptions',
        impact: '-180k/month',
        detail: '5 unused services',
        bullets: [
          'Netflix (inactive for 2 months)',
          'Spotify (duplicate of YouTube Music)',
          'Gym (visited 3 times/month)',
        ],
        actions: {
          cancel: 'Cancel all',
          select: 'Select',
        },
      },
      food: {
        title: '2. Food delivery',
        impact: '-350k/month',
        detail: 'Average: 12 orders/month',
        alternative: 'Alternative: Meal prep on Sundays',
        bullets: [],
        actions: {
          meal: 'Meal plan',
          recipes: 'Recipes',
        },
      },
      transport: {
        title: '3. Transport',
        impact: '-150k/month',
        detail: 'Frequent short taxi rides',
        alternative: 'Alternative: Bike / Metro',
        bullets: [],
        actions: {
          routes: 'Routes',
          pass: 'Buy pass',
        },
      },
      coffee: {
        title: '4. Coffee',
        impact: '-100k/month',
        detail: 'Daily takeaway coffee',
        alternative: 'Alternative: Home coffee machine',
        bullets: [],
        actions: {
          recipes: 'Recipes',
          equipment: 'Equipment',
        },
      },
    },
    footerActions: {
      applyAll: 'Apply all',
      adjustPlan: 'Adjust plan',
    },
  },
  productivity: {
    sections: {
      analyst: 'Productivity analyst',
      tasks: 'Task performance analysis',
    },
    subtitles: {
      distribution: 'Distribution of time (168 hours/week)',
      peaks: 'Peak productivity',
      chart: 'Productivity chart by hours',
      focusMetrics: 'Focus metrics',
      recommendation: 'Recommendation',
      stats: 'Statistics',
      byType: 'By task type',
      byContext: 'By context',
      procrastination: 'Procrastination patterns',
    },
    timeDistribution: {
      work: 'Work',
      sleep: 'Sleep',
      personal: 'Personal',
      transport: 'Transport',
      house: 'Household',
      dev: 'Development',
      rest: 'Rest',
    },
    peaks: {
      peak1: { label: 'Peak 1', note: 'Highly efficient' },
      peak2: { label: 'Peak 2', note: 'Good for collaboration' },
      low: { label: 'Low', note: 'Recovery after break' },
    },
    focusMetrics: {
      avg: 'Average focus time',
      best: 'Best day',
      worst: 'Worst day',
      interrupt: 'Interruptions',
    },
    focusMetricValues: {
      avg: '45 minutes',
      best: 'Tuesday (3.5 hours)',
      worst: 'Monday (1 hour)',
      interrupt: '12/day on average',
    },
    recommendations: [
      'Block 10:00-12:00 for important tasks',
      'Schedule routine work at 13:00-14:00',
      'Turn off notifications during focus time',
      'Limit meetings to 2 per afternoon block',
    ],
    stats: {
      completed: 'Completed:',
      onTime: 'On time:',
      postponed: 'Postponed:',
      deleted: 'Deleted:',
      byType: 'By task type',
      byContext: 'By context',
      procrastination: 'Procrastination patterns',
      footer: 'Optimize schedule',
    },
    taskTypes: {
      creative: 'Creative',
      routine: 'Routine',
      communication: 'Communication',
      planning: 'Planning',
    },
    contexts: {
      work: '@work',
      home: '@home',
      outside: '@outside',
    },
    procrastination: [
      'Tasks without deadlines: 45% completion',
      'Large tasks (>2h): postponed 3+ times',
      'Friday tasks: 50% rescheduled',
    ],
    footerButton: 'Optimize schedule',
  },
  wisdom: {
    sections: {
      wisdomOfDay: 'Wisdom of the day',
      application: 'Application today',
      library: 'Wisdoms library',
      challenge: 'Quotes challenge',
      advisors: 'Your board of advisors',
    },
    quoteDate: '6 January',
    quoteActions: {
      add: 'Add to favorites',
      another: 'Show another',
      share: 'Share',
    },
    quoteOfDay: {
      text: 'The journey of a thousand miles begins with a single step',
      author: 'Laozi',
      context: 'You have 3 big projects. Start small — with the first task.',
    },
    applicationCta: 'Make a contribution now',
    applicationMessage:
      "Your goal 'Buy a car' may seem far away, but you have already covered 82% of the way. Today's contribution of 50,000 is your 'one step' toward the big goal.",
    categories: ['All', 'Motivation', 'Discipline', 'Finance', 'Productivity', 'Balance', 'Relations'],
    favoritesTitle: 'Favorite',
    favoritesLink: 'Show all favorites',
    favoriteQuotes: [
      {
        text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
        author: 'Chinese Proverb',
      },
      {
        text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
        author: 'Aristotle',
      },
    ],
    challenge: {
      title: 'Quotes challenge',
      status: 'Active',
      progress: 'Your progress: 3 / 7 days',
      quote: {
        text: 'Rise every time you fall.',
        author: 'Aristotle',
        context: "Task: Don’t skip your morning workout",
      },
      markComplete: 'Mark as completed',
    },
    searchPlaceholder: 'Search by author or theme',
    advisorsHeaderAction: 'Edit',
    advisors: {
      buffett: {
        name: 'Warren Buffett',
        role: 'Financial Advisor',
        insight: 'Your entertainment expenses have increased by 35%.',
        reminder: 'Wealth is built not on how much you earn, but on how much you save.',
        recommendation: 'Recommended 50/30/20 rule: 50% essentials, 30% wants, 20% savings.',
        challenge: 'Your current proportions: 45 / 40 / 15',
      },
      musk: {
        name: 'Elon Musk',
        role: 'Productivity Advisor',
        insight: '2 hours on social media every day? That’s 14 hours a week.',
        reminder:
          'In that time, you could learn a new language or master a programming skill. Use time boxing to divide your day into 15-minute blocks.',
        recommendation: 'Challenge of the day: Spend the day without social media and invest that time into your project.',
        challenge: 'Your progress: 45/120 minutes this week',
      },
      marcus: {
        name: 'Marcus Aurelius',
        role: 'Balancing Advisor',
        insight: 'Missed meditation for 3 days.',
        reminder: 'Consistency matters. Start small — just 2 minutes of morning meditation.',
        recommendation: 'Today’s reflection: You have power over your mind, not outside events.',
        challenge: 'Your progress: 4 / 7 days this week',
      },
    },
    addMentor: 'Add new mentor',
    actions: {
      contribute: 'Make a contribution now',
      askQuestion: 'Ask a question',
      actionPlan: 'Action plan',
    },
  },
  questions: {
    entries: {
      'focus-priority': {
        prompt: 'What feels more important right now?',
        options: [
          { id: 'debts', label: 'Close debts faster' },
          { id: 'safety', label: 'Grow safety fund' },
          { id: 'balance', label: 'Stabilise energy first' },
        ],
        category: 'finance',
      },
      'comfort-limit': {
        prompt: 'What monthly limit on leisure still feels comfortable?',
        description: 'AI will adapt your budgets instantly.',
        options: [
          { id: '150', label: '150k UZS' },
          { id: '300', label: '300k UZS' },
          { id: 'custom', label: 'Custom' },
        ],
        allowFreeText: true,
        customLabel: 'Another number',
        category: 'finance',
      },
      'habit-friction': {
        prompt: 'Why do evening walks fall off?',
        options: [
          { id: 'time', label: 'No time' },
          { id: 'forget', label: 'I simply forget' },
          { id: 'meaning', label: 'Not sure it matters' },
        ],
        allowFreeText: true,
        customLabel: 'Something else',
        category: 'productivity',
      },
    },
    dailyOrder: ['focus-priority', 'comfort-limit', 'habit-friction'],
  },
  history: {
    title: 'Insight history',
    subtitle: 'See what you completed, parked, or dismissed.',
    empty: 'History will appear once you interact with insights.',
    cta: 'Back to overview',
    statusLabel: {
      new: 'New',
      viewed: 'Viewed',
      completed: 'Completed',
      dismissed: 'Dismissed',
    },
    entries: {
      'delivery-limit': {
        title: 'Delivery limit introduced',
        summary: 'Set a 3x/week rule and saved 120k UZS.',
        category: 'finance',
      },
      'focus-sprint': {
        title: 'Focus sprint scheduled',
        summary: 'Blocked 2×45 minute deep work sessions.',
        category: 'productivity',
      },
      'debt-shift': {
        title: 'Debt payment rescheduled',
        summary: 'Coordinated a new date and partial repayment.',
        category: 'finance',
      },
    },
  },
  scenarios: {
    nightSpending: {
      title: 'Evening expenses spike',
      tones: {
        friend: 'Evening spending reached {percent} of the week. Want to review late snacks?',
        strict: 'Night expenses jumped to {percent}. Time to set a limit?',
        polite: 'Evening spending is {percent} of the week. Shall we cap it?',
      },
      cta: 'Review budgets',
      push: 'Night spending increased. Review?',
      explain: 'Share based on transactions after 21:00 for the last 7 days.',
    },
    usdPayment: {
      title: 'USD payment is close',
      tones: {
        friend: 'Payment in USD soon, short by {amount}. Convert today?',
        strict: 'USD balance is below the next payment. Convert now?',
        polite: 'USD payment is coming soon. Convert part of UZS?',
      },
      cta: 'Open exchange',
      push: 'USD balance is low before payment.',
      explain: 'Comparison of required USD amount and wallets today ({balance}).',
    },
    missingExpense: {
      title: 'No expenses logged',
      tones: {
        friend: '{days} days without entries. Add the latest purchases?',
        strict: 'No expenses for {days} days. Log them now?',
        polite: '{days} days without expenses. Use quick add?',
      },
      cta: 'Quick add',
      push: '2 days without expenses. Quick add?',
      explain: 'Based on the last expense entry and your default wallet.',
    },
    debtDueTomorrow: {
      title: 'IOU is due tomorrow',
      tones: {
        friend: 'Tomorrow is the due date for {name}. Offer a reminder?',
        strict: 'IOU due tomorrow. Send a follow-up?',
        polite: 'The IOU deadline is tomorrow. Send a polite reminder?',
      },
      cta: 'Manage debt',
      push: 'IOU due tomorrow. Prepare?',
      explain: 'Outstanding amount {amount} and reminder suggestion.',
    },
  },
};

// Helper to duplicate structure for other languages by cloning english and replacing strings
function cloneTranslations(base: InsightsTranslations): InsightsTranslations {
  return JSON.parse(JSON.stringify(base));
}

const russian: InsightsTranslations = cloneTranslations(english);
russian.tabs = {
  overview: 'Обзор',
  finance: 'Финансы',
  productivity: 'Продуктивность',
  wisdom: 'Мудрость',
};
russian.overview.sections = {
  mainInsight: 'Главный инсайт дня',
  personalIndex: 'Индекс личной эффективности',
  questions: 'Вопросы на сегодня',
  history: 'История инсайтов',
  components: 'Компоненты индекса',
  changes: 'Ключевые изменения за месяц',
  quickWins: 'Быстрые победы',
  activeInsights: 'Активные подсказки',
};
russian.overview.deltaText = '+0,5 к прошлому месяцу';
russian.overview.detailedAnalysis = 'Детальный анализ';
russian.overview.strongLabel = 'Сильные стороны';
russian.overview.growthLabel = 'Зона роста';
russian.overview.mainInsightCard = {
  label: 'Главный инсайт дня',
  title: 'Вечерние доставки съели 30% бюджета на еду',
  body: 'Три поздние доставки подряд увеличили недельные траты. Перенесите один ужин домой и зафиксируйте экономию.',
  context: 'ИИ выбрал это, потому что вечером решения принимает эмоция.',
  cta: 'Настроить лимит ужинов',
};
russian.overview.questionsBlock = {
  title: 'Вопросы для уточнения фокуса',
  subtitle: 'Ответьте на 1–3 вопроса, чтобы ИИ точнее расставил приоритеты.',
  viewAll: 'Все вопросы',
  empty: 'На сегодня вопросов нет. Загляните завтра.',
  customAnswer: 'Свой ответ',
  submit: 'Сохранить',
  placeholder: 'Поделитесь тем, что чувствуете…',
};
russian.overview.historyTeaser = {
  title: 'История инсайтов',
  summary: '{count} инсайтов реализовано на этой неделе',
  cta: 'Открыть историю',
};
Object.assign(russian.overview.components.financial, {
  label: 'Финансовое здоровье',
  strong: 'Сбережения, бюджет',
  growth: 'Инвестиции',
});
Object.assign(russian.overview.components.productivity, {
  label: 'Продуктивность',
  strong: 'Фокус-сессии',
  growth: 'Утренние часы',
});
Object.assign(russian.overview.components.balance, {
  label: 'Баланс работы и жизни',
  strong: 'Ночной отдых',
  growth: 'Выходные',
});
Object.assign(russian.overview.components.goals, {
  label: 'Достижение целей',
  strong: 'Последовательность',
  growth: 'Скорость завершения',
});
Object.assign(russian.overview.components.discipline, {
  label: 'Дисциплина',
  strong: 'Привычки',
  growth: 'Выходные',
});
russian.overview.changeGroups.upgrades = {
  title: 'Улучшения',
  bullets: [
    'Сбережения +35% к декабрю',
    'Фокус +2 часа в день',
    'Серия тренировок: 12 дней',
    '3 новые привычки',
  ],
};
russian.overview.changeGroups.attention = {
  title: 'Зона внимания',
  bullets: [
    'Продуктивность после отдыха -20%',
    'Пропущено 3 дня медитации',
    'Перерасход на еду',
    'Задачи откладываются на вечер',
  ],
};
russian.overview.recommendation = {
  title: 'Рекомендация ИИ',
  bullets: [
    '1. Перенесите важные задачи на утро',
    '2. Ограничьте доставку еды',
    '3. Медитация после зарядки = 85% успеха',
  ],
  link: 'Показать все 7 рекомендаций',
};
russian.overview.quickWins = {
  title: 'Быстрые победы',
  action: 'Обновить',
  cta: 'Запустить',
  items: {
    tasks: {
      title: 'Выполните 3 задачи до обеда',
      impact: 'Эффект: +15% продуктивности',
      meta: 'Время: 2 часа',
    },
    coffee: {
      title: 'Откажитесь от кофе навынос',
      impact: 'Эффект: экономия 150k в месяц',
      meta: 'Сложность: легко',
    },
    meditation: {
      title: '5 минут медитации прямо сейчас',
      impact: 'Эффект: +10% к фокусу',
      meta: 'Время: 5 минут',
    },
    reading: {
      title: 'Прочитайте 10 страниц',
      impact: 'Эффект: прогресс по цели +2%',
      meta: 'Время: 15 минут',
    },
  },
};
russian.questions.entries['focus-priority'] = {
  prompt: 'Что сейчас важнее?',
  options: [
    { id: 'debts', label: 'Быстрее закрыть долги' },
    { id: 'safety', label: 'Подушку безопасности' },
    { id: 'balance', label: 'Стабилизировать энергию' },
  ],
  category: 'finance',
};
russian.questions.entries['comfort-limit'] = {
  prompt: 'Какой лимит на развлечения комфортен в месяц?',
  description: 'ИИ мгновенно обновит бюджеты.',
  options: [
    { id: '150', label: '150 тыс. сум' },
    { id: '300', label: '300 тыс. сум' },
    { id: 'custom', label: 'Свой вариант' },
  ],
  allowFreeText: true,
  customLabel: 'Другое число',
  category: 'finance',
};
russian.questions.entries['habit-friction'] = {
  prompt: 'Почему прогулки вечером срываются?',
  options: [
    { id: 'time', label: 'Нет времени' },
    { id: 'forget', label: 'Просто забываю' },
    { id: 'meaning', label: 'Не вижу смысла' },
  ],
  allowFreeText: true,
  customLabel: 'Другое',
  category: 'productivity',
};
russian.history = {
  title: 'История инсайтов',
  subtitle: 'Смотрите, что сделали, отложили или закрыли.',
  empty: 'История появится после первых действий.',
  cta: 'Назад к обзору',
  statusLabel: {
    new: 'Новый',
    viewed: 'Просмотрен',
    completed: 'Завершён',
    dismissed: 'Отклонён',
  },
  entries: {
    'delivery-limit': {
      title: 'Лимит на доставку',
      summary: 'Ввели правило 3 заказа в неделю и сэкономили 120 тыс.',
      category: 'finance',
    },
    'focus-sprint': {
      title: 'Фокус-спринт',
      summary: 'Заблокированы две сессии по 45 минут.',
      category: 'productivity',
    },
    'debt-shift': {
      title: 'Перенос выплаты долга',
      summary: 'Согласовали новую дату и частичное погашение.',
      category: 'finance',
    },
  },
};
russian.finance.sections = {
  health: 'Финансовое здоровье',
  indicators: 'Индикаторы здоровья',
  patterns: 'Паттерны и аномалии',
  savings: 'Потенциал экономии',
};
russian.finance.patternTitles = { weekly: 'Недельный паттерн', daily: 'Суточный паттерн' };
russian.finance.anomaliesTitle = 'Обнаружены аномалии';
russian.finance.scoreLabel = 'Оценка';
Object.assign(russian.finance.indicators.liquidity, {
  label: 'Ликвидность',
  metric: 'Резерв на 3.5 месяца',
  status: 'Отлично',
});
Object.assign(russian.finance.indicators.savings, {
  label: 'Уровень сбережений',
  metric: 'Резерв на 3.5 месяца',
  status: 'Нормально',
});
Object.assign(russian.finance.indicators.debt, {
  label: 'Долговая нагрузка',
  metric: 'Резерв на 3.5 месяца',
  status: 'Низкая',
});
Object.assign(russian.finance.indicators.capital, {
  label: 'Рост капитала',
  metric: 'Резерв на 3.5 месяца',
  status: 'Нормально',
});
Object.assign(russian.finance.indicators.goals, {
  label: 'Прогресс целей',
  metric: 'Резерв на 3.5 месяца',
  status: 'Отлично',
});
russian.finance.alert = {
  title: 'Баланс работы и жизни',
  bullets: [
    'Инвестиции: только 2% дохода',
    'Подписки: 5 неиспользуемых сервисов',
    'Импульсивные покупки: +40%',
  ],
};
russian.finance.weeklyPattern = {
  mon: { label: 'Пн', note: 'Минимальные траты' },
  tue: { label: 'Вт', note: 'Стабильно' },
  wed: { label: 'Ср', note: 'Пик: продукты' },
  thu: { label: 'Чт', note: 'Экономный день' },
  fri: { label: 'Пт', note: 'Развлечения' },
  sat: { label: 'Сб', note: 'Максимум недели' },
  sun: { label: 'Вс', note: 'День отдыха' },
};
russian.finance.dayPattern = {
  morning: { label: 'Утро', range: '6-12', note: 'Транспорт, кофе' },
  day: { label: 'День', range: '12-18', note: 'Обед, покупки' },
  evening: { label: 'Вечер', range: '18-22', note: 'Ужин, развлечения' },
  night: { label: 'Ночь', range: '22-6', note: 'Спонтанные траты' },
};
russian.scenarios = {
  nightSpending: {
    title: 'Вечерние траты растут',
    tones: {
      friend: 'Вечером уже {percent} недельных расходов. Подтянем ночные перекусы?',
      strict: 'Ночные траты достигли {percent}. Включаем лимит?',
      polite: 'Вечерние расходы составляют {percent} недели. Предлагаю ограничить.',
    },
    cta: 'Проверить бюджеты',
    push: 'Ночные траты выросли. Проверим?',
    explain: 'Учитываем операции после 21:00 за последние 7 дней.',
  },
  usdPayment: {
    title: 'Скоро платёж в USD',
    tones: {
      friend: 'Через пару дней платёж в $. Не хватает {amount}. Обменяем заранее?',
      strict: 'USD-баланс ниже грядущего платежа. Выполнить обмен?',
      polite: 'Скоро платёж в USD. Предлагаю обменять часть UZS.',
    },
    cta: 'Открыть обмен',
    push: 'USD-баланс низкий перед платежом.',
    explain: 'Сравниваем нужную сумму и доступный USD ({balance}).',
  },
  missingExpense: {
    title: 'Нет записей расходов',
    tones: {
      friend: '{days} дня без записей. Добавим последние покупки за 30 секунд?',
      strict: 'Нет расходов {days} дня. Запишем?',
      polite: '{days} дня без расходов. Заполнить через быстрый ввод?',
    },
    cta: 'Быстрый ввод',
    push: '2 дня без расходов. Быстрый ввод?',
    explain: 'Опираемся на последнюю трату и основной кошелёк.',
  },
  debtDueTomorrow: {
    title: 'Завтра срок долгa',
    tones: {
      friend: 'Завтра срок для {name}. Напомним сейчас?',
      strict: 'IOU завтра. Отправить напоминание?',
      polite: 'Срок IOU завтра. Предлагаю мягко напомнить.',
    },
    cta: 'Управлять долгом',
    push: 'Завтра срок IOU. Готовы?',
    explain: 'Сумма {amount} и предложение отправить напоминание.',
  },
};
russian.finance.anomalies.food = {
  title: 'Расходы на еду +35% к прошлому месяцу',
  summary: 'Рекомендация: вернуться к домашней еде',
  recommendation: 'Потенциал экономии: 2 часа',
  meta: 'План действий',
};
russian.finance.anomalies.night = {
  title: 'Ночные покупки >200k (3 раза)',
  summary: 'Паттерн: после 22:00 по пятницам',
  recommendation: 'Рекомендация: поставьте ночной лимит',
  meta: 'Настроить правило',
};
russian.finance.reviewInsights = 'Посмотреть инсайты';
russian.finance.savingsSubtitle = 'Потенциал: 780k';
russian.finance.savings.subscriptions = {
  title: '1. Подписки',
  impact: '-180k/мес',
  detail: '5 неиспользуемых сервисов',
  bullets: [
    'Netflix (2 месяца без активности)',
    'Spotify (дублирует YouTube Music)',
    'Абонемент в зал (3 визита/мес)',
  ],
  actions: { cancel: 'Отменить все', select: 'Выбрать' },
};
russian.finance.savings.food = {
  title: '2. Доставка еды',
  impact: '-350k/мес',
  detail: 'Среднее: 12 заказов/мес',
  alternative: 'Альтернатива: готовить в воскресенье',
  bullets: [],
  actions: { meal: 'План питания', recipes: 'Рецепты' },
};
russian.finance.savings.transport = {
  title: '3. Транспорт',
  impact: '-150k/мес',
  detail: 'Частые короткие поездки на такси',
  alternative: 'Альтернатива: велосипед / метро',
  bullets: [],
  actions: { routes: 'Маршруты', pass: 'Проездной' },
};
russian.finance.savings.coffee = {
  title: '4. Кофе',
  impact: '-100k/мес',
  detail: 'Ежедневный кофе навынос',
  alternative: 'Альтернатива: домашняя кофемашина',
  bullets: [],
  actions: { recipes: 'Рецепты', equipment: 'Оборудование' },
};
russian.finance.footerActions = { applyAll: 'Применить всё', adjustPlan: 'Настроить план' };

russian.productivity.sections = {
  analyst: 'Аналитика продуктивности',
  tasks: 'Анализ выполнения задач',
};
russian.productivity.subtitles = {
  distribution: 'Распределение времени (168 ч/неделю)',
  peaks: 'Пиковая продуктивность',
  chart: 'График продуктивности по часам',
  focusMetrics: 'Метрики фокуса',
  recommendation: 'Рекомендации',
  stats: 'Статистика',
  byType: 'По типам задач',
  byContext: 'По контекстам',
  procrastination: 'Паттерны прокрастинации',
};
russian.productivity.timeDistribution = {
  work: 'Работа',
  sleep: 'Сон',
  personal: 'Личное',
  transport: 'Транспорт',
  house: 'Быт',
  dev: 'Развитие',
  rest: 'Отдых',
};
russian.productivity.peaks = {
  peak1: { label: 'Пик 1', note: 'Максимальная эффективность' },
  peak2: { label: 'Пик 2', note: 'Лучше для совместной работы' },
  low: { label: 'Спад', note: 'Восстановление после перерыва' },
};
russian.productivity.focusMetrics = {
  avg: 'Среднее время фокуса',
  best: 'Лучший день',
  worst: 'Худший день',
  interrupt: 'Перерывы',
};
russian.productivity.focusMetricValues = {
  avg: '45 минут',
  best: 'Вторник (3,5 часа)',
  worst: 'Понедельник (1 час)',
  interrupt: '12 в день в среднем',
};
russian.productivity.recommendations = [
  'Бронируйте 10:00-12:00 под важные задачи',
  'Ставьте рутину на 13:00-14:00',
  'Отключайте уведомления во время фокуса',
  'Не больше двух встреч во второй половине дня',
];
russian.productivity.stats = {
  completed: 'Выполнено:',
  onTime: 'В срок:',
  postponed: 'Отложено:',
  deleted: 'Удалено:',
  byType: 'По типам задач',
  byContext: 'По контекстам',
  procrastination: 'Паттерны прокрастинации',
  footer: 'Оптимизировать расписание',
};
russian.productivity.taskTypes = {
  creative: 'Креативные',
  routine: 'Рутинные',
  communication: 'Коммуникация',
  planning: 'Планирование',
};
russian.productivity.contexts = {
  work: '@работа',
  home: '@дом',
  outside: '@вне дома',
};
russian.productivity.procrastination = [
  'Задачи без дедлайна: выполнено 45%',
  'Крупные задачи (>2 ч): переносятся 3+ раз',
  'Задачи пятницы: 50% переносов',
];
russian.productivity.footerButton = 'Оптимизировать расписание';

russian.wisdom.sections = {
  wisdomOfDay: 'Мудрость дня',
  application: 'Применение сегодня',
  library: 'Библиотека мудростей',
  challenge: 'Челлендж цитат',
  advisors: 'Ваш совет директоров',
};
russian.wisdom.quoteDate = '6 января';
russian.wisdom.quoteActions = { add: 'В избранное', another: 'Показать другую', share: 'Поделиться' };
russian.wisdom.quoteOfDay = {
  text: 'Путь в тысячу миль начинается с одного шага',
  author: 'Лао-цзы',
  context: 'У вас 3 больших проекта. Начните с маленького шага — первой задачи.',
};
russian.wisdom.applicationCta = 'Сделать вклад сейчас';
russian.wisdom.applicationMessage =
  "Цель 'Купить машину' кажется далёкой, но вы уже прошли 82% пути. Взнос 50 000 сегодня — это тот самый 'один шаг'.";
russian.wisdom.categories = ['Все', 'Мотивация', 'Дисциплина', 'Финансы', 'Продуктивность', 'Баланс', 'Отношения'];
russian.wisdom.favoritesTitle = 'Избранное';
russian.wisdom.favoritesLink = 'Показать все цитаты';
russian.wisdom.favoriteQuotes = [
  {
    text: 'Лучшее время посадить дерево было 20 лет назад. Второе лучшее — сейчас.',
    author: 'Китайская пословица',
  },
  {
    text: 'Мы — это то, что мы делаем постоянно. Совершенство — это привычка.',
    author: 'Аристотель',
  },
];
russian.wisdom.challenge = {
  title: 'Челлендж цитат',
  status: 'Активен',
  progress: 'Ваш прогресс: 3 / 7 дней',
  quote: {
    text: 'Поднимайся каждый раз, когда падаешь.',
    author: 'Аристотель',
    context: 'Задача: не пропускай утреннюю тренировку',
  },
  markComplete: 'Отметить выполненным',
};
russian.wisdom.searchPlaceholder = 'Поиск по автору или теме';
russian.wisdom.advisorsHeaderAction = 'Редактировать';
russian.wisdom.advisors.buffett = {
  name: 'Уоррен Баффет',
  role: 'Финансовый советник',
  insight: 'Расходы на развлечения выросли на 35%.',
  reminder: 'Богатство строится не на доходах, а на сбережениях.',
  recommendation: 'Правило 50/30/20: 50% нужды, 30% желания, 20% накопления.',
  challenge: 'Ваши пропорции: 45 / 40 / 15',
};
russian.wisdom.advisors.musk = {
  name: 'Илон Маск',
  role: 'Советник по продуктивности',
  insight: '2 часа в соцсетях в день — это 14 часов в неделю.',
  reminder: 'За это время можно выучить язык или освоить навык. Делите день на блоки по 15 минут.',
  recommendation: 'Челлендж дня: без соцсетей, вложите время в проект.',
  challenge: 'Прогресс: 45/120 минут за неделю',
};
russian.wisdom.advisors.marcus = {
  name: 'Марк Аврелий',
  role: 'Советник по балансу',
  insight: '3 дня без медитации.',
  reminder: 'Важна регулярность. Начните с 2 минут утром.',
  recommendation: 'Размышление дня: ты владеешь своим разумом, а не событиями.',
  challenge: 'Прогресс: 4 / 7 дней на неделе',
};
russian.wisdom.addMentor = 'Добавить наставника';
russian.wisdom.actions = {
  contribute: 'Сделать вклад сейчас',
  askQuestion: 'Задать вопрос',
  actionPlan: 'План действий',
};

const uzbek: InsightsTranslations = cloneTranslations(english);
uzbek.tabs = {
  overview: 'Umumiy',
  finance: 'Moliya',
  productivity: 'Samaradorlik',
  wisdom: 'Donolik',
};
uzbek.overview.sections = {
  mainInsight: 'Kun asosiy insayti',
  personalIndex: 'Shaxsiy samaradorlik indeksi',
  questions: 'Bugungi savollar',
  history: 'Insaytlar tarixi',
  components: 'Indeks tarkibi',
  changes: 'Oy davomida asosiy o‘zgarishlar',
  quickWins: 'Tez g‘alabalar',
  activeInsights: 'Faol tavsiyalar',
};
uzbek.overview.deltaText = 'o‘tgan oyga nisbatan +0,5';
uzbek.overview.detailedAnalysis = 'Batafsil tahlil';
uzbek.overview.strongLabel = 'Kuchli tomonlar';
uzbek.overview.growthLabel = 'O‘sish zonasi';
uzbek.overview.mainInsightCard = {
  label: 'Kun asosiy insayti',
  title: 'Kechki dostavkalar oziq-ovqat byudjetining 30% ini yedi',
  body: 'Ketma-ket uchta kechki buyurtma haftalik xarajatni oshirdi. Bir kechki ovqatni uyda qiling va tejashni fiksatsiya qiling.',
  context: 'AI buni tanladi, chunki kechqurun qarorlarni his-tuyg‘u boshqaradi.',
  cta: 'Kechki ovqat limitini o‘rnatish',
};
uzbek.overview.questionsBlock = {
  title: 'Fokusni aniqlashtiruvchi savollar',
  subtitle: '1–3 savolga javob bering, AI ustuvorliklarni moslaydi.',
  viewAll: 'Barcha savollar',
  empty: 'Buguncha savollar yo‘q. Ertaga kirib ko‘ring.',
  customAnswer: 'O‘z javobim',
  submit: 'Saqlash',
  placeholder: 'O‘zingizni qanday his qilayotganingizni yozing…',
};
uzbek.overview.historyTeaser = {
  title: 'Insaytlar tarixi',
  summary: 'Bu hafta {count} insayt yakunlandi',
  cta: 'Tarixni ochish',
};
Object.assign(uzbek.overview.components.financial, {
  label: 'Moliya salomatligi',
  strong: 'Jamg‘arma, byudjet',
  growth: 'Investitsiya',
});
Object.assign(uzbek.overview.components.productivity, {
  label: 'Samaradorlik',
  strong: 'Fokus sessiyalar',
  growth: 'Tonggi samaradorlik',
});
Object.assign(uzbek.overview.components.balance, {
  label: 'Ish va hayot balansi',
  strong: 'Tungi dam',
  growth: 'Hafta oxiri',
});
Object.assign(uzbek.overview.components.goals, {
  label: 'Maqsadlarga erishish',
  strong: 'Barqarorlik',
  growth: 'Bajarish tezligi',
});
Object.assign(uzbek.overview.components.discipline, {
  label: 'Intizom',
  strong: 'Odatlar',
  growth: 'Hafta oxiri',
});
uzbek.overview.changeGroups.upgrades = {
  title: 'Yutuqlar',
  bullets: [
    'Jamg‘arma: dekabrdan +35%',
    'Fokus vaqti: kuniga +2 soat',
    'Mashg‘ulotlar seriyasi: 12 kun',
    '3 ta yangi odat',
  ],
};
uzbek.overview.changeGroups.attention = {
  title: 'Eʼtibor kerak',
  bullets: [
    'Tanaffusdan keyin samaradorlik -20%',
    'Meditatsiya 3 kun o‘tkazib yuborildi',
    'Oziq-ovqat xarajatlari oshdi',
    'Vazifalar kechgacha surilmoqda',
  ],
};
uzbek.overview.recommendation = {
  title: 'AI tavsiyasi',
  bullets: [
    '1. Muhim vazifalarni ertalabga ko‘chiring',
    '2. Yetkazib berishga limit qo‘ying',
    '3. Zaryaddan keyingi meditatsiya = 85% muvaffaqiyat',
  ],
  link: '7 tavsiyani ko‘rsatish',
};
uzbek.overview.quickWins = {
  title: 'Tez g‘alabalar',
  action: 'Yangilash',
  cta: 'Darhol boshlash',
  items: {
    tasks: {
      title: 'Tushgacha 3 ta vazifani yoping',
      impact: 'Taʼsir: +15% samaradorlik',
      meta: 'Vaqt: 2 soat',
    },
    coffee: {
      title: 'Kofeni olib ketishni to‘xtating',
      impact: 'Taʼsir: oyiga 150k tejash',
      meta: 'Qiyinchilik: oson',
    },
    meditation: {
      title: 'Hozir 5 daqiqa meditatsiya qiling',
      impact: 'Taʼsir: fokus +10%',
      meta: 'Vaqt: 5 daqiqa',
    },
    reading: {
      title: '10 bet o‘qing',
      impact: 'Taʼsir: maqsad bo‘yicha +2%',
      meta: 'Vaqt: 15 daqiqa',
    },
  },
};
uzbek.questions.entries['focus-priority'] = {
  prompt: 'Hozir nimasi muhimroq?',
  options: [
    { id: 'debts', label: 'Qarzlarni tezroq yopish' },
    { id: 'safety', label: 'Xavfsizlik yostig‘ini oshirish' },
    { id: 'balance', label: 'Avval energiyani tiklash' },
  ],
  category: 'finance',
};
uzbek.questions.entries['comfort-limit'] = {
  prompt: 'Ko‘ngilochar xarajatlarga qaysi oy limiti qulay?',
  description: 'AI byudjetlarni shu zahoti moslaydi.',
  options: [
    { id: '150', label: '150 ming so‘m' },
    { id: '300', label: '300 ming so‘m' },
    { id: 'custom', label: 'Boshqa' },
  ],
  allowFreeText: true,
  customLabel: 'Boshqa summa',
  category: 'finance',
};
uzbek.questions.entries['habit-friction'] = {
  prompt: 'Nega kechki sayrlar bekor bo‘ladi?',
  options: [
    { id: 'time', label: 'Vaqt yo‘q' },
    { id: 'forget', label: 'Eslab qolmayman' },
    { id: 'meaning', label: 'Foydasini sezmayman' },
  ],
  allowFreeText: true,
  customLabel: 'Boshqa sabab',
  category: 'productivity',
};
uzbek.history = {
  title: 'Insaytlar tarixi',
  subtitle: 'Nimani bajarganingiz, qoldirganingizni kuzating.',
  empty: 'Harakatlardan so‘ng tarixda paydo bo‘ladi.',
  cta: 'Obzorga qaytish',
  statusLabel: {
    new: 'Yangi',
    viewed: 'Ko‘rildi',
    completed: 'Bajarildi',
    dismissed: 'Rad etildi',
  },
  entries: {
    'delivery-limit': {
      title: 'Dostavka limiti joriy qilindi',
      summary: 'Haftasiga 3 marta qoida va 120 ming tejash.',
      category: 'finance',
    },
    'focus-sprint': {
      title: 'Fokus sprint rejalashtirildi',
      summary: 'Har biri 45 daqiqalik 2 ta sessiya bloklandi.',
      category: 'productivity',
    },
    'debt-shift': {
      title: 'Qarz to‘lovi ko‘chirildi',
      summary: 'Yangi sana va qisman to‘lov kelishildi.',
      category: 'finance',
    },
  },
};
uzbek.finance.sections = {
  health: 'Moliya salomatligi',
  indicators: 'Salomatlik ko‘rsatkichlari',
  patterns: 'Qonuniyatlar va anomaliyalar',
  savings: 'Tejash imkoniyatlari',
};
uzbek.finance.patternTitles = { weekly: 'Haftalik naqsh', daily: 'Kunlik naqsh' };
uzbek.finance.anomaliesTitle = 'Aniqlangan anomaliyalar';
uzbek.finance.scoreLabel = 'Baholash';
uzbek.finance.indicators = {
  liquidity: { label: 'Likvidlik', metric: '3,5 oylik zaxira', status: 'Aʼlo' },
  savings: { label: 'Jamg‘arma darajasi', metric: '3,5 oylik zaxira', status: 'Yaxshi' },
  debt: { label: 'Qarzdorlik yuklamasi', metric: '3,5 oylik zaxira', status: 'Past' },
  capital: { label: 'Kapital o‘sishi', metric: '3,5 oylik zaxira', status: 'Barqaror' },
  goals: { label: 'Maqsadlar ijrosi', metric: '3,5 oylik zaxira', status: 'Aʼlo' },
};
uzbek.finance.alert = {
  title: 'Ish va hayot muvozanati',
  bullets: [
    'Investitsiyalar: daromadning 2%',
    'Obunalar: 5 ta ishlatilmaydi',
    'Impulsiv xaridlar: +40%',
  ],
};
uzbek.finance.weeklyPattern = {
  mon: { label: 'Du', note: 'Eng kam xarajat' },
  tue: { label: 'Se', note: 'Barqaror' },
  wed: { label: 'Cho', note: 'Cho‘qqi: oziq-ovqat' },
  thu: { label: 'Pa', note: 'Tejamkor kun' },
  fri: { label: 'Ju', note: 'Ko‘ngilochar' },
  sat: { label: 'Sh', note: 'Haftalik maksimum' },
  sun: { label: 'Ya', note: 'Dam olish' },
};
uzbek.finance.dayPattern = {
  morning: { label: 'Tong', range: '6-12', note: 'Transport, kofe' },
  day: { label: 'Kunduz', range: '12-18', note: 'Tushlik, xaridlar' },
  evening: { label: 'Kech', range: '18-22', note: 'Kechki ovqat, hordiq' },
  night: { label: 'Tun', range: '22-6', note: 'Impuls xarajatlar' },
};
uzbek.finance.anomalies = {
  food: {
    title: 'Oziq-ovqat xarajatlari +35%',
    summary: 'Tavsiya: uydagi ovqatga qayting',
    recommendation: 'Tejash imkoniyati: 2 soat',
    meta: 'Harakat rejasi',
  },
  night: {
    title: 'Tungi xaridlar >200k (3 marta)',
    summary: 'Namuna: juma kuni 22:00 dan so‘ng',
    recommendation: 'Limit qo‘ying',
    meta: 'Qoidani o‘rnatish',
  },
};
uzbek.finance.reviewInsights = 'Insaytlarni ko‘rish';
uzbek.finance.savingsSubtitle = 'Potensial: 780k';
uzbek.finance.savings = {
  subscriptions: {
    title: '1. Obunalar',
    impact: '-180k/oy',
    detail: '5 ta foydalanilmaydigan servis',
    bullets: [
      'Netflix (2 oydan beri faollik yo‘q)',
      'Spotify (YouTube Music bilan dublikat)',
      'Sport zali (oyiga 3 marta)',
    ],
    actions: {
      cancel: 'Hammasini bekor qilish',
      select: 'Tanlash',
    },
  },
  food: {
    title: '2. Ovqat yetkazish',
    impact: '-350k/oy',
    detail: 'O‘rtacha: 12 ta buyurtma',
    alternative: 'Muqobil: yakshanba kuni tayyorlash',
    bullets: [],
    actions: {
      meal: 'Taomnoma',
      recipes: 'Retseptlar',
    },
  },
  transport: {
    title: '3. Transport',
    impact: '-150k/oy',
    detail: 'Tez-tez qisqa taksi safarlari',
    alternative: 'Muqobil: velosiped / metro',
    bullets: [],
    actions: {
      routes: 'Yo‘nalishlar',
      pass: 'Abonement',
    },
  },
  coffee: {
    title: '4. Kofe',
    impact: '-100k/oy',
    detail: 'Har kuni olib ketiladigan kofe',
    alternative: 'Muqobil: uy kofe mashinasi',
    bullets: [],
    actions: {
      recipes: 'Retseptlar',
      equipment: 'Jihozlar',
    },
  },
};
uzbek.finance.footerActions = {
  applyAll: 'Hammasini qo‘llash',
  adjustPlan: 'Rejani moslashtirish',
};
uzbek.productivity.sections = {
  analyst: 'Samaradorlik tahlilchisi',
  tasks: 'Vazifalar tahlili',
};
uzbek.productivity.subtitles = {
  distribution: 'Vaqt taqsimoti (168 soat/hafta)',
  peaks: 'Cho‘qqi samaradorlik',
  chart: 'Soatlarga ko‘ra grafika',
  focusMetrics: 'Fokus ko‘rsatkichlari',
  recommendation: 'Tavsiyalar',
  stats: 'Statistika',
  byType: 'Vazifa turi bo‘yicha',
  byContext: 'Kontekst bo‘yicha',
  procrastination: 'Prokrastinatsiya naqshlari',
};
uzbek.productivity.timeDistribution = {
  work: 'Ish',
  sleep: 'Uyqu',
  personal: 'Shaxsiy',
  transport: 'Transport',
  house: 'Uy yumushlari',
  dev: 'Rivojlanish',
  rest: 'Dam olish',
};
uzbek.productivity.peaks = {
  peak1: { label: 'Cho‘qqi 1', note: 'Juda samarali' },
  peak2: { label: 'Cho‘qqi 2', note: 'Hamkorlik uchun qulay' },
  low: { label: 'Past zona', note: 'Tanaffusdan keyingi tiklanish' },
};
uzbek.productivity.focusMetrics = {
  avg: 'O‘rtacha fokus vaqti',
  best: 'Eng yaxshi kun',
  worst: 'Eng qiyin kun',
  interrupt: 'Chalg‘ituvchilar',
};
uzbek.productivity.focusMetricValues = {
  avg: '45 daqiqa',
  best: 'Seshanba (3,5 soat)',
  worst: 'Dushanba (1 soat)',
  interrupt: 'Kuniga o‘rtacha 12 ta',
};
uzbek.productivity.recommendations = [
  'Muhim vazifalar uchun 10:00–12:00 blok qiling',
  '13:00–14:00 oralig‘ida rutinni rejalang',
  'Fokus vaqtida bildirishnomalarni o‘chiring',
  'Kunning ikkinchi yarmida 2 ta uchrashuvdan oshirmang',
];
uzbek.productivity.stats = {
  completed: 'Bajarildi:',
  onTime: 'O‘z vaqtida:',
  postponed: 'Ko‘chirildi:',
  deleted: 'O‘chirildi:',
  byType: 'Vazifa turi bo‘yicha',
  byContext: 'Kontekst bo‘yicha',
  procrastination: 'Prokrastinatsiya naqshlari',
  footer: 'Jadvalni optimallashtirish',
};
uzbek.productivity.taskTypes = {
  creative: 'Ijodiy',
  routine: 'Rutin',
  communication: 'Muloqot',
  planning: 'Rejalashtirish',
};
uzbek.productivity.contexts = {
  work: '@ish',
  home: '@uy',
  outside: '@tashqarida',
};
uzbek.productivity.procrastination = [
  'Muddat bo‘lmagan vazifalar: 45% bajarilgan',
  '2 soatdan uzun vazifalar: 3+ marta ko‘chirildi',
  'Juma vazifalari: 50% qayta rejalangan',
];
uzbek.productivity.footerButton = 'Jadvalni optimallashtirish';
uzbek.wisdom.sections = {
  wisdomOfDay: 'Kun donoligi',
  application: 'Bugungi qo‘llash',
  library: 'Donolik kutubxonasi',
  challenge: 'Iqtiboslar chellenji',
  advisors: 'Maslahatchilar kengashi',
};
uzbek.wisdom.quoteDate = '6-yanvar';
uzbek.wisdom.quoteActions = { add: 'Sevimlilarga qo‘shish', another: 'Yana birini ko‘rsat', share: 'Ulashish' };
uzbek.wisdom.quoteOfDay = {
  text: 'Ming chaqirimlik yo‘l birinchi qadamdan boshlanadi',
  author: 'Lao Szi',
  context: 'Sizda 3 ta katta loyiha bor. Eng birinchi vazifadan boshlang.',
};
uzbek.wisdom.applicationCta = 'Hozir hissa qo‘shish';
uzbek.wisdom.applicationMessage =
  '“Mashina sotib olish” maqsadi uzoqdek tuyuladi, lekin siz yo‘lning 82% ini bosib o‘tdingiz. Bugungi 50 000 so‘m — katta maqsad sari navbatdagi qadam.';
uzbek.wisdom.categories = ['Hammasi', 'Motivatsiya', 'Intizom', 'Moliya', 'Samaradorlik', 'Balans', 'Munozabatlar'];
uzbek.wisdom.favoritesTitle = 'Sevimlilar';
uzbek.wisdom.favoritesLink = 'Barcha sevimlilarni ko‘rsat';
uzbek.wisdom.favoriteQuotes = [
  {
    text: 'Daraxt ekishning eng yaxshi vaqti 20 yil avval edi. Ikkinchi eng yaxshisi — hozir.',
    author: 'Xitoy maqoli',
  },
  {
    text: 'Biz muntazam qiladigan ishlarimizmiz. Maqsad sari intilish — bu odat.',
    author: 'Arastu',
  },
];
uzbek.wisdom.challenge = {
  title: 'Iqtiboslar chellenji',
  status: 'Faol',
  progress: 'Sizning progress: 3 / 7 kun',
  quote: {
    text: 'Har yiqilganingizda yana turing.',
    author: 'Arastu',
    context: 'Vazifa: tonggi mashqni o‘tkazib yubormang',
  },
  markComplete: 'Bajarildi deb belgilash',
};
uzbek.wisdom.searchPlaceholder = 'Muallif yoki mavzu bo‘yicha qidiring';
uzbek.wisdom.advisorsHeaderAction = 'Tahrirlash';
uzbek.wisdom.advisors.buffett = {
  name: 'Warren Buffett',
  role: 'Moliya bo‘yicha maslahatchi',
  insight: 'Ko‘ngilochar xarajatlar 35% ga oshdi.',
  reminder: 'Boylik daromaddan emas, jamg‘armadan quriladi.',
  recommendation: '50/30/20 qoidasi: 50% zarur, 30% xohish, 20% jamg‘arma.',
  challenge: 'Sizning nisbatlaringiz: 45 / 40 / 15',
};
uzbek.wisdom.advisors.musk = {
  name: 'Elon Musk',
  role: 'Samaradorlik maslahatchisi',
  insight: 'Har kuni 2 soat ijtimoiy tarmoqlar? Haftasiga 14 soat.',
  reminder:
    'Shu vaqtda yangi til o‘rganishingiz yoki ko‘nikma egallashingiz mumkin. Kunni 15 daqiqalik bloklarga bo‘ling.',
  recommendation: 'Bugungi chaqiriq: tarmoqlarsiz kun, vaqtni loyihaga sarflang.',
  challenge: 'Haftalik progress: 45/120 daqiqa',
};
uzbek.wisdom.advisors.marcus = {
  name: 'Marcus Aurelius',
  role: 'Balans maslahatchisi',
  insight: '3 kun meditatsiya o‘tkazib yuborildi.',
  reminder: 'Barqarorlik muhim. 2 daqiqadan boshlang.',
  recommendation: 'Bugungi o‘y: “Aql sizniki, hodisalar emas”.',
  challenge: 'Hafta natijasi: 4 / 7 kun',
};
uzbek.wisdom.addMentor = 'Yangi murabbiy qo‘shish';
uzbek.wisdom.actions = {
  contribute: 'Hozir hissa qo‘shish',
  askQuestion: 'Savol berish',
  actionPlan: 'Harakat rejasi',
};
uzbek.scenarios = {
  nightSpending: {
    title: 'Kechki xarajatlar oshdi',
    tones: {
      friend: 'Kechqurun haftalik xarajatning {percent} qismini egalladi. Birga ko‘rib chiqamizmi?',
      strict: 'Tungi xarajatlar {percent} ga yetdi. Limit qo‘yamizmi?',
      polite: 'Kechki xarajatlar {percent}. Limit qo‘yishni taklif qilaman.',
    },
    cta: 'Budjetlarni tekshirish',
    push: 'Tungi xarajatlar oshdi. Tekshirish?',
    explain: 'Oxirgi 7 kunda 21:00 dan keyingi operatsiyalar asosida.',
  },
  usdPayment: {
    title: 'USD to‘lovi yaqinlashdi',
    tones: {
      friend: 'USD to‘lovi yaqin, {amount} yetishmaydi. Bugun almashtiramizmi?',
      strict: 'Keyingi USD to‘lovi uchun balans past. Hozir almashtiring.',
      polite: 'Yaqinda USD to‘lovi bor. Bir qismini almashtirishni taklif qilaman.',
    },
    cta: 'Valyuta almashtirish',
    push: 'To‘lov oldidan USD yetishmayapti.',
    explain: 'Kerakli summa va USD balansini solishtirish ({balance}).',
  },
  missingExpense: {
    title: 'Xarajatlar kiritilmadi',
    tones: {
      friend: '{days} kundan beri yozuv yo‘q. Oxirgi xaridlarni tez yozamizmi?',
      strict: '{days} kundan beri xarajat kiritilmadi. Kiritish kerak.',
      polite: '{days} kundan beri xarajat kiritilmadi. Tez qo‘shishni taklif qilaman.',
    },
    cta: 'Tez qo‘shish',
    push: '2 kun yozuvsiz. Tez qo‘shamizmi?',
    explain: 'Oxirgi xarajat va asosiy hamyon bo‘yicha eslatma.',
  },
  debtDueTomorrow: {
    title: 'ERTAGA IOU muddati',
    tones: {
      friend: '{name} uchun IOU ertaga tugaydi. Yodga solamizmi?',
      strict: 'IOU ertaga. Eslatma yuboramizmi?',
      polite: 'IOU muddati ertaga. Yodga solishni tavsiya qilaman.',
    },
    cta: 'Qarzni boshqarish',
    push: 'IOU ertaga. Tayyormisiz?',
    explain: 'Qoldiq {amount} va eslatma bo‘yicha taklif.',
  },
};

const arabic: InsightsTranslations = cloneTranslations(english);
arabic.tabs = {
  overview: 'نظرة عامة',
  finance: 'المالية',
  productivity: 'الإنتاجية',
  wisdom: 'الحكمة',
};
arabic.overview.sections = {
  mainInsight: 'إنسايت اليوم الرئيسي',
  personalIndex: 'مؤشر الأداء الشخصي',
  questions: 'أسئلة اليوم',
  history: 'سجل الإنسايت',
  components: 'مكوّنات المؤشر',
  changes: 'أهم التغييرات خلال الشهر',
  quickWins: 'انتصارات سريعة',
  activeInsights: 'تنبيهات نشطة',
};
arabic.overview.deltaText = '+0.5 مقارنة بالشهر الماضي';
arabic.overview.detailedAnalysis = 'تحليل مفصّل';
arabic.overview.strongLabel = 'نقاط القوة';
arabic.overview.growthLabel = 'مجال النمو';
arabic.overview.mainInsightCard = {
  label: 'إنسايت اليوم الرئيسي',
  title: 'طلبات المساء استهلكت 30% من ميزانية الطعام',
  body: 'ثلاث طلبات متتالية رفعت الإنفاق الأسبوعي. اجعل عشاءً واحداً منزلياً واحتفظ بالتوفير.',
  context: 'اختاره الذكاء الاصطناعي لأن قرارات المساء عاطفية أكثر.',
  cta: 'حدد سقفاً لعشاء الطلبات',
};
arabic.overview.questionsBlock = {
  title: 'أسئلة توضح الأولوية',
  subtitle: 'أجب عن 1-3 أسئلة ليضبط الذكاء الاصطناعي الأولويات.',
  viewAll: 'كل الأسئلة',
  empty: 'لا أسئلة لليوم. عد غداً.',
  customAnswer: 'إجابة خاصة',
  submit: 'حفظ الإجابة',
  placeholder: 'شارك ما تشعر به...',
};
arabic.overview.historyTeaser = {
  title: 'سجل الإنسايت',
  summary: '{count} إنسايت مكتمل هذا الأسبوع',
  cta: 'فتح السجل',
};
Object.assign(arabic.overview.components.financial, {
  label: 'الصحة المالية',
  strong: 'الادخار، الموازنة',
  growth: 'الاستثمار',
});
Object.assign(arabic.overview.components.productivity, {
  label: 'الإنتاجية',
  strong: 'جلسات التركيز',
  growth: 'إنتاجية الصباح',
});
Object.assign(arabic.overview.components.balance, {
  label: 'توازن الحياة والعمل',
  strong: 'راحة الليل',
  growth: 'عطلات نهاية الأسبوع',
});
Object.assign(arabic.overview.components.goals, {
  label: 'تحقيق الأهداف',
  strong: 'الاستمرارية',
  growth: 'سرعة الإنجاز',
});
Object.assign(arabic.overview.components.discipline, {
  label: 'الانضباط',
  strong: 'العادات',
  growth: 'عطلات نهاية الأسبوع',
});
arabic.overview.changeGroups.upgrades = {
  title: 'تحسينات',
  bullets: [
    'الادخار +35% مقارنة بديسمبر',
    'زمن التركيز +2 ساعة/يوم',
    'سلسلة تمارين: 12 يوماً',
    '3 عادات جديدة',
  ],
};
arabic.overview.changeGroups.attention = {
  title: 'بحاجة إلى انتباه',
  bullets: [
    'الإنتاجية بعد الاستراحة -20%',
    'تخطي 3 أيام من التأمل',
    'إنفاق زائد على الطعام',
    'تأجيل المهام إلى المساء',
  ],
};
arabic.overview.recommendation = {
  title: 'توصية الذكاء الاصطناعي',
  bullets: [
    '1. انقل المهام المهمة إلى الصباح',
    '2. حدّ من طلبات التوصيل',
    '3. التأمل بعد الشحن = نجاح 85%',
  ],
  link: 'عرض كل 7 توصيات',
};
arabic.overview.quickWins = {
  title: 'انتصارات سريعة',
  action: 'تحديث',
  cta: 'ابدأ الآن',
  items: {
    tasks: {
      title: 'أنهِ 3 مهام قبل الغداء',
      impact: 'الأثر: +15% إنتاجية',
      meta: 'الوقت: ساعتان',
    },
    coffee: {
      title: 'أوقف القهوة الجاهزة',
      impact: 'الأثر: توفير 150k شهرياً',
      meta: 'الصعوبة: سهل',
    },
    meditation: {
      title: '5 دقائق تأمل الآن',
      impact: 'الأثر: +10% تركيز',
      meta: 'الوقت: 5 دقائق',
    },
    reading: {
      title: 'اقرأ 10 صفحات',
      impact: 'الأثر: +2% تقدم الهدف',
      meta: 'الوقت: 15 دقيقة',
    },
  },
};
arabic.questions.entries['focus-priority'] = {
  prompt: 'ما الأهم لك الآن؟',
  options: [
    { id: 'debts', label: 'تسريع سداد الديون' },
    { id: 'safety', label: 'تكبير صندوق الأمان' },
    { id: 'balance', label: 'استقرار الطاقة أولاً' },
  ],
  category: 'finance',
};
arabic.questions.entries['comfort-limit'] = {
  prompt: 'ما الحد الشهري المريح للترفيه؟',
  description: 'سيعدل الذكاء الاصطناعي الميزانيات فوراً.',
  options: [
    { id: '150', label: '150 ألف UZS' },
    { id: '300', label: '300 ألف UZS' },
    { id: 'custom', label: 'مخصص' },
  ],
  allowFreeText: true,
  customLabel: 'رقم آخر',
  category: 'finance',
};
arabic.questions.entries['habit-friction'] = {
  prompt: 'لماذا تتوقف جولات المساء؟',
  options: [
    { id: 'time', label: 'لا يوجد وقت' },
    { id: 'forget', label: 'أنسى ببساطة' },
    { id: 'meaning', label: 'لا أرى الفائدة' },
  ],
  allowFreeText: true,
  customLabel: 'سبب آخر',
  category: 'productivity',
};
arabic.history = {
  title: 'سجل الإنسايت',
  subtitle: 'تابع ما تم إنجازه أو تأجيله أو رفضه.',
  empty: 'سيظهر التاريخ بعد أول تفاعل.',
  cta: 'العودة للنظرة العامة',
  statusLabel: {
    new: 'جديد',
    viewed: 'تمت رؤيته',
    completed: 'مكتمل',
    dismissed: 'مرفوض',
  },
  entries: {
    'delivery-limit': {
      title: 'تحديد حد لطلبات التوصيل',
      summary: 'قاعدة 3 مرات أسبوعياً وتوفير 120 ألف.',
      category: 'finance',
    },
    'focus-sprint': {
      title: 'تخطيط سباق تركيز',
      summary: 'حجز جلستين بواقع 45 دقيقة.',
      category: 'productivity',
    },
    'debt-shift': {
      title: 'إعادة جدولة دفعة دين',
      summary: 'الاتفاق على موعد جديد وسداد جزئي.',
      category: 'finance',
    },
  },
};
arabic.finance.sections = {
  health: 'الصحة المالية',
  indicators: 'مؤشرات الصحة',
  patterns: 'الأنماط والشذوذ',
  savings: 'فرص التوفير',
};
arabic.finance.patternTitles = { weekly: 'النمط الأسبوعي', daily: 'النمط اليومي' };
arabic.finance.anomaliesTitle = 'تم رصد شذوذ';
arabic.finance.scoreLabel = 'التقييم';
arabic.finance.indicators = {
  liquidity: { label: 'السيولة', metric: 'احتياطي 3.5 أشهر', status: 'ممتاز' },
  savings: { label: 'مستوى الادخار', metric: 'احتياطي 3.5 أشهر', status: 'جيد' },
  debt: { label: 'عبء الدين', metric: 'احتياطي 3.5 أشهر', status: 'منخفض' },
  capital: { label: 'نمو رأس المال', metric: 'احتياطي 3.5 أشهر', status: 'مستقر' },
  goals: { label: 'تقدم الأهداف', metric: 'احتياطي 3.5 أشهر', status: 'ممتاز' },
};
arabic.finance.alert = {
  title: 'توازن العمل والحياة',
  bullets: ['الاستثمار: 2% فقط من الدخل', 'الاشتراكات: 5 غير مستخدمة', 'مشتريات عشوائية: +40%'],
};
arabic.finance.weeklyPattern = {
  mon: { label: 'الإثنين', note: 'أقل إنفاق' },
  tue: { label: 'الثلاثاء', note: 'مستقر' },
  wed: { label: 'الأربعاء', note: 'الذروة: البقالة' },
  thu: { label: 'الخميس', note: 'يوم مقتصد' },
  fri: { label: 'الجمعة', note: 'ترفيه' },
  sat: { label: 'السبت', note: 'أعلى إنفاق أسبوعي' },
  sun: { label: 'الأحد', note: 'يوم راحة' },
};
arabic.finance.dayPattern = {
  morning: { label: 'الصباح', range: '6-12', note: 'المواصلات، القهوة' },
  day: { label: 'النهار', range: '12-18', note: 'الغداء، التسوق' },
  evening: { label: 'المساء', range: '18-22', note: 'العشاء، الترفيه' },
  night: { label: 'الليل', range: '22-6', note: 'إنفاق اندفاعي' },
};
arabic.finance.anomalies = {
  food: {
    title: 'إنفاق الطعام +35% عن الشهر الماضي',
    summary: 'التوصية: العودة للطهي المنزلي',
    recommendation: 'إمكانية توفير: ساعتان',
    meta: 'خطة عمل',
  },
  night: {
    title: 'مشتريات ليلية >200k (3 مرات)',
    summary: 'النمط: بعد 22:00 أيام الجمعة',
    recommendation: 'التوصية: ضع حداً ليلياً',
    meta: 'تعيين قاعدة',
  },
};
arabic.finance.reviewInsights = 'عرض الرؤى';
arabic.finance.savingsSubtitle = 'إمكانية: 780k';
arabic.finance.savings = {
  subscriptions: {
    title: '1. الاشتراكات',
    impact: '-180k/شهر',
    detail: '5 خدمات غير مستخدمة',
    bullets: [
      'Netflix (غير نشطة منذ شهرين)',
      'Spotify (مكرر لـ YouTube Music)',
      'النادي الرياضي (3 زيارات/شهر)',
    ],
    actions: { cancel: 'إلغاء الكل', select: 'اختيار' },
  },
  food: {
    title: '2. توصيل الطعام',
    impact: '-350k/شهر',
    detail: 'متوسط: 12 طلباً/شهر',
    alternative: 'بديل: إعداد الوجبات يوم الأحد',
    bullets: [],
    actions: { meal: 'خطة وجبات', recipes: 'وصفات' },
  },
  transport: {
    title: '3. المواصلات',
    impact: '-150k/شهر',
    detail: 'رحلات تاكسي قصيرة متكررة',
    alternative: 'بديل: دراجة/مترو',
    bullets: [],
    actions: { routes: 'مسارات', pass: 'اشتراك' },
  },
  coffee: {
    title: '4. القهوة',
    impact: '-100k/شهر',
    detail: 'قهوة جاهزة يومية',
    alternative: 'بديل: آلة قهوة منزلية',
    bullets: [],
    actions: { recipes: 'وصفات', equipment: 'معدات' },
  },
};
arabic.finance.footerActions = {
  applyAll: 'تطبيق الكل',
  adjustPlan: 'تعديل الخطة',
};
arabic.productivity.sections = {
  analyst: 'محلل الإنتاجية',
  tasks: 'تحليل أداء المهام',
};
arabic.productivity.subtitles = {
  distribution: 'توزيع الوقت (168 ساعة/أسبوع)',
  peaks: 'ذروة الإنتاجية',
  chart: 'الرسم البياني بالساعة',
  focusMetrics: 'مقاييس التركيز',
  recommendation: 'توصيات',
  stats: 'إحصائيات',
  byType: 'حسب نوع المهمة',
  byContext: 'حسب السياق',
  procrastination: 'أنماط التسويف',
};
arabic.productivity.timeDistribution = {
  work: 'العمل',
  sleep: 'النوم',
  personal: 'شخصي',
  transport: 'المواصلات',
  house: 'المنزل',
  dev: 'التطوير',
  rest: 'الراحة',
};
arabic.productivity.peaks = {
  peak1: { label: 'الذروة 1', note: 'فعالية عالية' },
  peak2: { label: 'الذروة 2', note: 'مناسب للتعاون' },
  low: { label: 'منخفض', note: 'تعافٍ بعد الاستراحة' },
};
arabic.productivity.focusMetrics = {
  avg: 'متوسط وقت التركيز',
  best: 'أفضل يوم',
  worst: 'أضعف يوم',
  interrupt: 'مقاطعات',
};
arabic.productivity.focusMetricValues = {
  avg: '45 دقيقة',
  best: 'الثلاثاء (3.5 ساعة)',
  worst: 'الإثنين (ساعة واحدة)',
  interrupt: '12 مرة يومياً في المتوسط',
};
arabic.productivity.recommendations = [
  'احجز 10:00–12:00 للمهام المهمة',
  'خصص الأعمال الروتينية 13:00–14:00',
  'أوقف الإشعارات أثناء التركيز',
  'حد الاجتماعات باثنتين بعد الظهر',
];
arabic.productivity.stats = {
  completed: 'منجز:',
  onTime: 'في الموعد:',
  postponed: 'مؤجل:',
  deleted: 'محذوف:',
  byType: 'حسب النوع',
  byContext: 'حسب السياق',
  procrastination: 'أنماط التسويف',
  footer: 'تحسين الجدول',
};
arabic.productivity.taskTypes = {
  creative: 'إبداعية',
  routine: 'روتينية',
  communication: 'تواصل',
  planning: 'تخطيط',
};
arabic.productivity.contexts = {
  work: '@العمل',
  home: '@المنزل',
  outside: '@الخارج',
};
arabic.productivity.procrastination = [
  'مهام بلا موعد نهائي: إنجاز 45%',
  'المهام الكبيرة (>2 س): تؤجل 3 مرات+',
  'مهام الجمعة: 50% معاد جدولتها',
];
arabic.productivity.footerButton = 'تحسين الجدول';
arabic.wisdom.sections = {
  wisdomOfDay: 'حكمة اليوم',
  application: 'التطبيق اليوم',
  library: 'مكتبة الحكم',
  challenge: 'تحدي الاقتباسات',
  advisors: 'مجلس المستشارين',
};
arabic.wisdom.quoteDate = '6 يناير';
arabic.wisdom.quoteActions = { add: 'أضف للمفضلة', another: 'اعرض اقتباساً آخر', share: 'مشاركة' };
arabic.wisdom.quoteOfDay = {
  text: 'رحلة الألف ميل تبدأ بخطوة واحدة',
  author: 'لاو تسي',
  context: 'لديك ثلاثة مشاريع كبيرة. ابدأ بخطوة صغيرة — أول مهمة.',
};
arabic.wisdom.applicationCta = 'قدّم مساهمة الآن';
arabic.wisdom.applicationMessage =
  'قد يبدو هدف "شراء سيارة" بعيداً، لكنك قطعت 82% من الطريق. مساهمة اليوم 50,000 هي خطوتك التالية.';
arabic.wisdom.categories = ['الكل', 'التحفيز', 'الانضباط', 'المالية', 'الإنتاجية', 'التوازن', 'العلاقات'];
arabic.wisdom.favoritesTitle = 'المفضلة';
arabic.wisdom.favoritesLink = 'عرض كل المفضلات';
arabic.wisdom.favoriteQuotes = [
  {
    text: 'أفضل وقت لزرع شجرة كان قبل 20 عاماً. ثاني أفضل وقت هو الآن.',
    author: 'مثل صيني',
  },
  {
    text: 'نحن ما نكرره من أفعال. التميّز عادة وليس عملاً.',
    author: 'أرسطو',
  },
];
arabic.wisdom.challenge = {
  title: 'تحدي الاقتباسات',
  status: 'نشط',
  progress: 'تقدمك: 3 / 7 أيام',
  quote: {
    text: 'انهض كلما سقطت.',
    author: 'أرسطو',
    context: 'المهمة: لا تفوّت تمارين الصباح',
  },
  markComplete: 'تحديد كمكتمل',
};
arabic.wisdom.searchPlaceholder = 'ابحث حسب الكاتب أو الموضوع';
arabic.wisdom.advisorsHeaderAction = 'تعديل';
arabic.wisdom.advisors.buffett = {
  name: 'وارن بافيت',
  role: 'مستشار مالي',
  insight: 'نفقات الترفيه ارتفعت 35%.',
  reminder: 'الثروة تُبنى على ما تدخره لا ما تكسبه.',
  recommendation: 'قاعدة 50/30/20: الضروريات، الرغبات، الادخار.',
  challenge: 'نسبك الحالية: 45 / 40 / 15',
};
arabic.wisdom.advisors.musk = {
  name: 'إيلون ماسك',
  role: 'مستشار الإنتاجية',
  insight: 'ساعتان يومياً على التواصل = 14 ساعة أسبوعياً.',
  reminder: 'يمكنك تعلم لغة أو مهارة. استخدم تقسيم اليوم إلى 15 دقيقة.',
  recommendation: 'تحدي اليوم: يوم بلا تواصل اجتماعي واستثمر الوقت في مشروعك.',
  challenge: 'تقدمك: 45/120 دقيقة هذا الأسبوع',
};
arabic.wisdom.advisors.marcus = {
  name: 'ماركوس أوريليوس',
  role: 'مستشار التوازن',
  insight: 'فاتك التأمل 3 أيام.',
  reminder: 'الاستمرارية مهمة. ابدأ بدقيقتين صباحاً.',
  recommendation: 'تأمل اليوم: لديك سلطة على عقلك لا الأحداث.',
  challenge: 'تقدمك: 4 / 7 أيام هذا الأسبوع',
};
arabic.wisdom.addMentor = 'أضف مرشداً جديداً';
arabic.wisdom.actions = {
  contribute: 'قدّم مساهمة الآن',
  askQuestion: 'اطرح سؤالاً',
  actionPlan: 'خطة عمل',
};
arabic.scenarios = {
  nightSpending: {
    title: 'ارتفاع إنفاق المساء',
    tones: {
      friend: 'إنفاق المساء وصل إلى {percent} من الأسبوع. نراجع المشتريات الليلية؟',
      strict: 'الإنفاق الليلي بلغ {percent}. حان وقت وضع حد؟',
      polite: 'إنفاق المساء {percent} من الأسبوع. أقترح تحديد سقف.',
    },
    cta: 'مراجعة الميزانيات',
    push: 'إنفاق المساء مرتفع. نراجع؟',
    explain: 'استناداً إلى العمليات بعد الساعة 21:00 خلال آخر 7 أيام.',
  },
  usdPayment: {
    title: 'دفعة بالدولار تقترب',
    tones: {
      friend: 'دفع بالدولار قريب ونحتاج {amount}. نبدأ التحويل اليوم؟',
      strict: 'رصيد الدولار أقل من الدفعة القادمة. نفّذ التحويل الآن.',
      polite: 'هناك دفعة بالدولار قريباً. أقترح تحويل جزء من السوم.',
    },
    cta: 'فتح التحويل',
    push: 'رصيد الدولار منخفض قبل الدفعة.',
    explain: 'مقارنة المبلغ المطلوب ورصيد الدولار الحالي ({balance}).',
  },
  missingExpense: {
    title: 'لا توجد مصروفات مسجلة',
    tones: {
      friend: '{days} يوم بدون تسجيل. نضيف المشتريات الأخيرة؟',
      strict: '{days} يوم بدون مصروفات. سجّلها الآن.',
      polite: '{days} يوم بلا تسجيل. استخدم الإدخال السريع؟',
    },
    cta: 'إدخال سريع',
    push: 'يومان بلا تسجيل. إضافة الآن؟',
    explain: 'بناءً على آخر مصروف والمحفظة الافتراضية.',
  },
  debtDueTomorrow: {
    title: 'موعد السداد غداً',
    tones: {
      friend: 'غداً موعد IOU لـ {name}. نرسل تذكيراً ودّياً؟',
      strict: 'موعد IOU غداً. أرسل تذكيراً؟',
      polite: 'موعد IOU غداً. أقترح تذكيراً لطيفاً.',
    },
    cta: 'إدارة الدين',
    push: 'غداً موعد IOU. جاهز؟',
    explain: 'القيمة المتبقية {amount} مع اقتراح التذكير.',
  },
};

const turkish: InsightsTranslations = cloneTranslations(english);
turkish.tabs = {
  overview: 'Genel bakış',
  finance: 'Finans',
  productivity: 'Üretkenlik',
  wisdom: 'Bilgelik',
};
turkish.overview.sections = {
  mainInsight: 'Günün ana içgörüsü',
  personalIndex: 'Kişisel performans endeksi',
  questions: 'Bugünün soruları',
  history: 'İçgörü geçmişi',
  components: 'Endeks bileşenleri',
  changes: 'Ay içi önemli değişiklikler',
  quickWins: 'Hızlı kazançlar',
  activeInsights: 'Aktif içgörüler',
};
turkish.overview.deltaText = 'Geçen aya göre +0,5';
turkish.overview.detailedAnalysis = 'Ayrıntılı analiz';
turkish.overview.strongLabel = 'Güçlü yanlar';
turkish.overview.growthLabel = 'Büyüme alanı';
turkish.overview.mainInsightCard = {
  label: 'Günün ana içgörüsü',
  title: 'Akşam siparişleri gıda bütçesinin %30’unu tüketti',
  body: 'Üst üste üç sipariş haftalık harcamayı şişirdi. Bir akşam yemeğini evde yap ve tasarrufu kilitle.',
  context: 'YZ bunu seçti çünkü akşam kararların daha duygusal.',
  cta: 'Akşam limiti koy',
};
turkish.overview.questionsBlock = {
  title: 'Odağı netleştiren sorular',
  subtitle: '1-3 soruya yanıt ver, YZ öncelikleri ayarlasın.',
  viewAll: 'Tüm sorular',
  empty: 'Bugünlük soru yok. Yarın tekrar gel.',
  customAnswer: 'Kendi cevabım',
  submit: 'Kaydet',
  placeholder: 'Nasıl hissettiğini yaz...',
};
turkish.overview.historyTeaser = {
  title: 'İçgörü geçmişi',
  summary: 'Bu hafta {count} içgörü tamamlandı',
  cta: 'Geçmişe git',
};
turkish.overview.questionsBlock = {
  title: 'Odağı netleştiren sorular',
  subtitle: '1-3 soruyu yanıtla, YZ öncelikleri ayarlasın.',
  viewAll: 'Tüm sorular',
  empty: 'Bugünlük soru yok. Yarın dön.',
  customAnswer: 'Kendi cevabım',
  submit: 'Kaydet',
  placeholder: 'Nasıl hissettiğini yaz...',
};
turkish.overview.historyTeaser = {
  title: 'İçgörü geçmişi',
  summary: 'Bu hafta {count} içgörü tamamlandı',
  cta: 'Geçmişi aç',
};
Object.assign(turkish.overview.components.financial, {
  label: 'Finansal sağlık',
  strong: 'Tasarruf, bütçe',
  growth: 'Yatırım',
});
Object.assign(turkish.overview.components.productivity, {
  label: 'Üretkenlik',
  strong: 'Odak seansları',
  growth: 'Sabah verimliliği',
});
Object.assign(turkish.overview.components.balance, {
  label: 'İş-yaşam dengesi',
  strong: 'Gece dinlenmesi',
  growth: 'Hafta sonları',
});
Object.assign(turkish.overview.components.goals, {
  label: 'Hedeflere ulaşma',
  strong: 'Tutarlılık',
  growth: 'Tamamlama hızı',
});
Object.assign(turkish.overview.components.discipline, {
  label: 'Disiplin',
  strong: 'Alışkanlıklar',
  growth: 'Hafta sonları',
});
turkish.overview.changeGroups.upgrades = {
  title: 'İyileştirmeler',
  bullets: [
    'Tasarruf: Aralık ayına göre +%35',
    'Odak süresi: günde +2 saat',
    'Antrenman serisi: 12 gün',
    '3 yeni alışkanlık',
  ],
};
turkish.overview.changeGroups.attention = {
  title: 'Dikkat gerektiriyor',
  bullets: [
    'Mola sonrası üretkenlik -%20',
    '3 gün meditasyon atlandı',
    'Gıda harcaması aşıldı',
    'Görevler akşama erteleniyor',
  ],
};
turkish.overview.recommendation = {
  title: 'YZ önerisi',
  bullets: [
    '1. Önemli görevleri sabaha taşıyın',
    '2. Paket servis limit belirleyin',
    '3. Şarjdan sonra meditasyon = %85 başarı',
  ],
  link: '7 önerinin tümünü göster',
};
turkish.overview.quickWins = {
  title: 'Hızlı kazançlar',
  action: 'Yenile',
  cta: 'Hemen başla',
  items: {
    tasks: {
      title: 'Öğlene kadar 3 görev tamamla',
      impact: 'Etkisi: +%15 üretkenlik',
      meta: 'Süre: 2 saat',
    },
    coffee: {
      title: 'Artık kahveyi dışarıdan alma',
      impact: 'Etkisi: aylık 150k tasarruf',
      meta: 'Zorluk: Kolay',
    },
    meditation: {
      title: 'Şimdi 5 dk meditasyon',
      impact: 'Etkisi: +%10 odak',
      meta: 'Süre: 5 dakika',
    },
    reading: {
      title: '10 sayfa oku',
      impact: 'Etkisi: hedef ilerlemesi +%2',
      meta: 'Süre: 15 dakika',
    },
  },
};
turkish.questions.entries['focus-priority'] = {
  prompt: 'Şu an senin için ne daha önemli?',
  options: [
    { id: 'debts', label: 'Borçları daha hızlı kapatmak' },
    { id: 'safety', label: 'Güvenlik yastığını büyütmek' },
    { id: 'balance', label: 'Önce enerjiyi dengelemek' },
  ],
  category: 'finance',
};
turkish.questions.entries['comfort-limit'] = {
  prompt: 'Eğlence için hangi aylık limit konforlu?',
  description: 'YZ bütçeleri hemen güncelleyecek.',
  options: [
    { id: '150', label: '150 bin UZS' },
    { id: '300', label: '300 bin UZS' },
    { id: 'custom', label: 'Özel' },
  ],
  allowFreeText: true,
  customLabel: 'Başka rakam',
  category: 'finance',
};
turkish.questions.entries['habit-friction'] = {
  prompt: 'Akşam yürüyüşleri neden iptal oluyor?',
  options: [
    { id: 'time', label: 'Vakit yok' },
    { id: 'forget', label: 'Unutuyorum' },
    { id: 'meaning', label: 'Faydasına inanmıyorum' },
  ],
  allowFreeText: true,
  customLabel: 'Başka sebep',
  category: 'productivity',
};
turkish.history = {
  title: 'İçgörü geçmişi',
  subtitle: 'Tamamladığın, ertelediğin veya reddettiğinleri gör.',
  empty: 'İlk aksiyondan sonra geçmiş dolacak.',
  cta: 'Genel bakışa dön',
  statusLabel: {
    new: 'Yeni',
    viewed: 'Görüldü',
    completed: 'Tamamlandı',
    dismissed: 'Reddedildi',
  },
  entries: {
    'delivery-limit': {
      title: 'Paket servis limiti kondu',
      summary: 'Haftada 3 kuralı ve 120k tasarruf.',
      category: 'finance',
    },
    'focus-sprint': {
      title: 'Odak sprinti planlandı',
      summary: '45 dakikalık 2 seans bloke edildi.',
      category: 'productivity',
    },
    'debt-shift': {
      title: 'Borç ödemesi ertelendi',
      summary: 'Yeni tarih ve kısmi ödeme ayarlandı.',
      category: 'finance',
    },
  },
};
turkish.finance.sections = {
  health: 'Finansal sağlık',
  indicators: 'Sağlık göstergeleri',
  patterns: 'Desenler ve anomaliler',
  savings: 'Tasarruf potansiyeli',
};
turkish.finance.patternTitles = { weekly: 'Haftalık desen', daily: 'Günlük desen' };
turkish.finance.anomaliesTitle = 'Tespit edilen anomaliler';
turkish.finance.scoreLabel = 'Skor';
turkish.finance.indicators = {
  liquidity: { label: 'Likidite', metric: '3,5 aylık rezerv', status: 'Mükemmel' },
  savings: { label: 'Tasarruf seviyesi', metric: '3,5 aylık rezerv', status: 'İyi' },
  debt: { label: 'Borç yükü', metric: '3,5 aylık rezerv', status: 'Düşük' },
  capital: { label: 'Sermaye büyümesi', metric: '3,5 aylık rezerv', status: 'Dengeli' },
  goals: { label: 'Hedef ilerlemesi', metric: '3,5 aylık rezerv', status: 'Mükemmel' },
};
turkish.finance.alert = {
  title: 'İş-yaşam dengesi',
  bullets: ['Yatırım: gelirin sadece %2’si', 'Abonelikler: 5’i kullanılmıyor', 'Ani alışveriş: +%40'],
};
turkish.finance.weeklyPattern = {
  mon: { label: 'Pzt', note: 'En az harcama' },
  tue: { label: 'Sal', note: 'Stabil' },
  wed: { label: 'Çar', note: 'Zirve: market alışverişi' },
  thu: { label: 'Per', note: 'Tasarruf günü' },
  fri: { label: 'Cum', note: 'Eğlence' },
  sat: { label: 'Cmt', note: 'Haftanın zirvesi' },
  sun: { label: 'Paz', note: 'Dinlenme' },
};
turkish.finance.dayPattern = {
  morning: { label: 'Sabah', range: '6-12', note: 'Ulaşım, kahve' },
  day: { label: 'Gündüz', range: '12-18', note: 'Öğle, alışveriş' },
  evening: { label: 'Akşam', range: '18-22', note: 'Akşam yemeği, eğlence' },
  night: { label: 'Gece', range: '22-6', note: 'Ani harcamalar' },
};
turkish.finance.anomalies = {
  food: {
    title: 'Gıda harcaması geçen aya göre +%35',
    summary: 'Öneri: Ev yemeğine dön',
    recommendation: 'Tasarruf potansiyeli: 2 saat',
    meta: 'Eylem planı',
  },
  night: {
    title: 'Gece alışverişleri >200k (3 kez)',
    summary: 'Desen: Cuma 22:00 sonrası',
    recommendation: 'Gece limiti ayarlayın',
    meta: 'Kural belirle',
  },
};
turkish.finance.reviewInsights = 'İçgörüleri incele';
turkish.finance.savingsSubtitle = 'Potansiyel: 780k';
turkish.finance.savings = {
  subscriptions: {
    title: '1. Abonelikler',
    impact: '-180k/ay',
    detail: '5 kullanılmayan servis',
    bullets: [
      'Netflix (2 aydır aktif değil)',
      'Spotify (YouTube Music ile aynı)',
      'Spor salonu (ayda 3 ziyaret)',
    ],
    actions: { cancel: 'Hepsini iptal et', select: 'Seç' },
  },
  food: {
    title: '2. Yemek siparişi',
    impact: '-350k/ay',
    detail: 'Ortalama: ayda 12 sipariş',
    alternative: 'Alternatif: Pazar günü hazırlık',
    bullets: [],
    actions: { meal: 'Öğün planı', recipes: 'Tarifler' },
  },
  transport: {
    title: '3. Ulaşım',
    impact: '-150k/ay',
    detail: 'Sık ve kısa taksi yolculukları',
    alternative: 'Alternatif: bisiklet / metro',
    bullets: [],
    actions: { routes: 'Rotalar', pass: 'Abonman' },
  },
  coffee: {
    title: '4. Kahve',
    impact: '-100k/ay',
    detail: 'Her gün paket kahve',
    alternative: 'Alternatif: ev tipi kahve makinesi',
    bullets: [],
    actions: { recipes: 'Tarifler', equipment: 'Ekipman' },
  },
};
turkish.finance.footerActions = {
  applyAll: 'Tümünü uygula',
  adjustPlan: 'Planı güncelle',
};
turkish.productivity.sections = {
  analyst: 'Üretkenlik analisti',
  tasks: 'Görev performansı',
};
turkish.productivity.subtitles = {
  distribution: 'Zaman dağılımı (haftada 168 saat)',
  peaks: 'Zirve üretkenlik',
  chart: 'Saatlik üretkenlik grafiği',
  focusMetrics: 'Odak metrikleri',
  recommendation: 'Öneriler',
  stats: 'İstatistikler',
  byType: 'Görev türüne göre',
  byContext: 'Bağlama göre',
  procrastination: 'Erteleme kalıpları',
};
turkish.productivity.timeDistribution = {
  work: 'İş',
  sleep: 'Uyku',
  personal: 'Kişisel',
  transport: 'Ulaşım',
  house: 'Ev işleri',
  dev: 'Gelişim',
  rest: 'Dinlenme',
};
turkish.productivity.peaks = {
  peak1: { label: 'Zirve 1', note: 'Çok verimli' },
  peak2: { label: 'Zirve 2', note: 'İş birlikleri için uygun' },
  low: { label: 'Düşük', note: 'Moladan sonra toparlanma' },
};
turkish.productivity.focusMetrics = {
  avg: 'Ortalama odak süresi',
  best: 'En iyi gün',
  worst: 'En zayıf gün',
  interrupt: 'Dikkat dağıtıcılar',
};
turkish.productivity.focusMetricValues = {
  avg: '45 dakika',
  best: 'Salı (3,5 saat)',
  worst: 'Pazartesi (1 saat)',
  interrupt: 'Günde ortalama 12',
};
turkish.productivity.recommendations = [
  'Önemli işler için 10:00–12:00 blokla',
  '13:00–14:00 aralığını rutinlere ayır',
  'Odak sırasında bildirimleri kapat',
  'Öğleden sonra en fazla 2 toplantı yap',
];
turkish.productivity.stats = {
  completed: 'Tamamlandı:',
  onTime: 'Zamanında:',
  postponed: 'Ertelendi:',
  deleted: 'Silindi:',
  byType: 'Görev türüne göre',
  byContext: 'Bağlama göre',
  procrastination: 'Erteleme kalıpları',
  footer: 'Takvimi optimize et',
};
turkish.productivity.taskTypes = {
  creative: 'Yaratıcı',
  routine: 'Rutin',
  communication: 'İletişim',
  planning: 'Planlama',
};
turkish.productivity.contexts = {
  work: '@iş',
  home: '@ev',
  outside: '@dışarı',
};
turkish.productivity.procrastination = [
  'Son tarihsiz görevler: %45 tamamlandı',
  '2 saati aşan görevler: 3+ kez ertelendi',
  'Cuma görevleri: %50 yeniden planlandı',
];
turkish.productivity.footerButton = 'Takvimi optimize et';
turkish.wisdom.sections = {
  wisdomOfDay: 'Günün bilgeliği',
  application: 'Bugünkü uygulama',
  library: 'Bilgelik kütüphanesi',
  challenge: 'Alıntı meydan okuması',
  advisors: 'Danışman kurulu',
};
turkish.wisdom.quoteDate = '6 Ocak';
turkish.wisdom.quoteActions = { add: 'Favorilere ekle', another: 'Başka göster', share: 'Paylaş' };
turkish.wisdom.quoteOfDay = {
  text: 'Bin millik yol tek adımla başlar',
  author: 'Laozi',
  context: '3 büyük projen var. İlk görevle küçükten başla.',
};
turkish.wisdom.applicationCta = 'Şimdi katkı yap';
turkish.wisdom.applicationMessage =
  '“Araba almak” hedefi uzak görünebilir, ama yolun %82’sini geçtiniz. Bugünkü 50.000 katkı bir sonraki adım.';
turkish.wisdom.categories = ['Tümü', 'Motivasyon', 'Disiplin', 'Finans', 'Üretkenlik', 'Denge', 'İlişkiler'];
turkish.wisdom.favoritesTitle = 'Favoriler';
turkish.wisdom.favoritesLink = 'Tüm favorileri göster';
turkish.wisdom.favoriteQuotes = [
  {
    text: 'Bir ağacı dikmenin en iyi zamanı 20 yıl önceydi. İkinci en iyi zaman şimdi.',
    author: 'Çin atasözü',
  },
  {
    text: 'Sürekli yaptığımız şey ne ise oyuz. Mükemmellik bir eylem değil, alışkanlıktır.',
    author: 'Aristoteles',
  },
];
turkish.wisdom.challenge = {
  title: 'Alıntı meydan okuması',
  status: 'Aktif',
  progress: 'İlerleme: 3 / 7 gün',
  quote: {
    text: 'Ne zaman düşsen ayağa kalk.',
    author: 'Aristoteles',
    context: 'Görev: Sabah antrenmanını atlama',
  },
  markComplete: 'Tamamlandı olarak işaretle',
};
turkish.wisdom.searchPlaceholder = 'Yazara veya temaya göre ara';
turkish.wisdom.advisorsHeaderAction = 'Düzenle';
turkish.wisdom.advisors.buffett = {
  name: 'Warren Buffett',
  role: 'Finans danışmanı',
  insight: 'Eğlence harcamaların %35 arttı.',
  reminder: 'Servet kazandığından değil, biriktirdiğinden oluşur.',
  recommendation: '50/30/20 kuralı: ihtiyaç, istek, tasarruf.',
  challenge: 'Oranların: 45 / 40 / 15',
};
turkish.wisdom.advisors.musk = {
  name: 'Elon Musk',
  role: 'Üretkenlik danışmanı',
  insight: 'Her gün sosyal medyada 2 saat = haftada 14 saat.',
  reminder: 'Bu sürede dil öğrenebilir ya da beceri kazanabilirsin. Günü 15 dakikalık bloklara böl.',
  recommendation: 'Bugünün meydan okuması: sosyal medyasız gün ve zamanı projene harca.',
  challenge: 'İlerleme: bu hafta 45/120 dakika',
};
turkish.wisdom.advisors.marcus = {
  name: 'Marcus Aurelius',
  role: 'Denge danışmanı',
  insight: '3 gündür meditasyon yok.',
  reminder: 'Süreklilik önemli. 2 dakikadan başla.',
  recommendation: 'Günün düşüncesi: Zihninin efendisi sensin, olayların değil.',
  challenge: 'İlerleme: Bu hafta 4 / 7 gün',
};
turkish.wisdom.addMentor = 'Yeni mentor ekle';
turkish.wisdom.actions = {
  contribute: 'Şimdi katkı yap',
  askQuestion: 'Soru sor',
  actionPlan: 'Eylem planı',
};
turkish.scenarios = {
  nightSpending: {
    title: 'Akşam harcamaları arttı',
    tones: {
      friend: 'Akşam harcaması haftanın {percent}’ini oluşturuyor. Gece atıştırmalarını gözden geçirelim mi?',
      strict: 'Gece harcamaları {percent}. Limit koyma zamanı?',
      polite: 'Akşam harcamaları {percent}. Limit önermemi ister misiniz?',
    },
    cta: 'Bütçeleri incele',
    push: 'Gece harcamaları yükseldi. İncelensin mi?',
    explain: 'Son 7 günde 21:00 sonrası işlemler incelendi.',
  },
  usdPayment: {
    title: 'USD ödemesi yaklaşıyor',
    tones: {
      friend: 'USD ödemesi yakın, {amount} eksik. Bugün çevirelim mi?',
      strict: 'USD bakiyesi sonraki ödeme için yetersiz. Hemen çevir.',
      polite: 'Yakında USD ödemesi var. Bir kısmını çevirelim mi?',
    },
    cta: 'Döviz çevir',
    push: 'USD bakiyesi düşük.',
    explain: 'Gerekli tutar ile bakiyeyi karşılaştırır ({balance}).',
  },
  missingExpense: {
    title: 'Harcama kaydı yok',
    tones: {
      friend: '{days} gündür kayıt yok. Son alışverişleri ekleyelim mi?',
      strict: '{days} gündür harcama girilmedi. Hemen ekle.',
      polite: '{days} gündür kayıt yok. Hızlı ekleyi öneriyorum.',
    },
    cta: 'Hızlı ekle',
    push: '2 gündür kayıt yok. Ekleyelim mi?',
    explain: 'Son harcama ve varsayılan cüzdan bilgisine göre.',
  },
  debtDueTomorrow: {
    title: 'IOU yarın vadesinde',
    tones: {
      friend: '{name} için IOU yarın. Hatırlatalım mı?',
      strict: 'IOU yarın. Hatırlatma gönder?',
      polite: 'IOU yarın vadesinde. Nazik bir hatırlatma öneriyorum.',
    },
    cta: 'Borcu yönet',
    push: 'IOU yarın. Hazır mısın?',
    explain: 'Kalan tutar {amount} ve hatırlatma önerisi.',
  },
};

export const INSIGHTS_TRANSLATIONS: Record<SupportedLanguage, InsightsTranslations> = {
  en: english,
  ru: russian,
  uz: uzbek,
  ar: arabic,
  tr: turkish,
};
