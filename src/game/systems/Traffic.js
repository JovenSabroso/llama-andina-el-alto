// Sistema de tráfico: aparición de vehículos, seguimiento del de adelante,
// frenado ante el semáforo y los peatones, infracciones y peatones en la cebra.
import * as THREE from 'three'
import { LANES, STOP_Z, ZEBRA, SPAWN_Z, DESPAWN_Z, ESCAPE_Z, BUBBLE_Z } from '../config.js'
import { INFRACCIONES } from '../data/contenido.js'
import { createVehicle, animateVehicle } from '../models/Vehicles.js'
import { createCholita, createPeaton, animatePerson } from '../models/People.js'
import { makeLabel } from '../utils/textures.js'

const DECEL = 26 // m/s² de frenado "cómodo" usado para calcular la velocidad segura
const ACCEL = 9
const GAP = 1.8 // distancia mínima con el vehículo de adelante

const TYPES = [
  { type: 'auto', w: 30, speed: 15 },
  { type: 'trufi', w: 12, speed: 15 },
  { type: 'minibus', w: 30, speed: 13 },
  { type: 'moto', w: 18, speed: 16 },
  { type: 'ambulancia', w: 5, speed: 21 },
]

function weighted(list) {
  let total = list.reduce((a, b) => a + b.w, 0)
  let r = Math.random() * total
  for (const it of list) if ((r -= it.w) <= 0) return it
  return list[0]
}

export class Traffic {
  /**
   * @param demo   sin infracciones (menú y pantalla final)
   * @param events onEscape(v), onRedRun(v), onAmbulance(), onBump(v)
   */
  constructor(root, world, { demo = false, events = {} } = {}) {
    this.root = root
    this.world = world
    this.demo = demo
    this.events = events
    this.vehicles = []
    this.peds = []
    this.elapsed = 0
    this.spawnTimer = 0.2
    this.freeze = 0
    this.lastLight = world.light.state
    this.t = 0
    // globos de infracción: una textura por tipo, compartida
    this.bubbleTex = {}
    for (const [key, inf] of Object.entries(INFRACCIONES)) {
      this.bubbleTex[key] = makeLabel(`${inf.emoji} ${inf.label}`, { bg: '#ffffff', fg: '#c1121f', px: 52 })
    }
    // al empezar ya hay algunos autos en la avenida
    for (let i = 0; i < 6; i++) this._spawn(SPAWN_Z + 25 + i * 22)
  }

  get difficulty() {
    return Math.min(1, this.elapsed / 150) // 0 → 1 en 2,5 minutos
  }

  _spawn(z = SPAWN_Z) {
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5)
    const lane = lanes.find((l) => !this.vehicles.some((v) => v.lane === l && v.z - v.len / 2 < z + 14))
    if (lane === undefined) return
    const spec = weighted(TYPES)
    let infraction = null
    if (!this.demo && spec.type !== 'ambulancia' && Math.random() < 0.35 + this.difficulty * 0.2) {
      const options = spec.type === 'moto' ? ['casco', 'casco', 'celular', 'velocidad', 'rojo'] : ['celular', 'velocidad', 'rojo', 'rojo']
      infraction = options[Math.floor(Math.random() * options.length)]
    }
    const model = createVehicle(spec.type, { helmet: infraction !== 'casco' })
    let cruise = spec.speed * (1 + this.difficulty * 0.35) * (0.9 + Math.random() * 0.2)
    if (infraction === 'velocidad') cruise *= 1.6
    const v = {
      model,
      type: spec.type,
      lane,
      z,
      len: model.len,
      width: model.width,
      height: model.height,
      speed: cruise * 0.8,
      cruise,
      infraction,
      // 'rojo' solo es infractor si de verdad cruza en rojo (se decide al pasar la línea)
      infractor: infraction !== null && infraction !== 'rojo',
      ignoresRed: infraction === 'rojo' || spec.type === 'ambulancia',
      fined: false,
      escaped: false,
      bubble: null,
    }
    model.group.position.set(LANES[lane], 0, z)
    this.root.add(model.group)
    if (v.infractor) this._addBubble(v, infraction)
    if (spec.type === 'ambulancia') this.events.onAmbulance?.()
    this.vehicles.push(v)
  }

  _addBubble(v, key) {
    const { texture, aspect } = this.bubbleTex[key]
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false }))
    sprite.scale.set(0.05 * aspect, 0.05, 1) // tamaño constante en pantalla
    sprite.position.y = v.height + 1.1
    sprite.renderOrder = 10
    v.model.group.add(sprite)
    v.bubble = sprite
  }

  removeBubble(v) {
    if (!v.bubble) return
    v.model.group.remove(v.bubble)
    v.bubble.material.dispose()
    v.bubble = null
  }

  _spawnPeds() {
    const n = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) {
      const p = Math.random() < 0.5 ? createCholita() : createPeaton()
      const dir = Math.random() < 0.5 ? 1 : -1
      p.dir = dir
      p.x = -dir * 7.5 - dir * i * 1.4 // en fila, entrando desde la acera
      p.speed = 2.4 + Math.random() * 0.6
      p.scared = 0
      p.group.position.set(p.x, 0, ZEBRA.z0 + 0.6 + Math.random() * (ZEBRA.z1 - ZEBRA.z0 - 1.2))
      p.group.rotation.y = -dir * Math.PI / 2
      this.root.add(p.group)
      this.peds.push(p)
    }
  }

  /** ¿Hay un peatón en la calzada sobre este carril? */
  _laneBlocked(lane) {
    return this.peds.some((p) => Math.abs(p.x) < 6 && Math.abs(p.x - LANES[lane]) < 2.3)
  }

  update(dt) {
    this.t += dt
    const light = this.world.light.state
    if (light !== this.lastLight) {
      if (light === 'rojo') this._spawnPeds()
      this.lastLight = light
    }
    if (this.freeze > 0) {
      this.freeze -= dt
      return
    }
    this.elapsed += dt

    // aparición
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this._spawn()
      this.spawnTimer = Math.max(0.55, 1.5 - this.difficulty * 0.9) * (0.7 + Math.random() * 0.6)
    }

    // movimiento por carril: cada vehículo mira al de adelante
    for (let lane = 0; lane < 3; lane++) {
      const list = this.vehicles.filter((v) => v.lane === lane).sort((a, b) => b.z - a.z)
      const blocked = this._laneBlocked(lane)
      list.forEach((v, i) => {
        const front = v.z + v.len / 2
        let obstacle = Infinity
        const leader = list[i - 1]
        if (leader) obstacle = leader.z - leader.len / 2 - GAP
        const beforeLine = front < STOP_Z - 0.3
        if (!v.ignoresRed && beforeLine) {
          const tooLateToStop = light === 'amarillo' && front > STOP_Z - 7
          if (light === 'rojo' || (light === 'amarillo' && !tooLateToStop)) obstacle = Math.min(obstacle, STOP_Z - 0.6)
        }
        if (blocked && front < ZEBRA.z0 - 0.2 && v.type !== 'ambulancia' && !(v.infraction === 'rojo')) {
          obstacle = Math.min(obstacle, ZEBRA.z0 - 0.8)
        }
        let target = v.cruise
        if (v.infraction === 'rojo' && light !== 'verde') target *= 1.25 // acelera para "ganarle" al semáforo
        if (obstacle < Infinity) target = Math.min(target, Math.sqrt(2 * DECEL * Math.max(0, obstacle - front)))
        if (v.fined) target = Math.min(target, 7) // multado: avanza despacio y avergonzado
        v.speed = v.speed < target ? Math.min(target, v.speed + ACCEL * dt) : Math.max(target, v.speed - DECEL * 1.6 * dt)

        const prevFront = front
        v.z += v.speed * dt
        const newFront = v.z + v.len / 2
        // ¿cruzó la línea de pare en rojo?
        if (prevFront <= STOP_Z && newFront > STOP_Z && light === 'rojo') {
          if (v.infraction === 'rojo' && !v.fined) {
            v.infractor = true
            this._addBubble(v, 'rojo')
            this.events.onRedRun?.(v)
          }
        } else if (prevFront <= STOP_Z && newFront > STOP_Z && v.infraction === 'rojo') {
          v.infraction = null // pasó en verde: no cometió infracción
        }
        if (v.infractor && !v.fined && !v.escaped && newFront > ESCAPE_Z) {
          v.escaped = true
          this.removeBubble(v)
          this.events.onEscape?.(v)
        }
        // ¿una rueda cayó en un bache? salto + frenazo
        const vx = LANES[v.lane]
        for (const b of this.world.baches) {
          if (prevFront < b.z && newFront >= b.z && Math.abs(vx - b.x) < v.width / 2 + b.r) {
            v.bump = 0.4
            v.speed *= 0.72
            this.events.onBump?.(v)
            break
          }
        }
        if (v.bump > 0) {
          v.bump -= dt
          const p = 1 - Math.max(0, v.bump) / 0.4
          const amp = v.type === 'moto' ? 0.45 : 0.25
          v.model.group.position.y = Math.sin(p * Math.PI) * amp
          v.model.group.rotation.x = Math.sin(p * Math.PI * 2) * 0.07
          v.model.group.rotation.z = Math.sin(p * Math.PI * 3) * 0.04
        } else if (v.model.group.position.y !== 0) {
          v.model.group.position.y = 0
          v.model.group.rotation.set(0, 0, 0)
        }
        if (v.bubble) v.bubble.visible = v.z > BUBBLE_Z
        v.model.group.position.z = v.z
        animateVehicle(v, dt, this.t)
      })
    }

    // retirar los que ya pasaron detrás de la cámara
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i]
      if (v.z - v.len / 2 > DESPAWN_Z) {
        this.removeBubble(v)
        this._disposeGroup(v.model.group)
        this.vehicles.splice(i, 1)
      }
    }

    // peatones
    for (let i = this.peds.length - 1; i >= 0; i--) {
      const p = this.peds[i]
      p.x += p.dir * p.speed * dt
      p.group.position.x = p.x
      for (const v of this.vehicles) {
        if (Math.abs(v.model.group.position.x - p.x) < v.width / 2 + 0.6 && Math.abs(v.z - p.group.position.z) < v.len / 2 + 0.6 && !(p.scared > 0)) {
          p.scared = 0.6 // ¡susto! salta
        }
      }
      animatePerson(p, dt)
      if (Math.abs(p.x) > 8.5 && Math.sign(p.x) === p.dir) {
        this._disposeGroup(p.group)
        this.peds.splice(i, 1)
      }
    }
  }

  _disposeGroup(group) {
    this.root.remove(group)
    group.traverse((o) => {
      o.geometry?.dispose()
      if (o.material && !o.isSprite) {
        o.material.map?.dispose()
        o.material.dispose()
      } else if (o.isSprite) o.material.dispose()
    })
  }

  /** Vehículo más cercano que se acerca por un carril (para apuntar el escupitajo). */
  nearestInLane(lane, maxDist = 80) {
    let best = null
    for (const v of this.vehicles) {
      if (v.lane !== lane) continue
      const front = v.z + v.len / 2
      if (front > -1.5 || front < -maxDist) continue
      if (!best || v.z > best.z) best = v
    }
    return best
  }

  dispose() {
    for (const t of Object.values(this.bubbleTex)) t.texture.dispose()
  }
}
