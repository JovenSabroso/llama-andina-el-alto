// Recuperación al recargar (F5): el juego guarda una "foto" de su estado en
// sessionStorage, que sobrevive a la recarga pero no al cerrar la pestaña.
// Tolerante a fallos: si el almacenamiento no está disponible, simplemente no se recupera.
const KEY = 'llama-transito:sesion'

export function saveSession(snapshot) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    /* sin recuperación */
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
