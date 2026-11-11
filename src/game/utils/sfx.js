// Efectos de sonido sintetizados con WebAudio (no requieren archivos).
let ctx = null
let muted = false

function getCtx() {
  if (muted) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, dur, { type = 'sine', gain = 0.12, slideTo = null, delay = 0 } = {}) {
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(c.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(dur, { gain = 0.25, freq = 1200, q = 0.8 } = {}) {
  const c = getCtx()
  if (!c) return
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = q
  const g = c.createGain()
  g.gain.value = gain
  src.connect(filter).connect(g).connect(c.destination)
  src.start()
}

export const sfx = {
  // "¡ptuh!" del escupitajo
  spit: () => {
    noise(0.18, { freq: 1800, gain: 0.35 })
    tone(220, 0.12, { type: 'triangle', gain: 0.08, slideTo: 90 })
  },
  splat: () => noise(0.25, { freq: 600, gain: 0.3 }),
  // silbato de tránsito
  whistle: () => {
    tone(2600, 0.16, { type: 'square', gain: 0.05 })
    tone(2900, 0.28, { type: 'square', gain: 0.05, delay: 0.17 })
  },
  // multa correcta: "caja registradora"
  fine: () => {
    tone(880, 0.08, { gain: 0.12 })
    tone(1320, 0.18, { gain: 0.12, delay: 0.08 })
  },
  wrong: () => tone(160, 0.35, { type: 'sawtooth', gain: 0.1, slideTo: 90 }),
  // bocina del infractor que se escapa
  honk: () => {
    tone(330, 0.18, { type: 'square', gain: 0.07 })
    tone(330, 0.3, { type: 'square', gain: 0.07, delay: 0.22 })
  },
  siren: () => {
    for (let i = 0; i < 3; i++) {
      tone(700, 0.25, { type: 'triangle', gain: 0.05, slideTo: 1000, delay: i * 0.5 })
      tone(1000, 0.25, { type: 'triangle', gain: 0.05, slideTo: 700, delay: i * 0.5 + 0.25 })
    }
  },
  power: () => {
    sfx.whistle()
    tone(523, 0.15, { delay: 0.5 })
    tone(659, 0.15, { delay: 0.62 })
    tone(784, 0.3, { delay: 0.74 })
  },
  setMuted: (v) => {
    muted = v
  },
  dispose: () => {
    ctx?.close()
    ctx = null
  },
}
