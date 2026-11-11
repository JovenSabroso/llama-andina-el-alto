// Escena 2: la partida. La llama se mueve por la pasarela entre 3 carriles y
// escupe a los infractores. El escupitajo es un proyectil con gravedad que
// colisiona con las cajas (AABB) de los vehículos.
import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { LANES, MAX_LIVES, BUBBLE_Z, DECK_TOP } from '../config.js'
import { INFRACCIONES } from '../data/contenido.js'
import { createCholita } from '../models/People.js'
import { makeLabel } from '../utils/textures.js'
import { sfx } from '../utils/sfx.js'

const GRAVITY = -22
const SPIT_COOLDOWN = 0.3
const SPIT_R = 0.35
const POWER_PER_FINE = 1 / 6

export class PlayScene extends BaseScene {
  create() {
    this.createStage({
      demo: false,
      onLight: (s) => {
        this.game.emit('light', s)
        if (s === 'rojo') sfx.whistle()
      },
      events: {
        onEscape: (v) => this._escaped(v),
        onRedRun: () => sfx.honk(),
        onAmbulance: () => sfx.siren(),
      },
    })
    this.lane = 1
    this.score = 0
    this.lives = MAX_LIVES
    this.combo = 0
    this.power = 0
    this.stats = { fined: 0, escaped: 0, wrong: 0, maxCombo: 0, time: 0 }
    this.cooldown = 0
    this.dying = 0
    this.shake = 0
    this.camX = 0
    this.spits = []
    this.particles = []
    this.popups = []
    this.splats = []
    this.cholita = null

    this.spitGeo = new THREE.SphereGeometry(SPIT_R, 12, 10)
    this.spitMat = new THREE.MeshStandardMaterial({ color: 0xdff6ff, roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x9fd8ff, emissiveIntensity: 0.3 })
    this.dropGeo = new THREE.SphereGeometry(0.12, 6, 4)
    this.splatGeo = new THREE.CircleGeometry(0.9, 16)
    this.splatGeo.rotateX(-Math.PI / 2)

    this._updateCamera(1)
    this.game.emit('score', 0)
    this.game.emit('lives', this.lives)
    this.game.emit('combo', 0)
    this.game.emit('power', 0)
    this.game.emit('light', this.world.light.state)
  }

  onCommand(cmd) {
    if (this.dying) return
    if (cmd === 'left') this.lane = Math.max(0, this.lane - 1)
    else if (cmd === 'right') this.lane = Math.min(2, this.lane + 1)
    else if (cmd === 'action') this._spit()
    else if (cmd === 'power') this._usePower()
  }

  update(dt) {
    // cámara lenta al perder
    const sdt = this.dying ? dt * 0.35 : dt
    this.stats.time += dt
    this.updateStage(sdt)

    // llama: caminar hacia su carril sobre la pasarela
    const g = this.llama.group
    const targetX = LANES[this.lane]
    const dx = targetX - g.position.x
    const step = 14 * sdt
    g.position.x += Math.abs(dx) <= step ? dx : Math.sign(dx) * step
    this.llama.update(sdt, Math.abs(dx) > 0.05 ? Math.sign(dx) : 0)

    this.cooldown -= sdt
    this._updateSpits(sdt)
    this._updateEffects(sdt)
    this._updateCholita(sdt)
    this._updateCamera(sdt)

    if (this.dying) {
      this.dying -= dt
      if (this.dying <= 0) this._gameOver()
    }
  }

  // ------------------------------------------------------------ escupitajo
  _spit() {
    if (this.cooldown > 0) return
    this.cooldown = SPIT_COOLDOWN
    this.llama.spit()
    sfx.spit()
    const from = this.llama.mouthPosition(new THREE.Vector3())
    from.x = LANES[this.lane] // sale alineado con el carril aunque la llama aún camine
    const vel = new THREE.Vector3(0, 3, -26)
    // Apunte asistido: calcula la parábola que intercepta al vehículo más cercano
    // del carril, prediciendo dónde estará cuando llegue el escupitajo.
    const target = this.traffic.nearestInLane(this.lane)
    if (target) {
      const dist = from.z - (target.z + target.len / 2)
      const T = THREE.MathUtils.clamp(dist / 30, 0.3, 0.95)
      const tz = target.z + target.speed * T
      const ty = target.height * 0.7
      vel.set(0, (ty - from.y - 0.5 * GRAVITY * T * T) / T, (tz - from.z) / T)
    }
    const mesh = new THREE.Mesh(this.spitGeo, this.spitMat)
    mesh.position.copy(from)
    mesh.castShadow = true
    this.root.add(mesh)
    this.spits.push({ mesh, vel, life: 2 })
  }

  _updateSpits(dt) {
    for (let i = this.spits.length - 1; i >= 0; i--) {
      const s = this.spits[i]
      s.vel.y += GRAVITY * dt
      s.mesh.position.addScaledVector(s.vel, dt)
      s.mesh.scale.set(1 + Math.sin(s.life * 30) * 0.12, 1, 1.25) // "bamboleo" líquido
      s.life -= dt
      const p = s.mesh.position
      let hit = null
      for (const v of this.traffic.vehicles) {
        const vx = v.model.group.position.x
        if (
          Math.abs(p.x - vx) < v.width / 2 + SPIT_R &&
          Math.abs(p.z - v.z) < v.len / 2 + SPIT_R &&
          p.y < v.height + SPIT_R &&
          p.y > 0
        ) {
          hit = v
          break
        }
      }
      if (hit) {
        this._burst(p, 14)
        this._resolveHit(hit)
      } else if (p.y <= 0.05) {
        this._splat(p)
      } else if (s.life > 0) {
        continue
      }
      this.root.remove(s.mesh)
      this.spits.splice(i, 1)
    }
  }

  /** Reglas de la multa: aquí está el mensaje educativo del juego. */
  _resolveHit(v) {
    if (v.fined) return
    const pos = v.model.group.position.clone().setY(v.height + 1.5)
    if (v.type === 'ambulancia') {
      this._addScore(-150)
      this.stats.wrong++
      this.combo = 0
      this._toast('¡Era una emergencia! Las ambulancias tienen prioridad', 'bad')
      this._popup(pos, '-150', '#c1121f')
      sfx.wrong()
      this.shake = 0.4
    } else if (v.infractor) {
      v.fined = true
      this.traffic.removeBubble(v)
      this.combo++
      this.stats.fined++
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo)
      const pts = 100 + (this.combo - 1) * 20
      this._addScore(pts)
      this.power = Math.min(1, this.power + POWER_PER_FINE)
      this.game.emit('power', this.power)
      this._toast(`¡MULTA! ${INFRACCIONES[v.infraction].label}  +${pts}`, 'good')
      this._popup(pos, '🧾 MULTA', '#2a9d4a')
      sfx.fine()
    } else {
      this._addScore(-50)
      this.stats.wrong++
      this.combo = 0
      this._toast('¡Ese cumplía la norma! Multa injusta  -50', 'bad')
      this._popup(pos, '😠 -50', '#c1121f')
      sfx.wrong()
      this.shake = 0.3
    }
    this.game.emit('combo', this.combo)
  }

  _escaped(v) {
    if (this.dying) return
    this.stats.escaped++
    this.lives--
    this.combo = 0
    this.shake = 0.5
    sfx.honk()
    this.game.emit('lives', this.lives)
    this.game.emit('combo', 0)
    this._toast(`Se escapó: ${INFRACCIONES[v.infraction].label}. ¡Peligro para el peatón!`, 'bad')
    if (this.lives <= 0) this.dying = 1.6
  }

  // ------------------------------------------------------- poder: Cholita
  _usePower() {
    if (this.power < 1 || this.cholita) return
    this.power = 0
    this.game.emit('power', 0)
    sfx.power()
    this.traffic.freeze = 2.5
    // la Cholita Inspectora multa a todos los infractores visibles
    let n = 0
    for (const v of this.traffic.vehicles) {
      if (v.infractor && !v.fined && v.z > BUBBLE_Z) {
        this._resolveHit(v)
        n++
      }
    }
    this._toast(n ? `¡YA PUES! La Cholita Inspectora multó a ${n}` : '¡YA PUES! La Cholita frenó el tráfico', 'good')
    const c = createCholita({ inspectora: true })
    c.group.scale.setScalar(1.5)
    const side = this.lane === 2 ? -1 : 1
    c.group.position.set(LANES[this.lane] + side * 2.2, DECK_TOP, 0.2)
    c.group.rotation.y = Math.PI // de frente a la cámara
    const { texture, aspect } = makeLabel('¡YA PUES, MULTA!', { bg: '#fcbf49', px: 60 })
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false }))
    bubble.scale.set(0.06 * aspect, 0.06, 1)
    bubble.position.y = 3.2
    bubble.renderOrder = 12
    c.group.add(bubble)
    this.root.add(c.group)
    this.cholita = { ...c, life: 2.6 }
  }

  _updateCholita(dt) {
    if (!this.cholita) return
    const c = this.cholita
    c.life -= dt
    c.group.position.y = DECK_TOP + Math.abs(Math.sin(c.life * 10)) * 0.4
    if (c.life <= 0) {
      this.root.remove(c.group)
      c.group.traverse((o) => {
        o.geometry?.dispose()
        o.material?.map?.dispose()
        o.material?.dispose()
      })
      this.cholita = null
    }
  }

  // ------------------------------------------------------------- efectos
  _burst(pos, n) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.dropGeo, this.spitMat)
      m.position.copy(pos)
      const vel = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 8)
      this.root.add(m)
      this.particles.push({ mesh: m, vel, life: 0.6 })
    }
  }

  _splat(pos) {
    sfx.splat()
    const mat = new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.7, depthWrite: false })
    const m = new THREE.Mesh(this.splatGeo, mat)
    m.position.set(pos.x, 0.03, pos.z)
    this.root.add(m)
    this.splats.push({ mesh: m, life: 2.5 })
    this._burst(pos, 6)
  }

  _popup(pos, text, color) {
    const { texture, aspect } = makeLabel(text, { bg: color, fg: '#ffffff', px: 56, border: '#ffffff' })
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false, transparent: true }))
    s.scale.set(0.055 * aspect, 0.055, 1)
    s.position.copy(pos)
    s.renderOrder = 11
    this.root.add(s)
    this.popups.push({ sprite: s, life: 1.2 })
  }

  _updateEffects(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.vel.y += GRAVITY * dt
      p.mesh.position.addScaledVector(p.vel, dt)
      p.life -= dt
      p.mesh.scale.setScalar(Math.max(0.01, p.life / 0.6))
      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.root.remove(p.mesh)
        this.particles.splice(i, 1)
      }
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i]
      p.life -= dt
      p.sprite.position.y += dt * 2.5
      p.sprite.material.opacity = Math.min(1, p.life / 0.4)
      if (p.life <= 0) {
        this.root.remove(p.sprite)
        p.sprite.material.map.dispose()
        p.sprite.material.dispose()
        this.popups.splice(i, 1)
      }
    }
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats[i]
      s.life -= dt
      s.mesh.material.opacity = Math.min(0.7, s.life / 1.5)
      if (s.life <= 0) {
        this.root.remove(s.mesh)
        s.mesh.material.dispose()
        this.splats.splice(i, 1)
      }
    }
  }

  _updateCamera(dt) {
    // la cámara sigue a la llama con suavizado: al cambiar de carril las capas
    // cercanas se desplazan más que las lejanas (parallax)
    this.camX += (this.llama.group.position.x * 0.7 - this.camX) * Math.min(1, dt * 4)
    const t = this.game.time
    let sx = Math.sin(t * 0.4) * 0.3
    let sy = Math.sin(t * 0.55) * 0.15
    if (this.shake > 0) {
      this.shake -= dt
      sx += (Math.random() - 0.5) * this.shake * 1.5
      sy += (Math.random() - 0.5) * this.shake * 1.5
    }
    const x = this.camX + sx
    const y = 13 + sy
    this.placeCamera(x, y, 12.5, ...this.lookTarget(x, y, 12.5, this.camX * 0.6))
  }

  _toast(text, kind) {
    this.game.emit('toast', { text, kind })
  }

  _addScore(n) {
    this.score = Math.max(0, this.score + n)
    this.game.emit('score', this.score)
  }

  _gameOver() {
    const record = this.game.submitScore(this.score)
    const { fined, escaped } = this.stats
    const accuracy = fined + escaped > 0 ? Math.round((fined / (fined + escaped)) * 100) : 0
    this.game.start('end', { score: this.score, record, accuracy, ...this.stats })
  }
}
