// Escena 2: la partida. Física (gravedad + salto), colisiones, puntaje y vidas.
import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { Parallax } from '../utils/Parallax.js'
import { makeEmojiTexture } from '../utils/textures.js'
import { sfx } from '../utils/sfx.js'

// Alimentos andinos: sumar los 5 distintos completa un "plato balanceado".
const GOOD = [
  { id: 'papa', emoji: '🥔' },
  { id: 'choclo', emoji: '🌽' },
  { id: 'haba', emoji: '🫘' },
  { id: 'oca', emoji: '🍠' },
  { id: 'quinua', emoji: '🌾' },
]
const JUNK = ['🥤', '🍟', '🍬', '🍔']

const MAX_LIVES = 3
const REF_H = 18.65 // altura visible de referencia (cámara a 20, FOV 50)

export class PlayScene extends BaseScene {
  async preload() {
    // Texturas de todos los alimentos, generadas una sola vez por partida.
    this.goodTex = GOOD.map((g) => makeEmojiTexture(g.emoji))
    this.junkTex = JUNK.map((e) => makeEmojiTexture(e))
    this.playerTex = makeEmojiTexture('🦙', 256)
    this.shadowTex = this._makeShadowTexture()
  }

  create() {
    this.createBackground()
    this.itemGeo = new THREE.PlaneGeometry(1, 1)

    this.player = new THREE.Mesh(
      this.itemGeo,
      new THREE.MeshBasicMaterial({ map: this.playerTex, transparent: true, depthWrite: false, depthTest: false }),
    )
    this.player.renderOrder = 30
    this.shadow = new THREE.Mesh(
      this.itemGeo,
      new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, depthTest: false }),
    )
    this.shadow.renderOrder = 29
    this.root.add(this.shadow, this.player)

    this.items = []
    this.score = 0
    this.lives = MAX_LIVES
    this.plate = new Set()
    this.platesDone = 0
    this.elapsed = 0
    this.spawnTimer = 1
    this.vy = 0
    this.onGround = true
    this.invulnerable = 0
    this.dying = 0

    this.game.emit('score', 0)
    this.game.emit('lives', this.lives)
    this.game.emit('plate', [])
  }

  onResize() {
    this.resizeBackground()
    const { w, h } = this.game.view()
    this.W = w
    this.H = h
    this.s = h / REF_H // todas las medidas del juego escalan con la altura visible
    const s = this.s
    this.groundY = h * Parallax.groundTopFraction()
    this.playerSize = 2.8 * s
    this.playerX = -w / 2 + Math.max(4 * s, w * 0.2)
    this.standY = this.groundY + this.playerSize * 0.42
    this.player.scale.set(this.playerSize, this.playerSize, 1)
    this.shadow.scale.set(this.playerSize * 0.9, this.playerSize * 0.25, 1)
    if (this.onGround) this.player.position.set(this.playerX, this.standY, 0)
    else this.player.position.x = this.playerX
  }

  update(dt) {
    const s = this.s
    this.elapsed += dt

    // Dificultad: la velocidad sube con el tiempo hasta 2.2 veces la inicial.
    const speed = 11 * s * Math.min(1 + this.elapsed / 70, 2.2)
    this.parallax.update(dt, speed)

    // --- Física del jugador (gravedad + salto) ---
    if (!this.dying) {
      this.vy -= 62 * s * dt
      this.player.position.y += this.vy * dt
      if (this.player.position.y <= this.standY) {
        this.player.position.y = this.standY
        this.vy = 0
        this.onGround = true
      }
    }
    this.player.rotation.z = this.dying ? this.player.rotation.z + dt * 8 : THREE.MathUtils.clamp(this.vy * 0.012 / s, -0.35, 0.35)
    const air = (this.player.position.y - this.standY) / s
    this.shadow.position.set(this.playerX, this.groundY + this.playerSize * 0.05, 0)
    this.shadow.material.opacity = THREE.MathUtils.clamp(1 - air / 7, 0.25, 0.7)
    if (this.invulnerable > 0) {
      this.invulnerable -= dt
      this.player.visible = Math.floor(this.invulnerable * 14) % 2 === 0
    } else this.player.visible = true

    // --- Aparición de alimentos ---
    if (!this.dying) {
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) {
        this._spawn()
        this.spawnTimer = Math.max(0.55, 1.25 - this.elapsed / 120) + Math.random() * 0.5
      }
    }

    // --- Movimiento y colisiones ---
    const hitDist = (this.playerSize * 0.36 + 0.8 * s)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]
      it.mesh.position.x -= speed * dt
      it.mesh.rotation.y += dt * 2.6 // giro en Y: refuerza el efecto 3D
      it.mesh.position.y = it.baseY + Math.sin(this.elapsed * 3 + it.phase) * 0.25 * s

      const dx = it.mesh.position.x - this.player.position.x
      const dy = it.mesh.position.y - this.player.position.y
      if (!this.dying && dx * dx + dy * dy < hitDist * hitDist) {
        this._collect(it)
        this._removeItem(i)
      } else if (it.mesh.position.x < -this.W / 2 - 3 * s) {
        this._removeItem(i)
      }
    }

    if (this.dying) {
      this.dying -= dt
      if (this.dying <= 0) this._gameOver()
    }
  }

  onAction() {
    if (this.dying || !this.onGround) return
    this.vy = 25 * this.s
    this.onGround = false
    sfx.jump()
  }

  // --------------------------------------------------------------- privados
  _spawn() {
    const s = this.s
    const good = Math.random() < 0.62
    const tex = good
      ? this.goodTex[Math.floor(Math.random() * GOOD.length)]
      : this.junkTex[Math.floor(Math.random() * JUNK.length)]
    const typeIndex = good ? this.goodTex.indexOf(tex) : -1
    // Tres alturas: a ras de suelo, media y alta (exigen saltar).
    const heights = good ? [1.2, 3.4, 5.2] : [1.2, 1.2, 3.2]
    const baseY = this.groundY + heights[Math.floor(Math.random() * heights.length)] * s + 0.5 * s
    const mesh = new THREE.Mesh(
      this.itemGeo,
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
    )
    mesh.scale.set(1.9 * s, 1.9 * s, 1)
    mesh.position.set(this.W / 2 + 2 * s, baseY, 0)
    mesh.renderOrder = 25
    this.root.add(mesh)
    this.items.push({ mesh, good, id: good ? GOOD[typeIndex].id : null, baseY, phase: Math.random() * 6 })
  }

  _removeItem(i) {
    const it = this.items[i]
    this.root.remove(it.mesh)
    it.mesh.material.dispose() // la textura se libera al destruir la escena
    this.items.splice(i, 1)
  }

  _collect(it) {
    if (it.good) {
      this._addScore(10)
      sfx.good()
      this.plate.add(it.id)
      if (this.plate.size === GOOD.length) {
        this._addScore(50) // bonificación por plato balanceado
        this.platesDone++
        this.lives = Math.min(MAX_LIVES, this.lives + 1)
        this.plate.clear()
        sfx.plate()
        this.game.emit('lives', this.lives)
      }
      this.game.emit('plate', [...this.plate])
    } else {
      if (this.invulnerable > 0) return
      this.lives--
      this.invulnerable = 1.2
      sfx.junk()
      this.game.emit('lives', this.lives)
      if (this.lives <= 0) this.dying = 0.9
    }
  }

  _addScore(n) {
    this.score += n
    this.game.emit('score', this.score)
  }

  _gameOver() {
    const record = this.game.submitScore(this.score)
    this.game.start('end', { score: this.score, plates: this.platesDone, record })
  }

  _makeShadowTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30)
    grad.addColorStop(0, 'rgba(0,0,0,0.6)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }
}
