// Motor del juego: dueño del renderer, la cámara, el bucle y las escenas.
// Vue solo conoce esta clase:
//   métodos: init, start(nombre), restart, setPaused, command(cmd), destroy
//   eventos: scene, score, lives, combo, power, light, toast, best, pause, end
import * as THREE from 'three'
import { Emitter } from './utils/emitter.js'
import { Input } from './utils/input.js'
import { loadBest, saveBest } from './utils/storage.js'
import { loadSession, saveSession } from './utils/session.js'
import { sfx } from './utils/sfx.js'
import { MenuScene } from './scenes/MenuScene.js'
import { PlayScene } from './scenes/PlayScene.js'
import { EndScene } from './scenes/EndScene.js'

const SCENES = { menu: MenuScene, play: PlayScene, end: EndScene }
const BASE_FOV = 55
const MIN_ASPECT = 0.8 // por debajo (celular vertical) se abre el FOV para ver los 3 carriles
const MAX_FOV = 100

export class Game extends Emitter {
  constructor(container) {
    super()
    this.container = container
    this.paused = false
    this.best = loadBest()
    this.current = null
    this.sceneName = null
    this._token = 0 // invalida cargas de escenas que ya no se necesitan
    this._raf = 0
    this.time = 0

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)
    Object.assign(this.renderer.domElement.style, { display: 'block', touchAction: 'none' })

    this.camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.5, 1200)
    this.timer = new THREE.Timer()
    this.timer.connect(document) // pausa el reloj si la pestaña se oculta

    this.input = new Input(this.renderer.domElement, (cmd) => this.command(cmd))

    // R4: el canvas sigue el tamaño del contenedor (no solo de la ventana)
    this._ro = new ResizeObserver(() => this.resize())
    this._ro.observe(container)
    this.resize()
  }

  /** Arranca el bucle. ?scene=play en la URL salta directo a una escena (útil para pruebas). */
  init() {
    this.emit('best', this.best)
    const params = new URLSearchParams(window.location.search)
    const q = params.get('scene')
    if (params.has('debug')) window.__game = this // inspección desde la consola del navegador

    // F5: si hay una partida guardada en esta pestaña, se continúa exactamente ahí
    const snap = loadSession()
    if (snap && SCENES[snap.scene]) {
      this.start(snap.scene, { ...snap.data, restore: snap.state }).then(() => {
        if (snap.paused) this.setPaused(true)
      })
    } else {
      this.start(SCENES[q] ? q : 'menu')
    }
    this._onHide = () => this.save()
    window.addEventListener('pagehide', this._onHide) // guarda justo antes de recargar o salir

    const loop = (timestamp) => {
      this._raf = requestAnimationFrame(loop)
      this.timer.update(timestamp)
      const dt = Math.min(this.timer.getDelta(), 0.05) // tope: evita saltos al volver de otra pestaña
      this.time += dt
      this._saveT = (this._saveT || 0) + dt
      if (this._saveT > 0.5) {
        this._saveT = 0
        this.save() // guardado periódico por si el navegador no avisa al recargar
      }
      if (this.current) {
        if (!this.paused) this.current.update(dt)
        this.renderer.render(this.current.root, this.camera)
      }
    }
    this._raf = requestAnimationFrame(loop)
  }

  /** Cambia de escena ejecutando su ciclo preload -> create (update lo llama el bucle). */
  async start(name, data = {}) {
    const token = ++this._token
    const prev = this.current
    this.current = null
    prev?.destroy()
    this.paused = false
    this.emit('pause', false)
    this.emit('loading', true)

    const scene = new SCENES[name](this, data)
    await scene.preload()
    if (token !== this._token) return scene.destroy() // se pidió otra escena mientras cargaba
    scene.create()
    scene.onResize()
    this.current = scene
    this.sceneName = name
    this.emit('loading', false)
    this.emit('scene', name)
  }

  restart() {
    return this.start('play')
  }

  /** Guarda el estado de la escena actual para recuperarlo tras F5. */
  save() {
    if (!this.current?.snapshot) return
    const { restore, ...data } = this.current.data // no guardar la restauración anterior
    saveSession({ scene: this.sceneName, data, state: this.current.snapshot(), paused: this.paused })
  }

  setPaused(value) {
    if (this.sceneName !== 'play') return
    this.paused = value
    this.emit('pause', value)
  }

  /** Comando desde teclado, toque o botones de Vue. */
  command(cmd) {
    if (cmd === 'pause') return this.setPaused(!this.paused)
    if (this.paused || !this.current) return
    this.current.onCommand(cmd)
  }

  /** Guarda el puntaje si es récord (R6). Devuelve true si lo fue. */
  submitScore(score) {
    if (score > this.best) {
      this.best = score
      saveBest(score)
      this.emit('best', score)
      return true
    }
    return false
  }

  resize() {
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    // pixel ratio con tope 2: en móviles 3x cuesta mucho y casi no se nota
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(w, h)
    const aspect = w / h
    this.camera.aspect = aspect
    // En pantallas verticales se conserva el campo de visión HORIZONTAL
    // para que los 3 carriles sigan entrando en pantalla.
    if (aspect >= MIN_ASPECT) this.camera.fov = BASE_FOV
    else {
      const tanH = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * MIN_ASPECT
      this.camera.fov = Math.min(MAX_FOV, THREE.MathUtils.radToDeg(2 * Math.atan(tanH / aspect)))
    }
    this.camera.updateProjectionMatrix()
    this.current?.onResize()
  }

  /** Libera todo (R5: limpieza al desmontar el componente Vue). */
  destroy() {
    cancelAnimationFrame(this._raf)
    this._token++
    this._ro.disconnect()
    window.removeEventListener('pagehide', this._onHide)
    this.input.dispose()
    this.timer.dispose()
    this.current?.destroy()
    this.current = null
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
    sfx.dispose()
    this.clearListeners()
  }
}
