Отлично. Ниже — единое ТЗ для денег, бюджетов и взаиморасчётов так, чтобы расходы и приходы работали гармонично и корректно при мультивалюте. Включаю пример с проектом LEORA: бюджет $20 000, траты из UZS и **USD**‑счетов, ручные курсы, и логику закрытия IOU.

---

# LEORA · MONEY + BUDGET + IOU · Единое ТЗ v1.3

## 0) Цель

Сделать офлайн‑первую систему учёта, где:

* Пользователь выбирает регион/базовую валюту и работает с несколькими валютами (UZS, USD, EUR, TRY, SAR, AED, USDT и др.).
* Бюджеты проекта заданы в одной валюте (например, USD 20 000**) и **корректно учитывают расходы/приходы из разных счетов/валют.
* IOU (взаиморасчёты) прозрачны: номинация долга, ручные курсы на погашении, кто несёт курсовую разницу.
* Любая операция хранит снимок курса → отчёты всегда сходятся.

---

## 1) Модель данных (ядро)

### 1.1 Справочники

* Currency: code, name, scale (знаков после запятой), display_rounding.
* FxRate (локальный): pair (FROM/TO), rate_dec(TEXT), label('Cash'|'P2P'|'Official'|'Custom'), effective_at.

  > *Источник только пользователь (ручной ввод / RateBook).*

### 1.2 Рабочее пространство/проект

* Workspace: base_currency, region_preset.
* Project:
  name, budget_currency, budget_amount,
  fx_policy_budget ('TRANSACTION'|'FROZEN'|'MONTHLY_AVG'),
  frozen_matrix { from_code: rate_to_budget }? (для FROZEN),
  monthly_avg_matrix? (таблица пользовательских средних курсов),
  budget_type ('SPEND_ONLY'|'NET').

### 1.3 Счета, категории

* Account: name, currency, type (cash/card/wallet/stablecoin/other).
* Category: дерево категорий; каждая транзакция может быть привязана к категории и/или проекту.

### 1.4 Деньги (двухсторонняя запись)

* Transaction:
  id, datetime, project_id?, category_id?,
  account_id, amount_minor (знак: расход < 0, приход > 0),
  fx_rate_snapshot? (если нужно свести в бюджетную валюту),
  note, counterparty?.

  > Мы не «догружаем» курсы автоматически — снимок всегда от пользователя.

### 1.5 IOU (взаиморасчёты)

* IouContract:
  counterparty, denom_currency, principal_minor,
  policy ('FIXED_CURR'|'PAYMENT_DATE_RATE'|'LOCKED_RATE'|'LOCKED_TO_USD'),
  fx_bearer ('payer'|'payee'|'split'),
  (опц.) funding_account_id, funding_currency, rate_on_creation (denom→funding) — для информативного FX‑результата.
* IouEvent: type('create'|'payment'|'defer'|'forgive'|'close'),
  amount_minor, currency, used_rate_snapshot?,
  closed_in_denom_minor?, outstanding_after_minor,
  (опц.) fx_pnl_minor, fx_pnl_currency.

---

## 2) Бюджет: как считать траты и приходы

### 2.1 Политики конвертации для бюджета проекта

* `TRANSACTION` — каждая операция пересчитывается в budget_currency по её собственному `fx_rate_snapshot`. *Самая «реальная» картинка, но «шумная».*
* `FROZEN` — проект имеет матрицу «замороженных» курсов к budget_currency (ввод пользователем). Все операции (UZS/TRY/… → USD) сводятся по этим фиксам. *Идеально для контроля сметы: курс стабилен.*
* `MONTHLY_AVG` — пользователь создаёт помесячные курсы для пар → операции сводятся по курсу месяца операции. *Сглаженная реальность.*

> Если нет курса для нужной пары — UI требует ввести/выбрать из RateBook (сохранить в матрицу).

### 2.2 Тип бюджета

* `SPEND_ONLY` (по умолчанию) — бюджет расходуется только расходами; приходы показываются отдельно (не уменьшают «использовано»).
* `NET` — бюджет контролируется по сальдо: использовано = расходы − приходы.

### 2.3 Привязка операций к бюджету

* Любая Transaction может быть привязана к Project (поле `project_id`).
* Поддерживаем сплиты: одна операция может быть разбита на части по разным проектам/категориям.

---

## 3) Алгоритм расчёта «сколько бюджета израсходовано»

Пусть транзакция имеет txn.amount_native в txn.currency. Нужно получить amount_in_budget в project.budget_currency.

1. Определить курс по политике проекта: