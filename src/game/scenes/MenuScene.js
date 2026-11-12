// Escena 1: menú con intro cinematográfica.
// 0 → 3,4 s: la cámara baja desde el cielo sobre la avenida hasta la llama,
// que se da la vuelta y le escupe a la pantalla (Vue dibuja el "splash").
// Después la cámara se balancea y la llama escupe de vez en cuando.
// Los textos del menú los dibuja Vue encima del canvas (GameView.vue).
import { BaseScene } from './BaseScene.js'
import { DECK_TOP } from '../config.js'
import { sfx } from '../utils/sfx.js'

const INTRO = 3.4 // duración del vuelo de cámara
const SPIT_AT = 3.0 // momento del escupitajo a la pantalla
const smooth = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t

// cámara: inicio (vista de pájaro) → final (frente a la llama)
const FROM = { x: 0, y: 55, z: 40, lx: 0, ly: 0, lz: -90 }
const TO = { x: 2.2, y: DECK_TOP + 4.6, z: 10, lx: 0, ly: DECK_TOP + 1.6, lz: -6 }

export class MenuScene extends BaseScene {
  create() {
    this.createStage({ demo: true })
    // la llama mira a la cámara
    this.llama.baseYaw = Math.PI
    this.llama.group.rotation.y = Math.PI
    this.t = 0
    this.spat = false
    this.splashShown = false
    this.done = false
    this.nextSpit = INTRO + 3
    if (this.data.restore?.introDone) {
      // tras F5: sin repetir la intro
      this.t = INTRO
      this.spat = this.splashShown = true
    }
    this.game.emit('menuIntro', false)
    this.update(0)
  }

  snapshot() {
    return { introDone: this.done }
  }

  update(dt) {
    this.t += dt
    const t = this.t
    this.updateStage(dt)
    this.llama.update(dt, 0)

    // vuelo de cámara con suavizado (smoothstep)
    const p = smooth(Math.min(1, t / (INTRO - 0.4)))
    let x = lerp(FROM.x, TO.x, p)
    let y = lerp(FROM.y, TO.y, p)
    if (p >= 1) {
      x += Math.sin(t * 0.3) * 1.2
      y += Math.sin(t * 0.45) * 0.3
    }
    this.placeCamera(x, y, lerp(FROM.z, TO.z, p), lerp(FROM.lx, TO.lx, p), lerp(FROM.ly, TO.ly, p), lerp(FROM.lz, TO.lz, p))

    // ¡escupitajo a la pantalla!
    if (!this.spat && t >= SPIT_AT) {
      this.spat = true
      this.llama.spit()
    }
    if (!this.splashShown && t >= SPIT_AT + 0.18) {
      this.splashShown = true
      sfx.spit()
      this.game.emit('menuSpit')
    }
    if (!this.done && t >= INTRO) {
      this.done = true
      this.game.emit('menuIntro', true) // Vue muestra el título y los botones
    }
    // modo "atracción": la llama escupe de vez en cuando
    if (this.done && t > this.nextSpit) {
      this.llama.spit()
      this.nextSpit = t + 4 + Math.random() * 3
    }
  }

  onCommand(cmd) {
    if (cmd !== 'action') return
    if (!this.done) {
      // saltar la intro
      this.t = INTRO
      this.spat = this.splashShown = true
    } else {
      this.game.emit('menuStart') // Vue hace la transición y arranca el juego
    }
  }
}
