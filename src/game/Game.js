// Motor del juego: dueño del renderer, la cámara, el bucle y las escenas.
// Vue solo conoce esta clase (API pública: on, start, restart, setPaused, destroy).
import * as THREE from 'three'
import { Emitter } from './utils/emitter.js'
import { Input } from './utils/input.js'
import { loadBest, saveBest } from './utils/storage.js'
import { sfx } from './utils/sfx.js'
import { MenuScene } from './scenes/MenuScene.js'
import { PlayScene } from './scenes/PlayScene.js'
import { EndScene } from './scenes/EndScene.js'

const SCENES = { menu: MenuScene, play: PlayScene, end: EndScene }
const BASE_FOV = 50
const CAM_Z = 20
const MIN_ASPECT = 1.3 // en pantallas verticales se abre el FOV para no perder ancho de juego

export class Game extends Emitter {
  constructor(container) {
    super()
    this.container = container
    this.paused = false
    this.best = loadBest()
    this.current = null
    this.sceneName = null
    this._token = 0 // invalida cargas de escenas obsoletas
    this._raf = 0

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setClearColor(0x1b1230)
    container.appendChild(this.renderer.domElement)
    Object.assign(this.renderer.domElement.style, { display: 'block', touchAction: 'none' })

    this.camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.5, 400)
    this.camera.position.set(0, 0, CAM_Z)

    this.clock = new THREE.Clock()
    this.time = 0

    this.input = new Input(this.renderer.domElement, {
      onAction: () => {
        if (this.paused) return
        this.current?.onAction?.()
      },
      onPause: () => {
        if (this.sceneName === 'play') this.setPaused(!this.paused)
      },
    })

    // R4: el canvas sigue al tamaño del contenedor, no de la ventana.
    this._ro = new ResizeObserver(() => this.resize())
    this._ro.observe(container)
    this.resize()
  }

  /** Arranca el bucle y entra al menú. */
  init() {
    this.emit('best', this.best)
    this.start('menu')
    this.clock.start()
    const loop = () => {
      this._raf = requestAnimationFrame(loop)
      const dt = Math.min(this.clock.getDelta(), 0.05) // tope: evita saltos tras cambiar de pestaña
      this.time += dt
      if (this.current) {
        if (!this.paused) this.current.update(dt)
        this._sway()
        this.renderer.render(this.current.root, this.camera)
      }
    }
    loop()
  }

  /** Cambia de escena ejecutando su ciclo preload -> create (update lo llama el bucle). */
  async start(name, data = {}) {
    const token = ++this._token
    const prev = this.current
    this.current = null // mientras carga no se actualiza ni se dibuja
    prev?.destroy()
    this.paused = false
    this.emit('pause', false)

    const scene = new SCENES[name](this, data)
    await scene.preload()
    if (token !== this._token) return scene.destroy() // otra escena se pidió mientras cargaba
    scene.create()
    scene.onResize()
    this.current = scene
    this.sceneName = name
    this.emit('scene', name)
  }

  restart() {
    return this.start('play')
  }

  setPaused(value) {
    if (this.sceneName !== 'play') return
    this.paused = value
    this.emit('pause', value)
  }

  /** Registra el puntaje; devuelve true si fue récord (R6: persistencia). */
  submitScore(score) {
    if (score > this.best) {
      this.best = score
      saveBest(score)
      this.emit('best', score)
      return true
    }
    return false
  }

  /** Dimensiones visibles del mundo en el plano z=0 (donde ocurre el juego). */
  view() {
    const h = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    return { w: h * this.camera.aspect, h }
  }

  resize() {
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)) // tope 2x: cuida el rendimiento en móviles
    this.renderer.setSize(w, h)
    const aspect = w / h
    this.camera.aspect = aspect
    // Si la pantalla es vertical, el FOV vertical crece para conservar un ancho mínimo.
    const baseTan = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2))
    this.camera.fov =
      aspect >= MIN_ASPECT ? BASE_FOV : THREE.MathUtils.radToDeg(2 * Math.atan((baseTan * MIN_ASPECT) / aspect))
    this.camera.updateProjectionMatrix()
    this.current?.onResize()
  }

  // Balanceo suave de cámara: refuerza la sensación de profundidad.
  _sway() {
    this.camera.position.x = Math.sin(this.time * 0.35) * 0.45
    this.camera.position.y = Math.sin(this.time * 0.5) * 0.25
  }

  /** Libera todo (R5: limpieza al desmontar el componente Vue). */
  destroy() {
    cancelAnimationFrame(this._raf)
    this._token++
    this._ro.disconnect()
    this.input.dispose()
    this.current?.destroy()
    this.current = null
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
    sfx.dispose()
    this.clearListeners()
  }
}
