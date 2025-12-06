# Modals Analysis - ScrollView, FlatList, FlashList, SafeArea

Bu hujjat `app/(modals)` va `src/components/modals` papkalaridagi barcha modallarni tahlil qiladi.

---

## 1. FlashList Ishlatilgan Fayllar (Tayyor)

| Fayl | Turi | Soni |
|------|------|------|
| `app/(modals)/finance/add-account.tsx` | Horizontal | 3 ta |
| `app/(modals)/finance/debt.tsx` | Horizontal | 3 ta |
| `app/(modals)/finance/budget-add-value.tsx` | Horizontal | 1 ta |
| `app/(modals)/menage-widget.tsx` | Horizontal + Vertical | 3 ta |
| `app/(modals)/notifications.tsx` | Vertical | 1 ta |
| `app/(modals)/search.tsx` | Vertical | 1 ta |
| `app/(modals)/finance-search.tsx` | Vertical | 1 ta |

---

## 2. ScrollView bilan .map() Ishlatilgan Fayllar (Migration Kerak)

### Finance Modals

| Fayl | Qatorlar | Tavsif |
|------|----------|--------|
| `finance-filter.tsx` | 214, 252, 295 | 3 ta options.map() - typeOptions, categoryOptions, accountOptions |
| `finance/transaction-filter.tsx` | 221, 259, 302 | 3 ta options.map() - typeOptions, categoryOptions, accountOptions |
| `finance/account-filter.tsx` | 100, 130 | CURRENCIES.map(), accounts.map() |
| `finance/transaction-monitor.tsx` | 201, 236, 297 | accounts.map(), types.map(), transactions.map() |
| `finance/budget.tsx` | 403, 425, 479 | accounts.map(), periods.map(), categories.map() |
| `finance/quick-exp.tsx` | 594 | categories.map() |
| `finance/fx-override.tsx` | 281, 360, 542 | providers.map(), currencies.map(), rates.map() |
| `finance/debt-actions.tsx` | 337 | quickOptions.map() |
| `finance/debt-detail.tsx` | 439 | payments.map() |

### Planner Modals

| Fayl | Qatorlar | Tavsif |
|------|----------|--------|
| `planner/task.tsx` | 484, 518, 644, 659, 928 | goals.map(), dates.map(), levels.map(), subtasks.map() |
| `planner/goal-details.tsx` | 670, 848, 908, 933, 967, 1073, 1138 | steps.map(), milestones.map(), tasks.map(), habits.map(), history.map() |

### Boshqa Modals

| Fayl | Qatorlar | Tavsif |
|------|----------|--------|
| `finance-currency.tsx` | 68, 97 | currencies.map() x2 |
| `finance-stats.tsx` | 111 | stats.map() |
| `calendar.tsx` | 170, 172, 213, 231 | weeks.map(), days.map(), tasks.map() |
| `voice-ai.tsx` | 1029, 1109, 1119, 1131 | recordings.map(), requests.map(), commands.map(), logs.map() |
| `voice-new.tsx` | 927, 971 | requests.map(), recordings.map() |
| `focus/settings.tsx` | 226, 307, 324 | techniques.map(), lockOptions.map(), motivations.map() |
| `lock.tsx` | 469, 472, 474, 571 | circles.map(), keypad.map(), contacts.map() |

---

## 3. SafeArea Muammolari

### Bottom Buttons SafeArea Tashqarisida (Muammo)

Quyidagi fayllarda `actionButtons`/`footerButtons` SafeAreaView ichida, lekin `edges` da `'bottom'` yo'q:

| Fayl | Muammo | Yechim |
|------|--------|--------|
| `finance/add-account.tsx` | ✅ `edges={['top']}` + `insets.bottom` | To'g'ri |
| `finance/budget.tsx` | ⚠️ `edges={['bottom','top']}` lekin buttons ichida | Tekshirish kerak |
| `finance/transaction.tsx` | ✅ `edges={['bottom','top']}` | To'g'ri |
| `finance/debt.tsx` | ✅ `edges={['bottom','top']}` | To'g'ri |
| `planner/task.tsx` | ✅ `edges={['bottom','top']}` | To'g'ri |
| `focus/settings.tsx` | ✅ `edges={['bottom','top']}` | To'g'ri |
| `finance/quick-exp.tsx` | ⚠️ Tekshirish kerak | - |
| `finance/budget-detail.tsx` | ⚠️ Tekshirish kerak | - |

### Faqat Top Edge Ishlatilgan (Potensial Muammo)

| Fayl | edges | Bottom Buttons? |
|------|-------|-----------------|
| `menage-widget.tsx` | `['top']` | Yo'q |
| `finance-currency.tsx` | `['bottom']` | Yo'q |
| `finance-export.tsx` | `['bottom']` | Yo'q |
| `finance-stats.tsx` | `['bottom']` | Yo'q |
| `change-password.tsx` | `['bottom']` | Bor - muammo |
| `forgot-passcode.tsx` | `['bottom']` | Bor - muammo |
| `finance-search.tsx` | `['bottom']` | Yo'q |
| `voice-new.tsx` | `['top']` | Yo'q |

---

## 4. src/components/modals Tahlili

### ScrollView bilan .map() Ishlatilgan

| Fayl | Qatorlar | Tavsif |
|------|----------|--------|
| `FilterTransactionSheet.tsx` | 298, 500 | categoryOptions.map(), options.map() |
| `planner/TaskComponent.tsx` | 103 | ScrollView ichida content |
| `planner/GoalModalContent.tsx` | 900, 985, 1039, 1091, 1176 | milestones.map(), budgets.map(), debts.map() |
| `planner/HabitComponent.tsx` | 243, 250, 624, 892, 932, 968, 1086, 1130, 1166, 1213 | days.map(), habits.map(), types.map(), goals.map(), rules.map() |
| `DateChangeModal.tsx` | 224, 265, 395, 403, 405 | months.map(), years.map(), weeks.map(), days.map() |
| `StepIndicator.tsx` | 23, 47 | steps.map() x2 |
| `BottomSheet.tsx` | 89, 206 | snapPoints.map(), BottomSheetScrollView |

---

## 5. Xulosa va Tavsiyalar

### Migration Priority (Yuqori → Past)

#### P0 - Kritik (Katta listlar)
1. `finance/transaction-monitor.tsx` - transactions list
2. `finance/fx-override.tsx` - rates list
3. `planner/goal-details.tsx` - history, tasks, habits
4. `voice-ai.tsx` - recordings, logs

#### P1 - O'rta (O'rta o'lchamdagi listlar)
1. `finance-filter.tsx` - 3 ta filter list
2. `finance/transaction-filter.tsx` - 3 ta filter list
3. `finance/budget.tsx` - accounts, periods, categories
4. `planner/task.tsx` - goals, subtasks
5. `focus/settings.tsx` - techniques, options

#### P2 - Past (Kichik listlar)
1. `finance-currency.tsx` - currencies (8-10 ta)
2. `finance-stats.tsx` - stats (3-5 ta)
3. `calendar.tsx` - weeks/days (7x6 = 42 ta)
4. `lock.tsx` - keypad (12 ta)

#### Exception (O'zgartirish shart emas)
1. `src/components/ui/Table.tsx` - Generic UI, kichik data
2. `StepIndicator.tsx` - 2-4 ta step
3. `DateChangeModal.tsx` - Calendar grid (static)

---

## 6. SafeArea Best Practices

### To'g'ri Pattern
```tsx
// Footer buttons SafeArea ichida
<SafeAreaView edges={['top', 'bottom']}>
  <ScrollView>...</ScrollView>
  <View style={styles.footerButtons}>
    <Button>Cancel</Button>
    <Button>Save</Button>
  </View>
</SafeAreaView>

// Yoki insets bilan
const insets = useSafeAreaInsets();
<SafeAreaView edges={['top']}>
  <ScrollView>...</ScrollView>
  <View style={[styles.footerButtons, { paddingBottom: Math.max(insets.bottom, 16) }]}>
    ...
  </View>
</SafeAreaView>
```

### Noto'g'ri Pattern
```tsx
// Footer SafeArea tashqarisida - NOTO'G'RI
<SafeAreaView edges={['top']}>
  <ScrollView>...</ScrollView>
</SafeAreaView>
<View style={styles.footerButtons}>  {/* SafeArea tashqarida! */}
  ...
</View>
```

---

## 7. Button Tartibi

### To'g'ri Tartib
- **Chapda:** Cancel/Secondary button
- **O'ngda:** Save/Primary button

### Tekshirish Kerak Bo'lgan Fayllar
Barcha `actionButtons`/`footerButtons` ichidagi button tartibini tekshirish kerak.
