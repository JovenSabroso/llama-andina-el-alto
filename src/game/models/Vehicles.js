// Vehículos de El Alto modelados con cajas y cilindros: auto/trufi, minibús
// (con letrero de ruta y bulto de aguayo), moto y ambulancia.
// Todos miran hacia +z (vienen hacia la cámara). Origen = centro a nivel del suelo.
import * as THREE from 'three'
import { makeSignTexture, makeAguayoTexture } from '../utils/textures.js'
import { RUTAS } from '../data/contenido.js'

const CAR_COLORS = [0xc0392b, 0x2e86de, 0xf1c40f, 0xecf0f1, 0x27ae60, 0x8e44ad, 0x34495e, 0xe67e22]
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra })

function box(parent, w, h, d, material, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  m.position.set(x, y, z)
  m.castShadow = shadow
  parent.add(m)
  return m
}

function wheels(group, list, r, w) {
  const geo = new THREE.CylinderGeometry(r, r, w, 12)
  const material = std(0x151515, { roughness: 0.9 })
  return list.map(([x, z]) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, r, z)
    const m = new THREE.Mesh(geo, material)
    m.rotation.z = Math.PI / 2
    pivot.add(m)
    group.add(pivot)
    return pivot
  })
}

function lights(group, w, y, zFront, zBack) {
  const head = new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff2b0, emissiveIntensity: 1.2 })
  const tail = new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0xff2020, emissiveIntensity: 0.8 })
  for (const s of [-1, 1]) {
    box(group, 0.4, 0.18, 0.05, head, s * (w / 2 - 0.35), y, zFront, false)
    box(group, 0.35, 0.16, 0.05, tail, s * (w / 2 - 0.3), y, zBack, false)
  }
}

function glass() {
  return std(0x1e2a36, { roughness: 0.15, metalness: 0.4 })
}

function makeAuto(trufi) {
  const g = new THREE.Group()
  const body = std(trufi ? 0xf4f1e8 : pick(CAR_COLORS), { metalness: 0.3 })
  box(g, 2.0, 0.75, 4.2, body, 0, 0.75, 0)
  box(g, 1.8, 0.62, 2.2, glass(), 0, 1.42, -0.2)
  box(g, 1.82, 0.07, 2.0, body, 0, 1.76, -0.25)
  lights(g, 2.0, 0.85, 2.11, -2.11)
  const w = wheels(g, [[-1, 1.35], [1, 1.35], [-1, -1.35], [1, -1.35]], 0.38, 0.28)
  if (trufi) {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.35, 0.3),
      new THREE.MeshStandardMaterial({ map: makeSignTexture('TRUFI', { bg: '#fcbf49', w: 256, h: 80 }) }),
    )
    sign.position.set(0, 1.97, -0.2)
    g.add(sign)
  }
  return { group: g, wheels: w, wheelR: 0.38, len: 4.2, width: 2.0, height: 1.8 }
}

function makeMinibus() {
  const g = new THREE.Group()
  const stripe = pick([0x1d6fb8, 0xc1121f, 0x2a9d4a, 0xf77f00])
  box(g, 2.2, 2.0, 5.6, std(0xf4f1e8), 0, 1.3, 0)
  box(g, 2.24, 0.35, 5.64, std(stripe), 0, 0.75, 0)
  box(g, 2.24, 0.6, 4.4, glass(), 0, 1.8, -0.4)
  box(g, 2.0, 0.8, 0.06, glass(), 0, 1.75, 2.8)
  // letrero de ruta en el frente (lo ve el jugador)
  const route = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.38),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(pick(RUTAS), { bg: '#ffffff', fg: '#c1121f', w: 512, h: 100 }) }),
  )
  route.position.set(0, 2.4, 2.81)
  g.add(route)
  // bulto con aguayo sobre el techo
  const bundle = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.55, 1.5),
    new THREE.MeshStandardMaterial({ map: makeAguayoTexture(), roughness: 0.9 }),
  )
  bundle.position.set(0, 2.58, -1.2)
  bundle.rotation.y = 0.15
  bundle.castShadow = true
  g.add(bundle)
  lights(g, 2.2, 0.9, 2.81, -2.81)
  const w = wheels(g, [[-1.05, 1.9], [1.05, 1.9], [-1.05, -1.9], [1.05, -1.9]], 0.45, 0.3)
  return { group: g, wheels: w, wheelR: 0.45, len: 5.6, width: 2.2, height: 2.9 }
}

function makeMoto(helmet) {
  const g = new THREE.Group()
  const frame = std(pick([0xc1121f, 0x111111, 0x1d6fb8]), { metalness: 0.4 })
  box(g, 0.32, 0.4, 1.4, frame, 0, 0.72, 0)
  box(g, 0.7, 0.06, 0.06, std(0x222222), 0, 1.15, 0.55)
  const w = wheels(g, [[0, 0.68], [0, -0.68]], 0.38, 0.14)
  // conductor
  const jacket = std(pick([0x2b2d42, 0x6d4c41, 0x1b4332, 0x7f1d1d]))
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.75, 8), jacket)
  torso.position.set(0, 1.35, -0.1)
  torso.castShadow = true
  g.add(torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), std(0xb07850))
  head.position.set(0, 1.92, -0.05)
  g.add(head)
  if (helmet) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), std(pick([0xf1c40f, 0xffffff, 0xc1121f]), { roughness: 0.2 }))
    h.position.set(0, 1.97, -0.05)
    h.castShadow = true
    g.add(h)
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), std(0x111111))
    hair.position.set(0, 1.95, -0.05)
    g.add(hair)
  }
  return { group: g, wheels: w, wheelR: 0.38, len: 1.9, width: 0.8, height: 2.2 }
}

function makeAmbulancia() {
  const g = new THREE.Group()
  box(g, 2.3, 2.2, 5.2, std(0xffffff), 0, 1.4, 0)
  box(g, 2.34, 0.3, 5.24, std(0xd62828), 0, 1.0, 0)
  box(g, 2.0, 0.8, 0.06, glass(), 0, 1.95, 2.6)
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.35),
    new THREE.MeshBasicMaterial({ map: makeSignTexture('AMBULANCIA', { bg: '#ffffff', fg: '#d62828', w: 512, h: 100 }) }),
  )
  sign.position.set(0, 2.38, 2.62)
  g.add(sign)
  // sirenas: se alternan en update()
  const red = new THREE.MeshBasicMaterial({ color: 0xff2020 })
  const blue = new THREE.MeshBasicMaterial({ color: 0x2060ff })
  const sirens = [box(g, 0.6, 0.2, 0.4, red, -0.45, 2.6, 1.6, false), box(g, 0.6, 0.2, 0.4, blue, 0.45, 2.6, 1.6, false)]
  lights(g, 2.3, 0.9, 2.61, -2.61)
  const w = wheels(g, [[-1.05, 1.7], [1.05, 1.7], [-1.05, -1.7], [1.05, -1.7]], 0.45, 0.3)
  return { group: g, wheels: w, wheelR: 0.45, len: 5.2, width: 2.3, height: 2.7, sirens }
}

/** Crea un vehículo. type: 'auto' | 'trufi' | 'minibus' | 'moto' | 'ambulancia' */
export function createVehicle(type, { helmet = true } = {}) {
  switch (type) {
    case 'minibus':
      return makeMinibus()
    case 'moto':
      return makeMoto(helmet)
    case 'ambulancia':
      return makeAmbulancia()
    case 'trufi':
      return makeAuto(true)
    default:
      return makeAuto(false)
  }
}

/** Animación por frame: ruedas y sirenas. */
export function animateVehicle(v, dt, t) {
  const spin = (v.speed * dt) / v.model.wheelR
  for (const w of v.model.wheels) w.rotation.x += spin
  if (v.model.sirens) {
    const on = Math.floor(t * 6) % 2 === 0
    v.model.sirens[0].visible = on
    v.model.sirens[1].visible = !on
  }
}
