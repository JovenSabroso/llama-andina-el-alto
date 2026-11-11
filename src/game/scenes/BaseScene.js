// Contrato de toda escena: preload -> create -> update (-> destroy).
// Las tres escenas comparten el escenario (World + Parallax + Traffic).
import * as THREE from 'three'
import { loadAssets } from '../assets.js'
import { World } from '../world/World.js'
import { Parallax } from '../utils/Parallax.js'
import { Traffic } from '../systems/Traffic.js'
import { Llama } from '../models/Llama.js'
import { DECK_TOP } from '../config.js'

export class BaseScene {
  constructor(game, data = {}) {
    this.game = game
    this.data = data
    this.root = new THREE.Scene()
  }

  /** Fase 1: carga de recursos (imágenes). Asíncrona; el bucle espera. */
  async preload() {
    this.assets = await loadAssets()
  }

  /** Fase 2: construye los objetos de la escena. */
  create() {}

  /** Fase 3: lógica por frame (dt en segundos). */
  update(dt) {}

  /** Comandos de entrada: 'left' | 'right' | 'action' | 'power'. */
  onCommand(cmd) {}

  /** El canvas cambió de tamaño. */
  onResize() {
    this._layoutKey = null // se recalcula en el próximo placeCamera
    this.parallax?.layout(this.game.camera)
  }

  /** Escenario común: ciudad, fondo con parallax, tráfico y la llama. */
  createStage({ demo = true, onLight, events } = {}) {
    this.world = new World(this.root, this.assets, { onLight })
    this.parallax = new Parallax(this.root, this.assets)
    this.traffic = new Traffic(this.root, this.world, { demo, events })
    this.llama = new Llama()
    this.llama.group.position.set(0, DECK_TOP, 0)
    this.root.add(this.llama.group)
  }

  updateStage(dt) {
    this.world.update(dt)
    this.traffic.update(dt)
    this.parallax.update(dt, this.game.camera)
  }

  /** Cámara detrás y por encima de la llama, mirando la avenida. */
  placeCamera(x, y = 11, z = 10, lookX = x * 0.6, lookY = 1.5, lookZ = -30) {
    const cam = this.game.camera
    cam.position.set(x, y, z)
    cam.lookAt(lookX, lookY, lookZ)
    // el fondo depende del FOV, del aspecto y de la inclinación: recalcular si cambiaron
    const key = `${cam.fov.toFixed(2)}|${cam.aspect.toFixed(3)}|${(lookY - y).toFixed(1)}`
    if (this.parallax && key !== this._layoutKey) {
      this.parallax.layout(cam)
      this._layoutKey = key
    }
  }

  /**
   * Punto de mira para que el borde inferior de la pantalla quede siempre a
   * `bottomDeg` grados bajo la horizontal: en pantallas verticales (FOV mayor)
   * la cámara levanta la mirada y el espacio extra muestra avenida y cielo.
   */
  lookTarget(x, y, z, lookX, bottomDeg = -44, dist = 48) {
    const pitch = THREE.MathUtils.degToRad(bottomDeg + this.game.camera.fov / 2)
    return [lookX, y + Math.tan(pitch) * dist, z - dist]
  }

  /** Libera geometrías, materiales y texturas (excepto las imágenes cacheadas). */
  destroy() {
    this.traffic?.dispose()
    this.root.traverse((o) => {
      o.geometry?.dispose()
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of mats) {
        for (const key of ['map', 'normalMap']) {
          if (m[key] && !m[key].userData.cached) m[key].dispose()
        }
        m.dispose()
      }
    })
    this.root.clear()
  }
}
