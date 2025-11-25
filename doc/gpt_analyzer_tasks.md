# GPT Analyzer Integration – Task Tracker

## Выполнено
- [x] Перенёс патч‑спеку в `doc/gpt_analyzer_patch.md` для удобной навигации.
- [x] Сформировал продакшн‑промпт пакет в `prompts/gpt_analyzer_bundle.md`.

## Запланировано / осталось
- [ ] Собрать клиентский агрегатор (Planner/Finance/Activity/History снапшоты), внедрить приватное маскирование.
- [ ] Реализовать `aiAdapter` (PII masking, retries, кеш, JSON‑валидация контрактов для трех потоков).
- [ ] Подключить fallback‑эвристику на клиенте при недоступности GPT.
- [ ] Связать Daily Overview, Event Triggers и Weekly/Monthly review с новым API (единый контракт I/O).
- [ ] Прописать новые i18n‑ключи (EN/RU/UZ/TR/AR, включая RTL) и убедиться в соблюдении CTA‑требований.
- [ ] Добавить аналитические события (`insight_shown`, `insight_cta_clicked`, `question_answered`).
- [ ] Настроить rate-limits и кеширование (daily + event triggers) на вызовы модели.
