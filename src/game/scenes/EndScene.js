// Escena 3: fin de partida. Muestra puntaje, récord y un mensaje social.
import { BaseScene } from './BaseScene.js'
import { makeTextMesh, placeText } from '../utils/textures.js'

const FACTS = [
  'La quinua contiene los nueve aminoácidos esenciales.',
  'Los Andes conservan miles de variedades nativas de papa.',
  'El chuño y la papa nativa se conservan sin refrigeración gracias al frío de la altura.',
  'Una dieta variada y local es más barata y más nutritiva que la comida ultraprocesada.',
  'Cocinar en casa con productos andinos cuida la salud de toda la familia.',
]

export class EndScene extends BaseScene {
  create() {
    const { score = 0, plates = 0, record = false } = this.data
    this.createBackground()
    const fact = FACTS[Math.floor(Math.random() * FACTS.length)]
    this.items = {
      title: makeTextMesh('¡Fin de la cosecha!', { px: 84, color: '#ffd166' }),
      score: makeTextMesh(`Puntaje: ${score}`, { px: 70 }),
      detail: makeTextMesh(
        record ? '¡Nuevo récord!' : `Mejor puntaje: ${this.game.best}   ·   Platos completos: ${plates}`,
        { px: 46, color: record ? '#a8e6a1' : '#ffffff' },
      ),
      fact: makeTextMesh(['¿Sabías que...?', fact], { px: 40, font: 600, color: '#fff5d6' }),
      cta: makeTextMesh('Toca o presiona ESPACIO para jugar otra vez', { px: 46 }),
    }
    Object.values(this.items).forEach((m) => {
      m.renderOrder = 20
      this.root.add(m)
    })
  }

  onResize() {
    this.resizeBackground()
    const { w, h } = this.game.view()
    const maxW = w * 0.92
    const layout = [
      ['title', 0.2, 0.26],
      ['score', 0.12, 0.1],
      ['detail', 0.07, 0.0],
      ['fact', 0.12, -0.12],
      ['cta', 0.065, -0.27],
    ]
    for (const [key, hh, y] of layout) {
      placeText(this.items[key], h * hh, maxW)
      this.items[key].position.set(0, h * y, 0)
    }
  }

  update(dt) {
    this.parallax.update(dt, 2)
    this.items.cta.material.opacity = 0.65 + Math.sin(this.game.time * 4) * 0.35
  }

  onAction() {
    this.game.start('play')
  }
}
