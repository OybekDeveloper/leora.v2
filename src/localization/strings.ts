import { SupportedLanguage } from '@/stores/useSettingsStore';
import type { GoalSummaryKey, PlannerGoalId, PlannerHabitId } from '@/types/planner';

import enAddTask from './addTask/en.json';
import ruAddTask from './addTask/ru.json';
import uzAddTask from './addTask/uz.json';
import arAddTask from './addTask/ar.json';
import trAddTask from './addTask/tr.json';
import enGoalModal from './goalModal/en.json';
import ruGoalModal from './goalModal/ru.json';
import uzGoalModal from './goalModal/uz.json';
import arGoalModal from './goalModal/ar.json';
import trGoalModal from './goalModal/tr.json';
import enUniversalFab from './universalFab/en.json';
import ruUniversalFab from './universalFab/ru.json';
import uzUniversalFab from './universalFab/uz.json';
import arUniversalFab from './universalFab/ar.json';
import trUniversalFab from './universalFab/tr.json';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ru', 'uz', 'ar', 'tr'];

export const LANGUAGE_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  uz: 'uz-UZ',
  ar: 'ar',
  tr: 'tr-TR',
};

export type GoalModalScenarioKey = 'financialSave' | 'financialSpend' | 'habitSupport' | 'skillGrowth' | 'custom';

type GoalModalMetricOption = 'amount' | 'count' | 'duration' | 'custom';

export type GoalModalStrings = {
  title: string;
  subtitle: string;
  scenarioSection: { title: string; subtitle: string };
  scenarios: Record<GoalModalScenarioKey, { title: string; subtitle: string }>;
  detailsSection: {
    title: string;
    titleLabel: string;
    descriptionLabel: string;
    titlePlaceholder: string;
    descriptionPlaceholder: string;
  };
  measurementSection: {
    title: string;
    metricLabel: string;
    metricOptions: Record<GoalModalMetricOption, string>;
    currentLabel: string;
    targetLabel: string;
    unitLabel: string;
    currencyLabel: string;
    financeModeLabel: string;
    financeModes: Record<'save' | 'spend' | 'debt_close', string>;
    placeholders: {
      current: string;
      target: string;
      unit: string;
    };
  };
  timelineSection: {
    title: string;
    startLabel: string;
    dueLabel: string;
    noDate: string;
  };
  milestoneSection: {
    title: string;
    description: string;
    percentLabel: string;
    dueLabel: string;
    add: string;
    empty: string;
    delete: string;
  };
  actions: {
    cancel: string;
    create: string;
    createMore: string;
    update: string;
  };
  alerts: {
    missingTitle: string;
    invalidTarget: string;
  };
};

export type AppTranslations = {
  auth: {
    common: {
      socialDivider: string;
      languageButtonLabel: string;
      languageHelper: string;
      languageSheetTitle: string;
    };
    validation: {
      emailOrUsernameRequired: string;
      emailRequired: string;
      emailInvalid: string;
      nameRequired: string;
      passwordRequired: string;
      passwordConfirmRequired: string;
      passwordMismatch: string;
      passwordMinLength: string;
      passwordUppercase: string;
      passwordLowercase: string;
      passwordNumber: string;
      passwordSpecial: string;
    };
    login: {
      title: string;
      description: string;
      fields: {
        emailOrUsername: string;
        password: string;
      };
      placeholders: {
        emailOrUsername: string;
        password: string;
      };
      rememberMe: string;
      forgotPassword: string;
      buttons: {
        submit: string;
      };
      links: {
        noAccount: string;
        signUp: string;
      };
      alerts: {
        failureTitle: string;
        failureMessage: string;
        socialTitle: string;
        socialMessage: string;
      };
      errors: {
        missingCredentials: string;
        invalidCredentials: string;
        generic: string;
      };
    };
    register: {
      title: string;
      description: string;
      fields: {
        email: string;
        fullName: string;
        password: string;
        confirmPassword: string;
      };
      placeholders: {
        email: string;
        fullName: string;
        password: string;
        confirmPassword: string;
      };
      buttons: {
        submit: string;
        socialComingSoon: string;
      };
      links: {
        haveAccount: string;
        signIn: string;
      };
      languageSelector: {
        label: string;
        helper: string;
      };
      selectors: {
        sectionTitle: string;
        helper: string;
        regionLabel: string;
        currencyLabel: string;
        currencyHint: string;
      };
      sheets: {
        regionTitle: string;
        currencyTitle: string;
        currencySearch: string;
        languageTitle: string;
      };
      alerts: {
        successTitle: string;
        successMessage: string;
        failureTitle: string;
        socialTitle: string;
        socialMessage: string;
      };
      passwordGuide: {
        strengthLabel: string;
        helper: string;
        levels: {
          empty: string;
          weak: string;
          medium: string;
          strong: string;
        };
        requirementsTitle: string;
        requirements: {
          length: string;
          uppercase: string;
          lowercase: string;
          number: string;
          special: string;
        };
      };
      errors: {
        missingFields: string;
        selectRegion: string;
        passwordMismatch: string;
        emailInvalid: string;
        emailExists: string;
        generic: string;
      };
    };
    forgot: {
      languageSelector: {
        label: string;
        helper: string;
      };
      emailStep: {
        title: string;
        description: string;
        fieldLabel: string;
        placeholder: string;
        button: {
          submit: string;
          loading: string;
        };
      };
      otpStep: {
        title: string;
        description: string;
        timerHint: string;
        resend: string;
        back: string;
        button: {
          submit: string;
          loading: string;
        };
      };
      alerts: {
        codeSentTitle: string;
        codeSentMessage: string;
        codeResentTitle: string;
        codeResentMessage: string;
        otpVerifiedTitle: string;
        otpVerifiedMessage: string;
        genericErrorTitle: string;
        genericErrorMessage: string;
        okButton: string;
      };
      footer: {
        remember: string;
        signIn: string;
      };
      errors: {
        invalidEmail: string;
        generic: string;
        otpExpired: string;
        otpInvalid: string;
        otpIncomplete: string;
      };
    };
  };
  home: {
    header: {
      todayLabel: string;
      openProfile: string;
      previousDay: string;
      nextDay: string;
    };
    greeting: {
      morning: string;
      afternoon: string;
      evening: string;
      night: string;
      defaultName: string;
    };
    status: {
      online: string;
      offline: string;
      connecting: string;
    };
    widgets: {
      title: string;
      edit: string;
      emptyTitle: string;
      emptySubtitle: string;
    };
    progress: {
      tasks: string;
      budget: string;
      habit: string;
      progressSuffix: string;
    };
  };
  tabs: {
    home: string;
    finance: string;
    planner: string;
    insights: string;
    more: string;
  };
  calendar: {
    todayLabel: string;
    selectDateTitle: string;
  };
  addTask: {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    whenLabel: string;
    whenOptions: Record<'today' | 'tomorrow' | 'pick', string>;
    timePlaceholder: string;
    category: string;
    date: string;
    time: string;
    notes: string;
    notesPlaceholder: string;
    project: string;
    projectPlaceholder: string;
    context: string;
    energy: string;
    priority: string;
    additional: string;
    reminder: string;
    repeat: string;
    needFocus: string;
    subtasks: string;
    subtaskPlaceholder: string;
    submit: string;
    submitMore: string;
    categories: Record<'work' | 'personal' | 'health' | 'learning' | 'errands', string>;
    priorityOptions: Record<'low' | 'medium' | 'high', string>;
    goalLabel: string;
    goalUnset: string;
    goalHelper: string;
  };
  universalFab: {
    planner: {
      task: string;
      goal: string;
      habit: string;
      focus: string;
    };
    finance: {
      incomeOutcome: string;
      transfer: string;
      debt: string;
    };
    index: {
      task: string;
      quickExpense: string;
      focus: string;
      voiceNote: string;
    };
  };
  plannerScreens: {
    tabs: {
      tasks: string;
      goals: string;
      habits: string;
    };
    tasks: {
      headerTemplate: string;
      todayLabel: string;
      filter: string;
      sectionCountLabel: string;
      sectionTip: string;
      sections: Record<'morning' | 'afternoon' | 'evening', { title: string; time: string }>;
      actions: {
        complete: string;
        restore: string;
        remove: string;
        delete: string;
      };
      history: {
        title: string;
        subtitle: string;
        tip: string;
        deletedBadge: string;
      };
      defaults: {
        startToday: string;
        startTomorrow: string;
        startPick: string;
        newTaskTitle: string;
        defaultContext: string;
      };
      aiPrefix: string;
      dailySummary: string;
      statuses: Record<'active' | 'in_progress' | 'completed' | 'archived', string>;
      focus: {
        cta: string;
        inProgress: string;
        cardLabel: string;
        goalTag: string;
        finishTitle: string;
        finishMessage: string;
        done: string;
        move: string;
        keep: string;
      };
      calendar: {
        title: string;
        summary: string;
        addQuickTask: string;
        quickTaskTitle: string;
        scheduledTitle: string;
        empty: string;
        moveTitle: string;
        moveHere: string;
        moveTomorrow: string;
        unscheduled: string;
        noOtherTasks: string;
      };
      aiSuggestions: {
        title: string;
        time: string;
        duration: string;
        context: string;
        energy: string;
        apply: string;
      };
    };
    goals: {
      header: { title: string; subtitle: string };
      empty: { title: string; subtitle: string };
      sections: Record<'financial' | 'personal', { title: string; subtitle: string }>;
      cards: {
        summaryLabels: Record<GoalSummaryKey, string>;
        actions: {
          addValue: string;
          refresh: string;
          edit: string;
          addValueA11y: string;
          refreshA11y: string;
          editA11y: string;
          openDetailsA11y: string;
        };
      };
      details: { milestones: string; history: string; showMore: string };
      nextStep: { title: string; empty: string; cta: string };
      linkedSummary: string;
      ai: {
        title: string;
        milestones: string;
        duration: string;
        apply: string;
      };
      data: Record<
        PlannerGoalId,
        {
          title: string;
          currentAmount: string;
          targetAmount: string;
          summary: Record<GoalSummaryKey, string>;
          milestones: [string, string, string, string];
          history: { label: string; delta: string }[];
          aiTip: string;
          aiTipHighlight?: string;
        }
      >;
    };
    habits: {
      headerTitle: string;
      badgeSuffix: string;
      calendarTitle: string;
      calendarLegend: { done: string; miss: string; none: string };
      calendarLegendHint: { done: string; miss: string; none: string };
      challenge: {
        title: string;
        subtitle: string;
        options: { short: string; medium: string; long: string };
        pinMessage: string;
      };
      calendarButton: string;
      stats: {
        streak: string;
        record: string;
        completion: string;
      };
      supportsGoals: string;
      ai: {
        title: string;
        time: string;
        stack: string;
        apply: string;
      };
      ctas: {
        checkIn: string;
        startTimer: string;
        completed: string;
        failed: string;
        edit: string;
        delete: string;
      };
      expand: {
        titles: { statistics: string; pattern: string; achievements: string };
        lines: {
          overallCompletion: string;
          successPercentile: string;
          averageStreak: string;
          bestMonth: string;
          bestTime: string;
          worstTime: string;
          afterWeekends: string;
        };
        badges: {
          firstWeek: string;
          monthNoBreak: string;
          hundredCompletions: string;
          marathoner: string;
        };
      };
      empty: {
        title: string;
        subtitle: string;
      };
      data: Record<
        PlannerHabitId,
        {
          title: string;
          aiNote?: string;
          chips?: string[];
        }
      >;
    };
  };
  plannerModals: {
    goal: GoalModalStrings;
  };
  widgets: {
    budgetProgress: {
      title: string;
      defaults: { housing: string; groceries: string; entertainment: string };
      placeholders: { empty: string; add: string };
    };
    cashFlow: {
      title: string;
      summary: { income: string; expenses: string; net: string };
      days: { mon: string; tue: string; wed: string; thu: string; fri: string };
    };
    dailyTasks: {
      title: string;
      placeholders: [string, string, string];
    };
    focusSessions: {
      title: string;
      stats: { completed: string; totalTime: string; nextSession: string };
      placeholders: { none: string; free: string };
    };
    goals: {
      title: string;
      placeholderText: string;
      placeholders: [string, string];
    };
    habits: {
      title: string;
      placeholders: [string, string];
      streakLabel: string;
      noStreak: string;
    };
    productivityInsights: {
      title: string;
      metrics: { focusScore: string; tasksCompleted: string; deepWork: string };
      trendTitle: string;
      vsLastWeek: string;
      noTrend: string;
      days: { mon: string; tue: string; wed: string; thu: string; fri: string };
    };
    spendingSummary: {
      title: string;
      categories: { food: string; transport: string; shopping: string };
      placeholders: [string, string];
      total: string;
    };
    transactions: {
      title: string;
      placeholders: [string, string];
    };
    weeklyReview: {
      title: string;
      stats: { completion: string; focusTime: string; currentStreak: string };
      summary: { success: string; empty: string };
      streakUnit: string;
    };
    wellnessOverview: {
      title: string;
      metrics: { energy: string; mood: string; sleep: string };
      messages: { balanced: string; logPrompt: string };
    };
  };
  language: {
    sectionTitle: string;
    helperTitle: string;
    helperDescription: string;
  };
  more: {
    header: {
      title: string;
      profileAction: string;
      notificationsAction: string;
      badgeLabel: string;
      dateLabel: string;
    };
    premiumBadge: string;
    sections: {
      account: string;
      settings: string;
      data: string;
      integration: string;
      help: string;
    };
    accountItems: {
      profile: string;
      premium: string;
      achievements: string;
      statistics: string;
    };
    settingsItems: {
      appearance: string;
      notifications: string;
      aiAssistant: string;
      security: string;
      language: string;
    };
    dataItems: {
      synchronization: string;
      backup: string;
      export: string;
      cache: string;
    };
    integrationItems: {
      calendars: string;
      banks: string;
      apps: string;
      devices: string;
    };
    helpItems: {
      manual: string;
      faq: string;
      support: string;
      about: string;
    };
    values: {
      enabled: string;
      disabled: string;
      on: string;
      off: string;
      themeLight: string;
      themeDark: string;
      aiAlpha: string;
      languageLabel: string;
      level: string;
    };
    logout: string;
    confirmLogout: {
      title: string;
      message: string;
      cancel: string;
      confirm: string;
    };
  };
  profile: {
    title: string;
    sections: {
      personal: string;
      stats: string;
      preferences: string;
      finance: string;
      actions: string;
    };
    fields: {
      fullName: string;
      email: string;
      phone: string;
      username: string;
      joined: string;
      bio: string;
      visibility: string;
      visibilityOptions: { public: string; friends: string; private: string };
      showLevel: string;
      showAchievements: string;
      showStatistics: string;
    };
    finance: {
      regionLabel: string;
      currencyLabel: string;
      regionSheetTitle: string;
      currencySheetTitle: string;
      currencySearchPlaceholder: string;
      fxTitle: string;
      fxDescription: string;
      fxProviderLabel: string;
      fxProviders: Record<'central_bank_stub' | 'market_stub', string>;
      fxSyncButton: string;
      fxSyncing: string;
      fxSyncSuccess: string;
      fxSyncError: string;
      fxLastSync: string;
      fxManualTitle: string;
      fxManualHint: string;
      fxManualCurrencyLabel: string;
      fxOverridePlaceholder: string;
      fxOverrideButton: string;
      fxOverrideSuccess: string;
      fxOverrideError: string;
      fxOverrideBaseError: string;
      fxOverrideSheetTitle: string;
    };
    stats: {
      daysWithApp: string;
      completedTasks: string;
      activeTasks: string;
      level: string;
    };
    xp: {
      label: string;
      toNext: string;
    };
    buttons: {
      edit: string;
      save: string;
      cancel: string;
      delete: string;
      logout: string;
      changePhoto: string;
      removePhoto: string;
      confirmDeleteTitle: string;
      confirmDeleteMessage: string;
      confirmDeleteConfirm: string;
      confirmDeleteCancel: string;
    };
  };
  financeScreens: {
    tabs: {
      review: string;
      accounts: string;
      transactions: string;
      budgets: string;
      analytics: string;
      debts: string;
    };
    review: {
      totalBalance: string;
      income: string;
      outcome: string;
      monthBalance: string;
      used: string;
      progress: string;
      expenseStructure: string;
      recentTransactions: string;
      seeAll: string;
      importantEvents: string;
      table: { type: string; amount: string; date: string };
      fxQuick: {
        title: string;
        providerLabel: string;
        providers: Record<'central_bank_stub' | 'market_stub', string>;
        syncButton: string;
        syncDescription: string;
        syncing: string;
        syncSuccess: string;
        syncError: string;
        lastSync: string;
        overrideButton: string;
        overrideHint: string;
        overrideTitle: string;
        overridePlaceholder: string;
        overrideConfirm: string;
        overrideCancel: string;
        overrideSuccess: string;
        overrideError: string;
        overrideBaseError: string;
      };
      accountFilterTitle: string;
      accountFilterAll: string;
      accountFilterSelected: string;
      accountFilterSelectAll: string;
      accountFilterApply: string;
      accountFilterCurrencyLabel: string;
      monitorTitle: string;
      monitorSearchPlaceholder: string;
      monitorAccounts: string;
      monitorTypesTitle: string;
      monitorTypes: Record<'income' | 'expense' | 'transfer', string>;
      monitorDateFrom: string;
      monitorDateTo: string;
      monitorResults: string;
      monitorNoDate: string;
      monitorEmpty: string;
      monitorApply: string;
      monitorReset: string;
    };
    accounts: {
      header: string;
      income: string;
      outcome: string;
      goalProgress: string;
      historyTitle: string;
      historyHeaders: { type: string; amount: string; time: string };
      actions: { edit: string; archive: string; delete: string };
    };
    transactions: {
      header: string;
      details: {
        title: string;
        type: string;
        amount: string;
        account: string;
        category: string;
        date: string;
        note: string;
        relatedDebt: string;
        close: string;
      };
      filterSheet: {
        title: string;
        dateRange: string;
        category: string;
        accounts: string;
        type: string;
        amount: string;
        from: string;
        to: string;
        selectDate: string;
        reset: string;
        apply: string;
        all: string;
        typeOptions: Record<'income' | 'expense' | 'transfer' | 'debt', string>;
      };
    };
    budgets: {
      today: string;
      dateTemplate: string;
      mainTitle: string;
      categoriesTitle: string;
      addCategory: string;
      setLimit: string;
      states: { exceeding: string; fixed: string; within: string };
      detail: {
        title: string;
        status: string;
        linkedGoal: string;
        goalUnlinked: string;
        accountLabel: string;
        currencyLabel: string;
        limitLabel: string;
        spentLabel: string;
        remainingLabel: string;
        balanceLabel: string;
        createdAt: string;
        updatedAt: string;
        categoriesLabel: string;
        notifyLabel: string;
        valueAddTitle: string;
        valueAddAccountCurrency: string;
        valueAddBudgetCurrency: string;
        valueAddDisplayCurrency: string;
        actions: {
          title: string;
          edit: string;
          delete: string;
          viewGoal: string;
          viewTransactions: string;
          confirmDeleteTitle: string;
          confirmDeleteMessage: string;
          confirmDeleteConfirm: string;
          confirmDeleteCancel: string;
        };
      };
      form: {
        periodLabel: string;
        periodOptions: Record<'weekly' | 'monthly' | 'custom_range', string>;
        selectedRangeLabel: string;
        customRange: { start: string; end: string; helper: string; error: string };
      };
    };
    analytics: {
      header: string;
      expenseDynamics: string;
      comparison: string;
      topExpenses: string;
      aiInsights: string;
      stats: { peak: string; average: string; trend: string };
      comparisonRows: { income: string; outcome: string; savings: string };
    };
    debts: {
      sections: { incoming: string; outgoing: string };
      timeline: {
        incoming: string;
        outgoing: string;
        today: string;
        inDays: string;
        overdue: string;
      };
      actions: {
        incoming: { notify: string; cancel: string };
        outgoing: { plan: string; partial: string };
      };
      summary: {
        balanceLabel: string;
        givenLabel: string;
        takenLabel: string;
        givenChange: string;
        takenChange: string;
      };
      modal: {
        title: string;
        editTitle: string;
        subtitle: string;
        person: string;
        personPlaceholder: string;
        amount: string;
        accountLabel: string;
        accountHelper: string;
        accountPickerTitle: string;
        currencyLabel: string;
        currencyHelper: string;
        currencyPickerTitle: string;
        dateLabel: string;
        changeDate: string;
        clear: string;
        selectAccount: string;
        expectedReturn: string;
        expectedPlaceholder: string;
        selectDate: string;
        note: string;
        notePlaceholder: string;
        personDirectional: {
          incoming: { label: string; placeholder: string };
          outgoing: { label: string; placeholder: string };
        };
        toggles: { incoming: string; outgoing: string };
        manageActions: string;
        accountDirectional: {
          incoming: { label: string; helper: string };
          outgoing: { label: string; helper: string };
        };
        currencyFlow: { incoming: string; outgoing: string };
        counterpartyPickerTitle: string;
        counterpartySearchPlaceholder: string;
        counterpartyAddAction: string;
        counterpartyEmpty: string;
        counterpartyActions: {
          renameTitle: string;
          renamePlaceholder: string;
          renameSave: string;
          renameCancel: string;
          deleteTitle: string;
          deleteDescription: string;
          deleteConfirm: string;
          deleteBlocked: string;
          duplicateName: string;
        };
        buttons: {
          cancel: string;
          save: string;
          saveChanges: string;
          delete: string;
        };
        defaults: { name: string; description: string; due: string };
        deleteTitle: string;
        deleteDescription: string;
        status: { lent: string; borrowed: string };
        scheduleTitle: string;
        reminderTitle: string;
        reminderToggle: string;
        reminderTimeLabel: string;
        reminderEnabledLabel: string;
        reminderDisabledLabel: string;
        payment: {
          title: string;
          amount: string;
          accountLabel: string;
          currencyLabel: string;
          note: string;
          helper: string;
          submit: string;
          limitError: string;
        };
        actionsBar: {
          pay: string;
          partial: string;
          notify: string;
          schedule: string;
        };
        manualRate: {
          title: string;
          description: string;
          toggle: string;
          amountLabel: string;
        };
        fullPaymentTitle: string;
        fullPaymentDescription: string;
        fullPaymentSubmit: string;
      };
    };
  };
};

const t = {
  en: {
    common: {
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      add: 'Add',
      delete: 'Delete',
      apply: 'Apply',
      reset: 'Reset',
      done: 'Done',
      select: 'Select',
    },
    auth: {
      common: {
        socialDivider: 'Or continue with',
        languageButtonLabel: 'Language',
        languageHelper: 'Choose the language for this screen.',
        languageSheetTitle: 'Choose language',
      },
      validation: {
        emailOrUsernameRequired: 'Enter your email or username',
        emailRequired: 'Email is required',
        emailInvalid: 'Enter a valid email address',
        nameRequired: 'Full name is required',
        passwordRequired: 'Password is required',
        passwordConfirmRequired: 'Confirm your password',
        passwordMismatch: 'Passwords do not match',
        passwordMinLength: 'Use at least 8 characters',
        passwordUppercase: 'Add an uppercase letter',
        passwordLowercase: 'Add a lowercase letter',
        passwordNumber: 'Add a number',
        passwordSpecial: 'Add a special character',
      },
      forgot: {
        languageSelector: {
          label: 'Language',
          helper: 'Choose the language for password recovery.',
        },
        emailStep: {
          title: 'Forgot your password',
          description: 'Enter your email address to reset it.',
          fieldLabel: 'Email',
          placeholder: 'name@example.com',
          button: {
            submit: 'Send code',
            loading: 'Sending…',
          },
        },
        otpStep: {
          title: 'Enter the verification code',
          description: 'We sent a verification code to {email}',
          timerHint: 'Send a new code in {time}',
          resend: 'Resend code',
          back: 'Back to email step',
          button: {
            submit: 'Verify code',
            loading: 'Verifying…',
          },
        },
        alerts: {
          codeSentTitle: 'Code sent',
          codeSentMessage: 'Check your inbox for a 4-digit code. (In the demo it also appears in the console.)',
          codeResentTitle: 'Code resent',
          codeResentMessage: 'We sent a new verification code to your email.',
          otpVerifiedTitle: 'OTP verified',
          otpVerifiedMessage: 'Success! You can now sign in again.',
          genericErrorTitle: 'Error',
          genericErrorMessage: 'Something went wrong. Please try again.',
          okButton: 'OK',
        },
        footer: {
          remember: 'Remember your password?',
          signIn: 'Sign In',
        },
        errors: {
          invalidEmail: 'Enter a valid email address',
          generic: 'Something went wrong. Please try again.',
          otpExpired: 'The verification code has expired. Request a new one.',
          otpInvalid: 'The verification code is invalid.',
          otpIncomplete: 'Please enter the complete verification code.',
        },
      },
      login: {
        title: 'Log In',
        description: 'Welcome back! Enter your details to continue.',
        fields: {
          emailOrUsername: 'Email or Username',
          password: 'Password',
        },
        placeholders: {
          emailOrUsername: 'name@example.com',
          password: 'Enter your password',
        },
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        buttons: {
          submit: 'Log In',
        },
        links: {
          noAccount: "Don't have an account?",
          signUp: 'Sign Up',
        },
        alerts: {
          failureTitle: 'Login failed',
          failureMessage: 'Check your credentials and try again.',
          socialTitle: 'Coming Soon',
          socialMessage: '{provider} login will be available soon!',
        },
        errors: {
          missingCredentials: 'Please enter both email/username and password',
          invalidCredentials: 'Invalid email/username or password',
          generic: 'Something went wrong. Please try again.',
        },
      },
      register: {
        title: 'Register',
        description: 'Create an account to continue!',
        fields: {
          email: 'Email',
          fullName: 'Full Name',
          password: 'Password',
          confirmPassword: 'Confirm Password',
        },
        placeholders: {
          email: 'name@example.com',
          fullName: 'Enter your full name',
          password: 'Create a password',
          confirmPassword: 'Re-enter your password',
        },
        buttons: {
          submit: 'Sign Up',
          socialComingSoon: 'Coming soon',
        },
        links: {
          haveAccount: 'Already have an account?',
          signIn: 'Sign In',
        },
        languageSelector: {
          label: 'Language',
          helper: 'Choose the language for this registration.',
        },
        selectors: {
          sectionTitle: 'Region & currency',
          helper: 'Main currency will be set to {currency}',
          regionLabel: 'Region',
          currencyLabel: 'Currency',
          currencyHint: 'Tap to change',
        },
        sheets: {
          regionTitle: 'Choose region',
          currencyTitle: 'Choose currency',
          currencySearch: 'Search currency',
          languageTitle: 'Choose language',
        },
        alerts: {
          successTitle: 'Registration Successful',
          successMessage: 'Welcome! Your account has been created.',
          failureTitle: 'Registration Failed',
          socialTitle: 'Coming Soon',
          socialMessage: '{provider} registration will be available soon!',
        },
        passwordGuide: {
          strengthLabel: 'Password strength',
          helper: 'Use a mix of letters, numbers, and symbols.',
          levels: {
            empty: 'Start typing',
            weak: 'Weak',
            medium: 'Medium',
            strong: 'Strong',
          },
          requirementsTitle: 'Password requirements',
          requirements: {
            length: 'At least {count} characters',
            uppercase: 'One uppercase letter',
            lowercase: 'One lowercase letter',
            number: 'One number',
            special: 'One special character',
          },
        },
        errors: {
          missingFields: 'Fill in all required fields',
          selectRegion: 'Select your region',
          passwordMismatch: 'Passwords do not match',
          emailInvalid: 'Enter a valid email address',
          emailExists: 'An account with this email already exists',
          generic: 'Unable to register right now. Please try again.',
        },
      },
    },
    addTask: enAddTask as AppTranslations['addTask'],
    universalFab: enUniversalFab as AppTranslations['universalFab'],
    home: {
      header: {
        todayLabel: 'TODAY',
        openProfile: 'Open profile',
        previousDay: 'Previous day',
        nextDay: 'Next day',
      },
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
        night: 'Good night',
        defaultName: 'friend',
      },
      status: {
        online: 'Online',
        offline: 'Offline',
        connecting: 'Checking…',
      },
      widgets: {
        title: 'Widgets',
        edit: 'Edit',
        emptyTitle: 'No widgets available',
        emptySubtitle: 'Tap Edit to add widgets to your dashboard.',
      },
      progress: {
        tasks: 'Tasks',
        budget: 'Budget',
        habit: 'Habit',
        progressSuffix: 'progress',
      },
    },
    tabs: {
      home: 'Home',
      finance: 'Finance',
      planner: 'Planner',
      insights: 'Insight',
      more: 'More',
    },
    calendar: {
      todayLabel: 'today',
      selectDateTitle: 'Select Date',
    },
    plannerScreens: {
      tabs: {
        tasks: 'Tasks',
        goals: 'Goals',
        habits: 'Habits',
      },
      tasks: {
        headerTemplate: 'Plans for {date}',
        todayLabel: 'today',
        filter: 'Filter',
        sectionCountLabel: 'tasks',
        sectionTip:
          'Hold briefly, swipe right to toggle done, swipe left to delete (even completed tasks).',
        sections: {
          morning: { title: 'Morning', time: '(06:00 - 12:00)' },
          afternoon: { title: 'Afternoon', time: '(12:00 - 18:00)' },
          evening: { title: 'Evening', time: '(18:00 - 22:00)' },
        },
        actions: {
          complete: 'COMPLETE',
          restore: 'RESTORE',
          remove: 'REMOVE',
          delete: 'DELETE TASK',
        },
        history: {
          title: 'Tasks History',
          subtitle: 'Swipe to restore or remove',
          tip: 'Hold briefly, swipe right to restore a task or swipe left to remove it permanently.',
          deletedBadge: 'Moved',
        },
        defaults: {
          startToday: 'Today',
          startTomorrow: 'Tomorrow',
          startPick: 'Pick',
          newTaskTitle: 'New task',
          defaultContext: '@work',
        },
        aiPrefix: 'AI:',
        dailySummary: 'Today: {tasks} tasks • {habits} habits • {goals} goal steps',
        statuses: {
          active: 'Active',
          in_progress: 'In focus',
          completed: 'Completed',
          archived: 'Archived',
        },
        focus: {
          cta: 'Focus',
          inProgress: 'In focus',
          cardLabel: 'Currently focusing on',
          goalTag: 'Goal: {goal}',
          finishTitle: 'Wrap up "{task}"?',
          finishMessage: 'Mark it done or move the remaining effort to tomorrow.',
          done: 'Mark done',
          move: 'Move to tomorrow',
          keep: 'Keep for later',
        },
        calendar: {
          title: 'Planner calendar',
          summary: '{tasks} tasks • {habits} habits • {goals} goal steps',
          addQuickTask: 'Quick task',
          quickTaskTitle: 'Quick task',
          scheduledTitle: 'Scheduled for this day',
          empty: 'Nothing scheduled yet.',
          moveTitle: 'Move tasks here',
          moveHere: 'Move here',
          moveTomorrow: 'Move to tomorrow',
          unscheduled: 'Unscheduled',
          noOtherTasks: 'All tasks already here.',
        },
        aiSuggestions: {
          title: 'AI recommendation',
          time: 'Best slot: {value}',
          duration: 'Duration: {value}',
          context: 'Context: {value}',
          energy: 'Energy: {value}',
          apply: 'Apply suggestion',
        },
      },
      goals: {
        header: {
          title: 'Strategic goals',
          subtitle: 'Forward momentum for financial and personal wins',
        },
        empty: {
          title: 'Create your first goal',
          subtitle:
            'Track milestones, projections, and AI-backed insights once you add your first objective. Use the universal add button to get started.',
        },
        sections: {
          financial: {
            title: 'Financial goals',
            subtitle: 'Investment focus and savings priorities',
          },
          personal: {
            title: 'Personal goals',
            subtitle: 'Lifestyle upgrades and wellness wins',
          },
        },
        cards: {
          summaryLabels: {
            left: 'Left',
            pace: 'Pace',
            prediction: 'Prediction',
          },
          actions: {
            addValue: 'Add value',
            refresh: 'Refresh',
            edit: 'Edit',
            addValueA11y: 'Add value',
            refreshA11y: 'Refresh goal',
            editA11y: 'Edit goal',
            openDetailsA11y: 'Open goal details',
          },
        },
        details: {
          milestones: 'Milestones',
          history: 'History',
          showMore: 'Show more',
        },
        nextStep: {
          title: 'Next step',
          empty: 'No active tasks',
          cta: 'Add step',
        },
        linkedSummary: '{tasks} tasks • {habits} habits',
        ai: {
          title: 'AI plan',
          milestones: 'Suggested milestones: kickoff → prototype → beta → launch.',
          duration: 'Estimated completion: 3–6 months with weekly reviews.',
          apply: 'Use this plan',
        },
        data: {
          'dream-car': {
            title: 'Dream car',
            currentAmount: '4.1M UZS',
            targetAmount: '5M UZS',
            summary: {
              left: '900 000 UZS remaining',
              pace: '450 000 UZS / Mon.',
              prediction: 'On track · March 2025',
            },
            milestones: ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'],
            history: [
              { label: 'Dec', delta: '+450 000 UZS' },
              { label: 'Nov', delta: '+320 000 UZS' },
              { label: 'Oct', delta: '+280 000 UZS' },
            ],
            aiTip: 'At the current pace, you will reach your goal in March.',
            aiTipHighlight: 'Increase monthly contributions by 100k to hit February.',
          },
          'emergency-fund': {
            title: 'Emergency fund',
            currentAmount: '3.5M UZS',
            targetAmount: '6M UZS',
            summary: {
              left: '2.5M UZS remaining',
              pace: '300 000 UZS / Mon.',
              prediction: 'Forecast · June 2025',
            },
            milestones: ['Nov 2024', 'Jan 2025', 'Mar 2025', 'Jun 2025'],
            history: [
              { label: 'Dec', delta: '+300 000 UZS' },
              { label: 'Nov', delta: '+300 000 UZS' },
              { label: 'Oct', delta: '+250 000 UZS' },
            ],
            aiTip: 'Adjusting contributions to 350k keeps you inside your comfort buffer.',
          },
          fitness: {
            title: 'Peak fitness plan',
            currentAmount: '92 / 210 sessions',
            targetAmount: '210 sessions',
            summary: {
              left: '118 sessions remaining',
              pace: '4 sessions / Week',
              prediction: 'On track · August 2025',
            },
            milestones: ['Nov 2024', 'Jan 2025', 'Apr 2025', 'Aug 2025'],
            history: [
              { label: 'Week 48', delta: '+4 sessions' },
              { label: 'Week 47', delta: '+5 sessions' },
              { label: 'Week 46', delta: '+3 sessions' },
            ],
            aiTip: 'Consistency is improving. Add one extra cardio day to accelerate results.',
          },
          language: {
            title: 'Spanish language immersion',
            currentAmount: '34 / 50 lessons',
            targetAmount: '50 lessons',
            summary: {
              left: '16 lessons remaining',
              pace: '3 lessons / Week',
              prediction: 'Arriving · February 2025',
            },
            milestones: ['Oct 2024', 'Dec 2024', 'Jan 2025', 'Mar 2025'],
            history: [
              { label: 'Week 48', delta: '+3 lessons' },
              { label: 'Week 47', delta: '+4 lessons' },
              { label: 'Week 46', delta: '+3 lessons' },
            ],
            aiTip: 'Pair each lesson with a 15 min conversational recap to reach fluency sooner.',
          },
        },
      },
      habits: {
      headerTitle: 'Habits',
      badgeSuffix: 'days',
      calendarTitle: 'Monthly check-ins — {month}',
      calendarLegend: { done: 'Done', miss: 'Missed', none: 'No data' },
      calendarLegendHint: {
        done: '{count} days completed ({percent}%)',
        miss: '{count} misses ({percent}%)',
        none: '{count} days still open ({percent}%)',
      },
      challenge: {
        title: 'Challenge length',
        subtitle: 'Choose a classic 20/40/90-day streak target.',
        options: { short: '20 days', medium: '40 days', long: '90 days' },
        pinMessage: 'Complete {days} days straight to pin this habit.',
      },
      calendarButton: 'Open calendar view',
      stats: {
        streak: 'Streak: {days} days straight',
          record: 'Record: {days} days',
          completion: 'Completion: {percent}% ({completed}/{target} weekly)',
        },
        supportsGoals: 'Supports: {goals}',
        ai: {
          title: 'AI tips',
          time: 'Best adherence between 06:30–07:00.',
          stack: 'Stack with hydration reminders for more consistency.',
          apply: 'Apply suggestion',
        },
        ctas: {
          checkIn: 'Check in today',
          startTimer: 'Start timer',
          completed: 'Completed',
          failed: 'Failed',
          edit: 'Edit',
          delete: 'Delete',
        },
        expand: {
          titles: {
            statistics: 'Statistics',
            pattern: 'Pattern',
            achievements: 'Achievements',
          },
          lines: {
            overallCompletion: 'Overall completion: 156',
            successPercentile: 'Success percentile: 78%',
            averageStreak: 'Average streak: 8 days',
            bestMonth: 'Best month: November (93%)',
            bestTime: 'Best time: 7:00–7:30 (85% success rate)',
            worstTime: 'Worst time: Weekends (45%)',
            afterWeekends: 'After weekends: −30% probability',
          },
        badges: {
          firstWeek: 'First week',
          monthNoBreak: 'Month without break',
          hundredCompletions: '100 completions',
          marathoner: 'Marathoner (42 days straight)',
        },
      },
      empty: {
        title: 'No habits yet',
        subtitle: 'Add a habit from the planner to start tracking streaks and progress.',
      },
      data: {
        h1: {
          title: 'Morning workout',
          aiNote: 'Try it in the morning, right after your workout',
        },
          h2: {
            title: 'Meditation',
            aiNote: 'AI: “Try it in the morning, right after your workout”',
          },
          h3: {
            title: 'Reading 30 min',
          },
          h4: {
            title: 'Drink 2l water',
            aiNote: 'New achievement!',
            chips: ['+ 250ml', '+ 500ml', '+ 1l'],
          },
          h5: {
            title: 'Without social networks',
          },
        },
      },
    },
    plannerModals: {
      goal: enGoalModal as AppTranslations['plannerModals']['goal'],
    },
    widgets: {
      budgetProgress: {
        title: 'Budget Progress',
        defaults: { housing: 'Housing', groceries: 'Groceries', entertainment: 'Entertainment' },
        placeholders: {
          empty: 'No budgets configured',
          add: 'Add a budget to track',
        },
      },
      cashFlow: {
        title: 'Cash Flow',
        summary: { income: 'Income', expenses: 'Expenses', net: 'Net' },
        days: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' },
      },
      dailyTasks: {
        title: 'Daily tasks',
        placeholders: ['No tasks scheduled', 'Enjoy a break', 'Add a new task'],
      },
      focusSessions: {
        title: 'Focus Sessions',
        stats: { completed: 'Completed', totalTime: 'Total Time', nextSession: 'Next Session' },
        placeholders: { none: 'No sessions logged', free: 'Calendar is free' },
      },
      goals: {
        title: 'Goals',
        placeholderText: 'Add a goal to start tracking progress.',
        placeholders: ['No goals tracked yet', 'Tap to add a new goal'],
      },
      habits: {
        title: 'Habits',
        placeholders: ['No habits tracked today', 'Log a habit to get started'],
        streakLabel: 'day streak',
        noStreak: 'No streak yet',
      },
      productivityInsights: {
        title: 'Productivity Insights',
        metrics: {
          focusScore: 'Focus score',
          tasksCompleted: 'Tasks completed',
          deepWork: 'Deep work hrs',
        },
        trendTitle: 'Focus trend',
        vsLastWeek: 'vs last week',
        noTrend: 'No trend yet',
        days: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' },
      },
      spendingSummary: {
        title: 'Spending Summary',
        categories: {
          food: 'Food & Dining',
          transport: 'Transport',
          shopping: 'Shopping',
        },
        placeholders: ['No spending tracked', 'Log a purchase to begin'],
        total: 'Total spent',
      },
      transactions: {
        title: 'Transactions',
        placeholders: ['No activity logged', 'Start tracking transactions'],
      },
      weeklyReview: {
        title: 'Weekly Review',
        stats: {
          completion: 'Completion',
          focusTime: 'Focus Time',
          currentStreak: 'Current streak',
        },
        summary: {
          success: 'Great week! You completed {completed} of {total} tasks.',
          empty: 'Complete sessions to unlock weekly insights.',
        },
        streakUnit: 'days',
      },
      wellnessOverview: {
        title: 'Wellness Overview',
        metrics: { energy: 'Energy', mood: 'Mood', sleep: 'Sleep quality' },
        messages: {
          balanced: 'Balanced week — keep up the routines',
          logPrompt: 'Log your wellness check-ins to unlock insights',
        },
      },
    },
    language: {
      sectionTitle: 'Language',
      helperTitle: 'Note',
      helperDescription:
        'Language changes will apply across insights, coach messages, and future updates. Some experimental features may stay in English until localisation is complete.',
    },
    more: {
      header: {
        title: 'More',
        profileAction: 'Open profile',
        notificationsAction: 'Notifications',
        badgeLabel: 'Premium',
        dateLabel: '15 March',
      },
      premiumBadge: 'Premium until',
      sections: {
        account: 'Account',
        settings: 'Settings',
        data: 'Data',
        integration: 'Integration',
        help: 'Help',
      },
      accountItems: {
        profile: 'Profile',
        premium: 'Premium status',
        achievements: 'Achievements',
        statistics: 'Statistics',
      },
      settingsItems: {
        appearance: 'Appearance',
        notifications: 'Notifications',
        aiAssistant: 'AI Assistant',
        security: 'Security',
        language: 'Language and Region',
      },
      dataItems: {
        synchronization: 'Synchronization',
        backup: 'Backup / Restore',
        export: 'Export data',
        cache: 'Clear cache',
      },
      integrationItems: {
        calendars: 'Calendars',
        banks: 'Banks',
        apps: 'Apps',
        devices: 'Devices',
      },
      helpItems: {
        manual: 'Manual',
        faq: 'FAQ',
        support: 'Support',
        about: 'About LEORA',
      },
      values: {
        enabled: 'Enabled',
        disabled: 'Disabled',
        on: 'On',
        off: 'Off',
        themeLight: 'Light',
        themeDark: 'Dark',
        aiAlpha: 'Alpha',
        languageLabel: 'English',
        level: 'Level',
      },
      logout: 'Log out',
    confirmLogout: {
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      cancel: 'Cancel',
      confirm: 'Log out',
    },
  },
    profile: {
      title: 'Profile',
      sections: {
        personal: 'Personal info',
        stats: 'Usage stats',
        preferences: 'Public profile',
        finance: 'Finance preferences',
        actions: 'Account actions',
      },
      fields: {
        fullName: 'Full name',
        email: 'Email',
        phone: 'Phone',
        username: 'Username',
        joined: 'Joined',
        bio: 'About you',
        visibility: 'Profile visibility',
        visibilityOptions: { public: 'Public', friends: 'Friends only', private: 'Private' },
        showLevel: 'Show level badge',
        showAchievements: 'Show achievements',
        showStatistics: 'Show statistics',
      },
      finance: {
        regionLabel: 'Primary region',
        currencyLabel: 'Display currency',
        regionSheetTitle: 'Choose your region',
        currencySheetTitle: 'Choose currency',
        currencySearchPlaceholder: 'Search currency',
        fxTitle: 'Exchange rates',
        fxDescription: 'Sync provider data or override a specific currency.',
        fxProviderLabel: 'FX provider',
        fxProviders: {
          central_bank_stub: 'Central bank',
          market_stub: 'Market',
        },
        fxSyncButton: 'Sync rates',
        fxSyncing: 'Syncing...',
        fxSyncSuccess: 'Rates synced via {provider}',
        fxSyncError: 'Unable to sync rates. Try again.',
        fxLastSync: 'Last sync: {value}',
        fxManualTitle: 'Manual override',
        fxManualHint: 'Override rate vs {base}',
        fxManualCurrencyLabel: 'Currency',
        fxOverridePlaceholder: 'Enter rate',
        fxOverrideButton: 'Apply override',
        fxOverrideSuccess: 'Override saved for {currency}',
        fxOverrideError: 'Enter a valid rate',
        fxOverrideBaseError: 'Choose a currency different from base',
        fxOverrideSheetTitle: 'Choose currency to override',
      },
      stats: {
        daysWithApp: 'Days with LEORA',
        completedTasks: 'Tasks completed',
        activeTasks: 'Active tasks',
        level: 'Current level',
      },
      xp: {
        label: 'XP progress',
        toNext: '{value} XP to next level',
      },
      buttons: {
        edit: 'Edit profile',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete account',
        logout: 'Log out',
        changePhoto: 'Change photo',
        removePhoto: 'Remove photo',
        confirmDeleteTitle: 'Delete account',
        confirmDeleteMessage: 'This action removes your account and all stored data. Continue?',
        confirmDeleteConfirm: 'Delete',
        confirmDeleteCancel: 'Cancel',
      },
    },
    financeScreens: {
      tabs: {
        review: 'Review',
        accounts: 'Accounts',
        transactions: 'Transactions',
        budgets: 'Budgets',
        analytics: 'Analytics',
        debts: 'Debts',
      },
      goalActions: {
        connectFinance: 'Connect finance',
        createBudget: 'Create budget for this goal',
        addContribution: 'Add contribution',
      },
      review: {
        totalBalance: 'Total balance',
        income: 'Income',
        outcome: 'Outcome',
        monthBalance: 'Balance at the end of the month',
        used: 'Used',
        progress: 'Progress',
        expenseStructure: 'Expense structure',
        recentTransactions: 'Recent transactions',
        seeAll: 'See all',
        importantEvents: 'Important events',
        table: { type: 'Type', amount: 'Amount', date: 'Date' },
        fxQuick: {
          title: 'Currency controls',
          providerLabel: 'Provider',
          providers: {
            central_bank_stub: 'Central bank',
            market_stub: 'Market',
          },
          syncButton: 'Sync rates',
          syncDescription: 'Fetch latest provider rates',
          syncing: 'Syncing...',
          syncSuccess: 'Rates synced via {provider}',
          syncError: 'Unable to sync rates. Try again.',
          lastSync: 'Last sync: {value}',
          overrideButton: 'Manual override',
          overrideHint: 'Rate vs {base}',
          overrideTitle: 'Manual override',
          overridePlaceholder: 'Enter rate',
          overrideConfirm: 'Apply',
          overrideCancel: 'Cancel',
        overrideSuccess: 'Override saved for {currency}',
        overrideError: 'Enter a valid rate',
        overrideBaseError: 'Choose a currency different from base',
      },
      accountFilterTitle: 'Choose accounts',
      accountFilterAll: 'All accounts',
      accountFilterSelected: '{count} selected',
      accountFilterSelectAll: 'Select all',
      accountFilterApply: 'Apply',
      accountFilterCurrencyLabel: 'Display currency',
      monitorTitle: 'Balance monitoring',
      monitorSearchPlaceholder: 'Search transactions',
      monitorAccounts: 'Accounts',
      monitorTypesTitle: 'Transaction types',
      monitorTypes: {
        income: 'Income',
        expense: 'Expense',
        transfer: 'Transfer',
      },
      monitorDateFrom: 'From',
      monitorDateTo: 'To',
      monitorResults: 'Transactions',
      monitorNoDate: 'Not selected',
      monitorEmpty: 'No transactions match the filters',
      monitorApply: 'Done',
      monitorReset: 'Reset filters',
    },
      accounts: {
        header: 'My accounts',
        income: 'Income',
      outcome: 'Outcome',
      goalProgress: '{value}% of the goal',
      historyTitle: 'Transaction history',
      historyHeaders: { type: 'Type', amount: 'Amount', time: 'Time' },
      actions: { edit: 'Edit', archive: 'Archive', delete: 'Delete' },
      modal: {
        titleAdd: 'Add new account',
        titleEdit: 'Edit account',
        nameLabel: 'Name',
        namePlaceholder: 'Account name',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Description',
        typeLabel: 'Type',
        addType: 'Add type',
        newTypePlaceholder: 'New type name',
        saveType: 'Save type',
        currencyLabel: 'Currency',
        amountLabel: 'Amount',
        amountPlaceholder: 'Amount ({currency})',
        primaryActionAdd: 'Add',
        primaryActionSave: 'Save',
        typeOptions: {
          cash: 'Cash',
          card: 'Card',
          savings: 'Savings',
          usd: 'USD',
          crypto: 'Crypto',
          other: 'Other',
          custom: 'Custom',
        },
        iconOptions: {
          wallet: 'Wallet',
          creditCard: 'Card',
          piggyBank: 'Savings',
          bank: 'Bank',
          briefcase: 'Business',
          coins: 'Coins',
          sparkles: 'Other',
          bitcoin: 'Crypto',
          shield: 'Secure',
          trendingUp: 'Growth',
        },
        currencyLabels: {
          UZS: 'Uzbekistani Som',
          USD: 'US Dollar',
          EUR: 'Euro',
          GBP: 'British Pound',
          TRY: 'Turkish Lira',
          SAR: 'Saudi Riyal',
          AED: 'UAE Dirham',
          USDT: 'Tether (USDT)',
          RUB: 'Russian Ruble',
        },
      },
    },
      transactions: {
        header: 'Transactions history',
        details: {
          title: 'Transaction details',
          type: 'Operation type',
          amount: 'Amount',
          account: 'Account',
          category: 'Category',
          date: 'Date',
          note: 'Note',
          relatedDebt: 'Linked debt',
          close: 'Close',
        },
        filterSheet: {
          title: 'Filter transactions',
          dateRange: 'Date range',
          category: 'Category',
          accounts: 'Accounts',
          type: 'Type',
          amount: 'Amount range',
          from: 'From',
          to: 'To',
          close: 'Close',
          clearHint: 'Hold to clear',
          selectDate: 'Select date',
          reset: 'Reset',
          apply: 'Apply',
          all: 'All',
          typeOptions: {
            income: 'Income',
            expense: 'Expense',
            transfer: 'Transfer',
            debt: 'Debt',
          },
        },
        quick: {
          incomeHeader: '+ Income',
          outcomeHeader: '- Outcome',
          amountPlaceholder: 'Input amount',
          debtOwedToYouLabel: 'Who owes you?',
          debtOwedToYouPlaceholder: 'Person name who owes you',
          debtYouOweLabel: 'Who do you owe?',
          debtYouOwePlaceholder: 'Person name you owe',
          categoryAddTitle: 'Add category',
          categoryEditTitle: 'Edit category',
          categoryPlaceholder: 'Category name',
          save: 'Save entry',
          update: 'Save changes',
        },
        transferForm: {
          title: 'Transfer between accounts',
          submit: 'Transfer',
          amountPlaceholder: 'Amount',
          fromAccount: 'From account',
          toAccount: 'To account',
          exchangeRate: 'Exchange rate',
          auto: 'Auto',
          conversionInfo: '{amount} will be received',
          resetRate: 'Reset to auto rate',
          date: 'Date',
          time: 'Time',
          notePlaceholder: 'Add optional description or context…',
          pickerDone: 'Done',
          selectAccount: 'Select account',
          rateInfoTemplate:
            'Exchange rate: 1 {toCurrency} = {rate} {fromCurrency}. Received: {amount}',
        },
      },
      budgets: {
        today: "Today's budget overview",
        dateTemplate: 'Budget overview for {date}',
      mainTitle: 'Main budget',
      categoriesTitle: 'Categories',
      addCategory: 'Add category',
      setLimit: 'Set a limit',
      states: { exceeding: 'Exceeding', fixed: 'Fixed', within: 'Within' },
      detail: {
        title: 'Budget details',
        status: 'Status',
        linkedGoal: 'Linked goal',
        goalUnlinked: 'Not linked to a goal',
        accountLabel: 'Account',
        currencyLabel: 'Budget currency',
        limitLabel: 'Limit',
        spentLabel: 'Spent',
        remainingLabel: 'Remaining',
        balanceLabel: 'Current balance',
        createdAt: 'Created',
        updatedAt: 'Updated',
        categoriesLabel: 'Categories',
        notifyLabel: 'Notify on exceed',
        valueAddTitle: 'Value add',
        valueAddAccountCurrency: 'Account currency',
        valueAddBudgetCurrency: 'Budget currency',
        valueAddDisplayCurrency: 'Display currency',
        actions: {
          title: 'More actions',
          edit: 'Edit budget',
          delete: 'Delete budget',
          viewGoal: 'View linked goal',
          viewTransactions: 'View transactions',
          addToBudget: 'Add to budget',
          confirmDeleteTitle: 'Delete budget?',
          confirmDeleteMessage: 'This will archive the budget and unlink related goals.',
          confirmDeleteConfirm: 'Delete',
          confirmDeleteCancel: 'Cancel',
        },
      },
      form: {
        nameLabel: 'Budget name',
        namePlaceholder: 'Budget name',
        limitPlaceholder: '0',
        periodLabel: 'Budget period',
        periodOptions: { weekly: 'Weekly', monthly: 'Monthly', custom_range: 'Custom range' },
        selectedRangeLabel: 'Selected range: {range}',
        customRange: {
          start: 'Start date',
          end: 'End date',
          helper: 'Select a custom range',
          error: 'Select both start and end dates',
        },
      },
    },
      analytics: {
        header: 'Financial analytics',
        expenseDynamics: 'Expense dynamics',
        comparison: 'Comparison with the previous month',
        topExpenses: 'Top expenses by categories',
        aiInsights: 'AI insights',
        stats: { peak: 'Peak', average: 'Average', trend: 'Trend' },
        comparisonRows: { income: 'Income:', outcome: 'Outcome:', savings: 'Savings:' },
      },
      debts: {
        sections: { incoming: 'Debts', outgoing: 'My debts' },
        timeline: {
          incoming: 'Gives back in',
          outgoing: 'Period',
          today: 'Due today',
          inDays: 'Due in {count} days',
          overdue: '{count} days overdue',
        },
        actions: {
          incoming: { notify: 'Notify', cancel: 'Cancel debt' },
          outgoing: { plan: 'Plan', partial: 'Pay partly' },
        },
        summary: {
          balanceLabel: 'Total balance',
          givenLabel: 'Total given',
          takenLabel: 'Total debt',
          givenChange: '+15% December',
          takenChange: '-8% December',
        },
        modal: {
          title: 'Add new debt',
          editTitle: 'Edit debt',
        subtitle: 'Track money you lend or borrow',
        typeLabel: 'Type',
        borrowedLabel: 'I owe',
        lentLabel: 'They owe me',
        person: 'Name / Person',
        personPlaceholder: 'Who is this debt for?',
        amount: 'Amount',
        accountLabel: 'Wallet',
        accountHelper: 'Select the wallet involved in this debt',
          accountPickerTitle: 'Select wallet',
          currencyLabel: 'Currency',
          currencyHelper: 'Choose the currency for this debt',
          currencyPickerTitle: 'Select currency',
          dateLabel: 'Date',
          changeDate: 'Change date',
          clear: 'Clear',
          selectAccount: 'Select wallet',
          expectedReturn: 'Expected return date',
          expectedPlaceholder: 'No return date set',
        selectDate: 'Select date',
        note: 'Note',
        notePlaceholder: 'Add optional description or context…',
        personDirectional: {
          incoming: { label: 'Who lent you money?', placeholder: 'Enter the lender name' },
          outgoing: { label: 'Who are you lending to?', placeholder: 'Enter the recipient name' },
        },
        toggles: { incoming: 'They owe me', outgoing: 'I owe' },
        manageActions: 'Manage debt',
        accountDirectional: {
          incoming: {
            label: 'Deposit to wallet',
            helper: 'Money will be credited to the selected wallet ({accountCurrency}).',
          },
          outgoing: {
            label: 'Withdraw from wallet',
            helper: 'Money will be taken from the selected wallet ({accountCurrency}).',
          },
        },
        currencyFlow: {
          incoming: 'Receiving {debtCurrency} → crediting {accountCurrency}',
          outgoing: 'Sending {debtCurrency} → debiting {accountCurrency}',
        },
        counterpartyPickerTitle: 'Select person',
        counterpartySearchPlaceholder: 'Search name',
        counterpartyAddAction: 'Add "{query}"',
        counterpartyEmpty: 'No people yet. Start by adding one.',
        counterpartyActions: {
          renameTitle: 'Rename person',
          renamePlaceholder: 'Enter new name',
          renameSave: 'Save name',
          renameCancel: 'Cancel',
          deleteTitle: 'Remove person?',
          deleteDescription: 'This will permanently remove the selected person.',
          deleteConfirm: 'Remove',
          deleteBlocked: 'You cannot delete a person linked to debts.',
          duplicateName: 'A person with this name already exists.',
        },
        buttons: {
          cancel: 'Cancel',
          save: 'Save',
          saveChanges: 'Save',
          delete: 'Delete',
        },
        defaults: { name: 'New debt', description: 'Description', due: 'No period' },
        deleteTitle: 'Delete debt',
        deleteDescription: 'Are you sure you want to delete this debt? This action cannot be undone.',
        status: {
          lent: 'You lent money',
          borrowed: 'You borrowed money',
        },
        scheduleTitle: 'Repayment schedule',
        reminderTitle: 'Notifications',
        reminderToggle: 'Enable notification',
        reminderTimeLabel: 'Reminder time (HH:MM)',
        reminderEnabledLabel: 'Notifications on',
        reminderDisabledLabel: 'Notifications off',
        payment: {
          title: 'Record payment',
          amount: 'Payment amount',
          accountLabel: 'Pay from wallet',
          currencyLabel: 'Payment currency',
          note: 'Payment note',
          helper: 'Track partial repayments and settlements.',
          submit: 'Apply payment',
          limitError: 'Payment exceeds remaining balance',
        },
        actionsBar: {
          pay: 'Pay debt',
          partial: 'Partial payment',
          notify: 'Notification',
          schedule: 'Manage dates',
        },
        manualRate: {
          title: 'Conversion',
          description:
            'Debt currency {debtCurrency}. Wallet currency {accountCurrency}. Enter the debit amount in {accountCurrency}.',
          toggle: 'Enter manually',
          amountLabel: 'Debit amount ({currency})',
        },
        fullPaymentTitle: 'Pay debt in full',
        fullPaymentDescription: 'You will settle the entire remaining balance of {amount}.',
        fullPaymentSubmit: 'Pay in full',
      },
      },
    },
  },
  ru: {
    common: {
      close: 'Закрыть',
      cancel: 'Отмена',
      save: 'Сохранить',
      add: 'Добавить',
      delete: 'Удалить',
      apply: 'Применить',
      reset: 'Сбросить',
      done: 'Готово',
      select: 'Выбрать',
    },
    auth: {
      common: {
        socialDivider: 'Или продолжите через',
        languageButtonLabel: 'Язык',
        languageHelper: 'Выберите язык для этого экрана.',
        languageSheetTitle: 'Выберите язык',
      },
      validation: {
        emailOrUsernameRequired: 'Введите email или имя пользователя',
        emailRequired: 'Введите email',
        emailInvalid: 'Введите корректный email',
        nameRequired: 'Введите полное имя',
        passwordRequired: 'Введите пароль',
        passwordConfirmRequired: 'Подтвердите пароль',
        passwordMismatch: 'Пароли не совпадают',
        passwordMinLength: 'Минимум 8 символов',
        passwordUppercase: 'Добавьте заглавную букву',
        passwordLowercase: 'Добавьте строчную букву',
        passwordNumber: 'Добавьте цифру',
        passwordSpecial: 'Добавьте специальный символ',
      },
      login: {
        title: 'Вход',
        description: 'С возвращением! Введите данные для продолжения.',
        fields: {
          emailOrUsername: 'Email или имя пользователя',
          password: 'Пароль',
        },
        placeholders: {
          emailOrUsername: 'name@example.com',
          password: 'Введите пароль',
        },
        rememberMe: 'Запомнить меня',
        forgotPassword: 'Забыли пароль?',
        buttons: {
          submit: 'Войти',
        },
        links: {
          noAccount: 'Нет аккаунта?',
          signUp: 'Регистрация',
        },
        alerts: {
          failureTitle: 'Не удалось войти',
          failureMessage: 'Проверьте данные и попробуйте снова.',
          socialTitle: 'Скоро',
          socialMessage: 'Вход через {provider} появится позже.',
        },
        errors: {
          missingCredentials: 'Введите email/имя пользователя и пароль',
          invalidCredentials: 'Неверный email/имя пользователя или пароль',
          generic: 'Что-то пошло не так. Попробуйте снова.',
        },
      },
      register: {
        title: 'Регистрация',
        description: 'Создайте аккаунт, чтобы продолжить.',
        fields: {
          email: 'Email',
          fullName: 'Полное имя',
          password: 'Пароль',
          confirmPassword: 'Повторите пароль',
        },
        placeholders: {
          email: 'name@example.com',
          fullName: 'Введите ваше имя',
          password: 'Придумайте пароль',
          confirmPassword: 'Повторите пароль',
        },
        buttons: {
          submit: 'Создать аккаунт',
          socialComingSoon: 'Скоро',
        },
        links: {
          haveAccount: 'Уже есть аккаунт?',
          signIn: 'Войти',
        },
        languageSelector: {
          label: 'Язык',
          helper: 'Выберите язык для регистрации.',
        },
        selectors: {
          sectionTitle: 'Регион и валюта',
          helper: 'Основная валюта будет {currency}',
          regionLabel: 'Регион',
          currencyLabel: 'Валюта',
          currencyHint: 'Нажмите, чтобы выбрать',
        },
        sheets: {
          regionTitle: 'Выберите регион',
          currencyTitle: 'Выберите валюту',
          currencySearch: 'Поиск валюты',
          languageTitle: 'Выберите язык',
        },
        alerts: {
          successTitle: 'Регистрация выполнена',
          successMessage: 'Добро пожаловать! Аккаунт создан.',
          failureTitle: 'Ошибка регистрации',
          socialTitle: 'Скоро',
          socialMessage: 'Регистрация через {provider} появится позже.',
        },
        passwordGuide: {
          strengthLabel: 'Надёжность пароля',
          helper: 'Используйте буквы, цифры и символы.',
          levels: {
            empty: 'Начните ввод',
            weak: 'Слабый',
            medium: 'Средний',
            strong: 'Сильный',
          },
          requirementsTitle: 'Требования к паролю',
          requirements: {
            length: 'От {count} символов',
            uppercase: 'Минимум одна заглавная буква',
            lowercase: 'Минимум одна строчная буква',
            number: 'Минимум одна цифра',
            special: 'Минимум один спецсимвол',
          },
        },
        errors: {
          missingFields: 'Заполните обязательные поля',
          selectRegion: 'Выберите регион',
          passwordMismatch: 'Пароли не совпадают',
          emailInvalid: 'Введите корректный email',
        emailExists: 'Аккаунт с таким email уже существует',
        generic: 'Не удалось завершить регистрацию. Попробуйте позже.',
      },
    },
      forgot: {
        languageSelector: {
          label: 'Язык',
          helper: 'Выберите язык для восстановления доступа.',
        },
        emailStep: {
          title: 'Забыли пароль',
          description: 'Введите email, чтобы сбросить пароль.',
          fieldLabel: 'Email',
          placeholder: 'name@example.com',
          button: {
            submit: 'Отправить код',
            loading: 'Отправляем…',
          },
        },
        otpStep: {
          title: 'Введите код подтверждения',
          description: 'Мы отправили код на {email}',
          timerHint: 'Отправить новый через {time}',
          resend: 'Отправить код ещё раз',
          back: 'Назад к email',
          button: {
            submit: 'Подтвердить код',
            loading: 'Проверяем…',
          },
        },
        alerts: {
          codeSentTitle: 'Код отправлен',
          codeSentMessage: 'Проверьте почту — код на 4 цифры (в демо смотрите консоль).',
          codeResentTitle: 'Код отправлен снова',
          codeResentMessage: 'Мы отправили новый код подтверждения.',
          otpVerifiedTitle: 'Код подтверждён',
          otpVerifiedMessage: 'Готово! Теперь можно войти снова.',
          genericErrorTitle: 'Ошибка',
          genericErrorMessage: 'Что-то пошло не так. Попробуйте ещё раз.',
          okButton: 'ОК',
        },
        footer: {
          remember: 'Пароль вспомнили?',
          signIn: 'Войти',
        },
        errors: {
          invalidEmail: 'Введите корректный email',
          generic: 'Что-то пошло не так. Попробуйте снова.',
          otpExpired: 'Срок действия кода истёк. Запросите новый.',
          otpInvalid: 'Неверный код подтверждения.',
          otpIncomplete: 'Введите весь код подтверждения.',
        },
      },
  },
    addTask: ruAddTask as AppTranslations['addTask'],
    universalFab: ruUniversalFab as AppTranslations['universalFab'],
    home: {
      header: {
        todayLabel: 'СЕГОДНЯ',
        openProfile: 'Открыть профиль',
        previousDay: 'Предыдущий день',
        nextDay: 'Следующий день',
      },
      greeting: {
        morning: 'Доброе утро',
        afternoon: 'Добрый день',
        evening: 'Добрый вечер',
        night: 'Доброй ночи',
        defaultName: 'друг',
      },
      status: {
        online: 'Онлайн',
        offline: 'Офлайн',
        connecting: 'Проверяем…',
      },
      widgets: {
        title: 'Виджеты',
        edit: 'Править',
        emptyTitle: 'Нет доступных виджетов',
        emptySubtitle: 'Нажмите «Править», чтобы добавить виджеты на главную.',
      },
      progress: {
        tasks: 'Задачи',
        budget: 'Бюджет',
        habit: 'Привычка',
        progressSuffix: 'прогресс',
      },
    },
    tabs: {
      home: 'Главная',
      finance: 'Финансы',
      planner: 'Планер',
      insights: 'Инсайт',
      more: 'Ещё',
    },
    calendar: {
      todayLabel: 'сегодня',
      selectDateTitle: 'Выберите дату',
    },
    plannerScreens: {
      tabs: {
        tasks: 'Задачи',
        goals: 'Цели',
        habits: 'Привычки',
      },
      tasks: {
        headerTemplate: 'Планы на {date}',
        todayLabel: 'сегодня',
        filter: 'Фильтр',
        sectionCountLabel: 'задач',
        sectionTip:
          'Удерживайте и смахните вправо, чтобы отметить выполненной, и влево — чтобы удалить (даже выполненные задачи).',
        sections: {
          morning: { title: 'Утро', time: '(06:00 - 12:00)' },
          afternoon: { title: 'День', time: '(12:00 - 18:00)' },
          evening: { title: 'Вечер', time: '(18:00 - 22:00)' },
        },
        actions: {
          complete: 'ГОТОВО',
          restore: 'ВОССТАНОВИТЬ',
          remove: 'УДАЛИТЬ',
          delete: 'УДАЛИТЬ ЗАДАЧУ',
        },
        history: {
          title: 'История задач',
          subtitle: 'Смахните, чтобы восстановить или удалить',
          tip: 'Удерживайте и смахните вправо, чтобы восстановить задачу, или влево — чтобы удалить навсегда.',
          deletedBadge: 'Перенесено',
        },
        defaults: {
          startToday: 'Сегодня',
          startTomorrow: 'Завтра',
          startPick: 'Выбрать',
          newTaskTitle: 'Новая задача',
          defaultContext: '@work',
        },
        aiPrefix: 'ИИ:',
        dailySummary: 'Сегодня: {tasks} задач • {habits} привычек • {goals} шага по целям',
        statuses: {
          active: 'Активно',
          in_progress: 'В фокусе',
          completed: 'Выполнено',
          archived: 'В архиве',
        },
        focus: {
          cta: 'Фокус',
          inProgress: 'В фокусе',
          cardLabel: 'Сейчас в работе',
          goalTag: 'Цель: {goal}',
          finishTitle: 'Завершить «{task}»?',
          finishMessage: 'Отметьте выполнение или перенесите остаток на завтра.',
          done: 'Готово',
          move: 'Перенести на завтра',
          keep: 'Оставить позже',
        },
        calendar: {
          title: 'Календарь планера',
          summary: '{tasks} задач • {habits} привычек • {goals} шага по целям',
          addQuickTask: 'Быстрая задача',
          quickTaskTitle: 'Быстрая задача',
          scheduledTitle: 'Запланировано на день',
          empty: 'На этот день ничего нет.',
          moveTitle: 'Перенести задачи сюда',
          moveHere: 'Перенести сюда',
          moveTomorrow: 'Перенести на завтра',
          unscheduled: 'Без даты',
          noOtherTasks: 'Все задачи уже здесь.',
        },
        aiSuggestions: {
          title: 'Рекомендация ИИ',
          time: 'Лучшее окно: {value}',
          duration: 'Длительность: {value}',
          context: 'Контекст: {value}',
          energy: 'Энергия: {value}',
          apply: 'Применить рекомендацию',
        },
      },
      goals: {
        header: {
          title: 'Стратегические цели',
          subtitle: 'Движение вперёд для финансовых и личных побед',
        },
        empty: {
          title: 'Создайте первую цель',
          subtitle:
            'Отслеживайте этапы, прогнозы и подсказки ИИ, как только добавите первую цель. Нажмите универсальную кнопку добавления, чтобы начать.',
        },
        sections: {
          financial: {
            title: 'Финансовые цели',
            subtitle: 'Фокус на инвестициях и приоритетных накоплениях',
          },
          personal: {
            title: 'Личные цели',
            subtitle: 'Улучшения образа жизни и самочувствия',
          },
        },
        cards: {
          summaryLabels: {
            left: 'Осталось',
            pace: 'Темп',
            prediction: 'Прогноз',
          },
          actions: {
            addValue: 'Добавить вклад',
            refresh: 'Обновить',
            edit: 'Редактировать',
            addValueA11y: 'Добавить вклад',
            refreshA11y: 'Обновить цель',
            editA11y: 'Редактировать цель',
            openDetailsA11y: 'Открыть детали цели',
          },
        },
        details: {
          milestones: 'Этапы',
          history: 'История',
          showMore: 'Показать ещё',
        },
        nextStep: {
          title: 'Следующий шаг',
          empty: 'Нет связанных задач',
          cta: 'Добавить шаг',
        },
        linkedSummary: '{tasks} задач • {habits} привычек',
        ai: {
          title: 'План от ИИ',
          milestones: 'Этапы: старт → прототип → бета → запуск.',
          duration: 'Оценка: 3–6 месяцев с еженедельными обзорами.',
          apply: 'Применить план',
        },
        data: {
          'dream-car': {
            title: 'Машина мечты',
            currentAmount: '4,1 млн сум',
            targetAmount: '5 млн сум',
            summary: {
              left: 'Осталось 900 000 сум',
              pace: '450 000 сум / мес.',
              prediction: 'На пути · март 2025',
            },
            milestones: ['Янв 2025', 'Фев 2025', 'Мар 2025', 'Апр 2025'],
            history: [
              { label: 'Дек', delta: '+450 000 сум' },
              { label: 'Ноя', delta: '+320 000 сум' },
              { label: 'Окт', delta: '+280 000 сум' },
            ],
            aiTip: 'При текущем темпе цель будет достигнута в марте.',
            aiTipHighlight: 'Увеличьте взносы на 100 тыс., чтобы перейти на февральский график.',
          },
          'emergency-fund': {
            title: 'Резервный фонд',
            currentAmount: '3,5 млн сум',
            targetAmount: '6 млн сум',
            summary: {
              left: 'Осталось 2,5 млн сум',
              pace: '300 000 сум / мес.',
              prediction: 'Прогноз · июнь 2025',
            },
            milestones: ['Ноя 2024', 'Янв 2025', 'Мар 2025', 'Июн 2025'],
            history: [
              { label: 'Дек', delta: '+300 000 сум' },
              { label: 'Ноя', delta: '+300 000 сум' },
              { label: 'Окт', delta: '+250 000 сум' },
            ],
            aiTip: 'Взносы по 350 тыс. сохраняют комфортный буфер.',
          },
          fitness: {
            title: 'План пиковой формы',
            currentAmount: '92 / 210 тренировок',
            targetAmount: '210 тренировок',
            summary: {
              left: 'Осталось 118 тренировок',
              pace: '4 тренировки / нед.',
              prediction: 'На пути · август 2025',
            },
            milestones: ['Ноя 2024', 'Янв 2025', 'Апр 2025', 'Авг 2025'],
            history: [
              { label: 'Нед. 48', delta: '+4 тренировки' },
              { label: 'Нед. 47', delta: '+5 тренировок' },
              { label: 'Нед. 46', delta: '+3 тренировки' },
            ],
            aiTip: 'Последовательность растёт. Добавьте ещё один день кардио для ускорения.',
          },
          language: {
            title: 'Испанское погружение',
            currentAmount: '34 / 50 уроков',
            targetAmount: '50 уроков',
            summary: {
              left: 'Осталось 16 уроков',
              pace: '3 урока / нед.',
              prediction: 'Прибытие · февраль 2025',
            },
            milestones: ['Окт 2024', 'Дек 2024', 'Янв 2025', 'Мар 2025'],
            history: [
              { label: 'Нед. 48', delta: '+3 урока' },
              { label: 'Нед. 47', delta: '+4 урока' },
              { label: 'Нед. 46', delta: '+3 урока' },
            ],
            aiTip: 'Закрепляйте каждый урок 15-минутным разговором, чтобы быстрее выйти на беглость.',
          },
        },
      },
      habits: {
      headerTitle: 'Привычки',
      badgeSuffix: 'дн.',
      calendarTitle: 'Календарь отметок — {month}',
      calendarLegend: { done: 'Выполнено', miss: 'Пропущено', none: 'Нет данных' },
      calendarLegendHint: {
        done: '{count} дн. выполнено ({percent}%)',
        miss: '{count} дн. пропущено ({percent}%)',
        none: '{count} дн. без отметки ({percent}%)',
      },
      challenge: {
        title: 'Длительность челленджа',
        subtitle: 'Выберите цикл 20/40/90 дней — как в популярных трекерах.',
        options: { short: '20 дней', medium: '40 дней', long: '90 дней' },
        pinMessage: 'Отметьте {days} дней подряд, чтобы зафиксировать привычку.',
      },
      calendarButton: 'Открыть календарь',
      stats: {
        streak: 'Серия: {days} дн. подряд',
        record: 'Рекорд: {days} дн.',
        completion: 'Выполнение: {percent}% ({completed}/{target} в неделю)',
        },
        supportsGoals: 'Поддерживает: {goals}',
        ai: {
          title: 'Подсказки ИИ',
          time: 'Лучшее время между 06:30–07:00.',
          stack: 'Комбинируйте с напоминаниями о воде для стабильности.',
          apply: 'Применить совет',
        },
        ctas: {
          checkIn: 'Отметиться сегодня',
          startTimer: 'Запустить таймер',
          completed: 'Выполнено',
          failed: 'Не удалось',
          edit: 'Редактировать',
          delete: 'Удалить',
        },
        expand: {
          titles: {
            statistics: 'Статистика',
            pattern: 'Паттерны',
            achievements: 'Достижения',
          },
          lines: {
            overallCompletion: 'Общее выполнение: 156',
            successPercentile: 'Процентиль успеха: 78%',
            averageStreak: 'Средняя серия: 8 дн.',
            bestMonth: 'Лучший месяц: ноябрь (93%)',
            bestTime: 'Лучшее время: 7:00–7:30 (85% успеха)',
            worstTime: 'Худшее время: выходные (45%)',
            afterWeekends: 'После выходных: −30% вероятность',
          },
        badges: {
          firstWeek: 'Первая неделя',
          monthNoBreak: 'Месяц без перерывов',
          hundredCompletions: '100 выполнений',
          marathoner: 'Марафонец (42 дня подряд)',
        },
      },
      empty: {
        title: 'Пока нет привычек',
        subtitle: 'Добавьте привычку через кнопку «+», чтобы начать отслеживать прогресс и серии.',
      },
      data: {
        h1: {
          title: 'Утренние тренировки',
            aiNote: 'Попробуйте утром, сразу после разминки',
          },
          h2: {
            title: 'Медитация',
            aiNote: 'ИИ: «Попробуйте утром, сразу после разминки»',
          },
          h3: {
            title: 'Чтение 30 мин',
          },
          h4: {
            title: 'Выпивать 2 л воды',
            aiNote: 'Новое достижение!',
            chips: ['+ 250 мл', '+ 500 мл', '+ 1 л'],
          },
          h5: {
            title: 'Без соцсетей',
          },
      },
      },
    },
    plannerModals: {
      goal: ruGoalModal as AppTranslations['plannerModals']['goal'],
    },
    widgets: {
      budgetProgress: {
        title: 'Прогресс бюджета',
        defaults: { housing: 'Жильё', groceries: 'Продукты', entertainment: 'Развлечения' },
        placeholders: {
          empty: 'Бюджеты не настроены',
          add: 'Добавьте бюджет, чтобы отслеживать расходы',
        },
      },
      cashFlow: {
        title: 'Денежный поток',
        summary: { income: 'Доход', expenses: 'Расходы', net: 'Баланс' },
        days: { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт' },
      },
      dailyTasks: {
        title: 'Задачи дня',
        placeholders: ['Задач нет', 'Сделайте паузу', 'Добавьте новую задачу'],
      },
      focusSessions: {
        title: 'Фокус-сессии',
        stats: { completed: 'Выполнено', totalTime: 'Общее время', nextSession: 'Следующая сессия' },
        placeholders: { none: 'Сессий пока нет', free: 'Календарь свободен' },
      },
      goals: {
        title: 'Цели',
        placeholderText: 'Добавьте цель, чтобы начать отслеживание.',
        placeholders: ['Цели еще не добавлены', 'Нажмите, чтобы добавить новую цель'],
      },
      habits: {
        title: 'Привычки',
        placeholders: ['Нет привычек на сегодня', 'Добавьте привычку для старта'],
        streakLabel: 'дней подряд',
        noStreak: 'Серия пока отсутствует',
      },
      productivityInsights: {
        title: 'Аналитика продуктивности',
        metrics: {
          focusScore: 'Индекс фокуса',
          tasksCompleted: 'Задач выполнено',
          deepWork: 'Глубокая работа',
        },
        trendTitle: 'Динамика фокуса',
        vsLastWeek: 'к прошлой неделе',
        noTrend: 'Данных о тренде нет',
        days: { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт' },
      },
      spendingSummary: {
        title: 'Расходы по категориям',
        categories: {
          food: 'Еда и кафе',
          transport: 'Транспорт',
          shopping: 'Покупки',
        },
        placeholders: ['Расходов пока нет', 'Добавьте покупку, чтобы начать'],
        total: 'Всего потрачено',
      },
      transactions: {
        title: 'Транзакции',
        placeholders: ['Операций нет', 'Начните отслеживать транзакции'],
      },
      weeklyReview: {
        title: 'Еженедельный обзор',
        stats: {
          completion: 'Выполнение',
          focusTime: 'Время фокуса',
          currentStreak: 'Текущая серия',
        },
        summary: {
          success: 'Отличная неделя! Вы завершили {completed} из {total} задач.',
          empty: 'Завершайте сессии, чтобы открыть аналитику недели.',
        },
        streakUnit: 'дн.',
      },
      wellnessOverview: {
        title: 'Баланс самочувствия',
        metrics: { energy: 'Энергия', mood: 'Настроение', sleep: 'Качество сна' },
        messages: {
          balanced: 'Неделя в балансе — продолжайте в том же духе',
          logPrompt: 'Фиксируйте самочувствие, чтобы получать инсайты',
        },
      },
    },
    language: {
      sectionTitle: 'Язык',
      helperTitle: 'Примечание',
      helperDescription:
        'Выбранный язык применяется к аналитике, подсказкам и будущим обновлениям. Некоторые экспериментальные функции могут временно оставаться на английском.',
    },
    more: {
      header: {
        title: 'Ещё',
        profileAction: 'Открыть профиль',
        notificationsAction: 'Уведомления',
        badgeLabel: 'Премиум',
        dateLabel: '15 марта',
      },
      premiumBadge: 'Премиум до',
      sections: {
        account: 'Аккаунт',
        settings: 'Настройки',
        data: 'Данные',
        integration: 'Интеграции',
        help: 'Помощь',
      },
      accountItems: {
        profile: 'Профиль',
        premium: 'Статус Premium',
        achievements: 'Достижения',
        statistics: 'Статистика',
      },
      settingsItems: {
        appearance: 'Оформление',
        notifications: 'Уведомления',
        aiAssistant: 'ИИ‑ассистент',
        security: 'Безопасность',
        language: 'Язык и регион',
      },
      dataItems: {
        synchronization: 'Синхронизация',
        backup: 'Резервное копирование',
        export: 'Экспорт данных',
        cache: 'Очистить кэш',
      },
      integrationItems: {
        calendars: 'Календари',
        banks: 'Банки',
        apps: 'Приложения',
        devices: 'Устройства',
      },
      helpItems: {
        manual: 'Руководство',
        faq: 'FAQ',
        support: 'Поддержка',
        about: 'О LEORA',
      },
      values: {
        enabled: 'Вкл.',
        disabled: 'Выкл.',
        on: 'Вкл.',
        off: 'Выкл.',
        themeLight: 'Светлая',
        themeDark: 'Тёмная',
        aiAlpha: 'Альфа',
        languageLabel: 'Русский',
        level: 'Уровень',
      },
      logout: 'Выйти',
    confirmLogout: {
      title: 'Выйти из аккаунта',
      message: 'Вы уверены, что хотите выйти?',
      cancel: 'Отмена',
      confirm: 'Выйти',
    },
  },
    profile: {
      title: 'Профиль',
      sections: {
        personal: 'Личные данные',
        stats: 'Статистика использования',
        preferences: 'Публичный профиль',
        finance: 'Финансовые настройки',
        actions: 'Действия с аккаунтом',
      },
      fields: {
        fullName: 'Имя',
        email: 'Email',
        phone: 'Телефон',
        username: 'Имя пользователя',
        joined: 'С нами с',
        bio: 'О себе',
        visibility: 'Видимость профиля',
        visibilityOptions: { public: 'Публичный', friends: 'Только друзья', private: 'Приватный' },
        showLevel: 'Показывать уровень',
        showAchievements: 'Показывать достижения',
        showStatistics: 'Показывать статистику',
      },
      finance: {
        regionLabel: 'Основной регион',
        currencyLabel: 'Валюта отображения',
        regionSheetTitle: 'Выберите регион',
        currencySheetTitle: 'Выберите валюту',
        currencySearchPlaceholder: 'Поиск валюты',
        fxTitle: 'Курсы валют',
        fxDescription: 'Синхронизируйте провайдера или задайте курс вручную.',
        fxProviderLabel: 'Поставщик курсов',
        fxProviders: {
          central_bank_stub: 'ЦБ',
          market_stub: 'Рынок',
        },
        fxSyncButton: 'Синхронизировать',
        fxSyncing: 'Синхронизация...',
        fxSyncSuccess: 'Курсы обновлены через {provider}',
        fxSyncError: 'Не удалось обновить курсы. Повторите попытку.',
        fxLastSync: 'Последнее обновление: {value}',
        fxManualTitle: 'Ручной курс',
        fxManualHint: 'Курс по отношению к {base}',
        fxManualCurrencyLabel: 'Валюта',
        fxOverridePlaceholder: 'Введите курс',
        fxOverrideButton: 'Сохранить курс',
        fxOverrideSuccess: 'Курс сохранён для {currency}',
        fxOverrideError: 'Введите корректное значение',
        fxOverrideBaseError: 'Выберите валюту, отличную от базовой',
        fxOverrideSheetTitle: 'Выберите валюту для ручного курса',
      },
      stats: {
        daysWithApp: 'Дней с LEORA',
        completedTasks: 'Задач выполнено',
        activeTasks: 'Активные задачи',
        level: 'Текущий уровень',
      },
      xp: {
        label: 'Прогресс XP',
        toNext: '{value} XP до нового уровня',
      },
      buttons: {
        edit: 'Редактировать профиль',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить аккаунт',
        logout: 'Выйти',
        changePhoto: 'Сменить фото',
        removePhoto: 'Удалить фото',
        confirmDeleteTitle: 'Удаление аккаунта',
        confirmDeleteMessage: 'Все данные будут удалены без возможности восстановления. Продолжить?',
        confirmDeleteConfirm: 'Удалить',
        confirmDeleteCancel: 'Отмена',
      },
    },
    financeScreens: {
      tabs: {
        review: 'Обзор',
        accounts: 'Счета',
        transactions: 'Транзакции',
        budgets: 'Бюджеты',
        analytics: 'Аналитика',
        debts: 'Долги',
      },
      goalActions: {
        connectFinance: 'Связать финансы',
        createBudget: 'Создать бюджет для цели',
        addContribution: 'Добавить взнос',
      },
      review: {
        totalBalance: 'Общий баланс',
        income: 'Доход',
        outcome: 'Расход',
        monthBalance: 'Баланс на конец месяца',
        used: 'Использовано',
        progress: 'Прогресс',
        expenseStructure: 'Структура расходов',
        recentTransactions: 'Последние транзакции',
        seeAll: 'Показать все',
        importantEvents: 'Важные события',
        table: { type: 'Тип', amount: 'Сумма', date: 'Дата' },
        fxQuick: {
          title: 'Курсы валют',
          providerLabel: 'Поставщик',
          providers: {
            central_bank_stub: 'ЦБ',
            market_stub: 'Рынок',
          },
          syncButton: 'Синхронизировать',
          syncDescription: 'Получить свежие курсы провайдера',
          syncing: 'Синхронизация...',
          syncSuccess: 'Курсы обновлены через {provider}',
          syncError: 'Не удалось обновить курсы. Повторите попытку.',
          lastSync: 'Последнее обновление: {value}',
          overrideButton: 'Ручной курс',
          overrideHint: 'Курс к {base}',
          overrideTitle: 'Ручной курс',
          overridePlaceholder: 'Введите значение',
          overrideConfirm: 'Сохранить',
          overrideCancel: 'Отмена',
        overrideSuccess: 'Курс сохранён для {currency}',
        overrideError: 'Введите корректное значение',
        overrideBaseError: 'Выберите валюту, отличную от базовой',
      },
      accountFilterTitle: 'Выберите счета',
      accountFilterAll: 'Все счета',
      accountFilterSelected: 'Выбрано: {count}',
      accountFilterSelectAll: 'Выбрать все',
      accountFilterApply: 'Применить',
      accountFilterCurrencyLabel: 'Валюта отображения',
      monitorTitle: 'Мониторинг баланса',
      monitorSearchPlaceholder: 'Поиск транзакций',
      monitorAccounts: 'Счета',
      monitorTypesTitle: 'Типы операций',
      monitorTypes: {
        income: 'Доход',
        expense: 'Расход',
        transfer: 'Конвертация',
      },
      monitorDateFrom: 'С',
      monitorDateTo: 'По',
      monitorResults: 'Транзакции',
      monitorNoDate: 'Не выбрана',
      monitorEmpty: 'Нет транзакций по заданным фильтрам',
      monitorApply: 'Готово',
      monitorReset: 'Сбросить фильтры',
    },
      accounts: {
        header: 'Мои счета',
        income: 'Доход',
        outcome: 'Расход',
        goalProgress: '{value}% от цели',
        historyTitle: 'История транзакций',
        historyHeaders: { type: 'Тип', amount: 'Сумма', time: 'Время' },
        actions: { edit: 'Изменить', archive: 'Архивировать', delete: 'Удалить' },
        modal: {
          titleAdd: 'Добавить счёт',
          titleEdit: 'Редактировать счёт',
          nameLabel: 'Название',
          namePlaceholder: 'Название счёта',
          descriptionLabel: 'Описание',
          descriptionPlaceholder: 'Описание',
          typeLabel: 'Тип',
          addType: 'Добавить тип',
          newTypePlaceholder: 'Название нового типа',
          saveType: 'Сохранить тип',
          currencyLabel: 'Валюта',
          amountLabel: 'Сумма',
          amountPlaceholder: 'Сумма ({currency})',
          primaryActionAdd: 'Добавить',
          primaryActionSave: 'Сохранить',
          typeOptions: {
            cash: 'Наличные',
            card: 'Карта',
            savings: 'Накопительный',
            usd: 'Кредит',
            crypto: 'Крипто',
            other: 'Другое',
            custom: 'Свой тип',
          },
          iconOptions: {
            wallet: 'Кошелёк',
            creditCard: 'Карта',
            piggyBank: 'Сбережения',
            bank: 'Банк',
            briefcase: 'Бизнес',
            coins: 'Монеты',
            sparkles: 'Другое',
            bitcoin: 'Крипто',
            shield: 'Безопасный',
            trendingUp: 'Рост',
          },
          currencyLabels: {
            UZS: 'Узбекский сум',
            USD: 'Доллар США',
            EUR: 'Евро',
            GBP: 'Фунт стерлингов',
            TRY: 'Турецкая лира',
            SAR: 'Саудовский риял',
            AED: 'Дирхам ОАЭ',
            USDT: 'Tether (USDT)',
            RUB: 'Российский рубль',
          },
        },
      },
      transactions: {
        header: 'История транзакций',
        details: {
          title: 'Детали транзакции',
          type: 'Тип операции',
          amount: 'Сумма',
          account: 'Счёт',
          category: 'Категория',
          date: 'Дата',
          note: 'Заметка',
          relatedDebt: 'Связанный долг',
          close: 'Закрыть',
        },
        filterSheet: {
          title: 'Фильтр транзакций',
          dateRange: 'Период',
          category: 'Категория',
          accounts: 'Счета',
          type: 'Тип операции',
          amount: 'Диапазон суммы',
          from: 'От',
          to: 'До',
          close: 'Закрыть',
          clearHint: 'Удерживайте, чтобы очистить',
          selectDate: 'Выберите дату',
          reset: 'Сбросить',
          apply: 'Применить',
          all: 'Все',
          typeOptions: {
            income: 'Доход',
            expense: 'Расход',
            transfer: 'Перевод',
            debt: 'Долг',
          },
        },
        quick: {
          incomeHeader: '+ Доход',
          outcomeHeader: '- Расход',
          amountPlaceholder: 'Введите сумму',
          debtOwedToYouLabel: 'Кто должен вам?',
          debtOwedToYouPlaceholder: 'Имя должника',
          debtYouOweLabel: 'Кому вы должны?',
          debtYouOwePlaceholder: 'Имя кредитора',
          categoryAddTitle: 'Добавить категорию',
          categoryEditTitle: 'Редактировать категорию',
          categoryPlaceholder: 'Название категории',
          save: 'Сохранить запись',
          update: 'Сохранить изменения',
        },
        transferForm: {
          title: 'Перевод между счетами',
          submit: 'Перевести',
          amountPlaceholder: 'Сумма',
          fromAccount: 'Со счёта',
          toAccount: 'На счёт',
          exchangeRate: 'Курс обмена',
          auto: 'Авто',
          conversionInfo: '{amount} будет зачислено',
          resetRate: 'Сбросить курс',
          date: 'Дата',
          time: 'Время',
          notePlaceholder: 'Добавьте описание или контекст…',
          pickerDone: 'Готово',
          selectAccount: 'Выберите счёт',
          rateInfoTemplate:
            'Курс: 1 {toCurrency} = {rate} {fromCurrency}. Получено: {amount}',
        },
      },
      budgets: {
        today: 'Обзор бюджета на сегодня',
        dateTemplate: 'Обзор бюджета за {date}',
      mainTitle: 'Главный бюджет',
      categoriesTitle: 'Категории',
      addCategory: 'Добавить категорию',
      setLimit: 'Установить лимит',
      states: { exceeding: 'Превышение', fixed: 'Фиксировано', within: 'В пределах' },
      detail: {
        title: 'Детали бюджета',
        status: 'Статус',
        linkedGoal: 'Связанная цель',
        goalUnlinked: 'Цель не привязана',
        accountLabel: 'Счёт',
        currencyLabel: 'Валюта бюджета',
        limitLabel: 'Лимит',
        spentLabel: 'Потрачено',
        remainingLabel: 'Остаток',
        balanceLabel: 'Текущий баланс',
        createdAt: 'Создан',
        updatedAt: 'Обновлён',
        categoriesLabel: 'Категории',
        notifyLabel: 'Уведомлять при превышении',
        valueAddTitle: 'Value add',
        valueAddAccountCurrency: 'Валюта счёта',
        valueAddBudgetCurrency: 'Валюта бюджета',
        valueAddDisplayCurrency: 'Валюта отображения',
        actions: {
          title: 'Действия',
          edit: 'Редактировать бюджет',
          delete: 'Удалить бюджет',
          viewGoal: 'Открыть цель',
          viewTransactions: 'Транзакции',
          addToBudget: 'Добавить в бюджет',
          confirmDeleteTitle: 'Удалить бюджет?',
          confirmDeleteMessage: 'Бюджет будет архивирован и отвязан от целей.',
          confirmDeleteConfirm: 'Удалить',
          confirmDeleteCancel: 'Отмена',
        },
      },
      form: {
        nameLabel: 'Название бюджета',
        namePlaceholder: 'Название бюджета',
        limitPlaceholder: '0',
        periodLabel: 'Период бюджета',
        periodOptions: {
          weekly: 'Неделя',
          monthly: 'Месяц',
          custom_range: 'Произвольный период',
        },
        selectedRangeLabel: 'Выбранный период: {range}',
        customRange: {
          start: 'Дата начала',
          end: 'Дата окончания',
          helper: 'Укажите произвольный диапазон',
          error: 'Выберите даты начала и окончания',
        },
      },
    },
      analytics: {
        header: 'Финансовая аналитика',
        expenseDynamics: 'Динамика расходов',
        comparison: 'Сравнение с прошлым месяцем',
        topExpenses: 'Топ расходов по категориям',
        aiInsights: 'AI‑инсайты',
        stats: { peak: 'Пик', average: 'Среднее', trend: 'Тренд' },
        comparisonRows: { income: 'Доход:', outcome: 'Расход:', savings: 'Сбережения:' },
      },
      debts: {
        sections: { incoming: 'Долги', outgoing: 'Мои долги' },
        timeline: {
          incoming: 'Вернёт через',
          outgoing: 'Период',
          today: 'Срок сегодня',
          inDays: 'Через {count} дней',
          overdue: 'Просрочено на {count} дней',
        },
        actions: {
          incoming: { notify: 'Напомнить', cancel: 'Отменить долг' },
          outgoing: { plan: 'Запланировать', partial: 'Оплатить частично' },
        },
        summary: {
          balanceLabel: 'Общий баланс',
          givenLabel: 'Выдано',
          takenLabel: 'Общий долг',
          givenChange: '+15% в декабре',
          takenChange: '-8% в декабре',
        },
        modal: {
          title: 'Добавить долг',
          editTitle: 'Редактировать долг',
          subtitle: 'Отслеживайте занятые и одолженные суммы',
          typeLabel: 'Тип',
          borrowedLabel: 'Я должен',
          lentLabel: 'Мне должны',
          person: 'Имя / Человек',
          personPlaceholder: 'Для кого этот долг?',
          amount: 'Сумма',
          accountLabel: 'Кошелёк',
          accountHelper: 'Выберите счёт для этой операции',
          accountPickerTitle: 'Выберите кошелёк',
          currencyLabel: 'Валюта',
          currencyHelper: 'Укажите валюту долга',
          currencyPickerTitle: 'Выберите валюту',
          dateLabel: 'Дата',
          changeDate: 'Изменить дату',
          clear: 'Очистить',
          selectAccount: 'Выберите кошелёк',
          expectedReturn: 'Ожидаемая дата возврата',
          expectedPlaceholder: 'Дата возврата не установлена',
        selectDate: 'Выберите дату',
        note: 'Заметка',
        notePlaceholder: 'Добавьте описание или детали…',
        personDirectional: {
          incoming: { label: 'От кого получили?', placeholder: 'Укажите, у кого заняли' },
          outgoing: { label: 'Кому даёте?', placeholder: 'Укажите получателя' },
        },
        toggles: { incoming: 'Мне должны', outgoing: 'Я должен' },
        manageActions: 'Управление долгом',
        accountDirectional: {
          incoming: {
            label: 'Зачислить на счёт',
            helper: 'Средства поступят на выбранный счёт ({accountCurrency}).',
          },
          outgoing: {
            label: 'Списать со счёта',
            helper: 'Деньги будут списаны с выбранного счёта ({accountCurrency}).',
          },
        },
        currencyFlow: {
          incoming: 'Получаете {debtCurrency} → зачисляем на {accountCurrency}',
          outgoing: 'Отдаёте {debtCurrency} → списываем {accountCurrency}',
        },
        counterpartyPickerTitle: 'Выберите человека',
        counterpartySearchPlaceholder: 'Поиск имени',
        counterpartyAddAction: 'Добавить «{query}»',
        counterpartyEmpty: 'Список пуст — добавьте первого пользователя.',
        counterpartyActions: {
          renameTitle: 'Изменить имя',
          renamePlaceholder: 'Введите новое имя',
          renameSave: 'Сохранить',
          renameCancel: 'Отмена',
          deleteTitle: 'Удалить пользователя?',
          deleteDescription: 'Этот человек будет удалён безвозвратно.',
          deleteConfirm: 'Удалить',
          deleteBlocked: 'Нельзя удалить пользователя, который привязан к долгам.',
          duplicateName: 'Такое имя уже существует.',
        },
          buttons: {
            cancel: 'Отмена',
            save: 'Сохранить',
            saveChanges: 'Сохранить',
            delete: 'Удалить',
          },
          defaults: { name: 'Новый долг', description: 'Описание', due: 'Без срока' },
          deleteTitle: 'Удалить долг',
          deleteDescription: 'Вы уверены, что хотите удалить этот долг? Действие нельзя отменить.',
        status: {
          lent: 'Вы одолжили деньги',
          borrowed: 'Вы заняли деньги',
        },
        scheduleTitle: 'График погашения',
        reminderTitle: 'Уведомления',
        reminderToggle: 'Включить уведомление',
        reminderTimeLabel: 'Время напоминания (HH:MM)',
        reminderEnabledLabel: 'Уведомления включены',
        reminderDisabledLabel: 'Уведомления выключены',
        payment: {
          title: 'Записать платеж',
          amount: 'Сумма платежа',
          accountLabel: 'С какого кошелька',
          currencyLabel: 'Валюта платежа',
          note: 'Заметка к платежу',
          helper: 'Используйте для частичных погашений и списаний.',
          submit: 'Применить платеж',
          limitError: 'Сумма превышает остаток долга',
        },
        actionsBar: {
          pay: 'Погасить долг',
          partial: 'Частичный платеж',
          notify: 'Уведомление',
          schedule: 'Управление датами',
        },
        manualRate: {
          title: 'Конвертация',
          description:
            'Валюта долга {debtCurrency}. Валюта счёта {accountCurrency}. Укажите сумму списания в {accountCurrency}.',
          toggle: 'Ввести вручную',
          amountLabel: 'Списать со счёта ({currency})',
        },
        fullPaymentTitle: 'Полностью погасить долг',
        fullPaymentDescription: 'Вы погасите всю оставшуюся сумму {amount}.',
        fullPaymentSubmit: 'Оплатить полностью',
      },
      },
    },
  },
  uz: {
    common: {
      close: 'Yopish',
      cancel: 'Bekor qilish',
      save: 'Saqlash',
      add: 'Qo‘shish',
      delete: 'O‘chirish',
      apply: 'Qo‘llash',
      reset: 'Tozalash',
      done: 'Tayyor',
      select: 'Tanlash',
    },
    auth: {
      common: {
        socialDivider: 'Yoki quyidagilar bilan davom eting',
        languageButtonLabel: 'Til',
        languageHelper: 'Bu ekran uchun tilni tanlang.',
        languageSheetTitle: 'Tilni tanlang',
      },
      validation: {
        emailOrUsernameRequired: 'Email yoki foydalanuvchi nomini kiriting',
        emailRequired: 'Email talab qilinadi',
        emailInvalid: 'To‘g‘ri email manzilini kiriting',
        nameRequired: 'To‘liq ism talab qilinadi',
        passwordRequired: 'Parol talab qilinadi',
        passwordConfirmRequired: 'Parolni tasdiqlang',
        passwordMismatch: 'Parollar mos emas',
        passwordMinLength: 'Kamida 8 ta belgi bo‘lsin',
        passwordUppercase: 'Bitta katta harf qo‘shing',
        passwordLowercase: 'Bitta kichik harf qo‘shing',
        passwordNumber: 'Bitta raqam qo‘shing',
        passwordSpecial: 'Bitta maxsus belgi qo‘shing',
      },
      login: {
        title: 'Kirish',
        description: 'Xush kelibsiz! Davom etish uchun maʼlumotlarni kiriting.',
        fields: {
          emailOrUsername: 'Email yoki foydalanuvchi nomi',
          password: 'Parol',
        },
        placeholders: {
          emailOrUsername: 'ism@example.com',
          password: 'Parolingizni kiriting',
        },
        rememberMe: 'Eslab qolish',
        forgotPassword: 'Parolni unutdingizmi?',
        buttons: {
          submit: 'Kirish',
        },
        links: {
          noAccount: 'Hali akkauntingiz yo‘qmi?',
          signUp: 'Ro‘yxatdan o‘tish',
        },
        alerts: {
          failureTitle: 'Kirish amalga oshmadi',
          failureMessage: 'Maʼlumotlarni tekshirib, yana urinib ko‘ring.',
          socialTitle: 'Tez orada',
          socialMessage: '{provider} orqali kirish tez orada mavjud bo‘ladi.',
        },
        errors: {
          missingCredentials: 'Email/foydalanuvchi nomi va parolni kiriting',
          invalidCredentials: 'Email/foydalanuvchi nomi yoki parol noto‘g‘ri',
          generic: 'Xatolik yuz berdi. Qayta urinib ko‘ring.',
        },
      },
      register: {
        title: 'Ro‘yxatdan o‘ting',
        description: 'Davom etish uchun akkaunt yarating.',
        fields: {
          email: 'Email',
          fullName: 'To‘liq ism',
          password: 'Parol',
          confirmPassword: 'Parolni tasdiqlang',
        },
        placeholders: {
          email: 'ism@example.com',
          fullName: 'To‘liq ismingizni kiriting',
          password: 'Parol yarating',
          confirmPassword: 'Parolni qayta kiriting',
        },
        buttons: {
          submit: 'Ro‘yxatdan o‘tish',
          socialComingSoon: 'Tez orada',
        },
        links: {
          haveAccount: 'Akkauntingiz bormi?',
          signIn: 'Kirish',
        },
        languageSelector: {
          label: 'Til',
          helper: 'Ro‘yxatdan o‘tish uchun tilni tanlang.',
        },
        selectors: {
          sectionTitle: 'Hudud va valyuta',
          helper: 'Asosiy valyuta {currency} bo‘ladi',
          regionLabel: 'Hudud',
          currencyLabel: 'Valyuta',
          currencyHint: 'Bosib o‘zgartiring',
        },
        sheets: {
          regionTitle: 'Hududni tanlang',
          currencyTitle: 'Valyutani tanlang',
          currencySearch: 'Valyutani qidirish',
          languageTitle: 'Tilni tanlang',
        },
        alerts: {
          successTitle: 'Muvaffaqiyatli',
          successMessage: 'Xush kelibsiz! Akkaunt yaratildi.',
          failureTitle: 'Xatolik',
          socialTitle: 'Tez orada',
          socialMessage: '{provider} orqali ro‘yxatdan o‘tish tez orada ochiladi.',
        },
        passwordGuide: {
          strengthLabel: 'Parol kuchi',
          helper: '8+ belgi, harflar, raqamlar va belgilarni aralashtiring.',
          levels: {
            empty: 'Yozishni boshlang',
            weak: 'Zaif',
            medium: 'O‘rtacha',
            strong: 'Kuchli',
          },
          requirementsTitle: 'Parol talablari',
          requirements: {
            length: 'Kamida {count} ta belgi',
            uppercase: 'Hech bo‘lmaganda bitta katta harf',
            lowercase: 'Hech bo‘lmaganda bitta kichik harf',
            number: 'Hech bo‘lmaganda bitta raqam',
            special: 'Hech bo‘lmaganda bitta maxsus belgi',
          },
        },
        errors: {
          missingFields: 'Majburiy maydonlarni to‘ldiring',
          selectRegion: 'Hududni tanlang',
          passwordMismatch: 'Parollar mos emas',
          emailInvalid: 'To‘g‘ri email kiriting',
          emailExists: 'Bu email uchun akkaunt mavjud',
          generic: 'Ro‘yxatdan o‘tishda xatolik. Qayta urinib ko‘ring.',
        },
      },
      forgot: {
        languageSelector: {
          label: 'Til',
          helper: 'Parolni tiklash uchun tilni tanlang.',
        },
        emailStep: {
          title: 'Parolni unutdingizmi',
          description: 'Parolni tiklash uchun emailingizni kiriting.',
          fieldLabel: 'Email',
          placeholder: 'name@example.com',
          button: {
            submit: 'Kod yuborish',
            loading: 'Yuborilmoqda…',
          },
        },
        otpStep: {
          title: 'Tasdiqlash kodini kiriting',
          description: 'Biz {email} manziliga kod yubordik',
          timerHint: 'Yangi kod {time} dan keyin',
          resend: 'Kodni qayta yuborish',
          back: 'Email bosqichiga qaytish',
          button: {
            submit: 'Kod tasdiqlash',
            loading: 'Tekshirilmoqda…',
          },
        },
        alerts: {
          codeSentTitle: 'Kod yuborildi',
          codeSentMessage: '4 xonali kod emailingizga yuborildi (demo uchun konsolni ham tekshiring).',
          codeResentTitle: 'Kod qayta yuborildi',
          codeResentMessage: 'Yangi tasdiqlash kodi yuborildi.',
          otpVerifiedTitle: 'Kod tasdiqlandi',
          otpVerifiedMessage: 'Muvaffaqiyatli! Endi tizimga kira olasiz.',
          genericErrorTitle: 'Xatolik',
          genericErrorMessage: 'Xatolik yuz berdi. Qayta urinib ko‘ring.',
          okButton: 'OK',
        },
        footer: {
          remember: 'Parolni esladingizmi?',
          signIn: 'Kirish',
        },
        errors: {
          invalidEmail: 'To‘g‘ri email kiriting',
          generic: 'Xatolik yuz berdi. Qayta urinib ko‘ring.',
          otpExpired: 'Kod muddati tugagan. Yangi kod so‘rang.',
          otpInvalid: 'Kiritilgan kod noto‘g‘ri.',
          otpIncomplete: 'Tasdiqlash kodini to‘liq kiriting.',
        },
      },
    },
    addTask: uzAddTask as AppTranslations['addTask'],
    universalFab: uzUniversalFab as AppTranslations['universalFab'],
    home: {
      header: {
        todayLabel: 'BUGUN',
        openProfile: 'Profilni ochish',
        previousDay: 'Oldingi kun',
        nextDay: 'Keyingi kun',
      },
      greeting: {
        morning: 'Xayrli tong',
        afternoon: 'Xayrli kun',
        evening: 'Xayrli oqshom',
        night: 'Xayrli tun',
        defaultName: 'do‘stim',
      },
      status: {
        online: 'Onlayn',
        offline: 'Oflayn',
        connecting: 'Tekshirilmoqda…',
      },
      widgets: {
        title: 'Vidjetlar',
        edit: 'Tahrirlash',
        emptyTitle: 'Vidjetlar mavjud emas',
        emptySubtitle: 'Bosh sahifaga vidjet qo‘shish uchun "Tahrirlash" tugmasini bosing.',
      },
      progress: {
        tasks: 'Vazifalar',
        budget: 'Byudjet',
        habit: 'Odat',
        progressSuffix: 'ko‘rsatkich',
      },
    },
    tabs: {
      home: 'Bosh sahifa',
      finance: 'Moliya',
      planner: 'Reja',
      insights: 'Insayt',
      more: 'Ko‘proq',
    },
    calendar: {
      todayLabel: 'bugun',
      selectDateTitle: 'Sanani tanlang',
    },
    plannerScreens: {
      tabs: {
        tasks: 'Vazifalar',
        goals: 'Maqsadlar',
        habits: 'Odatlar',
      },
      tasks: {
        headerTemplate: '{date} uchun rejalar',
        todayLabel: 'bugun',
        filter: 'Filtr',
        sectionCountLabel: 'vazifa',
        sectionTip:
          'Qisqa bosib, o‘ngga suring — bajarildi, chapga suring — o‘chirib tashlash (hatto bajarilganlari ham).',
        sections: {
          morning: { title: 'Tong', time: '(06:00 - 12:00)' },
          afternoon: { title: 'Kunduzi', time: '(12:00 - 18:00)' },
          evening: { title: 'Kechqurun', time: '(18:00 - 22:00)' },
        },
        actions: {
          complete: 'BAJARILDI',
          restore: 'QAYTARISH',
          remove: 'O‘CHIRISH',
          delete: 'VAZIFANI O‘CHIRISH',
        },
        history: {
          title: 'Vazifalar tarixi',
          subtitle: 'Qaytarish yoki o‘chirish uchun suring',
          tip: 'Qisqa bosib, o‘ngga suring — vazifani qaytaring, chapga suring — butunlay o‘chiring.',
          deletedBadge: 'Ko‘chirildi',
        },
        defaults: {
          startToday: 'Bugun',
          startTomorrow: 'Ertaga',
          startPick: 'Tanlash',
          newTaskTitle: 'Yangi vazifa',
          defaultContext: '@work',
        },
        aiPrefix: 'AI:',
        dailySummary: 'Bugun: {tasks} ta vazifa • {habits} ta odat • {goals} ta maqsad qadami',
        statuses: {
          active: 'Faol',
          in_progress: 'Fokusda',
          completed: 'Bajarildi',
          archived: 'Arxivlandi',
        },
        focus: {
          cta: 'Fokus',
          inProgress: 'Fokusda',
          cardLabel: 'Hozir bajarilmoqda',
          goalTag: 'Maqsad: {goal}',
          finishTitle: '"{task}" yakunlansinmi?',
          finishMessage: 'Bajarilgan deb belgilang yoki qoldiqni ertaga ko‘chiring.',
          done: 'Bajarildi',
          move: 'Ertaga ko‘chir',
          keep: 'Keyinga qoldir',
        },
        calendar: {
          title: 'Planner taqvimi',
          summary: '{tasks} ta vazifa • {habits} ta odat • {goals} ta maqsad qadami',
          addQuickTask: 'Tezkor vazifa',
          quickTaskTitle: 'Tezkor vazifa',
          scheduledTitle: 'Ushbu kun rejalari',
          empty: 'Bu kunda hech narsa yo‘q.',
          moveTitle: 'Vazifalarni shu kunga ko‘chirish',
          moveHere: 'Bu kunga ko‘chir',
          moveTomorrow: 'Ertaga ko‘chir',
          unscheduled: 'Sana yo‘q',
          noOtherTasks: 'Boshqa vazifalar qolmadi.',
        },
        aiSuggestions: {
          title: 'AI tavsiyasi',
          time: 'Eng yaxshi vaqt: {value}',
          duration: 'Davomiylik: {value}',
          context: 'Kontekst: {value}',
          energy: 'Energiya: {value}',
          apply: 'Tavsiyani qo‘llash',
        },
      },
      goals: {
        header: {
          title: 'Strategik maqsadlar',
          subtitle: 'Moliya va shaxsiy g‘alabalar uchun barqaror harakat',
        },
        empty: {
          title: 'Birinchi maqsadni yarating',
          subtitle:
            'Maqsad qo‘shgach, bosqichlar, prognozlar va AI tavsiyalarini kuzatishingiz mumkin. Boshlash uchun qo‘shish tugmasidan foydalaning.',
        },
        sections: {
          financial: {
            title: 'Moliyaviy maqsadlar',
            subtitle: 'Investitsiya va jamg‘arma ustuvorliklari',
          },
          personal: {
            title: 'Shaxsiy maqsadlar',
            subtitle: 'Hayot tarzi va farovonlik yutuqlari',
          },
        },
        cards: {
          summaryLabels: {
            left: 'Qoldi',
            pace: 'Surʼat',
            prediction: 'Prognoz',
          },
          actions: {
            addValue: 'Qiymat qo‘shish',
            refresh: 'Yangilash',
            edit: 'Tahrirlash',
            addValueA11y: 'Qiymat qo‘shish',
            refreshA11y: 'Maqsadni yangilash',
            editA11y: 'Maqsadni tahrirlash',
            openDetailsA11y: 'Maqsad tafsilotlarini ochish',
          },
        },
        details: {
          milestones: 'Bosqichlar',
          history: 'Tarix',
          showMore: 'Ko‘proq ko‘rsat',
        },
        nextStep: {
          title: 'Keyingi qadam',
          empty: 'Bog‘langan vazifa yo‘q',
          cta: 'Qadam qo‘shish',
        },
        linkedSummary: '{tasks} ta vazifa • {habits} ta odat',
        ai: {
          title: 'AI rejasi',
          milestones: 'Bosqichlar: boshlash → prototip → beta → chiqarish.',
          duration: 'Baholangan muddat: 3–6 oy (haftalik ko‘rib chiqish).',
          apply: 'Rejani qo‘llash',
        },
        data: {
          'dream-car': {
            title: 'Orzu mashinam',
            currentAmount: '4,1 mln so‘m',
            targetAmount: '5 mln so‘m',
            summary: {
              left: '900 000 so‘m qoldi',
              pace: '450 000 so‘m / oy',
              prediction: 'Jadvalda · mart 2025',
            },
            milestones: ['Yan 2025', 'Fev 2025', 'Mar 2025', 'Apr 2025'],
            history: [
              { label: 'Dek', delta: '+450 000 so‘m' },
              { label: 'Noy', delta: '+320 000 so‘m' },
              { label: 'Okt', delta: '+280 000 so‘m' },
            ],
            aiTip: 'Joriy surʼat bilan maqsad mart oyida bajariladi.',
            aiTipHighlight: 'Fevralga ulgurish uchun oyiga yana 100 ming qo‘shing.',
          },
          'emergency-fund': {
            title: 'Favqulodda jamg‘arma',
            currentAmount: '3,5 mln so‘m',
            targetAmount: '6 mln so‘m',
            summary: {
              left: '2,5 mln so‘m qoldi',
              pace: '300 000 so‘m / oy',
              prediction: 'Prognoz · iyun 2025',
            },
            milestones: ['Noy 2024', 'Yan 2025', 'Mar 2025', 'Iyun 2025'],
            history: [
              { label: 'Dek', delta: '+300 000 so‘m' },
              { label: 'Noy', delta: '+300 000 so‘m' },
              { label: 'Okt', delta: '+250 000 so‘m' },
            ],
            aiTip: '350 minglik badallar xavfsiz buferni saqlab turadi.',
          },
          fitness: {
            title: 'Eng yuqori forma rejasi',
            currentAmount: '92 / 210 mashg‘ulot',
            targetAmount: '210 mashg‘ulot',
            summary: {
              left: '118 mashg‘ulot qoldi',
              pace: 'Haftasiga 4 ta mashg‘ulot',
              prediction: 'Jadvalda · avgust 2025',
            },
            milestones: ['Noy 2024', 'Yan 2025', 'Apr 2025', 'Avg 2025'],
            history: [
              { label: 'Hafta 48', delta: '+4 mashg‘ulot' },
              { label: 'Hafta 47', delta: '+5 mashg‘ulot' },
              { label: 'Hafta 46', delta: '+3 mashg‘ulot' },
            ],
            aiTip: 'Barqarorlik oshmoqda. Natijani tezlashtirish uchun bir kun kardio qo‘shing.',
          },
          language: {
            title: 'Ispan tili immersioni',
            currentAmount: '34 / 50 dars',
            targetAmount: '50 dars',
            summary: {
              left: '16 dars qoldi',
              pace: 'Haftasiga 3 dars',
              prediction: 'Kutilmoqda · fevral 2025',
            },
            milestones: ['Okt 2024', 'Dek 2024', 'Yan 2025', 'Mar 2025'],
            history: [
              { label: 'Hafta 48', delta: '+3 dars' },
              { label: 'Hafta 47', delta: '+4 dars' },
              { label: 'Hafta 46', delta: '+3 dars' },
            ],
            aiTip: 'Har bir darsni 15 daqiqalik suhbat bilan mustahkamlang — tezroq ravonlikka erishasiz.',
          },
        },
      },
      habits: {
      headerTitle: 'Odatlar',
      badgeSuffix: 'kun',
      calendarTitle: 'Oylik nazorat — {month}',
      calendarLegend: { done: 'Bajarildi', miss: 'O‘tkazib yuborildi', none: 'Maʼlumot yo‘q' },
      calendarLegendHint: {
        done: '{count} kun bajarildi ({percent}%)',
        miss: '{count} kun o‘tkazib yuborildi ({percent}%)',
        none: '{count} kun belgilanmagan ({percent}%)',
      },
      challenge: {
        title: 'Chaqiriq davomiyligi',
        subtitle: 'Odatdagi 20/40/90 kunlik siklni tanlang.',
        options: { short: '20 kun', medium: '40 kun', long: '90 kun' },
        pinMessage: 'Ketma-ket {days} kunni bajarib, odatni mustahkamlang.',
      },
      calendarButton: 'Kalendarni ochish',
      stats: {
        streak: 'Seriya: {days} kun ketma-ket',
        record: 'Rekord: {days} kun',
        completion: 'Bajarilish: {percent}% ({completed}/{target} haftalik)',
        },
        supportsGoals: 'Qo‘llab-quvvatlaydi: {goals}',
        ai: {
          title: 'AI maslahatlari',
          time: 'Eng yaxshi vaqt 06:30–07:00 oralig‘ida.',
          stack: 'Suv ichish eslatmalari bilan birlashtiring.',
          apply: 'Maslahatni qo‘llash',
        },
        ctas: {
          checkIn: 'Bugun belgilash',
          startTimer: 'Taymerni boshlash',
          completed: 'Bajarildi',
          failed: 'Bajarilmadi',
          edit: 'Tahrirlash',
          delete: 'O‘chirish',
        },
        expand: {
          titles: {
            statistics: 'Statistika',
            pattern: 'Namunalar',
            achievements: 'Yutuqlar',
          },
          lines: {
            overallCompletion: 'Umumiy bajarilish: 156',
            successPercentile: 'Muvaffaqiyat foizi: 78%',
            averageStreak: 'O‘rtacha seriya: 8 kun',
            bestMonth: 'Eng yaxshi oy: noyabr (93%)',
            bestTime: 'Eng yaxshi vaqt: 7:00–7:30 (85% muvaffaqiyat)',
            worstTime: 'Eng yomon vaqt: dam olish kunlari (45%)',
            afterWeekends: 'Dam olishdan keyin: −30% ehtimol',
          },
        badges: {
          firstWeek: 'Birinchi hafta',
          monthNoBreak: 'Bir oy tanaffussiz',
          hundredCompletions: '100 marta bajarildi',
          marathoner: 'Marafonchi (42 kun ketma-ket)',
        },
      },
      empty: {
        title: 'Hali odatlar yo‘q',
        subtitle: 'Progressni kuzatish uchun rejalashtiruvchi menyusidan odat qo‘shing.',
      },
      data: {
        h1: {
          title: 'Tonggi mashg‘ulot',
            aiNote: 'Mashg‘ulotdan keyin tongda bajarib ko‘ring',
          },
          h2: {
            title: 'Meditatsiya',
            aiNote: 'AI: "Mashg‘ulotdan keyin tongda bajarib ko‘ring"',
          },
          h3: {
            title: '30 daqiqa o‘qish',
          },
          h4: {
            title: 'Kuniga 2 l suv ichish',
            aiNote: 'Yangi yutuq!',
            chips: ['+ 250 ml', '+ 500 ml', '+ 1 l'],
          },
          h5: {
            title: 'Ijtimoiy tarmoqsiz',
          },
      },
      },
    },
    plannerModals: {
      goal: uzGoalModal as AppTranslations['plannerModals']['goal'],
    },
    widgets: {
      budgetProgress: {
        title: 'Byudjet holati',
        defaults: { housing: 'Uy-joy', groceries: 'Oziq-ovqat', entertainment: 'Hordiq' },
        placeholders: {
          empty: 'Byudjetlar yaratilmagan',
          add: 'Kuzatish uchun byudjet qo‘shing',
        },
      },
      cashFlow: {
        title: 'Pul oqimi',
        summary: { income: 'Daromad', expenses: 'Xarajat', net: 'Balans' },
        days: { mon: 'Du', tue: 'Se', wed: 'Chor', thu: 'Pay', fri: 'Ju' },
      },
      dailyTasks: {
        title: 'Kundalik vazifalar',
        placeholders: ['Vazifalar yo‘q', 'Dam oling', 'Yangi vazifa qo‘shing'],
      },
      focusSessions: {
        title: 'Fokus sessiyalar',
        stats: { completed: 'Bajarildi', totalTime: 'Umumiy vaqt', nextSession: 'Keyingi sessiya' },
        placeholders: { none: 'Sessiyalar yo‘q', free: 'Kalendar bo‘sh' },
      },
      goals: {
        title: 'Maqsadlar',
        placeholderText: 'Maqsad qo‘shib natijani kuzating.',
        placeholders: ['Maqsadlar hali yo‘q', 'Yangi maqsad qo‘shing'],
      },
      habits: {
        title: 'Odatlar',
        placeholders: ['Bugunga odatlar yo‘q', 'Odat qo‘shib boshlang'],
        streakLabel: 'kunlik seriya',
        noStreak: 'Seriya hali yo‘q',
      },
      productivityInsights: {
        title: 'Samaradorlik tahlili',
        metrics: {
          focusScore: 'Fokus balli',
          tasksCompleted: 'Bajarilgan vazifalar',
          deepWork: 'Chuqur ish soati',
        },
        trendTitle: 'Fokus trendlari',
        vsLastWeek: 'o‘tgan haftaga nisbatan',
        noTrend: 'Trend maʼlumotlari yo‘q',
        days: { mon: 'Du', tue: 'Se', wed: 'Chor', thu: 'Pay', fri: 'Ju' },
      },
      spendingSummary: {
        title: 'Xarajatlar yig‘indisi',
        categories: {
          food: 'Oziq-ovqat',
          transport: 'Transport',
          shopping: 'Xaridlar',
        },
        placeholders: ['Xarajat qayd etilmagan', 'Xarid qo‘shib boshlang'],
        total: 'Jami sarf',
      },
      transactions: {
        title: 'Tranzaksiyalar',
        placeholders: ['Faoliyat qayd etilmagan', 'Tranzaksiyalarni kuzatishni boshlang'],
      },
      weeklyReview: {
        title: 'Haftalik sharh',
        stats: {
          completion: 'Bajarilish',
          focusTime: 'Fokus vaqti',
          currentStreak: 'Joriy seriya',
        },
        summary: {
          success: 'Zo‘r hafta! {completed} / {total} vazifa bajarildi.',
          empty: 'Haftalik tahlilni ochish uchun sessiyalarni yakunlang.',
        },
        streakUnit: 'kun',
      },
      wellnessOverview: {
        title: 'Salomatlik holati',
        metrics: { energy: 'Energiya', mood: 'Kayfiyat', sleep: 'Uyqu sifati' },
        messages: {
          balanced: 'Hafta barqaror o‘tdi — shu zaylda davom eting',
          logPrompt: 'Ichki holatingizni yozib boring, shunda tahlillar chiqadi',
        },
      },
    },
    language: {
      sectionTitle: 'Til',
      helperTitle: 'Eslatma',
      helperDescription:
        'Til sozlamasi tahlillar, yordamchi xabarlar va yangilanishlarga qo‘llanadi. Ayrim tajriba funksiyalar hali ingliz tilida qolishi mumkin.',
    },
    more: {
      header: {
        title: 'Ko‘proq',
        profileAction: 'Profilni ochish',
        notificationsAction: 'Bildirishnomalar',
        badgeLabel: 'Premium',
        dateLabel: '15 mart',
      },
      premiumBadge: 'Premium muddati',
      sections: {
        account: 'Profil',
        settings: 'Sozlamalar',
        data: 'Maʼlumotlar',
        integration: 'Integratsiya',
        help: 'Yordam',
      },
      accountItems: {
        profile: 'Profil',
        premium: 'Premium holati',
        achievements: 'Yutuqlar',
        statistics: 'Statistika',
      },
      settingsItems: {
        appearance: 'Ko‘rinish',
        notifications: 'Bildirishnomalar',
        aiAssistant: 'AI yordamchi',
        security: 'Xavfsizlik',
        language: 'Til va mintaqa',
      },
      dataItems: {
        synchronization: 'Sinxronlash',
        backup: 'Zaxira / Tiklash',
        export: 'Maʼlumotni eksport qilish',
        cache: 'Keshni tozalash',
      },
      integrationItems: {
        calendars: 'Kalendarlar',
        banks: 'Banklar',
        apps: 'Ilovalar',
        devices: 'Qurilmalar',
      },
      helpItems: {
        manual: 'Qo‘llanma',
        faq: 'FAQ',
        support: 'Qo‘llab-quvvatlash',
        about: 'LEORA haqida',
      },
      values: {
        enabled: 'Yoniq',
        disabled: 'O‘chiq',
        on: 'Yoqilgan',
        off: 'O‘chirilgan',
        themeLight: 'Yorug‘',
        themeDark: 'Qorong‘i',
        aiAlpha: 'Alfa',
        languageLabel: 'O‘zbekcha',
        level: 'Daraja',
      },
      logout: 'Chiqish',
    confirmLogout: {
      title: 'Chiqishni tasdiqlang',
      message: 'Haqiqatan ham tizimdan chiqmoqchimisiz?',
      cancel: 'Bekor qilish',
      confirm: 'Chiqish',
    },
  },
    profile: {
      title: 'Profil',
      sections: {
        personal: 'Shaxsiy maʼlumotlar',
        stats: 'Foydalanish statistikasi',
        preferences: 'Ochiq profil',
        finance: 'Moliya sozlamalari',
        actions: 'Amallar',
      },
      fields: {
        fullName: 'Ism familiya',
        email: 'Email',
        phone: 'Telefon',
        username: 'Taxallus',
        joined: 'Qo‘shilgan sana',
        bio: 'Qisqacha maʼlumot',
        visibility: 'Profil ko‘rinishi',
        visibilityOptions: { public: 'Ochiq', friends: 'Faqat do‘stlar', private: 'Yopiq' },
        showLevel: 'Daraja nishonini ko‘rsatish',
        showAchievements: 'Yutuqlarni ko‘rsatish',
        showStatistics: 'Statistikani ko‘rsatish',
      },
      finance: {
        regionLabel: 'Asosiy mintaqa',
        currencyLabel: 'Ko‘rsatiladigan valyuta',
        regionSheetTitle: 'Mintaqani tanlang',
        currencySheetTitle: 'Valyutani tanlang',
        currencySearchPlaceholder: 'Valyutani qidiring',
        fxTitle: 'Valyuta kurslari',
        fxDescription: 'Provayderdan maʼlumotni sinxronlang yoki kursni qo‘lda kiriting.',
        fxProviderLabel: 'Kurs provayderi',
        fxProviders: {
          central_bank_stub: 'Markaziy bank',
          market_stub: 'Bozor',
        },
        fxSyncButton: 'Kurslarni yangilash',
        fxSyncing: 'Yangilanmoqda...',
        fxSyncSuccess: 'Kurslar {provider} orqali yangilandi',
        fxSyncError: 'Kurslarni yangilab bo‘lmadi. Qayta urinib ko‘ring.',
        fxLastSync: 'Oxirgi yangilanish: {value}',
        fxManualTitle: 'Qo‘lda kurs',
        fxManualHint: '{base} ga nisbatan kurs',
        fxManualCurrencyLabel: 'Valyuta',
        fxOverridePlaceholder: 'Kursni kiriting',
        fxOverrideButton: 'Saqlash',
        fxOverrideSuccess: '{currency} uchun kurs saqlandi',
        fxOverrideError: 'To‘g‘ri qiymat kiriting',
        fxOverrideBaseError: 'Bazaga teng bo‘lmagan valyutani tanlang',
        fxOverrideSheetTitle: 'Qo‘lda kurs uchun valyuta',
      },
      stats: {
        daysWithApp: 'LEORA bilan kunlar',
        completedTasks: 'Bajargan vazifalar',
        activeTasks: 'Faol vazifalar',
        level: 'Joriy daraja',
      },
      xp: {
        label: 'XP jarayoni',
        toNext: 'Keyingi darajaga {value} XP',
      },
      buttons: {
        edit: 'Profilni tahrirlash',
        save: 'Saqlash',
        cancel: 'Bekor qilish',
        delete: 'Akkauntni o‘chirish',
        logout: 'Chiqish',
        changePhoto: 'Rasmni almashtirish',
        removePhoto: 'Rasmni o‘chirish',
        confirmDeleteTitle: 'Akkauntni o‘chirish',
        confirmDeleteMessage: 'Barcha maʼlumotlar butunlay o‘chiriladi. Davom etasizmi?',
        confirmDeleteConfirm: 'O‘chirish',
        confirmDeleteCancel: 'Bekor qilish',
      },
    },
    financeScreens: {
      tabs: {
        review: 'Umumiy',
        accounts: 'Hisoblar',
        transactions: 'Tranzaksiyalar',
        budgets: 'Byudjetlar',
        analytics: 'Analitika',
        debts: 'Qarzlar',
      },
      goalActions: {
        connectFinance: 'Moliya bilan bog‘lash',
        createBudget: 'Maqsad uchun byudjet yarating',
        addContribution: 'Hissa qo‘shish',
      },
      review: {
        totalBalance: 'Umumiy balans',
        income: 'Daromad',
        outcome: 'Xarajat',
        monthBalance: 'Oyning oxiridagi balans',
        used: 'Sarflandi',
        progress: 'Jarayon',
        expenseStructure: 'Xarajatlar tuzilmasi',
        recentTransactions: 'So‘nggi tranzaksiyalar',
        seeAll: 'Hammasini ko‘rish',
        importantEvents: 'Muhim hodisalar',
        table: { type: 'Turi', amount: 'Summasi', date: 'Sana' },
        fxQuick: {
          title: 'Valyuta boshqaruvi',
          providerLabel: 'Provayder',
          providers: {
            central_bank_stub: 'Markaziy bank',
            market_stub: 'Bozor',
          },
          syncButton: 'Kurslarni yangilash',
          syncDescription: 'Provayderdan oxirgi kurslarni oling',
          syncing: 'Yangilanmoqda...',
          syncSuccess: 'Kurslar {provider} orqali yangilandi',
          syncError: 'Kurslarni yangilab bo‘lmadi. Qayta urinib ko‘ring.',
          lastSync: 'Oxirgi yangilanish: {value}',
          overrideButton: 'Qo‘lda kurs',
          overrideHint: '{base} ga nisbatan kurs',
          overrideTitle: 'Qo‘lda kurs',
          overridePlaceholder: 'Qiymat kiriting',
          overrideConfirm: 'Saqlash',
          overrideCancel: 'Bekor qilish',
        overrideSuccess: '{currency} uchun kurs saqlandi',
        overrideError: 'To‘g‘ri qiymat kiriting',
        overrideBaseError: 'Bazaga teng bo‘lmagan valyutani tanlang',
      },
      accountFilterTitle: 'Hisoblarni tanlang',
      accountFilterAll: 'Barcha hisoblar',
      accountFilterSelected: '{count} ta tanlandi',
      accountFilterSelectAll: 'Hammasini tanlash',
      accountFilterApply: 'Qo‘llash',
      accountFilterCurrencyLabel: 'Ko‘rsatiladigan valyuta',
      monitorTitle: 'Balans monitoringi',
      monitorSearchPlaceholder: 'Tranzaksiyalarni qidiring',
      monitorAccounts: 'Hisoblar',
      monitorTypesTitle: 'Tranzaksiya turlari',
      monitorTypes: {
        income: 'Daromad',
        expense: 'Xarajat',
        transfer: 'Konvertatsiya',
      },
      monitorDateFrom: 'Boshlanish',
      monitorDateTo: 'Tugash',
      monitorResults: 'Tranzaksiyalar',
      monitorNoDate: 'Tanlanmagan',
      monitorEmpty: 'Filtrlarga mos tranzaksiya topilmadi',
      monitorApply: 'Tugatish',
      monitorReset: 'Filtrlarni tozalash',
    },
      accounts: {
        header: 'Hisoblarim',
        income: 'Daromad',
        outcome: 'Xarajat',
        goalProgress: '{value}% maqsaddan',
        historyTitle: 'Tranzaksiya tarixi',
        historyHeaders: { type: 'Turi', amount: 'Summasi', time: 'Vaqti' },
        actions: { edit: 'Tahrirlash', archive: 'Arxivlash', delete: 'O‘chirish' },
        modal: {
          titleAdd: 'Yangi hisob qo‘shish',
          titleEdit: 'Hisobni tahrirlash',
          nameLabel: 'Nomi',
          namePlaceholder: 'Hisob nomi',
          descriptionLabel: 'Tavsif',
          descriptionPlaceholder: 'Tavsif',
          typeLabel: 'Turi',
          addType: 'Tur qo‘shish',
          newTypePlaceholder: 'Yangi tur nomi',
          saveType: 'Turni saqlash',
          currencyLabel: 'Valyuta',
          amountLabel: 'Summasi',
          amountPlaceholder: 'Summasi ({currency})',
          primaryActionAdd: 'Qo‘shish',
          primaryActionSave: 'Saqlash',
          typeOptions: {
            cash: 'Naqd',
            card: 'Karta',
            savings: 'Jamg‘arma',
            usd: 'Kredit',
            crypto: 'Kripto',
            other: 'Boshqa',
            custom: 'Moslashgan',
          },
          iconOptions: {
            wallet: 'Hamyon',
            creditCard: 'Karta',
            piggyBank: 'Jamg‘arma',
            bank: 'Bank',
            briefcase: 'Biznes',
            coins: 'Tangalar',
            sparkles: 'Boshqa',
            bitcoin: 'Kripto',
            shield: 'Xavfsiz',
            trendingUp: 'O‘sish',
          },
          currencyLabels: {
            UZS: 'O‘zbekiston so‘mi',
            USD: 'AQSh dollari',
            EUR: 'Yevro',
            GBP: 'Funt sterling',
            TRY: 'Turk lirasi',
            SAR: 'Saudiya riyoli',
            AED: 'BAA dirhami',
            USDT: 'Tether (USDT)',
            RUB: 'Rossiya rubli',
          },
        },
      },
      transactions: {
        header: 'Tranzaksiyalar tarixi',
        details: {
          title: 'Tranzaksiya tafsilotlari',
          type: 'Tranzaksiya turi',
          amount: 'Summasi',
          account: 'Hisob',
          category: 'Kategoriya',
          date: 'Sana',
          note: 'Izoh',
          relatedDebt: 'Bog‘langan qarz',
          close: 'Yopish',
        },
        filterSheet: {
          title: 'Tranzaksiyalarni filtrlash',
          dateRange: 'Sana oralig‘i',
          category: 'Kategoriya',
          accounts: 'Hisoblar',
          type: 'Tranzaksiya turi',
          amount: 'Summalar oralig‘i',
          from: 'Dan',
          to: 'Gacha',
          close: 'Yopish',
          clearHint: 'Tozalash uchun bosing va ushlab turing',
          selectDate: 'Sanani tanlang',
          reset: 'Tozalash',
          apply: 'Qo‘llash',
          all: 'Hammasi',
          typeOptions: {
            income: 'Daromad',
            expense: 'Xarajat',
            transfer: 'Konvertatsiya',
            debt: 'Qarz',
          },
        },
        quick: {
          incomeHeader: '+ Daromad',
          outcomeHeader: '- Xarajat',
          amountPlaceholder: 'Summani kiriting',
          debtOwedToYouLabel: 'Kim sizga qarzdor?',
          debtOwedToYouPlaceholder: 'Qarzdor ismi',
          debtYouOweLabel: 'Kimga qarzdorsiz?',
          debtYouOwePlaceholder: 'Kimga qarzdor ekaningiz',
          categoryAddTitle: 'Kategoriya qo‘shish',
          categoryEditTitle: 'Kategoriyani tahrirlash',
          categoryPlaceholder: 'Kategoriya nomi',
          save: 'Yozuvni saqlash',
          update: 'O‘zgarishlarni saqlash',
        },
        transferForm: {
          title: 'Hisoblar orasida o‘tkazma',
          submit: 'O‘tkazish',
          amountPlaceholder: 'Summasi',
          fromAccount: 'Qaysi hisobdan',
          toAccount: 'Qaysi hisobga',
          exchangeRate: 'Valyuta kursi',
          auto: 'Avto',
          conversionInfo: '{amount} qabul qilinadi',
          resetRate: 'Avto kursga qaytarish',
          date: 'Sana',
          time: 'Vaqt',
          notePlaceholder: 'Izoh yoki kontekst qo‘shing…',
          pickerDone: 'Tayyor',
          selectAccount: 'Hisobni tanlang',
          rateInfoTemplate:
            'Kurs: 1 {toCurrency} = {rate} {fromCurrency}. Qabul qilingan: {amount}',
        },
      },
      budgets: {
        today: 'Bugungi byudjet sharhi',
        dateTemplate: '{date} uchun byudjet sharhi',
      mainTitle: 'Asosiy byudjet',
      categoriesTitle: 'Kategoriyalar',
      addCategory: 'Kategoriya qo‘shish',
      setLimit: 'Limit qo‘yish',
      states: { exceeding: 'Limitdan oshgan', fixed: 'Belgilangan', within: 'Doirada' },
      detail: {
        title: 'Byudjet tafsilotlari',
        status: 'Holat',
        linkedGoal: 'Bog‘langan maqsad',
        goalUnlinked: 'Maqsad bog‘lanmagan',
        accountLabel: 'Hisob',
        currencyLabel: 'Byudjet valyutasi',
        limitLabel: 'Limit',
        spentLabel: 'Sarflandi',
        remainingLabel: 'Qoldiq',
        balanceLabel: 'Joriy balans',
        createdAt: 'Yaratilgan',
        updatedAt: 'Yangilangan',
        categoriesLabel: 'Kategoriyalar',
        notifyLabel: 'Limit oshsa xabarnoma',
        valueAddTitle: 'Qiymat qo‘shish',
        valueAddAccountCurrency: 'Hisob valyutasi',
        valueAddBudgetCurrency: 'Byudjet valyutasi',
        valueAddDisplayCurrency: 'Ko‘rsatish valyutasi',
        actions: {
          title: 'Harakatlar',
          edit: 'Byudjetni tahrirlash',
          delete: 'Byudjetni o‘chirish',
          viewGoal: 'Maqsadni ko‘rish',
          viewTransactions: 'Tranzaksiyalar',
          addToBudget: 'Byudjetni to‘ldirish',
          confirmDeleteTitle: 'Byudjet o‘chirilsinmi?',
          confirmDeleteMessage: 'Byudjet arxivlanadi va maqsadlardan uziladi.',
          confirmDeleteConfirm: 'O‘chirish',
          confirmDeleteCancel: 'Bekor qilish',
        },
      },
      form: {
        nameLabel: 'Byudjet nomi',
        namePlaceholder: 'Byudjet nomi',
        limitPlaceholder: '0',
        periodLabel: 'Byudjet davri',
        periodOptions: {
          weekly: 'Haftalik',
          monthly: 'Oylik',
          custom_range: 'Moslashuvchan davr',
        },
        selectedRangeLabel: 'Tanlangan davr: {range}',
        customRange: {
          start: 'Boshlanish sanasi',
          end: 'Yakun sanasi',
          helper: 'Moslashuvchan davrni tanlang',
          error: 'Boshlanish va tugash sanalarini belgilang',
        },
      },
    },
      analytics: {
        header: 'Moliyaviy analitika',
        expenseDynamics: 'Xarajatlar dinamikasi',
        comparison: 'O‘tgan oy bilan taqqoslash',
        topExpenses: 'Kategoriyalar bo‘yicha top xarajatlar',
        aiInsights: 'AI tavsiyalari',
        stats: { peak: 'Pik', average: 'O‘rtacha', trend: 'Trend' },
        comparisonRows: { income: 'Daromad:', outcome: 'Xarajat:', savings: 'Jamg‘arma:' },
      },
      debts: {
        sections: { incoming: 'Qarzlar', outgoing: 'Mening qarzlarim' },
        timeline: {
          incoming: 'Qaytarish muddati',
          outgoing: 'Davr',
          today: 'Bugun qaytariladi',
          inDays: '{count} kun ichida qaytariladi',
          overdue: '{count} kun kechikkan',
        },
        actions: {
          incoming: { notify: 'Eslatish', cancel: 'Qarzdan voz kechish' },
          outgoing: { plan: 'Rejalashtirish', partial: 'Qisman to‘lash' },
        },
        summary: {
          balanceLabel: 'Umumiy balans',
          givenLabel: 'Berilgan qarz',
          takenLabel: 'Umumiy qarz',
          givenChange: '+15% Dekabr',
          takenChange: '-8% Dekabr',
        },
        modal: {
          title: 'Yangi qarz qo‘shish',
          editTitle: 'Qarzlarni tahrirlash',
          subtitle: 'Olingan va berilgan qarzlarni kuzating',
          typeLabel: 'Turi',
          borrowedLabel: 'Men qarzdorman',
          lentLabel: 'Menga qarzdor',
          person: 'Ism / Shaxs',
          personPlaceholder: 'Bu qarz kim uchun?',
          amount: 'Summasi',
          accountLabel: 'Hamyon',
          accountHelper: 'Qaysi hisobdan mablag‘ olinadi',
          accountPickerTitle: 'Hamyonni tanlang',
          currencyLabel: 'Valyuta',
          currencyHelper: 'Qarz valyutasini tanlang',
          currencyPickerTitle: 'Valyutani tanlang',
          dateLabel: 'Sana',
          changeDate: 'Sana o‘zgartirish',
          clear: 'Bekor qilish',
          selectAccount: 'Hisobni tanlang',
          expectedReturn: 'Qaytarish sanasi',
          expectedPlaceholder: 'Qaytarish sanasi belgilanmagan',
        selectDate: 'Sana tanlang',
        note: 'Izoh',
        notePlaceholder: 'Qo‘shimcha izoh yoki tafsilot kiriting…',
        personDirectional: {
          incoming: { label: 'Kimdan oldingiz?', placeholder: 'Qarz bergan shaxs' },
          outgoing: { label: 'Kimga beryapsiz?', placeholder: 'Qarz oluvchi shaxs' },
        },
        toggles: { incoming: 'Menga qarzdor', outgoing: 'Men qarzdorman' },
        manageActions: 'Qarzni boshqarish',
        accountDirectional: {
          incoming: {
            label: 'Qaysi hisobraqamga tushadi',
            helper: 'Pul tanlangan hisobga tushadi ({accountCurrency}).',
          },
          outgoing: {
            label: 'Qaysi hisobdan olinadi',
            helper: 'Pul tanlangan hisobdan olinadi ({accountCurrency}).',
          },
        },
        currencyFlow: {
          incoming: 'Siz {debtCurrency} olasiz → {accountCurrency} hisobiga tushadi',
          outgoing: 'Siz {debtCurrency} berasiz → {accountCurrency} hisobidan olinadi',
        },
        counterpartyPickerTitle: 'Shaxsni tanlang',
        counterpartySearchPlaceholder: 'Ism bo‘yicha qidiring',
        counterpartyAddAction: '“{query}” ni qo‘shish',
        counterpartyEmpty: 'Hozircha ro‘yxat bo‘sh. Avval odam qo‘shing.',
        counterpartyActions: {
          renameTitle: 'Ismni o‘zgartirish',
          renamePlaceholder: 'Yangi ism kiriting',
          renameSave: 'Saqlash',
          renameCancel: 'Bekor qilish',
          deleteTitle: 'Foydalanuvchini o‘chirilsinmi?',
          deleteDescription: 'Bu foydalanuvchi butunlay o‘chiriladi.',
          deleteConfirm: 'O‘chirish',
          deleteBlocked: 'Qarz bilan bog‘langan foydalanuvchini o‘chirib bo‘lmaydi.',
          duplicateName: 'Bunday ism allaqachon mavjud.',
        },
          buttons: {
            cancel: 'Bekor qilish',
            save: 'Saqlash',
            saveChanges: 'Saqlash',
            delete: 'O‘chirish',
          },
          defaults: { name: 'Yangi qarz', description: 'Tavsif', due: 'Muddat belgilanmagan' },
          deleteTitle: 'Qarzlarni o‘chirish',
          deleteDescription: 'Bu qarzni o‘chirib tashlamoqchimisiz? Bu amalni qaytarib bo‘lmaydi.',
        status: {
          lent: 'Siz qarz berdingiz',
          borrowed: 'Siz qarz oldingiz',
        },
        scheduleTitle: 'To‘lov jadvali',
        reminderTitle: 'Bildirishnomalar',
        reminderToggle: 'Bildirishnomani yoqish',
        reminderTimeLabel: 'Bildirish vaqti (HH:MM)',
        reminderEnabledLabel: 'Bildirishnomalar yoqilgan',
        reminderDisabledLabel: 'Bildirishnomalar o‘chirilgan',
        payment: {
          title: 'To‘lovni qayd etish',
          amount: 'To‘lov summasi',
          accountLabel: 'Qaysi hisobdan',
          currencyLabel: 'To‘lov valyutasi',
          note: 'To‘lov izohi',
          helper: 'Qisman to‘lov va yopishlarni kuzatish uchun.',
          submit: 'To‘lovni qo‘llash',
          limitError: 'To‘lov miqdori qarz qoldig‘idan oshib ketdi',
        },
        actionsBar: {
          pay: 'Qarzni to‘lash',
          partial: 'Qisman to‘lov',
          notify: 'Bildirishnoma',
          schedule: 'Sanalarni boshqarish',
        },
        manualRate: {
          title: 'Konvertatsiya',
          description:
            'Qarz valyutasi {debtCurrency}. Hisob valyutasi {accountCurrency}. {accountCurrency} bo‘yicha yechib olinadigan summani kiriting.',
          toggle: 'Qo‘lda kiritish',
          amountLabel: '{currency} bo‘yicha yechib olinadigan summa',
        },
        fullPaymentTitle: 'Qarzini to‘liq to‘lash',
        fullPaymentDescription: 'Qolgan {amount} summa to‘liq yopiladi.',
        fullPaymentSubmit: 'To‘liq to‘lash',
      },
      },
    },
  },
  ar: {
    common: {
      close: 'إغلاق',
      cancel: 'إلغاء',
      save: 'حفظ',
      add: 'إضافة',
      delete: 'حذف',
      apply: 'تطبيق',
      reset: 'إعادة ضبط',
      done: 'تم',
      select: 'اختيار',
    },
    auth: {
      common: {
        socialDivider: 'أو تابع عبر',
        languageButtonLabel: 'اللغة',
        languageHelper: 'اختر لغة هذه الشاشة.',
        languageSheetTitle: 'اختر اللغة',
      },
      validation: {
        emailOrUsernameRequired: 'أدخل البريد أو اسم المستخدم',
        emailRequired: 'البريد مطلوب',
        emailInvalid: 'أدخل بريداً صالحاً',
        nameRequired: 'أدخل الاسم الكامل',
        passwordRequired: 'كلمة المرور مطلوبة',
        passwordConfirmRequired: 'أكد كلمة المرور',
        passwordMismatch: 'كلمتا المرور غير متطابقتين',
        passwordMinLength: 'على الأقل ٨ أحرف',
        passwordUppercase: 'أضف حرفاً كبيراً',
        passwordLowercase: 'أضف حرفاً صغيراً',
        passwordNumber: 'أضف رقماً',
        passwordSpecial: 'أضف رمزاً خاصاً',
      },
      login: {
        title: 'تسجيل الدخول',
        description: 'أهلاً بعودتك! أدخل بياناتك للمتابعة.',
        fields: {
          emailOrUsername: 'البريد أو اسم المستخدم',
          password: 'كلمة المرور',
        },
        placeholders: {
          emailOrUsername: 'name@example.com',
          password: 'أدخل كلمة المرور',
        },
        rememberMe: 'تذكرني',
        forgotPassword: 'نسيت كلمة المرور؟',
        buttons: {
          submit: 'دخول',
        },
        links: {
          noAccount: 'ليس لديك حساب؟',
          signUp: 'إنشاء حساب',
        },
        alerts: {
          failureTitle: 'فشل تسجيل الدخول',
          failureMessage: 'تحقق من البيانات وحاول مجدداً.',
          socialTitle: 'قريباً',
          socialMessage: 'تسجيل الدخول عبر {provider} متاح قريباً.',
        },
        errors: {
          missingCredentials: 'أدخل البريد/اسم المستخدم وكلمة المرور',
          invalidCredentials: 'بيانات الدخول غير صحيحة',
          generic: 'حدث خطأ ما. حاول لاحقاً.',
        },
      },
      register: {
        title: 'إنشاء حساب',
        description: 'أنشئ حساباً للمتابعة.',
        fields: {
          email: 'البريد الإلكتروني',
          fullName: 'الاسم الكامل',
          password: 'كلمة المرور',
          confirmPassword: 'تأكيد كلمة المرور',
        },
        placeholders: {
          email: 'name@example.com',
          fullName: 'أدخل اسمك الكامل',
          password: 'أنشئ كلمة مرور',
          confirmPassword: 'أعد إدخال كلمة المرور',
        },
        buttons: {
          submit: 'تسجيل',
          socialComingSoon: 'قريباً',
        },
        links: {
          haveAccount: 'لديك حساب بالفعل؟',
          signIn: 'تسجيل الدخول',
        },
        languageSelector: {
          label: 'اللغة',
          helper: 'اختر لغة التسجيل.',
        },
        selectors: {
          sectionTitle: 'المنطقة والعملة',
          helper: 'سيتم استخدام {currency} كعملة أساسية',
          regionLabel: 'المنطقة',
          currencyLabel: 'العملة',
          currencyHint: 'اضغط للتغيير',
        },
        sheets: {
          regionTitle: 'اختر المنطقة',
          currencyTitle: 'اختر العملة',
          currencySearch: 'ابحث عن العملة',
          languageTitle: 'اختر اللغة',
        },
        alerts: {
          successTitle: 'تم التسجيل بنجاح',
          successMessage: 'مرحباً بك! تم إنشاء حسابك.',
          failureTitle: 'فشل التسجيل',
          socialTitle: 'قريباً',
          socialMessage: 'سيتم دعم التسجيل عبر {provider} قريباً.',
        },
        passwordGuide: {
          strengthLabel: 'قوة كلمة المرور',
          helper: 'استخدم مزيجاً من الأحرف والأرقام والرموز.',
          levels: {
            empty: 'ابدأ بالكتابة',
            weak: 'ضعيفة',
            medium: 'متوسطة',
            strong: 'قوية',
          },
          requirementsTitle: 'متطلبات كلمة المرور',
          requirements: {
            length: 'على الأقل {count} حرفاً',
            uppercase: 'حرف كبير واحد',
            lowercase: 'حرف صغير واحد',
            number: 'رقم واحد',
            special: 'رمز خاص واحد',
          },
        },
        errors: {
          missingFields: 'أكمل الحقول المطلوبة',
          selectRegion: 'اختر منطقتك',
          passwordMismatch: 'كلمتا المرور غير متطابقتين',
          emailInvalid: 'أدخل بريداً صالحاً',
          emailExists: 'هذا البريد مستخدم مسبقاً',
          generic: 'تعذر إكمال التسجيل. حاول لاحقاً.',
        },
      },
      forgot: {
        languageSelector: {
          label: 'اللغة',
          helper: 'اختر لغة استرجاع كلمة المرور.',
        },
        emailStep: {
          title: 'نسيت كلمة المرور',
          description: 'أدخل بريدك الإلكتروني لإعادة التعيين.',
          fieldLabel: 'البريد الإلكتروني',
          placeholder: 'name@example.com',
          button: {
            submit: 'إرسال الرمز',
            loading: 'جارٍ الإرسال…',
          },
        },
        otpStep: {
          title: 'أدخل رمز التحقق',
          description: 'أرسلنا رمزاً إلى {email}',
          timerHint: 'إرسال رمز جديد خلال {time}',
          resend: 'إعادة إرسال الرمز',
          back: 'العودة إلى خطوة البريد',
          button: {
            submit: 'تحقق من الرمز',
            loading: 'جارٍ التحقق…',
          },
        },
        alerts: {
          codeSentTitle: 'تم إرسال الرمز',
          codeSentMessage: 'تحقق من بريدك لرمز مكوّن من 4 أرقام (يظهر أيضاً في وحدة التحكم أثناء التجربة).',
          codeResentTitle: 'تمت إعادة الإرسال',
          codeResentMessage: 'أرسلنا رمز تحقق جديد.',
          otpVerifiedTitle: 'تم التحقق من الرمز',
          otpVerifiedMessage: 'يمكنك الآن تسجيل الدخول مجدداً.',
          genericErrorTitle: 'خطأ',
          genericErrorMessage: 'حدث خطأ ما. حاول مرة أخرى.',
          okButton: 'حسناً',
        },
        footer: {
          remember: 'تتذكر كلمة المرور؟',
          signIn: 'تسجيل الدخول',
        },
        errors: {
          invalidEmail: 'أدخل بريداً صالحاً',
          generic: 'حدث خطأ ما. حاول مرة أخرى.',
          otpExpired: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
          otpInvalid: 'الرمز غير صحيح.',
          otpIncomplete: 'أدخل رمز التحقق كاملاً.',
        },
      },
    },
    addTask: arAddTask as AppTranslations['addTask'],
    universalFab: arUniversalFab as AppTranslations['universalFab'],
    home: {
      header: {
        todayLabel: 'اليوم',
        openProfile: 'افتح الملف الشخصي',
        previousDay: 'اليوم السابق',
        nextDay: 'اليوم التالي',
      },
      greeting: {
        morning: 'صباح الخير',
        afternoon: 'نهار سعيد',
        evening: 'مساء الخير',
        night: 'تصبح على خير',
        defaultName: 'صديقي',
      },
      status: {
        online: 'متصل',
        offline: 'غير متصل',
        connecting: 'جارٍ الفحص…',
      },
      widgets: {
        title: 'الويدجت',
        edit: 'تحرير',
        emptyTitle: 'لا توجد عناصر واجهة',
        emptySubtitle: 'اضغط "تحرير" لإضافة عناصر إلى لوحتك.',
      },
      progress: {
        tasks: 'المهام',
        budget: 'الميزانية',
        habit: 'العادات',
        progressSuffix: 'التقدم',
      },
    },
    tabs: {
      home: 'الرئيسية',
      finance: 'الماليات',
      planner: 'المخطط',
      insights: 'إنسايت',
      more: 'المزيد',
    },
    calendar: {
      todayLabel: 'اليوم',
      selectDateTitle: 'اختر التاريخ',
    },
    plannerScreens: {
      tabs: {
        tasks: 'المهام',
        goals: 'الأهداف',
        habits: 'العادات',
      },
      tasks: {
        headerTemplate: 'خطط لـ {date}',
        todayLabel: 'اليوم',
        filter: 'تصفية',
        sectionCountLabel: 'مهام',
        sectionTip:
          'اضغط مطولاً ثم اسحب لليمين لوضع علامة منجزة، أو لليسار للحذف (حتى المهام المكتملة).',
        sections: {
          morning: { title: 'الصباح', time: '(06:00 - 12:00)' },
          afternoon: { title: 'بعد الظهر', time: '(12:00 - 18:00)' },
          evening: { title: 'المساء', time: '(18:00 - 22:00)' },
        },
        actions: {
          complete: 'إكمال',
          restore: 'استعادة',
          remove: 'حذف',
          delete: 'حذف المهمة',
        },
        history: {
          title: 'سجل المهام',
          subtitle: 'اسحب للاستعادة أو الحذف',
          tip: 'اضغط قليلاً ثم اسحب لليمين لاستعادة المهمة أو لليسار لحذفها نهائياً.',
          deletedBadge: 'مؤجل',
        },
        defaults: {
          startToday: 'اليوم',
          startTomorrow: 'غداً',
          startPick: 'اختيار',
          newTaskTitle: 'مهمة جديدة',
          defaultContext: '@work',
        },
        aiPrefix: 'الذكاء الاصطناعي:',
        dailySummary: 'اليوم: {tasks} مهام • {habits} عادات • {goals} خطوات هدف',
        statuses: {
          active: 'نشطة',
          in_progress: 'وضع تركيز',
          completed: 'منجزة',
          archived: 'مؤرشفة',
        },
        focus: {
          cta: 'تركيز',
          inProgress: 'في التركيز',
          cardLabel: 'المهمة الحالية',
          goalTag: 'الهدف: {goal}',
          finishTitle: 'إنهاء "{task}"؟',
          finishMessage: 'علّمها منجزة أو انقل الباقي إلى الغد.',
          done: 'منجز',
          move: 'انقل للغد',
          keep: 'لاحقاً',
        },
        calendar: {
          title: 'تقويم المخطط',
          summary: '{tasks} مهام • {habits} عادات • {goals} خطوات هدف',
          addQuickTask: 'مهمة سريعة',
          quickTaskTitle: 'مهمة سريعة',
          scheduledTitle: 'المجدول لهذا اليوم',
          empty: 'لا شيء مجدول بعد.',
          moveTitle: 'انقل المهام إلى هذا اليوم',
          moveHere: 'انقل هنا',
          moveTomorrow: 'انقل للغد',
          unscheduled: 'بدون تاريخ',
          noOtherTasks: 'لا توجد مهام أخرى.',
        },
        aiSuggestions: {
          title: 'توصية الذكاء الاصطناعي',
          time: 'أفضل توقيت: {value}',
          duration: 'المدة: {value}',
          context: 'السياق: {value}',
          energy: 'الطاقة: {value}',
          apply: 'تطبيق التوصية',
        },
      },
      goals: {
        header: {
          title: 'أهداف استراتيجية',
          subtitle: 'زخم مستمر للنجاحات المالية والشخصية',
        },
        empty: {
          title: 'أنشئ هدفك الأول',
          subtitle:
            'تابع المراحل والتوقعات ورؤى الذكاء الاصطناعي بعد إضافة الهدف الأول. استخدم زر الإضافة للبدء.',
        },
        sections: {
          financial: {
            title: 'أهداف مالية',
            subtitle: 'تركيز على الاستثمار وأولويات الادخار',
          },
          personal: {
            title: 'أهداف شخصية',
            subtitle: 'ترقيات نمط الحياة ونجاحات العافية',
          },
        },
        cards: {
          summaryLabels: {
            left: 'متبقٍ',
            pace: 'الوتيرة',
            prediction: 'التوقع',
          },
          actions: {
            addValue: 'إضافة تقدم',
            refresh: 'تحديث',
            edit: 'تحرير',
            addValueA11y: 'إضافة تقدم',
            refreshA11y: 'تحديث الهدف',
            editA11y: 'تحرير الهدف',
            openDetailsA11y: 'فتح تفاصيل الهدف',
          },
        },
        details: {
          milestones: 'المعالم',
          history: 'السجل',
          showMore: 'عرض المزيد',
        },
        nextStep: {
          title: 'الخطوة التالية',
          empty: 'لا مهام مرتبطة',
          cta: 'أضف خطوة',
        },
        linkedSummary: '{tasks} مهام • {habits} عادات',
        ai: {
          title: 'خطة الذكاء الاصطناعي',
          milestones: 'المعالم: بدء → نموذج أولي → نسخة تجريبية → إطلاق.',
          duration: 'المدة المقدرة: 3–6 أشهر مع مراجعة أسبوعية.',
          apply: 'تطبيق الخطة',
        },
        data: {
          'dream-car': {
            title: 'سيارة الأحلام',
            currentAmount: '4.1 مليون سوم',
            targetAmount: '5 مليون سوم',
            summary: {
              left: 'متبقٍ 900 000 سوم',
              pace: '450 000 سوم / شهر',
              prediction: 'على المسار · مارس 2025',
            },
            milestones: ['ينا 2025', 'فبر 2025', 'مارس 2025', 'أبريل 2025'],
            history: [
              { label: 'ديس', delta: '+450 000 سوم' },
              { label: 'نوف', delta: '+320 000 سوم' },
              { label: 'أكت', delta: '+280 000 سوم' },
            ],
            aiTip: 'بالوتيرة الحالية ستصل إلى الهدف في مارس.',
            aiTipHighlight: 'زد المساهمة الشهرية 100 ألف لتحقق فبراير.',
          },
          'emergency-fund': {
            title: 'صندوق الطوارئ',
            currentAmount: '3.5 مليون سوم',
            targetAmount: '6 مليون سوم',
            summary: {
              left: 'متبقٍ 2.5 مليون سوم',
              pace: '300 000 سوم / شهر',
              prediction: 'توقع · يونيو 2025',
            },
            milestones: ['نوف 2024', 'ينا 2025', 'مارس 2025', 'يونيو 2025'],
            history: [
              { label: 'ديس', delta: '+300 000 سوم' },
              { label: 'نوف', delta: '+300 000 سوم' },
              { label: 'أكت', delta: '+250 000 سوم' },
            ],
            aiTip: 'رفع المساهمة إلى 350 ألف يحافظ على هامش الأمان.',
          },
          fitness: {
            title: 'خطة لياقة قصوى',
            currentAmount: '92 / 210 حصة',
            targetAmount: '210 حصة',
            summary: {
              left: 'متبقٍ 118 حصة',
              pace: '4 حصص / أسبوع',
              prediction: 'على المسار · أغسطس 2025',
            },
            milestones: ['نوف 2024', 'ينا 2025', 'أبريل 2025', 'أغسطس 2025'],
            history: [
              { label: 'أسبوع 48', delta: '+4 حصص' },
              { label: 'أسبوع 47', delta: '+5 حصص' },
              { label: 'أسبوع 46', delta: '+3 حصص' },
            ],
            aiTip: 'الالتزام يتحسن. أضف يوم كارديو إضافي لنتائج أسرع.',
          },
          language: {
            title: 'انغماس اللغة الإسبانية',
            currentAmount: '34 / 50 درساً',
            targetAmount: '50 درساً',
            summary: {
              left: 'متبقٍ 16 درساً',
              pace: '3 دروس / أسبوع',
              prediction: 'الوصول · فبراير 2025',
            },
            milestones: ['أكتوبر 2024', 'ديسمبر 2024', 'ينا 2025', 'مارس 2025'],
            history: [
              { label: 'أسبوع 48', delta: '+3 دروس' },
              { label: 'أسبوع 47', delta: '+4 دروس' },
              { label: 'أسبوع 46', delta: '+3 دروس' },
            ],
            aiTip: 'أضف ملخصاً حوارياً لمدة 15 دقيقة بعد كل درس لبلوغ الطلاقة أسرع.',
          },
        },
      },
      habits: {
        headerTitle: 'العادات',
        badgeSuffix: 'يوم',
        calendarTitle: 'سجل الشهر — {month}',
        calendarLegend: { done: 'منجز', miss: 'مفوّت', none: 'لا بيانات' },
        calendarLegendHint: {
          done: '{count} يومًا منجزًا ({percent}%)',
          miss: '{count} يومًا مفوّتًا ({percent}%)',
          none: '{count} يومًا دون تسجيل ({percent}%)',
        },
        challenge: {
          title: 'مدة التحدي',
          subtitle: 'اختر دورة 20/40/90 يومًا لبناء العادة.',
          options: { short: '20 يومًا', medium: '40 يومًا', long: '90 يومًا' },
          pinMessage: 'أكمل {days} يومًا متتاليًا لتثبيت العادة.',
        },
        calendarButton: 'عرض التقويم',
        stats: {
          streak: 'سلسلة: {days} يوم متتالٍ',
          record: 'أفضل رقم: {days} يوم',
          completion: 'نسبة الإتمام: {percent}% ({completed}/{target} أسبوعياً)',
        },
        supportsGoals: 'تدعم: {goals}',
        ai: {
          title: 'إرشادات الذكاء الاصطناعي',
          time: 'أفضل التزام بين 06:30 و07:00.',
          stack: 'ادمجها مع تذكيرات شرب الماء لثبات أعلى.',
          apply: 'تطبيق الإرشاد',
        },
        ctas: {
          checkIn: 'سجل اليوم',
          startTimer: 'ابدأ المؤقت',
          completed: 'مكتمل',
          failed: 'لم يكتمل',
          edit: 'تحرير',
          delete: 'حذف',
        },
        expand: {
          titles: {
            statistics: 'إحصائيات',
            pattern: 'أنماط',
            achievements: 'إنجازات',
          },
          lines: {
            overallCompletion: 'إجمالي الإتمام: 156',
            successPercentile: 'نسبة النجاح: 78%',
            averageStreak: 'متوسط السلسلة: 8 أيام',
            bestMonth: 'أفضل شهر: نوفمبر (93%)',
            bestTime: 'أفضل وقت: 7:00–7:30 (نجاح 85%)',
            worstTime: 'أسوأ وقت: عطلة نهاية الأسبوع (45%)',
            afterWeekends: 'بعد العطلات: احتمال −30%',
          },
          badges: {
            firstWeek: 'الأسبوع الأول',
            monthNoBreak: 'شهر بلا انقطاع',
            hundredCompletions: '100 إتمام',
            marathoner: 'ماراثوني (42 يوماً متتالياً)',
          },
        },
        empty: {
          title: 'لا توجد عادات بعد',
          subtitle: 'أضف عادة من المخطط لبدء متابعة السلاسل والتقدم.',
        },
        data: {
          h1: {
            title: 'تمارين الصباح',
            aiNote: 'جرّبها صباحاً مباشرة بعد التمرين',
          },
          h2: {
            title: 'تأمل',
            aiNote: 'الذكاء الاصطناعي: "جرّبها صباحاً مباشرة بعد التمرين"',
          },
          h3: {
            title: 'قراءة 30 دقيقة',
          },
          h4: {
            title: 'اشرب 2 لتر ماء',
            aiNote: 'إنجاز جديد!',
            chips: ['+ 250 مل', '+ 500 مل', '+ 1 لتر'],
          },
          h5: {
            title: 'من دون شبكات اجتماعية',
          },
      },
      },
    },
    plannerModals: {
      goal: arGoalModal as AppTranslations['plannerModals']['goal'],
    },
    widgets: {
      budgetProgress: {
        title: 'تقدم الميزانية',
        defaults: { housing: 'السكن', groceries: 'المشتريات اليومية', entertainment: 'الترفيه' },
        placeholders: {
          empty: 'لم يتم إعداد ميزانيات',
          add: 'أضف ميزانية للمتابعة',
        },
      },
      cashFlow: {
        title: 'التدفق النقدي',
        summary: { income: 'الدخل', expenses: 'المصروفات', net: 'الصافي' },
        days: { mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة' },
      },
      dailyTasks: {
        title: 'مهام اليوم',
        placeholders: ['لا مهام حالياً', 'استمتع باستراحة', 'أضف مهمة جديدة'],
      },
      focusSessions: {
        title: 'جلسات التركيز',
        stats: { completed: 'مكتمل', totalTime: 'الوقت الكلي', nextSession: 'الجلسة التالية' },
        placeholders: { none: 'لا جلسات مسجلة', free: 'الجدول فارغ' },
      },
      goals: {
        title: 'الأهداف',
        placeholderText: 'أضف هدفاً لبدء المتابعة.',
        placeholders: ['لا أهداف بعد', 'اضغط لإضافة هدف جديد'],
      },
      habits: {
        title: 'العادات',
        placeholders: ['لا عادات لهذا اليوم', 'سجل عادة للبدء'],
        streakLabel: 'أيام على التوالي',
        noStreak: 'لا سلسلة بعد',
      },
      productivityInsights: {
        title: 'رؤى الإنتاجية',
        metrics: {
          focusScore: 'درجة التركيز',
          tasksCompleted: 'المهام المنجزة',
          deepWork: 'ساعات العمل العميق',
        },
        trendTitle: 'منحنى التركيز',
        vsLastWeek: 'مقارنة بالأسبوع الماضي',
        noTrend: 'لا يوجد منحنى بعد',
        days: { mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة' },
      },
      spendingSummary: {
        title: 'ملخص الإنفاق',
        categories: {
          food: 'الطعام والمطاعم',
          transport: 'النقل',
          shopping: 'التسوق',
        },
        placeholders: ['لا إنفاق مسجل', 'سجل عملية شراء للبدء'],
        total: 'إجمالي الإنفاق',
      },
      transactions: {
        title: 'المعاملات',
        placeholders: ['لا نشاط مالي', 'ابدأ بتتبع المعاملات'],
      },
      weeklyReview: {
        title: 'مراجعة الأسبوع',
        stats: {
          completion: 'نسبة الإنجاز',
          focusTime: 'وقت التركيز',
          currentStreak: 'السلسلة الحالية',
        },
        summary: {
          success: 'أسبوع ممتاز! أنجزت {completed} من أصل {total} مهام.',
          empty: 'أكمل الجلسات لعرض ملخص الأسبوع.',
        },
        streakUnit: 'يوم',
      },
      wellnessOverview: {
        title: 'نظرة على العافية',
        metrics: { energy: 'الطاقة', mood: 'المزاج', sleep: 'جودة النوم' },
        messages: {
          balanced: 'أسبوع متوازن — استمر بهذه الوتيرة',
          logPrompt: 'سجل فحوصات العافية للحصول على الرؤى',
        },
      },
    },
    language: {
      sectionTitle: 'اللغة',
      helperTitle: 'ملاحظة',
      helperDescription:
        'سيتم تطبيق اللغة على اللوحات والرؤى والتحديثات القادمة. قد تبقى بعض الميزات التجريبية بالإنجليزية مؤقتاً.',
    },
    more: {
      header: {
        title: 'المزيد',
        profileAction: 'افتح الملف الشخصي',
        notificationsAction: 'الإشعارات',
        badgeLabel: 'مميز',
        dateLabel: '15 مارس',
      },
      premiumBadge: 'مميز حتى',
      sections: {
        account: 'الحساب',
        settings: 'الإعدادات',
        data: 'البيانات',
        integration: 'التكامل',
        help: 'المساعدة',
      },
      accountItems: {
        profile: 'الملف الشخصي',
        premium: 'وضع Premium',
        achievements: 'الإنجازات',
        statistics: 'الإحصائيات',
      },
      settingsItems: {
        appearance: 'المظهر',
        notifications: 'الإشعارات',
        aiAssistant: 'مساعد الذكاء الاصطناعي',
        security: 'الأمان',
        language: 'اللغة والمنطقة',
      },
      dataItems: {
        synchronization: 'المزامنة',
        backup: 'نسخ احتياطي / استعادة',
        export: 'تصدير البيانات',
        cache: 'مسح الذاكرة المؤقتة',
      },
      integrationItems: {
        calendars: 'التقاويم',
        banks: 'البنوك',
        apps: 'التطبيقات',
        devices: 'الأجهزة',
      },
      helpItems: {
        manual: 'الدليل',
        faq: 'الأسئلة الشائعة',
        support: 'الدعم',
        about: 'عن LEORA',
      },
      values: {
        enabled: 'مفعل',
        disabled: 'متوقف',
        on: 'تشغيل',
        off: 'إيقاف',
        themeLight: 'فاتح',
        themeDark: 'داكن',
        aiAlpha: 'ألفا',
        languageLabel: 'العربية',
        level: 'المستوى',
      },
      logout: 'تسجيل الخروج',
    confirmLogout: {
      title: 'تأكيد تسجيل الخروج',
      message: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      cancel: 'إلغاء',
      confirm: 'تسجيل الخروج',
    },
  },
    profile: {
      title: 'الملف الشخصي',
      sections: {
        personal: 'المعلومات الشخصية',
        stats: 'إحصائيات الاستخدام',
        preferences: 'الملف العام',
        finance: 'تفضيلات المالية',
        actions: 'إجراءات الحساب',
      },
      fields: {
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        username: 'اسم المستخدم',
        joined: 'تاريخ الانضمام',
        bio: 'نبذة مختصرة',
        visibility: 'خصوصية الملف',
        visibilityOptions: { public: 'عام', friends: 'الأصدقاء فقط', private: 'خاص' },
        showLevel: 'إظهار شارة المستوى',
        showAchievements: 'إظهار الإنجازات',
        showStatistics: 'إظهار الإحصائيات',
      },
      finance: {
        regionLabel: 'المنطقة الأساسية',
        currencyLabel: 'عملة العرض',
        regionSheetTitle: 'اختر منطقتك',
        currencySheetTitle: 'اختر العملة',
        currencySearchPlaceholder: 'ابحث عن العملة',
        fxTitle: 'أسعار الصرف',
        fxDescription: 'قم بمزامنة بيانات المزود أو أدخل سعراً يدوياً لعملة معينة.',
        fxProviderLabel: 'مزود الأسعار',
        fxProviders: {
          central_bank_stub: 'البنك المركزي',
          market_stub: 'السوق',
        },
        fxSyncButton: 'مزامنة الأسعار',
        fxSyncing: 'جاري المزامنة...',
        fxSyncSuccess: 'تم تحديث الأسعار عبر {provider}',
        fxSyncError: 'تعذر تحديث الأسعار. حاول مرة أخرى.',
        fxLastSync: 'آخر مزامنة: {value}',
        fxManualTitle: 'تعديل يدوي',
        fxManualHint: 'سعر مقابل {base}',
        fxManualCurrencyLabel: 'العملة',
        fxOverridePlaceholder: 'أدخل السعر',
        fxOverrideButton: 'حفظ السعر',
        fxOverrideSuccess: 'تم حفظ السعر لـ {currency}',
        fxOverrideError: 'أدخل قيمة صحيحة',
        fxOverrideBaseError: 'اختر عملة مختلفة عن العملة الأساسية',
        fxOverrideSheetTitle: 'اختر العملة للتعديل اليدوي',
      },
      stats: {
        daysWithApp: 'أيام مع LEORA',
        completedTasks: 'المهام المكتملة',
        activeTasks: 'المهام النشطة',
        level: 'المستوى الحالي',
      },
      xp: {
        label: 'تقدم نقاط XP',
        toNext: '{value} نقطة للوصول إلى المستوى التالي',
      },
      buttons: {
        edit: 'تعديل الملف',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف الحساب',
        logout: 'تسجيل الخروج',
        changePhoto: 'تغيير الصورة',
        removePhoto: 'إزالة الصورة',
        confirmDeleteTitle: 'حذف الحساب',
        confirmDeleteMessage: 'سيتم حذف جميع بياناتك نهائياً. هل تريد المتابعة؟',
        confirmDeleteConfirm: 'حذف',
        confirmDeleteCancel: 'إلغاء',
      },
    },
    financeScreens: {
      tabs: {
        review: 'المراجعة',
        accounts: 'الحسابات',
        transactions: 'المعاملات',
        budgets: 'الميزانيات',
        analytics: 'التحليلات',
        debts: 'الديون',
      },
      goalActions: {
        connectFinance: 'ربط المالية',
        createBudget: 'إنشاء ميزانية لهذا الهدف',
        addContribution: 'إضافة مساهمة',
      },
      review: {
        totalBalance: 'إجمالي الرصيد',
        income: 'الدخل',
        outcome: 'المصروف',
        monthBalance: 'الرصيد في نهاية الشهر',
        used: 'المستخدم',
        progress: 'التقدم',
        expenseStructure: 'هيكل المصروفات',
        recentTransactions: 'آخر المعاملات',
        seeAll: 'عرض الكل',
        importantEvents: 'أحداث مهمة',
        table: { type: 'النوع', amount: 'المبلغ', date: 'التاريخ' },
        fxQuick: {
          title: 'أسعار الصرف',
          providerLabel: 'المزود',
          providers: {
            central_bank_stub: 'البنك المركزي',
            market_stub: 'السوق',
          },
          syncButton: 'مزامنة الأسعار',
          syncDescription: 'جلب أحدث الأسعار من المزود',
          syncing: 'جاري المزامنة...',
          syncSuccess: 'تم تحديث الأسعار عبر {provider}',
          syncError: 'تعذر تحديث الأسعار. حاول مرة أخرى.',
          lastSync: 'آخر مزامنة: {value}',
          overrideButton: 'تعديل يدوي',
          overrideHint: 'سعر مقابل {base}',
          overrideTitle: 'تعديل يدوي',
          overridePlaceholder: 'أدخل السعر',
          overrideConfirm: 'حفظ',
          overrideCancel: 'إلغاء',
        overrideSuccess: 'تم حفظ السعر لـ {currency}',
        overrideError: 'أدخل قيمة صحيحة',
        overrideBaseError: 'اختر عملة مختلفة عن العملة الأساسية',
      },
      accountFilterTitle: 'اختر الحسابات',
      accountFilterAll: 'كل الحسابات',
      accountFilterSelected: '{count} محدد',
      accountFilterSelectAll: 'تحديد الكل',
      accountFilterApply: 'تطبيق',
      accountFilterCurrencyLabel: 'عملة العرض',
      monitorTitle: 'مراقبة الرصيد',
      monitorSearchPlaceholder: 'ابحث عن معاملات',
      monitorAccounts: 'الحسابات',
      monitorTypesTitle: 'نوع العملية',
      monitorTypes: {
        income: 'دخل',
        expense: 'مصروف',
        transfer: 'تحويل',
      },
      monitorDateFrom: 'من',
      monitorDateTo: 'إلى',
      monitorResults: 'المعاملات',
      monitorNoDate: 'غير محدد',
      monitorEmpty: 'لا توجد معاملات مطابقة للمرشحات',
      monitorApply: 'تم',
      monitorReset: 'إعادة التصفية',
    },
      accounts: {
        header: 'حساباتي',
        income: 'الدخل',
        outcome: 'المصروف',
        goalProgress: '{value}% من الهدف',
        historyTitle: 'سجل المعاملات',
        historyHeaders: { type: 'النوع', amount: 'المبلغ', time: 'الوقت' },
        actions: { edit: 'تحرير', archive: 'أرشفة', delete: 'حذف' },
        modal: {
          titleAdd: 'إضافة حساب جديد',
          titleEdit: 'تعديل الحساب',
          nameLabel: 'الاسم',
          namePlaceholder: 'اسم الحساب',
          descriptionLabel: 'الوصف',
          descriptionPlaceholder: 'الوصف',
          typeLabel: 'النوع',
          addType: 'إضافة نوع',
          newTypePlaceholder: 'اسم النوع الجديد',
          saveType: 'حفظ النوع',
          currencyLabel: 'العملة',
          amountLabel: 'المبلغ',
          amountPlaceholder: 'المبلغ ({currency})',
          primaryActionAdd: 'إضافة',
          primaryActionSave: 'حفظ',
          typeOptions: {
            cash: 'نقدي',
            card: 'بطاقة',
            savings: 'ادخار',
            usd: 'ائتمان',
            crypto: 'عملات رقمية',
            other: 'أخرى',
            custom: 'مخصص',
          },
          iconOptions: {
            wallet: 'محفظة',
            creditCard: 'بطاقة',
            piggyBank: 'ادخار',
            bank: 'بنك',
            briefcase: 'عمل',
            coins: 'عملات',
            sparkles: 'أخرى',
            bitcoin: 'عملات رقمية',
            shield: 'آمن',
            trendingUp: 'نمو',
          },
          currencyLabels: {
            UZS: 'سوم أوزبكي',
            USD: 'دولار أمريكي',
            EUR: 'يورو',
            GBP: 'جنيه إسترليني',
            TRY: 'ليرة تركية',
            SAR: 'ريال سعودي',
            AED: 'درهم إماراتي',
            USDT: 'تيثر (USDT)',
            RUB: 'روبل روسي',
          },
        },
      },
      transactions: {
        header: 'سجل المعاملات',
        details: {
          title: 'تفاصيل المعاملة',
          type: 'نوع العملية',
          amount: 'المبلغ',
          account: 'الحساب',
          category: 'الفئة',
          date: 'التاريخ',
          note: 'ملاحظة',
          relatedDebt: 'دين مرتبط',
          close: 'إغلاق',
        },
        filterSheet: {
          title: 'تصفية المعاملات',
          dateRange: 'نطاق التاريخ',
          category: 'الفئة',
          accounts: 'الحسابات',
          type: 'نوع العملية',
          amount: 'نطاق المبلغ',
          from: 'من',
          to: 'إلى',
          close: 'إغلاق',
          clearHint: 'اضغط مطولاً للمسح',
          selectDate: 'اختر التاريخ',
          reset: 'إعادة ضبط',
          apply: 'تطبيق',
          all: 'الكل',
          typeOptions: {
            income: 'دخل',
            expense: 'مصروف',
            transfer: 'تحويل',
            debt: 'دين',
          },
        },
        quick: {
          incomeHeader: '+ دخل',
          outcomeHeader: '- مصروف',
          amountPlaceholder: 'أدخل المبلغ',
          debtOwedToYouLabel: 'من يدين لك؟',
          debtOwedToYouPlaceholder: 'اسم الشخص المدين',
          debtYouOweLabel: 'لمن تدين؟',
          debtYouOwePlaceholder: 'اسم الشخص الذي تدين له',
          categoryAddTitle: 'إضافة فئة',
          categoryEditTitle: 'تعديل الفئة',
          categoryPlaceholder: 'اسم الفئة',
          save: 'حفظ الإدخال',
          update: 'حفظ التغييرات',
        },
        transferForm: {
          title: 'التحويل بين الحسابات',
          submit: 'تحويل',
          amountPlaceholder: 'المبلغ',
          fromAccount: 'من الحساب',
          toAccount: 'إلى الحساب',
          exchangeRate: 'سعر الصرف',
          auto: 'تلقائي',
          conversionInfo: '{amount} سيتم استلامها',
          resetRate: 'إعادة التعيين للسعر التلقائي',
          date: 'التاريخ',
          time: 'الوقت',
          notePlaceholder: 'أضف وصفاً أو سياقاً اختيارياً…',
          pickerDone: 'تم',
          selectAccount: 'اختر الحساب',
          rateInfoTemplate:
            'سعر الصرف: 1 {toCurrency} = {rate} {fromCurrency}. المستلم: {amount}',
        },
      },
      budgets: {
        today: 'نظرة على ميزانية اليوم',
        dateTemplate: 'نظرة على الميزانية لـ {date}',
      mainTitle: 'الميزانية الرئيسية',
      categoriesTitle: 'الفئات',
      addCategory: 'إضافة فئة',
      setLimit: 'تحديد حد',
      states: { exceeding: 'تجاوز', fixed: 'ثابت', within: 'ضمن الحد' },
      detail: {
        title: 'تفاصيل الميزانية',
        status: 'الحالة',
        linkedGoal: 'الهدف المرتبط',
        goalUnlinked: 'غير مرتبط بهدف',
        accountLabel: 'الحساب',
        currencyLabel: 'عملة الميزانية',
        limitLabel: 'الحد',
        spentLabel: 'المصروف',
        remainingLabel: 'المتبقي',
        balanceLabel: 'الرصيد الحالي',
        createdAt: 'تاريخ الإنشاء',
        updatedAt: 'آخر تحديث',
        categoriesLabel: 'الفئات',
        notifyLabel: 'تنبيه عند التجاوز',
        valueAddTitle: 'قيمة مضافة',
        valueAddAccountCurrency: 'عملة الحساب',
        valueAddBudgetCurrency: 'عملة الميزانية',
        valueAddDisplayCurrency: 'عملة العرض',
        actions: {
          title: 'إجراءات',
          edit: 'تعديل الميزانية',
          delete: 'حذف الميزانية',
          viewGoal: 'عرض الهدف',
          viewTransactions: 'عرض المعاملات',
          addToBudget: 'إضافة إلى الميزانية',
          confirmDeleteTitle: 'حذف الميزانية؟',
          confirmDeleteMessage: 'سيتم أرشفة الميزانية وفصلها عن الأهداف.',
          confirmDeleteConfirm: 'حذف',
          confirmDeleteCancel: 'إلغاء',
        },
      },
      form: {
        nameLabel: 'اسم الميزانية',
        namePlaceholder: 'اسم الميزانية',
        limitPlaceholder: '0',
        periodLabel: 'فترة الميزانية',
        periodOptions: {
          weekly: 'أسبوعية',
          monthly: 'شهرية',
          custom_range: 'مدى مخصص',
        },
        selectedRangeLabel: 'النطاق المختار: {range}',
        customRange: {
          start: 'تاريخ البداية',
          end: 'تاريخ النهاية',
          helper: 'اختر نطاقاً زمنياً مخصصاً',
          error: 'يرجى تحديد تاريخي البداية والنهاية',
        },
      },
    },
      analytics: {
        header: 'التحليلات المالية',
        expenseDynamics: 'ديناميكيات المصاريف',
        comparison: 'مقارنة مع الشهر السابق',
        topExpenses: 'أعلى المصاريف حسب الفئات',
        aiInsights: 'رؤى الذكاء الاصطناعي',
        stats: { peak: 'الذروة', average: 'المتوسط', trend: 'الاتجاه' },
        comparisonRows: { income: 'الدخل:', outcome: 'المصروف:', savings: 'المدخرات:' },
      },
      debts: {
        sections: { incoming: 'الديون', outgoing: 'ديوني' },
        timeline: {
          incoming: 'يعيد خلال',
          outgoing: 'الفترة',
          today: 'يستحق اليوم',
          inDays: 'يستحق خلال {count} يوم',
          overdue: 'متأخر {count} يوم',
        },
        actions: {
          incoming: { notify: 'إشعار', cancel: 'إلغاء الدين' },
          outgoing: { plan: 'تخطيط', partial: 'دفع جزئي' },
        },
        summary: {
          balanceLabel: 'إجمالي الرصيد',
          givenLabel: 'إجمالي الممنوح',
          takenLabel: 'إجمالي الدين',
          givenChange: '+15% ديسمبر',
          takenChange: '-8% ديسمبر',
        },
        modal: {
          title: 'إضافة دين',
          editTitle: 'تعديل الدين',
          subtitle: 'تتبع الأموال التي أقرضتها أو اقترضتها',
          typeLabel: 'النوع',
          borrowedLabel: 'أنا مدين',
          lentLabel: 'هم مدينون لي',
          person: 'الاسم / الشخص',
          personPlaceholder: 'لمن هذا الدين؟',
          amount: 'المبلغ',
          accountLabel: 'المحفظة',
          accountHelper: 'اختر الحساب المرتبط بهذا الدين',
          accountPickerTitle: 'اختر المحفظة',
          currencyLabel: 'العملة',
          currencyHelper: 'حدد العملة لهذا الدين',
          currencyPickerTitle: 'اختر العملة',
          dateLabel: 'التاريخ',
          changeDate: 'تغيير التاريخ',
          clear: 'مسح',
          selectAccount: 'اختر محفظة',
          expectedReturn: 'تاريخ السداد المتوقع',
          expectedPlaceholder: 'لم يتم تحديد تاريخ سداد',
        selectDate: 'اختر التاريخ',
        note: 'ملاحظة',
        notePlaceholder: 'أضف وصفاً أو تفاصيل إضافية…',
        personDirectional: {
          incoming: { label: 'ممن اقترضت؟', placeholder: 'اكتب اسم الدائن' },
          outgoing: { label: 'لمن تُقرض؟', placeholder: 'اكتب اسم المستفيد' },
        },
        toggles: { incoming: 'يدينون لي', outgoing: 'أنا مدين' },
        manageActions: 'إدارة الدين',
        accountDirectional: {
          incoming: {
            label: 'الإيداع في المحفظة',
            helper: 'سيتم إيداع المبلغ في المحفظة المختارة ({accountCurrency}).',
          },
          outgoing: {
            label: 'الخصم من المحفظة',
            helper: 'سيتم الخصم من المحفظة المختارة ({accountCurrency}).',
          },
        },
        currencyFlow: {
          incoming: 'استلام {debtCurrency} → إيداع {accountCurrency}',
          outgoing: 'إرسال {debtCurrency} → خصم {accountCurrency}',
        },
        counterpartyPickerTitle: 'اختر الشخص',
        counterpartySearchPlaceholder: 'ابحث عن الاسم',
        counterpartyAddAction: 'إضافة "{query}"',
        counterpartyEmpty: 'لا يوجد أشخاص بعد، أضف أول جهة.',
        counterpartyActions: {
          renameTitle: 'إعادة تسمية الشخص',
          renamePlaceholder: 'أدخل الاسم الجديد',
          renameSave: 'حفظ الاسم',
          renameCancel: 'إلغاء',
          deleteTitle: 'حذف هذا الشخص؟',
          deleteDescription: 'سيتم حذف هذا الشخص نهائياً.',
          deleteConfirm: 'حذف',
          deleteBlocked: 'لا يمكن حذف شخص مرتبط بديون.',
          duplicateName: 'يوجد شخص بهذا الاسم بالفعل.',
        },
          buttons: {
            cancel: 'إلغاء',
            save: 'حفظ',
            saveChanges: 'حفظ ',
            delete: 'حذف',
          },
          defaults: { name: 'دين جديد', description: 'وصف', due: 'بدون موعد' },
          deleteTitle: 'حذف الدين',
          deleteDescription: 'هل أنت متأكد أنك تريد حذف هذا الدين؟ لا يمكن التراجع عن هذا الإجراء.',
        status: {
          lent: 'لقد أقرضت المال',
          borrowed: 'لقد اقترضت المال',
        },
        scheduleTitle: 'جدول السداد',
        reminderTitle: 'الإشعارات',
        reminderToggle: 'تفعيل الإشعار',
        reminderTimeLabel: 'وقت التذكير (HH:MM)',
        reminderEnabledLabel: 'الإشعارات مفعّلة',
        reminderDisabledLabel: 'الإشعارات متوقفة',
        payment: {
          title: 'تسجيل دفعة',
          amount: 'مبلغ الدفعة',
          accountLabel: 'من المحفظة',
          currencyLabel: 'عملة الدفعة',
          note: 'ملاحظة الدفعة',
          helper: 'استخدمها لتتبع الدفعات الجزئية وجدولة السداد.',
          submit: 'تطبيق الدفعة',
          limitError: 'المبلغ يتجاوز الرصيد المتبقي للدين',
        },
        actionsBar: {
          pay: 'سداد الدين',
          partial: 'دفع جزئي',
          notify: 'الإشعار',
          schedule: 'إدارة التواريخ',
        },
        manualRate: {
          title: 'التحويل',
          description:
            'عملة الدين {debtCurrency}. عملة المحفظة {accountCurrency}. أدخل قيمة الخصم بعملة {accountCurrency}.',
          toggle: 'إدخال يدوي',
          amountLabel: 'المبلغ بالعملة ({currency})',
        },
        fullPaymentTitle: 'سداد الدين بالكامل',
        fullPaymentDescription: 'سيتم سداد الرصيد المتبقي بالكامل ({amount}).',
        fullPaymentSubmit: 'سدّد بالكامل',
      },
      },
    },
  },
  tr: {
    common: {
      close: 'Kapat',
      cancel: 'İptal',
      save: 'Kaydet',
      add: 'Ekle',
      delete: 'Sil',
      apply: 'Uygula',
      reset: 'Sıfırla',
      done: 'Tamam',
      select: 'Seç',
    },
    auth: {
      common: {
        socialDivider: 'Ya da aşağıdakilerle devam et',
        languageButtonLabel: 'Dil',
        languageHelper: 'Bu ekran için dili seç.',
        languageSheetTitle: 'Dili seç',
      },
      validation: {
        emailOrUsernameRequired: 'E-posta veya kullanıcı adı girin',
        emailRequired: 'E-posta gerekli',
        emailInvalid: 'Geçerli bir e-posta girin',
        nameRequired: 'Ad soyad gerekli',
        passwordRequired: 'Şifre gerekli',
        passwordConfirmRequired: 'Şifreyi doğrulayın',
        passwordMismatch: 'Şifreler eşleşmiyor',
        passwordMinLength: 'En az 8 karakter kullanın',
        passwordUppercase: 'Bir büyük harf ekleyin',
        passwordLowercase: 'Bir küçük harf ekleyin',
        passwordNumber: 'Bir rakam ekleyin',
        passwordSpecial: 'Bir özel karakter ekleyin',
      },
      login: {
        title: 'Giriş yap',
        description: 'Tekrar hoş geldin! Devam etmek için bilgilerini gir.',
        fields: {
          emailOrUsername: 'E-posta veya kullanıcı adı',
          password: 'Şifre',
        },
        placeholders: {
          emailOrUsername: 'name@example.com',
          password: 'Şifrenizi girin',
        },
        rememberMe: 'Beni hatırla',
        forgotPassword: 'Şifreni mi unuttun?',
        buttons: {
          submit: 'Giriş yap',
        },
        links: {
          noAccount: 'Hesabın yok mu?',
          signUp: 'Kayıt ol',
        },
        alerts: {
          failureTitle: 'Giriş başarısız',
          failureMessage: 'Bilgileri kontrol edip tekrar dene.',
          socialTitle: 'Yakında',
          socialMessage: '{provider} ile giriş yakında geliyor.',
        },
        errors: {
          missingCredentials: 'E-posta/kullanıcı adı ve şifre girin',
          invalidCredentials: 'E-posta/kullanıcı adı veya şifre hatalı',
          generic: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        },
      },
      register: {
        title: 'Kayıt ol',
        description: 'Devam etmek için bir hesap oluştur.',
        fields: {
          email: 'E-posta',
          fullName: 'Ad soyad',
          password: 'Şifre',
          confirmPassword: 'Şifreyi doğrula',
        },
        placeholders: {
          email: 'name@example.com',
          fullName: 'Adınızı girin',
          password: 'Şifre oluşturun',
          confirmPassword: 'Şifreyi tekrar girin',
        },
        buttons: {
          submit: 'Hesap oluştur',
          socialComingSoon: 'Yakında',
        },
        links: {
          haveAccount: 'Zaten hesabın var mı?',
          signIn: 'Giriş yap',
        },
        languageSelector: {
          label: 'Dil',
          helper: 'Bu kayıt için kullanılacak dili seç.',
        },
        selectors: {
          sectionTitle: 'Bölge ve para birimi',
          helper: 'Ana para birimi {currency} olacak',
          regionLabel: 'Bölge',
          currencyLabel: 'Para birimi',
          currencyHint: 'Değiştirmek için dokun',
        },
        sheets: {
          regionTitle: 'Bölge seç',
          currencyTitle: 'Para birimi seç',
          currencySearch: 'Para birimi ara',
          languageTitle: 'Dili seç',
        },
        alerts: {
          successTitle: 'Kayıt başarılı',
          successMessage: 'Aramıza hoş geldin! Hesabın hazır.',
          failureTitle: 'Kayıt başarısız',
          socialTitle: 'Yakında',
          socialMessage: '{provider} ile kayıt özelliği yakında gelecek.',
        },
        passwordGuide: {
          strengthLabel: 'Şifre gücü',
          helper: 'Harf, rakam ve sembolleri karıştır.',
          levels: {
            empty: 'Yazmaya başla',
            weak: 'Zayıf',
            medium: 'Orta',
            strong: 'Güçlü',
          },
          requirementsTitle: 'Şifre gereklilikleri',
          requirements: {
            length: 'En az {count} karakter',
            uppercase: 'Bir büyük harf',
            lowercase: 'Bir küçük harf',
            number: 'Bir rakam',
            special: 'Bir özel karakter',
          },
        },
        errors: {
          missingFields: 'Zorunlu alanları doldurun',
          selectRegion: 'Bölge seçin',
          passwordMismatch: 'Şifreler eşleşmiyor',
          emailInvalid: 'Geçerli bir e-posta girin',
          emailExists: 'Bu e-posta zaten kayıtlı',
          generic: 'Kayıt tamamlanamadı. Lütfen tekrar deneyin.',
        },
      },
      forgot: {
        languageSelector: {
          label: 'Dil',
          helper: 'Parola sıfırlama dili seçin.',
        },
        emailStep: {
          title: 'Parolanı mı unuttun?',
          description: 'Sıfırlamak için e-postanı gir.',
          fieldLabel: 'E-posta',
          placeholder: 'name@example.com',
          button: {
            submit: 'Kodu gönder',
            loading: 'Gönderiliyor…',
          },
        },
        otpStep: {
          title: 'Doğrulama kodunu gir',
          description: '{email} adresine bir kod gönderdik',
          timerHint: 'Yeni kod {time} sonra',
          resend: 'Kodu tekrar gönder',
          back: 'E-posta adımına dön',
          button: {
            submit: 'Kodu doğrula',
            loading: 'Doğrulanıyor…',
          },
        },
        alerts: {
          codeSentTitle: 'Kod gönderildi',
          codeSentMessage: '4 haneli kod e-postana gönderildi (demo için konsolu da kontrol et).',
          codeResentTitle: 'Kod tekrar gönderildi',
          codeResentMessage: 'Yeni doğrulama kodu gönderildi.',
          otpVerifiedTitle: 'Kod doğrulandı',
          otpVerifiedMessage: 'Artık tekrar giriş yapabilirsin.',
          genericErrorTitle: 'Hata',
          genericErrorMessage: 'Bir hata oluştu. Lütfen tekrar dene.',
          okButton: 'Tamam',
        },
        footer: {
          remember: 'Parolanı hatırladın mı?',
          signIn: 'Giriş yap',
        },
        errors: {
          invalidEmail: 'Geçerli bir e-posta girin',
          generic: 'Bir hata oluştu. Lütfen tekrar deneyin.',
          otpExpired: 'Kodun süresi doldu. Yeni kod iste.',
          otpInvalid: 'Kod geçersiz.',
          otpIncomplete: 'Kodu eksiksiz girin.',
        },
      },
    },
    addTask: trAddTask as AppTranslations['addTask'],
    universalFab: trUniversalFab as AppTranslations['universalFab'],
    home: {
      header: {
        todayLabel: 'BUGÜN',
        openProfile: 'Profili aç',
        previousDay: 'Önceki gün',
        nextDay: 'Sonraki gün',
      },
      greeting: {
        morning: 'Günaydın',
        afternoon: 'İyi günler',
        evening: 'İyi akşamlar',
        night: 'İyi geceler',
        defaultName: 'dostum',
      },
      status: {
        online: 'Çevrimiçi',
        offline: 'Çevrimdışı',
        connecting: 'Kontrol ediliyor…',
      },
      widgets: {
        title: 'Widgetler',
        edit: 'Düzenle',
        emptyTitle: 'Widget yok',
        emptySubtitle: 'Paneline widget eklemek için "Düzenle" tuşuna bas.',
      },
      progress: {
        tasks: 'Görevler',
        budget: 'Bütçe',
        habit: 'Alışkanlık',
        progressSuffix: 'durumu',
      },
    },
    tabs: {
      home: 'Ana sayfa',
      finance: 'Finans',
      planner: 'Planlayıcı',
      insights: 'İnsayt',
      more: 'Diğer',
    },
    calendar: {
      todayLabel: 'bugün',
      selectDateTitle: 'Tarih seç',
    },
    plannerScreens: {
      tabs: {
        tasks: 'Görevler',
        goals: 'Hedefler',
        habits: 'Alışkanlıklar',
      },
      tasks: {
        headerTemplate: '{date} planları',
        todayLabel: 'bugün',
        filter: 'Filtre',
        sectionCountLabel: 'görev',
        sectionTip:
          'Kısaca basıp sağa kaydırın — tamamlandı, sola kaydırın — sil (tamamlananlar dahil).',
        sections: {
          morning: { title: 'Sabah', time: '(06:00 - 12:00)' },
          afternoon: { title: 'Öğleden sonra', time: '(12:00 - 18:00)' },
          evening: { title: 'Akşam', time: '(18:00 - 22:00)' },
        },
        actions: {
          complete: 'TAMAMLA',
          restore: 'GERİ AL',
          remove: 'SİL',
          delete: 'GÖREVİ SİL',
        },
        history: {
          title: 'Görev geçmişi',
          subtitle: 'Geri almak veya silmek için kaydır',
          tip: 'Kısaca basıp sağa kaydırarak geri alın, sola kaydırarak kalıcı olarak silin.',
          deletedBadge: 'Taşındı',
        },
        defaults: {
          startToday: 'Bugün',
          startTomorrow: 'Yarın',
          startPick: 'Seç',
          newTaskTitle: 'Yeni görev',
          defaultContext: '@work',
        },
        aiPrefix: 'YZ:',
        dailySummary: 'Bugün: {tasks} görev • {habits} alışkanlık • {goals} hedef adımı',
        statuses: {
          active: 'Aktif',
          in_progress: 'Fokusta',
          completed: 'Tamamlandı',
          archived: 'Arşivlendi',
        },
        focus: {
          cta: 'Fokus',
          inProgress: 'Fokusta',
          cardLabel: 'Şu an odakta',
          goalTag: 'Hedef: {goal}',
          finishTitle: '"{task}" tamamlandı mı?',
          finishMessage: 'Tamamlandı olarak işaretleyin ya da kalan kısmı yarına taşıyın.',
          done: 'Tamamlandı',
          move: 'Yarına taşı',
          keep: 'Sonra yaparım',
        },
        calendar: {
          title: 'Planner takvimi',
          summary: '{tasks} görev • {habits} alışkanlık • {goals} hedef adımı',
          addQuickTask: 'Hızlı görev',
          quickTaskTitle: 'Hızlı görev',
          scheduledTitle: 'Bugün için planlananlar',
          empty: 'Bu güne hiçbir şey eklenmemiş.',
          moveTitle: 'Görevleri buraya taşı',
          moveHere: 'Buraya taşı',
          moveTomorrow: 'Yarına taşı',
          unscheduled: 'Tarihsiz',
          noOtherTasks: 'Başka görev yok.',
        },
        aiSuggestions: {
          title: 'AI önerisi',
          time: 'En iyi zaman: {value}',
          duration: 'Süre: {value}',
          context: 'Kontekst: {value}',
          energy: 'Enerji: {value}',
          apply: 'Öneriyi uygula',
        },
      },
      goals: {
        header: {
          title: 'Stratejik hedefler',
          subtitle: 'Finansal ve kişisel kazanımlar için ivme',
        },
        empty: {
          title: 'İlk hedefini oluştur',
          subtitle:
            'Bir hedef eklediğinde kilometre taşları, tahminler ve YZ içgörülerini görebilirsin. Başlamak için ekle düğmesini kullan.',
        },
        sections: {
          financial: {
            title: 'Finansal hedefler',
            subtitle: 'Yatırım odağı ve tasarruf öncelikleri',
          },
          personal: {
            title: 'Kişisel hedefler',
            subtitle: 'Yaşam tarzı ve wellness kazanımları',
          },
        },
        cards: {
          summaryLabels: {
            left: 'Kaldı',
            pace: 'Tempo',
            prediction: 'Tahmin',
          },
          actions: {
            addValue: 'Değer ekle',
            refresh: 'Yenile',
            edit: 'Düzenle',
            addValueA11y: 'Değer ekle',
            refreshA11y: 'Hedefi yenile',
            editA11y: 'Hedefi düzenle',
            openDetailsA11y: 'Hedef ayrıntılarını aç',
          },
        },
        details: {
          milestones: 'Kilometre taşları',
          history: 'Geçmiş',
          showMore: 'Daha fazlasını gör',
        },
        nextStep: {
          title: 'Sonraki adım',
          empty: 'Bağlı görev yok',
          cta: 'Adım ekle',
        },
        linkedSummary: '{tasks} görev • {habits} alışkanlık',
        ai: {
          title: 'AI planı',
          milestones: 'Adımlar: başlangıç → prototip → beta → lansman.',
          duration: 'Tahmini süre: haftalık kontrollerle 3–6 ay.',
          apply: 'Planı uygula',
        },
        data: {
          'dream-car': {
            title: 'Hayal arabası',
            currentAmount: '4,1M UZS',
            targetAmount: '5M UZS',
            summary: {
              left: '900 000 UZS kaldı',
              pace: '450 000 UZS / ay',
              prediction: 'Takvimde · Mart 2025',
            },
            milestones: ['Oca 2025', 'Şub 2025', 'Mar 2025', 'Nis 2025'],
            history: [
              { label: 'Ara', delta: '+450 000 UZS' },
              { label: 'Kas', delta: '+320 000 UZS' },
              { label: 'Eki', delta: '+280 000 UZS' },
            ],
            aiTip: 'Bu hızla hedefe mart ayında ulaşırsın.',
            aiTipHighlight: 'Ayda 100 bin daha eklersen şubatta tamamlarsın.',
          },
          'emergency-fund': {
            title: 'Acil durum fonu',
            currentAmount: '3,5M UZS',
            targetAmount: '6M UZS',
            summary: {
              left: '2,5M UZS kaldı',
              pace: '300 000 UZS / ay',
              prediction: 'Tahmin · Haz 2025',
            },
            milestones: ['Kas 2024', 'Oca 2025', 'Mar 2025', 'Haz 2025'],
            history: [
              { label: 'Ara', delta: '+300 000 UZS' },
              { label: 'Kas', delta: '+300 000 UZS' },
              { label: 'Eki', delta: '+250 000 UZS' },
            ],
            aiTip: '350 binlik katkı konfor bölgesini korur.',
          },
          fitness: {
            title: 'Maksimum form planı',
            currentAmount: '92 / 210 seans',
            targetAmount: '210 seans',
            summary: {
              left: '118 seans kaldı',
              pace: 'Haftada 4 seans',
              prediction: 'Takvimde · Ağustos 2025',
            },
            milestones: ['Kas 2024', 'Oca 2025', 'Nis 2025', 'Ağu 2025'],
            history: [
              { label: 'Hafta 48', delta: '+4 seans' },
              { label: 'Hafta 47', delta: '+5 seans' },
              { label: 'Hafta 46', delta: '+3 seans' },
            ],
            aiTip: 'Tutarlılık artıyor. Bir ekstra kardiyo günü ekle ve süreci hızlandır.',
          },
          language: {
            title: 'İspanyolca immersion',
            currentAmount: '34 / 50 ders',
            targetAmount: '50 ders',
            summary: {
              left: '16 ders kaldı',
              pace: 'Haftada 3 ders',
              prediction: 'Varış · Şubat 2025',
            },
            milestones: ['Eki 2024', 'Ara 2024', 'Oca 2025', 'Mar 2025'],
            history: [
              { label: 'Hafta 48', delta: '+3 ders' },
              { label: 'Hafta 47', delta: '+4 ders' },
              { label: 'Hafta 46', delta: '+3 ders' },
            ],
            aiTip: 'Her dersi 15 dakikalık konuşma özetiyle pekiştir, daha hızlı akıcı olursun.',
          },
        },
      },
      habits: {
        headerTitle: 'Alışkanlıklar',
        badgeSuffix: 'gün',
        calendarTitle: 'Aylık takip — {month}',
        calendarLegend: { done: 'Tamamlandı', miss: 'Kaçırıldı', none: 'Kayıt yok' },
        calendarLegendHint: {
          done: '{count} gün tamamlandı ({percent}%)',
          miss: '{count} gün kaçırıldı ({percent}%)',
          none: '{count} gün beklemede ({percent}%)',
        },
        challenge: {
          title: 'Meydan okuma süresi',
          subtitle: 'Klasik 20/40/90 günlük döngülerden birini seç.',
          options: { short: '20 gün', medium: '40 gün', long: '90 gün' },
          pinMessage: '{days} gün üst üste tamamlayarak alışkanlığı kilitle.',
        },
        calendarButton: 'Takvimi aç',
        stats: {
          streak: 'Seri: {days} gün üst üste',
          record: 'Rekor: {days} gün',
          completion: 'Tamamlama: {percent}% ({completed}/{target} haftalık)',
        },
        supportsGoals: 'Destekler: {goals}',
        ai: {
          title: 'AI ipuçları',
          time: 'En iyi uyum 06:30–07:00 arasında.',
          stack: 'Daha yüksek istikrar için su hatırlatmalarıyla birleştirin.',
          apply: 'Öneriyi uygula',
        },
        ctas: {
          checkIn: 'Bugün işaretle',
          startTimer: 'Zamanlayıcıyı başlat',
          completed: 'Tamamlandı',
          failed: 'Başarısız',
          edit: 'Düzenle',
          delete: 'Sil',
        },
        expand: {
          titles: {
            statistics: 'İstatistikler',
            pattern: 'Örüntüler',
            achievements: 'Başarılar',
          },
          lines: {
            overallCompletion: 'Genel tamamlama: 156',
            successPercentile: 'Başarı yüzdesi: %78',
            averageStreak: 'Ortalama seri: 8 gün',
            bestMonth: 'En iyi ay: Kasım (%93)',
            bestTime: 'En iyi zaman: 7:00–7:30 (%85 başarı)',
            worstTime: 'En kötü zaman: Hafta sonu (%45)',
            afterWeekends: 'Hafta sonu sonrası: −%30 olasılık',
          },
        badges: {
          firstWeek: 'İlk hafta',
          monthNoBreak: 'Kesintisiz ay',
          hundredCompletions: '100 tamamlanma',
          marathoner: 'Maratoncu (42 gün üst üste)',
        },
      },
      empty: {
        title: 'Henüz alışkanlık yok',
        subtitle: 'Planlayıcıdan bir alışkanlık ekleyerek serileri ve ilerlemeyi takip etmeye başlayın.',
      },
      data: {
        h1: {
          title: 'Sabah antrenmanı',
            aiNote: 'Antrenmandan hemen sonra sabah dene',
          },
          h2: {
            title: 'Meditasyon',
            aiNote: 'YZ: "Antrenmandan hemen sonra sabah dene"',
          },
          h3: {
            title: '30 dk okuma',
          },
          h4: {
            title: 'Günde 2L su iç',
            aiNote: 'Yeni başarı!',
            chips: ['+ 250 ml', '+ 500 ml', '+ 1 L'],
          },
          h5: {
            title: 'Sosyal ağsız',
          },
      },
      },
    },
    plannerModals: {
      goal: trGoalModal as AppTranslations['plannerModals']['goal'],
    },
    widgets: {
      budgetProgress: {
        title: 'Bütçe ilerlemesi',
        defaults: { housing: 'Konut', groceries: 'Market', entertainment: 'Eğlence' },
        placeholders: {
          empty: 'Bütçe eklenmemiş',
          add: 'Takip için bütçe ekleyin',
        },
      },
      cashFlow: {
        title: 'Nakit akışı',
        summary: { income: 'Gelir', expenses: 'Gider', net: 'Net' },
        days: { mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum' },
      },
      dailyTasks: {
        title: 'Günlük görevler',
        placeholders: ['Görev yok', 'Kısa mola ver', 'Yeni görev ekle'],
      },
      focusSessions: {
        title: 'Odak seansları',
        stats: { completed: 'Tamamlandı', totalTime: 'Toplam süre', nextSession: 'Sonraki seans' },
        placeholders: { none: 'Seans kaydı yok', free: 'Takvim boş' },
      },
      goals: {
        title: 'Hedefler',
        placeholderText: 'İlerlemeyi görmek için hedef ekleyin.',
        placeholders: ['Henüz hedef yok', 'Yeni hedef eklemek için dokunun'],
      },
      habits: {
        title: 'Alışkanlıklar',
        placeholders: ['Bugün alışkanlık yok', 'Başlamak için alışkanlık ekleyin'],
        streakLabel: 'günlük seri',
        noStreak: 'Seri yok',
      },
      productivityInsights: {
        title: 'Üretkenlik içgörüleri',
        metrics: {
          focusScore: 'Fokus puanı',
          tasksCompleted: 'Tamamlanan görev',
          deepWork: 'Derin çalışma saati',
        },
        trendTitle: 'Fokus eğrisi',
        vsLastWeek: 'geçen haftaya göre',
        noTrend: 'Henüz eğri yok',
        days: { mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum' },
      },
      spendingSummary: {
        title: 'Harcama özeti',
        categories: {
          food: 'Yemek & restoran',
          transport: 'Ulaşım',
          shopping: 'Alışveriş',
        },
        placeholders: ['Harcama kaydı yok', 'Başlamak için alışveriş ekleyin'],
        total: 'Toplam harcama',
      },
      transactions: {
        title: 'İşlemler',
        placeholders: ['İşlem yok', 'İşlem takibini başlatın'],
      },
      weeklyReview: {
        title: 'Haftalık özet',
        stats: {
          completion: 'Tamamlama',
          focusTime: 'Fokus süresi',
          currentStreak: 'Seri',
        },
        summary: {
          success: 'Harika hafta! {completed}/{total} görevi tamamladın.',
          empty: 'Haftalık içgörüyü görmek için seans tamamla.',
        },
        streakUnit: 'gün',
      },
      wellnessOverview: {
        title: 'Wellness görünümü',
        metrics: { energy: 'Enerji', mood: 'Ruh hali', sleep: 'Uyku kalitesi' },
        messages: {
          balanced: 'Dengeli hafta — böyle devam et',
          logPrompt: 'İçgörü almak için wellness kayıtlarını gir',
        },
      },
    },
    language: {
      sectionTitle: 'Dil',
      helperTitle: 'Not',
      helperDescription:
        'Dil ayarı içgörüler, koç mesajları ve güncellemelerde kullanılacak. Bazı deneysel özellikler geçici olarak İngilizce kalabilir.',
    },
    more: {
      header: {
        title: 'Diğer',
        profileAction: 'Profili aç',
        notificationsAction: 'Bildirimler',
        badgeLabel: 'Premium',
        dateLabel: '15 Mart',
      },
      premiumBadge: 'Premium bitişi',
      sections: {
        account: 'Hesap',
        settings: 'Ayarlar',
        data: 'Veriler',
        integration: 'Entegrasyon',
        help: 'Yardım',
      },
      accountItems: {
        profile: 'Profil',
        premium: 'Premium durumu',
        achievements: 'Başarılar',
        statistics: 'İstatistikler',
      },
      settingsItems: {
        appearance: 'Tema',
        notifications: 'Bildirimler',
        aiAssistant: 'Yapay zekâ asistanı',
        security: 'Güvenlik',
        language: 'Dil ve bölge',
      },
      dataItems: {
        synchronization: 'Senkronizasyon',
        backup: 'Yedekle / Geri yükle',
        export: 'Veri dışa aktarımı',
        cache: 'Önbelleği temizle',
      },
      integrationItems: {
        calendars: 'Takvimler',
        banks: 'Bankalar',
        apps: 'Uygulamalar',
        devices: 'Cihazlar',
      },
      helpItems: {
        manual: 'Kılavuz',
        faq: 'SSS',
        support: 'Destek',
        about: 'LEORA hakkında',
      },
      values: {
        enabled: 'Aktif',
        disabled: 'Pasif',
        on: 'Açık',
        off: 'Kapalı',
        themeLight: 'Açık',
        themeDark: 'Koyu',
        aiAlpha: 'Alfa',
        languageLabel: 'Türkçe',
        level: 'Seviye',
      },
      logout: 'Çıkış',
    confirmLogout: {
      title: 'Çıkış yap',
      message: 'Oturumu kapatmak istediğine emin misin?',
      cancel: 'Vazgeç',
      confirm: 'Çıkış yap',
    },
  },
    profile: {
      title: 'Profil',
      sections: {
        personal: 'Kişisel bilgiler',
        stats: 'Kullanım istatistikleri',
        preferences: 'Herkese açık profil',
        finance: 'Finans tercihleri',
        actions: 'Hesap işlemleri',
      },
      fields: {
        fullName: 'Ad soyad',
        email: 'E-posta',
        phone: 'Telefon',
        username: 'Kullanıcı adı',
        joined: 'Katılma tarihi',
        bio: 'Hakkında',
        visibility: 'Profil görünürlüğü',
        visibilityOptions: { public: 'Herkese açık', friends: 'Sadece arkadaşlar', private: 'Gizli' },
        showLevel: 'Seviye rozetini göster',
        showAchievements: 'Başarıları göster',
        showStatistics: 'İstatistikleri göster',
      },
      finance: {
        regionLabel: 'Ana bölge',
        currencyLabel: 'Görünen para birimi',
        regionSheetTitle: 'Bölge seçin',
        currencySheetTitle: 'Para birimi seçin',
        currencySearchPlaceholder: 'Para birimi ara',
        fxTitle: 'Döviz kurları',
        fxDescription: 'Provayderden kur çekin veya belirli bir para birimi için manuel değer girin.',
        fxProviderLabel: 'Kur sağlayıcısı',
        fxProviders: {
          central_bank_stub: 'Merkez bankası',
          market_stub: 'Piyasa',
        },
        fxSyncButton: 'Kurları senkronize et',
        fxSyncing: 'Senkronize ediliyor...',
        fxSyncSuccess: 'Kurlar {provider} ile güncellendi',
        fxSyncError: 'Kurlar güncellenemedi. Lütfen tekrar deneyin.',
        fxLastSync: 'Son senkronizasyon: {value}',
        fxManualTitle: 'Manuel kur',
        fxManualHint: '{base} baz alınarak',
        fxManualCurrencyLabel: 'Para birimi',
        fxOverridePlaceholder: 'Kur girin',
        fxOverrideButton: 'Kaydet',
        fxOverrideSuccess: '{currency} için kur kaydedildi',
        fxOverrideError: 'Geçerli bir değer girin',
        fxOverrideBaseError: 'Baz para biriminden farklı birini seçin',
        fxOverrideSheetTitle: 'Manuel kur için para birimi',
      },
      stats: {
        daysWithApp: 'LEORA ile gün',
        completedTasks: 'Tamamlanan görevler',
        activeTasks: 'Aktif görevler',
        level: 'Mevcut seviye',
      },
      xp: {
        label: 'XP ilerlemesi',
        toNext: 'Sonraki seviyeye {value} XP',
      },
      buttons: {
        edit: 'Profili düzenle',
        save: 'Kaydet',
        cancel: 'Vazgeç',
        delete: 'Hesabı sil',
        logout: 'Çıkış yap',
        changePhoto: 'Fotoğraf değiştir',
        removePhoto: 'Fotoğrafı kaldır',
        confirmDeleteTitle: 'Hesabı sil',
        confirmDeleteMessage: 'Tüm verileriniz kalıcı olarak silinecek. Devam etmek istiyor musunuz?',
        confirmDeleteConfirm: 'Sil',
        confirmDeleteCancel: 'Vazgeç',
      },
    },
    financeScreens: {
      tabs: {
        review: 'Genel',
        accounts: 'Hesaplar',
        transactions: 'İşlemler',
        budgets: 'Bütçeler',
        analytics: 'Analitik',
        debts: 'Borçlar',
      },
      goalActions: {
        connectFinance: 'Finansı bağla',
        createBudget: 'Bu hedef için bütçe oluştur',
        addContribution: 'Katkı ekle',
      },
      review: {
        totalBalance: 'Toplam bakiye',
        income: 'Gelir',
        outcome: 'Gider',
        monthBalance: 'Ay sonu bakiyesi',
        used: 'Kullanıldı',
        progress: 'İlerleme',
        expenseStructure: 'Gider yapısı',
        recentTransactions: 'Son işlemler',
        seeAll: 'Hepsini gör',
        importantEvents: 'Önemli olaylar',
        table: { type: 'Tür', amount: 'Tutar', date: 'Tarih' },
        fxQuick: {
          title: 'Döviz işlemleri',
          providerLabel: 'Sağlayıcı',
          providers: {
            central_bank_stub: 'Merkez bankası',
            market_stub: 'Piyasa',
          },
          syncButton: 'Kurları senkronize et',
          syncDescription: 'Sağlayıcıdan en güncel kurları çek',
          syncing: 'Senkronize ediliyor...',
          syncSuccess: 'Kurlar {provider} ile güncellendi',
          syncError: 'Kurlar güncellenemedi. Tekrar deneyin.',
          lastSync: 'Son senkronizasyon: {value}',
          overrideButton: 'Manuel kur',
          overrideHint: '{base} baz alınarak',
          overrideTitle: 'Manuel kur',
          overridePlaceholder: 'Kur girin',
          overrideConfirm: 'Kaydet',
          overrideCancel: 'Vazgeç',
        overrideSuccess: '{currency} için kur kaydedildi',
        overrideError: 'Geçerli bir değer girin',
        overrideBaseError: 'Baz para biriminden farklı birini seçin',
      },
      accountFilterTitle: 'Hesapları seç',
      accountFilterAll: 'Tüm hesaplar',
      accountFilterSelected: '{count} hesap',
      accountFilterSelectAll: 'Hepsini seç',
      accountFilterApply: 'Uygula',
      accountFilterCurrencyLabel: 'Gösterim para birimi',
      monitorTitle: 'Bakiye izlemesi',
      monitorSearchPlaceholder: 'İşlem ara',
      monitorAccounts: 'Hesaplar',
      monitorTypesTitle: 'İşlem türleri',
      monitorTypes: {
        income: 'Gelir',
        expense: 'Gider',
        transfer: 'Transfer',
      },
      monitorDateFrom: 'Başlangıç',
      monitorDateTo: 'Bitiş',
      monitorResults: 'İşlemler',
      monitorNoDate: 'Seçilmedi',
      monitorEmpty: 'Filtrelere uygun işlem yok',
      monitorApply: 'Tamam',
      monitorReset: 'Filtreleri sıfırla',
    },
      accounts: {
        header: 'Hesaplarım',
        income: 'Gelir',
        outcome: 'Gider',
        goalProgress: '{value}% hedefe ulaşıldı',
        historyTitle: 'İşlem geçmişi',
        historyHeaders: { type: 'Tür', amount: 'Tutar', time: 'Saat' },
        actions: { edit: 'Düzenle', archive: 'Arşivle', delete: 'Sil' },
        modal: {
          titleAdd: 'Yeni hesap ekle',
          titleEdit: 'Hesabı düzenle',
          nameLabel: 'Ad',
          namePlaceholder: 'Hesap adı',
          descriptionLabel: 'Açıklama',
          descriptionPlaceholder: 'Açıklama',
          typeLabel: 'Tür',
          addType: 'Tür ekle',
          newTypePlaceholder: 'Yeni tür adı',
          saveType: 'Türü kaydet',
          currencyLabel: 'Para birimi',
          amountLabel: 'Tutar',
          amountPlaceholder: 'Tutar ({currency})',
          primaryActionAdd: 'Ekle',
          primaryActionSave: 'Kaydet',
          typeOptions: {
            cash: 'Nakit',
            card: 'Kart',
            savings: 'Birikim',
            usd: 'Kredi',
            crypto: 'Kripto',
            other: 'Diğer',
            custom: 'Özel',
          },
          iconOptions: {
            wallet: 'Cüzdan',
            creditCard: 'Kart',
            piggyBank: 'Birikim',
            bank: 'Banka',
            briefcase: 'İş',
            coins: 'Madeni para',
            sparkles: 'Diğer',
            bitcoin: 'Kripto',
            shield: 'Güvenli',
            trendingUp: 'Büyüme',
          },
          currencyLabels: {
            UZS: 'Özbek so‘mı',
            USD: 'ABD doları',
            EUR: 'Euro',
            GBP: 'İngiliz sterlini',
            TRY: 'Türk Lirası',
            SAR: 'Suudi Riyali',
            AED: 'BAE Dirhemi',
            USDT: 'Tether (USDT)',
            RUB: 'Rus Rublesi',
          },
        },
      },
      transactions: {
        header: 'İşlem geçmişi',
        details: {
          title: 'İşlem detayları',
          type: 'İşlem türü',
          amount: 'Tutar',
          account: 'Hesap',
          category: 'Kategori',
          date: 'Tarih',
          note: 'Not',
          relatedDebt: 'Bağlı borç',
          close: 'Kapat',
        },
        filterSheet: {
          title: 'İşlemleri filtrele',
          dateRange: 'Tarih aralığı',
          category: 'Kategori',
          accounts: 'Hesaplar',
          type: 'İşlem türü',
          amount: 'Tutar aralığı',
          from: 'Başlangıç',
          to: 'Bitiş',
          close: 'Kapat',
          clearHint: 'Temizlemek için basılı tutun',
          selectDate: 'Tarih seç',
          reset: 'Sıfırla',
          apply: 'Uygula',
          all: 'Tümü',
          typeOptions: {
            income: 'Gelir',
            expense: 'Gider',
            transfer: 'Transfer',
            debt: 'Borç',
          },
        },
        quick: {
          incomeHeader: '+ Gelir',
          outcomeHeader: '- Gider',
          amountPlaceholder: 'Tutar girin',
          debtOwedToYouLabel: 'Kim size borçlu?',
          debtOwedToYouPlaceholder: 'Borçlu adı',
          debtYouOweLabel: 'Kime borçlusunuz?',
          debtYouOwePlaceholder: 'Alacaklı adı',
          categoryAddTitle: 'Kategori ekle',
          categoryEditTitle: 'Kategoriyi düzenle',
          categoryPlaceholder: 'Kategori adı',
          save: 'Kaydı kaydet',
          update: 'Değişiklikleri kaydet',
        },
        transferForm: {
          title: 'Hesaplar arası transfer',
          submit: 'Transfer',
          amountPlaceholder: 'Tutar',
          fromAccount: 'Hangi hesaptan',
          toAccount: 'Hangi hesaba',
          exchangeRate: 'Döviz kuru',
          auto: 'Oto',
          conversionInfo: '{amount} alınacak',
          resetRate: 'Oto kura dön',
          date: 'Tarih',
          time: 'Saat',
          notePlaceholder: 'İsteğe bağlı açıklama ekleyin…',
          pickerDone: 'Tamam',
          selectAccount: 'Hesap seç',
          rateInfoTemplate:
            'Kur: 1 {toCurrency} = {rate} {fromCurrency}. Alınan: {amount}',
        },
      },
      budgets: {
        today: 'Bugünkü bütçe özeti',
        dateTemplate: '{date} bütçe özeti',
      mainTitle: 'Ana bütçe',
      categoriesTitle: 'Kategoriler',
      addCategory: 'Kategori ekle',
      setLimit: 'Limit belirle',
      states: { exceeding: 'Limit aşıldı', fixed: 'Sabit', within: 'Sınır içinde' },
      detail: {
        title: 'Bütçe detayları',
        status: 'Durum',
        linkedGoal: 'Bağlı hedef',
        goalUnlinked: 'Hedefe bağlı değil',
        accountLabel: 'Hesap',
        currencyLabel: 'Bütçe para birimi',
        limitLabel: 'Limit',
        spentLabel: 'Harcanan',
        remainingLabel: 'Kalan',
        balanceLabel: 'Güncel bakiye',
        createdAt: 'Oluşturuldu',
        updatedAt: 'Güncellendi',
        categoriesLabel: 'Kategoriler',
        notifyLabel: 'Limit aşımında uyar',
        valueAddTitle: 'Değer ekleme',
        valueAddAccountCurrency: 'Hesap para birimi',
        valueAddBudgetCurrency: 'Bütçe para birimi',
        valueAddDisplayCurrency: 'Görüntüleme para birimi',
        actions: {
          title: 'İşlemler',
          edit: 'Bütçeyi düzenle',
          delete: 'Bütçeyi sil',
          viewGoal: 'Hedefi aç',
          viewTransactions: 'İşlemleri gör',
          addToBudget: 'Bütçeye ekle',
          confirmDeleteTitle: 'Bütçe silinsin mi?',
          confirmDeleteMessage: 'Bütçe arşivlenecek ve hedef bağlantıları kaldırılacak.',
          confirmDeleteConfirm: 'Sil',
          confirmDeleteCancel: 'İptal',
        },
      },
      form: {
        nameLabel: 'Bütçe adı',
        namePlaceholder: 'Bütçe adı',
        limitPlaceholder: '0',
        periodLabel: 'Bütçe dönemi',
        periodOptions: {
          weekly: 'Haftalık',
          monthly: 'Aylık',
          custom_range: 'Özel aralık',
        },
        selectedRangeLabel: 'Seçilen aralık: {range}',
        customRange: {
          start: 'Başlangıç tarihi',
          end: 'Bitiş tarihi',
          helper: 'Özel bir tarih aralığı seçin',
          error: 'Başlangıç ve bitiş tarihlerini seçin',
        },
      },
    },
      analytics: {
        header: 'Finansal analiz',
        expenseDynamics: 'Gider dinamikleri',
        comparison: 'Önceki ay ile karşılaştırma',
        topExpenses: 'Kategorilere göre en yüksek giderler',
        aiInsights: 'Yapay zekâ içgörüleri',
        stats: { peak: 'Zirve', average: 'Ortalama', trend: 'Trend' },
        comparisonRows: { income: 'Gelir:', outcome: 'Gider:', savings: 'Tasarruf:' },
      },
      debts: {
        sections: { incoming: 'Alacaklarım', outgoing: 'Borçlarım' },
        timeline: {
          incoming: 'Ne zaman döner',
          outgoing: 'Periyot',
          today: 'Bugün vadesi',
          inDays: '{count} gün içinde ödenecek',
          overdue: '{count} gün gecikmiş',
        },
        actions: {
          incoming: { notify: 'Hatırlat', cancel: 'Borca son ver' },
          outgoing: { plan: 'Planla', partial: 'Kısmi ödeme' },
        },
        summary: {
          balanceLabel: 'Toplam bakiye',
          givenLabel: 'Verilen toplam',
          takenLabel: 'Toplam borç',
          givenChange: '+%15 Aralık',
          takenChange: '-%8 Aralık',
        },
        modal: {
          title: 'Yeni borç ekle',
          editTitle: 'Borcu düzenle',
          subtitle: 'Verdiğiniz veya aldığınız borçları takip edin',
          typeLabel: 'Tür',
          borrowedLabel: 'Ben borçluyum',
          lentLabel: 'Bana borçlu',
          person: 'İsim / Kişi',
          personPlaceholder: 'Bu borç kime ait?',
          amount: 'Tutar',
          accountLabel: 'Cüzdan',
          accountHelper: 'Bu işlem için kullanılacak hesabı seçin',
          accountPickerTitle: 'Cüzdan seç',
          currencyLabel: 'Para birimi',
          currencyHelper: 'Borç hangi para biriminde?',
          currencyPickerTitle: 'Para birimi seç',
          dateLabel: 'Tarih',
          changeDate: 'Tarihi değiştir',
          clear: 'Temizle',
          selectAccount: 'Cüzdan seç',
          expectedReturn: 'Beklenen dönüş tarihi',
          expectedPlaceholder: 'Vade belirlenmedi',
        selectDate: 'Tarih seç',
        note: 'Not',
        notePlaceholder: 'İsteğe bağlı açıklama ekleyin…',
        personDirectional: {
          incoming: { label: 'Kimden aldınız?', placeholder: 'Borç veren kişi' },
          outgoing: { label: 'Kime veriyorsunuz?', placeholder: 'Borç alan kişi' },
        },
        toggles: { incoming: 'Bana borçlu', outgoing: 'Ben borçluyum' },
        manageActions: 'Borcu yönet',
        accountDirectional: {
          incoming: {
            label: 'Hangi cüzdana yatacak',
            helper: 'Para seçilen cüzdana yatacak ({accountCurrency}).',
          },
          outgoing: {
            label: 'Hangi cüzdandan çıkacak',
            helper: 'Para seçilen cüzdandan düşecek ({accountCurrency}).',
          },
        },
        currencyFlow: {
          incoming: '{debtCurrency} alıyorsunuz → {accountCurrency} cüzdana yatıyor',
          outgoing: '{debtCurrency} veriyorsunuz → {accountCurrency} cüzdandan düşüyor',
        },
        counterpartyPickerTitle: 'Kişi seçin',
        counterpartySearchPlaceholder: 'İsim ara',
        counterpartyAddAction: '"{query}" kişisini ekle',
        counterpartyEmpty: 'Henüz kişi yok. Önce birini ekleyin.',
        counterpartyActions: {
          renameTitle: 'Kişiyi yeniden adlandır',
          renamePlaceholder: 'Yeni isim girin',
          renameSave: 'Kaydet',
          renameCancel: 'İptal',
          deleteTitle: 'Kişi silinsin mi?',
          deleteDescription: 'Bu kişi listeden kalıcı olarak silinecek.',
          deleteConfirm: 'Sil',
          deleteBlocked: 'Borçla ilişkili kişiyi silemezsiniz.',
          duplicateName: 'Bu isim zaten mevcut.',
        },
          buttons: {
            cancel: 'İptal',
            save: 'Kaydet',
            saveChanges: 'Kaydet',
            delete: 'Sil',
          },
          defaults: { name: 'Yeni borç', description: 'Açıklama', due: 'Vade yok' },
          deleteTitle: 'Borcu sil',
          deleteDescription: 'Bu borcu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        status: {
          lent: 'Para verdiniz',
          borrowed: 'Para aldınız',
        },
        scheduleTitle: 'Ödeme planı',
        reminderTitle: 'Bildirimler',
        reminderToggle: 'Bildirim aç',
        reminderTimeLabel: 'Bildirim saati (SS:dd)',
        reminderEnabledLabel: 'Bildirimler açık',
        reminderDisabledLabel: 'Bildirimler kapalı',
        payment: {
          title: 'Ödeme kaydı',
          amount: 'Ödeme tutarı',
          accountLabel: 'Hangi cüzdandan',
          currencyLabel: 'Ödeme para birimi',
          note: 'Ödeme notu',
          helper: 'Kısmi ödemeleri ve kapatmaları takip edin.',
          submit: 'Ödemeyi uygula',
          limitError: 'Ödeme tutarı kalan borcu aşamaz',
        },
        actionsBar: {
          pay: 'Borcu öde',
          partial: 'Kısmi ödeme',
          notify: 'Bildirim',
          schedule: 'Tarihleri yönet',
        },
        manualRate: {
          title: 'Dönüşüm',
          description:
            'Borç para birimi {debtCurrency}. Cüzdan para birimi {accountCurrency}. {accountCurrency} olarak düşülecek tutarı girin.',
          toggle: 'Manuel gir',
          amountLabel: '{currency} olarak düşülecek tutar',
        },
        fullPaymentTitle: 'Borcu tamamen öde',
        fullPaymentDescription: 'Kalan {amount} tutarın tamamı ödendi olarak işaretlenecek.',
        fullPaymentSubmit: 'Tamamını öde',
      },
      },
    },
  },
} satisfies Record<SupportedLanguage, AppTranslations>;

export const APP_TRANSLATIONS: Record<SupportedLanguage, AppTranslations> = t;
