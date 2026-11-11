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

/** Ajusta el tamaño de letra para que el texto quepa en un ancho. */
function fitText(g, text, maxW, px, weight = 900) {
  g.font = `${weight} ${px}px ${FONT}`
  while (g.measureText(text).width > maxW && px > 8) {
    px -= 2
    g.font = `${weight} ${px}px ${FONT}`
  }
  return px
}

/** Casilla de votación marcada con X ("marca así"). */
function ballot(g, x, y, size, color) {
  g.strokeStyle = color
  g.lineWidth = size * 0.1
  g.strokeRect(x, y, size, size)
  g.lineWidth = size * 0.14
  g.beginPath()
  g.moveTo(x + size * 0.15, y + size * 0.15)
  g.lineTo(x + size * 0.85, y + size * 0.85)
  g.moveTo(x + size * 0.85, y + size * 0.15)
  g.lineTo(x + size * 0.15, y + size * 0.85)
  g.stroke()
}

/** "Pinta" electoral pintada en la fachada (estilo El Alto, partido ficticio). */
export function makePintaTexture(p) {
  const c = makeCanvas(1024, 512)
  const g = c.getContext('2d')
  g.fillStyle = p.bg
  g.fillRect(0, 0, 1024, 512)
  // pintura gastada
  const r = rng(p.sigla.charCodeAt(0) * 7)
  g.fillStyle = 'rgba(90,70,50,0.12)'
  for (let i = 0; i < 40; i++) g.fillRect(r() * 1024, r() * 512, 20 + r() * 80, 4 + r() * 10)
  g.fillStyle = p.main
  g.fillRect(0, 0, 1024, 70)
  g.fillRect(0, 442, 1024, 70)
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  g.fillStyle = p.accent
  fitText(g, 'VOTA', 300, 70)
  g.fillText('VOTA', 40, 125)
  g.fillStyle = p.main
  fitText(g, p.nombre, 700, 130)
  g.fillText(p.nombre, 40, 235)
  g.fillStyle = p.accent
  fitText(g, p.lema, 940, 52, 700)
  g.fillText(p.lema, 40, 360)
  // sigla + casilla marcada
  g.fillStyle = p.main
  g.beginPath()
  g.arc(870, 175, 95, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = p.bg
  g.textAlign = 'center'
  fitText(g, p.sigla, 150, 70)
  g.fillText(p.sigla, 870, 178)
  ballot(g, 820, 290, 100, p.accent)
  return canvasTexture(c)
}

/** Afiche de candidato pegado en los postes. */
export function makePosterTexture(p) {
  const c = makeCanvas(256, 352)
  const g = c.getContext('2d')
  g.fillStyle = p.main
  g.fillRect(0, 0, 256, 352)
  g.fillStyle = p.bg
  g.fillRect(12, 12, 232, 220)
  // retrato caricaturesco del candidato (sonrisa de campaña)
  g.fillStyle = '#c68a5e'
  g.beginPath()
  g.arc(128, 120, 62, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#1b1b1b'
  g.fillRect(70, 52, 116, 26)
  g.beginPath()
  g.arc(105, 112, 7, 0, Math.PI * 2)
  g.arc(151, 112, 7, 0, Math.PI * 2)
  g.fill()
  g.fillRect(100, 136, 56, 9) // bigote
  g.strokeStyle = '#1b1b1b'
  g.lineWidth = 5
  g.beginPath()
  g.arc(128, 150, 24, 0.15 * Math.PI, 0.85 * Math.PI)
  g.stroke()
  g.fillStyle = p.accent
  g.fillRect(66, 190, 124, 42) // corbata/saco
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  fitText(g, p.nombre, 236, 34)
  g.fillText(p.nombre, 128, 262)
  fitText(g, `VOTA ${p.sigla}`, 150, 36)
  g.fillText(`VOTA ${p.sigla}`, 100, 312)
  ballot(g, 188, 288, 46, '#ffffff')
  return canvasTexture(c)
}

/** Dibuja una imagen recortada para llenar un rectángulo (como object-fit: cover). */
function drawCover(g, img, x, y, w, h, focusY = 0.3) {
  const s = Math.max(w / img.width, h / img.height)
  const sw = w / s
  const sh = h / s
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) * focusY
  g.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

/**
 * Afiche de un alcalde real (datos de contenido.js + foto CC BY).
 * wide = gigantografía horizontal; si no, afiche vertical para postes.
 */
export function makeMayorPosterTexture(a, img, { wide = false } = {}) {
  const W = wide ? 1024 : 384
  const H = wide ? 512 : 528
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')
  g.fillStyle = a.main
  g.fillRect(0, 0, W, H)
  const photo = wide ? [24, 24, 400, H - 48] : [18, 18, W - 36, 300]
  if (img) drawCover(g, img, ...photo)
  else {
    g.fillStyle = '#ccc'
    g.fillRect(...photo)
  }
  g.strokeStyle = a.accent
  g.lineWidth = 6
  g.strokeRect(...photo)
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const tx = wide ? 724 : W / 2
  const tw = wide ? 560 : W - 30
  const lines = wide
    ? [[a.cargo, 44, 900, 110], [a.nombre, 92, 900, 215], [a.periodo, 46, 700, 305], [a.sigla, 64, 900, 400]]
    : [[a.nombre, 46, 900, 360], [a.cargo, 26, 800, 405], [a.periodo, 26, 700, 440], [a.sigla, 38, 900, 486]]
  for (const [text, px, weight, y] of lines) {
    g.fillStyle = text === a.sigla ? a.accent : '#ffffff'
    fitText(g, text, tw, px, weight)
    g.fillText(text, tx, y)
  }
  // crédito de la foto (obligatorio por la licencia CC BY)
  g.fillStyle = 'rgba(255,255,255,0.8)'
  g.font = `600 ${wide ? 18 : 13}px ${FONT}`
  g.textAlign = wide ? 'right' : 'center'
  g.fillText(a.credito, wide ? W - 16 : W / 2, H - (wide ? 18 : 12))
  return canvasTexture(c)
}

/** Bache: hueco irregular con grietas (fondo transparente). */
export function makePotholeTexture() {
  const c = makeCanvas(256, 256)
  const g = c.getContext('2d')
  const r = rng(77)
  const pts = []
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    const rad = 80 + r() * 38
    pts.push([128 + Math.cos(a) * rad, 128 + Math.sin(a) * rad])
  }
  // borde de asfalto roto
  g.fillStyle = '#4a4540'
  g.beginPath()
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.closePath()
  g.fill()
  // fondo del hueco (más oscuro al centro)
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 100)
  grad.addColorStop(0, '#0e0c0b')
  grad.addColorStop(1, '#2c2723')
  g.fillStyle = grad
  g.beginPath()
  pts.forEach(([x, y], i) => {
    const px = 128 + (x - 128) * 0.82
    const py = 128 + (y - 128) * 0.82
    i ? g.lineTo(px, py) : g.moveTo(px, py)
  })
  g.closePath()
  g.fill()
  // piedritas y grietas
  g.fillStyle = '#6b625a'
  for (let i = 0; i < 14; i++) g.fillRect(70 + r() * 116, 70 + r() * 116, 4 + r() * 6, 3 + r() * 5)
  g.strokeStyle = '#1a1716'
  g.lineWidth = 2.5
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2
    g.beginPath()
    g.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100)
    g.lineTo(128 + Math.cos(a + 0.15) * 124, 128 + Math.sin(a + 0.15) * 124)
    g.stroke()
  }
  return canvasTexture(c)
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
