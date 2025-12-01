import { useLocalization } from '../useLocalization';
import { SupportedLanguage } from '@/stores/useSettingsStore';

// ─────────────────────────────────────────────────────────────────────────────
// THEME SETTINGS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeOptionLocalization {
  label: string;
  description: string;
}

export interface ThemeSettingsLocalization {
  sectionTitle: string;
  headsUp: {
    title: string;
    description: string;
  };
  options: {
    dark: ThemeOptionLocalization;
    light: ThemeOptionLocalization;
    auto: ThemeOptionLocalization;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SETTINGS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationsSettingsLocalization {
  sections: {
    main: string;
    finance: string;
    taskAndGoals: string;
    habits: string;
    aiAssistant: string;
    doNotDisturb: string;
  };
  main: {
    pushNotifications: string;
    sound: string;
    vibration: string;
    showOnLockScreen: string;
  };
  finance: {
    budgetOverspend: string;
    debtReminder: string;
    unusualSpends: string;
    financialGoalsAchievements: string;
    time: string;
  };
  taskAndGoals: {
    taskReminder: string;
    deadline: string;
    goalProgress: string;
    taskRescheduleSuggestion: string;
    before: string;
    everyday: string;
  };
  habits: {
    morningHabits: string;
    nightHabits: string;
    streakReminder: string;
    motivationalMessages: string;
  };
  aiAssistant: {
    smartRecommendation: string;
    insightAndAnalytics: string;
    mentorsAdvices: string;
    predictionsAndForecasts: string;
    timesPerDay: string;
    everyWeek: string;
  };
  doNotDisturb: {
    dontDisturb: string;
    time: string;
    from: string;
    to: string;
    onWeekends: string;
  };
  actions: {
    save: string;
    testNotification: string;
  };
  timeUnits: {
    mins: string;
    day: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI SETTINGS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AISettingsLocalization {
  sections: {
    coreAssistant: string;
    areasOfApplication: string;
    personalization: string;
    speechSettings: string;
    aiTraining: string;
    virtualMentors: string;
  };
  coreAssistant: {
    helpLevel: string;
    levels: {
      minimal: string;
      medium: string;
      maximum: string;
    };
  };
  areasOfApplication: {
    voiceRecognition: {
      label: string;
      description: string;
    };
    transactionCategories: {
      label: string;
      description: string;
      accuracy: string;
    };
    smartReminders: {
      label: string;
      description: string;
    };
    predictionsAnalytics: {
      label: string;
      description: string;
    };
    motivationalMessages: {
      label: string;
      description: string;
    };
    scheduleOptimization: {
      label: string;
      description: string;
    };
  };
  personalization: {
    assistantName: {
      label: string;
      placeholder: string;
    };
    talkStyle: {
      label: string;
      options: {
        friendly: string;
        formal: string;
        casual: string;
      };
    };
    language: string;
  };
  speechSettings: {
    voiceTyping: {
      label: string;
      description: string;
      enabled: string;
      muted: string;
    };
    inputMode: {
      label: string;
      options: {
        button: string;
        gesture: string;
        sentence: string;
      };
    };
    speechLanguage: string;
    voiceTraining: {
      label: string;
      description: string;
      start: string;
    };
  };
  aiTraining: {
    lastUpdate: string;
    categorizingAccuracy: string;
    personalRules: string;
    ruleSettings: string;
    daysAgo: string;
  };
  virtualMentors: {
    active: string;
    addNewMentor: string;
    tags: {
      financial: string;
      productivity: string;
      balance: string;
      custom: string;
    };
  };
  actions: {
    resetAiSettings: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED SETTINGS LOCALIZATION TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface SettingsLocalization {
  theme: ThemeSettingsLocalization;
  notifications: NotificationsSettingsLocalization;
  ai: AISettingsLocalization;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH (EN)
// ─────────────────────────────────────────────────────────────────────────────

const EN: SettingsLocalization = {
  theme: {
    sectionTitle: 'Appearance',
    headsUp: {
      title: 'Heads up',
      description:
        'Switching to System mode will follow your device appearance automatically. Dark reduces eye strain at night, while Light keeps cards bright for daytime viewing.',
    },
    options: {
      dark: {
        label: 'Dark',
        description: 'Deep contrast for OLED and night sessions.',
      },
      light: {
        label: 'Light',
        description: 'Bright surfaces for daylight clarity.',
      },
      auto: {
        label: 'System',
        description: "Match your device's appearance automatically.",
      },
    },
  },
  notifications: {
    sections: {
      main: 'Main',
      finance: 'Finance',
      taskAndGoals: 'Task and goals',
      habits: 'Habits',
      aiAssistant: 'AI assistant',
      doNotDisturb: 'Do Not Disturb',
    },
    main: {
      pushNotifications: 'Push-notifications',
      sound: 'Sound',
      vibration: 'Vibration',
      showOnLockScreen: 'Show on lock screen',
    },
    finance: {
      budgetOverspend: 'Budget overspend',
      debtReminder: 'Debt reminder',
      unusualSpends: 'Unusual spends',
      financialGoalsAchievements: 'Financial goals achievements',
      time: 'Time:',
    },
    taskAndGoals: {
      taskReminder: 'Task reminder',
      deadline: 'Deadline',
      goalProgress: 'Goal progress',
      taskRescheduleSuggestion: 'Task reschedule suggestion',
      before: 'before',
      everyday: 'Everyday',
    },
    habits: {
      morningHabits: 'Morning habits',
      nightHabits: 'Night habits',
      streakReminder: 'Streak reminder',
      motivationalMessages: 'Motivational messages',
    },
    aiAssistant: {
      smartRecommendation: 'Smart recommendation',
      insightAndAnalytics: 'Insight and analytics',
      mentorsAdvices: 'Mentors advices',
      predictionsAndForecasts: 'Predictions & Forecasts',
      timesPerDay: '2 times / day',
      everyWeek: 'Every week',
    },
    doNotDisturb: {
      dontDisturb: "Don't disturb",
      time: 'Time:',
      from: 'from',
      to: 'to',
      onWeekends: 'on Weekends',
    },
    actions: {
      save: 'Save',
      testNotification: 'Test notification',
    },
    timeUnits: {
      mins: 'mins',
      day: 'day',
    },
  },
  ai: {
    sections: {
      coreAssistant: 'Core Assistant',
      areasOfApplication: 'Areas of Application',
      personalization: 'Personalization',
      speechSettings: 'Speech Settings',
      aiTraining: 'AI Training',
      virtualMentors: 'Virtual mentors',
    },
    coreAssistant: {
      helpLevel: 'Help level',
      levels: {
        minimal: 'Minimal',
        medium: 'Medium',
        maximum: 'Maximum',
      },
    },
    areasOfApplication: {
      voiceRecognition: {
        label: 'Voice recognition',
        description: 'Capture and transcribe commands instantly.',
      },
      transactionCategories: {
        label: 'Transaction categories',
        description: 'Auto-sort expenses into smart folders.',
        accuracy: 'Accuracy',
      },
      smartReminders: {
        label: 'Smart reminders',
        description: 'Surface nudges when timing matters.',
      },
      predictionsAnalytics: {
        label: 'Predictions & Analytics',
        description: 'Forecast balances and spending trends.',
      },
      motivationalMessages: {
        label: 'Motivational messages',
        description: 'Stay encouraged with micro-coaching.',
      },
      scheduleOptimization: {
        label: 'Schedule optimization',
        description: 'Re-balance your routines automatically.',
      },
    },
    personalization: {
      assistantName: {
        label: 'Assistant name',
        placeholder: 'Assistant name',
      },
      talkStyle: {
        label: 'Talk style',
        options: {
          friendly: 'Friendly',
          formal: 'Formal',
          casual: 'Casual',
        },
      },
      language: 'Language',
    },
    speechSettings: {
      voiceTyping: {
        label: 'Voice typing',
        description: 'Replace manual typing with dictation.',
        enabled: 'Enabled',
        muted: 'Muted',
      },
      inputMode: {
        label: 'Input mode',
        options: {
          button: 'Button',
          gesture: 'Gesture',
          sentence: 'Sentence',
        },
      },
      speechLanguage: 'Speech language',
      voiceTraining: {
        label: 'Voice training',
        description: 'Teach Leora to match your tone.',
        start: 'Start',
      },
    },
    aiTraining: {
      lastUpdate: 'Last update',
      categorizingAccuracy: 'Categorizing accuracy',
      personalRules: 'Personal rules',
      ruleSettings: 'Rule settings',
      daysAgo: 'days ago',
    },
    virtualMentors: {
      active: 'Active',
      addNewMentor: '+ Add new mentor',
      tags: {
        financial: 'Financial',
        productivity: 'Productivity',
        balance: 'Balance',
        custom: 'Custom',
      },
    },
    actions: {
      resetAiSettings: 'Reset AI settings',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RUSSIAN (RU)
// ─────────────────────────────────────────────────────────────────────────────

const RU: SettingsLocalization = {
  theme: {
    sectionTitle: 'Внешний вид',
    headsUp: {
      title: 'Обратите внимание',
      description:
        'Системный режим автоматически следует настройкам устройства. Тёмная тема снижает нагрузку на глаза ночью, а светлая обеспечивает чёткость днём.',
    },
    options: {
      dark: {
        label: 'Тёмная',
        description: 'Глубокий контраст для OLED и ночного режима.',
      },
      light: {
        label: 'Светлая',
        description: 'Яркие поверхности для дневного просмотра.',
      },
      auto: {
        label: 'Системная',
        description: 'Автоматически следует настройкам устройства.',
      },
    },
  },
  notifications: {
    sections: {
      main: 'Основные',
      finance: 'Финансы',
      taskAndGoals: 'Задачи и цели',
      habits: 'Привычки',
      aiAssistant: 'ИИ-ассистент',
      doNotDisturb: 'Не беспокоить',
    },
    main: {
      pushNotifications: 'Push-уведомления',
      sound: 'Звук',
      vibration: 'Вибрация',
      showOnLockScreen: 'Показывать на экране блокировки',
    },
    finance: {
      budgetOverspend: 'Превышение бюджета',
      debtReminder: 'Напоминание о долгах',
      unusualSpends: 'Необычные траты',
      financialGoalsAchievements: 'Достижение финансовых целей',
      time: 'Время:',
    },
    taskAndGoals: {
      taskReminder: 'Напоминание о задаче',
      deadline: 'Дедлайн',
      goalProgress: 'Прогресс цели',
      taskRescheduleSuggestion: 'Предложение о переносе задачи',
      before: 'за',
      everyday: 'Ежедневно',
    },
    habits: {
      morningHabits: 'Утренние привычки',
      nightHabits: 'Вечерние привычки',
      streakReminder: 'Напоминание о серии',
      motivationalMessages: 'Мотивационные сообщения',
    },
    aiAssistant: {
      smartRecommendation: 'Умные рекомендации',
      insightAndAnalytics: 'Аналитика и инсайты',
      mentorsAdvices: 'Советы менторов',
      predictionsAndForecasts: 'Прогнозы и предсказания',
      timesPerDay: '2 раза в день',
      everyWeek: 'Каждую неделю',
    },
    doNotDisturb: {
      dontDisturb: 'Не беспокоить',
      time: 'Время:',
      from: 'с',
      to: 'до',
      onWeekends: 'По выходным',
    },
    actions: {
      save: 'Сохранить',
      testNotification: 'Тестовое уведомление',
    },
    timeUnits: {
      mins: 'мин',
      day: 'день',
    },
  },
  ai: {
    sections: {
      coreAssistant: 'Основной ассистент',
      areasOfApplication: 'Области применения',
      personalization: 'Персонализация',
      speechSettings: 'Настройки речи',
      aiTraining: 'Обучение ИИ',
      virtualMentors: 'Виртуальные менторы',
    },
    coreAssistant: {
      helpLevel: 'Уровень помощи',
      levels: {
        minimal: 'Минимум',
        medium: 'Средний',
        maximum: 'Максимум',
      },
    },
    areasOfApplication: {
      voiceRecognition: {
        label: 'Распознавание голоса',
        description: 'Мгновенный захват и расшифровка команд.',
      },
      transactionCategories: {
        label: 'Категории транзакций',
        description: 'Автоматическая сортировка расходов.',
        accuracy: 'Точность',
      },
      smartReminders: {
        label: 'Умные напоминания',
        description: 'Своевременные подсказки, когда это важно.',
      },
      predictionsAnalytics: {
        label: 'Прогнозы и аналитика',
        description: 'Прогноз баланса и трендов расходов.',
      },
      motivationalMessages: {
        label: 'Мотивационные сообщения',
        description: 'Поддержка через микро-коучинг.',
      },
      scheduleOptimization: {
        label: 'Оптимизация расписания',
        description: 'Автоматическая балансировка распорядка.',
      },
    },
    personalization: {
      assistantName: {
        label: 'Имя ассистента',
        placeholder: 'Имя ассистента',
      },
      talkStyle: {
        label: 'Стиль общения',
        options: {
          friendly: 'Дружелюбный',
          formal: 'Формальный',
          casual: 'Непринуждённый',
        },
      },
      language: 'Язык',
    },
    speechSettings: {
      voiceTyping: {
        label: 'Голосовой ввод',
        description: 'Диктовка вместо ручного ввода.',
        enabled: 'Включён',
        muted: 'Выключен',
      },
      inputMode: {
        label: 'Режим ввода',
        options: {
          button: 'Кнопка',
          gesture: 'Жест',
          sentence: 'Фраза',
        },
      },
      speechLanguage: 'Язык речи',
      voiceTraining: {
        label: 'Обучение голосу',
        description: 'Научите Leora вашему стилю.',
        start: 'Начать',
      },
    },
    aiTraining: {
      lastUpdate: 'Последнее обновление',
      categorizingAccuracy: 'Точность категоризации',
      personalRules: 'Личные правила',
      ruleSettings: 'Настройки правил',
      daysAgo: 'дней назад',
    },
    virtualMentors: {
      active: 'Активно',
      addNewMentor: '+ Добавить ментора',
      tags: {
        financial: 'Финансы',
        productivity: 'Продуктивность',
        balance: 'Баланс',
        custom: 'Своё',
      },
    },
    actions: {
      resetAiSettings: 'Сбросить настройки ИИ',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UZBEK (UZ) - Latin
// ─────────────────────────────────────────────────────────────────────────────

const UZ: SettingsLocalization = {
  theme: {
    sectionTitle: 'Tashqi koʻrinish',
    headsUp: {
      title: 'Eslatma',
      description:
        "Tizim rejimida qurilma sozlamalariga avtomatik moslashadi. Qorong'i rejim tungi koʻrishda koʻzni charchatmaydi, yorug'i esa kunduzi aniqlikni ta'minlaydi.",
    },
    options: {
      dark: {
        label: "Qorong'i",
        description: 'OLED va tungi seanslar uchun chuqur kontrast.',
      },
      light: {
        label: "Yorug'",
        description: "Kunduzi aniqlik uchun yorqin yuzalar.",
      },
      auto: {
        label: 'Tizim',
        description: 'Qurilma sozlamalariga avtomatik moslashadi.',
      },
    },
  },
  notifications: {
    sections: {
      main: 'Asosiy',
      finance: 'Moliya',
      taskAndGoals: 'Vazifalar va maqsadlar',
      habits: 'Odatlar',
      aiAssistant: 'Sun\'iy intellekt yordamchisi',
      doNotDisturb: 'Bezovta qilmang',
    },
    main: {
      pushNotifications: 'Push-bildirishnomalar',
      sound: 'Ovoz',
      vibration: 'Tebranish',
      showOnLockScreen: 'Qulflangan ekranda koʻrsatish',
    },
    finance: {
      budgetOverspend: 'Byudjetdan oshib ketish',
      debtReminder: 'Qarz eslatmasi',
      unusualSpends: "Noodatiy xarajatlar",
      financialGoalsAchievements: 'Moliyaviy maqsadlarga erishish',
      time: 'Vaqt:',
    },
    taskAndGoals: {
      taskReminder: 'Vazifa eslatmasi',
      deadline: 'Muddat',
      goalProgress: 'Maqsad jarayoni',
      taskRescheduleSuggestion: 'Vazifani qayta rejalashtirish taklifi',
      before: 'oldin',
      everyday: 'Har kuni',
    },
    habits: {
      morningHabits: 'Ertalabki odatlar',
      nightHabits: 'Kechki odatlar',
      streakReminder: 'Seriya eslatmasi',
      motivationalMessages: 'Motivatsion xabarlar',
    },
    aiAssistant: {
      smartRecommendation: 'Aqlli tavsiyalar',
      insightAndAnalytics: 'Tahlil va tushunchalar',
      mentorsAdvices: 'Mentorlar maslahatlari',
      predictionsAndForecasts: 'Bashoratlar va prognozlar',
      timesPerDay: 'Kuniga 2 marta',
      everyWeek: 'Har hafta',
    },
    doNotDisturb: {
      dontDisturb: 'Bezovta qilmang',
      time: 'Vaqt:',
      from: 'dan',
      to: 'gacha',
      onWeekends: 'Dam olish kunlari',
    },
    actions: {
      save: 'Saqlash',
      testNotification: 'Test bildirishnomasi',
    },
    timeUnits: {
      mins: 'daqiqa',
      day: 'kun',
    },
  },
  ai: {
    sections: {
      coreAssistant: 'Asosiy yordamchi',
      areasOfApplication: "Qo'llash sohalari",
      personalization: 'Shaxsiylashtirish',
      speechSettings: 'Nutq sozlamalari',
      aiTraining: "Sun'iy intellekt o'qitish",
      virtualMentors: 'Virtual mentorlar',
    },
    coreAssistant: {
      helpLevel: 'Yordam darajasi',
      levels: {
        minimal: 'Minimal',
        medium: "O'rtacha",
        maximum: 'Maksimal',
      },
    },
    areasOfApplication: {
      voiceRecognition: {
        label: 'Ovozni aniqlash',
        description: "Buyruqlarni tezda yozib olish va transkripsiya qilish.",
      },
      transactionCategories: {
        label: 'Tranzaksiya kategoriyalari',
        description: "Xarajatlarni avtomatik saralash.",
        accuracy: 'Aniqlik',
      },
      smartReminders: {
        label: 'Aqlli eslatmalar',
        description: "Vaqt muhim bo'lganda ogohlantirish.",
      },
      predictionsAnalytics: {
        label: 'Bashoratlar va tahlil',
        description: 'Balans va xarajat tendensiyalarini bashorat qilish.',
      },
      motivationalMessages: {
        label: 'Motivatsion xabarlar',
        description: 'Mikro-kouching orqali qo\'llab-quvvatlash.',
      },
      scheduleOptimization: {
        label: 'Jadval optimallashtirish',
        description: 'Kundalik tartibni avtomatik muvozanatlash.',
      },
    },
    personalization: {
      assistantName: {
        label: 'Yordamchi nomi',
        placeholder: 'Yordamchi nomi',
      },
      talkStyle: {
        label: 'Suhbat uslubi',
        options: {
          friendly: "Do'stona",
          formal: 'Rasmiy',
          casual: 'Oddiy',
        },
      },
      language: 'Til',
    },
    speechSettings: {
      voiceTyping: {
        label: 'Ovozli yozuv',
        description: "Qo'lda yozish o'rniga diktovka.",
        enabled: 'Yoqilgan',
        muted: "O'chirilgan",
      },
      inputMode: {
        label: 'Kiritish rejimi',
        options: {
          button: 'Tugma',
          gesture: 'Imo-ishora',
          sentence: 'Jumla',
        },
      },
      speechLanguage: 'Nutq tili',
      voiceTraining: {
        label: "Ovozni o'rgatish",
        description: 'Leoraga uslubingizni o\'rgating.',
        start: 'Boshlash',
      },
    },
    aiTraining: {
      lastUpdate: "So'nggi yangilanish",
      categorizingAccuracy: 'Kategoriyalash aniqligi',
      personalRules: 'Shaxsiy qoidalar',
      ruleSettings: 'Qoidalar sozlamalari',
      daysAgo: 'kun oldin',
    },
    virtualMentors: {
      active: 'Faol',
      addNewMentor: "+ Yangi mentor qo'shish",
      tags: {
        financial: 'Moliyaviy',
        productivity: 'Samaradorlik',
        balance: 'Muvozanat',
        custom: 'Maxsus',
      },
    },
    actions: {
      resetAiSettings: "Sun'iy intellekt sozlamalarini tiklash",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ARABIC (AR)
// ─────────────────────────────────────────────────────────────────────────────

const AR: SettingsLocalization = {
  theme: {
    sectionTitle: 'المظهر',
    headsUp: {
      title: 'تنبيه',
      description:
        'وضع النظام يتبع إعدادات جهازك تلقائياً. الوضع الداكن يريح العينين ليلاً، والوضع الفاتح يوفر وضوحاً أفضل نهاراً.',
    },
    options: {
      dark: {
        label: 'داكن',
        description: 'تباين عميق لشاشات OLED والاستخدام الليلي.',
      },
      light: {
        label: 'فاتح',
        description: 'أسطح مشرقة للوضوح النهاري.',
      },
      auto: {
        label: 'النظام',
        description: 'يتبع مظهر جهازك تلقائياً.',
      },
    },
  },
  notifications: {
    sections: {
      main: 'الرئيسية',
      finance: 'المالية',
      taskAndGoals: 'المهام والأهداف',
      habits: 'العادات',
      aiAssistant: 'مساعد الذكاء الاصطناعي',
      doNotDisturb: 'عدم الإزعاج',
    },
    main: {
      pushNotifications: 'الإشعارات الفورية',
      sound: 'الصوت',
      vibration: 'الاهتزاز',
      showOnLockScreen: 'العرض على شاشة القفل',
    },
    finance: {
      budgetOverspend: 'تجاوز الميزانية',
      debtReminder: 'تذكير بالديون',
      unusualSpends: 'مصروفات غير عادية',
      financialGoalsAchievements: 'تحقيق الأهداف المالية',
      time: 'الوقت:',
    },
    taskAndGoals: {
      taskReminder: 'تذكير بالمهمة',
      deadline: 'الموعد النهائي',
      goalProgress: 'تقدم الهدف',
      taskRescheduleSuggestion: 'اقتراح إعادة جدولة المهمة',
      before: 'قبل',
      everyday: 'يومياً',
    },
    habits: {
      morningHabits: 'العادات الصباحية',
      nightHabits: 'العادات المسائية',
      streakReminder: 'تذكير بالسلسلة',
      motivationalMessages: 'رسائل تحفيزية',
    },
    aiAssistant: {
      smartRecommendation: 'توصيات ذكية',
      insightAndAnalytics: 'التحليلات والرؤى',
      mentorsAdvices: 'نصائح المرشدين',
      predictionsAndForecasts: 'التنبؤات والتوقعات',
      timesPerDay: 'مرتين يومياً',
      everyWeek: 'كل أسبوع',
    },
    doNotDisturb: {
      dontDisturb: 'عدم الإزعاج',
      time: 'الوقت:',
      from: 'من',
      to: 'إلى',
      onWeekends: 'في عطلة نهاية الأسبوع',
    },
    actions: {
      save: 'حفظ',
      testNotification: 'إشعار تجريبي',
    },
    timeUnits: {
      mins: 'دقيقة',
      day: 'يوم',
    },
  },
  ai: {
    sections: {
      coreAssistant: 'المساعد الأساسي',
      areasOfApplication: 'مجالات التطبيق',
      personalization: 'التخصيص',
      speechSettings: 'إعدادات الصوت',
      aiTraining: 'تدريب الذكاء الاصطناعي',
      virtualMentors: 'المرشدون الافتراضيون',
    },
    coreAssistant: {
      helpLevel: 'مستوى المساعدة',
      levels: {
        minimal: 'أدنى',
        medium: 'متوسط',
        maximum: 'أقصى',
      },
    },
    areasOfApplication: {
      voiceRecognition: {
        label: 'التعرف على الصوت',
        description: 'التقاط الأوامر ونسخها فوراً.',
      },
      transactionCategories: {
        label: 'فئات المعاملات',
        description: 'فرز المصروفات تلقائياً.',
        accuracy: 'الدقة',
      },
      smartReminders: {
        label: 'تذكيرات ذكية',
        description: 'تنبيهات في الوقت المناسب.',
      },
      predictionsAnalytics: {
        label: 'التنبؤات والتحليلات',
        description: 'توقع الأرصدة واتجاهات الإنفاق.',
      },
      motivationalMessages: {
        label: 'رسائل تحفيزية',
        description: 'دعم مستمر عبر التوجيه المصغر.',
      },
      scheduleOptimization: {
        label: 'تحسين الجدول',
        description: 'موازنة روتينك تلقائياً.',
      },
    },
    personalization: {
      assistantName: {
        label: 'اسم المساعد',
        placeholder: 'اسم المساعد',
      },
      talkStyle: {
        label: 'أسلوب المحادثة',
        options: {
          friendly: 'ودود',
          formal: 'رسمي',
          casual: 'عفوي',
        },
      },
      language: 'اللغة',
    },
    speechSettings: {
      voiceTyping: {
        label: 'الكتابة الصوتية',
        description: 'استبدال الكتابة اليدوية بالإملاء.',
        enabled: 'مفعّل',
        muted: 'معطّل',
      },
      inputMode: {
        label: 'وضع الإدخال',
        options: {
          button: 'زر',
          gesture: 'إيماءة',
          sentence: 'جملة',
        },
      },
      speechLanguage: 'لغة التحدث',
      voiceTraining: {
        label: 'تدريب الصوت',
        description: 'علّم Leora أسلوبك.',
        start: 'ابدأ',
      },
    },
    aiTraining: {
      lastUpdate: 'آخر تحديث',
      categorizingAccuracy: 'دقة التصنيف',
      personalRules: 'القواعد الشخصية',
      ruleSettings: 'إعدادات القواعد',
      daysAgo: 'أيام مضت',
    },
    virtualMentors: {
      active: 'نشط',
      addNewMentor: '+ إضافة مرشد جديد',
      tags: {
        financial: 'مالي',
        productivity: 'إنتاجية',
        balance: 'توازن',
        custom: 'مخصص',
      },
    },
    actions: {
      resetAiSettings: 'إعادة تعيين إعدادات الذكاء الاصطناعي',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TURKISH (TR)
// ─────────────────────────────────────────────────────────────────────────────

const TR: SettingsLocalization = {
  theme: {
    sectionTitle: 'Görünüm',
    headsUp: {
      title: 'Bilgi',
      description:
        'Sistem modu, cihazınızın görünümünü otomatik olarak takip eder. Karanlık mod geceleri göz yorgunluğunu azaltır, aydınlık mod ise gündüz netliği sağlar.',
    },
    options: {
      dark: {
        label: 'Karanlık',
        description: 'OLED ve gece kullanımı için derin kontrast.',
      },
      light: {
        label: 'Aydınlık',
        description: 'Gündüz netliği için parlak yüzeyler.',
      },
      auto: {
        label: 'Sistem',
        description: 'Cihazınızın görünümüne otomatik uyum sağlar.',
      },
    },
  },
  notifications: {
    sections: {
      main: 'Ana',
      finance: 'Finans',
      taskAndGoals: 'Görevler ve hedefler',
      habits: 'Alışkanlıklar',
      aiAssistant: 'Yapay zeka asistanı',
      doNotDisturb: 'Rahatsız etmeyin',
    },
    main: {
      pushNotifications: 'Anlık bildirimler',
      sound: 'Ses',
      vibration: 'Titreşim',
      showOnLockScreen: 'Kilit ekranında göster',
    },
    finance: {
      budgetOverspend: 'Bütçe aşımı',
      debtReminder: 'Borç hatırlatıcısı',
      unusualSpends: 'Olağandışı harcamalar',
      financialGoalsAchievements: 'Finansal hedef başarıları',
      time: 'Saat:',
    },
    taskAndGoals: {
      taskReminder: 'Görev hatırlatıcısı',
      deadline: 'Son tarih',
      goalProgress: 'Hedef ilerlemesi',
      taskRescheduleSuggestion: 'Görevi yeniden planla önerisi',
      before: 'önce',
      everyday: 'Her gün',
    },
    habits: {
      morningHabits: 'Sabah alışkanlıkları',
      nightHabits: 'Akşam alışkanlıkları',
      streakReminder: 'Seri hatırlatıcısı',
      motivationalMessages: 'Motivasyon mesajları',
    },
    aiAssistant: {
      smartRecommendation: 'Akıllı öneriler',
      insightAndAnalytics: 'Analiz ve içgörüler',
      mentorsAdvices: 'Mentor tavsiyeleri',
      predictionsAndForecasts: 'Tahminler ve öngörüler',
      timesPerDay: 'Günde 2 kez',
      everyWeek: 'Her hafta',
    },
    doNotDisturb: {
      dontDisturb: 'Rahatsız etmeyin',
      time: 'Saat:',
      from: 'başlangıç',
      to: 'bitiş',
      onWeekends: 'Hafta sonları',
    },
    actions: {
      save: 'Kaydet',
      testNotification: 'Test bildirimi',
    },
    timeUnits: {
      mins: 'dakika',
      day: 'gün',
    },
  },
  ai: {
    sections: {
      coreAssistant: 'Ana Asistan',
      areasOfApplication: 'Uygulama Alanları',
      personalization: 'Kişiselleştirme',
      speechSettings: 'Konuşma Ayarları',
      aiTraining: 'Yapay Zeka Eğitimi',
      virtualMentors: 'Sanal mentorlar',
    },
    coreAssistant: {
      helpLevel: 'Yardım seviyesi',
      levels: {
        minimal: 'Minimum',
        medium: 'Orta',
        maximum: 'Maksimum',
      },
    },
    areasOfApplication: {
      voiceRecognition: {
        label: 'Ses tanıma',
        description: 'Komutları anında yakala ve çevir.',
      },
      transactionCategories: {
        label: 'İşlem kategorileri',
        description: 'Harcamaları otomatik sırala.',
        accuracy: 'Doğruluk',
      },
      smartReminders: {
        label: 'Akıllı hatırlatıcılar',
        description: 'Zamanlama önemli olduğunda uyarılar.',
      },
      predictionsAnalytics: {
        label: 'Tahminler ve Analitik',
        description: 'Bakiye ve harcama trendlerini tahmin et.',
      },
      motivationalMessages: {
        label: 'Motivasyon mesajları',
        description: 'Mikro koçluk ile destek ol.',
      },
      scheduleOptimization: {
        label: 'Program optimizasyonu',
        description: 'Rutinlerini otomatik dengele.',
      },
    },
    personalization: {
      assistantName: {
        label: 'Asistan adı',
        placeholder: 'Asistan adı',
      },
      talkStyle: {
        label: 'Konuşma tarzı',
        options: {
          friendly: 'Samimi',
          formal: 'Resmi',
          casual: 'Rahat',
        },
      },
      language: 'Dil',
    },
    speechSettings: {
      voiceTyping: {
        label: 'Sesle yazma',
        description: 'Elle yazmak yerine dikte kullan.',
        enabled: 'Etkin',
        muted: 'Kapalı',
      },
      inputMode: {
        label: 'Giriş modu',
        options: {
          button: 'Düğme',
          gesture: 'Hareket',
          sentence: 'Cümle',
        },
      },
      speechLanguage: 'Konuşma dili',
      voiceTraining: {
        label: 'Ses eğitimi',
        description: "Leora'ya tarzını öğret.",
        start: 'Başla',
      },
    },
    aiTraining: {
      lastUpdate: 'Son güncelleme',
      categorizingAccuracy: 'Kategorileme doğruluğu',
      personalRules: 'Kişisel kurallar',
      ruleSettings: 'Kural ayarları',
      daysAgo: 'gün önce',
    },
    virtualMentors: {
      active: 'Aktif',
      addNewMentor: '+ Yeni mentor ekle',
      tags: {
        financial: 'Finansal',
        productivity: 'Verimlilik',
        balance: 'Denge',
        custom: 'Özel',
      },
    },
    actions: {
      resetAiSettings: 'Yapay zeka ayarlarını sıfırla',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const SETTINGS_LOCALIZATION: Record<SupportedLanguage, SettingsLocalization> = {
  en: EN,
  ru: RU,
  uz: UZ,
  ar: AR,
  tr: TR,
};

export const useSettingsLocalization = () => {
  const { language } = useLocalization();
  return SETTINGS_LOCALIZATION[language] ?? SETTINGS_LOCALIZATION.en;
};

// Convenience hooks for individual screens
export const useThemeSettingsLocalization = () => {
  const settings = useSettingsLocalization();
  return settings.theme;
};

export const useNotificationsSettingsLocalization = () => {
  const settings = useSettingsLocalization();
  return settings.notifications;
};

export const useAISettingsLocalization = () => {
  const settings = useSettingsLocalization();
  return settings.ai;
};
