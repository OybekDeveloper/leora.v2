import { useLocalization } from '../useLocalization';
import { SupportedLanguage } from '@/stores/useSettingsStore';

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY SETTINGS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SecuritySettingsLocalization {
  hero: {
    badge: string;
    title: string;
    description: string;
  };
  sections: {
    securityType: {
      title: string;
      subtitle: string;
    };
    dataSecurity: {
      title: string;
      subtitle: string;
    };
    dataBackup: {
      title: string;
      subtitle: string;
    };
    tasksGoals: {
      title: string;
      subtitle: string;
    };
    privacy: {
      title: string;
      subtitle: string;
    };
    activeSessions: {
      title: string;
      subtitle: string;
    };
    emergencyActions: {
      title: string;
      subtitle: string;
    };
  };
  securityType: {
    biometrics: {
      label: string;
      description: string;
    };
    faceId: {
      label: string;
      descriptionAvailable: string;
      descriptionUnavailable: string;
    };
    fingerprint: {
      label: string;
      descriptionAvailable: string;
      descriptionUnavailable: string;
    };
    pinCode: {
      label: string;
      description: string;
    };
    password: {
      label: string;
      descriptionChange: string;
      descriptionCreate: string;
      change: string;
      create: string;
    };
    turnSecurityOff: {
      label: string;
      description: string;
    };
    askOnLaunch: {
      label: string;
      description: string;
    };
    autoblockAfter: {
      label: string;
      description: string;
    };
    unlockGracePeriod: {
      label: string;
      description: string;
    };
  };
  dataSecurity: {
    databaseEncryption: {
      label: string;
      description: string;
    };
    hideBalances: {
      label: string;
      description: string;
    };
    screenshotBlock: {
      label: string;
      description: string;
    };
    fakeAccount: {
      label: string;
      description: string;
    };
  };
  dataBackup: {
    automaticBackup: {
      label: string;
      description: string;
    };
    frequency: {
      label: string;
      description: string;
      value: string;
    };
    storage: {
      label: string;
      description: string;
      value: string;
    };
    lastSync: {
      label: string;
      description: string;
    };
    createBackupNow: string;
  };
  tasksGoals: {
    taskReminder: {
      label: string;
      description: string;
    };
    deadline: {
      label: string;
      description: string;
    };
    goalProgress: {
      label: string;
      description: string;
    };
    taskReschedule: {
      label: string;
      description: string;
    };
  };
  privacy: {
    anonymousAnalytics: {
      label: string;
      description: string;
    };
    personalizedAds: {
      label: string;
      description: string;
    };
    dataDeleteAccess: {
      label: string;
      description: string;
    };
    shareWithPartners: {
      label: string;
      description: string;
    };
  };
  sessions: {
    currentDevice: string;
    yesterday: string;
    daysAgo: (days: number) => string;
    endAllSessions: string;
  };
  emergency: {
    deactivateAccount: string;
    wipeAllData: string;
  };
  timeOptions: {
    sec30: string;
    min1: string;
    min5: string;
    min10: string;
    never: string;
    immediately: string;
    sec15: string;
  };
  timeUnits: {
    daysAgo: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH (EN)
// ─────────────────────────────────────────────────────────────────────────────

const EN: SecuritySettingsLocalization = {
  hero: {
    badge: 'Security posture good',
    title: 'Protect your LEORA workspace',
    description:
      'Enable the controls below to keep personal data safe across devices. Manage biometrics, two-factor verification, and backup routines from one place.',
  },
  sections: {
    securityType: {
      title: 'Security type',
      subtitle: 'Configure how the app unlocks and how quickly it locks again.',
    },
    dataSecurity: {
      title: 'Data security',
      subtitle: 'Protect stored data and sensitive information in the UI.',
    },
    dataBackup: {
      title: 'Data backup',
      subtitle: 'Control how often LEORA syncs and stores encrypted backups.',
    },
    tasksGoals: {
      title: 'Task & goals',
      subtitle: 'Decide when security reminders apply to planning tools.',
    },
    privacy: {
      title: 'Privacy',
      subtitle: 'Control the analytics and data sharing options in LEORA.',
    },
    activeSessions: {
      title: 'Active sessions',
      subtitle: 'Review signed-in devices and revoke access if something looks suspicious.',
    },
    emergencyActions: {
      title: 'Emergency actions',
      subtitle: 'Quick responses when your device is lost or compromised.',
    },
  },
  securityType: {
    biometrics: {
      label: 'Biometrics',
      description: 'Use Face ID or fingerprint to unlock instantly.',
    },
    faceId: {
      label: 'Face ID',
      descriptionAvailable: 'Require Face ID whenever launching the app.',
      descriptionUnavailable: 'Face ID is not available on this device.',
    },
    fingerprint: {
      label: 'Fingerprint',
      descriptionAvailable: 'Unlock with your saved fingerprint on this device.',
      descriptionUnavailable: 'Fingerprint unlock is not supported on this device.',
    },
    pinCode: {
      label: 'PIN code',
      description: 'Set a 4-digit fallback when biometrics are unavailable.',
    },
    password: {
      label: 'Password',
      descriptionChange: 'Change the main account password.',
      descriptionCreate: 'Create a password to secure your data.',
      change: 'Change',
      create: 'Create',
    },
    turnSecurityOff: {
      label: 'Turn security off',
      description: 'Disable all security checks on launch.',
    },
    askOnLaunch: {
      label: 'Ask when launch',
      description: 'Prompt for security credentials on every start.',
    },
    autoblockAfter: {
      label: 'Autoblock after',
      description: 'Choose how long the app stays unlocked when inactive.',
    },
    unlockGracePeriod: {
      label: 'Unlock grace period',
      description: 'Decide how soon the lock appears after leaving the app.',
    },
  },
  dataSecurity: {
    databaseEncryption: {
      label: 'Database encryption',
      description: 'Encrypt data at rest with AES-256.',
    },
    hideBalances: {
      label: 'Hide balances on preview',
      description: 'Blur financial numbers until the app is unlocked.',
    },
    screenshotBlock: {
      label: 'Screenshot block',
      description: 'Prevent screenshots on sensitive screens.',
    },
    fakeAccount: {
      label: 'Fake account',
      description: 'Display a decoy workspace when under pressure.',
    },
  },
  dataBackup: {
    automaticBackup: {
      label: 'Automatic backup',
      description: 'Securely save your data in the cloud.',
    },
    frequency: {
      label: 'Frequency',
      description: 'Automatically backs up every day.',
      value: 'Every day',
    },
    storage: {
      label: 'Storage',
      description: 'Selected storage location for secure backups.',
      value: 'iCloud',
    },
    lastSync: {
      label: 'Last sync',
      description: 'Timestamp for the most recent backup.',
    },
    createBackupNow: 'Create backup now',
  },
  tasksGoals: {
    taskReminder: {
      label: 'Task reminder',
      description: 'Notify 15 minutes before a secure task.',
    },
    deadline: {
      label: 'Deadline',
      description: 'Remind you one day before due dates.',
    },
    goalProgress: {
      label: 'Goal progress',
      description: 'Record secure progress updates daily.',
    },
    taskReschedule: {
      label: 'Task reschedule suggestion',
      description: 'Suggest rescheduling if a secure task is missed.',
    },
  },
  privacy: {
    anonymousAnalytics: {
      label: 'Anonymous analytics',
      description: 'Share usage metrics without personal data.',
    },
    personalizedAds: {
      label: 'Personalized advertising',
      description: 'Allow relevant suggestions based on activity.',
    },
    dataDeleteAccess: {
      label: 'Data delete access',
      description: 'Allow deleting data from connected widgets.',
    },
    shareWithPartners: {
      label: 'Share data with partners',
      description: 'Allow aggregated insights with selected partners.',
    },
  },
  sessions: {
    currentDevice: 'Current device',
    yesterday: 'Yesterday',
    daysAgo: (days: number) => `${days} days ago`,
    endAllSessions: 'End all other sessions',
  },
  emergency: {
    deactivateAccount: 'Deactivate account',
    wipeAllData: 'Wipe all data',
  },
  timeOptions: {
    sec30: '30 sec',
    min1: '1 min',
    min5: '5 min',
    min10: '10 min',
    never: 'Never',
    immediately: 'Immediately',
    sec15: '15 sec',
  },
  timeUnits: {
    daysAgo: 'days ago',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RUSSIAN (RU)
// ─────────────────────────────────────────────────────────────────────────────

const RU: SecuritySettingsLocalization = {
  hero: {
    badge: 'Безопасность в норме',
    title: 'Защитите ваше пространство LEORA',
    description:
      'Включите настройки ниже для защиты личных данных на всех устройствах. Управляйте биометрией, двухфакторной верификацией и резервными копиями в одном месте.',
  },
  sections: {
    securityType: {
      title: 'Тип безопасности',
      subtitle: 'Настройте способ разблокировки и время автоблокировки.',
    },
    dataSecurity: {
      title: 'Защита данных',
      subtitle: 'Защитите хранимые данные и конфиденциальную информацию.',
    },
    dataBackup: {
      title: 'Резервное копирование',
      subtitle: 'Управляйте частотой синхронизации и хранением зашифрованных копий.',
    },
    tasksGoals: {
      title: 'Задачи и цели',
      subtitle: 'Настройте напоминания безопасности для инструментов планирования.',
    },
    privacy: {
      title: 'Конфиденциальность',
      subtitle: 'Управляйте аналитикой и параметрами обмена данными.',
    },
    activeSessions: {
      title: 'Активные сеансы',
      subtitle: 'Просмотрите подключённые устройства и отзовите доступ при подозрениях.',
    },
    emergencyActions: {
      title: 'Экстренные действия',
      subtitle: 'Быстрые действия при утере или компрометации устройства.',
    },
  },
  securityType: {
    biometrics: {
      label: 'Биометрия',
      description: 'Используйте Face ID или отпечаток для мгновенной разблокировки.',
    },
    faceId: {
      label: 'Face ID',
      descriptionAvailable: 'Требовать Face ID при каждом запуске приложения.',
      descriptionUnavailable: 'Face ID недоступен на этом устройстве.',
    },
    fingerprint: {
      label: 'Отпечаток пальца',
      descriptionAvailable: 'Разблокировка сохранённым отпечатком.',
      descriptionUnavailable: 'Разблокировка по отпечатку не поддерживается.',
    },
    pinCode: {
      label: 'PIN-код',
      description: 'Установите 4-значный код на случай недоступности биометрии.',
    },
    password: {
      label: 'Пароль',
      descriptionChange: 'Измените основной пароль аккаунта.',
      descriptionCreate: 'Создайте пароль для защиты данных.',
      change: 'Изменить',
      create: 'Создать',
    },
    turnSecurityOff: {
      label: 'Отключить защиту',
      description: 'Отключить все проверки безопасности при запуске.',
    },
    askOnLaunch: {
      label: 'Запрашивать при запуске',
      description: 'Запрашивать учётные данные при каждом запуске.',
    },
    autoblockAfter: {
      label: 'Автоблокировка через',
      description: 'Выберите время до блокировки при бездействии.',
    },
    unlockGracePeriod: {
      label: 'Отсрочка блокировки',
      description: 'Время до появления блокировки после выхода из приложения.',
    },
  },
  dataSecurity: {
    databaseEncryption: {
      label: 'Шифрование базы данных',
      description: 'Шифрование данных в покое с AES-256.',
    },
    hideBalances: {
      label: 'Скрывать балансы',
      description: 'Размытие финансовых данных до разблокировки.',
    },
    screenshotBlock: {
      label: 'Блокировка скриншотов',
      description: 'Запрет скриншотов на конфиденциальных экранах.',
    },
    fakeAccount: {
      label: 'Фиктивный аккаунт',
      description: 'Отображение обманного пространства при принуждении.',
    },
  },
  dataBackup: {
    automaticBackup: {
      label: 'Автоматическое резервирование',
      description: 'Безопасное сохранение данных в облаке.',
    },
    frequency: {
      label: 'Частота',
      description: 'Автоматическое резервирование каждый день.',
      value: 'Каждый день',
    },
    storage: {
      label: 'Хранилище',
      description: 'Выбранное место для безопасных копий.',
      value: 'iCloud',
    },
    lastSync: {
      label: 'Последняя синхронизация',
      description: 'Время последнего резервного копирования.',
    },
    createBackupNow: 'Создать копию сейчас',
  },
  tasksGoals: {
    taskReminder: {
      label: 'Напоминание о задаче',
      description: 'Уведомление за 15 минут до защищённой задачи.',
    },
    deadline: {
      label: 'Дедлайн',
      description: 'Напоминание за день до срока.',
    },
    goalProgress: {
      label: 'Прогресс цели',
      description: 'Ежедневная запись безопасного прогресса.',
    },
    taskReschedule: {
      label: 'Предложение переноса',
      description: 'Предложение переноса при пропуске защищённой задачи.',
    },
  },
  privacy: {
    anonymousAnalytics: {
      label: 'Анонимная аналитика',
      description: 'Передача метрик без личных данных.',
    },
    personalizedAds: {
      label: 'Персонализированная реклама',
      description: 'Релевантные предложения на основе активности.',
    },
    dataDeleteAccess: {
      label: 'Доступ к удалению данных',
      description: 'Разрешить удаление данных из виджетов.',
    },
    shareWithPartners: {
      label: 'Делиться с партнёрами',
      description: 'Передача агрегированных данных избранным партнёрам.',
    },
  },
  sessions: {
    currentDevice: 'Текущее устройство',
    yesterday: 'Вчера',
    daysAgo: (days: number) => `${days} дней назад`,
    endAllSessions: 'Завершить все другие сеансы',
  },
  emergency: {
    deactivateAccount: 'Деактивировать аккаунт',
    wipeAllData: 'Стереть все данные',
  },
  timeOptions: {
    sec30: '30 сек',
    min1: '1 мин',
    min5: '5 мин',
    min10: '10 мин',
    never: 'Никогда',
    immediately: 'Сразу',
    sec15: '15 сек',
  },
  timeUnits: {
    daysAgo: 'дней назад',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UZBEK (UZ - Latin)
// ─────────────────────────────────────────────────────────────────────────────

const UZ: SecuritySettingsLocalization = {
  hero: {
    badge: 'Xavfsizlik yaxshi',
    title: 'LEORA ish joyingizni himoya qiling',
    description:
      "Qurilmalar bo'ylab shaxsiy ma'lumotlarni xavfsiz saqlash uchun quyidagi sozlamalarni yoqing. Biometrika, ikki bosqichli tekshiruv va zaxira nusxalarini bir joydan boshqaring.",
  },
  sections: {
    securityType: {
      title: 'Xavfsizlik turi',
      subtitle: 'Ilova qanday ochilishini va qanchalik tez qulflanishini sozlang.',
    },
    dataSecurity: {
      title: "Ma'lumotlar xavfsizligi",
      subtitle: "Saqlangan ma'lumotlar va maxfiy axborotni himoya qiling.",
    },
    dataBackup: {
      title: 'Zaxira nusxa',
      subtitle: 'LEORA qanchalik tez-tez sinxronlash va shifrlangan zaxiralarni saqlashini boshqaring.',
    },
    tasksGoals: {
      title: 'Vazifalar va maqsadlar',
      subtitle: 'Xavfsizlik eslatmalari rejalashtirish vositalariga qachon tegishli ekanligini aniqlang.',
    },
    privacy: {
      title: 'Maxfiylik',
      subtitle: "LEORAda tahlil va ma'lumotlar almashish variantlarini boshqaring.",
    },
    activeSessions: {
      title: 'Faol seanslar',
      subtitle: "Ulangan qurilmalarni ko'rib chiqing va shubhali bo'lsa kirishni bekor qiling.",
    },
    emergencyActions: {
      title: 'Favqulodda harakatlar',
      subtitle: "Qurilma yo'qolgan yoki buzilgan bo'lsa tezkor javoblar.",
    },
  },
  securityType: {
    biometrics: {
      label: 'Biometriya',
      description: "Face ID yoki barmoq izi bilan tezda ochish.",
    },
    faceId: {
      label: 'Face ID',
      descriptionAvailable: 'Har safar ishga tushirishda Face ID talab qilish.',
      descriptionUnavailable: 'Bu qurilmada Face ID mavjud emas.',
    },
    fingerprint: {
      label: "Barmoq izi",
      descriptionAvailable: "Saqlangan barmoq izingiz bilan ochish.",
      descriptionUnavailable: "Barmoq izi bilan ochish qo'llab-quvvatlanmaydi.",
    },
    pinCode: {
      label: 'PIN-kod',
      description: "Biometriya ishlamasa, 4 raqamli zaxira kod o'rnating.",
    },
    password: {
      label: 'Parol',
      descriptionChange: 'Asosiy hisob parolini o\'zgartiring.',
      descriptionCreate: "Ma'lumotlaringizni himoya qilish uchun parol yarating.",
      change: "O'zgartirish",
      create: 'Yaratish',
    },
    turnSecurityOff: {
      label: "Xavfsizlikni o'chirish",
      description: "Ishga tushirishda barcha xavfsizlik tekshiruvlarini o'chirish.",
    },
    askOnLaunch: {
      label: "Ishga tushirishda so'rash",
      description: "Har safar ishga tushirishda hisob ma'lumotlarini so'rash.",
    },
    autoblockAfter: {
      label: 'Avtoblok vaqti',
      description: "Faol bo'lmaganda ilova qancha vaqt ochiq qolishini tanlang.",
    },
    unlockGracePeriod: {
      label: 'Qulfdan chiqish kechikishi',
      description: "Ilovadan chiqqandan keyin qulf qanchalik tez paydo bo'lishini belgilang.",
    },
  },
  dataSecurity: {
    databaseEncryption: {
      label: "Ma'lumotlar bazasi shifrlash",
      description: "AES-256 bilan dam olish holatida shifrlash.",
    },
    hideBalances: {
      label: "Balanslarni yashirish",
      description: "Ilova ochilmaguncha moliyaviy raqamlarni xiralashtirish.",
    },
    screenshotBlock: {
      label: "Skrinshot bloklash",
      description: "Maxfiy ekranlarda skrinshotlarni oldini olish.",
    },
    fakeAccount: {
      label: "Soxta hisob",
      description: "Bosim ostida aldov ish joyini ko'rsatish.",
    },
  },
  dataBackup: {
    automaticBackup: {
      label: "Avtomatik zaxira",
      description: "Ma'lumotlaringizni bulutda xavfsiz saqlash.",
    },
    frequency: {
      label: 'Chastota',
      description: 'Har kuni avtomatik zaxira qiladi.',
      value: 'Har kuni',
    },
    storage: {
      label: "Xotira",
      description: "Xavfsiz zaxiralar uchun tanlangan joy.",
      value: 'iCloud',
    },
    lastSync: {
      label: "So'nggi sinxronlash",
      description: "Eng so'nggi zaxira vaqt belgisi.",
    },
    createBackupNow: "Hozir zaxira yaratish",
  },
  tasksGoals: {
    taskReminder: {
      label: 'Vazifa eslatmasi',
      description: "Xavfsiz vazifadan 15 daqiqa oldin xabar berish.",
    },
    deadline: {
      label: 'Muddat',
      description: "Muddatdan bir kun oldin eslatish.",
    },
    goalProgress: {
      label: "Maqsad jarayoni",
      description: "Har kuni xavfsiz jarayon yangilanishlarini yozib borish.",
    },
    taskReschedule: {
      label: "Vazifani qayta rejalashtirish taklifi",
      description: "Xavfsiz vazifa o'tkazib yuborilsa, qayta rejalashtirishni taklif qilish.",
    },
  },
  privacy: {
    anonymousAnalytics: {
      label: "Anonim tahlil",
      description: "Shaxsiy ma'lumotsiz foydalanish ko'rsatkichlarini ulashish.",
    },
    personalizedAds: {
      label: "Shaxsiylashtirilgan reklama",
      description: "Faollikka asoslangan tegishli takliflarga ruxsat berish.",
    },
    dataDeleteAccess: {
      label: "Ma'lumotlarni o'chirish imkoniyati",
      description: "Ulangan vidjetlardan ma'lumotlarni o'chirishga ruxsat berish.",
    },
    shareWithPartners: {
      label: "Hamkorlar bilan ulashish",
      description: "Tanlangan hamkorlarga umumlashtirilgan ma'lumotlarga ruxsat berish.",
    },
  },
  sessions: {
    currentDevice: 'Joriy qurilma',
    yesterday: 'Kecha',
    daysAgo: (days: number) => `${days} kun oldin`,
    endAllSessions: "Barcha boshqa seanslarni tugatish",
  },
  emergency: {
    deactivateAccount: "Hisobni o'chirish",
    wipeAllData: "Barcha ma'lumotlarni o'chirish",
  },
  timeOptions: {
    sec30: '30 soniya',
    min1: '1 daqiqa',
    min5: '5 daqiqa',
    min10: '10 daqiqa',
    never: 'Hech qachon',
    immediately: 'Darhol',
    sec15: '15 soniya',
  },
  timeUnits: {
    daysAgo: 'kun oldin',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ARABIC (AR)
// ─────────────────────────────────────────────────────────────────────────────

const AR: SecuritySettingsLocalization = {
  hero: {
    badge: 'وضع الأمان جيد',
    title: 'احمِ مساحة عمل LEORA',
    description:
      'فعّل عناصر التحكم أدناه للحفاظ على أمان البيانات الشخصية عبر الأجهزة. إدارة المقاييس الحيوية والتحقق الثنائي وروتينات النسخ الاحتياطي من مكان واحد.',
  },
  sections: {
    securityType: {
      title: 'نوع الأمان',
      subtitle: 'إعداد طريقة فتح التطبيق وسرعة القفل.',
    },
    dataSecurity: {
      title: 'أمان البيانات',
      subtitle: 'حماية البيانات المخزنة والمعلومات الحساسة.',
    },
    dataBackup: {
      title: 'النسخ الاحتياطي',
      subtitle: 'التحكم في تكرار المزامنة وتخزين النسخ المشفرة.',
    },
    tasksGoals: {
      title: 'المهام والأهداف',
      subtitle: 'تحديد متى تنطبق تذكيرات الأمان على أدوات التخطيط.',
    },
    privacy: {
      title: 'الخصوصية',
      subtitle: 'التحكم في خيارات التحليلات ومشاركة البيانات.',
    },
    activeSessions: {
      title: 'الجلسات النشطة',
      subtitle: 'مراجعة الأجهزة المتصلة وإلغاء الوصول عند الشك.',
    },
    emergencyActions: {
      title: 'إجراءات الطوارئ',
      subtitle: 'استجابات سريعة عند فقدان الجهاز أو اختراقه.',
    },
  },
  securityType: {
    biometrics: {
      label: 'المقاييس الحيوية',
      description: 'استخدم Face ID أو البصمة للفتح الفوري.',
    },
    faceId: {
      label: 'Face ID',
      descriptionAvailable: 'طلب Face ID عند كل تشغيل.',
      descriptionUnavailable: 'Face ID غير متاح على هذا الجهاز.',
    },
    fingerprint: {
      label: 'البصمة',
      descriptionAvailable: 'فتح ببصمتك المحفوظة.',
      descriptionUnavailable: 'فتح البصمة غير مدعوم.',
    },
    pinCode: {
      label: 'رمز PIN',
      description: 'تعيين رمز من 4 أرقام كبديل.',
    },
    password: {
      label: 'كلمة المرور',
      descriptionChange: 'تغيير كلمة مرور الحساب الرئيسية.',
      descriptionCreate: 'إنشاء كلمة مرور لحماية بياناتك.',
      change: 'تغيير',
      create: 'إنشاء',
    },
    turnSecurityOff: {
      label: 'إيقاف الأمان',
      description: 'تعطيل جميع فحوصات الأمان عند التشغيل.',
    },
    askOnLaunch: {
      label: 'السؤال عند التشغيل',
      description: 'طلب بيانات الاعتماد عند كل بدء.',
    },
    autoblockAfter: {
      label: 'القفل التلقائي بعد',
      description: 'اختر مدة بقاء التطبيق مفتوحاً عند عدم النشاط.',
    },
    unlockGracePeriod: {
      label: 'فترة السماح للقفل',
      description: 'تحديد سرعة ظهور القفل بعد مغادرة التطبيق.',
    },
  },
  dataSecurity: {
    databaseEncryption: {
      label: 'تشفير قاعدة البيانات',
      description: 'تشفير البيانات بـ AES-256.',
    },
    hideBalances: {
      label: 'إخفاء الأرصدة',
      description: 'تعتيم الأرقام المالية حتى فتح التطبيق.',
    },
    screenshotBlock: {
      label: 'حظر لقطات الشاشة',
      description: 'منع لقطات الشاشة على الصفحات الحساسة.',
    },
    fakeAccount: {
      label: 'حساب وهمي',
      description: 'عرض مساحة عمل مزيفة تحت الضغط.',
    },
  },
  dataBackup: {
    automaticBackup: {
      label: 'النسخ التلقائي',
      description: 'حفظ بياناتك بأمان في السحابة.',
    },
    frequency: {
      label: 'التكرار',
      description: 'نسخ احتياطي تلقائي يومياً.',
      value: 'كل يوم',
    },
    storage: {
      label: 'التخزين',
      description: 'موقع التخزين المحدد للنسخ الآمنة.',
      value: 'iCloud',
    },
    lastSync: {
      label: 'آخر مزامنة',
      description: 'وقت آخر نسخة احتياطية.',
    },
    createBackupNow: 'إنشاء نسخة الآن',
  },
  tasksGoals: {
    taskReminder: {
      label: 'تذكير المهمة',
      description: 'إشعار قبل 15 دقيقة من مهمة آمنة.',
    },
    deadline: {
      label: 'الموعد النهائي',
      description: 'تذكير قبل يوم من تواريخ الاستحقاق.',
    },
    goalProgress: {
      label: 'تقدم الهدف',
      description: 'تسجيل تحديثات التقدم الآمنة يومياً.',
    },
    taskReschedule: {
      label: 'اقتراح إعادة الجدولة',
      description: 'اقتراح إعادة الجدولة عند تفويت مهمة آمنة.',
    },
  },
  privacy: {
    anonymousAnalytics: {
      label: 'التحليلات المجهولة',
      description: 'مشاركة مقاييس الاستخدام بدون بيانات شخصية.',
    },
    personalizedAds: {
      label: 'الإعلانات المخصصة',
      description: 'السماح باقتراحات ذات صلة بناءً على النشاط.',
    },
    dataDeleteAccess: {
      label: 'صلاحية حذف البيانات',
      description: 'السماح بحذف البيانات من الأدوات المتصلة.',
    },
    shareWithPartners: {
      label: 'المشاركة مع الشركاء',
      description: 'السماح برؤى مجمعة مع شركاء محددين.',
    },
  },
  sessions: {
    currentDevice: 'الجهاز الحالي',
    yesterday: 'أمس',
    daysAgo: (days: number) => `منذ ${days} أيام`,
    endAllSessions: 'إنهاء جميع الجلسات الأخرى',
  },
  emergency: {
    deactivateAccount: 'تعطيل الحساب',
    wipeAllData: 'مسح جميع البيانات',
  },
  timeOptions: {
    sec30: '30 ثانية',
    min1: '1 دقيقة',
    min5: '5 دقائق',
    min10: '10 دقائق',
    never: 'أبداً',
    immediately: 'فوراً',
    sec15: '15 ثانية',
  },
  timeUnits: {
    daysAgo: 'أيام مضت',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TURKISH (TR)
// ─────────────────────────────────────────────────────────────────────────────

const TR: SecuritySettingsLocalization = {
  hero: {
    badge: 'Güvenlik durumu iyi',
    title: 'LEORA çalışma alanınızı koruyun',
    description:
      'Kişisel verileri cihazlar arasında güvende tutmak için aşağıdaki kontrolleri etkinleştirin. Biyometri, iki faktörlü doğrulama ve yedekleme rutinlerini tek yerden yönetin.',
  },
  sections: {
    securityType: {
      title: 'Güvenlik türü',
      subtitle: 'Uygulamanın nasıl açılacağını ve ne kadar çabuk kilitleneceğini ayarlayın.',
    },
    dataSecurity: {
      title: 'Veri güvenliği',
      subtitle: 'Depolanan verileri ve hassas bilgileri koruyun.',
    },
    dataBackup: {
      title: 'Veri yedekleme',
      subtitle: 'LEORA\'nın ne sıklıkta senkronize edip şifreli yedek saklayacağını kontrol edin.',
    },
    tasksGoals: {
      title: 'Görevler ve hedefler',
      subtitle: 'Güvenlik hatırlatıcılarının planlama araçlarına ne zaman uygulanacağına karar verin.',
    },
    privacy: {
      title: 'Gizlilik',
      subtitle: 'Analitik ve veri paylaşım seçeneklerini kontrol edin.',
    },
    activeSessions: {
      title: 'Aktif oturumlar',
      subtitle: 'Bağlı cihazları gözden geçirin ve şüpheli durumda erişimi iptal edin.',
    },
    emergencyActions: {
      title: 'Acil eylemler',
      subtitle: 'Cihazınız kaybolduğunda veya tehlikeye girdiğinde hızlı yanıtlar.',
    },
  },
  securityType: {
    biometrics: {
      label: 'Biyometri',
      description: 'Anında açmak için Face ID veya parmak izi kullanın.',
    },
    faceId: {
      label: 'Face ID',
      descriptionAvailable: 'Her başlatmada Face ID gerektir.',
      descriptionUnavailable: 'Face ID bu cihazda mevcut değil.',
    },
    fingerprint: {
      label: 'Parmak izi',
      descriptionAvailable: 'Kayıtlı parmak izinizle açın.',
      descriptionUnavailable: 'Parmak iziyle açma desteklenmiyor.',
    },
    pinCode: {
      label: 'PIN kodu',
      description: 'Biyometri kullanılamadığında 4 haneli yedek kod belirleyin.',
    },
    password: {
      label: 'Şifre',
      descriptionChange: 'Ana hesap şifresini değiştirin.',
      descriptionCreate: 'Verilerinizi korumak için şifre oluşturun.',
      change: 'Değiştir',
      create: 'Oluştur',
    },
    turnSecurityOff: {
      label: 'Güvenliği kapat',
      description: 'Başlatmada tüm güvenlik kontrollerini devre dışı bırak.',
    },
    askOnLaunch: {
      label: 'Başlatmada sor',
      description: 'Her başlangıçta güvenlik bilgilerini iste.',
    },
    autoblockAfter: {
      label: 'Otomatik kilitleme süresi',
      description: 'Etkin değilken uygulamanın ne kadar açık kalacağını seçin.',
    },
    unlockGracePeriod: {
      label: 'Kilit gecikmesi',
      description: 'Uygulamadan ayrıldıktan sonra kilidin ne kadar çabuk görüneceğini belirleyin.',
    },
  },
  dataSecurity: {
    databaseEncryption: {
      label: 'Veritabanı şifreleme',
      description: 'AES-256 ile durağan veri şifreleme.',
    },
    hideBalances: {
      label: 'Bakiyeleri gizle',
      description: 'Uygulama açılana kadar finansal rakamları bulanıklaştır.',
    },
    screenshotBlock: {
      label: 'Ekran görüntüsü engelle',
      description: 'Hassas ekranlarda ekran görüntüsü almayı engelle.',
    },
    fakeAccount: {
      label: 'Sahte hesap',
      description: 'Baskı altındayken sahte çalışma alanı göster.',
    },
  },
  dataBackup: {
    automaticBackup: {
      label: 'Otomatik yedekleme',
      description: 'Verilerinizi bulutta güvenle saklayın.',
    },
    frequency: {
      label: 'Sıklık',
      description: 'Her gün otomatik yedekleme yapar.',
      value: 'Her gün',
    },
    storage: {
      label: 'Depolama',
      description: 'Güvenli yedekler için seçilen konum.',
      value: 'iCloud',
    },
    lastSync: {
      label: 'Son senkronizasyon',
      description: 'En son yedekleme zaman damgası.',
    },
    createBackupNow: 'Şimdi yedek oluştur',
  },
  tasksGoals: {
    taskReminder: {
      label: 'Görev hatırlatıcısı',
      description: 'Güvenli görevden 15 dakika önce bildir.',
    },
    deadline: {
      label: 'Son tarih',
      description: 'Bitiş tarihinden bir gün önce hatırlat.',
    },
    goalProgress: {
      label: 'Hedef ilerlemesi',
      description: 'Günlük güvenli ilerleme güncellemelerini kaydet.',
    },
    taskReschedule: {
      label: 'Yeniden planlama önerisi',
      description: 'Güvenli görev kaçırılırsa yeniden planlamayı öner.',
    },
  },
  privacy: {
    anonymousAnalytics: {
      label: 'Anonim analitik',
      description: 'Kişisel veriler olmadan kullanım ölçümlerini paylaş.',
    },
    personalizedAds: {
      label: 'Kişiselleştirilmiş reklam',
      description: 'Aktiviteye dayalı ilgili önerilere izin ver.',
    },
    dataDeleteAccess: {
      label: 'Veri silme erişimi',
      description: 'Bağlı widget\'lardan veri silmeye izin ver.',
    },
    shareWithPartners: {
      label: 'Ortaklarla paylaş',
      description: 'Seçili ortaklarla toplu içgörülere izin ver.',
    },
  },
  sessions: {
    currentDevice: 'Mevcut cihaz',
    yesterday: 'Dün',
    daysAgo: (days: number) => `${days} gün önce`,
    endAllSessions: 'Tüm diğer oturumları sonlandır',
  },
  emergency: {
    deactivateAccount: 'Hesabı devre dışı bırak',
    wipeAllData: 'Tüm verileri sil',
  },
  timeOptions: {
    sec30: '30 sn',
    min1: '1 dk',
    min5: '5 dk',
    min10: '10 dk',
    never: 'Asla',
    immediately: 'Hemen',
    sec15: '15 sn',
  },
  timeUnits: {
    daysAgo: 'gün önce',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const SECURITY_LOCALIZATION: Record<SupportedLanguage, SecuritySettingsLocalization> = {
  en: EN,
  ru: RU,
  uz: UZ,
  ar: AR,
  tr: TR,
};

export const useSecuritySettingsLocalization = () => {
  const { language } = useLocalization();
  return SECURITY_LOCALIZATION[language] ?? SECURITY_LOCALIZATION.en;
};
