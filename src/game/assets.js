// Carga de imágenes (fase preload). Se cachean: cambiar de escena no las vuelve a descargar.
// Créditos y licencias en README.md.
import * as THREE from 'three'
import illimaniUrl from '../assets/img/illimani_el_alto.jpg'
import asfaltoUrl from '../assets/img/asfalto_color.jpg'
import ladrilloUrl from '../assets/img/ladrillo_color.jpg'
import ladrilloNormalUrl from '../assets/img/ladrillo_normal.jpg'
import rocaUrl from '../assets/img/alcalde_eliser_roca.jpg'
import copaUrl from '../assets/img/alcaldesa_eva_copa.jpg'

const loader = new THREE.TextureLoader()
let cache = null

function load(url, { srgb = true, repeat = false } = {}) {
  return loader
    .loadAsync(url)
    .then((t) => {
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.anisotropy = 8
      t.userData.cached = true // BaseScene.destroy no la libera: se reutiliza
      return t
    })
    .catch((err) => {
      console.warn('No se pudo cargar', url, err)
      return null // el juego usa colores o texturas generadas como respaldo
    })
}

/** Color promedio de una franja horizontal de la foto (para la niebla del horizonte). */
function bandColor(image, fromBottom, toBottom) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const g = c.getContext('2d')
  g.drawImage(image, 0, 0, 64, 64)
  const y0 = Math.floor(64 * (1 - toBottom))
  const y1 = Math.floor(64 * (1 - fromBottom))
  const data = g.getImageData(0, y0, 64, Math.max(1, y1 - y0)).data
  let r = 0, gg = 0, b = 0
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    gg += data[i + 1]
    b += data[i + 2]
  }
  const n = data.length / 4
  return new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace)
}

// Fracción (desde abajo) de la foto donde está la base de la cordillera.
export const ILLIMANI_HORIZON = 0.58

export function loadAssets() {
  if (!cache) {
    cache = Promise.all([
      load(illimaniUrl),
      load(asfaltoUrl, { repeat: true }),
      load(ladrilloUrl, { repeat: true }),
      load(ladrilloNormalUrl, { srgb: false, repeat: true }),
      load(rocaUrl),
      load(copaUrl),
    ]).then(([illimani, asfalto, ladrillo, ladrilloNormal, roca, copa]) => ({
      illimani,
      asfalto,
      ladrillo,
      ladrilloNormal,
      // fotos de alcaldes: se usan como imagen dentro de los afiches (canvas)
      fotos: { roca: roca?.image ?? null, copa: copa?.image ?? null },
      horizonColor: illimani
        ? bandColor(illimani.image, ILLIMANI_HORIZON - 0.14, ILLIMANI_HORIZON - 0.02) // franja de la ciudad bajo la cordillera
        : new THREE.Color(0xc9cdd3),
    }))
  }
  return cache
}
