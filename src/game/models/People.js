// Peatones y cholitas (pollera, manta, sombrero tipo bombín y trenzas).
import * as THREE from 'three'

const std = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true })
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const SKIN = [0xb07850, 0x9a6440, 0xc68a5e]

function mesh(parent, geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = true
  parent.add(m)
  return m
}

/** Cholita. Con `inspectora` lleva chaleco reflectivo y silbato. */
export function createCholita({ inspectora = false } = {}) {
  const g = new THREE.Group()
  const pollera = inspectora ? 0xd62828 : pick([0xc1121f, 0x7b2cbf, 0x1d6fb8, 0xf77f00, 0x2a9d4a, 0xd63384])
  const manta = inspectora ? 0xd7ff3a : pick([0x6d4c41, 0x8d6e63, 0xe9c46a, 0x264653])
  mesh(g, new THREE.CylinderGeometry(0.28, 0.62, 0.95, 12), std(pollera), 0, 0.5, 0)
  mesh(g, new THREE.CylinderGeometry(0.26, 0.34, 0.6, 10), std(manta), 0, 1.25, 0)
  mesh(g, new THREE.SphereGeometry(0.2, 10, 8), std(pick(SKIN)), 0, 1.75, 0)
  const hat = std(inspectora ? 0x1b1230 : pick([0x3b2a1d, 0x1b1b1b, 0x5a4636]))
  mesh(g, new THREE.CylinderGeometry(0.11, 0.14, 0.24, 10), hat, 0, 2.03, 0)
  mesh(g, new THREE.CylinderGeometry(0.22, 0.22, 0.03, 12), hat, 0, 1.92, 0)
  const braid = std(0x111111)
  for (const s of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.035, 0.03, 0.6, 5), braid, s * 0.1, 1.45, 0.17)
  if (inspectora) mesh(g, new THREE.BoxGeometry(0.06, 0.06, 0.2), std(0xc0c0c0), 0.05, 1.68, -0.24) // silbato
  return { group: g, cholita: true }
}

export function createPeaton() {
  const g = new THREE.Group()
  const legs = std(pick([0x1d3557, 0x2b2d42, 0x495057]))
  const legL = mesh(g, new THREE.CylinderGeometry(0.1, 0.1, 0.85, 6), legs, -0.12, 0.43, 0)
  const legR = mesh(g, new THREE.CylinderGeometry(0.1, 0.1, 0.85, 6), legs, 0.12, 0.43, 0)
  mesh(g, new THREE.CylinderGeometry(0.24, 0.28, 0.85, 8), std(pick([0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0x8338ec])), 0, 1.28, 0)
  mesh(g, new THREE.SphereGeometry(0.21, 10, 8), std(pick(SKIN)), 0, 1.92, 0)
  mesh(g, new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), std(0x111111), 0, 1.97, 0)
  return { group: g, legs: [legL, legR] }
}

/** Animación de caminar (piernas o vaivén de pollera) y salto de susto. */
export function animatePerson(p, dt) {
  p.phase = (p.phase || 0) + dt * 9
  if (p.legs) {
    p.legs[0].rotation.x = Math.sin(p.phase) * 0.5
    p.legs[1].rotation.x = -Math.sin(p.phase) * 0.5
  } else {
    p.group.rotation.z = Math.sin(p.phase) * 0.06
  }
  let y = Math.abs(Math.sin(p.phase)) * 0.06
  if (p.scared > 0) {
    p.scared -= dt
    y += Math.sin((1 - p.scared / 0.6) * Math.PI) * 1.2
  }
  p.group.position.y = y
}
