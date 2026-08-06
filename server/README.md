# xAura Game Server

Сервер для онлайн мини-игр xAura (Dominion + Monopoly)

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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3001` |
| `SUPABASE_URL` | URL проекта Supabase | — |
| `SUPABASE_SERVICE_KEY` | Service Role Key из Supabase | — |

## Запуск

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

## SQL миграции

Выполните `server/monopoly/schema.sql` в Supabase SQL Editor для создания таблиц.

## Деплой

### Render (рекомендуется)
1. Создайте Web Service на render.com
2. Подключите репозиторий
3. Build Command: `cd server && npm install`
4. Start Command: `node index.js`
5. Переменные: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

### Railway
```bash
railway login
railway init
railway up
```

## API

WebSocket: `ws://localhost:3001`

### Авторизация
Клиент отправляет Supabase JWT токен при подключении:
```js
const socket = io(SERVER_URL, {
  auth: { token: supabaseAccessToken }
})
```

### События клиента (Monopoly)

| Событие | Описание |
|---|---|
| `room:create` | Создать комнату |
| `room:join` (code) | Присоединиться |
| `room:leave` | Покинуть |
| `room:start` | Начать (хост) |
| `game:rollDice` | Бросить кубики |
| `game:buy` | Купить собственность |
| `game:declineBuy` | Отказаться (→ аукцион) |
| `game:payRent` | Заплатить аренду |
| `game:endTurn` | Завершить ход |
| `game:buildHouse` | Построить дом |
| `game:buildHotel` | Построить отель |
| `game:mortgage` | Заложить |
| `game:payJail` | Заплатить за выход |
| `chat:send` | Отправить сообщение |
| `chat:private` | Личное сообщение |
| `trade:offer` | Предложить обмен |
| `trade:accept` | Принять обмен |
| `auction:bid` | Ставка на аукционе |

### События сервера

| Событие | Описание |
|---|---|
| `room:updated` | Обновление комнаты |
| `game:started` | Игра начата |
| `game:updated` | Обновление состояния |
| `chat:message` | Сообщение |
| `auction:started` | Аукцион начат |
| `auction:ended` | Аукцион завершён |
| `trade:offered` | Предложение обмена |
| `error` | Ошибка |
