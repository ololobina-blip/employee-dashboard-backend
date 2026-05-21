# 📋 Подготовка БД к подключению

> **Статус:** Готово к внедрению. Дождитесь, пока БД будет создана, и следуйте инструкциям ниже.

---

## Что сейчас готово

✅ Все файлы структурированы для работы с MariaDB:
- SQL миграции для создания таблиц (`migrations/`)
- Слой доступа к данным — repositories (`src/db/repositories/`)
- Обновлённая синхронизация Google Sheets (`src/services/googleSheetsSync.ts`)
- Конфигурация подключения к БД (`src/config/database.ts`)

⚠️ **Текущее состояние:** Бэк всё ещё подключен к MongoDB. Когда будет готова MariaDB, выполните шаги ниже.

---

## Шаги для подключения MariaDB

### 1. Установите MariaDB (если ещё не установлена)

```bash
# macOS (Homebrew)
brew install mariadb
brew services start mariadb

# Windows (через package manager или скачайте с mariadb.org)
# Linux (Ubuntu/Debian)
sudo apt-get install mariadb-server
sudo systemctl start mariadb
```

### 2. Создайте БД и пользователя

```bash
mysql -u root -p

# В MySQL консоли:
CREATE DATABASE employee_dashboard;

CREATE USER 'dashboard_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON employee_dashboard.* TO 'dashboard_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Обновите `.env` файл

```env
NODE_ENV=development

# Server
PORT=3000
API_PREFIX=/api/v1

# Database (MariaDB)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=employee_dashboard
DB_USER=dashboard_user
DB_PASSWORD=secure_password

# Google Sheets
GOOGLE_SPREADSHEET_ID=your_sheet_id
GOOGLE_SHEETS_API_KEY=your_api_key

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Установите зависимость для MariaDB

```bash
cd backend
npm install mysql2
```

### 5. Выполните миграции

```bash
# Создание таблиц
npm run migrate

# (Опционально) Добавьте тестовые данные
npm run seed
```

### 6. Обновите код бэка

**Замените** в `backend/src/db/index.ts`:

```typescript
// Было (MongoDB):
import mongoose from 'mongoose'
// import { initMariaDB, closeDatabase } from './mariadb'

// Станет (MariaDB):
import { initMariaDB, closeDatabase } from './mariadb'
```

И в `backend/src/index.ts` раскомментируйте инициализацию БД:

```typescript
// Добавьте перед app.listen():
await initMariaDB()
```

### 7. Запустите бэк

```bash
npm run dev
```

Если увидели логи:
```
[DB] Connected to MariaDB
[SERVER] Running on http://localhost:3000/api/v1
```

✅ **Всё работает!** БД успешно подключена.

---

## Структура таблиц

### `employees` — Сотрудники
```sql
CREATE TABLE employees (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `tickets` — Тикеты из Google Sheets
```sql
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_email VARCHAR(255) NOT NULL,
  ticket_id VARCHAR(255) UNIQUE NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(500),
  status ENUM('resolved', 'pending', 'closed') DEFAULT 'pending',
  category VARCHAR(255),
  ai_score DECIMAL(5,2),
  ai_comment TEXT,
  errors TEXT,
  response_time DECIMAL(5,2),
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_email) REFERENCES employees(email) ON DELETE CASCADE
);
```

### `sync_logs` — Логи синхронизации
```sql
CREATE TABLE sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type VARCHAR(100) NOT NULL,
  status ENUM('success', 'failed') DEFAULT 'success',
  rows_affected INT DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Запуск синхронизации

Синхронизация с Google Sheets настроена на **раз в час** через `node-cron`.

Она автоматически:
1. Тянет данные из листов "Employees" и "Tickets" (Google Sheets)
2. Парсит и валидирует данные
3. Обновляет таблицы в БД
4. Логирует результаты в `sync_logs`

Логи находятся в файле `backend/logs/sync.log` (если настроено логирование).

### Ручная синхронизация (опционально)

Создайте эндпоинт для ручной синхронизации (если нужно):

```typescript
// backend/src/routes/sync/index.ts
import { Router } from 'fastify'
import { syncEmployeesFromGoogleSheets, syncTicketsFromGoogleSheets } from '@services/googleSheetsSync'

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.post('/sync/employees', async (request, reply) => {
    try {
      await syncEmployeesFromGoogleSheets()
      return reply.code(200).send({ message: 'Employees synced successfully' })
    } catch (error) {
      return reply.code(500).send({ error: 'Sync failed' })
    }
  })

  fastify.post('/sync/tickets', async (request, reply) => {
    try {
      await syncTicketsFromGoogleSheets()
      return reply.code(200).send({ message: 'Tickets synced successfully' })
    } catch (error) {
      return reply.code(500).send({ error: 'Sync failed' })
    }
  })
}
```

---

## Возможные проблемы

### "Connection refused" при подключении к БД
- Убедитесь, что MariaDB запущена: `sudo systemctl status mariadb`
- Проверьте хост и порт в `.env`
- Проверьте учётные данные (пользователь/пароль)

### "Table doesn't exist"
- Выполните миграции: `npm run migrate`

### "Foreign key constraint fails"
- Убедитесь, что сначала есть записи в таблице `employees`, потом в `tickets`

### "Google Sheets API Key invalid"
- Проверьте `GOOGLE_SPREADSHEET_ID` и `GOOGLE_SHEETS_API_KEY` в `.env`
- Убедитесь, что у сервис-аккаунта есть доступ к таблице

---

## Следующие шаги (будущее)

1. **Авторизация** — добавить таблицу `users` для входа в дашборд
2. **Rate limiting** — защитить API от перегрузки
3. **Кэширование** — добавить Redis для кэша данных
4. **Метрики** — настроить Prometheus/Grafana для мониторинга

---

## Контакты / Поддержка

Если что-то не работает:
1. Проверьте логи: `docker logs backend` (если используете Docker)
2. Проверьте БД: `mysql -u dashboard_user -p employee_dashboard`
3. Запустите миграции заново: `npm run migrate`

---

**Готово! Ждите, когда БД будет создана, и следуйте инструкциям выше.** 🚀
