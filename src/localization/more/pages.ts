import { useLocalization } from '@/localization/useLocalization';
import { SupportedLanguage } from '@/stores/useSettingsStore';

type SectionInfo = { title: string; subtitle: string };

export type AboutLocalization = {
  sections: {
    appInfo: string;
    information: string;
    legal: string;
  };
  app: {
    name: string;
    tagline: string;
    version: string;
    description: string;
  };
  infoRows: { label: string; value: string }[];
  legalLinks: string[];
};

export type DataLocalization = {
  sections: Record<'backup' | 'export' | 'storage', SectionInfo>;
  rows: Record<
    'backup' | 'export' | 'storage',
    { title: string; subtitle: string; action: string }[]
  >;
  summary: {
    backup: { label: string; value: string }[];
    storage: { label: string; value: string }[];
  };
};

export type IntegrationLocalization = {
  sections: {
    key: 'calendars' | 'banks' | 'applications' | 'devices';
    title: string;
    activeLabel: string;
    items: {
      key: string;
      name: string;
      meta?: string;
      statusLabel: string;
      statusTone?: 'positive' | 'warning' | 'neutral';
    }[];
  }[];
  footerCta: string;
};

export type SupportLocalization = {
  sections: Record<'popular' | 'manuals' | 'videos' | 'contact', SectionInfo>;
  popularQuestions: string[];
  manuals: { title: string; duration: string }[];
  videos: { title: string; duration: string; isChannel?: boolean }[];
  channels: {
    title: string;
    subtitle?: string;
    cta?: string;
    tone?: 'positive' | 'warning';
  }[];
  footer: {
    report: string;
    suggest: string;
  };
};

export type MorePagesLocalization = {
  about: AboutLocalization;
  data: DataLocalization;
  integrations: IntegrationLocalization;
  support: SupportLocalization;
};

const EN_PAGES: MorePagesLocalization = {
  about: {
    sections: {
      appInfo: 'App information',
      information: 'Information',
      legal: 'Legal information',
    },
    app: {
      name: 'LEORA',
      tagline: 'LEORA Premium',
      version: 'Version: 1.0.0 (Build 145)',
      description: 'Your Personal AI Companion for Financial Freedom',
    },
    infoRows: [
      { label: 'Application size', value: '125 MB' },
      { label: 'Data size', value: '47 MB' },
      { label: 'Cache size', value: '23 MB' },
      { label: 'Last update', value: '3 days ago' },
    ],
    legalLinks: ['Terms of Use', 'Privacy Policy', 'Open Source Licenses', 'Copyrights'],
  },
  data: {
    sections: {
      backup: {
        title: 'Backup & restore',
        subtitle: 'Keep snapshots of your workspace and bring them back when needed.',
      },
      export: {
        title: 'Export data',
        subtitle: 'Generate copies of your information for reports or external tools.',
      },
      storage: {
        title: 'Storage & cache',
        subtitle: 'Manage local data, cache, and storage usage across devices.',
      },
    },
    rows: {
      backup: [
        { title: 'Create manual backup', subtitle: 'Capture a fresh snapshot of your workspace.', action: 'Start' },
        { title: 'Restore backup', subtitle: 'Select from stored snapshots.', action: 'Choose file' },
      ],
      export: [
        { title: 'Export transactions', subtitle: 'Generate CSV or XLSX reports.', action: 'Configure' },
        {
          title: 'Export archive',
          subtitle: 'Bundle everything into a password-protected archive.',
          action: 'Generate',
        },
        {
          title: 'API access',
          subtitle: 'Create or manage personal access tokens.',
          action: 'Manage',
        },
      ],
      storage: [
        { title: 'Local cache', subtitle: 'Current size 45 MB on this device.', action: 'Clear' },
        { title: 'Temporary files', subtitle: 'Delete generated previews and logs.', action: 'Review' },
        { title: 'Storage preferences', subtitle: 'Decide what gets cached locally.', action: 'Adjust' },
      ],
    },
    summary: {
      backup: [
        { label: 'Last automatic backup', value: '3 days ago' },
        { label: 'Stored snapshots', value: '4 snapshots' },
      ],
      storage: [
        { label: 'Synced workspace size', value: '128 MB' },
        { label: 'Downloads this month', value: '6 exports' },
      ],
    },
  },
  integrations: {
    sections: [
      {
        key: 'calendars',
        title: 'Calendars',
        activeLabel: 'Active 2 / 3',
        items: [
          { key: 'google-calendar', name: 'Google Calendar', meta: 'Last sync: 15 mins ago', statusLabel: 'Settings', statusTone: 'positive' },
          { key: 'apple-calendar', name: 'Apple calendar', meta: 'Last sync: 1 hour ago', statusLabel: 'Settings', statusTone: 'positive' },
          { key: 'outlook-calendar', name: 'Outlook', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
      {
        key: 'banks',
        title: 'Banks',
        activeLabel: 'Active 0 / 4',
        items: [
          { key: 'uzcard', name: 'Uzcard', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'humo', name: 'Humo', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'kapitalbank', name: 'Kapitalbank', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'ipotekabank', name: 'Ipoteka Bank', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
      {
        key: 'applications',
        title: 'Applications',
        activeLabel: 'Active 2 / 8',
        items: [
          { key: 'telegram', name: 'Telegram', statusLabel: 'Notification on', statusTone: 'positive' },
          { key: 'whatsapp', name: 'WhatsApp', statusLabel: 'Notification on', statusTone: 'positive' },
          { key: 'slack', name: 'Slack', statusLabel: 'Status updating', statusTone: 'warning' },
          { key: 'notion', name: 'Notion', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'todoist', name: 'Todoist', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'spotify', name: 'Spotify', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'strava', name: 'Strava', statusLabel: 'Connect', statusTone: 'neutral' },
          { key: 'myfitnesspal', name: 'MyFitnessPal', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
      {
        key: 'devices',
        title: 'Devices',
        activeLabel: 'Active 1 / 2',
        items: [
          { key: 'apple-watch', name: 'Apple Watch', meta: 'Model: Series 8', statusLabel: 'Settings', statusTone: 'positive' },
          { key: 'wear-os', name: 'Wear OS', statusLabel: 'Connect', statusTone: 'neutral' },
        ],
      },
    ],
    footerCta: 'Find other integrations',
  },
  support: {
    sections: {
      popular: {
        title: 'Popular questions',
        subtitle: 'Your teammates looked into these recently',
      },
      manuals: {
        title: 'Manuals',
        subtitle: 'Step-by-step guides to master LEORA',
      },
      videos: {
        title: 'Video tutorials',
        subtitle: 'Learn faster with concise walkthroughs',
      },
      contact: {
        title: 'Contact support',
        subtitle: 'Reach out and we will be right with you',
      },
    },
    popularQuestions: [
      'How to add transaction with voice?',
      'What Premium offers?',
      'How focus mode works?',
      'Can we export data?',
      'How to change the currency?',
    ],
    manuals: [
      { title: 'Quick start', duration: '5 mins' },
      { title: 'Financials controlling', duration: '9 mins' },
      { title: 'Planning and goals', duration: '11 mins' },
      { title: 'Habit forming', duration: '7 mins' },
      { title: 'AI functions', duration: '6 mins' },
      { title: 'Professionals guides', duration: '12 mins' },
    ],
    videos: [
      { title: 'First steps into LEORA', duration: '3:45' },
      { title: 'Voice typing', duration: '2:15' },
      { title: 'Budget settings', duration: '4:30' },
      { title: 'Focus Mode', duration: '3:00' },
      { title: 'Youtube channel', duration: '', isChannel: true },
    ],
    channels: [
      { title: 'Chat support', subtitle: 'Average response time: 5 min', cta: 'Start', tone: 'positive' },
      { title: 'Email support@leora.app', cta: 'Email' },
      { title: 'Telegram @leora_support', cta: 'Open' },
      { title: 'Premium support', subtitle: '< 1 hour', cta: 'Priority', tone: 'positive' },
      { title: 'Free support', subtitle: '< 24 hours', cta: 'Standard', tone: 'warning' },
    ],
    footer: {
      report: 'Report error',
      suggest: 'Suggest a feature',
    },
  },
};

const RU_PAGES: MorePagesLocalization = {
  about: {
    sections: {
      appInfo: 'Информация о приложении',
      information: 'Информация',
      legal: 'Юридическая информация',
    },
    app: {
      name: 'LEORA',
      tagline: 'LEORA Премиум',
      version: 'Версия: 1.0.0 (Сборка 145)',
      description: 'Ваш личный ИИ-помощник для финансовой свободы',
    },
    infoRows: [
      { label: 'Размер приложения', value: '125 МБ' },
      { label: 'Размер данных', value: '47 МБ' },
      { label: 'Размер кэша', value: '23 МБ' },
      { label: 'Последнее обновление', value: '3 дня назад' },
    ],
    legalLinks: ['Условия использования', 'Политика конфиденциальности', 'Лицензии открытого ПО', 'Авторские права'],
  },
  data: {
    sections: {
      backup: {
        title: 'Резервное копирование',
        subtitle: 'Сохраняйте снимки рабочего пространства и восстанавливайте их при необходимости.',
      },
      export: {
        title: 'Экспорт данных',
        subtitle: 'Создавайте копии информации для отчётов или внешних инструментов.',
      },
      storage: {
        title: 'Хранилище и кэш',
        subtitle: 'Управляйте локальными данными, кэшем и хранилищем на устройствах.',
      },
    },
    rows: {
      backup: [
        { title: 'Создать резервную копию', subtitle: 'Сделать новый снимок рабочего пространства.', action: 'Начать' },
        { title: 'Восстановить копию', subtitle: 'Выбрать из сохранённых снимков.', action: 'Выбрать файл' },
      ],
      export: [
        { title: 'Экспорт транзакций', subtitle: 'Создать отчёт в формате CSV или XLSX.', action: 'Настроить' },
        {
          title: 'Экспорт архива',
          subtitle: 'Собрать всё в защищённый паролем архив.',
          action: 'Создать',
        },
        {
          title: 'Доступ к API',
          subtitle: 'Создать или управлять токенами доступа.',
          action: 'Управлять',
        },
      ],
      storage: [
        { title: 'Локальный кэш', subtitle: 'Текущий размер 45 МБ на этом устройстве.', action: 'Очистить' },
        { title: 'Временные файлы', subtitle: 'Удалить превью и логи.', action: 'Просмотреть' },
        { title: 'Настройки хранилища', subtitle: 'Выбрать, что кэшировать локально.', action: 'Настроить' },
      ],
    },
    summary: {
      backup: [
        { label: 'Последняя автокопия', value: '3 дня назад' },
        { label: 'Сохранённые снимки', value: '4 снимка' },
      ],
      storage: [
        { label: 'Размер синхронизации', value: '128 МБ' },
        { label: 'Экспортов за месяц', value: '6 экспортов' },
      ],
    },
  },
  integrations: {
    sections: [
      {
        key: 'calendars',
        title: 'Календари',
        activeLabel: 'Активно 2 / 3',
        items: [
          { key: 'google-calendar', name: 'Google Календарь', meta: 'Синхр.: 15 мин назад', statusLabel: 'Настройки', statusTone: 'positive' },
          { key: 'apple-calendar', name: 'Apple Календарь', meta: 'Синхр.: 1 час назад', statusLabel: 'Настройки', statusTone: 'positive' },
          { key: 'outlook-calendar', name: 'Outlook', statusLabel: 'Подключить', statusTone: 'neutral' },
        ],
      },
      {
        key: 'banks',
        title: 'Банки',
        activeLabel: 'Активно 0 / 4',
        items: [
          { key: 'uzcard', name: 'Uzcard', statusLabel: 'Подключить', statusTone: 'neutral' },
          { key: 'humo', name: 'Humo', statusLabel: 'Подключить', statusTone: 'neutral' },
          { key: 'kapitalbank', name: 'Капиталбанк', statusLabel: 'Подключить', statusTone: 'neutral' },
          { key: 'ipotekabank', name: 'Ипотека Банк', statusLabel: 'Подключить', statusTone: 'neutral' },
        ],
      },
      {
        key: 'applications',
        title: 'Приложения',
        activeLabel: 'Активно 2 / 8',
        items: [
          { key: 'telegram', name: 'Telegram', statusLabel: 'Уведомления вкл.', statusTone: 'positive' },
          { key: 'whatsapp', name: 'WhatsApp', statusLabel: 'Уведомления вкл.', statusTone: 'positive' },
          { key: 'slack', name: 'Slack', statusLabel: 'Обновление статуса', statusTone: 'warning' },
          { key: 'notion', name: 'Notion', statusLabel: 'Подключить', statusTone: 'neutral' },
          { key: 'todoist', name: 'Todoist', statusLabel: 'Подключить', statusTone: 'neutral' },
          { key: 'spotify', name: 'Spotify', statusLabel: 'Подключить', statusTone: 'neutral' },
          { key: 'strava', name: 'Strava', statusLabel: 'Подключить', statusTone: 'neutral' },
          { key: 'myfitnesspal', name: 'MyFitnessPal', statusLabel: 'Подключить', statusTone: 'neutral' },
        ],
      },
      {
        key: 'devices',
        title: 'Устройства',
        activeLabel: 'Активно 1 / 2',
        items: [
          { key: 'apple-watch', name: 'Apple Watch', meta: 'Модель: Series 8', statusLabel: 'Настройки', statusTone: 'positive' },
          { key: 'wear-os', name: 'Wear OS', statusLabel: 'Подключить', statusTone: 'neutral' },
        ],
      },
    ],
    footerCta: 'Найти другие интеграции',
  },
  support: {
    sections: {
      popular: {
        title: 'Популярные вопросы',
        subtitle: 'Ваши коллеги недавно искали это',
      },
      manuals: {
        title: 'Руководства',
        subtitle: 'Пошаговые инструкции по освоению LEORA',
      },
      videos: {
        title: 'Видеоуроки',
        subtitle: 'Учитесь быстрее с короткими обзорами',
      },
      contact: {
        title: 'Связаться с поддержкой',
        subtitle: 'Обратитесь к нам, и мы поможем',
      },
    },
    popularQuestions: [
      'Как добавить транзакцию голосом?',
      'Что даёт Премиум?',
      'Как работает режим фокусировки?',
      'Можно ли экспортировать данные?',
      'Как изменить валюту?',
    ],
    manuals: [
      { title: 'Быстрый старт', duration: '5 мин' },
      { title: 'Управление финансами', duration: '9 мин' },
      { title: 'Планирование и цели', duration: '11 мин' },
      { title: 'Формирование привычек', duration: '7 мин' },
      { title: 'ИИ-функции', duration: '6 мин' },
      { title: 'Продвинутые руководства', duration: '12 мин' },
    ],
    videos: [
      { title: 'Первые шаги в LEORA', duration: '3:45' },
      { title: 'Голосовой ввод', duration: '2:15' },
      { title: 'Настройка бюджета', duration: '4:30' },
      { title: 'Режим фокусировки', duration: '3:00' },
      { title: 'Youtube канал', duration: '', isChannel: true },
    ],
    channels: [
      { title: 'Чат поддержки', subtitle: 'Среднее время ответа: 5 мин', cta: 'Начать', tone: 'positive' },
      { title: 'Email support@leora.app', cta: 'Написать' },
      { title: 'Telegram @leora_support', cta: 'Открыть' },
      { title: 'Премиум поддержка', subtitle: '< 1 час', cta: 'Приоритет', tone: 'positive' },
      { title: 'Бесплатная поддержка', subtitle: '< 24 часа', cta: 'Стандарт', tone: 'warning' },
    ],
    footer: {
      report: 'Сообщить об ошибке',
      suggest: 'Предложить функцию',
    },
  },
};

const UZ_PAGES: MorePagesLocalization = {
  about: {
    sections: {
      appInfo: 'Ilova haqida',
      information: 'Ma\'lumot',
      legal: 'Huquqiy ma\'lumot',
    },
    app: {
      name: 'LEORA',
      tagline: 'LEORA Premium',
      version: 'Versiya: 1.0.0 (Build 145)',
      description: 'Moliyaviy erkinlik uchun shaxsiy AI yordamchingiz',
    },
    infoRows: [
      { label: 'Ilova hajmi', value: '125 MB' },
      { label: 'Ma\'lumotlar hajmi', value: '47 MB' },
      { label: 'Kesh hajmi', value: '23 MB' },
      { label: 'Oxirgi yangilanish', value: '3 kun oldin' },
    ],
    legalLinks: ['Foydalanish shartlari', 'Maxfiylik siyosati', 'Ochiq kodli litsenziyalar', 'Mualliflik huquqlari'],
  },
  data: {
    sections: {
      backup: {
        title: 'Zaxira va tiklash',
        subtitle: 'Ish maydoningiz nusxalarini saqlang va kerak bo\'lganda tiklang.',
      },
      export: {
        title: 'Ma\'lumotlarni eksport qilish',
        subtitle: 'Hisobotlar yoki tashqi vositalar uchun ma\'lumot nusxalarini yarating.',
      },
      storage: {
        title: 'Xotira va kesh',
        subtitle: 'Qurilmalardagi mahalliy ma\'lumotlar, kesh va xotirani boshqaring.',
      },
    },
    rows: {
      backup: [
        { title: 'Qo\'lda zaxira yaratish', subtitle: 'Ish maydoningizning yangi nusxasini oling.', action: 'Boshlash' },
        { title: 'Zaxirani tiklash', subtitle: 'Saqlangan nusxalardan tanlang.', action: 'Faylni tanlash' },
      ],
      export: [
        { title: 'Tranzaksiyalarni eksport', subtitle: 'CSV yoki XLSX hisobotlarini yarating.', action: 'Sozlash' },
        {
          title: 'Arxivni eksport',
          subtitle: 'Hammasini parol bilan himoyalangan arxivga yig\'ing.',
          action: 'Yaratish',
        },
        {
          title: 'API kirish',
          subtitle: 'Shaxsiy kirish tokenlarini yarating yoki boshqaring.',
          action: 'Boshqarish',
        },
      ],
      storage: [
        { title: 'Mahalliy kesh', subtitle: 'Joriy hajm ushbu qurilmada 45 MB.', action: 'Tozalash' },
        { title: 'Vaqtinchalik fayllar', subtitle: 'Yaratilgan oldindan ko\'rishlar va loglarni o\'chiring.', action: 'Ko\'rish' },
        { title: 'Xotira sozlamalari', subtitle: 'Mahalliy keshlanadigan narsalarni tanlang.', action: 'Sozlash' },
      ],
    },
    summary: {
      backup: [
        { label: 'Oxirgi avtomatik zaxira', value: '3 kun oldin' },
        { label: 'Saqlangan nusxalar', value: '4 ta nusxa' },
      ],
      storage: [
        { label: 'Sinxronlangan hajm', value: '128 MB' },
        { label: 'Shu oydagi eksportlar', value: '6 ta eksport' },
      ],
    },
  },
  integrations: {
    sections: [
      {
        key: 'calendars',
        title: 'Taqvimlar',
        activeLabel: 'Faol 2 / 3',
        items: [
          { key: 'google-calendar', name: 'Google Taqvim', meta: 'Oxirgi sinx.: 15 daq oldin', statusLabel: 'Sozlamalar', statusTone: 'positive' },
          { key: 'apple-calendar', name: 'Apple Taqvim', meta: 'Oxirgi sinx.: 1 soat oldin', statusLabel: 'Sozlamalar', statusTone: 'positive' },
          { key: 'outlook-calendar', name: 'Outlook', statusLabel: 'Ulash', statusTone: 'neutral' },
        ],
      },
      {
        key: 'banks',
        title: 'Banklar',
        activeLabel: 'Faol 0 / 4',
        items: [
          { key: 'uzcard', name: 'Uzcard', statusLabel: 'Ulash', statusTone: 'neutral' },
          { key: 'humo', name: 'Humo', statusLabel: 'Ulash', statusTone: 'neutral' },
          { key: 'kapitalbank', name: 'Kapitalbank', statusLabel: 'Ulash', statusTone: 'neutral' },
          { key: 'ipotekabank', name: 'Ipoteka Bank', statusLabel: 'Ulash', statusTone: 'neutral' },
        ],
      },
      {
        key: 'applications',
        title: 'Ilovalar',
        activeLabel: 'Faol 2 / 8',
        items: [
          { key: 'telegram', name: 'Telegram', statusLabel: 'Bildirishnoma yoq.', statusTone: 'positive' },
          { key: 'whatsapp', name: 'WhatsApp', statusLabel: 'Bildirishnoma yoq.', statusTone: 'positive' },
          { key: 'slack', name: 'Slack', statusLabel: 'Status yangilanmoqda', statusTone: 'warning' },
          { key: 'notion', name: 'Notion', statusLabel: 'Ulash', statusTone: 'neutral' },
          { key: 'todoist', name: 'Todoist', statusLabel: 'Ulash', statusTone: 'neutral' },
          { key: 'spotify', name: 'Spotify', statusLabel: 'Ulash', statusTone: 'neutral' },
          { key: 'strava', name: 'Strava', statusLabel: 'Ulash', statusTone: 'neutral' },
          { key: 'myfitnesspal', name: 'MyFitnessPal', statusLabel: 'Ulash', statusTone: 'neutral' },
        ],
      },
      {
        key: 'devices',
        title: 'Qurilmalar',
        activeLabel: 'Faol 1 / 2',
        items: [
          { key: 'apple-watch', name: 'Apple Watch', meta: 'Model: Series 8', statusLabel: 'Sozlamalar', statusTone: 'positive' },
          { key: 'wear-os', name: 'Wear OS', statusLabel: 'Ulash', statusTone: 'neutral' },
        ],
      },
    ],
    footerCta: 'Boshqa integratsiyalarni topish',
  },
  support: {
    sections: {
      popular: {
        title: 'Ommabop savollar',
        subtitle: 'Jamoangiz yaqinda bularni qidirdi',
      },
      manuals: {
        title: 'Qo\'llanmalar',
        subtitle: 'LEORA\'ni o\'rganish uchun bosqichma-bosqich ko\'rsatmalar',
      },
      videos: {
        title: 'Video darsliklar',
        subtitle: 'Qisqa ko\'rsatmalar bilan tezroq o\'rganing',
      },
      contact: {
        title: 'Qo\'llab-quvvatlash bilan bog\'lanish',
        subtitle: 'Murojaat qiling va biz yordam beramiz',
      },
    },
    popularQuestions: [
      'Tranzaksiyani ovoz bilan qanday qo\'shish mumkin?',
      'Premium nimalar taklif qiladi?',
      'Fokus rejimi qanday ishlaydi?',
      'Ma\'lumotlarni eksport qilish mumkinmi?',
      'Valyutani qanday o\'zgartirish mumkin?',
    ],
    manuals: [
      { title: 'Tezkor boshlash', duration: '5 daq' },
      { title: 'Moliyaviy nazorat', duration: '9 daq' },
      { title: 'Rejalashtirish va maqsadlar', duration: '11 daq' },
      { title: 'Odat shakllantirish', duration: '7 daq' },
      { title: 'AI funksiyalari', duration: '6 daq' },
      { title: 'Professional qo\'llanmalar', duration: '12 daq' },
    ],
    videos: [
      { title: 'LEORA\'dagi birinchi qadamlar', duration: '3:45' },
      { title: 'Ovozli kiritish', duration: '2:15' },
      { title: 'Byudjet sozlamalari', duration: '4:30' },
      { title: 'Fokus rejimi', duration: '3:00' },
      { title: 'Youtube kanal', duration: '', isChannel: true },
    ],
    channels: [
      { title: 'Chat qo\'llab-quvvatlash', subtitle: 'O\'rtacha javob vaqti: 5 daq', cta: 'Boshlash', tone: 'positive' },
      { title: 'Email support@leora.app', cta: 'Yozish' },
      { title: 'Telegram @leora_support', cta: 'Ochish' },
      { title: 'Premium qo\'llab-quvvatlash', subtitle: '< 1 soat', cta: 'Ustuvor', tone: 'positive' },
      { title: 'Bepul qo\'llab-quvvatlash', subtitle: '< 24 soat', cta: 'Standart', tone: 'warning' },
    ],
    footer: {
      report: 'Xatoni xabar qilish',
      suggest: 'Funksiya taklif qilish',
    },
  },
};

const AR_PAGES: MorePagesLocalization = {
  about: {
    sections: {
      appInfo: 'معلومات التطبيق',
      information: 'المعلومات',
      legal: 'المعلومات القانونية',
    },
    app: {
      name: 'LEORA',
      tagline: 'LEORA بريميوم',
      version: 'الإصدار: 1.0.0 (البناء 145)',
      description: 'مساعدك الشخصي بالذكاء الاصطناعي للحرية المالية',
    },
    infoRows: [
      { label: 'حجم التطبيق', value: '125 ميجابايت' },
      { label: 'حجم البيانات', value: '47 ميجابايت' },
      { label: 'حجم الذاكرة المؤقتة', value: '23 ميجابايت' },
      { label: 'آخر تحديث', value: 'منذ 3 أيام' },
    ],
    legalLinks: ['شروط الاستخدام', 'سياسة الخصوصية', 'تراخيص المصادر المفتوحة', 'حقوق النشر'],
  },
  data: {
    sections: {
      backup: {
        title: 'النسخ الاحتياطي والاستعادة',
        subtitle: 'احتفظ بلقطات من مساحة العمل واستعدها عند الحاجة.',
      },
      export: {
        title: 'تصدير البيانات',
        subtitle: 'أنشئ نسخًا من معلوماتك للتقارير أو الأدوات الخارجية.',
      },
      storage: {
        title: 'التخزين والذاكرة المؤقتة',
        subtitle: 'إدارة البيانات المحلية والذاكرة المؤقتة واستخدام التخزين عبر الأجهزة.',
      },
    },
    rows: {
      backup: [
        { title: 'إنشاء نسخة احتياطية يدوية', subtitle: 'التقط لقطة جديدة من مساحة العمل.', action: 'ابدأ' },
        { title: 'استعادة النسخة الاحتياطية', subtitle: 'اختر من اللقطات المحفوظة.', action: 'اختر ملف' },
      ],
      export: [
        { title: 'تصدير المعاملات', subtitle: 'إنشاء تقارير CSV أو XLSX.', action: 'تكوين' },
        {
          title: 'تصدير الأرشيف',
          subtitle: 'تجميع كل شيء في أرشيف محمي بكلمة مرور.',
          action: 'إنشاء',
        },
        {
          title: 'الوصول إلى API',
          subtitle: 'إنشاء أو إدارة رموز الوصول الشخصية.',
          action: 'إدارة',
        },
      ],
      storage: [
        { title: 'الذاكرة المحلية', subtitle: 'الحجم الحالي 45 ميجابايت على هذا الجهاز.', action: 'مسح' },
        { title: 'الملفات المؤقتة', subtitle: 'حذف المعاينات والسجلات المُنشأة.', action: 'مراجعة' },
        { title: 'تفضيلات التخزين', subtitle: 'حدد ما يتم تخزينه محليًا.', action: 'ضبط' },
      ],
    },
    summary: {
      backup: [
        { label: 'آخر نسخة احتياطية تلقائية', value: 'منذ 3 أيام' },
        { label: 'اللقطات المحفوظة', value: '4 لقطات' },
      ],
      storage: [
        { label: 'حجم مساحة العمل المتزامنة', value: '128 ميجابايت' },
        { label: 'التنزيلات هذا الشهر', value: '6 تصديرات' },
      ],
    },
  },
  integrations: {
    sections: [
      {
        key: 'calendars',
        title: 'التقويمات',
        activeLabel: 'نشط 2 / 3',
        items: [
          { key: 'google-calendar', name: 'تقويم Google', meta: 'آخر مزامنة: منذ 15 دقيقة', statusLabel: 'الإعدادات', statusTone: 'positive' },
          { key: 'apple-calendar', name: 'تقويم Apple', meta: 'آخر مزامنة: منذ ساعة', statusLabel: 'الإعدادات', statusTone: 'positive' },
          { key: 'outlook-calendar', name: 'Outlook', statusLabel: 'ربط', statusTone: 'neutral' },
        ],
      },
      {
        key: 'banks',
        title: 'البنوك',
        activeLabel: 'نشط 0 / 4',
        items: [
          { key: 'uzcard', name: 'Uzcard', statusLabel: 'ربط', statusTone: 'neutral' },
          { key: 'humo', name: 'Humo', statusLabel: 'ربط', statusTone: 'neutral' },
          { key: 'kapitalbank', name: 'Kapitalbank', statusLabel: 'ربط', statusTone: 'neutral' },
          { key: 'ipotekabank', name: 'Ipoteka Bank', statusLabel: 'ربط', statusTone: 'neutral' },
        ],
      },
      {
        key: 'applications',
        title: 'التطبيقات',
        activeLabel: 'نشط 2 / 8',
        items: [
          { key: 'telegram', name: 'Telegram', statusLabel: 'الإشعارات مفعلة', statusTone: 'positive' },
          { key: 'whatsapp', name: 'WhatsApp', statusLabel: 'الإشعارات مفعلة', statusTone: 'positive' },
          { key: 'slack', name: 'Slack', statusLabel: 'تحديث الحالة', statusTone: 'warning' },
          { key: 'notion', name: 'Notion', statusLabel: 'ربط', statusTone: 'neutral' },
          { key: 'todoist', name: 'Todoist', statusLabel: 'ربط', statusTone: 'neutral' },
          { key: 'spotify', name: 'Spotify', statusLabel: 'ربط', statusTone: 'neutral' },
          { key: 'strava', name: 'Strava', statusLabel: 'ربط', statusTone: 'neutral' },
          { key: 'myfitnesspal', name: 'MyFitnessPal', statusLabel: 'ربط', statusTone: 'neutral' },
        ],
      },
      {
        key: 'devices',
        title: 'الأجهزة',
        activeLabel: 'نشط 1 / 2',
        items: [
          { key: 'apple-watch', name: 'Apple Watch', meta: 'الموديل: Series 8', statusLabel: 'الإعدادات', statusTone: 'positive' },
          { key: 'wear-os', name: 'Wear OS', statusLabel: 'ربط', statusTone: 'neutral' },
        ],
      },
    ],
    footerCta: 'ابحث عن تكاملات أخرى',
  },
  support: {
    sections: {
      popular: {
        title: 'الأسئلة الشائعة',
        subtitle: 'بحث فريقك عن هذه مؤخرًا',
      },
      manuals: {
        title: 'الأدلة',
        subtitle: 'إرشادات خطوة بخطوة لإتقان LEORA',
      },
      videos: {
        title: 'دروس الفيديو',
        subtitle: 'تعلم بشكل أسرع مع الشروحات المختصرة',
      },
      contact: {
        title: 'اتصل بالدعم',
        subtitle: 'تواصل معنا وسنكون معك',
      },
    },
    popularQuestions: [
      'كيف أضيف معاملة بالصوت؟',
      'ماذا يقدم بريميوم؟',
      'كيف يعمل وضع التركيز؟',
      'هل يمكننا تصدير البيانات؟',
      'كيف أغير العملة؟',
    ],
    manuals: [
      { title: 'البداية السريعة', duration: '5 دقائق' },
      { title: 'التحكم المالي', duration: '9 دقائق' },
      { title: 'التخطيط والأهداف', duration: '11 دقيقة' },
      { title: 'تكوين العادات', duration: '7 دقائق' },
      { title: 'وظائف الذكاء الاصطناعي', duration: '6 دقائق' },
      { title: 'أدلة المحترفين', duration: '12 دقيقة' },
    ],
    videos: [
      { title: 'الخطوات الأولى في LEORA', duration: '3:45' },
      { title: 'الكتابة الصوتية', duration: '2:15' },
      { title: 'إعدادات الميزانية', duration: '4:30' },
      { title: 'وضع التركيز', duration: '3:00' },
      { title: 'قناة يوتيوب', duration: '', isChannel: true },
    ],
    channels: [
      { title: 'دعم الدردشة', subtitle: 'متوسط وقت الرد: 5 دقائق', cta: 'ابدأ', tone: 'positive' },
      { title: 'البريد support@leora.app', cta: 'إرسال' },
      { title: 'تيليجرام @leora_support', cta: 'فتح' },
      { title: 'دعم بريميوم', subtitle: '< ساعة واحدة', cta: 'أولوية', tone: 'positive' },
      { title: 'الدعم المجاني', subtitle: '< 24 ساعة', cta: 'قياسي', tone: 'warning' },
    ],
    footer: {
      report: 'الإبلاغ عن خطأ',
      suggest: 'اقترح ميزة',
    },
  },
};

const TR_PAGES: MorePagesLocalization = {
  about: {
    sections: {
      appInfo: 'Uygulama bilgisi',
      information: 'Bilgi',
      legal: 'Yasal bilgiler',
    },
    app: {
      name: 'LEORA',
      tagline: 'LEORA Premium',
      version: 'Sürüm: 1.0.0 (Yapı 145)',
      description: 'Finansal özgürlük için kişisel AI yardımcınız',
    },
    infoRows: [
      { label: 'Uygulama boyutu', value: '125 MB' },
      { label: 'Veri boyutu', value: '47 MB' },
      { label: 'Önbellek boyutu', value: '23 MB' },
      { label: 'Son güncelleme', value: '3 gün önce' },
    ],
    legalLinks: ['Kullanım Şartları', 'Gizlilik Politikası', 'Açık Kaynak Lisansları', 'Telif Hakları'],
  },
  data: {
    sections: {
      backup: {
        title: 'Yedekleme ve geri yükleme',
        subtitle: 'Çalışma alanınızın anlık görüntülerini saklayın ve gerektiğinde geri yükleyin.',
      },
      export: {
        title: 'Veri dışa aktarma',
        subtitle: 'Raporlar veya harici araçlar için bilgilerinizin kopyalarını oluşturun.',
      },
      storage: {
        title: 'Depolama ve önbellek',
        subtitle: 'Cihazlar arasında yerel verileri, önbelleği ve depolama kullanımını yönetin.',
      },
    },
    rows: {
      backup: [
        { title: 'Manuel yedekleme oluştur', subtitle: 'Çalışma alanınızın yeni bir anlık görüntüsünü alın.', action: 'Başlat' },
        { title: 'Yedeklemeyi geri yükle', subtitle: 'Kayıtlı anlık görüntülerden seçin.', action: 'Dosya seç' },
      ],
      export: [
        { title: 'İşlemleri dışa aktar', subtitle: 'CSV veya XLSX raporları oluşturun.', action: 'Yapılandır' },
        {
          title: 'Arşivi dışa aktar',
          subtitle: 'Her şeyi şifre korumalı bir arşivde toplayın.',
          action: 'Oluştur',
        },
        {
          title: 'API erişimi',
          subtitle: 'Kişisel erişim tokenları oluşturun veya yönetin.',
          action: 'Yönet',
        },
      ],
      storage: [
        { title: 'Yerel önbellek', subtitle: 'Bu cihazda mevcut boyut 45 MB.', action: 'Temizle' },
        { title: 'Geçici dosyalar', subtitle: 'Oluşturulan önizlemeleri ve günlükleri silin.', action: 'İncele' },
        { title: 'Depolama tercihleri', subtitle: 'Yerel olarak neyin önbelleğe alınacağına karar verin.', action: 'Ayarla' },
      ],
    },
    summary: {
      backup: [
        { label: 'Son otomatik yedekleme', value: '3 gün önce' },
        { label: 'Kayıtlı anlık görüntüler', value: '4 anlık görüntü' },
      ],
      storage: [
        { label: 'Senkronize çalışma alanı boyutu', value: '128 MB' },
        { label: 'Bu ayki indirmeler', value: '6 dışa aktarma' },
      ],
    },
  },
  integrations: {
    sections: [
      {
        key: 'calendars',
        title: 'Takvimler',
        activeLabel: 'Aktif 2 / 3',
        items: [
          { key: 'google-calendar', name: 'Google Takvim', meta: 'Son senkr.: 15 dk önce', statusLabel: 'Ayarlar', statusTone: 'positive' },
          { key: 'apple-calendar', name: 'Apple Takvim', meta: 'Son senkr.: 1 saat önce', statusLabel: 'Ayarlar', statusTone: 'positive' },
          { key: 'outlook-calendar', name: 'Outlook', statusLabel: 'Bağlan', statusTone: 'neutral' },
        ],
      },
      {
        key: 'banks',
        title: 'Bankalar',
        activeLabel: 'Aktif 0 / 4',
        items: [
          { key: 'uzcard', name: 'Uzcard', statusLabel: 'Bağlan', statusTone: 'neutral' },
          { key: 'humo', name: 'Humo', statusLabel: 'Bağlan', statusTone: 'neutral' },
          { key: 'kapitalbank', name: 'Kapitalbank', statusLabel: 'Bağlan', statusTone: 'neutral' },
          { key: 'ipotekabank', name: 'Ipoteka Bank', statusLabel: 'Bağlan', statusTone: 'neutral' },
        ],
      },
      {
        key: 'applications',
        title: 'Uygulamalar',
        activeLabel: 'Aktif 2 / 8',
        items: [
          { key: 'telegram', name: 'Telegram', statusLabel: 'Bildirimler açık', statusTone: 'positive' },
          { key: 'whatsapp', name: 'WhatsApp', statusLabel: 'Bildirimler açık', statusTone: 'positive' },
          { key: 'slack', name: 'Slack', statusLabel: 'Durum güncelleniyor', statusTone: 'warning' },
          { key: 'notion', name: 'Notion', statusLabel: 'Bağlan', statusTone: 'neutral' },
          { key: 'todoist', name: 'Todoist', statusLabel: 'Bağlan', statusTone: 'neutral' },
          { key: 'spotify', name: 'Spotify', statusLabel: 'Bağlan', statusTone: 'neutral' },
          { key: 'strava', name: 'Strava', statusLabel: 'Bağlan', statusTone: 'neutral' },
          { key: 'myfitnesspal', name: 'MyFitnessPal', statusLabel: 'Bağlan', statusTone: 'neutral' },
        ],
      },
      {
        key: 'devices',
        title: 'Cihazlar',
        activeLabel: 'Aktif 1 / 2',
        items: [
          { key: 'apple-watch', name: 'Apple Watch', meta: 'Model: Series 8', statusLabel: 'Ayarlar', statusTone: 'positive' },
          { key: 'wear-os', name: 'Wear OS', statusLabel: 'Bağlan', statusTone: 'neutral' },
        ],
      },
    ],
    footerCta: 'Diğer entegrasyonları bul',
  },
  support: {
    sections: {
      popular: {
        title: 'Popüler sorular',
        subtitle: 'Ekibiniz bunları yakın zamanda inceledi',
      },
      manuals: {
        title: 'Kılavuzlar',
        subtitle: 'LEORA\'yı öğrenmek için adım adım rehberler',
      },
      videos: {
        title: 'Video eğitimler',
        subtitle: 'Kısa anlatımlarla daha hızlı öğrenin',
      },
      contact: {
        title: 'Destekle iletişim',
        subtitle: 'Bize ulaşın, hemen yanınızdayız',
      },
    },
    popularQuestions: [
      'Sesle işlem nasıl eklenir?',
      'Premium neler sunuyor?',
      'Odak modu nasıl çalışır?',
      'Verileri dışa aktarabilir miyiz?',
      'Para birimi nasıl değiştirilir?',
    ],
    manuals: [
      { title: 'Hızlı başlangıç', duration: '5 dk' },
      { title: 'Finansal kontrol', duration: '9 dk' },
      { title: 'Planlama ve hedefler', duration: '11 dk' },
      { title: 'Alışkanlık oluşturma', duration: '7 dk' },
      { title: 'AI fonksiyonları', duration: '6 dk' },
      { title: 'Profesyonel rehberler', duration: '12 dk' },
    ],
    videos: [
      { title: 'LEORA\'da ilk adımlar', duration: '3:45' },
      { title: 'Sesli yazma', duration: '2:15' },
      { title: 'Bütçe ayarları', duration: '4:30' },
      { title: 'Odak Modu', duration: '3:00' },
      { title: 'Youtube kanalı', duration: '', isChannel: true },
    ],
    channels: [
      { title: 'Sohbet desteği', subtitle: 'Ortalama yanıt süresi: 5 dk', cta: 'Başlat', tone: 'positive' },
      { title: 'E-posta support@leora.app', cta: 'E-posta' },
      { title: 'Telegram @leora_support', cta: 'Aç' },
      { title: 'Premium destek', subtitle: '< 1 saat', cta: 'Öncelik', tone: 'positive' },
      { title: 'Ücretsiz destek', subtitle: '< 24 saat', cta: 'Standart', tone: 'warning' },
    ],
    footer: {
      report: 'Hata bildir',
      suggest: 'Özellik öner',
    },
  },
};

const PAGES_LOCALIZATION: Record<SupportedLanguage, MorePagesLocalization> = {
  en: EN_PAGES,
  ru: RU_PAGES,
  uz: UZ_PAGES,
  ar: AR_PAGES,
  tr: TR_PAGES,
};

export const useMorePagesLocalization = () => {
  const { language } = useLocalization();
  return PAGES_LOCALIZATION[language] ?? PAGES_LOCALIZATION.en;
};
