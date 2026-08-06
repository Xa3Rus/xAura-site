import { create } from 'zustand'

const useMonopolyStore = create((set, get) => ({
  room: null,
  gameState: null,
  messages: [],
  typingUsers: [],
  myTradeOffers: [],
  incomingTradeOffers: [],
  auction: null,
  error: null,
  loading: false,

  setRoom: (room) => set({ room }),
  setGameState: (gameState) => set({ gameState }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg].slice(-200) })),
  setMessages: (messages) => set({ messages }),

  addTypingUser: (user) => set((s) => {
    const exists = s.typingUsers.find((u) => u.userId === user.userId)
    if (exists) return s
    const timeout = setTimeout(() => {
      set((prev) => ({ typingUsers: prev.typingUsers.filter((u) => u.userId !== user.userId) }))
    }, 3000)
    return { typingUsers: [...s.typingUsers, { ...user, timeout }] }
  }),
  removeTypingUser: (userId) => set((s) => ({
    typingUsers: s.typingUsers.filter((u) => u.userId !== userId),
  })),

  setAuction: (auction) => set({ auction }),
  addTradeOffer: (trade) => set((s) => ({ incomingTradeOffers: [...s.incomingTradeOffers, trade] })),
  removeTradeOffer: (tradeId) => set((s) => ({
    incomingTradeOffers: s.incomingTradeOffers.filter((t) => t.id !== tradeId),
    myTradeOffers: s.myTradeOffers.filter((t) => t.id !== tradeId),
  })),
  setMyTradeOffers: (offers) => set({ myTradeOffers: offers }),

  reset: () => set({
    room: null,
    gameState: null,
    messages: [],
    typingUsers: [],
    myTradeOffers: [],
    incomingTradeOffers: [],
    auction: null,
    error: null,
    loading: false,
  }),
}))

export default useMonopolyStore
