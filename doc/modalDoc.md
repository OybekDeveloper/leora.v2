# MODAL_MIGRATION_CHECKLIST.md
Миграция BottomSheet → Native Router Modals. Используем нативные модальные экраны Expo Router, открываем через `router.push("/(modals)/<id>")`, закрываем через `router.dismiss()`. Инпуты — как на Login-экранах; обязательно подключаем `KeyboardAvoidingView`. Цель — убрать все зависимости от `@gorhom/bottom-sheet`, сохранив логику и UI.

## Как выполнять
- Создаём экран в `app/(modals)/<id>.tsx` (router modal).
- Переносим всю логику и UI из BottomSheet-компонента, повторяем стили/состояния/поведение.
- Убираем refs и вызовы `.present()/.dismiss()`, заменяем на `router.push`/`router.dismiss`.
- Добавляем `KeyboardAvoidingView` и Login-style inputs.
- Проверяем закрытие/возврат без ошибок.

## Финансы (router target в скобках)
- [x] **AddAccountSheet → `/ (modals)/add-account`** (router modal нужен для Accounts tab).
- [ ] **TransactionModal → `/ (modals)/finance-transaction`**
- [ ] **DebtModal → `/ (modals)/finance-debt`**
- [x] **FilterTransactionSheet → `/ (modals)/finance-filter`**
- [ ] **IncomeOutcomeModal → `/ (modals)/finance-income-outcome`**

## Planner / Focus
- [ ] **AddTaskSheet → `/ (modals)/planner-add-task`**
- [ ] **GoalModal → `/ (modals)/planner-goal`**
- [ ] **HabitModal → `/ (modals)/planner-habit`**
- [ ] **DateChangeModal → `/ (modals)/planner-date`**
- [ ] **FocusSettingsModal → `/ (modals)/focus-settings`**

## Остальные (проверить и при необходимости мигрировать)
- [ ] Auth: register pickers (region/currency), social login sheet.
- [ ] Profile: edit, region, currency sheets.
- [ ] Insights modals (если используют BottomSheet).

### Чек-лист шагов для каждого модала
- [ ] Экран создан в `app/(modals)`
- [ ] Логика перенесена
- [ ] UI перенесён
- [ ] `KeyboardAvoidingView` работает (iOS/Android)
- [ ] Login-style inputs
- [ ] BottomSheet удалён
- [ ] Закрытие/возврат без ошибок
