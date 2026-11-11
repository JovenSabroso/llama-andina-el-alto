// Entrada unificada: teclado, toque y deslizar se traducen a comandos:
// 'left', 'right', 'action' (escupir / empezar), 'power' (Cholita) y 'pause'.
const KEYS = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'action',
  ArrowUp: 'action',
  KeyW: 'action',
  Enter: 'action',
  KeyE: 'power',
  ShiftLeft: 'power',
  KeyP: 'pause',
  Escape: 'pause',
}
const SWIPE_PX = 40

export class Input {
  constructor(target, onCommand) {
    this.target = target
    this._key = (e) => {
      const cmd = KEYS[e.code]
      if (!cmd) return
      e.preventDefault()
      if (!e.repeat) onCommand(cmd)
    }
    // toque corto = acción; deslizar horizontal = cambiar de carril
    this._down = (e) => {
      this.start = { x: e.clientX, y: e.clientY }
    }
    this._up = (e) => {
      if (!this.start) return
      const dx = e.clientX - this.start.x
      const dy = e.clientY - this.start.y
      this.start = null
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) onCommand(dx < 0 ? 'left' : 'right')
      else onCommand('action')
    }
    window.addEventListener('keydown', this._key)
    target.addEventListener('pointerdown', this._down)
    target.addEventListener('pointerup', this._up)
  }

  dispose() {
    window.removeEventListener('keydown', this._key)
    this.target.removeEventListener('pointerdown', this._down)
    this.target.removeEventListener('pointerup', this._up)
  }
}
