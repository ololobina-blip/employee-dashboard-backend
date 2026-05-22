# HTTP API (для будущего подключения фронта)

Префикс: `/api/v1` (настраивается через `API_PREFIX`).

Формат ответа: `{ "success": true, "data": ... }` или `{ "success": false, "error": "..." }`.

## Дашборд (аналог `googleSheetsReal.ts`)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/employees` | Список сотрудников |
| GET | `/employees/:name` | Полный `EmployeeData` (тикеты, статистика, рейтинги) |
| GET | `/employees/:name/tickets` | Только тикеты |
| GET | `/employees/:name/ratings` | Только оценки клиентов |

Имя в URL — с пробелами, URL-encoded (например `Бобур%20Файзиев`).

## Прочее

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/health` | Проверка сервиса |
| GET | `/appeals` | Апелляции из БД (read-only; UI по-прежнему через Apps Script) |
| GET | `/access` | Записи доступа из БД |
| GET | `/sync/status` | Последний sync |
| POST | `/sync/run` | Ручной запуск sync |

## Апелляции

**POST** для подачи/рассмотрения **нет** — фронт использует `VITE_GOOGLE_APPEALS_SCRIPT_URL`.

`GET /appeals` — зеркало из Sheets (колонки Q–W: `reviewComment`, `new*`, `newTotalScore`).  
Тикеты в API используют **effective**-значения (после approved + R–W), как на фронте.

## Пример (после деплоя)

```
GET https://your-backend.up.railway.app/api/v1/employees/Иван%20Иванов
```

## CORS

`CORS_ORIGIN` — URL Vercel или `*` для тестов.
