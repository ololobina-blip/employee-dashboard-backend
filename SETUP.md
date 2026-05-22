# Employee Performance Dashboard — инициализация БД

См. также [README.md](./README.md) и `init.sql`.

## 1. MariaDB

Выполните весь скрипт `init.sql` в консоли MySQL/MariaDB.

Проверка:

```sql
SHOW TABLES;
DESCRIBE employees;
DESCRIBE tickets;
```

## 2. Переменные окружения

Скопируйте `.env.example` → `.env` и укажите:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `GOOGLE_SHEETS_ID`, `GOOGLE_API_KEY`

## 3. Синхронизация

```bash
npm install
npm run sync
```

Проверка в БД:

```sql
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM tickets;
SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT 5;
```

## 4. Автоматический режим

`npm run dev` или `npm start` — синхронизация по cron (`SYNC_CRON`, по умолчанию каждый час).

## Структура таблиц

- `employees` — сотрудники (ключ: `name`)
- `tickets` — оценки из двух листов
- `appeals` — апелляции (колонки K–P)
- `client_ratings` — оценки клиентов
- `access_entries` — доступ (пока не заполняется sync)
- `sync_logs` — журнал синхронизаций
