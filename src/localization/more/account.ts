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

// ============================================================================
// ENGLISH (EN)
// ============================================================================
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

// ============================================================================
// RUSSIAN (RU)
// ============================================================================
const RU: AccountLocalization = {
  achievements: {
    title: 'Достижения',
    completionLabel: 'Прогресс',
    lastAchievementLabel: 'Последнее достижение',
    completion: {
      done: 23,
      total: 50,
      percent: 46,
      last: {
        title: 'Марафонец',
        subtitle: '42 дня подряд',
        details: '+500 XP   Редкое   (15% пользователей)',
      },
    },
    recentlyUnlocked: {
      title: 'Недавно получены',
      items: [
        {
          title: 'Марафонец',
          time: '3 дня назад',
          subtitle: '42 дня подряд без пропусков',
          details: '+500 XP   Редкое   (15% пользователей)',
        },
        {
          title: 'Финансовый ГУРУ',
          time: 'Неделю назад',
          subtitle: 'Бюджет соблюдался 3 месяца подряд',
          details: '+300 XP   Необычное   (13% пользователей)',
        },
        {
          title: 'Снайпер целей',
          time: '2 недели назад',
          subtitle: '10 целей достигнуто',
          details: '+200 XP   Обычное   (35% пользователей)',
        },
      ],
    },
    closeToUnlocking: {
      title: 'Почти открыты',
      items: [
        {
          title: 'Горячая серия',
          progress: '95% (46/50)',
          subtitle: 'Активность 50 дней подряд',
          details: '+1000 XP   Эпическое   (2% пользователей)',
        },
        {
          title: 'Мастер привычек',
          progress: '80% (4/5)',
          subtitle: '5 привычек в течение 30 дней',
          details: '+750 XP   Редкое   (18% пользователей)',
        },
      ],
    },
    categories: {
      title: 'Категории',
      tabs: [
        { key: 'all', label: 'Все' },
        { key: 'financial', label: 'Финансы' },
        { key: 'efficiency', label: 'Эффективность' },
        { key: 'habits', label: 'Привычки' },
        { key: 'social', label: 'Социальные' },
        { key: 'special', label: 'Особые' },
      ],
      list: [
        { name: 'Финансы', count: '8/15' },
        { name: 'Эффективность', count: '6/12' },
        { name: 'Привычки', count: '5/10' },
        { name: 'Социальные', count: '2/8' },
        { name: 'Особые', count: '2/5' },
        { name: 'Скрытые', count: '???' },
      ],
      showAll: 'Показать все',
    },
  },
  premium: {
    planOverline: 'Тариф',
    manageSubscription: 'Управление подпиской',
    benefitsSectionTitle: {
      premium: 'Ваши преимущества PREMIUM',
      free: 'Преимущества PREMIUM',
    },
    usageSectionTitle: 'Использование за месяц',
    upgradeSectionTitle: {
      premium: 'Изменить тариф',
      free: 'Перейти на PREMIUM',
    },
    header: {
      premium: {
        title: 'PREMIUM',
        planLabel: 'Тариф',
        activeLabel: 'Активен до',
        planText: 'Месячный план ($9.99/мес)',
        activeUntil: '15 марта 2025 (68 дней)',
      },
      free: {
        title: 'БЕСПЛАТНЫЙ ПЛАН',
        planLabel: 'Тариф',
        planText: 'Бесплатно',
      },
    },
    benefits: [
      { label: 'Безлимитные транзакции', kind: 'compare', premium: '∞', free: '50' },
      { label: 'Все функции ИИ', kind: 'compare', premium: '∞', free: '10/мес' },
      { label: '10+ виртуальных наставников', kind: 'compare', premium: '10', free: '1' },
      { label: 'Синхронизация устройств', kind: 'compare', premium: '5', free: '1' },
      { label: 'Облачное резервное копирование', kind: 'check', premiumHas: true },
      { label: 'Премиум поддержка', kind: 'compare', premium: '<1ч', free: '24ч' },
      { label: 'Эксклюзивные стили', kind: 'compare', premium: '8', free: '2' },
      { label: 'Доступ к API', kind: 'check', premiumHas: true },
    ],
    usage: {
      premium: [
        { label: 'Транзакции', value: '248 добавлено' },
        { label: 'Запросы к ИИ', value: '89 использовано' },
        { label: 'Устройства', value: '3/5 подключено' },
        { label: 'Облако', value: '2.3 ГБ / 10 ГБ' },
      ],
      free: [
        { label: 'Транзакции', value: '35 добавлено' },
        { label: 'Запросы к ИИ', value: '13 использовано' },
        { label: 'Устройства', value: '1 подключено' },
        { label: 'Облако', value: '2.3 ГБ / 3 ГБ' },
      ],
    },
    planOptions: {
      monthly: {
        title: 'Месячный',
        price: '$9.99',
        subtitle: '$9.99 / месяц',
        rightChip: 'Текущий',
      },
      yearly: {
        title: 'Годовой',
        price: '$99',
        subtitle: '$99 / год',
        chip: 'ЭКОНОМИЯ $20',
      },
    },
    buttons: {
      changePlan: 'Сменить тариф',
      paymentHistory: 'История платежей',
    },
  },
  statistics: {
    sections: {
      focus: 'Показатели фокусировки',
      visual: 'Визуальная статистика',
      improvements: 'Зоны роста',
      insights: 'Рекомендации ИИ',
    },
    focusStats: [
      { label: 'Всего часов фокуса', value: '182 ч', meta: '+12% к прошлому месяцу' },
      { label: 'Глубокие сессии', value: '64', meta: 'В среднем 2.8 ч' },
      { label: 'Завершённые задачи', value: '326', meta: '78% выполнения' },
    ],
    visualBreakdown: {
      first: {
        label: 'Недельный коэффициент фокуса',
        meta: 'Лучший результат в среду',
        value: '68%',
        progress: 0.68,
      },
      second: {
        label: 'Достижение целей',
        meta: '10 из 12 недельных целей выполнено',
        value: '82%',
        progress: 0.82,
      },
    },
    improvementAreas: [
      { label: 'Продуктивность', score: 0.82, description: 'Стабильные ежедневные серии фокуса' },
      { label: 'Самочувствие', score: 0.68, description: 'Баланс перерывов улучшается, пейте больше воды' },
      { label: 'Командная работа', score: 0.75, description: 'Командные встречи проходят по плану' },
    ],
    aiInsights: [
      'Качество фокуса повышается, когда сессии начинаются до 10:00.',
      'Вы выполняете на 30% больше задач при использовании плейлистов для концентрации.',
      'Перерывы каждые 90 минут снижают переключение контекста.',
    ],
  },
};

// ============================================================================
// UZBEK (UZ - Latin)
// ============================================================================
const UZ: AccountLocalization = {
  achievements: {
    title: 'Yutuqlar',
    completionLabel: 'Bajarildi',
    lastAchievementLabel: 'Oxirgi yutuq',
    completion: {
      done: 23,
      total: 50,
      percent: 46,
      last: {
        title: 'Marafonchi',
        subtitle: '42 kun ketma-ket',
        details: '+500 XP   Noyob   (15% foydalanuvchilar)',
      },
    },
    recentlyUnlocked: {
      title: 'Yaqinda olingan',
      items: [
        {
          title: 'Marafonchi',
          time: '3 kun oldin',
          subtitle: '42 kun uzilishsiz faollik',
          details: '+500 XP   Noyob   (15% foydalanuvchilar)',
        },
        {
          title: 'Moliyaviy GURU',
          time: 'Bir hafta oldin',
          subtitle: 'Byudjet 3 oy ketma-ket saqlandi',
          details: '+300 XP   Kam uchraydigan   (13% foydalanuvchilar)',
        },
        {
          title: 'Maqsad sniperi',
          time: '2 hafta oldin',
          subtitle: '10 ta maqsadga erishildi',
          details: '+200 XP   Oddiy   (35% foydalanuvchilar)',
        },
      ],
    },
    closeToUnlocking: {
      title: 'Deyarli ochildi',
      items: [
        {
          title: 'Qizg\'in seriya',
          progress: '95% (46/50)',
          subtitle: '50 kun ketma-ket faollik',
          details: '+1000 XP   Epik   (2% foydalanuvchilar)',
        },
        {
          title: 'Odat ustasi',
          progress: '80% (4/5)',
          subtitle: '30 kun davomida 5 ta odat',
          details: '+750 XP   Noyob   (18% foydalanuvchilar)',
        },
      ],
    },
    categories: {
      title: 'Kategoriyalar',
      tabs: [
        { key: 'all', label: 'Barchasi' },
        { key: 'financial', label: 'Moliyaviy' },
        { key: 'efficiency', label: 'Samaradorlik' },
        { key: 'habits', label: 'Odatlar' },
        { key: 'social', label: 'Ijtimoiy' },
        { key: 'special', label: 'Maxsus' },
      ],
      list: [
        { name: 'Moliya', count: '8/15' },
        { name: 'Samaradorlik', count: '6/12' },
        { name: 'Odatlar', count: '5/10' },
        { name: 'Ijtimoiy', count: '2/8' },
        { name: 'Maxsus', count: '2/5' },
        { name: 'Yashirin', count: '???' },
      ],
      showAll: 'Hammasini ko\'rsatish',
    },
  },
  premium: {
    planOverline: 'Tarif',
    manageSubscription: 'Obunani boshqarish',
    benefitsSectionTitle: {
      premium: 'Sizning PREMIUM imtiyozlaringiz',
      free: 'PREMIUM imtiyozlari',
    },
    usageSectionTitle: 'Bu oyda foydalanish',
    upgradeSectionTitle: {
      premium: 'Tarifni o\'zgartirish',
      free: 'PREMIUM ga o\'tish',
    },
    header: {
      premium: {
        title: 'PREMIUM',
        planLabel: 'Tarif',
        activeLabel: 'Faol',
        planText: 'Oylik tarif ($9.99/oy)',
        activeUntil: '2025-yil 15-mart (68 kun)',
      },
      free: {
        title: 'BEPUL TARIF',
        planLabel: 'Tarif',
        planText: 'Bepul',
      },
    },
    benefits: [
      { label: 'Cheksiz tranzaksiyalar', kind: 'compare', premium: '∞', free: '50' },
      { label: 'Barcha AI funksiyalari', kind: 'compare', premium: '∞', free: '10/oy' },
      { label: '10+ virtual murabbiy', kind: 'compare', premium: '10', free: '1' },
      { label: 'Sinxronlashgan qurilmalar', kind: 'compare', premium: '5', free: '1' },
      { label: 'Bulutli zaxira', kind: 'check', premiumHas: true },
      { label: 'Premium yordam', kind: 'compare', premium: '<1s', free: '24s' },
      { label: 'Eksklyuziv uslublar', kind: 'compare', premium: '8', free: '2' },
      { label: 'API kirish', kind: 'check', premiumHas: true },
    ],
    usage: {
      premium: [
        { label: 'Tranzaksiyalar', value: '248 ta qo\'shildi' },
        { label: 'AI so\'rovlar', value: '89 ta ishlatildi' },
        { label: 'Qurilmalar', value: '3/5 ulangan' },
        { label: 'Bulut', value: '2.3 GB / 10 GB' },
      ],
      free: [
        { label: 'Tranzaksiyalar', value: '35 ta qo\'shildi' },
        { label: 'AI so\'rovlar', value: '13 ta ishlatildi' },
        { label: 'Qurilmalar', value: '1 ta ulangan' },
        { label: 'Bulut', value: '2.3 GB / 3 GB' },
      ],
    },
    planOptions: {
      monthly: {
        title: 'Oylik',
        price: '$9.99',
        subtitle: '$9.99 / oy',
        rightChip: 'Joriy',
      },
      yearly: {
        title: 'Yillik',
        price: '$99',
        subtitle: '$99 / yil',
        chip: '$20 TEJASH',
      },
    },
    buttons: {
      changePlan: 'Tarifni o\'zgartirish',
      paymentHistory: 'To\'lovlar tarixi',
    },
  },
  statistics: {
    sections: {
      focus: 'Diqqat ko\'rsatkichlari',
      visual: 'Vizual tahlil',
      improvements: 'Yaxshilash sohalari',
      insights: 'AI tavsiyalari',
    },
    focusStats: [
      { label: 'Jami diqqat soatlari', value: '182 s', meta: 'O\'tgan oyga nisbatan +12%' },
      { label: 'Chuqur seanslar', value: '64', meta: 'O\'rtacha 2.8 s' },
      { label: 'Bajarilgan vazifalar', value: '326', meta: '78% bajarilish darajasi' },
    ],
    visualBreakdown: {
      first: {
        label: 'Haftalik diqqat nisbati',
        meta: 'Eng yaxshi natija chorshanba kuni',
        value: '68%',
        progress: 0.68,
      },
      second: {
        label: 'Maqsadlarga erishish',
        meta: '12 ta haftalik maqsaddan 10 tasi bajarildi',
        value: '82%',
        progress: 0.82,
      },
    },
    improvementAreas: [
      { label: 'Samaradorlik', score: 0.82, description: 'Barqaror kunlik diqqat seriyalari' },
      { label: 'Salomatlik', score: 0.68, description: 'Tanaffus balansi yaxshilanmoqda, ko\'proq suv iching' },
      { label: 'Hamkorlik', score: 0.75, description: 'Jamoa yig\'ilishlari rejada' },
    ],
    aiInsights: [
      'Seanslar soat 10:00 dan oldin boshlanganda diqqat sifati oshadi.',
      'Diqqat pleylistlaridan foydalanganda 30% ko\'proq vazifa bajarasiz.',
      'Har 90 daqiqada tanaffus qilish kontekstni almashtirish kamayadi.',
    ],
  },
};

// ============================================================================
// ARABIC (AR)
// ============================================================================
const AR: AccountLocalization = {
  achievements: {
    title: 'الإنجازات',
    completionLabel: 'الإكمال',
    lastAchievementLabel: 'آخر إنجاز',
    completion: {
      done: 23,
      total: 50,
      percent: 46,
      last: {
        title: 'الماراثوني',
        subtitle: '42 يوماً متتالياً',
        details: '+500 XP   نادر   (15% من المستخدمين)',
      },
    },
    recentlyUnlocked: {
      title: 'فُتحت مؤخراً',
      items: [
        {
          title: 'الماراثوني',
          time: 'منذ 3 أيام',
          subtitle: '42 يوماً متواصلاً بدون انقطاع',
          details: '+500 XP   نادر   (15% من المستخدمين)',
        },
        {
          title: 'خبير المالية',
          time: 'منذ أسبوع',
          subtitle: 'الالتزام بالميزانية لمدة 3 أشهر متتالية',
          details: '+300 XP   غير شائع   (13% من المستخدمين)',
        },
        {
          title: 'قناص الأهداف',
          time: 'منذ أسبوعين',
          subtitle: 'تحقيق 10 أهداف',
          details: '+200 XP   عادي   (35% من المستخدمين)',
        },
      ],
    },
    closeToUnlocking: {
      title: 'قريب من الفتح',
      items: [
        {
          title: 'سلسلة حارة',
          progress: '95% (46/50)',
          subtitle: 'نشاط لمدة 50 يوماً متتالياً',
          details: '+1000 XP   أسطوري   (2% من المستخدمين)',
        },
        {
          title: 'خبير العادات',
          progress: '80% (4/5)',
          subtitle: '5 عادات لمدة 30 يوماً',
          details: '+750 XP   نادر   (18% من المستخدمين)',
        },
      ],
    },
    categories: {
      title: 'الفئات',
      tabs: [
        { key: 'all', label: 'الكل' },
        { key: 'financial', label: 'المالية' },
        { key: 'efficiency', label: 'الكفاءة' },
        { key: 'habits', label: 'العادات' },
        { key: 'social', label: 'الاجتماعية' },
        { key: 'special', label: 'خاصة' },
      ],
      list: [
        { name: 'المالية', count: '8/15' },
        { name: 'الكفاءة', count: '6/12' },
        { name: 'العادات', count: '5/10' },
        { name: 'الاجتماعية', count: '2/8' },
        { name: 'الخاصة', count: '2/5' },
        { name: 'المخفية', count: '???' },
      ],
      showAll: 'عرض الكل',
    },
  },
  premium: {
    planOverline: 'الخطة',
    manageSubscription: 'إدارة اشتراكك',
    benefitsSectionTitle: {
      premium: 'مزايا PREMIUM الخاصة بك',
      free: 'مزايا PREMIUM',
    },
    usageSectionTitle: 'استخدام هذا الشهر',
    upgradeSectionTitle: {
      premium: 'ترقية خطتك',
      free: 'الترقية إلى PREMIUM',
    },
    header: {
      premium: {
        title: 'PREMIUM',
        planLabel: 'الخطة',
        activeLabel: 'نشط حتى',
        planText: 'الخطة الشهرية ($9.99/شهر)',
        activeUntil: '15 مارس 2025 (68 يوماً)',
      },
      free: {
        title: 'الخطة المجانية',
        planLabel: 'الخطة',
        planText: 'مجاني',
      },
    },
    benefits: [
      { label: 'معاملات غير محدودة', kind: 'compare', premium: '∞', free: '50' },
      { label: 'جميع ميزات الذكاء الاصطناعي', kind: 'compare', premium: '∞', free: '10/شهر' },
      { label: '+10 مرشدين افتراضيين', kind: 'compare', premium: '10', free: '1' },
      { label: 'الأجهزة المتزامنة', kind: 'compare', premium: '5', free: '1' },
      { label: 'النسخ الاحتياطي السحابي', kind: 'check', premiumHas: true },
      { label: 'الدعم المميز', kind: 'compare', premium: '<1س', free: '24س' },
      { label: 'أنماط حصرية', kind: 'compare', premium: '8', free: '2' },
      { label: 'الوصول لـ API', kind: 'check', premiumHas: true },
    ],
    usage: {
      premium: [
        { label: 'المعاملات', value: '248 مضافة' },
        { label: 'طلبات الذكاء الاصطناعي', value: '89 مستخدمة' },
        { label: 'الأجهزة', value: '3/5 متصلة' },
        { label: 'السحابة', value: '2.3 جيجا / 10 جيجا' },
      ],
      free: [
        { label: 'المعاملات', value: '35 مضافة' },
        { label: 'طلبات الذكاء الاصطناعي', value: '13 مستخدمة' },
        { label: 'الأجهزة', value: '1 متصل' },
        { label: 'السحابة', value: '2.3 جيجا / 3 جيجا' },
      ],
    },
    planOptions: {
      monthly: {
        title: 'شهري',
        price: '$9.99',
        subtitle: '$9.99 / شهر',
        rightChip: 'الحالي',
      },
      yearly: {
        title: 'سنوي',
        price: '$99',
        subtitle: '$99 / سنة',
        chip: 'وفر $20',
      },
    },
    buttons: {
      changePlan: 'تغيير الخطة',
      paymentHistory: 'سجل المدفوعات',
    },
  },
  statistics: {
    sections: {
      focus: 'أداء التركيز',
      visual: 'التحليل البصري',
      improvements: 'مجالات التحسين',
      insights: 'رؤى الذكاء الاصطناعي',
    },
    focusStats: [
      { label: 'إجمالي ساعات التركيز', value: '182 س', meta: '+12% مقارنة بالشهر الماضي' },
      { label: 'الجلسات العميقة', value: '64', meta: 'متوسط 2.8 س' },
      { label: 'المهام المنجزة', value: '326', meta: 'معدل إتمام 78%' },
    ],
    visualBreakdown: {
      first: {
        label: 'نسبة التركيز الأسبوعية',
        meta: 'أفضل أداء يوم الأربعاء',
        value: '68%',
        progress: 0.68,
      },
      second: {
        label: 'تحقيق الأهداف',
        meta: 'تم إتمام 10 من 12 هدفاً أسبوعياً',
        value: '82%',
        progress: 0.82,
      },
    },
    improvementAreas: [
      { label: 'الإنتاجية', score: 0.82, description: 'سلاسل تركيز يومية مستمرة' },
      { label: 'الرفاهية', score: 0.68, description: 'توازن الاستراحات يتحسن، اشرب المزيد من الماء' },
      { label: 'التعاون', score: 0.75, description: 'اجتماعات الفريق تسير وفق الخطة' },
    ],
    aiInsights: [
      'تزداد جودة التركيز عندما تبدأ الجلسات قبل الساعة 10:00 صباحاً.',
      'تنجز 30% أكثر من المهام عند استخدام قوائم تشغيل التركيز.',
      'أخذ استراحة كل 90 دقيقة يقلل من التشتت.',
    ],
  },
};

// ============================================================================
// TURKISH (TR)
// ============================================================================
const TR: AccountLocalization = {
  achievements: {
    title: 'Başarılar',
    completionLabel: 'Tamamlanan',
    lastAchievementLabel: 'Son başarı',
    completion: {
      done: 23,
      total: 50,
      percent: 46,
      last: {
        title: 'Maratoncu',
        subtitle: '42 gün art arda',
        details: '+500 XP   Nadir   (%15 kullanıcı)',
      },
    },
    recentlyUnlocked: {
      title: 'Son açılanlar',
      items: [
        {
          title: 'Maratoncu',
          time: '3 gün önce',
          subtitle: '42 gün kesintisiz aktivite',
          details: '+500 XP   Nadir   (%15 kullanıcı)',
        },
        {
          title: 'Finans GURUSU',
          time: 'Bir hafta önce',
          subtitle: 'Bütçe 3 ay üst üste tutuldu',
          details: '+300 XP   Sıra dışı   (%13 kullanıcı)',
        },
        {
          title: 'Hedef Keskin Nişancısı',
          time: '2 hafta önce',
          subtitle: '10 hedef tamamlandı',
          details: '+200 XP   Sıradan   (%35 kullanıcı)',
        },
      ],
    },
    closeToUnlocking: {
      title: 'Açılmak üzere',
      items: [
        {
          title: 'Ateşli Seri',
          progress: '%95 (46/50)',
          subtitle: '50 gün kesintisiz aktivite',
          details: '+1000 XP   Efsanevi   (%2 kullanıcı)',
        },
        {
          title: 'Alışkanlık Ustası',
          progress: '%80 (4/5)',
          subtitle: '30 gün boyunca 5 alışkanlık',
          details: '+750 XP   Nadir   (%18 kullanıcı)',
        },
      ],
    },
    categories: {
      title: 'Kategoriler',
      tabs: [
        { key: 'all', label: 'Tümü' },
        { key: 'financial', label: 'Finans' },
        { key: 'efficiency', label: 'Verimlilik' },
        { key: 'habits', label: 'Alışkanlıklar' },
        { key: 'social', label: 'Sosyal' },
        { key: 'special', label: 'Özel' },
      ],
      list: [
        { name: 'Finans', count: '8/15' },
        { name: 'Verimlilik', count: '6/12' },
        { name: 'Alışkanlıklar', count: '5/10' },
        { name: 'Sosyal', count: '2/8' },
        { name: 'Özel', count: '2/5' },
        { name: 'Gizli', count: '???' },
      ],
      showAll: 'Tümünü göster',
    },
  },
  premium: {
    planOverline: 'Plan',
    manageSubscription: 'Aboneliğinizi yönetin',
    benefitsSectionTitle: {
      premium: 'PREMIUM avantajlarınız',
      free: 'PREMIUM avantajları',
    },
    usageSectionTitle: 'Bu ayki kullanım',
    upgradeSectionTitle: {
      premium: 'Planınızı yükseltin',
      free: 'PREMIUM\'a yükseltin',
    },
    header: {
      premium: {
        title: 'PREMIUM',
        planLabel: 'Plan',
        activeLabel: 'Geçerlilik',
        planText: 'Aylık plan ($9.99/ay)',
        activeUntil: '15 Mart 2025 (68 gün)',
      },
      free: {
        title: 'ÜCRETSİZ PLAN',
        planLabel: 'Plan',
        planText: 'Ücretsiz',
      },
    },
    benefits: [
      { label: 'Sınırsız işlem', kind: 'compare', premium: '∞', free: '50' },
      { label: 'Tüm AI özellikleri', kind: 'compare', premium: '∞', free: '10/ay' },
      { label: '10+ sanal mentor', kind: 'compare', premium: '10', free: '1' },
      { label: 'Senkronize cihazlar', kind: 'compare', premium: '5', free: '1' },
      { label: 'Bulut yedekleme', kind: 'check', premiumHas: true },
      { label: 'Premium destek', kind: 'compare', premium: '<1s', free: '24s' },
      { label: 'Özel stiller', kind: 'compare', premium: '8', free: '2' },
      { label: 'API erişimi', kind: 'check', premiumHas: true },
    ],
    usage: {
      premium: [
        { label: 'İşlemler', value: '248 eklendi' },
        { label: 'AI istekleri', value: '89 kullanıldı' },
        { label: 'Cihazlar', value: '3/5 bağlı' },
        { label: 'Bulut', value: '2.3 GB / 10 GB' },
      ],
      free: [
        { label: 'İşlemler', value: '35 eklendi' },
        { label: 'AI istekleri', value: '13 kullanıldı' },
        { label: 'Cihazlar', value: '1 bağlı' },
        { label: 'Bulut', value: '2.3 GB / 3 GB' },
      ],
    },
    planOptions: {
      monthly: {
        title: 'Aylık',
        price: '$9.99',
        subtitle: '$9.99 / ay',
        rightChip: 'Mevcut',
      },
      yearly: {
        title: 'Yıllık',
        price: '$99',
        subtitle: '$99 / yıl',
        chip: '$20 TASARRUF',
      },
    },
    buttons: {
      changePlan: 'Planı değiştir',
      paymentHistory: 'Ödeme geçmişi',
    },
  },
  statistics: {
    sections: {
      focus: 'Odaklanma performansı',
      visual: 'Görsel analiz',
      improvements: 'Gelişim alanları',
      insights: 'AI önerileri',
    },
    focusStats: [
      { label: 'Toplam odak saati', value: '182 s', meta: 'Geçen aya göre +%12' },
      { label: 'Derin oturumlar', value: '64', meta: 'Ortalama 2.8 s' },
      { label: 'Tamamlanan görevler', value: '326', meta: '%78 tamamlanma oranı' },
    ],
    visualBreakdown: {
      first: {
        label: 'Haftalık odak oranı',
        meta: 'En iyi performans Çarşamba günü',
        value: '%68',
        progress: 0.68,
      },
      second: {
        label: 'Hedef başarısı',
        meta: '12 haftalık hedefin 10\'u tamamlandı',
        value: '%82',
        progress: 0.82,
      },
    },
    improvementAreas: [
      { label: 'Üretkenlik', score: 0.82, description: 'Tutarlı günlük odak serileri' },
      { label: 'Sağlık', score: 0.68, description: 'Mola dengesi iyileşiyor, daha çok su için' },
      { label: 'İş birliği', score: 0.75, description: 'Ekip toplantıları yolunda' },
    ],
    aiInsights: [
      'Oturumlar sabah 10:00\'dan önce başladığında odak kalitesi artar.',
      'Odak çalma listeleri kullanırken %30 daha fazla görev tamamlarsınız.',
      'Her 90 dakikada mola vermek bağlam değiştirmeyi azaltır.',
    ],
  },
};

// ============================================================================
// LOCALIZATION MAP & EXPORTS
// ============================================================================
export const ACCOUNT_LOCALIZATION: Record<SupportedLanguage, AccountLocalization> = {
  en: EN,
  ru: RU,
  uz: UZ,
  ar: AR,
  tr: TR,
};

export const useAccountLocalization = () => {
  const { language } = useLocalization();
  return ACCOUNT_LOCALIZATION[language] ?? ACCOUNT_LOCALIZATION.en;
};
