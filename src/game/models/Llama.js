// La protagonista: llama de tránsito modelada con primitivas de Three.js.
// Inspirada en la llama de carga andina: pelaje marrón, arnés de cuero, alforjas
// verdes y silla. Sobre la silla lleva un RADAR DE VELOCIDAD (no un arma) y una
// gorra de tránsito. Mira hacia -z (hacia el tráfico que se acerca).
import * as THREE from 'three'
import { makeSignTexture } from '../utils/textures.js'

const COLORS = {
  fur: 0x8a4b26,
  furDark: 0x5a2f17,
  hoof: 0x231711,
  snout: 0x3b2417,
  leather: 0x5c3a1e,
  saddle: 0x2e2219,
  blanket: 0x4b5a36,
  reflect: 0xd7ff3a,
  metal: 0x2b2d31,
  cap: 0xf2f2f2,
  capBand: 0x1d3f8f,
}

const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra })

export class Llama {
  constructor() {
    this.group = new THREE.Group()
    this.t = 0
    this.walkPhase = 0
    this.spitT = 0
    this.dance = false
    const m = {
      fur: mat(COLORS.fur),
      furDark: mat(COLORS.furDark),
      hoof: mat(COLORS.hoof),
      snout: mat(COLORS.snout),
      leather: mat(COLORS.leather),
      saddle: mat(COLORS.saddle),
      blanket: mat(COLORS.blanket),
      reflect: mat(COLORS.reflect, { emissive: COLORS.reflect, emissiveIntensity: 0.35 }),
      metal: mat(COLORS.metal, { roughness: 0.4, metalness: 0.6 }),
      black: mat(0x0b0b0b, { roughness: 0.3 }),
      white: mat(0xffffff),
      cap: mat(COLORS.cap),
      capBand: mat(COLORS.capBand),
      screen: new THREE.MeshBasicMaterial({ color: 0x5cff7a }),
      led: new THREE.MeshBasicMaterial({ color: 0xff2a2a }),
    }
    const add = (parent, geo, material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geo, material)
      mesh.position.set(x, y, z)
      mesh.castShadow = true
      parent.add(mesh)
      return mesh
    }
    const g = this.group

    // Cuerpo (esfera achatada)
    this.body = add(g, new THREE.SphereGeometry(1, 16, 12), m.fur, 0, 1.75, 0)
    this.body.scale.set(0.72, 0.62, 1.15)

    // Patas: un "hueso" (Group) por pata para poder animarlas al caminar
    this.legs = []
    for (const [x, z] of [[-0.36, -0.72], [0.36, -0.72], [-0.36, 0.72], [0.36, 0.72]]) {
      const hip = new THREE.Group()
      hip.position.set(x, 1.45, z)
      add(hip, new THREE.CylinderGeometry(0.16, 0.12, 0.8, 8), m.fur, 0, -0.4, 0)
      add(hip, new THREE.CylinderGeometry(0.11, 0.09, 0.6, 8), m.furDark, 0, -1.0, 0)
      add(hip, new THREE.CylinderGeometry(0.1, 0.13, 0.12, 8), m.hoof, 0, -1.33, 0)
      g.add(hip)
      this.legs.push(hip)
    }

    // Cola
    add(g, new THREE.SphereGeometry(0.2, 8, 6), m.fur, 0, 2.0, 1.15)

    // Cuello (pivote en la base para la animación del escupitajo)
    this.neck = new THREE.Group()
    this.neck.position.set(0, 2.05, -0.85)
    this.neckBase = -0.22
    this.neck.rotation.x = this.neckBase
    g.add(this.neck)
    add(this.neck, new THREE.CylinderGeometry(0.2, 0.28, 1.5, 10), m.fur, 0, 0.75, 0)

    // Cabeza
    this.head = new THREE.Group()
    this.head.position.set(0, 1.55, 0)
    this.head.rotation.x = -this.neckBase
    this.neck.add(this.head)
    const skull = add(this.head, new THREE.SphereGeometry(1, 12, 10), m.fur)
    skull.scale.set(0.3, 0.3, 0.42)
    const snout = add(this.head, new THREE.SphereGeometry(1, 10, 8), m.snout, 0, -0.06, -0.4)
    snout.scale.set(0.19, 0.17, 0.24)
    for (const s of [-1, 1]) {
      add(this.head, new THREE.SphereGeometry(0.065, 8, 6), m.black, s * 0.22, 0.08, -0.16)
      add(this.head, new THREE.SphereGeometry(0.022, 6, 4), m.white, s * 0.24, 0.11, -0.2)
      const ear = add(this.head, new THREE.ConeGeometry(0.08, 0.42, 6), m.fur, s * 0.2, 0.4, 0.06)
      ear.rotation.z = -s * 0.3
    }
    // Cabestro de cuero alrededor del hocico
    add(this.head, new THREE.TorusGeometry(0.2, 0.03, 6, 16), m.leather, 0, -0.05, -0.34)
    // Gorra de tránsito
    add(this.head, new THREE.CylinderGeometry(0.25, 0.23, 0.16, 14), m.cap, 0, 0.38, 0.02)
    add(this.head, new THREE.CylinderGeometry(0.245, 0.245, 0.06, 14), m.capBand, 0, 0.3, 0.02)
    const visor = add(this.head, new THREE.BoxGeometry(0.34, 0.03, 0.2), m.black, 0, 0.29, -0.26)
    visor.rotation.x = 0.25
    // Punto desde donde sale el escupitajo
    this.mouth = new THREE.Object3D()
    this.mouth.position.set(0, -0.12, -0.66)
    this.head.add(this.mouth)

    // Alforjas verdes (manta) con franja reflectiva y letrero TRÁNSITO
    for (const s of [-1, 1]) {
      add(g, new THREE.BoxGeometry(0.08, 0.8, 1.0), m.blanket, s * 0.74, 1.65, 0.05)
      add(g, new THREE.BoxGeometry(0.09, 0.12, 1.0), m.reflect, s * 0.75, 1.42, 0.05)
    }
    add(g, new THREE.BoxGeometry(1.5, 0.08, 1.0), m.blanket, 0, 2.38, 0.05)
    const signTex = makeSignTexture('TRÁNSITO', { bg: '#4b5a36', fg: '#f4f4f4', w: 256, h: 64 })
    const signMat = new THREE.MeshBasicMaterial({ map: signTex })
    for (const s of [-1, 1]) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), signMat)
      sign.position.set(s * 0.795, 1.78, 0.05)
      sign.rotation.y = s * Math.PI / 2
      g.add(sign)
    }

    // Correas de cuero (pecho y barriga)
    const chest = add(g, new THREE.TorusGeometry(1, 0.05, 6, 20), m.leather, 0, 1.75, -0.72)
    chest.scale.set(0.57, 0.5, 1)
    const belly = add(g, new THREE.TorusGeometry(1, 0.05, 6, 20), m.leather, 0, 1.75, 0.45)
    belly.scale.set(0.74, 0.64, 1)

    // Silla de carga
    add(g, new THREE.BoxGeometry(0.72, 0.16, 0.78), m.saddle, 0, 2.5, 0.05)
    add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6), m.saddle, 0, 2.66, -0.3)

    // Radar de velocidad montado sobre la silla (guiño a la foto, sin violencia)
    add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), m.metal, 0, 2.75, 0.1)
    this.radar = new THREE.Group()
    this.radar.position.set(0, 2.98, 0.1)
    g.add(this.radar)
    add(this.radar, new THREE.BoxGeometry(0.22, 0.24, 0.62), m.metal)
    const lens = add(this.radar, new THREE.CylinderGeometry(0.12, 0.12, 0.12, 12), m.black, 0, 0, -0.36)
    lens.rotation.x = Math.PI / 2
    add(this.radar, new THREE.BoxGeometry(0.1, 0.22, 0.12), m.metal, 0, -0.18, 0.2)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.12), m.screen)
    screen.position.set(0, 0.03, 0.312)
    this.radar.add(screen)
    this.led = add(this.radar, new THREE.SphereGeometry(0.035, 6, 4), m.led, 0.07, 0.14, 0.2)
  }

  /** Posición mundial de la boca (origen del escupitajo). */
  mouthPosition(target) {
    this.group.updateMatrixWorld(true)
    return this.mouth.getWorldPosition(target)
  }

  spit() {
    this.spitT = 0.35
  }

  /** @param walkDir -1 izquierda, 0 quieta, 1 derecha */
  update(dt, walkDir = 0) {
    this.t += dt
    const t = this.t
    // respiración
    this.body.scale.y = 0.62 * (1 + Math.sin(t * 2.2) * 0.015)

    // patas: trote en diagonal cuando camina
    if (walkDir !== 0 || this.dance) {
      this.walkPhase += dt * 14
      const a = Math.sin(this.walkPhase) * 0.55
      this.legs[0].rotation.x = a
      this.legs[3].rotation.x = a
      this.legs[1].rotation.x = -a
      this.legs[2].rotation.x = -a
    } else {
      for (const l of this.legs) l.rotation.x *= Math.max(0, 1 - dt * 10)
    }

    // gira el cuerpo hacia donde camina
    const targetYaw = this.dance ? Math.PI + Math.sin(t * 3) * 0.8 : -walkDir * 0.45 // al bailar mira a la cámara
    this.group.rotation.y += (targetYaw - this.group.rotation.y) * Math.min(1, dt * 10)

    // cuello: balanceo + latigazo del escupitajo
    let neck = this.neckBase + Math.sin(t * 1.3) * 0.04
    if (this.spitT > 0) {
      this.spitT -= dt
      const p = 1 - Math.max(0, this.spitT) / 0.35
      neck -= Math.sin(p * Math.PI) * 0.55
      this.head.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.12)
    } else {
      this.head.scale.setScalar(1)
    }
    if (this.dance) neck += Math.sin(t * 6) * 0.25
    this.neck.rotation.x = neck

    // LED del radar parpadea
    this.led.visible = Math.floor(t * 3) % 2 === 0
  }
}
