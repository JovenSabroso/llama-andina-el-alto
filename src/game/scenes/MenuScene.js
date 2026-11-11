// Escena 1: menú. Tráfico de demostración y cámara que recorre la avenida.
// Los textos del menú los dibuja Vue encima del canvas (GameView.vue).
import { BaseScene } from './BaseScene.js'

export class MenuScene extends BaseScene {
  create() {
    this.createStage({ demo: true })
    this.update(0)
  }

  update(dt) {
    this.updateStage(dt)
    this.llama.update(dt, 0)
    const t = this.game.time
    // paneo lento de la cámara: muestra la profundidad de la escena
    this.placeCamera(Math.sin(t * 0.15) * 6, 13 + Math.sin(t * 0.2), 14, 0, 2, -40)
  }

  onCommand(cmd) {
    if (cmd === 'action') this.game.start('play')
  }
}
