const audioContext = new (window.AudioContext || window.webkitAudioContext)()

let muted = localStorage.getItem('xAura:muted') === '1'

export function isMuted() { return muted }
export function toggleMute() {
  muted = !muted
  localStorage.setItem('xAura:muted', muted ? '1' : '0')
  return muted
}

const sounds = {
  diceRoll: { freq: [200, 400, 600], type: 'triangle', duration: 0.3 },
  diceLand: { freq: 800, type: 'sine', duration: 0.15 },
  moneyGain: { freq: [523, 659, 784], type: 'sine', duration: 0.4 },
  moneyLoss: { freq: [392, 330, 262], type: 'sawtooth', duration: 0.4 },
  buy: { freq: [659, 784, 1047], type: 'triangle', duration: 0.5 },
  build: { freq: [523, 659, 784, 1047], type: 'sine', duration: 0.6 },
  jail: { freq: [220, 165, 110], type: 'square', duration: 0.8 },
  jailRelease: { freq: [523, 659, 784], type: 'triangle', duration: 0.5 },
  bankrupt: { freq: [110, 82, 55], type: 'sawtooth', duration: 1.2 },
  cardDraw: { freq: [880, 1100, 1320], type: 'sine', duration: 0.4 },
  turnEnd: { freq: 440, type: 'sine', duration: 0.2 },
  error: { freq: 220, type: 'square', duration: 0.3 },
  notification: { freq: [660, 880], type: 'triangle', duration: 0.3 },
  auctionBid: { freq: [880, 1100], type: 'sine', duration: 0.2 },
  tradeOffer: { freq: [523, 784], type: 'triangle', duration: 0.3 },
  win: { freq: [523, 659, 784, 1047, 1319, 1568], type: 'triangle', duration: 1.4 },
  step: { freq: 320, type: 'sine', duration: 0.06 },
}

function playTone(frequency, type, duration, volume = 0.1) {
  if (!audioContext || muted) return
  if (audioContext.state === 'suspended') audioContext.resume()

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = type
  oscillator.frequency.value = frequency

  const now = audioContext.currentTime
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

function playSequence(frequencies, type, duration, volume = 0.1) {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, type, duration / frequencies.length, volume), i * (duration / frequencies.length) * 1000)
  })
}

export function playSound(name, volume = 0.1) {
  const sound = sounds[name]
  if (!sound) return

  if (Array.isArray(sound.freq)) {
    playSequence(sound.freq, sound.type, sound.duration, volume)
  } else {
    playTone(sound.freq, sound.type, sound.duration, volume)
  }
}

export function playDiceRoll() { playSound('diceRoll', 0.08) }
export function playDiceLand() { playSound('diceLand', 0.1) }
export function playMoneyGain() { playSound('moneyGain', 0.1) }
export function playMoneyLoss() { playSound('moneyLoss', 0.1) }
export function playBuy() { playSound('buy', 0.1) }
export function playBuild() { playSound('build', 0.1) }
export function playJail() { playSound('jail', 0.1) }
export function playJailRelease() { playSound('jailRelease', 0.1) }
export function playBankrupt() { playSound('bankrupt', 0.15) }
export function playCardDraw() { playSound('cardDraw', 0.1) }
export function playTurnEnd() { playSound('turnEnd', 0.08) }
export function playError() { playSound('error', 0.1) }
export function playNotification() { playSound('notification', 0.08) }
export function playAuctionBid() { playSound('auctionBid', 0.1) }
export function playTradeOffer() { playSound('tradeOffer', 0.1) }
export function playWin() { playSound('win', 0.12) }
export function playStep() { playSound('step', 0.05) }

export function initAudio() {
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
}