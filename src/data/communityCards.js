export const COMMUNITY_CARDS = [
  { id: 1, text: 'Иди на Старт. Получи $200', action: 'move', target: 0 },
  { id: 2, text: 'Ошибка банка в твою пользу. Получи $200', action: 'gain', amount: 200 },
  { id: 3, text: 'Оплата медицины $50', action: 'pay', amount: 50 },
  { id: 4, text: 'Налог на продажи $50', action: 'pay', amount: 50 },
  { id: 5, text: 'Тебе 18 лет! Получи $100', action: 'gain', amount: 100 },
  { id: 6, text: 'Выйди из тюрьмы бесплатно', action: 'jail_card' },
  { id: 7, text: 'Иди в тюрьму', action: 'go_to_jail' },
  { id: 8, text: 'Оплата страховки $100', action: 'pay', amount: 100 },
  { id: 9, text: 'Получи $20', action: 'gain', amount: 20 },
  { id: 10, text: 'Получи $100 от каждого игрока (день рождения)', action: 'collect_from_all', amount: 100 },
  { id: 11, text: 'Доход от инвестиций $25', action: 'gain', amount: 25 },
  { id: 12, text: 'Ремонт зданий: $40 за дом, $115 за отель', action: 'repair', houseCost: 40, hotelCost: 115 },
  { id: 13, text: 'Получи $10', action: 'gain', amount: 10 },
  { id: 14, text: 'Получи $100', action: 'gain', amount: 100 },
  { id: 15, text: 'Оплата больничных $50', action: 'pay', amount: 50 },
  { id: 16, text: 'Получи $25 за услуги', action: 'gain', amount: 25 },
]

export default COMMUNITY_CARDS
