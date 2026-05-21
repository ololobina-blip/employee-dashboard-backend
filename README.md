# Employee Performance Dashboard - Backend API

REST API backend для дашборда производительности сотрудников, построен на Fastify + MariaDB.

## Установка и запуск

### Prerequisites
- Node.js 22.22.0
- MariaDB 10.5+

### Установка зависимостей
```bash
npm install
```

### Переменные окружения (.env)
```
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=performance_dashboard

# JWT
JWT_SECRET=your-secret-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Запуск миграций
```bash
npm run migrate
```

### Разработка
```bash
npm run dev
```

### Production build
```bash
npm run build
npm start
```

## API Endpoints

### Auth (публичные)
- `POST /api/auth/login` - Вход

### Appeals (требует JWT)
- `GET /api/appeals` - Получить апелляции
- `POST /api/appeals` - Создать апелляцию
- `PATCH /api/appeals/:id` - Обновить статус (только админ)

### Access (требует JWT, только админ)
- `GET /api/access` - Список пользователей
- `POST /api/access` - Добавить пользователя

## Database Schema

### users
Таблица пользователей для авторизации

### appeals
Таблица апелляций от сотрудников

### access_entries
Управление доступом и ролями

## Development

### Lint
```bash
npm run lint
npm run lint:fix
```

### Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

## Architecture

```
src/
├── routes/          # API endpoint handlers
├── middleware/      # Middleware (auth, error handling)
├── db/             # Database utilities
├── utils/          # Helper functions
├── interfaces/     # TypeScript interfaces
├── config/         # Configuration
└── app.ts          # Fastify app setup
```
