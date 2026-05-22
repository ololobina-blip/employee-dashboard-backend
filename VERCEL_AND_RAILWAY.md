# Связка Vercel (фронт) ↔ Railway (бэк)

## Что взять из Vercel → в бэк (Railway Variables)

1. Откройте [vercel.com](https://vercel.com) → ваш проект дашборда.
2. **Settings → Domains**
3. Скопируйте **Production** URL, например:
   - `https://employee-performance-dashboard.vercel.app`
   - или ваш кастомный домен `https://dashboard.company.com`

4. В Railway → сервис **backend** → **Variables**:

```env
FRONTEND_URL=https://ваш-проект.vercel.app
```

Без слэша в конце. Этого достаточно для CORS.

Опционально несколько доменов (production + preview):

```env
FRONTEND_URL=https://ваш-проект.vercel.app
CORS_ORIGIN=https://ваш-проект-git-main-user.vercel.app
```

`CORS_ORIGIN` добавляет ещё origins через запятую.

---

## Что взять из Railway → в Vercel (когда подключите фронт к API)

Пока фронт **не обязан** это иметь. Когда переключите дашборд с Sheets на бэк:

1. Railway → сервис **backend** → **Settings → Networking** → **Public URL**, например:
   - `https://employee-dashboard-backend-production.up.railway.app`

2. Vercel → проект фронта → **Settings → Environment Variables**:

```env
VITE_API_URL=https://ваш-бэк.up.railway.app
```

(без `/api/v1` в конце — префикс добавится в коде фронта при интеграции)

3. В Railway у backend:

```env
PUBLIC_API_URL=https://ваш-бэк.up.railway.app
```

— для ответа `/api/v1/meta` (подсказка фронту).

---

## Что НЕ копировать между Vercel и Railway

| Переменная | Где живёт |
|------------|-----------|
| `VITE_GOOGLE_SPREADSHEET_ID` | Только Vercel (фронт) |
| `VITE_GOOGLE_API_KEY` | Только Vercel (фронт) |
| `VITE_GOOGLE_APPEALS_SCRIPT_URL` | Только Vercel (апелляции) |
| `GOOGLE_SHEETS_ID` / `GOOGLE_API_KEY` | Railway backend (sync) |
| `DB_*` | Только Railway backend |

---

## Проверка CORS

После деплоя бэка с `FRONTEND_URL`:

```bash
curl -H "Origin: https://ваш-проект.vercel.app" \
  https://ваш-бэк.up.railway.app/api/v1/health
```

В ответе должен быть заголовок `access-control-allow-origin` с вашим Vercel URL.

---

## Сейчас vs потом

| Сейчас | Потом |
|--------|--------|
| `FRONTEND_URL` в Railway — CORS готов | `VITE_API_URL` в Vercel — фронт читает API |
| Фронт всё ещё Sheets | Один PR только на `src/` |
