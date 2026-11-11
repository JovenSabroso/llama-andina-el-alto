// Escena 3: fin de partida. La llama baila y Vue muestra el resumen
// (puntaje, % de infracciones detectadas, consejo de seguridad vial).
import { BaseScene } from './BaseScene.js'
import { CONSEJOS, CHISTES } from '../data/contenido.js'

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export class EndScene extends BaseScene {
  create() {
    this.createStage({ demo: true })
    this.llama.dance = true
    const defaults = { score: 0, record: false, accuracy: 0, fined: 0, escaped: 0, wrong: 0 }
    this.game.emit('end', { ...defaults, ...this.data, tip: pick(CONSEJOS), joke: pick(CHISTES) })
    this.update(0)
  }

  update(dt) {
    this.updateStage(dt)
    this.llama.update(dt, 0)
    const t = this.game.time
    // la cámara gira alrededor de la llama
    const a = Math.sin(t * 0.3) * 0.6
    // en pantallas anchas el panel va a la derecha: la llama queda a la izquierda
    const shift = this.game.camera.aspect > 1.2 ? 3.2 : 0
    this.placeCamera(Math.sin(a) * 9, 8.5, 6 + Math.cos(a) * 3, shift, 6.8, -2)
  }

  onCommand(cmd) {
    if (cmd === 'action') this.game.start('play')
  }
}
