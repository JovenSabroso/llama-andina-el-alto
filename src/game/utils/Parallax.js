// Efecto 3D con parallax (R3): 6 planos a distinta profundidad en el eje Z.
//
// Idea clave: todos los planos avanzan con la MISMA velocidad en unidades de
// mundo, pero cada plano está a distinta distancia de la cámara perspectiva.
// Un plano lejano debe ser más grande para llenar la pantalla, así que su
// textura recorre más mundo por cada "tile" y en pantalla se ve más lento.
// El parallax sale de la geometría, no de números inventados por capa.
import * as THREE from 'three'
import {
  makeSky,
  makeMountains,
  makeCity,
  makeTeleferico,
  makeGround,
  makeForeground,
  TILE_W,
  TILE_H,
  GROUND_FRAC,
} from './textures.js'

const OVERSCAN = 1.12 // los planos son un poco más grandes que la pantalla (margen para el balanceo de cámara)
const TILE_ASPECT = TILE_W / TILE_H

// z negativo = lejos de la cámara; z positivo = delante del jugador (z = 0).
const LAYERS = [
  { name: 'cielo', z: -90, make: makeSky, order: 0, extra: 0.5 },
  { name: 'montañas', z: -60, make: makeMountains, order: 1, extra: 1 },
  { name: 'ciudad', z: -32, make: makeCity, order: 2, extra: 1 },
  { name: 'teleférico', z: -14, make: makeTeleferico, order: 3, extra: 1 },
  { name: 'suelo', z: 0, make: makeGround, order: 4, extra: 1 },
  { name: 'primer plano', z: 8, make: makeForeground, order: 50, extra: 1 },
]

export class Parallax {
  constructor(parent) {
    this.group = new THREE.Group()
    parent.add(this.group)
    this.layers = LAYERS.map((def) => {
      const texture = def.make()
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
      mesh.position.z = def.z
      mesh.renderOrder = def.order
      this.group.add(mesh)
      return { def, mesh, texture, tileWorldW: 1 }
    })
  }

  /** Recalcula el tamaño de cada plano para que llene la vista (llamar en cada resize). */
  layout(camera) {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    for (const L of this.layers) {
      const dist = camera.position.z - L.def.z
      const h = 2 * dist * tan * OVERSCAN
      const w = h * camera.aspect
      L.mesh.scale.set(w, h, 1)
      L.mesh.position.y = 0
      L.texture.repeat.x = w / (h * TILE_ASPECT) // cuántos tiles caben en el ancho
      L.tileWorldW = h * TILE_ASPECT // ancho de un tile en unidades de mundo
    }
  }

  /** Desplaza todas las capas: speed está en unidades de mundo por segundo. */
  update(dt, speed) {
    for (const L of this.layers) {
      L.texture.offset.x = (L.texture.offset.x + (speed * L.def.extra * dt) / L.tileWorldW) % 1
    }
  }

  /** Fracción de la altura visible (en z=0) donde queda el borde superior del suelo. */
  static groundTopFraction() {
    // el plano mide OVERSCAN * altura visible, centrado: el suelo ocupa GROUND_FRAC de él.
    return -0.5 * OVERSCAN + GROUND_FRAC * OVERSCAN
  }
}
