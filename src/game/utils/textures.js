// Texturas generadas con Canvas 2D: letreros, globos, wiphala, aguayo, acera y nubes.
import * as THREE from 'three'

const FONT = '"Segoe UI", system-ui, sans-serif'
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"'

export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function canvasTexture(c, { repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

// Generador pseudoaleatorio determinista (misma ciudad en cada partida).
export function rng(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Globo/etiqueta redondeada con texto (y emoji). Devuelve { texture, aspect }. */
export function makeLabel(text, { bg = '#ffffff', fg = '#1b1230', px = 54, border = '#1b1230' } = {}) {
  const font = `800 ${px}px ${FONT}, ${EMOJI}`
  const m = makeCanvas(8, 8).getContext('2d')
  m.font = font
  const pad = px * 0.45
  const w = Math.ceil(m.measureText(text).width + pad * 2)
  const h = Math.ceil(px * 1.5)
  const c = makeCanvas(w, h)
  const g = c.getContext('2d')
  g.fillStyle = bg
  g.strokeStyle = border
  g.lineWidth = px * 0.1
  g.beginPath()
  g.roundRect(g.lineWidth, g.lineWidth, w - g.lineWidth * 2, h - g.lineWidth * 2, h * 0.35)
  g.fill()
  g.stroke()
  g.font = font
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, w / 2, h / 2 + px * 0.05)
  return { texture: canvasTexture(c), aspect: w / h }
}

/** Letrero rectangular (tiendas, rutas de minibús, pancartas). */
export function makeSignTexture(text, { bg = '#fcbf49', fg = '#1b1230', w = 512, h = 128, border = null } = {}) {
  const c = makeCanvas(w, h)
  const g = c.getContext('2d')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  if (border) {
    g.strokeStyle = border
    g.lineWidth = h * 0.08
    g.strokeRect(0, 0, w, h)
  }
  let px = h * 0.62
  g.font = `900 ${px}px ${FONT}`
  while (g.measureText(text).width > w * 0.92 && px > 8) {
    px -= 2
    g.font = `900 ${px}px ${FONT}`
  }
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, w / 2, h / 2 + px * 0.05)
  return canvasTexture(c)
}

const WIPHALA = ['#d62828', '#f77f00', '#fcbf49', '#ffffff', '#2a9d4a', '#1d6fb8', '#7b2cbf']

export function makeWiphalaTexture() {
  const c = makeCanvas(140, 140)
  const g = c.getContext('2d')
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      g.fillStyle = WIPHALA[(i + j) % 7]
      g.fillRect(j * 20, i * 20, 20, 20)
    }
  }
  return canvasTexture(c)
}

/** Aguayo: tejido andino a franjas, usado en los bultos sobre los minibuses. */
export function makeAguayoTexture() {
  const c = makeCanvas(128, 128)
  const g = c.getContext('2d')
  const cols = ['#c1121f', '#f77f00', '#fcbf49', '#2a9d4a', '#1d6fb8', '#7b2cbf', '#e5e5e5']
  for (let y = 0, i = 0; y < 128; i++) {
    const h = 4 + ((i * 7) % 11)
    g.fillStyle = cols[i % cols.length]
    g.fillRect(0, y, 128, h)
    if (i % 3 === 0) {
      g.fillStyle = '#1b1230'
      for (let x = 0; x < 128; x += 12) g.fillRect(x, y + h / 2 - 1, 6, 2)
    }
    y += h
  }
  return canvasTexture(c)
}

/** Baldosas de acera. */
export function makeSidewalkTexture() {
  const c = makeCanvas(256, 256)
  const g = c.getContext('2d')
  const r = rng(3)
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = 150 + Math.floor(r() * 30)
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`
      g.fillRect(x * 64, y * 64, 64, 64)
    }
  }
  g.strokeStyle = 'rgba(60,55,50,0.6)'
  g.lineWidth = 3
  for (let i = 0; i <= 4; i++) {
    g.beginPath()
    g.moveTo(i * 64, 0)
    g.lineTo(i * 64, 256)
    g.moveTo(0, i * 64)
    g.lineTo(256, i * 64)
    g.stroke()
  }
  return canvasTexture(c, { repeat: true })
}

/** Nubes semitransparentes en la parte superior (capa de parallax). */
export function makeCloudsTexture() {
  const c = makeCanvas(1024, 512)
  const g = c.getContext('2d')
  const r = rng(11)
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 110 + r() * 30
    const y = 60 + r() * 200
    for (let k = 0; k < 5; k++) {
      const gx = x + k * 26
      const gy = y + Math.sin(k * 1.7) * 10
      const rad = 30 + r() * 22
      const grad = g.createRadialGradient(gx, gy, 2, gx, gy, rad)
      grad.addColorStop(0, 'rgba(255,255,255,0.75)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.beginPath()
      g.arc(gx, gy, rad, 0, Math.PI * 2)
      g.fill()
    }
  }
  const t = canvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  return t
}

/** Degradado de cielo si la foto no carga. */
export function makeSkyFallback() {
  const c = makeCanvas(512, 512)
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#2a4f9a')
  grad.addColorStop(0.6, '#8fb6e8')
  grad.addColorStop(1, '#d9d4c7')
  g.fillStyle = grad
  g.fillRect(0, 0, 512, 512)
  return canvasTexture(c)
}
