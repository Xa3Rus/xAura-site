import { CELLS, EVENTS, START_BALANCE, PASS_START_BONUS, JAIL_POSITION, JAIL_TURNS, TOTAL_CELLS, PLAYER_COLORS } from './gameData.js'
import { randomUUID as uuidv4 } from 'crypto'

export function createGame(players) {
  return {
    id: uuidv4(),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      colorIdx: p.color,
      color: PLAYER_COLORS[p.color],
      position: 0,
      balance: START_BALANCE,
      properties: [],
      upgrades: {},
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      doublesCount: 0,
    })),
    currentPlayerIdx: 0,
    phase: 'waiting_for_roll',
    dice: [0, 0],
    diceTotal: 0,
    cellOwners: {},
    lastEvent: null,
    turnHistory: [],
    activeTrades: [],
    winner: null,
    startedAt: Date.now(),
  }
}

export function handlePlayerRoll(gs, playerId) {
  if (gs.winner) return { error: 'Игра окончена' }
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }
  if (gs.phase !== 'waiting_for_roll') return { error: 'Сейчас нельзя бросить' }
  if (player.isBankrupt) return { error: 'Вы банкрот' }

  if (player.inJail) {
    player.jailTurns--
    if (player.jailTurns <= 0) {
      player.inJail = false
      gs.phase = 'waiting_for_roll'
    } else {
      gs.turnHistory.push({ player: player.name, action: 'Остался в тюрьме', remaining: player.jailTurns })
      return finishTurnOrContinue(gs, false)
    }
  }

  const d1 = Math.floor(Math.random() * 6) + 1
  const d2 = Math.floor(Math.random() * 6) + 1
  const isDoubles = d1 === d2
  gs.dice = [d1, d2]
  gs.diceTotal = d1 + d2

  if (isDoubles) {
    player.doublesCount++
    if (player.doublesCount >= 3) {
      sendToJail(gs, player)
      return finishTurnOrContinue(gs, false)
    }
  } else {
    player.doublesCount = 0
  }

  const oldPos = player.position
  let newPos = (player.position + gs.diceTotal) % TOTAL_CELLS
  const passedStart = newPos < oldPos

  player.position = newPos

  if (passedStart) {
    player.balance += PASS_START_BONUS
    gs.turnHistory.push({ player: player.name, action: `Прошёл старт +${PASS_START_BONUS}` })
  }

  gs.phase = 'moving'
  return { dice: gs.dice, diceTotal: gs.diceTotal, oldPos, newPos, passedStart }
}

export function handleCellAction(gs, playerId) {
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }
  if (gs.phase !== 'after_move') return { error: 'Нет действия' }

  const cell = CELLS[player.position]
  const result = { cell }

  switch (cell.type) {
    case 'start':
      result.action = 'none'
      break

    case 'property':
    case 'music':
      const owner = gs.cellOwners[cell.id]
      if (!owner) {
        result.action = 'can_buy'
      } else if (owner === player.id) {
        result.action = 'own_property'
      } else {
        const ownerPlayer = gs.players.find((p) => p.id === owner)
        if (ownerPlayer && !ownerPlayer.isBankrupt) {
          const level = gs.upgrades[cell.id] || 0
          const rent = cell.rent[level] || cell.rent[0]
          result.action = 'pay_rent'
          result.rent = rent
          result.ownerName = ownerPlayer.name
          result.ownerId = owner
        } else {
          result.action = 'can_buy'
        }
      }
      break

    case 'tax':
      result.action = 'pay_tax'
      result.amount = cell.amount
      break

    case 'event':
      const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]
      result.action = 'event'
      result.event = event
      break

    case 'jail':
      result.action = 'just_visiting'
      break

    case 'parking':
      result.action = 'none'
      break

    default:
      result.action = 'none'
  }

  gs.phase = 'action'
  return result
}

export function handleBuy(gs, playerId) {
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }

  const cell = CELLS[player.position]
  if (!cell || (cell.type !== 'property' && cell.type !== 'music')) return { error: 'Нельзя купить' }
  if (gs.cellOwners[cell.id]) return { error: 'Уже куплено' }
  if (player.balance < cell.price) return { error: 'Недостаточно средств' }

  player.balance -= cell.price
  player.properties.push(cell.id)
  gs.cellOwners[cell.id] = player.id

  gs.turnHistory.push({ player: player.name, action: `Купил ${cell.name}`, amount: -cell.price })
  return { success: true, spent: cell.price }
}

export function handleUpgrade(gs, playerId, cellId) {
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }

  const cell = CELLS[cellId]
  if (!cell) return { error: 'Нет такой клетки' }
  if (gs.cellOwners[cellId] !== playerId) return { error: 'Не ваша собственность' }

  const currentLevel = gs.upgrades[cellId] || 0
  if (currentLevel >= 3) return { error: 'Максимальный уровень' }

  const upgradeCost = Math.floor(cell.price * 0.5 * (currentLevel + 1))
  if (player.balance < upgradeCost) return { error: 'Недостаточно средств' }

  player.balance -= upgradeCost
  gs.upgrades[cellId] = currentLevel + 1
  gs.turnHistory.push({ player: player.name, action: `Улучшил ${cell.name} → ур.${currentLevel + 1}`, amount: -upgradeCost })
  return { success: true, level: currentLevel + 1, cost: upgradeCost }
}

export function handlePayRent(gs, playerId) {
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }

  const cell = CELLS[player.position]
  const ownerId = gs.cellOwners[cell.id]
  if (!ownerId) return { error: 'Нет владельца' }

  const level = gs.upgrades[cell.id] || 0
  const rent = cell.rent[level] || cell.rent[0]
  const owner = gs.players.find((p) => p.id === ownerId)

  if (player.balance < rent) {
    player.isBankrupt = true
    player.balance = 0
    player.properties.forEach((pid) => { delete gs.cellOwners[pid] })
    player.properties = []
    gs.turnHistory.push({ player: player.name, action: `Банкрот! Не смог заплатить аренду ${rent}` })
    checkWinner(gs)
    return { success: true, bankrupt: true }
  }

  player.balance -= rent
  if (owner) owner.balance += rent

  gs.turnHistory.push({ player: player.name, action: `Заплатил аренду ${rent} → ${owner?.name}`, amount: -rent })
  return { success: true, rent, toPlayer: ownerId }
}

export function handlePayTax(gs, playerId) {
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }

  const cell = CELLS[player.position]
  if (player.balance < cell.amount) {
    player.isBankrupt = true
    player.balance = 0
    player.properties.forEach((pid) => { delete gs.cellOwners[pid] })
    player.properties = []
    checkWinner(gs)
    return { success: true, bankrupt: true }
  }

  player.balance -= cell.amount
  gs.turnHistory.push({ player: player.name, action: `Заплатил налог ${cell.amount}` })
  return { success: true, amount: cell.amount }
}

export function handleEvent(gs, playerId) {
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }

  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]
  let result = { event }

  switch (event.action) {
    case 'gain':
      player.balance += event.amount
      break
    case 'pay':
      if (player.balance < event.amount) {
        player.isBankrupt = true
        player.balance = 0
        player.properties.forEach((pid) => { delete gs.cellOwners[pid] })
        player.properties = []
        checkWinner(gs)
      } else {
        player.balance -= event.amount
      }
      break
    case 'collect_from_all':
      gs.players.forEach((p) => {
        if (p.id !== player.id && !p.isBankrupt) {
          if (p.balance >= event.amount) {
            p.balance -= event.amount
            player.balance += event.amount
          }
        }
      })
      break
    case 'lose_percent':
      const loss = Math.floor(player.balance * event.amount / 100)
      player.balance -= loss
      break
    case 'move_back':
      player.position = (player.position - event.amount + TOTAL_CELLS) % TOTAL_CELLS
      break
  }

  gs.turnHistory.push({ player: player.name, action: event.text })
  return result
}

export function handleEndTurn(gs, playerId) {
  const player = gs.players[gs.currentPlayerIdx]
  if (!player || player.id !== playerId) return { error: 'Не ваш ход' }

  const cell = CELLS[player.position]
  const isDoubles = gs.dice[0] === gs.dice[1]

  if (isDoubles && !player.inJail && !player.isBankrupt) {
    gs.phase = 'waiting_for_roll'
    gs.turnHistory.push({ player: player.name, action: 'Бросает снова (дубль!)' })
    return { nextTurn: false, samePlayer: true }
  }

  return finishTurnOrContinue(gs, false)
}

function finishTurnOrContinue(gs, samePlayer) {
  if (samePlayer) {
    gs.phase = 'waiting_for_roll'
    return { nextTurn: false, samePlayer: true }
  }

  let nextIdx = gs.currentPlayerIdx
  let attempts = 0
  do {
    nextIdx = (nextIdx + 1) % gs.players.length
    attempts++
  } while (gs.players[nextIdx]?.isBankrupt && attempts < gs.players.length)

  if (attempts >= gs.players.length) {
    checkWinner(gs)
    return { nextTurn: true, gameOver: true }
  }

  gs.currentPlayerIdx = nextIdx
  gs.phase = 'waiting_for_roll'
  return { nextTurn: true, nextPlayer: gs.players[nextIdx]?.id }
}

function sendToJail(gs, player) {
  player.position = JAIL_POSITION
  player.inJail = true
  player.jailTurns = JAIL_TURNS
  player.doublesCount = 0
  gs.phase = 'waiting_for_roll'
  gs.turnHistory.push({ player: player.name, action: 'Отправлен в тюрьму за тройной дубль!' })
}

function checkWinner(gs) {
  const alive = gs.players.filter((p) => !p.isBankrupt)
  if (alive.length === 1) {
    gs.winner = alive[0].id
    gs.winnerName = alive[0].name
    gs.phase = 'game_over'
  }
}

export function processAction(gs, playerId, action, data) {
  switch (action) {
    case 'buy': return handleBuy(gs, playerId)
    case 'pay_rent': return handlePayRent(gs, playerId)
    case 'pay_tax': return handlePayTax(gs, playerId)
    case 'event': return handleEvent(gs, playerId)
    case 'upgrade': return handleUpgrade(gs, playerId, data?.cellId)
    case 'end_turn': return handleEndTurn(gs, playerId)
    case 'cell_action': return handleCellAction(gs, playerId)
    default: return { error: 'Unknown action' }
  }
}
