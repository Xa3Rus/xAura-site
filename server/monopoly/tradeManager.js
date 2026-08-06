const trades = new Map();
const tradeTimers = new Map();

let tradeCounter = 0;

function generateTradeId() {
  return `trade_${++tradeCounter}`;
}

export function createTrade(roomId, fromId, toId, offer, request) {
  if (!trades.has(roomId)) trades.set(roomId, new Map());

  const id = generateTradeId();
  const trade = {
    id,
    roomId,
    fromId,
    toId,
    offer: { properties: offer.properties || [], money: offer.money || 0, jailCards: offer.jailCards || 0 },
    request: { properties: request.properties || [], money: request.money || 0, jailCards: request.jailCards || 0 },
    status: 'pending',
    timer: 60,
  };

  trades.get(roomId).set(id, trade);

  const timer = setTimeout(() => {
    cancelTrade(roomId, id);
  }, 60000);

  tradeTimers.set(id, timer);
  return trade;
}

export function acceptTrade(roomId, tradeId) {
  const roomTrades = trades.get(roomId);
  if (!roomTrades) return { error: 'No trades found' };

  const trade = roomTrades.get(tradeId);
  if (!trade) return { error: 'Trade not found' };
  if (trade.status !== 'pending') return { error: 'Trade is no longer pending' };

  trade.status = 'accepted';

  if (tradeTimers.has(tradeId)) {
    clearTimeout(tradeTimers.get(tradeId));
    tradeTimers.delete(tradeId);
  }

  return trade;
}

export function declineTrade(roomId, tradeId) {
  const roomTrades = trades.get(roomId);
  if (!roomTrades) return { error: 'No trades found' };

  const trade = roomTrades.get(tradeId);
  if (!trade) return { error: 'Trade not found' };

  trade.status = 'declined';

  if (tradeTimers.has(tradeId)) {
    clearTimeout(tradeTimers.get(tradeId));
    tradeTimers.delete(tradeId);
  }

  roomTrades.delete(tradeId);
  return trade;
}

export function counterTrade(roomId, tradeId, newOffer, newRequest) {
  const roomTrades = trades.get(roomId);
  if (!roomTrades) return { error: 'No trades found' };

  const trade = roomTrades.get(tradeId);
  if (!trade) return { error: 'Trade not found' };
  if (trade.status !== 'pending') return { error: 'Trade is no longer pending' };

  trade.status = 'countered';

  if (tradeTimers.has(tradeId)) {
    clearTimeout(tradeTimers.get(tradeId));
    tradeTimers.delete(tradeId);
  }

  roomTrades.delete(tradeId);

  return createTrade(roomId, trade.toId, trade.fromId, newOffer, newRequest);
}

export function cancelTrade(roomId, tradeId) {
  const roomTrades = trades.get(roomId);
  if (!roomTrades) return null;

  const trade = roomTrades.get(tradeId);
  if (!trade) return null;

  trade.status = 'cancelled';

  if (tradeTimers.has(tradeId)) {
    clearTimeout(tradeTimers.get(tradeId));
    tradeTimers.delete(tradeId);
  }

  roomTrades.delete(tradeId);
  return trade;
}
