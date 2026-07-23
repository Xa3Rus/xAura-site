# xAura — Современный сайт для оценки аниме

Современная платформа для оценки аниме с системой Tier List и каталогом. Дизайн в тёмной теме с фиолетовыми акцентами и glassmorphism.

## Стек технологий

**Frontend:**
- React 18 + Vite
- React Router v6
- Axios
- TailwindCSS
- @dnd-kit (drag & drop для Tier List)

**Backend:**
- Netlify Functions (serverless)
- PostgreSQL
- JWT авторизация
- bcrypt

**API:**
- Shikimori API

---

## Установка и запуск

### 1. Клонирование

```bash
git clone <your-repo-url>
cd xaura-site
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
JWT_SECRET=your-super-secret-jwt-key
```

### 4. Инициализация базы данных

Подключитесь к PostgreSQL и выполните SQL из файла:

```bash
psql $DATABASE_URL -f netlify/functions/schema.sql
```

### 5. Запуск в разработке

```bash
npm run dev
```

Локальный сервер: `http://localhost:5173`

Для работы API локально используйте Netlify CLI:

```bash
npx netlify dev
```

---

## Деплой на Netlify

### Вариант 1: Через Netlify CLI

1. Установите Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Войдите в аккаунт:
```bash
npx netlify login
```

3. Инициализируйте проект:
```bash
npx netlify init
```

4. Задайте переменные окружения:
```bash
npx netlify env:set DATABASE_URL "your-database-url"
npx netlify env:set JWT_SECRET "your-jwt-secret"
```

5. Деплой:
```bash
npx netlify deploy --prod
```

### Вариант 2: Через GitHub

1. Загрузите проект на GitHub
2. Перейдите на https://app.netlify.com
3. Нажмите "Add new site" → "Import an existing project"
4. Выберите GitHub репозиторий
5. Настройки сборки:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. В разделе "Environment variables" добавьте:
   - `DATABASE_URL` — строка подключения к PostgreSQL
   - `JWT_SECRET` — секретный ключ для JWT
7. Нажмите "Deploy site"

### Доступ к приложению

После деплоя приложение будет доступно по адресу:
`https://app.netlify.com/teams/super-sasho07/builds`

---

## Структура проекта

```
xaura-site/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml
├── .env.example
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Loader.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Rating.jsx
│   │   ├── Catalog.jsx
│   │   └── Profile.jsx
│   └── utils/
│       └── api.js
└── netlify/
    └── functions/
        ├── db.js
        ├── utils.js
        ├── schema.sql
        ├── auth.js
        ├── ratings.js
        └── anime.js
```

---

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/.netlify/functions/auth/register` | Регистрация |
| POST | `/.netlify/functions/auth/login` | Вход |
| GET | `/.netlify/functions/auth/me` | Текущий пользователь |
| GET | `/.netlify/functions/ratings` | Список оценок |
| POST | `/.netlify/functions/ratings` | Создать оценку |
| POST | `/.netlify/functions/ratings/tier` | Обновить тир |
| GET | `/.netlify/functions/anime` | Прокси к Shikimori API |

---

## Лицензия

MIT
