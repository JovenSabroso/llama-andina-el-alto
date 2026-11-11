// Entrada unificada: teclado y táctil/mouse se traducen a una sola "acción"
// (saltar / confirmar) y a "pausa".
const ACTION_KEYS = ['Space', 'ArrowUp', 'KeyW', 'Enter']
const PAUSE_KEYS = ['KeyP', 'Escape']

export class Input {
  constructor(target, { onAction, onPause }) {
    this.target = target
    this._key = (e) => {
      if (ACTION_KEYS.includes(e.code)) {
        e.preventDefault()
        if (!e.repeat) onAction()
      } else if (PAUSE_KEYS.includes(e.code) && !e.repeat) {
        onPause()
      }
    }
    this._pointer = (e) => {
      e.preventDefault()
      onAction()
    }
    window.addEventListener('keydown', this._key)
    target.addEventListener('pointerdown', this._pointer)
  }

  dispose() {
    window.removeEventListener('keydown', this._key)
    this.target.removeEventListener('pointerdown', this._pointer)
  }
}
