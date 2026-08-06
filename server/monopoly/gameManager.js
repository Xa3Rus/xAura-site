import { BOARD, COLOR_GROUPS } from './boardData.js';

const TOTAL_CELLS = 40;
const GO_POSITION = 0;
const JAIL_POSITION = 10;
const GO_TO_JAIL_POSITION = 30;
const JAIL_FINE = 50;
const GO_SALARY = 200;
const MAX_JAIL_TURNS = 3;
const MORTGAGE_UNMORTGAGE_RATE = 1.1;

const CHANCE_CARDS = [
  { id: 'ch1', text: 'Перейдите на Старт. Получите 200', action: 'moveTo', target: 0 },
  { id: 'ch2', text: 'Идите в тюрьму', action: 'goToJail' },
  { id: 'ch3', text: 'Отремонтируйте дома. Заплатите 25 за дом и 100 за отель', action: 'repair', houseCost: 25, hotelCost: 100 },
  { id: 'ch4', text: 'Ваши акции подешевели. Заплатите 50', action: 'pay', amount: 50 },
  { id: 'ch5', text: 'Вышли из тюрьмы бесплатно', action: 'getOutOfJail' },
  { id: 'ch6', text: 'Идите на Ул. Толстого', action: 'moveTo', target: 9 },
  { id: 'ch7', text: 'Идите на ЖД Южную', action: 'moveTo', target: 15 },
  { id: 'ch8', text: 'Идите на Ул. Блока', action: 'moveTo', target: 19 },
  { id: 'ch9', text: 'Идите на ЖД Северную', action: 'moveTo', target: 35 },
  { id: 'ch10', text: 'Идите на Ул. Гоголя', action: 'moveTo', target: 11 },
  { id: 'ch11', text: 'Банк выплачивает вам дивиденды 50', action: 'receive', amount: 50 },
  { id: 'ch12', text: 'Ваш кредит истек. Получите 150', action: 'receive', amount: 150 },
  { id: 'ch13', text: 'Идите на Ул. Шолохова', action: 'moveTo', target: 31 },
  { id: 'ch14', text: 'Идите на ближайшую ЖД', action: 'moveToNearestRailroad' },
  { id: 'ch15', text: 'Идите на ближайшую коммунальную', action: 'moveToNearestUtility' },
  { id: 'ch16', text: 'Вернитесь на 3 клетки назад', action: 'moveBack', steps: 3 }
];

const COMMUNITY_CARDS = [
  { id: 'cm1', text: 'Перейдите на Старт. Получите 200', action: 'moveTo', target: 0 },
  { id: 'cm2', text: 'Идите в тюрьму', action: 'goToJail' },
  { id: 'cm3', text: 'Банковская ошибка. Получите 200', action: 'receive', amount: 200 },
  { id: 'cm4', text: 'Вышли из тюрьмы бесплатно', action: 'getOutOfJail' },
  { id: 'cm5', text: 'Оплата врача. Заплатите 50', action: 'pay', amount: 50 },
  { id: 'cm6', text: 'День рождения. Получите 10 от каждого игрока', action: 'birthday', amount: 10 },
  { id: 'cm7', text: 'Страховая выплата. Получите 100', action: 'receive', amount: 100 },
  { id: 'cm8', text: 'Плата за обучение. Заплатите 50', action: 'pay', amount: 50 },
  { id: 'cm9', text: 'Консультационный гонорар. Получите 25', action: 'receive', amount: 25 },
  { id: 'cm10', text: 'Выигрыш в лотерее. Получите 100', action: 'receive', amount: 100 },
  { id: 'cm11', text: 'Возврат налогов. Получите 20', action: 'receive', amount: 20 },
  { id: 'cm12', text: 'Инфекция в больнице. Заплатите 100', action: 'pay', amount: 100 },
  { id: 'cm13', text: 'Рождение ребенка. Заплатите 25', action: 'pay', amount: 25 },
  { id: 'cm14', text: 'Отремонтируйте дома. Заплатите 40 за дом и 115 за отель', action: 'repair', houseCost: 40, hotelCost: 115 },
  { id: 'cm15', text: 'Выигрыш в турнире. Получите 10', action: 'receive', amount: 10 },
  { id: 'cm16', text: 'Консультация. Заплатите 100', action: 'pay', amount: 100 }
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getPlayer(game, userId) {
  return game.players.find(p => p.userId === userId);
}

function getCell(cellIndex) {
  return BOARD[cellIndex];
}

function getPropertiesOwnedBy(game, userId) {
  return game.players.find(p => p.userId === userId).properties;
}

function getOwner(game, cellIndex) {
  const prop = game.properties[cellIndex];
  return prop ? prop.ownerId : null;
}

function getPropertyEntry(game, cellIndex) {
  if (!game.properties[cellIndex]) {
    game.properties[cellIndex] = { ownerId: null, houses: 0, hotel: false, isMortgaged: false };
  }
  return game.properties[cellIndex];
}

function getPlayerIndex(game, userId) {
  return game.players.findIndex(p => p.userId === userId);
}

function getActivePlayers(game) {
  return game.players.filter(p => !p.isBankrupt);
}

function addEvent(events, event) {
  events.push(event);
}

export function createGame(players) {
  const game = {
    roomId: '',
    players: players.map((p, i) => ({
      userId: p.userId,
      username: p.username,
      color: p.color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      position: 0,
      balance: 1500,
      properties: [],
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      getOutOfJailCards: 0,
      doublesCount: 0
    })),
    properties: {},
    currentPlayerIndex: 0,
    diceResult: [0, 0],
    phase: 'roll',
    pendingAction: null,
    pendingCellIndex: null,
    chanceCards: shuffle(CHANCE_CARDS),
    communityCards: shuffle(COMMUNITY_CARDS),
    bank: { houses: 32, hotels: 12 },
    turnHistory: [],
    winner: null
  };
  return game;
}

export function rollDice(game) {
  const events = [];
  const player = game.players[game.currentPlayerIndex];

  if (game.phase !== 'roll') {
    return { result: null, events: [{ type: 'error', message: 'Нельзя бросить кубики сейчас' }] };
  }

  if (player.isBankrupt) {
    endTurn(game, player.userId);
    return { result: null, events: [{ type: 'info', message: 'Игрок банкрот. Ход пропущен' }] };
  }

  if (player.inJail) {
    return handleJailRoll(game, player, events);
  }

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const isDoubles = d1 === d2;
  game.diceResult = [d1, d2];

  let result = { d1, d2, isDoubles, newPosition: player.position, passedGo: false, goToJail: false };

  if (isDoubles) {
    player.doublesCount++;
    if (player.doublesCount >= 3) {
      player.doublesCount = 0;
      game.phase = 'action';
      goToJail(game, player.userId);
      addEvent(events, { type: 'jail', message: `${player.username} получил 3 дубля и идет в тюрьму!` });
      result.goToJail = true;
      return { result, events };
    }
    addEvent(events, { type: 'doubles', message: `${player.username} выбросил дубль (${d1}, ${d2})!` });
  } else {
    player.doublesCount = 0;
  }

  const oldPosition = player.position;
  let newPosition = (oldPosition + d1 + d2) % TOTAL_CELLS;
  const passedGo = (oldPosition + d1 + d2) >= TOTAL_CELLS;

  if (passedGo) {
    player.balance += GO_SALARY;
    addEvent(events, { type: 'passGo', message: `${player.username} перешел через Старт и получил $${GO_SALARY}` });
  }

  player.position = newPosition;
  result.newPosition = newPosition;
  result.passedGo = passedGo;

  const cell = getCell(newPosition);
  addEvent(events, { type: 'move', message: `${player.username} переместился на клетку ${newPosition}: ${cell.name}` });

  const cellEvents = handleCellLanding(game, player, newPosition);
  events.push(...cellEvents);

  if (!player.inJail) {
    game.phase = 'action';
  }

  return { result, events };
}

function handleJailRoll(game, player, events) {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const isDoubles = d1 === d2;
  game.diceResult = [d1, d2];

  const result = { d1, d2, isDoubles, jailRoll: true, released: false };

  if (isDoubles) {
    player.inJail = false;
    player.jailTurns = 0;
    player.doublesCount = 0;
    addEvent(events, { type: 'jailRelease', message: `${player.username} выбросил дубль (${d1}, ${d2}) и вышел из тюрьмы!` });
    result.released = true;
    const cellEvents = handleCellLanding(game, player, player.position);
    events.push(...cellEvents);
    game.phase = 'action';
  } else {
    player.jailTurns++;
    if (player.jailTurns >= MAX_JAIL_TURNS) {
      player.balance -= JAIL_FINE;
      player.inJail = false;
      player.jailTurns = 0;
      addEvent(events, { type: 'jailForcedPay', message: `${player.username} заплатил $${JAIL_FINE} за 3 попытки в тюрьме` });
      const cellEvents = handleCellLanding(game, player, player.position);
      events.push(...cellEvents);
      game.phase = 'action';
    } else {
      addEvent(events, { type: 'jailFail', message: `${player.username} не выбросил дубль (${d1}, ${d2}). Попытка ${player.jailTurns}/${MAX_JAIL_TURNS}` });
      game.phase = 'action';
    }
  }

  return { result, events };
}

function handleCellLanding(game, player, position) {
  const events = [];
  const cell = getCell(position);

  switch (cell.type) {
    case 'go':
      break;
    case 'jail':
      addEvent(events, { type: 'info', message: `${player.username} на визите в тюрьме` });
      break;
    case 'gotojail':
      goToJail(game, player.userId);
      addEvent(events, { type: 'jail', message: `${player.username} отправлен в тюрьму!` });
      break;
    case 'tax':
      player.balance -= cell.amount;
      addEvent(events, { type: 'tax', message: `${player.username} заплатил налог $${cell.amount}` });
      break;
    case 'chance':
      addEvent(events, ...drawCard(game, 'chance'));
      break;
    case 'community':
      addEvent(events, ...drawCard(game, 'community'));
      break;
    case 'property':
    case 'railroad':
    case 'utility':
      const owner = getOwner(game, position);
      if (owner && owner !== player.userId) {
        const entry = getPropertyEntry(game, position);
        if (!entry.isMortgaged) {
          const rent = calculateRent(game, position);
          if (player.balance >= rent) {
            player.balance -= rent;
            const ownerPlayer = getPlayer(game, owner);
            if (ownerPlayer) {
              ownerPlayer.balance += rent;
            }
            addEvent(events, { type: 'rent', message: `${player.username} заплатил ренту $${rent} игроку ${ownerPlayer?.username || owner}` });
          } else {
            addEvent(events, { type: 'bankrupt', message: `${player.username} не может заплатить ренту $${rent}` });
            handleBankruptcy(game, player.userId, owner);
          }
        } else {
          addEvent(events, { type: 'info', message: `${cell.name} заложена. Рента не взимается` });
        }
      } else if (!owner) {
        game.pendingAction = 'buy_offer';
        game.pendingCellIndex = position;
        addEvent(events, { type: 'info', message: `${player.username} может купить ${cell.name} за $${cell.price}` });
      }
      break;
    case 'parking':
      addEvent(events, { type: 'info', message: `${player.username} на бесплатной парковке` });
      break;
  }

  return events;
}

export function buyProperty(game, userId, cellIndex) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  const cell = getCell(cellIndex);
  if (!cell || !['property', 'railroad', 'utility'].includes(cell.type)) {
    return { success: false, events: [{ type: 'error', message: 'Нельзя купить эту клетку' }] };
  }

  const entry = getPropertyEntry(game, cellIndex);
  if (entry.ownerId) {
    return { success: false, events: [{ type: 'error', message: 'Клетка уже куплена' }] };
  }

  if (player.balance < cell.price) {
    return { success: false, events: [{ type: 'error', message: 'Недостаточно денег' }] };
  }

  player.balance -= cell.price;
  entry.ownerId = userId;
  player.properties.push(cellIndex);
  game.pendingAction = null;
  game.pendingCellIndex = null;

  addEvent(events, { type: 'buy', message: `${player.username} купил ${cell.name} за $${cell.price}` });

  return { success: true, events };
}

export function declineBuy(game, userId) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  game.pendingAction = null;
  game.pendingCellIndex = null;

  addEvent(events, { type: 'decline', message: `${player.username} отказался от покупки` });
  game.phase = 'auction';

  return { success: true, events };
}

export function payRent(game, userId) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  const entry = getPropertyEntry(game, player.position);
  if (!entry.ownerId || entry.ownerId === userId) {
    return { success: false, events: [{ type: 'error', message: 'Нет аренды для оплаты' }] };
  }

  if (entry.isMortgaged) {
    return { success: false, events: [{ type: 'error', message: 'Клетка заложена' }] };
  }

  const rent = calculateRent(game, player.position);
  if (player.balance < rent) {
    return { success: false, events: [{ type: 'error', message: 'Недостаточно денег' }] };
  }

  player.balance -= rent;
  const ownerPlayer = getPlayer(game, entry.ownerId);
  if (ownerPlayer) {
    ownerPlayer.balance += rent;
  }

  addEvent(events, { type: 'rent', message: `${player.username} заплатил ренту $${rent}` });
  return { success: true, events };
}

export function endTurn(game, userId) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  game.pendingAction = null;
  game.pendingCellIndex = null;

  const wasDoubles = game.diceResult[0] === game.diceResult[1] && game.diceResult[0] !== 0;
  const stillInJail = player.inJail;

  if (wasDoubles && !stillInJail && !player.isBankrupt) {
    addEvent(events, { type: 'info', message: `${player.username} выбросил дубль и ходит снова!` });
    game.phase = 'roll';
    return { success: true, events, samePlayer: true };
  }

  player.doublesCount = 0;

  const activePlayers = getActivePlayers(game);
  if (activePlayers.length <= 1) {
    game.winner = activePlayers[0]?.userId || null;
    game.phase = 'roll';
    addEvent(events, { type: 'winner', message: `Игра окончена! Победитель: ${activePlayers[0]?.username || 'Никто'}` });
    return { success: true, events };
  }

  let nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  while (game.players[nextIndex].isBankrupt) {
    nextIndex = (nextIndex + 1) % game.players.length;
    if (nextIndex === game.currentPlayerIndex) break;
  }
  game.currentPlayerIndex = nextIndex;
  game.phase = 'roll';

  const nextPlayer = game.players[nextIndex];
  addEvent(events, { type: 'turn', message: `Ход переходит к ${nextPlayer.username}` });

  return { success: true, events, samePlayer: false };
}

export function buildHouse(game, userId, cellIndex) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  const cell = getCell(cellIndex);
  if (!cell || cell.type !== 'property') {
    return { success: false, events: [{ type: 'error', message: 'Можно строить только на свойствах' }] };
  }

  const entry = getPropertyEntry(game, cellIndex);
  if (entry.ownerId !== userId) {
    return { success: false, events: [{ type: 'error', message: 'Клетка не принадлежит вам' }] };
  }

  if (entry.isMortgaged) {
    return { success: false, events: [{ type: 'error', message: 'Клетка заложена' }] };
  }

  if (!checkMonopoly(game, cell.color)) {
    return { success: false, events: [{ type: 'error', message: 'Нужно владеть всеми клетками цвета' }] };
  }

  if (entry.hotel) {
    return { success: false, events: [{ type: 'error', message: 'Уже есть отель' }] };
  }

  if (entry.houses >= 4) {
    return { success: false, events: [{ type: 'error', message: 'Сначала постройте отель' }] };
  }

  if (game.bank.houses <= 0) {
    return { success: false, events: [{ type: 'error', message: 'Банк не имеет домов' }] };
  }

  if (player.balance < cell.housePrice) {
    return { success: false, events: [{ type: 'error', message: 'Недостаточно денег' }] };
  }

  const colorProperties = COLOR_GROUPS[cell.color];
  const minHouses = Math.min(...colorProperties.map(idx => {
    const e = getPropertyEntry(game, idx);
    return e.ownerId === userId ? e.houses : 0;
  }));

  if (entry.houses > minHouses) {
    return { success: false, events: [{ type: 'error', message: 'Стройте равномерно!' }] };
  }

  player.balance -= cell.housePrice;
  entry.houses++;
  game.bank.houses--;

  addEvent(events, { type: 'build', message: `${player.username} построил дом на ${cell.name} за $${cell.housePrice}` });
  return { success: true, events };
}

export function buildHotel(game, userId, cellIndex) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  const cell = getCell(cellIndex);
  if (!cell || cell.type !== 'property') {
    return { success: false, events: [{ type: 'error', message: 'Можно строить только на свойствах' }] };
  }

  const entry = getPropertyEntry(game, cellIndex);
  if (entry.ownerId !== userId) {
    return { success: false, events: [{ type: 'error', message: 'Клетка не принадлежит вам' }] };
  }

  if (entry.isMortgaged) {
    return { success: false, events: [{ type: 'error', message: 'Клетка заложена' }] };
  }

  if (!checkMonopoly(game, cell.color)) {
    return { success: false, events: [{ type: 'error', message: 'Нужно владеть всеми клетками цвета' }] };
  }

  if (entry.hotel) {
    return { success: false, events: [{ type: 'error', message: 'Уже есть отель' }] };
  }

  if (entry.houses !== 4) {
    return { success: false, events: [{ type: 'error', message: 'Нужно 4 дома для отеля' }] };
  }

  if (game.bank.hotels <= 0) {
    return { success: false, events: [{ type: 'error', message: 'Банк не имеет отелей' }] };
  }

  if (player.balance < cell.housePrice) {
    return { success: false, events: [{ type: 'error', message: 'Недостаточно денег' }] };
  }

  const colorProperties = COLOR_GROUPS[cell.color];
  const minHouses = Math.min(...colorProperties.map(idx => {
    const e = getPropertyEntry(game, idx);
    return e.ownerId === userId ? e.houses : 4;
  }));

  if (minHouses < 4) {
    return { success: false, events: [{ type: 'error', message: 'Стройте равномерно!' }] };
  }

  player.balance -= cell.housePrice;
  entry.houses = 0;
  entry.hotel = true;
  game.bank.houses += 4;
  game.bank.hotels--;

  addEvent(events, { type: 'build', message: `${player.username} построил отель на ${cell.name} за $${cell.housePrice}` });
  return { success: true, events };
}

export function sellHouse(game, userId, cellIndex) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  const cell = getCell(cellIndex);
  if (!cell || cell.type !== 'property') {
    return { success: false, events: [{ type: 'error', message: 'Можно продавать только свойства' }] };
  }

  const entry = getPropertyEntry(game, cellIndex);
  if (entry.ownerId !== userId) {
    return { success: false, events: [{ type: 'error', message: 'Клетка не принадлежит вам' }] };
  }

  if (entry.hotel) {
    entry.hotel = false;
    entry.houses = 4;
    game.bank.hotels++;
    const sellPrice = Math.floor(cell.housePrice / 2);
    player.balance += sellPrice;
    addEvent(events, { type: 'sell', message: `${player.username} продал отель на ${cell.name} за $${sellPrice}` });
    return { success: true, events };
  }

  if (entry.houses <= 0) {
    return { success: false, events: [{ type: 'error', message: 'Нет домов для продажи' }] };
  }

  const colorProperties = COLOR_GROUPS[cell.color];
  const maxHouses = Math.max(...colorProperties.map(idx => {
    const e = getPropertyEntry(game, idx);
    return e.ownerId === userId ? e.houses : 0;
  }));

  if (entry.houses < maxHouses) {
    return { success: false, events: [{ type: 'error', message: 'Продавайте равномерно!' }] };
  }

  entry.houses--;
  game.bank.houses++;
  const sellPrice = Math.floor(cell.housePrice / 2);
  player.balance += sellPrice;
  addEvent(events, { type: 'sell', message: `${player.username} продал дом на ${cell.name} за $${sellPrice}` });
  return { success: true, events };
}

export function mortgageProperty(game, userId, cellIndex) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  const cell = getCell(cellIndex);
  if (!cell || !['property', 'railroad', 'utility'].includes(cell.type)) {
    return { success: false, events: [{ type: 'error', message: 'Нельзя заложить эту клетку' }] };
  }

  const entry = getPropertyEntry(game, cellIndex);
  if (entry.ownerId !== userId) {
    return { success: false, events: [{ type: 'error', message: 'Клетка не принадлежит вам' }] };
  }

  if (entry.isMortgaged) {
    return { success: false, events: [{ type: 'error', message: 'Уже заложена' }] };
  }

  if (entry.houses > 0 || entry.hotel) {
    return { success: false, events: [{ type: 'error', message: 'Сначала продайте все дома' }] };
  }

  if (cell.type === 'property' && checkMonopoly(game, cell.color)) {
    const colorProperties = COLOR_GROUPS[cell.color];
    const hasBuildings = colorProperties.some(idx => {
      const e = getPropertyEntry(game, idx);
      return (e.houses > 0 || e.hotel) && e.ownerId === userId;
    });
    if (hasBuildings) {
      return { success: false, events: [{ type: 'error', message: 'Сначала продайте дома на других клетках цвета' }] };
    }
  }

  entry.isMortgaged = true;
  const mortgageValue = cell.mortgageValue;
  player.balance += mortgageValue;

  addEvent(events, { type: 'mortgage', message: `${player.username} заложил ${cell.name} за $${mortgageValue}` });
  return { success: true, events };
}

export function unmortgageProperty(game, userId, cellIndex) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  const cell = getCell(cellIndex);
  if (!cell || !['property', 'railroad', 'utility'].includes(cell.type)) {
    return { success: false, events: [{ type: 'error', message: 'Нельзя снять с заклада эту клетку' }] };
  }

  const entry = getPropertyEntry(game, cellIndex);
  if (entry.ownerId !== userId) {
    return { success: false, events: [{ type: 'error', message: 'Клетка не принадлежит вам' }] };
  }

  if (!entry.isMortgaged) {
    return { success: false, events: [{ type: 'error', message: 'Клетка не заложена' }] };
  }

  const unmortgagePrice = Math.ceil(cell.mortgageValue * MORTGAGE_UNMORTGAGE_RATE);
  if (player.balance < unmortgagePrice) {
    return { success: false, events: [{ type: 'error', message: `Недостаточно денег. Нужно $${unmortgagePrice}` }] };
  }

  entry.isMortgaged = false;
  player.balance -= unmortgagePrice;

  addEvent(events, { type: 'unmortgage', message: `${player.username} снял ${cell.name} с заклада за $${unmortgagePrice}` });
  return { success: true, events };
}

export function goToJail(game, userId) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  player.position = JAIL_POSITION;
  player.inJail = true;
  player.jailTurns = 0;
  player.doublesCount = 0;

  addEvent(events, { type: 'jail', message: `${player.username} отправлен в тюрьму!` });
  return { success: true, events };
}

export function payJailFine(game, userId) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  if (!player.inJail) {
    return { success: false, events: [{ type: 'error', message: 'Вы не в тюрьме' }] };
  }

  if (player.balance < JAIL_FINE) {
    return { success: false, events: [{ type: 'error', message: 'Недостаточно денег для штрафа' }] };
  }

  player.balance -= JAIL_FINE;
  player.inJail = false;
  player.jailTurns = 0;

  addEvent(events, { type: 'jailRelease', message: `${player.username} заплатил $${JAIL_FINE} и вышел из тюрьмы` });
  game.phase = 'action';
  return { success: true, events };
}

export function useJailCard(game, userId) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  if (!player.inJail) {
    return { success: false, events: [{ type: 'error', message: 'Вы не в тюрьме' }] };
  }

  if (player.getOutOfJailCards <= 0) {
    return { success: false, events: [{ type: 'error', message: 'Нет карт выхода из тюрьмы' }] };
  }

  player.getOutOfJailCards--;
  player.inJail = false;
  player.jailTurns = 0;

  addEvent(events, { type: 'jailRelease', message: `${player.username} использовал карту выхода из тюрьмы` });
  game.phase = 'action';
  return { success: true, events };
}

export function drawCard(game, type) {
  const events = [];
  const player = game.players[game.currentPlayerIndex];
  const deck = type === 'chance' ? game.chanceCards : game.communityCards;

  if (deck.length === 0) {
    return [{ type: 'error', message: 'Карты закончились' }];
  }

  const card = deck.shift();
  deck.push(card);

  addEvent(events, { type: 'card', message: `${player.username} вытянул карту: ${card.text}` });

  switch (card.action) {
    case 'moveTo': {
      const oldPos = player.position;
      player.position = card.target;
      if (card.target < oldPos) {
        player.balance += GO_SALARY;
        addEvent(events, { type: 'passGo', message: `${player.username} перешел через Старт и получил $${GO_SALARY}` });
      }
      const cellEvents = handleCellLanding(game, player, card.target);
      events.push(...cellEvents);
      break;
    }
    case 'goToJail':
      goToJail(game, player.userId);
      addEvent(events, { type: 'jail', message: `${player.username} отправлен в тюрьму по карте!` });
      break;
    case 'repair': {
      let totalCost = 0;
      for (const propIdx of player.properties) {
        const entry = getPropertyEntry(game, propIdx);
        if (entry.hotel) {
          totalCost += card.hotelCost;
        }
        totalCost += entry.houses * card.houseCost;
      }
      player.balance -= totalCost;
      addEvent(events, { type: 'repair', message: `${player.username} заплатил $${totalCost} за ремонт` });
      break;
    }
    case 'pay':
      player.balance -= card.amount;
      addEvent(events, { type: 'pay', message: `${player.username} заплатил $${card.amount}` });
      break;
    case 'receive':
      player.balance += card.amount;
      addEvent(events, { type: 'receive', message: `${player.username} получил $${card.amount}` });
      break;
    case 'birthday':
      for (const p of game.players) {
        if (p.userId !== player.userId && !p.isBankrupt) {
          p.balance -= card.amount;
          player.balance += card.amount;
        }
      }
      addEvent(events, { type: 'birthday', message: `${player.username} получил $${card.amount} от каждого игрока` });
      break;
    case 'getOutOfJail':
      player.getOutOfJailCards++;
      addEvent(events, { type: 'jailCard', message: `${player.username} получил карту выхода из тюрьмы` });
      break;
    case 'moveBack': {
      const oldPos = player.position;
      player.position = (oldPos - card.steps + TOTAL_CELLS) % TOTAL_CELLS;
      const cellEvents = handleCellLanding(game, player, player.position);
      events.push(...cellEvents);
      break;
    }
    case 'moveToNearestRailroad': {
      const railroads = [5, 15, 25, 35];
      let nearest = railroads.find(r => r > player.position);
      if (!nearest) nearest = railroads[0];
      const oldPos = player.position;
      player.position = nearest;
      if (nearest < oldPos) {
        player.balance += GO_SALARY;
        addEvent(events, { type: 'passGo', message: `${player.username} перешел через Старт и получил $${GO_SALARY}` });
      }
      const entry = getPropertyEntry(game, nearest);
      if (entry.ownerId && entry.ownerId !== player.userId && !entry.isMortgaged) {
        const rent = calculateRent(game, nearest);
        player.balance -= rent;
        const ownerPlayer = getPlayer(game, entry.ownerId);
        if (ownerPlayer) {
          ownerPlayer.balance += rent;
        }
        addEvent(events, { type: 'rent', message: `${player.username} заплатил ренту $${rent}` });
      }
      break;
    }
    case 'moveToNearestUtility': {
      const utilities = [12, 28];
      let nearest = utilities.find(u => u > player.position);
      if (!nearest) nearest = utilities[0];
      const oldPos = player.position;
      player.position = nearest;
      if (nearest < oldPos) {
        player.balance += GO_SALARY;
        addEvent(events, { type: 'passGo', message: `${player.username} перешел через Старт и получил $${GO_SALARY}` });
      }
      const entry = getPropertyEntry(game, nearest);
      if (entry.ownerId && entry.ownerId !== player.userId && !entry.isMortgaged) {
        const utilityCount = utilities.filter(u => {
          const e = getPropertyEntry(game, u);
          return e.ownerId === entry.ownerId;
        }).length;
        const diceTotal = game.diceResult[0] + game.diceResult[1];
        const multiplier = utilityCount >= 2 ? 10 : 4;
        const rent = diceTotal * multiplier;
        player.balance -= rent;
        const ownerPlayer = getPlayer(game, entry.ownerId);
        if (ownerPlayer) {
          ownerPlayer.balance += rent;
        }
        addEvent(events, { type: 'rent', message: `${player.username} заплатил ренту $${rent}` });
      }
      break;
    }
  }

  return events;
}

export function calculateRent(game, cellIndex) {
  const cell = getCell(cellIndex);
  const entry = getPropertyEntry(game, cellIndex);

  if (!cell || !entry || !entry.ownerId || entry.isMortgaged) return 0;

  if (cell.type === 'property') {
    const monopoly = checkMonopoly(game, cell.color);
    let rent = cell.rent[0];
    if (monopoly) rent *= 2;
    if (entry.hotel) {
      rent = cell.rent[5];
    } else if (entry.houses > 0) {
      rent = cell.rent[entry.houses];
    }
    return rent;
  }

  if (cell.type === 'railroad') {
    const railroads = [5, 15, 25, 35];
    const owned = railroads.filter(idx => {
      const e = getPropertyEntry(game, idx);
      return e.ownerId === entry.ownerId;
    }).length;
    const rentIndex = Math.min(owned - 1, 3);
    return cell.rent[Math.max(0, rentIndex)];
  }

  if (cell.type === 'utility') {
    const utilities = [12, 28];
    const owned = utilities.filter(idx => {
      const e = getPropertyEntry(game, idx);
      return e.ownerId === entry.ownerId;
    }).length;
    const diceTotal = game.diceResult[0] + game.diceResult[1];
    return owned >= 2 ? diceTotal * 10 : diceTotal * 4;
  }

  return 0;
}

export function checkMonopoly(game, color) {
  const cellIndices = COLOR_GROUPS[color];
  if (!cellIndices) return false;

  const firstOwner = getPropertyEntry(game, cellIndices[0]).ownerId;
  if (!firstOwner) return false;

  return cellIndices.every(idx => {
    const entry = getPropertyEntry(game, idx);
    return entry.ownerId === firstOwner;
  });
}

export function checkBankruptcy(game, userId) {
  const player = getPlayer(game, userId);
  if (!player || player.isBankrupt) return false;

  if (player.balance >= 0) return false;

  const totalValue = player.properties.reduce((sum, cellIndex) => {
    const cell = getCell(cellIndex);
    const entry = getPropertyEntry(game, cellIndex);
    let value = cell.mortgageValue || 0;
    if (entry.houses > 0) {
      value += Math.floor(cell.housePrice / 2) * entry.houses;
    }
    if (entry.hotel) {
      value += Math.floor(cell.housePrice / 2) * 5;
    }
    return sum + value;
  }, player.balance);

  return totalValue < 0;
}

export function handleBankruptcy(game, userId, creditorId) {
  const events = [];
  const player = getPlayer(game, userId);
  if (!player) return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };

  player.isBankrupt = true;

  for (const cellIndex of [...player.properties]) {
    const entry = getPropertyEntry(game, cellIndex);
    const cell = getCell(cellIndex);

    if (creditorId) {
      const creditor = getPlayer(game, creditorId);
      if (creditor && !creditor.isBankrupt) {
        entry.ownerId = creditorId;
        creditor.properties.push(cellIndex);
        addEvent(events, { type: 'transfer', message: `${cell.name} передана ${creditor.username}` });
      } else {
        entry.ownerId = null;
        entry.houses = 0;
        entry.hotel = false;
        addEvent(events, { type: 'bankReturn', message: `${cell.name} возвращена банку` });
      }
    } else {
      entry.ownerId = null;
      entry.houses = 0;
      entry.hotel = false;
      game.bank.houses += entry.houses;
      if (entry.hotel) game.bank.hotels++;
      addEvent(events, { type: 'bankReturn', message: `${cell.name} возвращена банку` });
    }
  }

  player.properties = [];

  for (let i = 0; i < player.getOutOfJailCards; i++) {
    if (game.chanceCards.length > 0) {
      const chanceWithCard = CHANCE_CARDS.find(c => c.action === 'getOutOfJail');
      if (chanceWithCard) game.chanceCards.push(chanceWithCard);
    }
  }
  player.getOutOfJailCards = 0;

  addEvent(events, { type: 'bankrupt', message: `${player.username} объявлен банкротом!` });
  return { success: true, events };
}

export function checkWinner(game) {
  const activePlayers = getActivePlayers(game);
  if (activePlayers.length === 1) {
    game.winner = activePlayers[0].userId;
    return activePlayers[0];
  }
  return null;
}

export function executeTrade(game, trade) {
  const events = [];
  const { fromUserId, toUserId, offer, request } = trade;

  const fromPlayer = getPlayer(game, fromUserId);
  const toPlayer = getPlayer(game, toUserId);
  if (!fromPlayer || !toPlayer) {
    return { success: false, events: [{ type: 'error', message: 'Игрок не найден' }] };
  }

  if (offer.money) {
    if (fromPlayer.balance < offer.money) {
      return { success: false, events: [{ type: 'error', message: 'Недостаточно денег для обмена' }] };
    }
  }

  if (request.money) {
    if (toPlayer.balance < request.money) {
      return { success: false, events: [{ type: 'error', message: 'Другой игрок не имеет достаточно денег' }] };
    }
  }

  if (offer.properties) {
    for (const cellIndex of offer.properties) {
      const entry = getPropertyEntry(game, cellIndex);
      if (entry.ownerId !== fromUserId) {
        return { success: false, events: [{ type: 'error', message: `${fromPlayer.username} не владеет клеткой ${cellIndex}` }] };
      }
      if (entry.houses > 0 || entry.hotel) {
        return { success: false, events: [{ type: 'error', message: 'Продайте дома перед обменом' }] };
      }
    }
  }

  if (request.properties) {
    for (const cellIndex of request.properties) {
      const entry = getPropertyEntry(game, cellIndex);
      if (entry.ownerId !== toUserId) {
        return { success: false, events: [{ type: 'error', message: `${toPlayer.username} не владеет клеткой ${cellIndex}` }] };
      }
      if (entry.houses > 0 || entry.hotel) {
        return { success: false, events: [{ type: 'error', message: 'Другой игрок должен продать дома перед обменом' }] };
      }
    }
  }

  if (offer.money) {
    fromPlayer.balance -= offer.money;
    toPlayer.balance += offer.money;
  }
  if (request.money) {
    toPlayer.balance -= request.money;
    fromPlayer.balance += request.money;
  }

  if (offer.properties) {
    for (const cellIndex of offer.properties) {
      const entry = getPropertyEntry(game, cellIndex);
      entry.ownerId = toUserId;
      fromPlayer.properties = fromPlayer.properties.filter(p => p !== cellIndex);
      toPlayer.properties.push(cellIndex);
    }
  }

  if (request.properties) {
    for (const cellIndex of request.properties) {
      const entry = getPropertyEntry(game, cellIndex);
      entry.ownerId = fromUserId;
      toPlayer.properties = toPlayer.properties.filter(p => p !== cellIndex);
      fromPlayer.properties.push(cellIndex);
    }
  }

  addEvent(events, {
    type: 'trade',
    message: `Обмен между ${fromPlayer.username} и ${toPlayer.username} завершен`
  });

  return { success: true, events };
}
