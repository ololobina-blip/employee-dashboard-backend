# Employee Dashboard — Backend

Сервис для дашборда производительности:

- **Sync** — Google Sheets → MariaDB (cron, раз в час)
- **API** — read-only JSON в формате фронта (`googleSheetsReal.ts`)
- **Апелляции** — запись только через **Google Apps Script** на фронте; бэк **читает** копию из таблиц (колонки Q–W)

Фронт на Vercel пока ходит в Sheets напрямую. API готов, чтобы позже переключить дашборд одной переменной `VITE_API_URL`.

---

## Документация

| Файл | Содержание |
|------|------------|
| [API.md](./API.md) | HTTP-ручки |
| [SETUP.md](./SETUP.md) | Инициализация БД |
| [VERCEL_AND_RAILWAY.md](./VERCEL_AND_RAILWAY.md) | Связка Vercel ↔ Railway |

---

## Структура проекта

| Путь | Назначение |
|------|------------|
| `init-railway.sql` | Схема для Railway (БД `railway`) |
| `init.sql` | Схема с отдельной БД `employee_dashboard` (локально) |
| `migrations/002_appeal_revisions.sql` | Колонки Q–W (апелляции) |
| `src/sync-sheets.ts` | Синхронизация A:W |
| `src/services/ticketMapper.ts` | original / revised / effective |
| `src/index.ts` | HTTP + cron |
| `src/routes/` | API |

---

## Листы Google Sheets

| Лист | Диапазон sync |
|------|----------------|
| Оценка звонков | A:W |
| Общий лист с оценкой тест | A:W |
| оценки клиентов | A:D |

### Колонки тикета (важное)

- **D–I** — исходные критерии и балл (original)
- **K–P** — апелляция (флаг, даты, статус, кто рассмотрел)
- **Q** — комментарий по рассмотрению
- **R–V** — новые критерии после approved
- **W** — новый итоговый балл

В API и статистике используются **effective**-значения: если статус approved и R–V заполнены → берутся новые поля, иначе original.

---

## Переменные окружения

```bash
cp .env.example .env
```

| Переменная | Назначение |
|------------|------------|
| `DB_*` | MariaDB (с ПК — `MARIADB_PUBLIC_*`, на Railway — `mariadb.railway.internal`) |
| `GOOGLE_SHEETS_ID`, `GOOGLE_API_KEY` | Sync (те же, что `VITE_*` на фронте) |
| `FRONTEND_URL` | URL Vercel для CORS, напр. `https://project-1swa8.vercel.app` |
| `PUBLIC_API_URL` | Публичный URL бэка (для `/api/v1/meta`) |
| `PORT`, `API_PREFIX` | HTTP-сервер |

---

## Быстрый старт

### 1. Таблицы в БД

**Railway** (БД уже `railway`):

```bash
npm install
npm run db:migrate   # колонки Q–W (один раз)
```

**С нуля** (редко): `npm run db:init` → выполнит `init-railway.sql` или `init.sql`.

### 2. Синхронизация

```bash
npm run sync         # один прогон Sheets → DB
npm run dev          # API + cron + sync при старте
npm run build && npm start
```

### 3. Проверка API

```text
GET http://localhost:3000/api/v1/health
GET http://localhost:3000/api/v1/employees
GET http://localhost:3000/api/v1/employees/Имя%20Фамилия
GET http://localhost:3000/api/v1/appeals
POST http://localhost:3000/api/v1/sync/run
```

---

## Деплой на Railway

1. Новый сервис в том же проекте, **Root Directory:** `backend`
2. **Start:** `npm install && npm run build && npm start`
3. **Variables:** `DB_HOST=mariadb.railway.internal`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=railway`, Google-ключи, `FRONTEND_URL`
4. После деплоя: `POST /api/v1/sync/run` или дождаться cron

Подробнее: [VERCEL_AND_RAILWAY.md](./VERCEL_AND_RAILWAY.md).

---

## Апелляции — границы ответственности

| Действие | Где |
|----------|-----|
| Подача, рассмотрение, запись Q–W | Фронт + **Google Apps Script** |
| Зеркало в MariaDB, `GET /appeals` | Бэк (sync) |
| POST `/appeals` на бэке | **Нет** (намеренно) |

---

## Скрипты npm

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка: API + cron |
| `npm run build` | Сборка TypeScript |
| `npm start` | Продакшен |
| `npm run sync` | Разовая синхронизация |
| `npm run db:init` | Создать таблицы из SQL |
| `npm run db:migrate` | Миграция 002 (колонки апелляций) |

---

## Когда добавите колонки в таблицу

1. `ALTER TABLE` / новая миграция в `migrations/`
2. Индексы колонок в `ticketMapper.ts`
3. Поля в `sync-sheets.ts` и `dashboardService.ts`
4. При необходимости — типы в `src/types/api.ts`

Фронт и Apps Script меняются отдельно, если меняется запись в Sheets.
