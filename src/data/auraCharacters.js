// Каталог персонажей «Путь ауры»: мем-гифки по уровням ауры.
// Гифки проверены (HTTP 200, image/gif|webp), лениво загружаются через <picture>.

const gif = (id) => ({
  webp: `https://i.giphy.com/media/${id}/giphy.webp`,
  gif: `https://media.giphy.com/media/${id}/giphy.gif`,
})

// index = Math.floor((level - 1) / 2) — совпадает с AURA_TITLES в utils/aura.js
export const AURA_CHARACTERS = [
  {
    title: 'Новичок',
    levels: [1, 2],
    name: 'СУБАРУ',
    anime: 'Re:Zero',
    quote: 'Умру — и вернусь фармит ауру заново',
    accent: '#BBF351',
    chips: ['+12 XP', 'Return by Death'],
    ...gif('mSVGTMHDu6NoXkmcpJ'),
  },
  {
    title: 'Зритель',
    levels: [3, 4],
    name: 'ЮИЧИ КАТАГИРИ',
    anime: 'Tomodachi Game',
    quote: 'Дружба — лучшая маска для стратегии',
    accent: '#00E5FF',
    chips: ['+40 XP', 'всё по плану'],
    ...gif('YZ9XczGLkz1e6U11W9'),
  },
  {
    title: 'Критик',
    levels: [5, 6],
    name: 'ЛЕЛУШ',
    anime: 'Code Geass',
    quote: 'Лелуш ви Британия повелевает: оцени это',
    accent: '#BF5AF2',
    chips: ['+8 XP', 'GEASS'],
    ...gif('e9U5tYwBssdLG'),
  },
  {
    title: 'Аналитик',
    levels: [7, 8],
    name: 'ЛАЙТ',
    anime: 'Death Note',
    quote: 'Я буду оценивать аниме… по справедливости',
    accent: '#FF3366',
    chips: ['12/10', 'Кира одобряет'],
    ...gif('yezhIhuUTOfVqXo9gM'),
  },
  {
    title: 'Эксперт',
    levels: [9, 10],
    name: 'ЛЕВИ',
    anime: 'Attack on Titan',
    quote: 'Не зевай. Оцени.',
    accent: '#A8C6E0',
    chips: ['+100 XP', 'rotary slash'],
    ...gif('XmxJ1cGQ7EZt0PISkN'),
  },
  {
    title: 'Мастер',
    levels: [11, 12],
    name: 'ГОКУ',
    anime: 'Dragon Ball Super',
    quote: 'Ультра Инстинкт — оценка ставится сама',
    accent: '#7DD8FF',
    chips: ['+500 XP', 'MUI'],
    ...gif('41exVPLrgjbZSqWP0n'),
  },
  {
    title: 'Легенда',
    levels: [13, 14],
    name: 'МАДАРА',
    anime: 'Naruto',
    quote: 'Пробуди… свою ауру',
    accent: '#C04851',
    chips: ['+1000 XP', 'сутано'],
    ...gif('BbZSiMUyoUF8VlgkXj'),
  },
  {
    title: 'Бог аниме',
    levels: [15, 99],
    name: 'ГОДЖО',
    anime: 'Jujutsu Kaisen',
    quote: 'Во всём Поднебесной лишь я достоин 10/10',
    accent: '#7B8CFF',
    chips: ['+∞ XP', '六眼神'],
    ...gif('QSwBid1bso4h5ePFnN'),
  },
]

// Персонаж текущего уровня ауры
export function getAuraCharacter(level = 1) {
  const idx = Math.min(AURA_CHARACTERS.length - 1, Math.max(0, Math.floor((level - 1) / 2)))
  return AURA_CHARACTERS[idx]
}
