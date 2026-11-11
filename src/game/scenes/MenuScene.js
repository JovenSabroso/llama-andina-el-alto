// Escena 1: menú. Presenta el problema social y espera la acción para jugar.
import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { makeEmojiTexture, makeTextMesh, placeText } from '../utils/textures.js'

export class MenuScene extends BaseScene {
  async preload() {
    this.llamaTex = makeEmojiTexture('🦙', 256)
  }

  create() {
    this.createBackground()
    this.title = makeTextMesh(['LLAMA ANDINA', 'Cosecha de El Alto'], { px: 84, color: '#ffd166' })
    this.pitch = makeTextMesh(
      ['Tu familia necesita comer sano:', 'recoge alimentos andinos y esquiva la comida chatarra'],
      { px: 44, font: 600 },
    )
    this.cta = makeTextMesh('Toca o presiona ESPACIO para jugar', { px: 52, color: '#ffffff' })
    this.record = makeTextMesh(`Mejor puntaje: ${this.game.best}`, { px: 44, color: '#a8e6a1' })
    this.llama = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: this.llamaTex, transparent: true, depthWrite: false }),
    )
    for (const m of [this.title, this.pitch, this.cta, this.record, this.llama]) {
      m.renderOrder = 20
      this.root.add(m)
    }
  }

  onResize() {
    this.resizeBackground()
    const { w, h } = this.game.view()
    const maxW = w * 0.92
    placeText(this.title, h * 0.2, maxW)
    placeText(this.pitch, h * 0.09, maxW)
    placeText(this.cta, h * 0.07, maxW)
    placeText(this.record, h * 0.06, maxW)
    this.title.position.set(0, h * 0.24, 0)
    this.pitch.position.set(0, h * 0.07, 0)
    this.record.position.set(0, -h * 0.05, 0)
    this.cta.position.set(0, -h * 0.17, 0)
    const size = Math.min(h * 0.2, w * 0.3)
    this.llama.scale.set(size, size, 1)
    this.llamaBaseY = -h * 0.32
  }

  update(dt) {
    const t = this.game.time
    this.parallax.update(dt, 3)
    this.llama.position.set(0, this.llamaBaseY + Math.abs(Math.sin(t * 3)) * 0.8, 0)
    this.cta.material.opacity = 0.65 + Math.sin(t * 4) * 0.35
  }

  onAction() {
    this.game.start('play')
  }
}
