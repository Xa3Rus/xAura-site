export const CELLS = [
  { id: 0, name: 'Новый сезон', type: 'start', desc: 'Получите 200 за прохождение' },
  { id: 1, name: 'Студия Gainax', type: 'property', group: 'studio', price: 100, rent: [10, 30, 90, 160], color: '#f87171' },
  { id: 2, name: 'Аниме-фестиваль', type: 'event', desc: 'Случайное событие' },
  { id: 3, name: 'Студия Madhouse', type: 'property', group: 'studio', price: 120, rent: [12, 36, 100, 180], color: '#f87171' },
  { id: 4, name: 'Провал сезона', type: 'tax', amount: 100, desc: 'Заплатите 100' },
  { id: 5, name: 'Стриминговый сервис Crunchyroll', type: 'property', group: 'streaming', price: 200, rent: [25, 50, 100, 200], color: '#94a3b8' },
  { id: 6, name: 'Жанр Сёнен', type: 'property', group: 'genre', price: 180, rent: [18, 50, 140, 250], color: '#60a5fa' },
  { id: 7, name: 'Аниме-фестиваль', type: 'event', desc: 'Случайное событие' },
  { id: 8, name: 'Жанр Сэйнэн', type: 'property', group: 'genre', price: 200, rent: [20, 60, 150, 280], color: '#60a5fa' },
  { id: 9, name: 'Жанр Исэкай', type: 'property', group: 'genre', price: 220, rent: [22, 66, 160, 300], color: '#60a5fa' },
  { id: 10, name: 'Заморозка проекта', type: 'jail', desc: 'Тюрьма — пропустите 2 хода' },
  { id: 11, name: 'Студия Toei', type: 'property', group: 'studio', price: 260, rent: [26, 78, 200, 360], color: '#fb923c' },
  { id: 12, name: 'Музыкальный лейбл', type: 'property', group: 'music', price: 150, rent: [25, 50, 100, 200], color: '#facc15' },
  { id: 13, name: 'Студия Kyoto Animation', type: 'property', group: 'studio', price: 280, rent: [28, 84, 220, 400], color: '#fb923c' },
  { id: 14, name: 'Студия Ufotable', type: 'property', group: 'studio', price: 300, rent: [30, 90, 250, 450], color: '#fb923c' },
  { id: 15, name: 'Стриминговый сервис Funimation', type: 'property', group: 'streaming', price: 200, rent: [25, 50, 100, 200], color: '#94a3b8' },
  { id: 16, name: 'Франшиза Наруто', type: 'property', group: 'franchise', price: 320, rent: [32, 96, 260, 480], color: '#2dd4bf' },
  { id: 17, name: 'Аниме-фестиваль', type: 'event', desc: 'Случайное событие' },
  { id: 18, name: 'Франшиза One Piece', type: 'property', group: 'franchise', price: 340, rent: [34, 102, 280, 520], color: '#2dd4bf' },
  { id: 19, name: 'Франшиза Dragon Ball', type: 'property', group: 'franchise', price: 360, rent: [36, 108, 300, 560], color: '#2dd4bf' },
  { id: 20, name: 'Перерыв', type: 'parking', desc: 'Бесплатная парковка — отдохните' },
  { id: 21, name: 'Студия MAPPA', type: 'property', group: 'studio', price: 380, rent: [38, 114, 320, 600], color: '#f43f5e' },
  { id: 22, name: 'Аниме-фестиваль', type: 'event', desc: 'Случайное событие' },
  { id: 23, name: 'Студия Wit Studio', type: 'property', group: 'studio', price: 400, rent: [40, 120, 340, 640], color: '#f43f5e' },
  { id: 24, name: 'Студия Bones', type: 'property', group: 'studio', price: 420, rent: [42, 126, 360, 680], color: '#f43f5e' },
  { id: 25, name: 'Стриминговый сервис HIDIVE', type: 'property', group: 'streaming', price: 200, rent: [25, 50, 100, 200], color: '#94a3b8' },
  { id: 26, name: 'Франшиза Attack on Titan', type: 'property', group: 'franchise', price: 440, rent: [44, 132, 380, 720], color: '#a78bfa' },
  { id: 27, name: 'Провал сезона', type: 'tax', amount: 200, desc: 'Заплатите 200' },
  { id: 28, name: 'Франшиза Demon Slayer', type: 'property', group: 'franchise', price: 460, rent: [46, 138, 400, 760], color: '#a78bfa' },
  { id: 29, name: 'Франшиза Jujutsu Kaisen', type: 'property', group: 'franchise', price: 480, rent: [48, 144, 420, 800], color: '#a78bfa' },
  { id: 30, name: 'Провал сезона', type: 'tax', amount: 300, desc: 'Заплатите 300' },
  { id: 31, name: 'Жанр Меха', type: 'property', group: 'genre', price: 500, rent: [50, 150, 440, 840], color: '#c084fc' },
  { id: 32, name: 'Аниме-фестиваль', type: 'event', desc: 'Случайное событие' },
  { id: 33, name: 'Жанр Романтика', type: 'property', group: 'genre', price: 520, rent: [52, 156, 460, 880], color: '#c084fc' },
  { id: 34, name: 'Лейбл Aniplex', type: 'property', group: 'music', price: 150, rent: [25, 50, 100, 200], color: '#facc15' },
  { id: 35, name: 'Жанр Сёнен-ай', type: 'property', group: 'genre', price: 540, rent: [54, 162, 480, 920], color: '#c084fc' },
  { id: 36, name: 'Стриминговый сервис Bilibili', type: 'property', group: 'streaming', price: 200, rent: [25, 50, 100, 200], color: '#94a3b8' },
  { id: 37, name: 'Франшиза Spy x Family', type: 'property', group: 'franchise', price: 560, rent: [56, 168, 500, 960], color: '#4ade80' },
  { id: 38, name: 'Аниме-фестиваль', type: 'event', desc: 'Случайное событие' },
  { id: 39, name: 'Франшиза Solo Leveling', type: 'property', group: 'franchise', price: 600, rent: [60, 180, 540, 1000], color: '#4ade80' },
]

export const EVENTS = [
  { id: 1, text: 'Выиграл в лотерею! Получите +200', action: 'gain', amount: 200 },
  { id: 2, text: 'Ремонт студии — заплатите -100', action: 'pay', amount: 100 },
  { id: 3, text: 'День рождения! Каждый игрок платит вам +50', action: 'collect_from_all', amount: 50 },
  { id: 4, text: 'Штраф за пиратство — заплатите -75', action: 'pay', amount: 75 },
  { id: 5, text: 'Продали эксклюзивные права! +300', action: 'gain', amount: 300 },
  { id: 6, text: 'Взломали аккаунт — потеряйте -150', action: 'pay', amount: 150 },
  { id: 7, text: 'Награда за лучшее аниме! +100', action: 'gain', amount: 100 },
  { id: 8, text: 'Перейдите на 3 клетки назад', action: 'move_back', amount: 3 },
  { id: 9, text: 'Бонус за активность! +50 от каждого', action: 'collect_from_all', amount: 50 },
  { id: 10, text: 'Пожар на складе — потеряйте 20% денег', action: 'lose_percent', amount: 20 },
  { id: 11, text: 'Нашли спонсора! +250', action: 'gain', amount: 250 },
  { id: 12, text: 'Судебный иск — заплатите -200', action: 'pay', amount: 200 },
]

export const PLAYER_COLORS = ['#f87171', '#60a5fa', '#4ade80', '#c084fc']
export const PLAYER_NAMES = ['Игрок 1', 'Игрок 2', 'Игрок 3', 'Игрок 4']
export const START_BALANCE = 1500
export const PASS_START_BONUS = 200
export const JAIL_POSITION = 10
export const JAIL_TURNS = 2
export const TOTAL_CELLS = 40
