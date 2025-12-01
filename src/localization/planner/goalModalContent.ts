import { useLocalization } from '../useLocalization';
import { SupportedLanguage } from '@/stores/useSettingsStore';

// ─────────────────────────────────────────────────────────────────────────────
// GOAL MODAL CONTENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface GoalModalContentLocalization {
  header: {
    createGoal: string;
    editGoal: string;
    close: string;
  };
  wizardSteps: {
    what: string;
    measure: string;
    when: string;
    connect: string;
  };
  step1: {
    title: string;
    titlePlaceholder: string;
    category: string;
    whyImportant: string;
    motivationPlaceholder: string;
    whyHint: string;
  };
  step2: {
    title: string;
    goalType: string;
    currency: string;
    currencyInherited: string;
    current: string;
    target: string;
    whatMeasure: string;
    unit: string;
    unitPlaceholderCount: string;
    unitPlaceholderDuration: string;
    progressAutoHint: string;
  };
  step3: {
    title: string;
    deadline: string;
    selectDate: string;
    deadlineHint: string;
    quickSelect: string;
    milestones: string;
    milestonePlaceholder: (index: number) => string;
    addMilestone: string;
  };
  step4: {
    title: string;
    subtitle: string;
    livePreview: string;
    budgetBalance: string;
    goalProgress: string;
    debtRemaining: string;
    linkSavingsBudget: string;
    noBudget: string;
    addBudget: string;
    noBudgetsHint: string;
    whichDebt: string;
    noDebt: string;
    createNewDebt: string;
    noDebtsHint: string;
    debtProgressHint: string;
    linkBudgetCategory: string;
    nonFinancialHint: string;
    connectFinance: string;
    createBudgetForGoal: string;
    addContribution: string;
  };
  goalTypes: {
    money: string;
    health: string;
    learning: string;
    career: string;
    personal: string;
  };
  goalExamples: {
    financial: string[];
    health: string[];
    education: string[];
    productivity: string[];
    personal: string[];
  };
  financeModes: {
    save: { label: string; description: string };
    spend: { label: string; description: string };
    debtClose: { label: string; description: string };
  };
  metricOptions: {
    money: { label: string; description: string };
    number: { label: string; description: string };
    time: { label: string; description: string };
    weight: { label: string; description: string };
    custom: { label: string; description: string };
  };
  deadlinePresets: {
    oneMonth: string;
    threeMonths: string;
    sixMonths: string;
    oneYear: string;
  };
  validation: {
    titleRequired: string;
    titleTooShort: string;
    targetInvalid: string;
    targetSameAsCurrent: string;
    budgetRequired: string;
    debtRequired: string;
  };
  buttons: {
    back: string;
    next: string;
    createGoal: string;
    done: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH (EN)
// ─────────────────────────────────────────────────────────────────────────────

const EN: GoalModalContentLocalization = {
  header: {
    createGoal: 'Create Goal',
    editGoal: 'Edit Goal',
    close: 'Close',
  },
  wizardSteps: {
    what: 'What',
    measure: 'Measure',
    when: 'When',
    connect: 'Connect',
  },
  step1: {
    title: 'What do you want to achieve?',
    titlePlaceholder: 'E.g., "Save for vacation", "Run a marathon", "Learn Spanish"',
    category: 'Category',
    whyImportant: 'Why is this important? (optional)',
    motivationPlaceholder: 'Your motivation...',
    whyHint: "Goals with clear 'why' are 60% more likely to succeed",
  },
  step2: {
    title: 'How will you track it?',
    goalType: 'Goal Type',
    currency: 'Currency',
    currencyInherited: 'Currency inherited from linked budget',
    current: 'Current',
    target: 'Target *',
    whatMeasure: 'What will you measure?',
    unit: 'Unit',
    unitPlaceholderCount: 'workouts, books, km...',
    unitPlaceholderDuration: 'hours, minutes...',
    progressAutoHint: 'Progress will update automatically based on your transactions',
  },
  step3: {
    title: 'When do you want to achieve this?',
    deadline: 'Deadline (optional)',
    selectDate: 'Select date',
    deadlineHint: 'Goals with deadlines are 42% more successful',
    quickSelect: 'Quick select',
    milestones: 'Milestones (optional)',
    milestonePlaceholder: (index) => `Milestone ${index}`,
    addMilestone: 'Add milestone',
  },
  step4: {
    title: 'Connect to finances (optional)',
    subtitle: 'Link to budgets or debts to track progress automatically',
    livePreview: 'Live preview',
    budgetBalance: 'Budget balance',
    goalProgress: 'Goal progress',
    debtRemaining: 'Debt remaining',
    linkSavingsBudget: 'Link to savings budget',
    noBudget: 'No budget',
    addBudget: 'Add Budget',
    noBudgetsHint: 'No budgets available. Create one below to link automatically.',
    whichDebt: 'Which debt are you paying off?',
    noDebt: 'No debt',
    createNewDebt: 'Create New Debt',
    noDebtsHint: 'No active debts. Create one in Finance tab.',
    debtProgressHint: 'Progress updates automatically when you make payments',
    linkBudgetCategory: 'Link to budget category',
    nonFinancialHint: 'Finance linking is only available for financial goals. You can add habits and tasks later from the goal details screen.',
    connectFinance: 'Connect finance',
    createBudgetForGoal: 'Create budget for this goal',
    addContribution: 'Add contribution',
  },
  goalTypes: {
    money: 'Money',
    health: 'Health',
    learning: 'Learning',
    career: 'Career',
    personal: 'Personal',
  },
  goalExamples: {
    financial: ['Save $5000', 'Pay off debt'],
    health: ['Lose 10kg', 'Run 5km'],
    education: ['Read 24 books', 'Master React'],
    productivity: ['Get promoted', 'Launch side project'],
    personal: ['Meditate daily', 'Travel to 5 countries'],
  },
  financeModes: {
    save: { label: 'Save money', description: 'Build savings' },
    spend: { label: 'Budget limit', description: 'Control spending' },
    debtClose: { label: 'Pay off debt', description: 'Eliminate debt' },
  },
  metricOptions: {
    money: { label: 'Money', description: 'Financial goals' },
    number: { label: 'Number', description: 'Count-based' },
    time: { label: 'Time', description: 'Time-based' },
    weight: { label: 'Weight', description: 'Weight tracking' },
    custom: { label: 'Custom', description: 'Your metric' },
  },
  deadlinePresets: {
    oneMonth: '1 month',
    threeMonths: '3 months',
    sixMonths: '6 months',
    oneYear: '1 year',
  },
  validation: {
    titleRequired: 'Title is required',
    titleTooShort: 'Title is too short. Be more specific!',
    targetInvalid: 'Target must be a valid number',
    targetSameAsCurrent: 'Target should be different from current value',
    budgetRequired: 'Select or create a budget for this goal.',
    debtRequired: 'Link a debt to track repayments.',
  },
  buttons: {
    back: 'Back',
    next: 'Next →',
    createGoal: 'Create Goal',
    done: 'Done',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RUSSIAN (RU)
// ─────────────────────────────────────────────────────────────────────────────

const RU: GoalModalContentLocalization = {
  header: {
    createGoal: 'Создать цель',
    editGoal: 'Редактировать цель',
    close: 'Закрыть',
  },
  wizardSteps: {
    what: 'Что',
    measure: 'Измерение',
    when: 'Когда',
    connect: 'Связать',
  },
  step1: {
    title: 'Чего вы хотите достичь?',
    titlePlaceholder: 'Например: «Накопить на отпуск», «Пробежать марафон», «Выучить испанский»',
    category: 'Категория',
    whyImportant: 'Почему это важно? (необязательно)',
    motivationPlaceholder: 'Ваша мотивация...',
    whyHint: 'Цели с чётким «зачем» достигаются на 60% чаще',
  },
  step2: {
    title: 'Как вы будете отслеживать?',
    goalType: 'Тип цели',
    currency: 'Валюта',
    currencyInherited: 'Валюта унаследована от привязанного бюджета',
    current: 'Текущее',
    target: 'Цель *',
    whatMeasure: 'Что вы будете измерять?',
    unit: 'Единица',
    unitPlaceholderCount: 'тренировки, книги, км...',
    unitPlaceholderDuration: 'часы, минуты...',
    progressAutoHint: 'Прогресс обновляется автоматически на основе ваших транзакций',
  },
  step3: {
    title: 'Когда вы хотите этого достичь?',
    deadline: 'Дедлайн (необязательно)',
    selectDate: 'Выбрать дату',
    deadlineHint: 'Цели с дедлайнами успешны на 42% чаще',
    quickSelect: 'Быстрый выбор',
    milestones: 'Вехи (необязательно)',
    milestonePlaceholder: (index) => `Веха ${index}`,
    addMilestone: 'Добавить веху',
  },
  step4: {
    title: 'Связать с финансами (необязательно)',
    subtitle: 'Привяжите к бюджетам или долгам для автоотслеживания',
    livePreview: 'Предпросмотр',
    budgetBalance: 'Баланс бюджета',
    goalProgress: 'Прогресс цели',
    debtRemaining: 'Остаток долга',
    linkSavingsBudget: 'Привязать к накопительному бюджету',
    noBudget: 'Без бюджета',
    addBudget: 'Добавить бюджет',
    noBudgetsHint: 'Нет доступных бюджетов. Создайте ниже для автопривязки.',
    whichDebt: 'Какой долг вы погашаете?',
    noDebt: 'Без долга',
    createNewDebt: 'Создать новый долг',
    noDebtsHint: 'Нет активных долгов. Создайте во вкладке Финансы.',
    debtProgressHint: 'Прогресс обновляется автоматически при оплате',
    linkBudgetCategory: 'Привязать к категории бюджета',
    nonFinancialHint: 'Привязка финансов доступна только для финансовых целей. Привычки и задачи можно добавить позже.',
    connectFinance: 'Связать с финансами',
    createBudgetForGoal: 'Создать бюджет для этой цели',
    addContribution: 'Добавить вклад',
  },
  goalTypes: {
    money: 'Деньги',
    health: 'Здоровье',
    learning: 'Обучение',
    career: 'Карьера',
    personal: 'Личное',
  },
  goalExamples: {
    financial: ['Накопить $5000', 'Погасить долг'],
    health: ['Сбросить 10 кг', 'Пробежать 5 км'],
    education: ['Прочитать 24 книги', 'Освоить React'],
    productivity: ['Получить повышение', 'Запустить проект'],
    personal: ['Медитировать ежедневно', 'Посетить 5 стран'],
  },
  financeModes: {
    save: { label: 'Копить', description: 'Создать накопления' },
    spend: { label: 'Лимит расходов', description: 'Контроль трат' },
    debtClose: { label: 'Погасить долг', description: 'Устранить долг' },
  },
  metricOptions: {
    money: { label: 'Деньги', description: 'Финансовые цели' },
    number: { label: 'Число', description: 'Счётные' },
    time: { label: 'Время', description: 'Временные' },
    weight: { label: 'Вес', description: 'Отслеживание веса' },
    custom: { label: 'Своя', description: 'Ваша метрика' },
  },
  deadlinePresets: {
    oneMonth: '1 месяц',
    threeMonths: '3 месяца',
    sixMonths: '6 месяцев',
    oneYear: '1 год',
  },
  validation: {
    titleRequired: 'Название обязательно',
    titleTooShort: 'Название слишком короткое. Будьте конкретнее!',
    targetInvalid: 'Цель должна быть числом',
    targetSameAsCurrent: 'Цель должна отличаться от текущего значения',
    budgetRequired: 'Выберите или создайте бюджет для этой цели.',
    debtRequired: 'Привяжите долг для отслеживания платежей.',
  },
  buttons: {
    back: 'Назад',
    next: 'Далее →',
    createGoal: 'Создать цель',
    done: 'Готово',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UZBEK (UZ - Latin)
// ─────────────────────────────────────────────────────────────────────────────

const UZ: GoalModalContentLocalization = {
  header: {
    createGoal: "Maqsad yaratish",
    editGoal: "Maqsadni tahrirlash",
    close: "Yopish",
  },
  wizardSteps: {
    what: "Nima",
    measure: "O'lchov",
    when: "Qachon",
    connect: "Bog'lash",
  },
  step1: {
    title: "Nimaga erishmoqchisiz?",
    titlePlaceholder: 'Masalan: "Dam olishga pul yig\'ish", "Marafon yugurish", "Ispan tilini o\'rganish"',
    category: "Kategoriya",
    whyImportant: "Nega bu muhim? (ixtiyoriy)",
    motivationPlaceholder: "Sizning motivatsiyangiz...",
    whyHint: "Aniq \"nega\"si bor maqsadlar 60% ko'proq muvaffaqiyatli",
  },
  step2: {
    title: "Qanday kuzatasiz?",
    goalType: "Maqsad turi",
    currency: "Valyuta",
    currencyInherited: "Valyuta bog'langan byudjetdan olingan",
    current: "Joriy",
    target: "Maqsad *",
    whatMeasure: "Nimani o'lchasiz?",
    unit: "Birlik",
    unitPlaceholderCount: "mashqlar, kitoblar, km...",
    unitPlaceholderDuration: "soatlar, daqiqalar...",
    progressAutoHint: "Jarayon tranzaksiyalaringiz asosida avtomatik yangilanadi",
  },
  step3: {
    title: "Bunga qachon erishmoqchisiz?",
    deadline: "Muddat (ixtiyoriy)",
    selectDate: "Sana tanlash",
    deadlineHint: "Muddatli maqsadlar 42% ko'proq muvaffaqiyatli",
    quickSelect: "Tez tanlash",
    milestones: "Bosqichlar (ixtiyoriy)",
    milestonePlaceholder: (index) => `Bosqich ${index}`,
    addMilestone: "Bosqich qo'shish",
  },
  step4: {
    title: "Moliyaga bog'lash (ixtiyoriy)",
    subtitle: "Avtomatik kuzatish uchun byudjet yoki qarzlarga bog'lang",
    livePreview: "Jonli ko'rinish",
    budgetBalance: "Byudjet balansi",
    goalProgress: "Maqsad jarayoni",
    debtRemaining: "Qarz qoldig'i",
    linkSavingsBudget: "Jamg'arma byudjetiga bog'lash",
    noBudget: "Byudjetsiz",
    addBudget: "Byudjet qo'shish",
    noBudgetsHint: "Byudjetlar mavjud emas. Avtomatik bog'lash uchun quyida yarating.",
    whichDebt: "Qaysi qarzni to'layapsiz?",
    noDebt: "Qarzsiz",
    createNewDebt: "Yangi qarz yaratish",
    noDebtsHint: "Faol qarzlar yo'q. Moliya bo'limida yarating.",
    debtProgressHint: "To'lov qilganingizda jarayon avtomatik yangilanadi",
    linkBudgetCategory: "Byudjet kategoriyasiga bog'lash",
    nonFinancialHint: "Moliyaga bog'lash faqat moliyaviy maqsadlar uchun. Odat va vazifalarni keyinroq qo'shishingiz mumkin.",
    connectFinance: "Moliyaga bog'lash",
    createBudgetForGoal: "Bu maqsad uchun byudjet yaratish",
    addContribution: "Hissa qo'shish",
  },
  goalTypes: {
    money: "Pul",
    health: "Salomatlik",
    learning: "Ta'lim",
    career: "Karyera",
    personal: "Shaxsiy",
  },
  goalExamples: {
    financial: ["$5000 yig'ish", "Qarzni to'lash"],
    health: ["10 kg tashlash", "5 km yugurish"],
    education: ["24 ta kitob o'qish", "Reactni o'zlashtirish"],
    productivity: ["Lavozim olish", "Loyihani ishga tushirish"],
    personal: ["Har kuni meditatsiya", "5 ta mamlakatga sayohat"],
  },
  financeModes: {
    save: { label: "Pul yig'ish", description: "Jamg'arma yaratish" },
    spend: { label: "Byudjet limiti", description: "Xarajatlarni nazorat qilish" },
    debtClose: { label: "Qarzni to'lash", description: "Qarzdan xalos bo'lish" },
  },
  metricOptions: {
    money: { label: "Pul", description: "Moliyaviy maqsadlar" },
    number: { label: "Son", description: "Songa asoslangan" },
    time: { label: "Vaqt", description: "Vaqtga asoslangan" },
    weight: { label: "Vazn", description: "Vazn kuzatuvi" },
    custom: { label: "Maxsus", description: "Sizning o'lchovingiz" },
  },
  deadlinePresets: {
    oneMonth: "1 oy",
    threeMonths: "3 oy",
    sixMonths: "6 oy",
    oneYear: "1 yil",
  },
  validation: {
    titleRequired: "Sarlavha talab qilinadi",
    titleTooShort: "Sarlavha juda qisqa. Aniqroq bo'ling!",
    targetInvalid: "Maqsad to'g'ri son bo'lishi kerak",
    targetSameAsCurrent: "Maqsad joriy qiymatdan farq qilishi kerak",
    budgetRequired: "Bu maqsad uchun byudjet tanlang yoki yarating.",
    debtRequired: "To'lovlarni kuzatish uchun qarzni bog'lang.",
  },
  buttons: {
    back: "Orqaga",
    next: "Keyingi →",
    createGoal: "Maqsad yaratish",
    done: "Tayyor",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ARABIC (AR)
// ─────────────────────────────────────────────────────────────────────────────

const AR: GoalModalContentLocalization = {
  header: {
    createGoal: 'إنشاء هدف',
    editGoal: 'تعديل الهدف',
    close: 'إغلاق',
  },
  wizardSteps: {
    what: 'ماذا',
    measure: 'القياس',
    when: 'متى',
    connect: 'ربط',
  },
  step1: {
    title: 'ماذا تريد أن تحقق؟',
    titlePlaceholder: 'مثال: "الادخار للإجازة"، "الركض في ماراثون"، "تعلم الإسبانية"',
    category: 'الفئة',
    whyImportant: 'لماذا هذا مهم؟ (اختياري)',
    motivationPlaceholder: 'دافعك...',
    whyHint: 'الأهداف ذات "لماذا" واضح تنجح بنسبة 60% أكثر',
  },
  step2: {
    title: 'كيف ستتتبعه؟',
    goalType: 'نوع الهدف',
    currency: 'العملة',
    currencyInherited: 'العملة موروثة من الميزانية المرتبطة',
    current: 'الحالي',
    target: 'الهدف *',
    whatMeasure: 'ماذا ستقيس؟',
    unit: 'الوحدة',
    unitPlaceholderCount: 'تمارين، كتب، كم...',
    unitPlaceholderDuration: 'ساعات، دقائق...',
    progressAutoHint: 'سيتم تحديث التقدم تلقائياً بناءً على معاملاتك',
  },
  step3: {
    title: 'متى تريد تحقيق هذا؟',
    deadline: 'الموعد النهائي (اختياري)',
    selectDate: 'اختر التاريخ',
    deadlineHint: 'الأهداف ذات المواعيد النهائية أنجح بنسبة 42%',
    quickSelect: 'اختيار سريع',
    milestones: 'المراحل (اختياري)',
    milestonePlaceholder: (index) => `المرحلة ${index}`,
    addMilestone: 'إضافة مرحلة',
  },
  step4: {
    title: 'الربط بالمالية (اختياري)',
    subtitle: 'اربط بالميزانيات أو الديون للتتبع التلقائي',
    livePreview: 'معاينة مباشرة',
    budgetBalance: 'رصيد الميزانية',
    goalProgress: 'تقدم الهدف',
    debtRemaining: 'الدين المتبقي',
    linkSavingsBudget: 'الربط بميزانية الادخار',
    noBudget: 'بدون ميزانية',
    addBudget: 'إضافة ميزانية',
    noBudgetsHint: 'لا توجد ميزانيات. أنشئ واحدة أدناه للربط التلقائي.',
    whichDebt: 'أي دين تسدده؟',
    noDebt: 'بدون دين',
    createNewDebt: 'إنشاء دين جديد',
    noDebtsHint: 'لا توجد ديون نشطة. أنشئ واحداً في تبويب المالية.',
    debtProgressHint: 'يتم تحديث التقدم تلقائياً عند الدفع',
    linkBudgetCategory: 'الربط بفئة الميزانية',
    nonFinancialHint: 'الربط المالي متاح فقط للأهداف المالية. يمكنك إضافة العادات والمهام لاحقاً.',
    connectFinance: 'ربط بالمالية',
    createBudgetForGoal: 'إنشاء ميزانية لهذا الهدف',
    addContribution: 'إضافة مساهمة',
  },
  goalTypes: {
    money: 'المال',
    health: 'الصحة',
    learning: 'التعلم',
    career: 'المهنة',
    personal: 'شخصي',
  },
  goalExamples: {
    financial: ['ادخار $5000', 'سداد الدين'],
    health: ['خسارة 10 كغ', 'الركض 5 كم'],
    education: ['قراءة 24 كتاباً', 'إتقان React'],
    productivity: ['الحصول على ترقية', 'إطلاق مشروع جانبي'],
    personal: ['التأمل يومياً', 'السفر إلى 5 دول'],
  },
  financeModes: {
    save: { label: 'الادخار', description: 'بناء المدخرات' },
    spend: { label: 'حد الميزانية', description: 'التحكم بالإنفاق' },
    debtClose: { label: 'سداد الدين', description: 'القضاء على الدين' },
  },
  metricOptions: {
    money: { label: 'المال', description: 'الأهداف المالية' },
    number: { label: 'رقم', description: 'قائم على العد' },
    time: { label: 'الوقت', description: 'قائم على الوقت' },
    weight: { label: 'الوزن', description: 'تتبع الوزن' },
    custom: { label: 'مخصص', description: 'مقياسك' },
  },
  deadlinePresets: {
    oneMonth: 'شهر واحد',
    threeMonths: '3 أشهر',
    sixMonths: '6 أشهر',
    oneYear: 'سنة واحدة',
  },
  validation: {
    titleRequired: 'العنوان مطلوب',
    titleTooShort: 'العنوان قصير جداً. كن أكثر تحديداً!',
    targetInvalid: 'يجب أن يكون الهدف رقماً صالحاً',
    targetSameAsCurrent: 'يجب أن يختلف الهدف عن القيمة الحالية',
    budgetRequired: 'اختر أو أنشئ ميزانية لهذا الهدف.',
    debtRequired: 'اربط ديناً لتتبع السداد.',
  },
  buttons: {
    back: 'رجوع',
    next: 'التالي ←',
    createGoal: 'إنشاء الهدف',
    done: 'تم',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TURKISH (TR)
// ─────────────────────────────────────────────────────────────────────────────

const TR: GoalModalContentLocalization = {
  header: {
    createGoal: 'Hedef Oluştur',
    editGoal: 'Hedefi Düzenle',
    close: 'Kapat',
  },
  wizardSteps: {
    what: 'Ne',
    measure: 'Ölçüm',
    when: 'Ne Zaman',
    connect: 'Bağla',
  },
  step1: {
    title: 'Neyi başarmak istiyorsunuz?',
    titlePlaceholder: 'Örn: "Tatil için biriktir", "Maraton koş", "İspanyolca öğren"',
    category: 'Kategori',
    whyImportant: 'Bu neden önemli? (isteğe bağlı)',
    motivationPlaceholder: 'Motivasyonunuz...',
    whyHint: "Net 'neden'i olan hedefler %60 daha başarılı",
  },
  step2: {
    title: 'Nasıl takip edeceksiniz?',
    goalType: 'Hedef Türü',
    currency: 'Para Birimi',
    currencyInherited: 'Para birimi bağlı bütçeden devralındı',
    current: 'Mevcut',
    target: 'Hedef *',
    whatMeasure: 'Ne ölçeceksiniz?',
    unit: 'Birim',
    unitPlaceholderCount: 'antrenman, kitap, km...',
    unitPlaceholderDuration: 'saat, dakika...',
    progressAutoHint: 'İlerleme işlemlerinize göre otomatik güncellenir',
  },
  step3: {
    title: 'Bunu ne zaman başarmak istiyorsunuz?',
    deadline: 'Son Tarih (isteğe bağlı)',
    selectDate: 'Tarih seç',
    deadlineHint: 'Son tarihi olan hedefler %42 daha başarılı',
    quickSelect: 'Hızlı seçim',
    milestones: 'Kilometre taşları (isteğe bağlı)',
    milestonePlaceholder: (index) => `Kilometre taşı ${index}`,
    addMilestone: 'Kilometre taşı ekle',
  },
  step4: {
    title: 'Finansa bağla (isteğe bağlı)',
    subtitle: 'Otomatik takip için bütçe veya borçlara bağlayın',
    livePreview: 'Canlı önizleme',
    budgetBalance: 'Bütçe bakiyesi',
    goalProgress: 'Hedef ilerlemesi',
    debtRemaining: 'Kalan borç',
    linkSavingsBudget: 'Tasarruf bütçesine bağla',
    noBudget: 'Bütçe yok',
    addBudget: 'Bütçe Ekle',
    noBudgetsHint: 'Bütçe yok. Otomatik bağlama için aşağıda oluşturun.',
    whichDebt: 'Hangi borcu ödüyorsunuz?',
    noDebt: 'Borç yok',
    createNewDebt: 'Yeni Borç Oluştur',
    noDebtsHint: 'Aktif borç yok. Finans sekmesinde oluşturun.',
    debtProgressHint: 'Ödeme yaptığınızda ilerleme otomatik güncellenir',
    linkBudgetCategory: 'Bütçe kategorisine bağla',
    nonFinancialHint: 'Finans bağlama yalnızca finansal hedefler için geçerlidir. Alışkanlık ve görevleri daha sonra ekleyebilirsiniz.',
    connectFinance: 'Finansa bağla',
    createBudgetForGoal: 'Bu hedef için bütçe oluştur',
    addContribution: 'Katkı ekle',
  },
  goalTypes: {
    money: 'Para',
    health: 'Sağlık',
    learning: 'Öğrenme',
    career: 'Kariyer',
    personal: 'Kişisel',
  },
  goalExamples: {
    financial: ['$5000 biriktir', 'Borcu öde'],
    health: ['10 kg ver', '5 km koş'],
    education: ['24 kitap oku', "React'i öğren"],
    productivity: ['Terfi al', 'Yan projeyi başlat'],
    personal: ['Günlük meditasyon yap', '5 ülkeye seyahat et'],
  },
  financeModes: {
    save: { label: 'Para biriktir', description: 'Tasarruf oluştur' },
    spend: { label: 'Bütçe limiti', description: 'Harcamayı kontrol et' },
    debtClose: { label: 'Borcu öde', description: 'Borçtan kurtul' },
  },
  metricOptions: {
    money: { label: 'Para', description: 'Finansal hedefler' },
    number: { label: 'Sayı', description: 'Sayı bazlı' },
    time: { label: 'Zaman', description: 'Zaman bazlı' },
    weight: { label: 'Ağırlık', description: 'Ağırlık takibi' },
    custom: { label: 'Özel', description: 'Sizin metriğiniz' },
  },
  deadlinePresets: {
    oneMonth: '1 ay',
    threeMonths: '3 ay',
    sixMonths: '6 ay',
    oneYear: '1 yıl',
  },
  validation: {
    titleRequired: 'Başlık gerekli',
    titleTooShort: 'Başlık çok kısa. Daha spesifik olun!',
    targetInvalid: 'Hedef geçerli bir sayı olmalı',
    targetSameAsCurrent: 'Hedef mevcut değerden farklı olmalı',
    budgetRequired: 'Bu hedef için bir bütçe seçin veya oluşturun.',
    debtRequired: 'Geri ödemeleri takip etmek için bir borç bağlayın.',
  },
  buttons: {
    back: 'Geri',
    next: 'İleri →',
    createGoal: 'Hedef Oluştur',
    done: 'Tamam',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const GOAL_MODAL_CONTENT_LOCALIZATION: Record<SupportedLanguage, GoalModalContentLocalization> = {
  en: EN,
  ru: RU,
  uz: UZ,
  ar: AR,
  tr: TR,
};

export const useGoalModalContentLocalization = () => {
  const { language } = useLocalization();
  return GOAL_MODAL_CONTENT_LOCALIZATION[language] ?? GOAL_MODAL_CONTENT_LOCALIZATION.en;
};
