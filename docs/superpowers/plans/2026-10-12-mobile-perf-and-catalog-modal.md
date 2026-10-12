# Mobile Performance, Caching & Catalog Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Оптимизировать производительность на мобильных устройствах (отключение тяжелого Canvas, облегчение теней, сжатие anime.json, IndexedDB кэш), добавить Dominion в навигацию и внедрить адаптивную модальную карточку аниме с синопсисом в каталоге.

**Architecture:** Вынос фоновой Canvas-анимации на экранах `< 768px` в пользу легковесного CSS, сжатие базы `anime.json` (удаление 60% дублей в полях изображений) с сохранением в IndexedDB, интеграция ссылки на `/dominion` в Navbar и разработка отзывчивого `AnimeDetailModal` (десктоп модалка / мобильный Bottom Sheet) в `Catalog.jsx`.

**Tech Stack:** React 18, Tailwind CSS, Framer Motion, IndexedDB API, Node.js (скрипт оптимизации данных).

**Spec:** `docs/superpowers/specs/2026-10-12-mobile-perf-and-catalog-modal-design.md`

## Global Constraints

- Сохранять существующую цветовую гамму киберпанка (`#070905`, `#BBF351`, `#00E5FF`, `#FF2D78`).
- Сохранять обратную совместимость API структуры данных `anime.json` (`image.original`).
- Все действия на мобильных экранах должны быть дружелюбны к тач-интерфейсу (зоны нажатия не менее 36px, отсутствие зависимости от hover).

---

### Task 1: Mobile Canvas & CSS Performance Optimization

**Files:**
- Modify: `src/components/AsciiAuraBg.jsx:25-45`
- Modify: `src/index.css:42-65`

**Interfaces:**
- `AsciiAuraBg`: React компонент без пропсов. На мобильных экранах (`< 768px` или `(hover: none) and (pointer: coarse)`) не запускает Canvas RAF-цикл и рендерит легкий фоновый CSS контейнер. При неактивной вкладке (`document.hidden`) приостанавливает RAF.

- [ ] **Step 1: Модифицировать `AsciiAuraBg.jsx` для детекции мобильных устройств и видимости вкладки**

В `src/components/AsciiAuraBg.jsx`:
```jsx
export default function AsciiAuraBg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    // Не запускать на мобильных экранах или устройствах без мыши (экономия 30-40% CPU/GPU)
    const isMobile = window.innerWidth < 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (isMobile) return

    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    let isTabVisible = !document.hidden
    let raf = null

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden
      if (isTabVisible && !raf) {
        lastDraw = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // ... в цикле loop:
    function loop(now) {
      if (!isTabVisible) {
        raf = null
        return
      }
      raf = requestAnimationFrame(loop)
      // ... существующая логика отрисовки ...
    }
    raf = requestAnimationFrame(loop)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (raf) cancelAnimationFrame(raf)
      // ... очистка остальных слушателей
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Легковесный CSS-фон на мобилках */}
      <div className="absolute inset-0 md:hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(187,243,81,0.06),rgba(0,0,0,0))]" />
      <canvas ref={canvasRef} className="hidden md:block w-full h-full" />
    </div>
  )
}
```

- [ ] **Step 2: Оптимизировать мобильные тени и блюр в `src/index.css`**

В `src/index.css` добавить оптимизированные свойства под медиа-запрос:
```css
@media (max-width: 768px) {
  .card, .card-hover {
    box-shadow: 0 0 0 1px rgba(187, 243, 81, 0.2), 0 2px 8px -2px rgba(0, 0, 0, 0.5) !important;
  }
}
```

- [ ] **Step 3: Проверить сборку проекта**

Запустить: `npm run build`
Ожидается: успешная сборка без ошибок.

- [ ] **Step 4: Зафиксировать изменения в git**

```bash
git add src/components/AsciiAuraBg.jsx src/index.css
git commit -m "perf: disable heavy canvas RAF on mobile and optimize mobile card shadows"
```

---

### Task 2: Data Cleanup & Minification Script

**Files:**
- Create: `scripts/optimize-anime-data.js`
- Modify: `public/data/anime.json`

**Interfaces:**
- Скрипт читает `public/data/anime.json`, удаляет из объектов `image` ключи `preview`, `x96`, `x48`, оставляя только `original`, форматирует JSON в компактную одну строку без пробелов и перезаписывает файл.

- [ ] **Step 1: Создать скрипт `scripts/optimize-anime-data.js`**

```javascript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.resolve(__dirname, '../public/data/anime.json')

console.log('Reading anime.json...')
const raw = fs.readFileSync(filePath, 'utf8')
const initialSize = Buffer.byteLength(raw, 'utf8')
const data = JSON.parse(raw)

let strippedCount = 0
for (const item of data) {
  if (item.image && typeof item.image === 'object') {
    const original = item.image.original || ''
    item.image = { original }
    strippedCount++
  }
}

console.log(`Stripped redundant image fields from ${strippedCount} items.`)
const minified = JSON.stringify(data)
fs.writeFileSync(filePath, minified, 'utf8')
const finalSize = Buffer.byteLength(minified, 'utf8')

console.log(`Initial size: ${(initialSize / 1024 / 1024).toFixed(2)} MB`)
console.log(`Final size: ${(finalSize / 1024 / 1024).toFixed(2)} MB`)
console.log(`Saved: ${((initialSize - finalSize) / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - finalSize / initialSize) * 100)}% reduction)`)
```

- [ ] **Step 2: Запустить скрипт и проверить результат**

Запустить: `node scripts/optimize-anime-data.js`
Ожидается: Успешное выполнение, уменьшение размера `anime.json` с ~10.2 МБ до ~4.5–5.5 МБ.

- [ ] **Step 3: Проверить корректность структуры данных через node**

Запустить: `node -e "const d = JSON.parse(require('fs').readFileSync('public/data/anime.json', 'utf8')); console.log('Items:', d.length, 'Sample image:', d[0].image);"`
Ожидается: `Items: 15014`, `Sample image: { original: '...' }`.

- [ ] **Step 4: Зафиксировать изменения в git**

```bash
git add scripts/optimize-anime-data.js public/data/anime.json
git commit -m "perf: strip redundant anime image fields and minify dataset"
```

---

### Task 3: IndexedDB Caching Layer in `animeData.js`

**Files:**
- Modify: `src/utils/animeData.js`

**Interfaces:**
- `loadAnimeData(): Promise<Array>`: сначала проверяет память (`cachedData`), затем нативную базу IndexedDB (`xaura_db` / `anime_data`), и только при отсутствии запрашивает `/data/anime.json` по сети, сохраняя результат в IndexedDB для мгновенного доступа в дальнейшем.

- [ ] **Step 1: Реализовать IndexedDB кэширование в `src/utils/animeData.js`**

```javascript
let cachedData = null

const DB_NAME = 'xaura_cache_db'
const DB_VERSION = 1
const STORE_NAME = 'datasets'
const CACHE_KEY = 'anime_data_v1'

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null)
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

async function getFromIndexedDB() {
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(CACHE_KEY)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function saveToIndexedDB(data) {
  try {
    const db = await openDB()
    if (!db) return
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(data, CACHE_KEY)
  } catch {
    // Игнорируем ошибки квоты хранилища
  }
}

export async function loadAnimeData() {
  if (cachedData) return cachedData

  // 1. Попытка прочесть из локального IndexedDB
  const localCached = await getFromIndexedDB()
  if (localCached && Array.isArray(localCached) && localCached.length > 0) {
    cachedData = localCached
    return cachedData
  }

  // 2. Сетевая загрузка, если локально ещё нет
  try {
    const res = await fetch('/data/anime.json')
    if (!res.ok) throw new Error('Failed to load anime data')
    const raw = await res.json()
    cachedData = raw.filter((a) => {
      const img = a.image?.original
      return img && !img.includes('missing_')
    })
    // Сохраняем в фоне в IndexedDB
    saveToIndexedDB(cachedData)
    return cachedData
  } catch (err) {
    console.error('Failed to load local anime data:', err)
    return []
  }
}

export function getCachedData() {
  return cachedData
}
```

- [ ] **Step 2: Проверить сборку проекта**

Запустить: `npm run build`
Ожидается: успешная сборка.

- [ ] **Step 3: Зафиксировать изменения в git**

```bash
git add src/utils/animeData.js
git commit -m "feat: add IndexedDB offline caching for anime dataset"
```

---

### Task 4: Dominion Navigation Integration

**Files:**
- Modify: `src/components/Navbar.jsx:115-125, 230-260, 410-440`
- Modify: `src/pages/Landing.jsx`

**Interfaces:**
- `featureLinks` в `Navbar.jsx`: содержит `{ to: '/dominion', label: 'Доминион', desc: 'Аниме-монополия PvP' }`.
- Мобильное меню в `Navbar.jsx`: включает пункт Доминион с тегом PvP.
- `Landing.jsx`: отображает карточку Доминиона в сетке игровых режимов.

- [ ] **Step 1: Обновить `Navbar.jsx`**

В `src/components/Navbar.jsx`:
1. В массив `featureLinks` добавить объект:
```javascript
{ to: '/dominion', label: 'Доминион', desc: 'Аниме-монополия PvP' },
```
2. В мобильном выпадающем меню убедиться, что отображается ссылка с переходом на `/dominion`.

- [ ] **Step 2: Добавить карточку Доминиона в `Landing.jsx`**

В `src/pages/Landing.jsx` в секцию режимов добавить блок режима «Доминион» со ссылкой на `/dominion`, описанием («Аниме-монополия: покупайте тайтлы, улучшайте франшизы и бросайте кубики в реальном времени») и кнопкой входа.

- [ ] **Step 3: Проверить сборку**

Запустить: `npm run build`
Ожидается: успешная сборка.

- [ ] **Step 4: Зафиксировать изменения в git**

```bash
git add src/components/Navbar.jsx src/pages/Landing.jsx
git commit -m "feat: add Dominion game mode to Navbar and Landing"
```

---

### Task 5: `AnimeDetailModal` Component Implementation

**Files:**
- Create: `src/components/AnimeDetailModal.jsx`

**Interfaces:**
- Пропсы:
  - `anime`: объект аниме (`{ id, name, russian, image, kind, score, aired_on, episodes, genres, description }`)
  - `onClose`: функция закрытия `() => void`
  - `myRating`: объект пользовательской оценки или `null`
  - `onQuickRate`: `(anime, score) => void`
  - `onFullRate`: `(anime) => void`

- [ ] **Step 1: Создать `src/components/AnimeDetailModal.jsx`**

Создать модальное окно с поддержкой мобильного Bottom Sheet на Framer Motion:
- Оверлей с затемнением (`bg-black/80 backdrop-blur-sm`).
- На экранах `< 768px` шторка с закруглением сверху (`rounded-t-2xl bottom-0 fixed inset-x-0 max-h-[88vh] overflow-y-auto`).
- На экранах `>= 768px` центрированное окно (`max-w-2xl rounded-2xl mx-auto`).
- Отображение: постер через `shikimoriImg`, оригинальное и русское название, тип/год/серии, жанровые теги, рейтинг Shikimori, оценка пользователя, синопсис, кнопки быстрой оценки от 1 до 10, кнопка «Подробно (6 шкал)» и закрытие `✕` или по клику на оверлей.

- [ ] **Step 2: Проверить сборку**

Запустить: `npm run build`
Ожидается: успешная сборка.

- [ ] **Step 3: Зафиксировать изменения в git**

```bash
git add src/components/AnimeDetailModal.jsx
git commit -m "feat: create responsive AnimeDetailModal component"
```

---

### Task 6: Catalog Integration & Mobile Tap Experience

**Files:**
- Modify: `src/pages/Catalog.jsx`

**Interfaces:**
- В `Catalog.jsx`:
  - Клик/тап по карточке аниме открывает `AnimeDetailModal`.
  - Мобильный интерфейс избавлен от случайных срабатываний hover-кнопок.
  - Сохранение выставленной оценки синхронизирует локальное состояние `ratingsMap`.

- [ ] **Step 1: Интегрировать `AnimeDetailModal` в `Catalog.jsx`**

В `src/pages/Catalog.jsx`:
1. Импортировать `AnimeDetailModal`:
   `import AnimeDetailModal from '../components/AnimeDetailModal'`
2. Добавить состояние выбранного аниме:
   `const [selectedAnimeModal, setSelectedAnimeModal] = useState(null)`
3. Обновить обработчик клика по карточке: при клике на саму карточку открывать модалку `setSelectedAnimeModal(item)`.
4. Внизу страницы смонтировать модалку:
```jsx
<AnimatePresence>
  {selectedAnimeModal && (
    <AnimeDetailModal
      anime={selectedAnimeModal}
      myRating={ratingsMap[selectedAnimeModal.id]}
      onClose={() => setSelectedAnimeModal(null)}
      onQuickRate={(anime, score) => handleQuickRate(anime, score)}
      onFullRate={(anime) => {
        setSelectedAnimeModal(null)
        handleRate(anime)
      }}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 2: Проверить сборку и работу в dev-сервере**

Запустить: `npm run build`
Ожидается: сборка без ошибок.

- [ ] **Step 3: Зафиксировать изменения в git**

```bash
git add src/pages/Catalog.jsx
git commit -m "feat: integrate AnimeDetailModal into Catalog with touch support"
```

---

### Task 7: Финальная сквозная проверка и верификация

**Files:**
- Все измененные файлы проекта.

- [ ] **Step 1: Выполнить тестовую сборку Vite**
Запустить `npm run build` и убедиться в отсутствии синтаксических или бандл-ошибок.

- [ ] **Step 2: Проверить запуск сервера для API / Socket**
Проверить `npm run dev` или `npx vite build`.
