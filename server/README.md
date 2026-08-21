# xAura Game Server

Сервер для онлайн мини-игр xAura (Dominion + Драфт сезона)

## Зависимости

- Node.js 18+
- npm

## Установка

```bash
cd server
npm install
```

## Переменные окружения

Создайте `.env` файл:

```
PORT=3001
CLIENT_URL=https://your-frontend-url
```

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3001` |
| `CLIENT_URL` | Разрешённые CORS-источники клиента (через запятую) | — |

## Запуск

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

## Деплой

Схема прода: фронт — статика на Netlify, этот сервер — Web Service на Render.
Netlify не держит постоянные websocket-соединения, поэтому socket.io-сервер
живёт на Render, а фронт подключается к нему по адресу из `VITE_SOCKET_URL`.

### Render
1. Создайте Web Service на render.com (или используйте существующий — `render.yaml` в корне репозитория)
2. Подключите репозиторий, root dir: `server`
3. Build Command: `npm install`, Start Command: `npm start`
4. Переменные: `CLIENT_URL=https://<ваш-сайт>.netlify.app`
5. После деплоя адрес сервиса (вида `https://<имя>.onrender.com`) — это `VITE_SOCKET_URL`

### Netlify
1. Site settings → Environment variables → добавьте `VITE_SOCKET_URL=https://<имя>.onrender.com`
2. Пересоберите сайт (Deploy → Trigger deploy) — переменная вшивается в бандл при сборке

На бесплатном тарифе Render сервис засыпает после ~15 минут бездействия:
первое подключение к драфту может занять до 30 секунд, пока сервис просыпается.

### Railway
```bash
railway login
railway init
railway up
```

## API

WebSocket: `ws://localhost:3001`

### Авторизация
Клиент отправляет идентификатор пользователя при подключении:
```js
const socket = io(SERVER_URL, {
  auth: { userId, username }
})
```

### Основные события клиента

| Событие | Описание |
|---|---|
| `room:create` | Создать комнату |
| `room:join` (code) | Присоединиться |
| `room:leave` | Покинуть |
| `room:start` | Начать (хост) |
| `game:action` | Действие в игре |
| `chat:send` | Сообщение в чат |
| `trade:offer` / `trade:accept` / `trade:decline` | Обмен |
