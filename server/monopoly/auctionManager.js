const auctions = new Map();
const timers = new Map();

export function startAuction(roomId, cellIndex, startPrice) {
  if (auctions.has(roomId)) return { error: 'Auction already in progress' };

  const auction = {
    roomId,
    cellIndex,
    currentBid: startPrice,
    currentBidder: null,
    timer: 30,
    participants: new Set(),
    ended: false,
  };

  auctions.set(roomId, auction);

  const interval = setInterval(() => {
    auction.timer--;
    if (auction.timer <= 0) {
      clearInterval(interval);
      timers.delete(roomId);
      endAuction(roomId);
    }
  }, 1000);

  timers.set(roomId, interval);
  return auction;
}

export function placeBid(roomId, userId, amount) {
  const auction = auctions.get(roomId);
  if (!auction) return { error: 'No active auction' };
  if (auction.ended) return { error: 'Auction has ended' };
  if (amount <= auction.currentBid) return { error: 'Bid must be higher than current bid' };

  auction.participants.add(userId);
  auction.currentBid = amount;
  auction.currentBidder = userId;
  auction.timer = 30;

  return auction;
}

export function getAuction(roomId) {
  return auctions.get(roomId) || null;
}

export function endAuction(roomId) {
  const auction = auctions.get(roomId);
  if (!auction) return null;

  auction.ended = true;

  const result = {
    roomId: auction.roomId,
    cellIndex: auction.cellIndex,
    winner: auction.currentBidder,
    finalBid: auction.currentBid,
    sold: auction.currentBidder !== null,
  };

  if (timers.has(roomId)) {
    clearInterval(timers.get(roomId));
    timers.delete(roomId);
  }

  auctions.delete(roomId);
  return result;
}
