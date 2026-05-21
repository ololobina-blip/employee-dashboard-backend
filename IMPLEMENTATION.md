# 🚀 MariaDB Backend Implementation

> Полный backend для работы с MariaDB и Google Sheets синхронизацией.

---

## 📁 Структура созданных файлов

### Миграции (`backend/migrations/`)

```
004_create_employees.sql      - Таблица сотрудников
005_create_tickets.sql        - Таблица тикетов
006_create_sync_logs.sql      - Таблица логов синхронизации
007_create_appeals.sql        - Таблица апелляций
```

### Конфиг БД (`backend/src/db/`)

```
mariadb.ts                     - Подключение к MariaDB (pool, инициализация)
repositories/
  ├── EmployeeRepository.ts   - CRUD операции с сотрудниками
  ├── TicketRepository.ts     - CRUD операции с тикетами
  ├── AppealRepository.ts     - CRUD операции с апелляциями
  ├── SyncLogRepository.ts    - CRUD операции с логами синхронизации
  └── index.ts                - Экспорт всех репозиториев
```

### Синхронизация Google Sheets (`backend/src/services/`)

```
googleSheetsSync.mariadb.ts   - Синхронизация данных из Google Sheets в MariaDB
                               - syncEmployeesFromGoogleSheets()
                               - syncTicketsFromGoogleSheets()
syncScheduler.ts              - Cron job для автоматической синхронизации раз в час
```

### Скрипты для запуска (`backend/src/`)

```
migrate.mariadb.ts            - Выполнение миграций
seed.mariadb.ts               - Добавление тестовых данных
```

---

## 🔧 Как это работает

### 1. **Инициализация БД**

```bash
# Установка зависимостей (если ещё не установлены)
cd backend
npm install

# Выполнение миграций (создание таблиц)
npm run migrate:mariadb

# Добавление тестовых данных (опционально)
npm run seed:mariadb
```

### 2. **Подключение в приложение**

В файле `backend/src/index.ts` добавить:

```typescript
import { initMariaDB, closeDatabase } from '@db/mariadb'
import syncScheduler from '@services/syncScheduler'

async function start() {
  try {
    // Инициализация БД
    await initMariaDB()

    // Запуск сервера
    const app = await createApp()
    await app.listen({ port: config.port, host: '0.0.0.0' })

    // Запуск scheduler для синхронизации
    syncScheduler.start()

    console.log(`[SERVER] Running on http://localhost:${config.port}${config.apiPrefix}`)
  } catch (error) {
    console.error('[SERVER] Failed to start:', error)
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  console.log('[SERVER] Shutting down...')
  syncScheduler.stop()
  await closeDatabase()
  process.exit(0)
})

start()
```

### 3. **Использование в коде**

```typescript
import repositories from '@db/repositories'

// Получить всех сотрудников
const employees = await repositories.employees.findAll()

// Получить тикеты конкретного сотрудника
const tickets = await repositories.tickets.findByEmployeeEmail('ivan.petrov@company.com')

// Создать новый тикет
await repositories.tickets.create({
  employee_email: 'ivan.petrov@company.com',
  ticket_id: 'TICKET-1234',
  date: '2024-01-20',
  title: 'Тест тикета',
  status: 'pending',
  category: 'Тест',
  ai_score: 85.0,
  ai_comment: 'Тестовый комментарий',
})

// Получить логи синхронизации
const logs = await repositories.syncLogs.findByType('employees', 10)
```

---

## 🔄 Автоматическая синхронизация

### График синхронизации

```
- **Каждый час в XX:00** — синхронизация сотрудников
- **Каждый час в XX:05** — синхронизация тикетов (через 5 минут после сотрудников)
- **Каждый час в XX:10** — синхронизация апелляций (через 10 минут после сотрудников)
```

### Логирование

Все операции синхронизации логируются в таблице `sync_logs`:

```sql
SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT 10;
```

Возвращает:
```
id | sync_type | status  | rows_affected | error_message | synced_at
1  | employees | success | 4             | NULL          | 2024-01-20 10:00:00
2  | tickets   | success | 12            | NULL          | 2024-01-20 10:05:00
```

---

## 📊 API для работы с БД

### Repositories API

#### EmployeeRepository

```typescript
findByEmail(email: string): Promise<Employee | null>
findAll(): Promise<Employee[]>
findByDepartment(department: string): Promise<Employee[]>
create(employee: Employee): Promise<void>
update(email: string, employee: Partial<Employee>): Promise<void>
deleteByEmail(email: string): Promise<void>
count(): Promise<number>
truncate(): Promise<void>
```

#### TicketRepository

```typescript
findById(id: number): Promise<Ticket | null>
findByTicketId(ticketId: string): Promise<Ticket | null>
findByEmployeeEmail(email: string): Promise<Ticket[]>
findByDateRange(startDate: string, endDate: string): Promise<Ticket[]>
findByStatus(status: string): Promise<Ticket[]>
findAll(limit?: number, offset?: number): Promise<Ticket[]>
create(ticket: Ticket): Promise<number>
update(id: number, ticket: Partial<Ticket>): Promise<void>
deleteById(id: number): Promise<void>
count(): Promise<number>
truncate(): Promise<void>
```

#### SyncLogRepository

```typescript
create(log: SyncLog): Promise<number>
findLatestByType(syncType: string): Promise<SyncLog | null>
findByType(syncType: string, limit?: number): Promise<SyncLog[]>
findAll(limit?: number): Promise<SyncLog[]>
deleteOlderThan(days: number): Promise<void>
truncate(): Promise<void>
```

---

## ⚙️ Переменные окружения

```env
# Database (MariaDB)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=employee_dashboard
DB_USER=dashboard_user
DB_PASSWORD=secure_password

# Google Sheets
GOOGLE_SPREADSHEET_ID=your_sheet_id
GOOGLE_SHEETS_API_KEY=your_api_key
```

---

## 🧪 Тестирование

### Ручное тестирование синхронизации

```bash
# В Node.js REPL
node

> const { initMariaDB, closeDatabase } = require('./dist/db/mariadb')
> const { syncEmployeesFromGoogleSheets, syncTicketsFromGoogleSheets } = require('./dist/services/googleSheetsSync.mariadb')

> await initMariaDB()
> await syncEmployeesFromGoogleSheets()
> await syncTicketsFromGoogleSheets()
> await closeDatabase()
```

### Проверка данных в БД

```bash
mysql -u dashboard_user -p employee_dashboard

SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM tickets;
SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT 5;
```

---

## 🔍 Поиск и отладка

### Логирование

Все операции логируются в `backend/logs/` (если настроено):

```bash
tail -f backend/logs/sync.log
```

### Проблемы при синхронизации

1. **Нет данных в таблице**
   ```sql
   -- Проверить, есть ли данные
   SELECT * FROM employees;
   SELECT * FROM tickets;
   ```

2. **Ошибка при подключении к Google Sheets**
   - Проверьте `GOOGLE_SPREADSHEET_ID` и `GOOGLE_SHEETS_API_KEY` в `.env`
   - Убедитесь, что таблица общедоступна

3. **Ошибка Foreign Key**
   - Убедитесь, что сотрудники синхронизируются ДО тикетов
   - Email в таблице `tickets` должен совпадать с email в `employees`

---

## 📝 Дополнительно

### Удаление старых логов синхронизации

```typescript
// Удалить логи старше 30 дней
await repositories.syncLogs.deleteOlderThan(30)
```

### Получение статистики

```typescript
// Количество всех сотрудников
const employeeCount = await repositories.employees.count()

// Количество всех тикетов
const ticketCount = await repositories.tickets.count()

// Количество успешных синхронизаций
const successLogs = await repositories.syncLogs.findByType('employees')
const successCount = successLogs.filter(log => log.status === 'success').length
```

---

## 🚨 Важно

- **Не изменяйте структуру таблиц вручную** — используйте миграции
- **Google Sheets должна быть доступна** через API
- **Регулярно проверяйте логи синхронизации** на ошибки
- **Тестируйте на dev окружении** перед production

---

**Готово к использованию! 🎉**

Все файлы создны и готовы к подключению. Когда БД будет создана, следуйте инструкциям из `DATABASE_SETUP.md`.
