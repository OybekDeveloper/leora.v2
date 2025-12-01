

---

# 📘 LEORA — личная экосистема развития

*(русская версия)*

## 1. Краткое описание

**Leora** — это личная экосистема развития, которая объединяет:

* цели, задачи и привычки,
* деньги и реальные счета,
* здоровье и физическую активность,
* цифровые привычки (соцсети, экранное время),
* виртуальных и реальных наставников,
* голосового ассистента,

в одном приложении.

Приложение изначально многоязычное:
**узбекский, русский, английский, турецкий, арабский**.

---

## 2. Вдохновение и ценности

Идея Leora опирается на принцип, приписываемый ʿУмару ибн аль-Хаттабу:

> «Рассчитайте себя сами, пока не будете рассчитанными».

Во многих исламских и классических источниках постоянно повторяется мысль:

* жить **системно и планово**,
* быть ответственным за своё время, тело, здоровье, деньги и поступки,
* вести **осознанный самоотчёт**, пока не наступит внешний отчёт.

**Leora** переносит эту идею в цифровую форму:

* помогает человеку видеть реальную картину своей жизни,
* связывает воедино духовное, личное, финансовое и физическое развитие,
* превращает знания в конкретные ежедневные шаги.

Цель проекта — помочь людям по всему миру (не только в Узбекистане) жить более осознанно и системно.

---

## 3. Для кого предназначена Leora

Основные пользователи Leora:

* молодые специалисты, студенты, предприниматели, фрилансеры;
* люди, которые хотят объединить **цели, деньги, здоровье и духовную часть** в одну систему;
* те, кто ценит время и хочет меньше хаоса и больше фокуса.

Типичные проблемы, которые решает Leora:

* цели, задачи, финансы, здоровье и экранное время живут в разных приложениях;
* нет единых еженедельных и ежемесячных **обзоров и самоотчёта**;
* много времени уходит в соцсети, но мало прогресса в реальных целях;
* доступ к настоящим наставникам ограничен и несистемный.

---

## 4. Архитектура продукта: модули Leora

Все модули Leora связаны между собой. Сила системы — именно в этой связности.

### 4.1. Planner: цели, задачи, привычки

**Planner** — это ядро ежедневной жизни пользователя:

* постановка **целей** (финансовых, образовательных, духовных, личных),
* создание **задач** (tasks) с дедлайнами и приоритетами,
* формирование **привычек** (habits):

  * чтение,
  * тренировки,
  * молитвы и другие духовные практики,
  * изучение языков, навыков и т.д.

Поддерживаются:

* прогресс по целям,
* streak’и по привычкам,
* история и архив (delete history / восстановление).

### 4.2. Finance: бюджеты, счета, транзакции

Финансовый модуль позволяет пользователю:

* создавать **реальные счета/кошельки** (мультивалюта: UZS, USD, EUR и др.),
* задавать **бюджеты** по категориям (еда, здоровье, обучение, транспорт и др.),
* фиксировать **транзакции**:

  * доходы,
  * расходы,
  * переводы.

Главная идея — связь:

> Цель → Бюджет → Реальные счета → Транзакции

Примеры:

* Цель: накопить сумму на обучение или путешествие.
* Создаётся связанный бюджет.
* Каждое поступление/расход по этому бюджету отражается на прогрессе цели.

Таким образом, деньги перестают быть абстрактными:
пользователь видит, **как каждая трата или накопление приближает или отдаляет его от целей**.

### 4.3. Insights & AI: дневной, недельный, месячный, годовой отчёт

Leora формирует **четыре уровня инсайтов**:

* **Дневной** — краткий обзор дня:

  * задачи, привычки, шаги, расходы,
  * что получилось хорошо, а что можно улучшить завтра.

* **Недельный** — анализ тенденций:

  * насколько человек продвинулся по главным целям,
  * как распределялось время (работа, соцсети, обучение),
  * как распределялись деньги.

* **Месячный** — общие паттерны:

  * сильные стороны,
  * системы, которые работают,
  * зоны хронического отставания.

* **Годовой** — большая картина:

  * достигнутые цели,
  * изменение финансового состояния,
  * состояние здоровья и привычек,
  * ключевые выводы и фокус на следующий год.

Примеры инсайтов:

* **Мало движения и интерес к деньгам**:

  > “Уровень активности низкий — это риск для здоровья.
  > Ты серьёзно относишься к деньгам: стоит помнить, что регулярная ходьба и питание дешевле, чем долгосрочное лечение. Инвестиция во здоровье — тоже финансовое решение.”

* **Религиозный пользователь, есть habits по молитве**:

  > “Тело и здоровье — аманат. Забота о себе, умеренность в еде, движение и отказ от лишнего — часть ответственности за то, что тебе доверено.”

* **Много времени в Instagram/Telegram**:

  > “Значительная часть дня уходит в социальные сети.
  > Самый ценный ресурс — время.
  > Часть этого времени можно перенаправить в изучение нового языка или навыка, который будет работать на твои цели.”

### 4.4. Здоровье и движение

Leora планирует использовать данные о здоровье:

* шаги и физическую активность (Apple Health / Google Fit / Health Connect),
* базовую статистику активности.

Цель — не превращать приложение в фитнес-трекер, а:

* включить здоровье в общую картину: **“как ты живёшь в целом”**;
* мотивировать к простым, но важным вещам: ходьба, движение, режим.

### 4.5. Цифровые привычки и экранное время

В перспективе Leora будет учитывать:

* сколько времени уходит в соцсети и развлекательные приложения;
* какое место это занимает относительно работы, учёбы, целей.

Инсайты будут мягко напоминать:

* о ценности времени,
* о том, что часть этого времени может быть перенаправлена на развитие.

---

## 5. Голосовой ассистент Leora

Для удобства пользователя в системе предусмотрен **голосовой ассистент**.

Примеры сценариев:

* Пользователь говорит:

  > “Я сегодня не успел сделать тренировку и потратил 50 долларов в ресторане.”

* Голосовой ассистент:

  * распознаёт речь,
  * понимает смысл (пропущенная тренировка + расход денег),
  * автоматически:

    * отмечает **привычку тренировки** как пропущенную или создаёт её, если её ещё нет,
    * создаёт **транзакцию** “ресторан, 50 $” в соответствующем бюджете,
    * при необходимости предлагает:

      * создать/обновить цель (например, “улучшить здоровье” или “уменьшить траты на рестораны”),
      * добавить задачу (например, “запланировать тренировку на завтра”).

После этого пользователю показывается **всплывающее окно (модальное)**:

* с предварительно заполненными данными,
* с возможностью **отредактировать и подтвердить**.

Таким образом:

* действия фиксируются быстро через голос,
* но контроль остаётся за пользователем (ничего не создаётся “навсегда” без подтверждения).

---

## 6. Наставники: виртуальные и реальные

### 6.1. Виртуальные наставники

Виртуальные наставники — это “фигуры-стили”, основанные на данных о реальных мыслителях, предпринимателях и учёных.

Backend собирает и структурирует:

* цитаты,
* принципы,
* истории,
* подход к решениям.

На основе этого и личных данных пользователя (цели, привычки, деньги, экранное время, здоровье) формируются **инсайты в стиле выбранного наставника**.

Принципы работы:

* пользователь выбирает виртуального наставника на **7 дней** (недельный цикл);
* если данных много и активность высокая — возможно **более частое** консультирование;
* если данных мало — минимум **один содержательный инсайт в неделю**.

Виртуальный наставник:

* **видит агрегированные данные Leora** (не сырые, а безопасные сводки),
* даёт советы и мотивацию, но **не подменяет религиозных учёных или врачей**,
* помогает связать поведение за неделю с более высокими принципами и целями.

### 6.2. Реальные наставники

Реальные наставники — это **живые люди**, известные и успешные в своём регионе (например, предприниматели и общественные деятели Узбекистана).

Формат:

* пользователь выбирает наставника из списка (по региону и своим предпочтениям);
* подписка: **1 месяц = 4 письма и 4 ответа** (раз в неделю);
* пользователь пишет развёрнутое письмо раз в неделю,
* наставник отвечает в удобное время (в рамках оговорённых сроков).

Особенности:

* наставник **не видит внутренние данные Leora** (финансы, привычки и т.д.),
  он работает только с тем, что пользователь описал в письме;
* будут заключаться соглашения:

  * если наставник систематически не отвечает — это отражается на его репутации,
  * возможен возврат денег пользователю;
* в наставники приглашаются **только реальные, узнаваемые и успешные люди**, без случайных “инфо-коучей”.

---

## 7. Интеграция с банковскими картами и транзакциями

В перспективе Leora планирует интеграции:

* с международными платёжными системами (Visa, MasterCard и др.),
* с банками и платёжными сервисами.

Цель:

* чтобы **журнал транзакций** (расходы и доходы по карте) автоматически подтягивался в Leora;
* чтобы бюджеты и цели автоматически обновлялись на основе реальных расходов;
* чтобы пользователю не нужно было вручную заносить каждую покупку.

При этом особое внимание будет уделяться:

* безопасности,
* шифрованию,
* соблюдению требований банков и платёжных систем.

---

## 8. Бизнес-модель (базово)

Планируется несколько уровней монетизации:

1. **Базовая подписка без расширенного ИИ**

   * ориентировочно около **$1 в месяц**;
   * доступ к Planner, Finance, базовым отчётам.

2. **Подписка с расширенным ИИ и виртуальными наставниками**

   * ориентировочно около **$9 в месяц**;
   * расширенные инсайты, глубокий анализ поведения, стиль виртуальных наставников.

3. **Реальные наставники**

   * наставник назначает свою цену за месяц (4 письма/4 ответа);
   * Leora может получать комиссию за инфраструктуру и платформу.

---

## 9. Техническое видение (кратко)

* **Клиент**: React Native (Expo) + отдельные экраны на SwiftUI под iOS.

* **Backend**: современный стек (например, Go), ориентированный на микросервисы и масштабируемость.

* **Данные**:

  * локальные хранилища для офлайн-режима,
  * серверная база для аналитики и ИИ.

* **Интеграции**:

  * Apple Health / HealthKit,
  * Google Fit / Health Connect,
  * Screen Time API (где это допустимо и одобрено),
  * банковские и платёжные сервисы.

* **Безопасность и приватность**:

  * GPT и другие ИИ-модели получают **только агрегированные snapshot’ы**,
  * без лишних персональных деталей;
  * пользователь может контролировать, чем делиться.

---

## 10. Дальнейшее развитие (roadmap по крупным шагам)

1. **Этап 1**

   * Planner + Finance + базовые дневные/недельные отчёты.

2. **Этап 2**

   * Интеграция с Apple Health / Google Fit,
   * простые подсказки по здоровью и движению,
   * учёт экранного времени (где возможно).

3. **Этап 3**

   * Виртуальные наставники,
   * расширенные инсайты,
   * голосовой ассистент, который умеет создавать задачи/привычки/транзакции по голосу.

4. **Этап 4**

   * Реальные наставники,
   * подключение известных менторов по регионам,
   * интеграция с международными картами и банками,
   * масштабирование на новые страны и языки.

---

## 11. Заключение

**Leora** — это попытка собрать в одной системе то, что обычно разорвано:

* цели,
* деньги,
* здоровье,
* время,
* наставников,
* и честный самоотчёт.

Проект соединяет технологию (ИИ, интеграции, голос)
с классическими принципами мудрости:
жить системно, считать себя, не терять время, заботиться о доверенном аманате — теле, разуме, ресурсах.

---

---

# 📘 LEORA — shaxsiy rivojlanish ekotizimi

*(o‘zbekcha versiya, lotin alifbosi)*

## 1. Qisqa ta’rif

**Leora** — bu shaxsiy rivojlanish ekotizimi bo‘lib, u quyidagilarni birlashtiradi:

* maqsadlar, vazifalar va odatlar,
* pul va real hisoblar,
* sog‘liq va jismoniy faollik,
* raqamli odatlar (ijtimoiy tarmoqlar, ekran vaqti),
* virtual va real mentorlar,
* ovozli yordamchi

— bularning barchasini **bitta ilovada** jamlaydi.

Ilova boshidan ko‘p tilli:
**o‘zbek, rus, ingliz, turk va arab tillarida** ishlaydi.

---

## 2. Ilhom va qadriyatlar

Leora g‘oyasi Umar ibn al-Xattobga nisbat beriladigan mashhur tamoyilga tayangan:

> “Hisob-kitob qilinmasdan turib, o‘zingizni hisobotga tuting”.

Islom ulamolari va klassik donishmandlar ko‘p bor ta’kidlagan:

* hayotni **tizimli va rejali yashash**,
* vaqt, tana, sog‘liq, mol-mulk va amallar uchun mas’uliyat,
* tashqi hisob kelishidan oldin **o‘z-o‘zingni hisobga tutish**.

**Leora** bu g‘oyani raqamli shaklga olib chiqadi:

* insonga o‘z hayotining haqiqiy manzarasini ko‘rsatadi,
* ma’naviy, shaxsiy, moliyaviy va jismoniy rivojlanishni birlashtiradi,
* bilib qo‘yilgan narsa emas, **har kungi amaliy qadamlarga** aylantiradi.

Loyihaning maqsadi — faqat O‘zbekiston emas, balki butun dunyodagi odamlarga
yanada ongli va tizimli hayot kechirishga yordam berish.

---

## 3. Leora kimlar uchun?

Asosiy foydalanuvchilar:

* yosh mutaxassislar, talabalar, tadbirkorlar, frilanserlar,
* maqsad, pul, sog‘liq va ma’naviy tomonni **bitta tizimda** boshqarishni xohlaydiganlar,
* vaqtni qadrlaydigan va tartibsizlikdan charchagan, ko‘proq fokus xohlaydiganlar.

Leora hal qiladigan muammolar:

* maqsadlar, vazifalar, moliya, sog‘liq va ekran vaqti **turli ilovalarda alohida yashaydi**;
* haftalik va oylik **o‘z-o‘zini tahlil qilish odati yo‘q**;
* ko‘p vaqt ijtimoiy tarmoqlarga ketadi, lekin muhim maqsadlarga kam yuriladi;
* haqiqiy mentorlar bor, lekin ularga **kirish tartibli va tizimli emas**.

---

## 4. Mahsulot arxitekturasi: Leora modullari

Leoraning barcha modullari o‘zaro bog‘langan. Kuch ham aynan mana shu bog‘liqlikda.

### 4.1. Planner: maqsadlar, vazifalar, odatlar

**Planner** — foydalanuvchining kundalik hayotidagi “markaziy boshqaruv”:

* **uzoq muddatli maqsadlar** qo‘yish (moliyaviy, ta’lim, ma’naviy, shaxsiy),
* **vazifalar** (task) yaratish – muddat, ustuvorlik bilan,
* **odatlar** (habit) qurish:

  * kitob o‘qish,
  * mashq va treninglar,
  * namoz/qiroat va boshqa ma’naviy amallar,
  * til o‘rganish, skill’lar va hokazo.

Qo‘llab-quvvatlaydi:

* maqsadlar bo‘yicha **progress**,
* odatlar bo‘yicha **streak** va foizlar,
* tarix va arxiv (delete history / tiklash).

### 4.2. Finance: byudjetlar, hisoblar, tranzaksiyalar

Moliya moduli foydalanuvchiga quyidagilarni beradi:

* **real hisoblar/hamyonlar** yaratish (turli valyutalarda),
* turli kategoriyalar uchun **byudjetlar** belgilash (ovqat, sog‘liq, ta’lim, transport va hokazo),
* **tranzaksiyalarni** qayd etish:

  * daromadlar,
  * xarajatlar,
  * o‘tkazmalar.

Asosiy g‘oya — bog‘liqlik:

> Maqsad → Byudjet → Real hisoblar → Tranzaksiyalar

Masalan:

* Maqsad: ta’lim yoki safarga ma’lum summani yig‘ish.
* Shunga mos **byudjet** ochiladi.
* Shu byudjet bo‘yicha har bir tushum/xarajat maqsad progressiga ta’sir qiladi.

Natijada pul shunchaki raqam emas,
foydalanuvchi **har bir harakat uni maqsadiga yaqinlashtirayotganini yoki uzoqlashtirayotganini** tushunadi.

### 4.3. Insights & AI: kunlik, haftalik, oylik, yillik hisobot

Leora **to‘rtta darajada** tahlil va insight beradi:

* **Kunlik** — kun qanday o‘tdi:

  * qaysi vazifalar bajarildi,
  * qaysi odatlar bajarildi yoki o‘tkazib yuborildi,
  * qancha yurding, qancha sarflading,
  * ertaga nimaga e’tibor berish kerak.

* **Haftalik** — tendensiyalar:

  * asosiy maqsadlarga qay darajada yaqinlashding,
  * vaqt qanday taqsimlandi (ish, ijtimoiy tarmoq, o‘qish),
  * pul qayerlarga ko‘proq ketdi.

* **Oylik** — umumiy naqsh:

  * kuchli tomonlar,
  * ishlayotgandek ko‘rinayotgan tizimlar,
  * doimiy orqada qolayotgan joylar.

* **Yillik** — katta manzara:

  * qaysi maqsadlar bajarildi,
  * moliyaviy holat qanday o‘zgardi,
  * sog‘liq va odatlar qay tarzda o‘zgardi,
  * kelasi yil uchun asosiy xulosalar va ustuvor yo‘nalishlar.

Insight misollari:

* **Kam harakat + pulni yaxshi ko‘radigan foydalanuvchi**:

  > “Jismoniy faollik past — bu sog‘liq uchun xavf.
  > Siz pulga jiddiy qaraysiz: uzoq muddatda muntazam yurish va normal ovqatlanish,
  > qimmat davolanishdan arzonroq bo‘ladi. Sog‘liqqa vaqt ajratish — moliyaviy qaror ham.”

* **Diniy foydalanuvchi, namoz/zikr habitlari bor**:

  > “Tana va sog‘liq — sizga berilgan amanat. O‘zingizga g‘amxo‘rlik qilish, haddan tashqari isrofdan qochish, harakat va tartib — mas’uliyatning bir qismidir.”

* **Ko‘p vaqt Instagram/Telegram’da**:

  > “Kunning katta qismi ijtimoiy tarmoqlarda o‘tmoqda.
  > Eng qimmat narsa — vaqt.
  > Shu vaqtdan bir qismini yangi til yoki skill o‘rganishga yo‘naltirish mumkin, bu esa maqsadlaringizga bevosita xizmat qiladi.”

### 4.4. Sog‘liq va harakat

Leora sog‘liq bo‘yicha ma’lumotlardan ham foydalanishni rejalashtiradi:

* kunlik qadamlar va jismoniy faollik (Apple Health, Google Fit va hokazo),
* asosiy aktivlik statistikasi.

Maqsad — ilovani fitnes-trekkerga aylantirish emas, balki:

* sog‘liqni umumiy hayot kartinasiga qo‘shish: **“umuman qanday yashayapsiz?”**,
* foydalanuvchini sodda, lekin muhim odatlarga undash: yurish, harakat, tartib.

### 4.5. Raqamli odatlar va ekran vaqti

Kelajakda Leora:

* ijtimoiy tarmoqlar va o‘yin/ko‘ngilochar ilovalarda qancha vaqt ketayotganini,
* bu vaqt umumiy kun ichida qanday ulushga ega ekanini hisobga olishi mumkin.

Insightlar muloyim tarzda eslatadi:

* vaqt qadri haqida,
* bu vaqtdan bir qismini ta’lim va rivojlanishga yo‘naltirish zarurati haqida.

---

## 5. Leora ovozli yordamchisi

Foydalanuvchi qulayligi uchun tizimda **ovozli assistent** ko‘zda tutilgan.

Ssenariy misoli:

* Foydalanuvchi shunday deydi:

  > “Bugun treningga ulgurmadim, restoranga 50 dollar sarfladim.”

* Ovozli assistent:

  * nutqni tanib oladi,
  * ma’noni tushunadi (o‘tkazib yuborilgan trening + xarajat),
  * avtomatik ravishda:

    * **trening odatini** “o‘tkazib yuborildi” deb belgilaydi yoki bunday habit bo‘lmasa — yaratadi,
    * “restoran, 50 $” uchun **tranzaksiyani** tegishli byudjetga qo‘shadi,
    * zarur bo‘lsa, taklif qiladi:

      * maqsad (masalan, sog‘liqni yaxshilash yoki “restoran xarajatlarini kamaytirish”) yaratish/yangi shakllantirish,
      * ertangi kun uchun vazifa qo‘shish (“ertaga soat 19:00 da trening rejalashtirish”).

Shundan so‘ng foydalanuvchiga **modall oynacha (pop-up)** chiqadi:

* ma’lumotlar oldindan to‘ldirilgan,
* foydalanuvchi **o‘zgartirib yoki tasdiqlab** qo‘yadi.

Natijada:

* ma’lumotlarni kiritish ovoz orqali juda tez bo‘ladi,
* lekin oxirgi nazorat foydalanuvchida qoladi — hech narsa “so‘zsiz” saqlanmaydi.

---

## 6. Mentorlar: virtual va real

### 6.1. Virtual mentorlar

Virtual mentorlar — bu ma’lum shaxslar uslubi asosidagi “maslahatchi obrazlari”:

* yirik tadbirkorlar va vizionerlar (masalan, “Ilon Mask tipidagi fikrlash”),
* donishmandlar va faylasuflar (masalan, stoiklar — Mark Avreliy uslubi),
* klassik ulamolar va olimlar (isan, fikr va prinsiplari asosida; aniq fatvo o‘rnini bosmaydi).

Backend:

* bu shaxslarga oid:

  * iqtiboslar,
  * hayotiy voqealar,
  * qaror qabul qilish uslubi,
  * asosiy tamoyillarni
    tuzilgan ma’lumotlar bazasiga jamlaydi.

Shundan so‘ng, foydalanuvchi haqidagi agregat ma’lumotlar (maqsadlar, odatlar, pul, ekran vaqti, sog‘liq) bilan birga
shu “profil” asosida **mentor uslubida insight va maslahatlar** yaratiladi.

Ishlash tartibi:

* foydalanuvchi virtual mentorni **7 kunlik sikl** uchun tanlaydi;
* agar foydalanuvchi ilovadan ko‘p foydalansa, ma’lumoti boy bo‘lsa — mentor **ko‘proq va aniqroq** maslahat bera oladi;
* agar ma’lumot kam bo‘lsa — kamida **haftasiga 1 marta** mazmunli tavsiya.

Virtual mentor:

* Leora’dan **faqat agregatsiyalangan va xavfsiz snapshot** ma’lumotlarni ko‘radi,
* maslahat va motivatsiya beradi, lekin **shifokor yoki mufti o‘rnini bosmaydi**,
* foydalanuvchining haftalik xatti-harakatlarini yuqori darajadagi tamoyillar bilan bog‘lab beradi.

### 6.2. Real mentorlar

Real mentorlar — bu **haqiqiy, tanilgan va muvaffaqiyatli insonlar** (masalan, O‘zbekiston tadbirkorlari, jamoat arboblari).

Format:

* foydalanuvchi region bo‘yicha va o‘z didi bo‘yicha mentor tanlaydi;
* obuna: **1 oy = 4 ta xat va 4 ta javob** (haftasiga bittadan);
* foydalanuvchi har hafta **batafsil xat** yozadi,
* mentor o‘z vaqtida (oldindan kelishilgan muddat ichida) javob qaytaradi.

Asosiy tamoyillar:

* mentor **Leora ichidagi shaxsiy ma’lumotlarni ko‘rmaydi** (hisoblar, tranzaksiyalar, odatlar va h.k.);
  u faqat foydalanuvchi xatida yozilgan ma’lumot bilan ishlaydi;
* kelishuv va shartnoma bo‘ladi:

  * mentor javob bermasa yoki ko‘p kechiksa — bu uning obro‘siga ta’sir qiladi,
  * foydalanuvchiga pulni qaytarish mexanizmi ishlashi mumkin;
* mentor sifatida **faqat tanilgan va natijaga ega insonlar** taklif qilinadi, tasodifiy “info-kouchlar” emas.

---

## 7. Kartalar va tranzaksiyalar integratsiyasi

Kelajakda Leora:

* Visa, MasterCard kabi **xalqaro to‘lov tizimlari**,
* bank va to‘lov xizmatlari bilan integratsiya qilishni rejalashtiradi.

Maqsad:

* bank kartasidan tushgan **tranzaksiya jurnali** avtomatik ravishda Leora’ga kelib tushishi;
* byudjetlar va maqsadlar **real xarajatlar asosida** avtomatik yangilanib borishi;
* foydalanuvchi har bir xarajatni qo‘lda kiritib o‘tirishiga hojat qolmasligi.

Bunda alohida e’tibor:

* xavfsizlik,
* ma’lumotlarni shifrlash,
* bank va to‘lov tizimlari talablariga rioya qilishga qaratiladi.

---

## 8. Biznes modeli (asosiy g‘oya)

Rejalashtirilayotgan monetizatsiya darajalari:

1. **Asosiy obuna (kengaytirilmagan AI bilan)**

   * taxminan **oyiga 1 dollar** atrofida;
   * Planner, Finance, oddiy hisobotlar va asosiy funksiyalar.

2. **Kengaytirilgan AI va virtual mentorlar bilan obuna**

   * taxminan **oyiga 9 dollar** atrofida;
   * chuqur insightlar, haftalik/oylik analiz, mentor uslubidagi tavsiyalar.

3. **Real mentorlar**

   * mentor oyiga 4 xat/4 javob uchun o‘z narxini belgilaydi;
   * Leora platforma va infratuzilma uchun komissiya olishi mumkin.

---

## 9. Texnik qarash (qisqacha)

* **Mijoz (client)**: React Native (Expo) + iOS uchun ayrim ekranlar SwiftUI’da.

* **Backend**: zamonaviy stek (masalan, Go), mikroxizmatlar va masshtablashga tayyor.

* **Ma’lumotlar**:

  * oflayn rejim uchun lokal saqlash,
  * tahlil va AI uchun server bazalari.

* **Integratsiyalar**:

  * Apple Health / HealthKit,
  * Google Fit / Health Connect,
  * Screen Time API (Apple ruxsat bergan chegaralarda),
  * bank va to‘lov xizmatlari.

* **Xavfsizlik va maxfiylik**:

  * GPT va boshqa AI modellarga faqat **agregatsiyalangan snapshot** yuboriladi,
  * ortiqcha shaxsiy tafsilotlar oshkor qilinmaydi;
  * foydalanuvchi qaysi ma’lumot bilan bo‘lishishini nazorat qila oladi.

---

## 10. Rivojlanish bosqichlari (yirik roadmap)

1. **1-bosqich**

   * Planner + Finance,
   * kunlik/haftalik oddiy hisobotlar.

2. **2-bosqich**

   * Apple Health / Google Fit bilan integratsiya,
   * sog‘liq va harakat bo‘yicha sodda tavsiyalar,
   * ekran vaqti ma’lumotlarini qo‘shish (imkon darajasida).

3. **3-bosqich**

   * virtual mentorlar,
   * kengaytirilgan insightlar,
   * ovozli yordamchi: ovoz orqali task/habit/tranzaksiya yaratish.

4. **4-bosqich**

   * real mentorlar xizmatini ishga tushirish,
   * mashhur mentorlarni platformaga jalb qilish,
   * xalqaro kartalar va banklar bilan integratsiya,
   * yangi mamlakatlar va tillarga kengayish.

---

## 11. Xulosa

**Leora** — bu odatda bo‘lak-bo‘lak bo‘lib ketgan narsalarni bitta tizimga yig‘ishga urinish:

* maqsadlar,
* pul,
* sog‘liq,
* vaqt,
* mentorlar,
* va halol o‘z-o‘zini hisobga tutish.

Loyiha texnologiyani (AI, integratsiyalar, ovozli boshqaruv)
ko‘p asrlik donishmandlik tamoyillari bilan uyg‘unlashtirishga harakat qiladi:

* tizimli yashash,
* o‘zingni hisobga tutish,
* vaqtni isrof qilmaslik,
* senga ishonib topshirilgan amanat — tanang, aqling va resurslaringga g‘amxo‘rlik qilish.
