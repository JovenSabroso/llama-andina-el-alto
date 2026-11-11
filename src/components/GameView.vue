<script setup>
// R5: el juego vive dentro de un componente Vue.
// Vue -> juego: restart(), setPaused(), start('menu')
// Juego -> Vue: eventos 'score', 'lives', 'plate', 'best', 'pause', 'scene'
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Game } from '../game/Game.js'

const host = ref(null)
const state = reactive({ scene: 'menu', score: 0, lives: 3, best: 0, plate: [], paused: false })
const FOODS = [
  { id: 'papa', emoji: '🥔' },
  { id: 'choclo', emoji: '🌽' },
  { id: 'haba', emoji: '🫘' },
  { id: 'oca', emoji: '🍠' },
  { id: 'quinua', emoji: '🌾' },
]
let game = null

onMounted(() => {
  game = new Game(host.value)
  game.on('scene', (v) => (state.scene = v))
  game.on('score', (v) => (state.score = v))
  game.on('lives', (v) => (state.lives = v))
  game.on('plate', (v) => (state.plate = v))
  game.on('best', (v) => (state.best = v))
  game.on('pause', (v) => (state.paused = v))
  game.init()
})

// Limpieza: sin esto, cada montaje dejaría un contexto WebGL y un bucle vivos.
onBeforeUnmount(() => {
  game?.destroy()
  game = null
})

const togglePause = () => game?.setPaused(!state.paused)
const restart = () => game?.restart()
const goMenu = () => game?.start('menu')
</script>

<template>
  <div class="wrap">
    <div ref="host" class="canvas-host"></div>

    <div v-if="state.scene === 'play'" class="hud">
      <div class="hud-left">
        <div class="score">{{ state.score }}</div>
        <div class="lives" aria-label="Vidas">
          <span v-for="n in 3" :key="n" :class="{ off: n > state.lives }">❤</span>
        </div>
        <div class="plate" title="Plato balanceado: recoge los 5 alimentos">
          <span v-for="f in FOODS" :key="f.id" :class="{ on: state.plate.includes(f.id) }">{{ f.emoji }}</span>
        </div>
      </div>
      <div class="hud-right">
        <button type="button" aria-label="Pausa" @pointerdown.stop @click="togglePause">{{ state.paused ? '▶' : '⏸' }}</button>
        <button type="button" aria-label="Reiniciar" @pointerdown.stop @click="restart">↻</button>
        <button type="button" aria-label="Menú" @pointerdown.stop @click="goMenu">⌂</button>
      </div>
    </div>

    <div v-if="state.paused" class="pause" @pointerdown.stop>
      <h2>Pausa</h2>
      <button type="button" @click="togglePause">Continuar</button>
    </div>
  </div>
</template>

<style scoped>
.wrap { position: relative; width: 100%; height: 100%; }
.canvas-host { position: absolute; inset: 0; }
.hud {
  position: absolute; inset: 0 0 auto 0; display: flex; justify-content: space-between;
  padding: 10px 12px; pointer-events: none;
}
.hud-left { display: flex; flex-direction: column; gap: 4px; }
.score { font-size: clamp(24px, 5vw, 40px); font-weight: 800; text-shadow: 0 2px 6px #000a; }
.lives { font-size: clamp(18px, 3.5vw, 26px); color: #ff5d73; letter-spacing: 2px; }
.lives .off { color: #ffffff44; }
.plate { display: flex; gap: 4px; font-size: clamp(18px, 3.5vw, 26px); }
.plate span { opacity: 0.3; filter: grayscale(1); transition: all 0.2s; }
.plate span.on { opacity: 1; filter: none; transform: scale(1.15); }
.hud-right { display: flex; gap: 8px; pointer-events: auto; align-items: flex-start; }
button {
  min-width: 44px; min-height: 44px; border: 0; border-radius: 12px; font-size: 20px;
  background: #ffffff26; color: #fff; backdrop-filter: blur(4px); cursor: pointer;
}
button:hover { background: #ffffff44; }
.pause {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; background: #1b1230aa;
}
.pause button { padding: 0 24px; font-size: 18px; background: #ffd166; color: #1b1230; font-weight: 700; }
</style>
