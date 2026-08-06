export const CHANCE_CARDS = [
  { id: 1, text: 'Перейди на Старт. Получи $200', action: 'move', target: 0 },
  { id: 2, text: 'Перейди на ул. Пушкина', action: 'move', target: 39 },
  { id: 3, text: 'Перейди на ул. Маяковского', action: 'move', target: 16 },
  { id: 4, text: 'Перейди на ул. Гоголя', action: 'move', target: 11 },
  { id: 5, text: 'Перейди на ближайшую железную дорогу', action: 'move_to_railroad', direction: 'forward' },
  { id: 6, text: 'Перейди на ближайшую коммунальную службу', action: 'move_to_utility', direction: 'forward' },
  { id: 7, text: 'Банк платит тебе дивиденды $50', action: 'gain', amount: 50 },
  { id: 8, text: 'Выйди из тюрьмы бесплатно', action: 'jail_card' },
  { id: 9, text: 'Вернись на 3 клетки назад', action: 'move_back', amount: 3 },
  { id: 10, text: 'Иди в тюрьму', action: 'go_to_jail' },
  { id: 11, text: 'Ремонт домов: $25 за дом, $100 за отель', action: 'repair', houseCost: 25, hotelCost: 100 },
  { id: 12, text: 'Штраф за превышение скорости $15', action: 'pay', amount: 15 },
  { id: 13, text: 'Перейди на ЖД Северную', action: 'move', target: 35 },
  { id: 14, text: 'Получи $150', action: 'gain', amount: 150 },
  { id: 15, text: 'Штраф за превышение скорости $100', action: 'pay', amount: 100 },
  { id: 16, text: 'Получи $50 от каждого игрока', action: 'collect_from_all', amount: 50 },
]

export default CHANCE_CARDS
