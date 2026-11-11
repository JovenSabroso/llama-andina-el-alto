// Emisor de eventos mínimo: es el puente de comunicación juego -> Vue.
export class Emitter {
  constructor() {
    this._handlers = new Map()
  }

  /** Suscribe un manejador y devuelve la función para desuscribirse. */
  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set())
    this._handlers.get(event).add(fn)
    return () => this._handlers.get(event)?.delete(fn)
  }

  emit(event, payload) {
    this._handlers.get(event)?.forEach((fn) => fn(payload))
  }

  clearListeners() {
    this._handlers.clear()
  }
}
