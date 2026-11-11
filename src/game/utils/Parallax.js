// Efecto 3D con parallax (R3). Capas de fondo, de la más lejana a la más cercana:
//
//   1. Foto del Illimani desde El Alto   dist 520  p = 0.04
//   2. Nubes (con deriva propia)          dist 440  p = 0.10
//   3. Teleférico (objeto 3D, World.js)   z = -140  perspectiva real
//   4. Avenida y casas (3D)               z 0..-235 perspectiva real
//   5. Pasarela + llama (primer plano)    z = 0     perspectiva real
//
// Las capas 3-5 son geometría 3D: la cámara en perspectiva produce el parallax
// sola cuando se mueve. Las capas 1-2 son planos lejanos; si fueran 100% físicos
// a 500 m casi no se moverían, así que su desplazamiento se fija con un factor p:
// "se mueven p veces lo que se movería un objeto a 20 m". Así cada capa tiene
// una velocidad aparente distinta y controlada.
import * as THREE from 'three'
import { ILLIMANI_HORIZON } from '../assets.js'
import { makeCloudsTexture, makeSkyFallback } from './textures.js'

const REF_DIST = 20
const deg = THREE.MathUtils.degToRad

export class Parallax {
  constructor(root, assets) {
    this.layers = []
    const photo = assets.illimani || makeSkyFallback()
    const photoAspect = assets.illimani ? photo.image.width / photo.image.height : 1.6
    this._addLayer({ name: 'illimani', dist: 520, p: 0.04, map: photo, aspect: photoAspect, horizon: assets.illimani ? ILLIMANI_HORIZON : 0.15, order: -20 })
    this._addLayer({ name: 'nubes', dist: 440, p: 0.1, map: makeCloudsTexture(), aspect: null, horizon: 0, order: -19, transparent: true, drift: 0.004 })
    root.add(...this.layers.map((l) => l.mesh))
  }

  _addLayer(cfg) {
    const material = new THREE.MeshBasicMaterial({
      map: cfg.map,
      fog: false, // la niebla no debe tapar el fondo
      depthWrite: false,
      transparent: !!cfg.transparent,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    mesh.renderOrder = cfg.order
    mesh.frustumCulled = false
    this.layers.push({ ...cfg, mesh, offY: 0 })
  }

  /** Tamaño de cada plano para cubrir la vista (llamar al cambiar fov o aspecto). */
  layout(camera) {
    const dir = camera.getWorldDirection(new THREE.Vector3())
    const pitch = Math.asin(-dir.y) // cuánto mira hacia abajo
    const halfV = deg(camera.fov / 2)
    const halfH = Math.atan(Math.tan(halfV) * camera.aspect)
    const topAngle = Math.min(deg(80), Math.max(0, halfV - pitch) + deg(4))
    for (const L of this.layers) {
      const D = L.dist
      const needW = 2 * D * Math.tan(halfH) * 1.25 + 40
      const yHorizon = -D * Math.tan(deg(0.8)) // un poco bajo la línea de los ojos
      const needAbove = D * Math.tan(topAngle) - yHorizon
      let w, h
      if (L.aspect) {
        h = Math.max(needW / L.aspect, needAbove / (1 - L.horizon))
        w = h * L.aspect
      } else {
        w = needW
        h = needAbove
        L.map.repeat.x = w / (h * 2) // nubes sin deformar (textura 2:1)
      }
      L.mesh.scale.set(w, h, 1)
      L.offY = yHorizon + h * (0.5 - L.horizon)
    }
  }

  /** Coloca las capas respecto de la cámara y anima la deriva de las nubes. */
  update(dt, camera) {
    const c = camera.position
    for (const L of this.layers) {
      const pEff = (L.p * L.dist) / REF_DIST
      L.mesh.position.set(c.x * (1 - pEff), c.y + L.offY, c.z - L.dist)
      if (L.drift) L.map.offset.x = (L.map.offset.x + L.drift * dt) % 1
    }
  }
}
