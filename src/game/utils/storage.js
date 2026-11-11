// Persistencia (R6): mejor puntaje en localStorage, tolerante a fallos
// (modo privado, almacenamiento bloqueado, etc.).
const KEY = 'llama-andina:best'

export function loadBest() {
  try {
    const v = parseInt(localStorage.getItem(KEY), 10)
    return Number.isFinite(v) ? v : 0
  } catch {
    return 0
  }
}

export function saveBest(score) {
  try {
    localStorage.setItem(KEY, String(score))
  } catch {
    /* sin persistencia: el juego sigue funcionando */
  }
}
