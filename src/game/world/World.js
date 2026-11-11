// Escenario 3D de El Alto: avenida de 3 carriles, paso de cebra, semáforo,
// pasarela peatonal, casas de ladrillo con fierros en el techo, teleférico.
import * as THREE from 'three'
import { LANES, ROAD_HALF, STOP_Z, ZEBRA, DECK_Y, DECK_TOP, LIGHT_TIMES } from '../config.js'
import { TIENDAS } from '../data/contenido.js'
import { makeSignTexture, makeSidewalkTexture, makeWiphalaTexture, rng } from '../utils/textures.js'

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra })

/** BoxGeometry con UV en metros: la textura de ladrillo no se estira según el tamaño. */
function boxWorldUV(w, h, d, tile) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const uv = geo.attributes.uv
  // orden de caras: +x, -x, +y, -y, +z, -z (4 vértices cada una)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i
      uv.setXY(k, (uv.getX(k) * dims[f][0]) / tile, (uv.getY(k) * dims[f][1]) / tile)
    }
  }
  return geo
}

export class World {
  constructor(root, assets, { onLight } = {}) {
    this.root = root
    this.assets = assets
    this.onLight = onLight
    this.t = 0
    this._lights()
    this._ground()
    this._road()
    this._pasarela()
    this._buildings()
    this._trafficLight()
    this._teleferico()
  }

  add(obj) {
    this.root.add(obj)
    return obj
  }

  _lights() {
    const fogColor = this.assets.horizonColor.clone()
    this.root.background = fogColor
    this.root.fog = new THREE.Fog(fogColor, 90, 330)
    this.add(new THREE.HemisphereLight(0xd6e6ff, 0x7a6248, 1.5))
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.6)
    sun.position.set(-25, 45, 22)
    sun.target.position.set(0, 0, -14)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 34, bottom: -34, near: 5, far: 140 })
    sun.shadow.bias = -0.0006
    this.add(sun)
    this.add(sun.target)
  }

  _ground() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), std(0x7f6d52))
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, -0.03, -400)
    this.add(ground)
  }

  _road() {
    const len = 280
    const zc = 20 - len / 2
    const tex = this.assets.asfalto
    if (tex) tex.repeat.set((ROAD_HALF * 2) / 5, len / 5)
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_HALF * 2, len),
      std(tex ? 0xb0b0b0 : 0x3d3d40, { map: tex, roughness: 0.95 }),
    )
    road.rotation.x = -Math.PI / 2
    road.position.set(0, 0, zc)
    road.receiveShadow = true
    this.add(road)

    const white = std(0xf2f2f2, { roughness: 0.6 })
    // líneas discontinuas entre carriles (InstancedMesh = 1 sola llamada de dibujo)
    const dashes = []
    for (const x of [(LANES[0] + LANES[1]) / 2, (LANES[1] + LANES[2]) / 2]) {
      for (let z = 14; z > -250; z -= 7) if (z > STOP_Z + 1 || z < STOP_Z - 2) dashes.push([x, z])
    }
    const dashMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.02, 3), white, dashes.length)
    const m = new THREE.Matrix4()
    dashes.forEach(([x, z], i) => dashMesh.setMatrixAt(i, m.makeTranslation(x, 0.01, z)))
    dashMesh.receiveShadow = true
    this.add(dashMesh)
    for (const s of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, len), std(0xf2c94c))
      edge.position.set(s * (ROAD_HALF - 0.25), 0.01, zc)
      this.add(edge)
    }
    // línea de pare y paso de cebra
    const stop = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2 - 0.6, 0.02, 0.4), white)
    stop.position.set(0, 0.012, STOP_Z + 0.2)
    this.add(stop)
    const zebraLen = ZEBRA.z1 - ZEBRA.z0
    const stripes = []
    for (let x = -ROAD_HALF + 0.7; x < ROAD_HALF - 0.4; x += 1.1) stripes.push(x)
    const zebra = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.02, zebraLen), white, stripes.length)
    stripes.forEach((x, i) => zebra.setMatrixAt(i, m.makeTranslation(x, 0.012, (ZEBRA.z0 + ZEBRA.z1) / 2)))
    zebra.receiveShadow = true
    this.add(zebra)

    // aceras
    const sideTex = makeSidewalkTexture()
    sideTex.repeat.set(2.5, len / 2)
    const sideW = 5
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(sideW, 0.25, len), std(0xffffff, { map: sideTex }))
      side.position.set(s * (ROAD_HALF + sideW / 2), 0.125, zc)
      side.receiveShadow = true
      this.add(side)
    }

    // postes de luz en las aceras
    const poles = []
    for (let z = 4; z > -240; z -= 18) poles.push([-6.3, z], [6.3, z])
    const poleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 7, 6), std(0x55585e), poles.length)
    poles.forEach(([x, z], i) => poleMesh.setMatrixAt(i, m.makeTranslation(x, 3.5, z)))
    poleMesh.castShadow = true
    this.add(poleMesh)
  }

  _pasarela() {
    const concrete = std(0x9ba3ab)
    const blue = std(0x1f6fd1, { roughness: 0.5, metalness: 0.3 })
    const deck = new THREE.Mesh(new THREE.BoxGeometry(21, 0.4, 2.6), concrete)
    deck.position.set(0, DECK_Y, 0)
    deck.castShadow = deck.receiveShadow = true
    this.add(deck)
    // barandas
    for (const z of [-1.22, 1.22]) {
      for (const y of [DECK_TOP + 1.05, DECK_TOP + 0.55]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(21, 0.09, 0.09), blue)
        rail.position.set(0, y, z)
        this.add(rail)
      }
    }
    const posts = []
    for (let x = -10.4; x <= 10.4; x += 1.04) posts.push([x, -1.22], [x, 1.22])
    const postMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 1.1, 0.08), blue, posts.length)
    const m = new THREE.Matrix4()
    posts.forEach(([x, z], i) => postMesh.setMatrixAt(i, m.makeTranslation(x, DECK_TOP + 0.55, z)))
    this.add(postMesh)
    // columnas sobre las aceras
    const colGeo = new THREE.CylinderGeometry(0.32, 0.32, DECK_Y, 10)
    for (const x of [-6.6, 6.6]) {
      for (const z of [-0.8, 0.8]) {
        const col = new THREE.Mesh(colGeo, concrete)
        col.position.set(x, DECK_Y / 2, z)
        col.castShadow = true
        this.add(col)
      }
    }
    // escaleras a ambos lados
    const steps = 13
    const stepMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 2.4), concrete, steps * 2)
    let i = 0
    for (const s of [-1, 1]) {
      for (let k = 0; k < steps; k++) {
        const top = DECK_TOP - (k + 1) * (DECK_TOP / (steps + 1))
        m.compose(
          new THREE.Vector3(s * (10.75 + k * 0.5), top / 2, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(0.5, top, 1),
        )
        stepMesh.setMatrixAt(i++, m)
      }
    }
    stepMesh.castShadow = true
    this.add(stepMesh)
    // pancarta bajo la pasarela (mirando a la cámara)
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 1.1),
      new THREE.MeshStandardMaterial({ map: makeSignTexture('¡RESPETA AL PEATÓN!', { bg: '#fcbf49', w: 1024, h: 140, border: '#1b1230' }) }),
    )
    banner.position.set(0, DECK_Y - 0.85, 1.32)
    this.add(banner)
  }

  _buildings() {
    const r = rng(42)
    const brick = this.assets.ladrillo
      ? std(0xe08a5e, { map: this.assets.ladrillo, normalMap: this.assets.ladrilloNormal, roughness: 0.95 })
      : std(0xb5523b)
    const plasters = [0xd9c27a, 0x7fa7c9, 0xc98f8f, 0x9fc58f, 0xe8e2d0].map((c) => std(c))
    const windows = []
    const rebars = []
    const tanks = []
    const signCache = new Map()
    const signMat = (name) => {
      if (!signCache.has(name)) {
        const bg = ['#fcbf49', '#ffffff', '#2a9d4a', '#1d6fb8', '#c1121f'][signCache.size % 5]
        const fg = bg === '#ffffff' || bg === '#fcbf49' ? '#1b1230' : '#ffffff'
        signCache.set(name, new THREE.MeshStandardMaterial({ map: makeSignTexture(name, { bg, fg, w: 512, h: 112 }) }))
      }
      return signCache.get(name)
    }
    const door = std(0x3b2a1d)
    const wiphala = new THREE.MeshStandardMaterial({ map: makeWiphalaTexture(), side: THREE.DoubleSide })
    this.flags = []
    let n = 0
    for (const s of [-1, 1]) {
      let z = 16
      while (z > -235) {
        const len = 5 + r() * 4
        if (z - len < 4 && z > -4) {
          z = -4 // hueco para las escaleras de la pasarela
          continue
        }
        const depth = 7 + r() * 4
        const floors = 1 + Math.floor(r() * 4)
        const h = floors * 2.9 + 0.3
        const front = s * (ROAD_HALF + 5) // fachada hacia la calle
        const cx = front + s * (depth / 2)
        const cz = z - len / 2
        const material = r() < 0.7 ? brick : plasters[Math.floor(r() * plasters.length)]
        const b = new THREE.Mesh(boxWorldUV(depth, h, len, 2.2), material)
        b.position.set(cx, h / 2, cz)
        b.receiveShadow = true
        this.add(b)

        // ventanas en pisos superiores
        const per = Math.max(1, Math.floor((len - 1) / 2.2))
        for (let f = 1; f < floors; f++) {
          for (let k = 0; k < per; k++) {
            const wz = cz - ((per - 1) * 2.2) / 2 + k * 2.2
            windows.push([front - s * 0.05, f * 2.9 + 1.5, wz])
          }
        }
        // planta baja: puerta y letrero de tienda
        const faceRot = s < 0 ? Math.PI / 2 : -Math.PI / 2
        const d = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.1, 1.2), door)
        d.position.set(front - s * 0.05, 1.05, cz + len * 0.25)
        this.add(d)
        if (r() < 0.65) {
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(len - 1, 4.2), 0.85), signMat(TIENDAS[n % TIENDAS.length]))
          sign.position.set(front - s * 0.08, 2.55, cz - len * 0.1)
          sign.rotation.y = faceRot
          this.add(sign)
        }
        // fierros de construcción y tanques de agua en el techo
        if (r() < 0.65) {
          for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]]) {
            rebars.push([cx + ox * (depth / 2 - 0.3), h + 0.6, cz + oz * (len / 2 - 0.3)])
          }
        }
        if (r() < 0.4) tanks.push([cx + (r() - 0.5) * depth * 0.5, h + 0.45, cz + (r() - 0.5) * len * 0.5])
        if (n % 9 === 4) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 5), std(0x999999))
          pole.position.set(cx, h + 1.3, cz)
          this.add(pole)
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0, 6, 1), wiphala)
          flag.position.set(cx, h + 2.05, cz + 0.72)
          flag.rotation.y = Math.PI / 2
          this.add(flag)
          this.flags.push(flag)
        }
        z -= len + 0.15
        n++
      }
    }
    const m = new THREE.Matrix4()
    const winMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 1.15, 1.0), std(0xffffff, { roughness: 0.25, metalness: 0.2 }), windows.length)
    const c = new THREE.Color()
    windows.forEach(([x, y, z], i) => {
      winMesh.setMatrixAt(i, m.makeTranslation(x, y, z))
      winMesh.setColorAt(i, c.set(r() < 0.15 ? 0xffd58a : 0x2a3a4a)) // algunas con luz
    })
    this.add(winMesh)
    const rebarMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), std(0x3a3a3a), rebars.length)
    rebars.forEach(([x, y, z], i) => rebarMesh.setMatrixAt(i, m.makeTranslation(x, y, z)))
    this.add(rebarMesh)
    const tankMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 10), std(0x1f2a44), tanks.length)
    tanks.forEach(([x, y, z], i) => tankMesh.setMatrixAt(i, m.makeTranslation(x, y, z)))
    this.add(tankMesh)
  }

  _trafficLight() {
    const metal = std(0x2b2d31, { metalness: 0.5, roughness: 0.5 })
    const x = 6.4
    const z = STOP_Z - 0.4
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 6.6, 8), metal)
    pole.position.set(x, 3.3, z)
    pole.castShadow = true
    this.add(pole)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 0.16), metal)
    arm.position.set(x - 1.8, 6.5, z)
    this.add(arm)
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.7), std(0x1b1b1b))
    housing.position.set(LANES[2] - 0.6, 5.35, z)
    housing.castShadow = true
    this.add(housing)
    const colors = { rojo: 0xff2a2a, amarillo: 0xffc21a, verde: 0x2aff6a }
    this.lamps = {}
    let y = 6.05
    for (const name of ['rojo', 'amarillo', 'verde']) {
      const mat = new THREE.MeshStandardMaterial({ color: colors[name], emissive: colors[name], emissiveIntensity: 0.05 })
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), mat)
      lamp.scale.z = 1.5 // asoma por delante y por detrás de la caja
      lamp.position.set(LANES[2] - 0.6, y, z)
      this.add(lamp)
      this.lamps[name] = mat
      y -= 0.7
    }
    this.light = { state: 'verde', timer: LIGHT_TIMES.verde }
    this._applyLight()
  }

  _applyLight() {
    for (const [name, mat] of Object.entries(this.lamps)) {
      mat.emissiveIntensity = name === this.light.state ? 2.5 : 0.05
    }
    this.onLight?.(this.light.state)
  }

  _teleferico() {
    const z = -140
    const y = 32
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 700, 4), std(0x222222))
    cable.rotation.z = Math.PI / 2
    cable.position.set(0, y, z)
    this.add(cable)
    for (const x of [-110, -35, 40, 115]) {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.4, y + 2, 1.4), std(0x8a8f96))
      tower.position.set(x, (y + 2) / 2, z)
      this.add(tower)
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 5), std(0x8a8f96))
      cross.position.set(x, y + 1.5, z)
      this.add(cross)
    }
    const lineColors = [0xd62828, 0xfcbf49, 0x2a9d4a]
    this.cabins = []
    for (let i = 0; i < 9; i++) {
      const cab = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.2), std(lineColors[i % 3], { roughness: 0.4 }))
      const win = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.7, 2.25), std(0x1e2a36, { roughness: 0.2 }))
      win.position.y = 0.3
      const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 4), std(0x222222))
      hanger.position.y = 1.8
      cab.add(body, win, hanger)
      cab.position.set(-330 + i * 75, y - 2.6, z)
      this.add(cab)
      this.cabins.push(cab)
    }
  }

  /** Avanza el semáforo, el teleférico y las banderas. */
  update(dt) {
    this.t += dt
    this.light.timer -= dt
    if (this.light.timer <= 0) {
      const next = { verde: 'amarillo', amarillo: 'rojo', rojo: 'verde' }[this.light.state]
      this.light.state = next
      this.light.timer = LIGHT_TIMES[next]
      this._applyLight()
    }
    for (const c of this.cabins) {
      c.position.x += dt * 6
      if (c.position.x > 345) c.position.x -= 675
    }
    for (const f of this.flags) f.rotation.y = Math.PI / 2 + Math.sin(this.t * 2 + f.position.z) * 0.25
  }
}
