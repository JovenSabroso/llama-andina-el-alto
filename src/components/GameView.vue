<script setup>
// R5: el juego vive dentro de este componente Vue.
// Vue -> juego: game.command(), game.start(), game.restart(), game.setPaused()
// Juego -> Vue: eventos (puntaje, vidas, semáforo, avisos, resultado final...)
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Game } from '../game/Game.js'

const host = ref(null)
const state = reactive({
  scene: null,
  loading: true,
  score: 0,
  lives: 3,
  combo: 0,
  power: 0,
  light: 'verde',
  best: 0,
  paused: false,
  end: null,
  toasts: [],
  credits: false,
})
let game = null
let toastId = 0

onMounted(() => {
  game = new Game(host.value)
  game.on('scene', (v) => (state.scene = v))
  game.on('loading', (v) => (state.loading = v))
  game.on('score', (v) => (state.score = v))
  game.on('lives', (v) => (state.lives = v))
  game.on('combo', (v) => (state.combo = v))
  game.on('power', (v) => (state.power = v))
  game.on('light', (v) => (state.light = v))
  game.on('best', (v) => (state.best = v))
  game.on('pause', (v) => (state.paused = v))
  game.on('end', (v) => (state.end = v))
  game.on('toast', (t) => {
    const id = ++toastId
    state.toasts.push({ id, ...t })
    if (state.toasts.length > 3) state.toasts.shift()
    setTimeout(() => (state.toasts = state.toasts.filter((x) => x.id !== id)), 2200)
  })
  game.init()
})

// Limpieza: sin esto, cada montaje dejaría vivos un contexto WebGL y un bucle.
onBeforeUnmount(() => {
  game?.destroy()
  game = null
})

const cmd = (c) => game?.command(c)
const play = () => game?.start('play')
const menu = () => game?.start('menu')
const restart = () => game?.restart()
</script>

<template>
  <div class="wrap">
    <div ref="host" class="canvas-host"></div>

    <div v-if="state.loading" class="loading">Cargando El Alto…</div>

    <!-- MENÚ -->
    <div v-if="state.scene === 'menu' && !state.credits" class="panel menu">
      <h1>LLAMA TRÁNSITO</h1>
      <p class="sub">El Alto · Seguridad vial</p>
      <p>
        Desde la pasarela, la llama de tránsito vigila la avenida.
        <b>Escupe a los infractores</b> y deja pasar a quien cumple la norma.
      </p>
      <ul class="rules">
        <li>📱 Celular al volante · 💨 Exceso de velocidad · ⛑️ Moto sin casco</li>
        <li>🚦 El que <b>cruza la línea en rojo</b> también es infractor</li>
        <li>🚑 ¡A la ambulancia no se le escupe!</li>
      </ul>
      <p class="keys">← → mover · Espacio escupir · E Cholita Inspectora · P pausa<br />Móvil: desliza para moverte y toca para escupir</p>
      <p class="best">Mejor puntaje: {{ state.best }}</p>
      <div class="row">
        <button class="primary" @click="play">¡A dirigir el tránsito!</button>
        <button @click="state.credits = true">Créditos</button>
      </div>
    </div>

    <!-- CRÉDITOS -->
    <div v-if="state.credits" class="panel">
      <h2>Créditos</h2>
      <p>Tarea H4_T4 · Programación Gráfica y Multimedia I · UNIFRANZ El Alto<br />Docente: Ing. Juan Gabriel Lazcano Balanza</p>
      <p class="small">
        Foto de fondo: "Nevado del Illimani desde El Alto", Qhanaaru, Wikimedia Commons (CC0).<br />
        Fotos de alcaldes (CC BY 2.0, Wikimedia Commons): Eliser Roca por Asi Es Mi Pueblo; Eva Copa por Alejandra Vaca, Cámara de Senadores.<br />
        Texturas de asfalto y ladrillo: ambientCG.com (CC0).<br />
        Modelos 3D, sonidos, letreros, wiphala y aguayo: hechos con código por el grupo.
      </p>
      <button @click="state.credits = false">Volver</button>
    </div>

    <!-- HUD DE JUEGO -->
    <template v-if="state.scene === 'play'">
      <div class="hud">
        <div class="hud-left">
          <div class="score">{{ state.score }}</div>
          <div class="lives" title="Confianza ciudadana">
            <span v-for="n in 3" :key="n" :class="{ off: n > state.lives }">❤</span>
          </div>
          <div v-if="state.combo > 1" class="combo">Racha x{{ state.combo }}</div>
        </div>
        <div class="semaforo" :aria-label="'Semáforo en ' + state.light">
          <span class="r" :class="{ on: state.light === 'rojo' }"></span>
          <span class="a" :class="{ on: state.light === 'amarillo' }"></span>
          <span class="v" :class="{ on: state.light === 'verde' }"></span>
        </div>
        <div class="hud-right">
          <button aria-label="Pausa" @click="cmd('pause')">{{ state.paused ? '▶' : '⏸' }}</button>
          <button aria-label="Reiniciar" @click="restart">↻</button>
          <button aria-label="Menú" @click="menu">⌂</button>
        </div>
      </div>

      <div class="toasts">
        <div v-for="t in state.toasts" :key="t.id" class="toast" :class="t.kind">{{ t.text }}</div>
      </div>

      <div class="bottom">
        <button class="ctrl" aria-label="Izquierda" @click="cmd('left')">◀</button>
        <button class="power" :class="{ ready: state.power >= 1 }" :disabled="state.power < 1" @click="cmd('power')">
          <span class="fill" :style="{ width: state.power * 100 + '%' }"></span>
          <span class="label">👒 Cholita Inspectora {{ state.power >= 1 ? '(E)' : '' }}</span>
        </button>
        <button class="ctrl spit" aria-label="Escupir" @click="cmd('action')">💦</button>
        <button class="ctrl" aria-label="Derecha" @click="cmd('right')">▶</button>
      </div>
    </template>

    <div v-if="state.paused" class="panel">
      <h2>Pausa</h2>
      <button class="primary" @click="cmd('pause')">Continuar</button>
    </div>

    <!-- FIN DE PARTIDA -->
    <div v-if="state.scene === 'end' && state.end" class="panel end">
      <h2>¡Fin del turno!</h2>
      <div class="big">{{ state.end.score }} pts</div>
      <div v-if="state.end.record" class="record">¡Nuevo récord!</div>
      <div class="stats">
        <div><b>{{ state.end.accuracy }}%</b><span>infracciones detectadas</span></div>
        <div><b>{{ state.end.fined }}</b><span>multas correctas</span></div>
        <div><b>{{ state.end.escaped }}</b><span>se escaparon</span></div>
        <div><b>{{ state.end.wrong }}</b><span>multas injustas</span></div>
      </div>
      <p class="tip">💡 {{ state.end.tip }}</p>
      <p class="joke">{{ state.end.joke }}</p>
      <div class="row">
        <button class="primary" @click="play">Jugar otra vez</button>
        <button @click="menu">Menú</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap { position: relative; width: 100%; height: 100%; overflow: hidden; }
.canvas-host { position: absolute; inset: 0; }
button {
  min-height: 44px; min-width: 44px; padding: 0 16px; border: 0; border-radius: 12px;
  font: 700 16px/1 inherit; color: #fff; background: #ffffff2e; backdrop-filter: blur(6px); cursor: pointer;
}
button:hover { background: #ffffff4d; }
button.primary { background: #fcbf49; color: #1b1230; }
button.primary:hover { background: #ffd166; }
.loading {
  position: absolute; inset: 0; display: grid; place-items: center; font-size: 20px;
  background: #1b1230; pointer-events: none;
}
.panel {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(560px, calc(100% - 32px)); max-height: calc(100% - 32px); overflow: auto;
  padding: 20px 22px; border-radius: 18px; text-align: center;
  background: #1b1230d9; box-shadow: 0 10px 40px #0008; backdrop-filter: blur(4px);
}
.panel h1 { margin: 0; font-size: clamp(30px, 7vw, 48px); color: #fcbf49; letter-spacing: 1px; }
.panel h2 { margin: 0 0 8px; color: #fcbf49; }
.panel p { margin: 8px 0; line-height: 1.4; }
.sub { margin-top: 0 !important; opacity: 0.8; }
.rules { list-style: none; padding: 0; margin: 10px 0; line-height: 1.6; font-size: 15px; }
.keys { font-size: 13px; opacity: 0.8; }
.best { color: #a8e6a1; font-weight: 700; }
.small { font-size: 13px; opacity: 0.85; }
.row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }

.hud {
  position: absolute; inset: 0 0 auto 0; display: flex; justify-content: space-between; align-items: flex-start;
  padding: 10px 12px; pointer-events: none;
}
.hud-left { display: flex; flex-direction: column; gap: 2px; }
.score { font-size: clamp(26px, 5vw, 40px); font-weight: 900; text-shadow: 0 2px 6px #000c; }
.lives { font-size: 22px; color: #ff5d73; letter-spacing: 2px; text-shadow: 0 1px 3px #0008; }
.lives .off { color: #ffffff40; }
.combo { font-weight: 800; color: #fcbf49; text-shadow: 0 1px 4px #000; }
.hud-right { display: flex; gap: 8px; pointer-events: auto; }
.semaforo {
  display: flex; flex-direction: column; gap: 4px; padding: 6px; border-radius: 10px; background: #111d;
}
.semaforo span { width: 18px; height: 18px; border-radius: 50%; opacity: 0.2; }
.semaforo .r { background: #ff2a2a; }
.semaforo .a { background: #ffc21a; }
.semaforo .v { background: #2aff6a; }
.semaforo .on { opacity: 1; box-shadow: 0 0 10px currentColor; }

.toasts {
  position: absolute; top: 90px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column;
  gap: 6px; align-items: center; pointer-events: none; width: calc(100% - 32px);
}
.toast {
  padding: 8px 14px; border-radius: 10px; font-weight: 700; font-size: clamp(13px, 2.6vw, 16px);
  background: #1b1230cc; text-align: center; animation: pop 0.25s ease-out;
}
.toast.good { background: #2a9d4ae6; }
.toast.bad { background: #c1121fe6; }
@keyframes pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.bottom {
  position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 8px; justify-content: center;
  align-items: center; padding: 12px; flex-wrap: wrap;
}
.ctrl { width: 60px; height: 60px; font-size: 24px; border-radius: 50%; }
.ctrl.spit { background: #2e86dee6; }
.power { position: relative; overflow: hidden; height: 48px; min-width: 200px; background: #00000066; }
.power .fill { position: absolute; left: 0; top: 0; bottom: 0; background: #d62828aa; transition: width 0.3s; }
.power .label { position: relative; }
.power.ready { background: #d62828; animation: pulse 0.8s infinite alternate; }
.power:disabled { cursor: default; }
@keyframes pulse { to { transform: scale(1.06); } }
@media (max-width: 480px) {
  .bottom { gap: 6px; padding: 10px 8px; flex-wrap: nowrap; }
  .ctrl { width: 52px; height: 52px; font-size: 20px; }
  .power { min-width: 0; flex: 1; max-width: 170px; padding: 0 8px; font-size: 12px; }
  .toasts { top: 76px; }
}

@media (min-aspect-ratio: 6/5) and (min-width: 900px) {
  .panel.end { left: auto; right: 4%; transform: translateY(-50%); width: 480px; }
}
.end .big { font-size: clamp(34px, 8vw, 52px); font-weight: 900; }
.record { color: #a8e6a1; font-weight: 800; }
.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 12px 0; }
.stats div { background: #ffffff14; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; }
.stats b { font-size: 24px; color: #fcbf49; }
.stats span { font-size: 13px; opacity: 0.85; }
.tip { font-weight: 600; }
.joke { font-style: italic; opacity: 0.85; }
</style>
