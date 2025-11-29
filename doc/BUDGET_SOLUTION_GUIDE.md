# 💰 Budget Tizimi To'liq Yechim Hujjati

## 📋 Mundarija
1. [Muammo Tavsifi](#muammo-tavsifi)
2. [Arxitektura Tahlili](#arxitektura-tahlili)
3. [Yechim Rejasi](#yechim-rejasi)
4. [Kod O'zgarishlari](#kod-ozgarishlari)
5. [Orqaga Qaytarish (Rollback)](#orqaga-qaytarish)

---

## 🔴 Muammo Tavsifi

### Hozirgi Vaziyat
- Budget yaratilganda kategoriya tanlanadi
- Lekin ushbu kategoriyaga tegishli transaction'lar budget'ni o'zgartirmayapti
- Transfer'lar ham budget'ga ta'sir qilmayapti

### Kutilgan Xatti-harakat
```
Transaction (Food kategoriyasi) → Budget (Food) avtomatik yangilanadi
Transfer (Food kategoriyasiga) → Budget (Food) avtomatik yangilanadi
Income (Food kategoriyasi) → Budget (Food) avtomatik yangilanadi
```

---

## 🏗️ Arxitektura Tahlili

### Model'lar Orasidagi Bog'lanish

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUDGET MODEL                              │
├─────────────────────────────────────────────────────────────────┤
│ id: String                                                       │
│ name: String                                                     │
│ amount: Double (Reja qilingan summa)                            │
│ spent: Double (Sarflangan - AVTOMATIK HISOBLANISHI KERAK)       │
│ categoryId: String (BOG'LANGAN KATEGORIYA)                      │
│ period: BudgetPeriod (daily/weekly/monthly/yearly)              │
│ startDate: Date                                                  │
│ endDate: Date                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ categoryId orqali bog'lanadi
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRANSACTION MODEL                           │
├─────────────────────────────────────────────────────────────────┤
│ id: String                                                       │
│ amount: Double                                                   │
│ type: TransactionType (income/expense/transfer)                 │
│ categoryId: String (← BUDGET BILAN BOG'LANADI)                  │
│ date: Date                                                       │
│ accountId: String                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ categoryId orqali bog'lanadi
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CATEGORY MODEL                             │
├─────────────────────────────────────────────────────────────────┤
│ id: String                                                       │
│ name: String                                                     │
│ icon: String                                                     │
│ type: CategoryType (income/expense)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Savings Goal Model (Jamg'arma)

```
┌─────────────────────────────────────────────────────────────────┐
│                     SAVINGS GOAL MODEL                           │
├─────────────────────────────────────────────────────────────────┤
│ id: String                                                       │
│ name: String (masalan: "Mashina olish")                         │
│ targetAmount: Double (Maqsad summa)                             │
│ currentAmount: Double (Hozirgi yig'ilgan)                       │
│ categoryId: String? (Ixtiyoriy kategoriya)                      │
│ deadline: Date?                                                  │
│ linkedGoalId: String? (Goal bilan bog'lanish)                   │
│ linkedHabitIds: [String]? (Habit'lar bilan bog'lanish)          │
│ linkedTaskIds: [String]? (Task'lar bilan bog'lanish)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Yechim Rejasi

### Bosqich 1: BudgetService Yaratish/Yangilash

```swift
// MARK: - BudgetService.swift

import Foundation
import SwiftData

@Observable
class BudgetService {
    private let modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    // MARK: - Budget'ni Transaction bo'yicha yangilash
    
    /// Transaction qo'shilganda budget'ni yangilaydi
    func updateBudgetForTransaction(_ transaction: Transaction) {
        guard let categoryId = transaction.categoryId else { return }
        
        // Ushbu kategoriyaga tegishli barcha budget'larni topish
        let budgets = fetchBudgets(forCategoryId: categoryId)
        
        for budget in budgets {
            // Transaction budget davriga to'g'ri kelishini tekshirish
            if isTransactionInBudgetPeriod(transaction, budget: budget) {
                updateBudgetSpent(budget)
            }
        }
        
        try? modelContext.save()
    }
    
    /// Transaction o'chirilganda budget'ni yangilaydi
    func removeTransactionFromBudget(_ transaction: Transaction) {
        guard let categoryId = transaction.categoryId else { return }
        
        let budgets = fetchBudgets(forCategoryId: categoryId)
        
        for budget in budgets {
            if isTransactionInBudgetPeriod(transaction, budget: budget) {
                updateBudgetSpent(budget)
            }
        }
        
        try? modelContext.save()
    }
    
    // MARK: - Transfer bo'yicha Budget yangilash
    
    /// Transfer qilinganda tegishli budget'larni yangilaydi
    func updateBudgetForTransfer(_ transfer: Transfer) {
        // Agar transfer kategoriyaga bog'langan bo'lsa
        if let categoryId = transfer.categoryId {
            let budgets = fetchBudgets(forCategoryId: categoryId)
            
            for budget in budgets {
                if isTransferInBudgetPeriod(transfer, budget: budget) {
                    updateBudgetSpent(budget)
                }
            }
        }
        
        try? modelContext.save()
    }
    
    // MARK: - Budget Spent Hisoblash
    
    /// Budget'ning sarflangan summasini qayta hisoblaydi
    func updateBudgetSpent(_ budget: Budget) {
        let (startDate, endDate) = getBudgetPeriodDates(budget)
        
        // Ushbu kategoriya va davrdagi barcha expense'larni olish
        let expenses = fetchExpenses(
            categoryId: budget.categoryId,
            startDate: startDate,
            endDate: endDate
        )
        
        // Ushbu kategoriya va davrdagi barcha transfer'larni olish (agar expense sifatida hisoblansa)
        let transfers = fetchTransfers(
            categoryId: budget.categoryId,
            startDate: startDate,
            endDate: endDate
        )
        
        // Jami sarfni hisoblash
        let totalExpenses = expenses.reduce(0) { $0 + $1.amount }
        let totalTransfers = transfers.reduce(0) { $0 + $1.amount }
        
        budget.spent = totalExpenses + totalTransfers
    }
    
    // MARK: - Yordamchi Metodlar
    
    private func fetchBudgets(forCategoryId categoryId: String) -> [Budget] {
        let descriptor = FetchDescriptor<Budget>(
            predicate: #Predicate { $0.categoryId == categoryId }
        )
        return (try? modelContext.fetch(descriptor)) ?? []
    }
    
    private func fetchExpenses(categoryId: String, startDate: Date, endDate: Date) -> [Transaction] {
        let descriptor = FetchDescriptor<Transaction>(
            predicate: #Predicate { transaction in
                transaction.categoryId == categoryId &&
                transaction.type == .expense &&
                transaction.date >= startDate &&
                transaction.date <= endDate
            }
        )
        return (try? modelContext.fetch(descriptor)) ?? []
    }
    
    private func fetchTransfers(categoryId: String, startDate: Date, endDate: Date) -> [Transfer] {
        let descriptor = FetchDescriptor<Transfer>(
            predicate: #Predicate { transfer in
                transfer.categoryId == categoryId &&
                transfer.date >= startDate &&
                transfer.date <= endDate
            }
        )
        return (try? modelContext.fetch(descriptor)) ?? []
    }
    
    private func getBudgetPeriodDates(_ budget: Budget) -> (start: Date, end: Date) {
        let calendar = Calendar.current
        let now = Date()
        
        switch budget.period {
        case .daily:
            let start = calendar.startOfDay(for: now)
            let end = calendar.date(byAdding: .day, value: 1, to: start)!
            return (start, end)
            
        case .weekly:
            let start = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now))!
            let end = calendar.date(byAdding: .weekOfYear, value: 1, to: start)!
            return (start, end)
            
        case .monthly:
            let start = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
            let end = calendar.date(byAdding: .month, value: 1, to: start)!
            return (start, end)
            
        case .yearly:
            let start = calendar.date(from: calendar.dateComponents([.year], from: now))!
            let end = calendar.date(byAdding: .year, value: 1, to: start)!
            return (start, end)
            
        case .custom:
            return (budget.startDate, budget.endDate ?? now)
        }
    }
    
    private func isTransactionInBudgetPeriod(_ transaction: Transaction, budget: Budget) -> Bool {
        let (startDate, endDate) = getBudgetPeriodDates(budget)
        return transaction.date >= startDate && transaction.date <= endDate
    }
    
    private func isTransferInBudgetPeriod(_ transfer: Transfer, budget: Budget) -> Bool {
        let (startDate, endDate) = getBudgetPeriodDates(budget)
        return transfer.date >= startDate && transfer.date <= endDate
    }
    
    // MARK: - Barcha Budget'larni Yangilash
    
    /// Ilova ishga tushganda barcha budget'larni qayta hisoblaydi
    func recalculateAllBudgets() {
        let descriptor = FetchDescriptor<Budget>()
        guard let budgets = try? modelContext.fetch(descriptor) else { return }
        
        for budget in budgets {
            updateBudgetSpent(budget)
        }
        
        try? modelContext.save()
    }
}
```

### Bosqich 2: TransactionService'ga Integration

```swift
// MARK: - TransactionService.swift (Qo'shimchalar)

class TransactionService {
    private let modelContext: ModelContext
    private let budgetService: BudgetService
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        self.budgetService = BudgetService(modelContext: modelContext)
    }
    
    // MARK: - Transaction Yaratish
    
    func createTransaction(_ transaction: Transaction) {
        modelContext.insert(transaction)
        try? modelContext.save()
        
        // ✅ YANGI: Budget'ni yangilash
        budgetService.updateBudgetForTransaction(transaction)
        
        // Account balansini yangilash
        updateAccountBalance(for: transaction)
    }
    
    // MARK: - Transaction O'chirish
    
    func deleteTransaction(_ transaction: Transaction) {
        // ✅ YANGI: Budget'dan olib tashlash
        budgetService.removeTransactionFromBudget(transaction)
        
        // Account balansini qaytarish
        reverseAccountBalance(for: transaction)
        
        modelContext.delete(transaction)
        try? modelContext.save()
    }
    
    // MARK: - Transaction Yangilash
    
    func updateTransaction(_ transaction: Transaction, with updates: TransactionUpdate) {
        // Eski qiymatlarni saqlash
        let oldCategoryId = transaction.categoryId
        let oldAmount = transaction.amount
        
        // Yangilash
        transaction.amount = updates.amount ?? transaction.amount
        transaction.categoryId = updates.categoryId ?? transaction.categoryId
        transaction.date = updates.date ?? transaction.date
        
        try? modelContext.save()
        
        // ✅ YANGI: Agar kategoriya yoki summa o'zgargan bo'lsa
        if oldCategoryId != transaction.categoryId || oldAmount != transaction.amount {
            // Eski kategoriya budget'ini yangilash
            if let oldCatId = oldCategoryId {
                let oldBudgets = fetchBudgets(forCategoryId: oldCatId)
                oldBudgets.forEach { budgetService.updateBudgetSpent($0) }
            }
            
            // Yangi kategoriya budget'ini yangilash
            budgetService.updateBudgetForTransaction(transaction)
        }
    }
}
```

### Bosqich 3: TransferService'ga Integration

```swift
// MARK: - TransferService.swift (Qo'shimchalar)

class TransferService {
    private let modelContext: ModelContext
    private let budgetService: BudgetService
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        self.budgetService = BudgetService(modelContext: modelContext)
    }
    
    // MARK: - Transfer Yaratish
    
    func createTransfer(_ transfer: Transfer) {
        modelContext.insert(transfer)
        try? modelContext.save()
        
        // Account'larni yangilash
        updateAccountBalances(for: transfer)
        
        // ✅ YANGI: Agar transfer kategoriyaga bog'langan bo'lsa
        budgetService.updateBudgetForTransfer(transfer)
    }
    
    // MARK: - Transfer O'chirish
    
    func deleteTransfer(_ transfer: Transfer) {
        // Account balanslarini qaytarish
        reverseAccountBalances(for: transfer)
        
        modelContext.delete(transfer)
        try? modelContext.save()
        
        // ✅ YANGI: Budget'ni yangilash
        if transfer.categoryId != nil {
            budgetService.updateBudgetForTransfer(transfer)
        }
    }
}
```

### Bosqich 4: SavingsGoalService (Jamg'arma)

```swift
// MARK: - SavingsGoalService.swift

import Foundation
import SwiftData

@Observable
class SavingsGoalService {
    private let modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    // MARK: - Qiymat Qo'shish
    
    /// Jamg'armaga qo'lda qiymat qo'shish
    func addValue(to goal: SavingsGoal, amount: Double, note: String? = nil) {
        goal.currentAmount += amount
        
        // Tarix yozuvi
        let entry = SavingsEntry(
            id: UUID().uuidString,
            goalId: goal.id,
            amount: amount,
            type: .manual,
            note: note,
            date: Date()
        )
        modelContext.insert(entry)
        
        // Progress tekshirish
        checkGoalCompletion(goal)
        
        try? modelContext.save()
    }
    
    /// Transfer orqali qiymat qo'shish
    func addValueFromTransfer(to goal: SavingsGoal, transfer: Transfer) {
        goal.currentAmount += transfer.amount
        
        // Tarix yozuvi
        let entry = SavingsEntry(
            id: UUID().uuidString,
            goalId: goal.id,
            amount: transfer.amount,
            type: .transfer,
            transferId: transfer.id,
            date: transfer.date
        )
        modelContext.insert(entry)
        
        checkGoalCompletion(goal)
        
        try? modelContext.save()
    }
    
    // MARK: - Goal/Habit/Task Integration
    
    /// Goal tugallanganida jamg'armaga qiymat qo'shish
    func addValueFromGoal(to savingsGoal: SavingsGoal, goal: Goal, amount: Double) {
        savingsGoal.currentAmount += amount
        
        let entry = SavingsEntry(
            id: UUID().uuidString,
            goalId: savingsGoal.id,
            amount: amount,
            type: .goalReward,
            linkedGoalId: goal.id,
            date: Date()
        )
        modelContext.insert(entry)
        
        checkGoalCompletion(savingsGoal)
        
        try? modelContext.save()
    }
    
    /// Habit bajarilganida jamg'armaga qiymat qo'shish
    func addValueFromHabit(to savingsGoal: SavingsGoal, habit: Habit, amount: Double) {
        savingsGoal.currentAmount += amount
        
        let entry = SavingsEntry(
            id: UUID().uuidString,
            goalId: savingsGoal.id,
            amount: amount,
            type: .habitReward,
            linkedHabitId: habit.id,
            date: Date()
        )
        modelContext.insert(entry)
        
        checkGoalCompletion(savingsGoal)
        
        try? modelContext.save()
    }
    
    /// Task bajarilganida jamg'armaga qiymat qo'shish
    func addValueFromTask(to savingsGoal: SavingsGoal, task: TaskItem, amount: Double) {
        savingsGoal.currentAmount += amount
        
        let entry = SavingsEntry(
            id: UUID().uuidString,
            goalId: savingsGoal.id,
            amount: amount,
            type: .taskReward,
            linkedTaskId: task.id,
            date: Date()
        )
        modelContext.insert(entry)
        
        checkGoalCompletion(savingsGoal)
        
        try? modelContext.save()
    }
    
    // MARK: - Yordamchi Metodlar
    
    private func checkGoalCompletion(_ goal: SavingsGoal) {
        if goal.currentAmount >= goal.targetAmount && !goal.isCompleted {
            goal.isCompleted = true
            goal.completedDate = Date()
            
            // Notification yuborish
            NotificationCenter.default.post(
                name: .savingsGoalCompleted,
                object: goal
            )
        }
    }
    
    /// Progress foizi
    func progressPercentage(for goal: SavingsGoal) -> Double {
        guard goal.targetAmount > 0 else { return 0 }
        return min((goal.currentAmount / goal.targetAmount) * 100, 100)
    }
}

// MARK: - SavingsEntry Model

@Model
class SavingsEntry {
    @Attribute(.unique) var id: String
    var goalId: String
    var amount: Double
    var type: SavingsEntryType
    var note: String?
    var transferId: String?
    var linkedGoalId: String?
    var linkedHabitId: String?
    var linkedTaskId: String?
    var date: Date
    
    init(id: String, goalId: String, amount: Double, type: SavingsEntryType, 
         note: String? = nil, transferId: String? = nil, linkedGoalId: String? = nil,
         linkedHabitId: String? = nil, linkedTaskId: String? = nil, date: Date) {
        self.id = id
        self.goalId = goalId
        self.amount = amount
        self.type = type
        self.note = note
        self.transferId = transferId
        self.linkedGoalId = linkedGoalId
        self.linkedHabitId = linkedHabitId
        self.linkedTaskId = linkedTaskId
        self.date = date
    }
}

enum SavingsEntryType: String, Codable {
    case manual = "manual"
    case transfer = "transfer"
    case goalReward = "goal_reward"
    case habitReward = "habit_reward"
    case taskReward = "task_reward"
}

// MARK: - Notification Names

extension Notification.Name {
    static let savingsGoalCompleted = Notification.Name("savingsGoalCompleted")
}
```

### Bosqich 5: Budget Model Yangilash

```swift
// MARK: - Budget.swift (Yangilangan)

import Foundation
import SwiftData

@Model
class Budget {
    @Attribute(.unique) var id: String
    var name: String
    var amount: Double // Reja qilingan summa
    var spent: Double // Sarflangan (avtomatik hisoblanadi)
    var categoryId: String // Bog'langan kategoriya
    var period: BudgetPeriod
    var startDate: Date
    var endDate: Date?
    var isActive: Bool
    var createdAt: Date
    var updatedAt: Date
    
    // Computed Properties
    var remaining: Double {
        return amount - spent
    }
    
    var percentageUsed: Double {
        guard amount > 0 else { return 0 }
        return (spent / amount) * 100
    }
    
    var isOverBudget: Bool {
        return spent > amount
    }
    
    var status: BudgetStatus {
        let percentage = percentageUsed
        if percentage >= 100 {
            return .exceeded
        } else if percentage >= 80 {
            return .warning
        } else {
            return .normal
        }
    }
    
    init(id: String = UUID().uuidString,
         name: String,
         amount: Double,
         categoryId: String,
         period: BudgetPeriod,
         startDate: Date = Date(),
         endDate: Date? = nil) {
        self.id = id
        self.name = name
        self.amount = amount
        self.spent = 0
        self.categoryId = categoryId
        self.period = period
        self.startDate = startDate
        self.endDate = endDate
        self.isActive = true
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

enum BudgetPeriod: String, Codable, CaseIterable {
    case daily = "daily"
    case weekly = "weekly"
    case monthly = "monthly"
    case yearly = "yearly"
    case custom = "custom"
    
    var displayName: String {
        switch self {
        case .daily: return "Kunlik"
        case .weekly: return "Haftalik"
        case .monthly: return "Oylik"
        case .yearly: return "Yillik"
        case .custom: return "Maxsus"
        }
    }
}

enum BudgetStatus: String {
    case normal = "normal"
    case warning = "warning"
    case exceeded = "exceeded"
}
```

### Bosqich 6: Transfer Model'ga CategoryId Qo'shish

```swift
// MARK: - Transfer.swift (Yangilangan)

@Model
class Transfer {
    @Attribute(.unique) var id: String
    var amount: Double
    var fromAccountId: String
    var toAccountId: String
    var categoryId: String? // ✅ YANGI: Kategoriya bilan bog'lanish
    var savingsGoalId: String? // ✅ YANGI: Jamg'arma bilan bog'lanish
    var note: String?
    var date: Date
    var createdAt: Date
    
    init(id: String = UUID().uuidString,
         amount: Double,
         fromAccountId: String,
         toAccountId: String,
         categoryId: String? = nil,
         savingsGoalId: String? = nil,
         note: String? = nil,
         date: Date = Date()) {
        self.id = id
        self.amount = amount
        self.fromAccountId = fromAccountId
        self.toAccountId = toAccountId
        self.categoryId = categoryId
        self.savingsGoalId = savingsGoalId
        self.note = note
        self.date = date
        self.createdAt = Date()
    }
}
```

---

## 🔄 Orqaga Qaytarish (Rollback)

### Rollback Script

Agar biror muammo yuzaga kelsa, quyidagi o'zgarishlarni orqaga qaytaring:

```swift
// MARK: - ROLLBACK INSTRUCTIONS

/*
 ROLLBACK BOSQICHLARI:
 
 1. BudgetService.swift faylini o'chiring yoki eski versiyaga qaytaring
 
 2. TransactionService.swift dan quyidagi qatorlarni o'chiring:
    - budgetService.updateBudgetForTransaction(transaction)
    - budgetService.removeTransactionFromBudget(transaction)
 
 3. TransferService.swift dan quyidagi qatorlarni o'chiring:
    - budgetService.updateBudgetForTransfer(transfer)
 
 4. Transfer.swift dan quyidagi property'larni o'chiring:
    - var categoryId: String?
    - var savingsGoalId: String?
 
 5. Budget.swift dan quyidagi computed property'larni o'chiring (ixtiyoriy):
    - var remaining: Double
    - var percentageUsed: Double
    - var isOverBudget: Bool
    - var status: BudgetStatus
 
 6. SavingsGoalService.swift faylini o'chiring
 
 7. SavingsEntry model'ini o'chiring
 
 8. Migration qiling:
    - Agar SwiftData migration kerak bo'lsa, schemani qayta yarating
*/

// MARK: - Git Rollback (agar Git ishlatilsa)

/*
 Terminal'da:
 
 # Oxirgi commit'ga qaytish
 git reset --hard HEAD~1
 
 # Yoki muayyan commit'ga qaytish
 git reset --hard <commit-hash>
 
 # Faqat ma'lum fayllarni qaytarish
 git checkout HEAD~1 -- path/to/file.swift
*/
```

---

## ✅ Test Qilish

### Unit Tests

```swift
// MARK: - BudgetServiceTests.swift

import XCTest
@testable import YourApp

final class BudgetServiceTests: XCTestCase {
    var budgetService: BudgetService!
    var modelContext: ModelContext!
    
    override func setUp() {
        super.setUp()
        // Test context yaratish
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try! ModelContainer(for: Budget.self, Transaction.self, configurations: config)
        modelContext = ModelContext(container)
        budgetService = BudgetService(modelContext: modelContext)
    }
    
    func testBudgetUpdatesWhenTransactionAdded() {
        // Given
        let category = Category(id: "food", name: "Food", type: .expense)
        let budget = Budget(name: "Food Budget", amount: 1000, categoryId: "food", period: .monthly)
        modelContext.insert(budget)
        
        // When
        let transaction = Transaction(amount: 100, type: .expense, categoryId: "food", date: Date())
        modelContext.insert(transaction)
        budgetService.updateBudgetForTransaction(transaction)
        
        // Then
        XCTAssertEqual(budget.spent, 100)
        XCTAssertEqual(budget.remaining, 900)
    }
    
    func testBudgetUpdatesWhenTransactionDeleted() {
        // Given
        let budget = Budget(name: "Food Budget", amount: 1000, categoryId: "food", period: .monthly)
        budget.spent = 100
        modelContext.insert(budget)
        
        let transaction = Transaction(amount: 100, type: .expense, categoryId: "food", date: Date())
        modelContext.insert(transaction)
        
        // When
        budgetService.removeTransactionFromBudget(transaction)
        modelContext.delete(transaction)
        budgetService.recalculateAllBudgets()
        
        // Then
        XCTAssertEqual(budget.spent, 0)
    }
    
    func testTransferUpdatesBudget() {
        // Given
        let budget = Budget(name: "Food Budget", amount: 1000, categoryId: "food", period: .monthly)
        modelContext.insert(budget)
        
        // When
        let transfer = Transfer(amount: 50, fromAccountId: "acc1", toAccountId: "acc2", categoryId: "food")
        modelContext.insert(transfer)
        budgetService.updateBudgetForTransfer(transfer)
        
        // Then
        XCTAssertEqual(budget.spent, 50)
    }
}
```

---

## 📊 Integration Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USER ACTION                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ Add       │   │ Add       │   │ Add Value │
            │Transaction│   │ Transfer  │   │ to Goal   │
            └───────────┘   └───────────┘   └───────────┘
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │Transaction│   │ Transfer  │   │ Savings   │
            │ Service   │   │ Service   │   │Goal Svc   │
            └───────────┘   └───────────┘   └───────────┘
                    │               │               │
                    └───────┬───────┘               │
                            │                       │
                            ▼                       │
                    ┌───────────────┐               │
                    │ BudgetService │               │
                    │               │               │
                    │ • Find budget │               │
                    │   by category │               │
                    │ • Check period│               │
                    │ • Update spent│               │
                    └───────────────┘               │
                            │                       │
                            ▼                       ▼
                    ┌───────────────────────────────────┐
                    │           SwiftData               │
                    │                                   │
                    │ Budget.spent ← Updated            │
                    │ SavingsGoal.currentAmount ←       │
                    └───────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   UI Update   │
                    │ (Observable)  │
                    └───────────────┘
```

---

## 📱 UI Integration

### BudgetListView

```swift
// MARK: - BudgetListView.swift

import SwiftUI
import SwiftData

struct BudgetListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var budgets: [Budget]
    
    private var budgetService: BudgetService {
        BudgetService(modelContext: modelContext)
    }
    
    var body: some View {
        List {
            ForEach(budgets) { budget in
                BudgetRowView(budget: budget)
            }
        }
        .onAppear {
            // Har safar ko'ringanda budget'larni qayta hisoblash
            budgetService.recalculateAllBudgets()
        }
    }
}

struct BudgetRowView: View {
    let budget: Budget
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(budget.name)
                    .font(.headline)
                Spacer()
                Text(budget.status.rawValue)
                    .foregroundColor(statusColor)
            }
            
            ProgressView(value: min(budget.percentageUsed / 100, 1.0))
                .tint(statusColor)
            
            HStack {
                Text("Sarflangan: \(budget.spent, specifier: "%.0f")")
                Spacer()
                Text("Qoldi: \(budget.remaining, specifier: "%.0f")")
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
    
    private var statusColor: Color {
        switch budget.status {
        case .normal: return .green
        case .warning: return .orange
        case .exceeded: return .red
        }
    }
}
```

---

## 🚀 Ishga Tushirish Ketma-ketligi

1. **Model'larni yangilang** (Budget, Transfer)
2. **Service'larni yarating** (BudgetService, SavingsGoalService)
3. **Mavjud service'larni yangilang** (TransactionService, TransferService)
4. **UI komponentlarini yangilang**
5. **Test'larni yozing va ishga tushiring**
6. **Migration qiling** (agar kerak bo'lsa)

---

## 📝 Eslatmalar

- Har bir o'zgarishdan keyin `try? modelContext.save()` chaqirishni unutmang
- `@Observable` makrosidan foydalaning real-time UI yangilanishlari uchun
- SwiftData query'larida `#Predicate` to'g'ri ishlashiga ishonch hosil qiling
- Unit test'lar yozing har bir yangi funksionallik uchun

---

*Hujjat yaratildi: 2024*
*Versiya: 1.0*
