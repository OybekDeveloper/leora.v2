
```
# BUDGET TIZIMI YECHIM PROMPTI

## MUAMMO KONTEKSTI

Men iOS finance app yaratyapman (SwiftUI + SwiftData). Budget tizimida quyidagi muammo bor:

### Hozirgi Holat (MUAMMO):
- Budget yaratilganda kategoriya tanlanadi (masalan: Food)
- Lekin Food kategoriyasiga tegishli transaction'lar budget.spent ni o'zgartirmayapti
- Transfer qilinganda ham budget yangilanmayapti
- Hech qanday kategoriyaga oid o'zgarish budget'ga ta'sir qilmayapti

### Kutilgan Xatti-harakat:
1. Transaction (expense) + Food kategoriyasi → Food Budget.spent += transaction.amount
2. Transfer + Food kategoriyasi → Food Budget.spent += transfer.amount  
3. Transaction o'chirilganda → Budget.spent qayta hisoblanadi
4. Real-time sync bo'lishi kerak

### Savings Goal (Jamg'arma) Talablari:
- Qo'lda qiymat qo'shish imkoniyati
- Transfer orqali qiymat qo'shish
- Goal, Habit, Task bajarilganda avtomatik qiymat qo'shish
- Progress tracking

---

## LOYIHA STRUKTURASI

```
FinanceApp/
├── Models/
│   ├── Budget.swift
│   ├── Transaction.swift
│   ├── Transfer.swift
│   ├── Category.swift
│   ├── Account.swift
│   └── SavingsGoal.swift
├── Services/
│   ├── TransactionService.swift
│   ├── TransferService.swift
│   ├── BudgetService.swift (YARATISH KERAK)
│   └── SavingsGoalService.swift (YARATISH KERAK)
├── Views/
│   ├── BudgetListView.swift
│   ├── AddTransactionView.swift
│   └── TransferView.swift
└── App/
    └── FinanceApp.swift
```

---

## TALABLAR

### 1. BudgetService Yaratish
- Transaction qo'shilganda tegishli budget'ni yangilash
- Transfer qo'shilganda tegishli budget'ni yangilash
- Transaction/Transfer o'chirilganda budget'ni qayta hisoblash
- Budget period (daily/weekly/monthly/yearly) ni hisobga olish
- Barcha budget'larni qayta hisoblash funksiyasi

### 2. TransactionService Yangilash
- Transaction yaratilganda BudgetService.updateBudgetForTransaction() chaqirish
- Transaction o'chirilganda BudgetService.removeTransactionFromBudget() chaqirish

### 3. TransferService Yangilash
- Transfer yaratilganda agar categoryId bor bo'lsa budget'ni yangilash
- Transfer o'chirilganda budget'ni qayta hisoblash

### 4. Transfer Model Yangilash
- categoryId: String? property qo'shish
- savingsGoalId: String? property qo'shish

### 5. SavingsGoalService Yaratish
- addValue(to goal:, amount:) - qo'lda qiymat qo'shish
- addValueFromTransfer(to goal:, transfer:) - transfer orqali
- addValueFromGoal(to savingsGoal:, goal:, amount:) - goal bajarilganda
- addValueFromHabit(to savingsGoal:, habit:, amount:) - habit bajarilganda
- addValueFromTask(to savingsGoal:, task:, amount:) - task bajarilganda
- progressPercentage(for goal:) -> Double

### 6. SavingsEntry Model Yaratish
- Har bir qiymat qo'shish tarixini saqlash
- type: manual/transfer/goalReward/habitReward/taskReward

---

## MODEL DEFINITSIYALARI

### Budget Model (Yangilangan)
```swift
@Model
class Budget {
    @Attribute(.unique) var id: String
    var name: String
    var amount: Double // Reja
    var spent: Double // Sarflangan (AVTOMATIK)
    var categoryId: String
    var period: BudgetPeriod
    var startDate: Date
    var endDate: Date?
    var isActive: Bool
    
    // Computed
    var remaining: Double { amount - spent }
    var percentageUsed: Double { (spent / amount) * 100 }
    var isOverBudget: Bool { spent > amount }
}
```

### Transfer Model (Yangilangan)
```swift
@Model
class Transfer {
    @Attribute(.unique) var id: String
    var amount: Double
    var fromAccountId: String
    var toAccountId: String
    var categoryId: String? // YANGI
    var savingsGoalId: String? // YANGI
    var note: String?
    var date: Date
}
```

### SavingsGoal Model
```swift
@Model
class SavingsGoal {
    @Attribute(.unique) var id: String
    var name: String
    var targetAmount: Double
    var currentAmount: Double
    var categoryId: String?
    var deadline: Date?
    var linkedGoalId: String?
    var linkedHabitIds: [String]?
    var linkedTaskIds: [String]?
    var isCompleted: Bool
    var completedDate: Date?
}
```

---

## ASOSIY LOGIKA

### Budget Yangilash Algoritmi:
```
1. Transaction/Transfer categoryId olish
2. Ushbu categoryId ga tegishli Budget'larni topish
3. Har bir budget uchun:
   a. Budget period'ini aniqlash (start/end dates)
   b. Transaction/Transfer shu period ichida ekanligini tekshirish
   c. Agar ichida bo'lsa:
      - Barcha tegishli expense'larni olish
      - Barcha tegishli transfer'larni olish
      - Jami summa = expenses + transfers
      - budget.spent = jami summa
4. modelContext.save()
```

### Savings Goal Logikasi:
```
1. Qo'lda qiymat qo'shish:
   - goal.currentAmount += amount
   - SavingsEntry yaratish (type: manual)
   
2. Transfer orqali:
   - goal.currentAmount += transfer.amount
   - SavingsEntry yaratish (type: transfer)
   
3. Goal/Habit/Task reward:
   - goal.currentAmount += reward
   - SavingsEntry yaratish (type: goalReward/habitReward/taskReward)
   
4. Completion check:
   - if currentAmount >= targetAmount && !isCompleted
   - isCompleted = true
   - Send notification
```

---

## VAZIFALAR RO'YXATI

□ 1. BudgetService.swift yaratish
  □ updateBudgetForTransaction()
  □ removeTransactionFromBudget()
  □ updateBudgetForTransfer()
  □ updateBudgetSpent()
  □ getBudgetPeriodDates()
  □ recalculateAllBudgets()

□ 2. TransactionService.swift yangilash
  □ createTransaction() da budget yangilash
  □ deleteTransaction() da budget yangilash
  □ updateTransaction() da budget yangilash

□ 3. TransferService.swift yangilash
  □ createTransfer() da budget yangilash
  □ deleteTransfer() da budget yangilash

□ 4. Transfer.swift yangilash
  □ categoryId property qo'shish
  □ savingsGoalId property qo'shish

□ 5. SavingsGoalService.swift yaratish
  □ addValue()
  □ addValueFromTransfer()
  □ addValueFromGoal()
  □ addValueFromHabit()
  □ addValueFromTask()
  □ progressPercentage()

□ 6. SavingsEntry.swift yaratish
  □ Model definition
  □ SavingsEntryType enum

□ 7. UI yangilash
  □ BudgetListView da recalculate chaqirish
  □ Progress view'lar

□ 8. Test'lar yozish

---

## ROLLBACK INSTRUKSIYALARI

Agar muammo bo'lsa quyidagilarni o'chiring/qaytaring:

1. BudgetService.swift - o'chirish
2. TransactionService.swift - budgetService chaqiruvlarini o'chirish
3. TransferService.swift - budgetService chaqiruvlarini o'chirish
4. Transfer.swift - categoryId, savingsGoalId o'chirish
5. SavingsGoalService.swift - o'chirish
6. SavingsEntry.swift - o'chirish

Git bilan:
- git reset --hard HEAD~1
- yoki git checkout HEAD~1 -- path/to/file.swift

---

## MUHIM ESLATMALAR

1. @Observable makrosidan foydalaning
2. Har doim try? modelContext.save() chaqiring
3. #Predicate to'g'ri ishlashini tekshiring
4. Unit test'lar yozing
5. Memory leak'larga e'tibor bering
6. Background thread'da og'ir hisob-kitoblarni bajaring

---

ENDI LOYIHAMNI TAHLIL QIL VA YUQORIDAGI TALABLARGA ASOSAN KOD YOZ.
```
