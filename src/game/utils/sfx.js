// Efectos de sonido sintetizados con WebAudio (no requiere archivos).
let ctx = null

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
  const c = getCtx()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, c.currentTime)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur)
  g.gain.setValueAtTime(gain, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
  o.connect(g).connect(c.destination)
  o.start()
  o.stop(c.currentTime + dur)
}

export const sfx = {
  jump: () => tone(300, 0.15, 'triangle', 0.1, 600),
  good: () => tone(660, 0.12, 'sine', 0.12, 990),
  junk: () => tone(180, 0.3, 'sawtooth', 0.12, 70),
  plate: () => {
    tone(523, 0.12)
    setTimeout(() => tone(659, 0.12), 110)
    setTimeout(() => tone(784, 0.25), 220)
  },
  dispose: () => {
    ctx?.close()
    ctx = null
  },
}
