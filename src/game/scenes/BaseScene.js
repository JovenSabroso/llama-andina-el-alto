// Contrato de toda escena: preload -> create -> update (-> destroy).
import * as THREE from 'three'
import { Parallax } from '../utils/Parallax.js'

export class BaseScene {
  constructor(game, data = {}) {
    this.game = game
    this.data = data
    this.root = new THREE.Scene()
  }

  /** Fase 1: carga/generación de recursos (asíncrona). */
  async preload() {}

  /** Fase 2: construye objetos y los agrega a this.root. */
  create() {}

  /** Fase 3: se llama en cada frame con dt en segundos. */
  update(dt) {}

  /** Entrada: tap / clic / espacio. */
  onAction() {}

  /** El canvas cambió de tamaño: recolocar lo que dependa de la pantalla. */
  onResize() {}

  /** Fondo con parallax compartido por todas las escenas. */
  createBackground() {
    this.parallax = new Parallax(this.root)
    this.parallax.layout(this.game.camera)
  }

  resizeBackground() {
    this.parallax?.layout(this.game.camera)
  }

  /** Libera geometrías, materiales y texturas para no filtrar memoria de GPU. */
  destroy() {
    this.root.traverse((o) => {
      o.geometry?.dispose()
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      mats.forEach((m) => {
        m.map?.dispose()
        m.dispose()
      })
    })
    this.root.clear()
  }
}
