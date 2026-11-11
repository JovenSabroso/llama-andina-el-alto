// Texturas procedurales de El Alto dibujadas con Canvas 2D (sin archivos externos).
// Cada capa es un "tile" de 1024x512 que se repite en horizontal, por eso todo
// lo que se dibuja es periódico o queda lejos de los bordes.
import * as THREE from 'three'

export const TILE_W = 1024
export const TILE_H = 512
export const GROUND_FRAC = 0.2 // fracción inferior del tile ocupada por el suelo

const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'

// Generador pseudoaleatorio determinista: mismas casas en cada ejecución.
function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function tileTexture(c) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.anisotropy = 4
  return t
}

// ---------------------------------------------------------------- Cielo
export function makeSky() {
  const c = canvas(TILE_W, TILE_H)
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, TILE_H)
  grad.addColorStop(0, '#1d2f6f') // altiplano: azul intenso a 4000 m
  grad.addColorStop(0.55, '#4f8fd6')
  grad.addColorStop(0.85, '#f6c28b')
  grad.addColorStop(1, '#f9e0b0')
  g.fillStyle = grad
  g.fillRect(0, 0, TILE_W, TILE_H)

  // sol
  const sun = g.createRadialGradient(780, 330, 5, 780, 330, 90)
  sun.addColorStop(0, 'rgba(255,245,200,1)')
  sun.addColorStop(1, 'rgba(255,230,160,0)')
  g.fillStyle = sun
  g.beginPath()
  g.arc(780, 330, 90, 0, Math.PI * 2)
  g.fill()

  // nubes
  const r = rng(7)
  g.fillStyle = 'rgba(255,255,255,0.85)'
  for (let i = 0; i < 6; i++) {
    const x = 110 + i * 150 + r() * 40
    const y = 60 + r() * 150
    for (let k = 0; k < 4; k++) {
      g.beginPath()
      g.ellipse(x + k * 30, y + (k % 2) * 8, 44 + r() * 14, 16 + r() * 6, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  return tileTexture(c)
}

// ----------------------------------------------------------- Montañas
// Cordillera tipo Illimani: suma de senos con ciclos enteros (tile sin costura).
export function makeMountains() {
  const c = canvas(TILE_W, TILE_H)
  const g = c.getContext('2d')
  const base = TILE_H * 0.86
  const height = (x) => {
    const u = (x / TILE_W) * Math.PI * 2
    return (
      Math.sin(u * 1 + 0.6) * 70 +
      Math.sin(u * 2 + 1.7) * 55 +
      Math.sin(u * 3 + 0.2) * 35 +
      Math.abs(Math.sin(u * 5 + 2.4)) * 28
    )
  }
  const peakTop = base - 245
  const grad = g.createLinearGradient(0, peakTop, 0, base)
  grad.addColorStop(0, '#ffffff') // nieve
  grad.addColorStop(0.28, '#eef3fb')
  grad.addColorStop(0.42, '#8f89c4') // roca violácea
  grad.addColorStop(1, '#5a4f93')
  g.fillStyle = grad
  g.beginPath()
  g.moveTo(0, TILE_H)
  for (let x = 0; x <= TILE_W; x += 4) g.lineTo(x, base - 120 - height(x))
  g.lineTo(TILE_W, TILE_H)
  g.closePath()
  g.fill()
  return tileTexture(c)
}

// ------------------------------------------------------------- Ciudad
const WIPHALA = ['#d62828', '#f77f00', '#fcbf49', '#ffffff', '#2a9d4a', '#1d6fb8', '#7b2cbf']

function drawWiphala(g, x, y, size) {
  const cell = size / 7
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      g.fillStyle = WIPHALA[(i + j) % 7]
      g.fillRect(x + j * cell, y + i * cell, cell + 0.5, cell + 0.5)
    }
  }
}

// Casas de ladrillo "a medio construir" con fierros en la azotea, típicas de El Alto.
export function makeCity() {
  const c = canvas(TILE_W, TILE_H)
  const g = c.getContext('2d')
  const base = TILE_H * 0.84
  const r = rng(21)
  const palette = ['#b5523b', '#c9794a', '#d9a25f', '#8f4a63', '#5c7da8', '#7a9e6f']
  let x = 6
  let n = 0
  while (x < TILE_W - 90) {
    const w = 62 + r() * 50
    const h = 60 + r() * 80
    const col = palette[Math.floor(r() * palette.length)]
    g.fillStyle = col
    g.fillRect(x, base - h, w, h)
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(x + w - 8, base - h, 8, h) // sombra lateral
    g.fillStyle = '#2d2438' // ventanas
    for (let wy = base - h + 16; wy < base - 28; wy += 34) {
      for (let wx = x + 10; wx < x + w - 24; wx += 26) g.fillRect(wx, wy, 12, 16)
    }
    // fierros de construcción
    g.strokeStyle = '#3b3b3b'
    g.lineWidth = 2
    for (let k = 0; k < 3; k++) {
      const rx = x + 10 + k * ((w - 20) / 2)
      g.beginPath()
      g.moveTo(rx, base - h)
      g.lineTo(rx, base - h - 14 - r() * 12)
      g.stroke()
    }
    if (n % 4 === 1) {
      g.fillStyle = '#e8e8e8' // tanque de agua
      g.fillRect(x + w / 2 - 12, base - h - 24, 24, 20)
    }
    if (n === 3) drawWiphala(g, x + 8, base - h - 46, 34)
    x += w + 4 + r() * 8
    n++
  }
  g.fillStyle = '#3b2f4a' // base oscura
  g.fillRect(0, base, TILE_W, TILE_H - base)
  return tileTexture(c)
}

// ---------------------------------------------------------- Teleférico
// Cable con cabinas de las líneas Roja, Amarilla y Verde (referencia a Mi Teleférico).
export function makeTeleferico() {
  const c = canvas(TILE_W, TILE_H)
  const g = c.getContext('2d')
  const y = TILE_H * 0.3
  g.strokeStyle = '#2b2b33'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(0, y)
  g.lineTo(TILE_W, y)
  g.stroke()
  // torres
  for (const tx of [90, 602]) {
    g.fillStyle = '#4a4a55'
    g.fillRect(tx - 7, y - 24, 14, TILE_H * 0.55)
    g.fillRect(tx - 28, y - 10, 56, 8)
  }
  const cabinas = [
    { x: 250, col: '#d62828' },
    { x: 520, col: '#fcbf49' },
    { x: 840, col: '#2a9d4a' },
  ]
  for (const cb of cabinas) {
    g.strokeStyle = '#2b2b33'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(cb.x, y)
    g.lineTo(cb.x, y + 24)
    g.stroke()
    g.fillStyle = cb.col
    g.beginPath()
    g.roundRect(cb.x - 24, y + 24, 48, 36, 8)
    g.fill()
    g.fillStyle = 'rgba(200,235,255,0.9)'
    g.fillRect(cb.x - 17, y + 32, 34, 14)
  }
  return tileTexture(c)
}

// --------------------------------------------------------------- Suelo
export function makeGround() {
  const c = canvas(TILE_W, TILE_H)
  const g = c.getContext('2d')
  const top = TILE_H * (1 - GROUND_FRAC)
  const grad = g.createLinearGradient(0, top, 0, TILE_H)
  grad.addColorStop(0, '#8a6a3d')
  grad.addColorStop(1, '#5b4226')
  g.fillStyle = grad
  g.fillRect(0, top, TILE_W, TILE_H - top)
  g.fillStyle = '#6fa24a' // paja brava en el borde
  g.fillRect(0, top, TILE_W, 8)
  const r = rng(5)
  g.fillStyle = 'rgba(0,0,0,0.18)'
  for (let i = 0; i < 40; i++) {
    g.beginPath()
    g.ellipse(20 + r() * (TILE_W - 40), top + 20 + r() * (TILE_H - top - 30), 6 + r() * 10, 3 + r() * 4, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = 'rgba(255,255,255,0.35)' // línea discontinua de la calle
  for (let x = 0; x < TILE_W; x += 128) g.fillRect(x, top + (TILE_H - top) * 0.62, 64, 5)
  return tileTexture(c)
}

// -------------------------------------------------------- Primer plano
export function makeForeground() {
  const c = canvas(TILE_W, TILE_H)
  const g = c.getContext('2d')
  const r = rng(13)
  g.strokeStyle = 'rgba(25,18,30,0.9)' // cables y poste
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(0, 70)
  g.lineTo(TILE_W, 70)
  g.moveTo(0, 86)
  g.lineTo(TILE_W, 86)
  g.stroke()
  g.fillStyle = 'rgba(25,18,30,0.95)'
  g.fillRect(693, 40, 14, TILE_H)
  g.fillRect(660, 56, 80, 8)
  g.strokeStyle = 'rgba(25,18,30,0.95)' // matas de paja brava
  g.lineWidth = 2.5
  for (let i = 0; i < 26; i++) {
    const bx = 14 + i * 38 + r() * 12
    for (let k = 0; k < 6; k++) {
      g.beginPath()
      g.moveTo(bx, TILE_H)
      g.quadraticCurveTo(bx + (k - 3) * 6, TILE_H - 40, bx + (k - 3) * 11, TILE_H - 50 - r() * 40)
      g.stroke()
    }
  }
  return tileTexture(c)
}

// ----------------------------------------------- Sprites (emoji y texto)
export function makeEmojiTexture(emoji, size = 128) {
  const c = canvas(size, size)
  const g = c.getContext('2d')
  g.font = `${size * 0.78}px ${EMOJI_FONT}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(emoji, size / 2, size / 2 + size * 0.05)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Crea un plano con texto. `userData.aspect` guarda ancho/alto para poder
 * reescalarlo cuando cambia el tamaño de la pantalla (ver placeText).
 */
export function makeTextMesh(lines, { font = 700, px = 64, color = '#fff', stroke = '#1b1230' } = {}) {
  const arr = Array.isArray(lines) ? lines : [lines]
  const fontStr = `${font} ${px}px "Segoe UI", system-ui, sans-serif`
  const measure = canvas(8, 8).getContext('2d')
  measure.font = fontStr
  const pad = px * 0.4
  const lineH = px * 1.25
  const w = Math.ceil(Math.max(...arr.map((l) => measure.measureText(l).width)) + pad * 2)
  const h = Math.ceil(lineH * arr.length + pad * 2)
  const c = canvas(w, h)
  const g = c.getContext('2d')
  g.font = fontStr
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineJoin = 'round'
  g.lineWidth = px * 0.16
  g.strokeStyle = stroke
  g.fillStyle = color
  arr.forEach((l, i) => {
    const y = pad + lineH * (i + 0.5)
    g.strokeText(l, w / 2, y)
    g.fillText(l, w / 2, y)
  })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
  mesh.userData.aspect = w / h
  return mesh
}

/** Ajusta un mesh de texto a una altura deseada sin pasarse de un ancho máximo. */
export function placeText(mesh, height, maxWidth) {
  const a = mesh.userData.aspect
  let w = height * a
  if (w > maxWidth) w = maxWidth
  mesh.scale.set(w, w / a, 1)
}
