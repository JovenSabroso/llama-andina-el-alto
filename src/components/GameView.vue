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
  introDone: false, // el menú aparece cuando termina la intro de cámara
  splat: false, // escupitajo en la pantalla
  wipe: false, // transición con franjas de tránsito
})
let game = null
let toastId = 0

// Manchas del escupitajo: posición (%), tamaño (vmin) y retraso (s), fijas para que no "salten"
const BLOBS = [
  [46, 38, 30, 0], [58, 30, 14, 0.04], [36, 52, 12, 0.06], [62, 55, 18, 0.03], [50, 62, 9, 0.08],
  [30, 30, 8, 0.1], [70, 40, 7, 0.09], [42, 22, 6, 0.12], [55, 48, 11, 0.05], [24, 58, 5, 0.14],
]
const blobStyle = ([x, y, s, d]) => ({ left: `${x}%`, top: `${y}%`, width: `${s}vmin`, height: `${s}vmin`, animationDelay: `${d}s, ${0.9 + d}s` })

const RULES = [
  { icon: '📱', name: 'Celular', tag: 'MULTA', bad: true },
  { icon: '💨', name: 'Velocidad', tag: 'MULTA', bad: true },
  { icon: '⛑️', name: 'Sin casco', tag: 'MULTA', bad: true },
  { icon: '🚦', name: 'Pasa en rojo', tag: 'MULTA', bad: true },
  { icon: '🚑', name: 'Ambulancia', tag: '¡NO!', bad: false },
]

onMounted(() => {
  game = new Game(host.value)
  game.on('scene', (v) => {
    state.scene = v
    if (v !== 'menu') state.introDone = false
  })
  game.on('menuIntro', (v) => (state.introDone = v))
  game.on('menuSpit', () => {
    state.splat = true
    setTimeout(() => (state.splat = false), 2600)
  })
  game.on('menuStart', () => play())
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
// Transición: las franjas de tránsito cubren la pantalla y en ese instante cambia la escena
const play = () => {
  if (state.wipe) return
  state.wipe = true
  setTimeout(() => game?.start('play'), 420)
  setTimeout(() => (state.wipe = false), 1000)
}
const menu = () => game?.start('menu')
const restart = () => game?.restart()
</script>

<template>
  <div class="wrap">
    <div ref="host" class="canvas-host"></div>

    <div v-if="state.loading" class="loading">Cargando El Alto…</div>

    <!-- MENÚ (pantalla de inicio) -->
    <template v-if="state.scene === 'menu' && !state.credits">
      <div class="vignette"></div>
      <div v-if="!state.introDone" class="skip">Toca o presiona Espacio para saltar</div>
      <div v-else class="intro">
        <div class="tape tape-top">
          <div class="tape-track">
            <span v-for="n in 2" :key="n">⚠ PRECAUCIÓN ⚠ LLAMA EN SERVICIO ⚠ NO CRUCES EN ROJO ⚠ RESPETA AL PEATÓN ⚠ CUIDADO: ESCUPE ⚠ PRECAUCIÓN ⚠ LLAMA EN SERVICIO ⚠ NO CRUCES EN ROJO ⚠ RESPETA AL PEATÓN ⚠ CUIDADO: ESCUPE&nbsp;</span>
          </div>
        </div>

        <header class="brand">
          <div class="big-light" aria-hidden="true"><i class="r"></i><i class="a"></i><i class="v"></i></div>
          <div class="brand-text">
            <div class="badge">🦙 POLICÍA DE TRÁNSITO · EL ALTO</div>
            <h1 class="logo"><span class="l1">LLAMA</span><span class="l2">TRÁNSITO</span></h1>
            <p class="tagline">Escupe a los infractores. Respeta al peatón.</p>
          </div>
        </header>

        <div class="spacer"></div>

        <div class="cards">
          <div v-for="(r, i) in RULES" :key="r.name" class="card" :class="r.bad ? 'bad' : 'good'" :style="{ animationDelay: 0.35 + i * 0.09 + 's' }">
            <span class="icon">{{ r.icon }}</span>
            <b>{{ r.name }}</b>
            <span class="stamp">{{ r.tag }}</span>
          </div>
        </div>

        <div class="cta">
          <button class="play-btn" @click="play">¡A DIRIGIR EL TRÁNSITO!</button>
          <div class="meta">
            <span class="record">🏆 Récord: {{ state.best }}</span>
            <button class="link" @click="state.credits = true">Créditos</button>
          </div>
          <p class="hint">← → mover · Espacio escupir · E Cholita Inspectora · P pausa · Móvil: desliza y toca</p>
        </div>
      </div>
    </template>

    <!-- escupitajo a la pantalla -->
    <div v-if="state.splat" class="splat" aria-hidden="true">
      <span v-for="(b, i) in BLOBS" :key="i" class="blob" :style="blobStyle(b)"></span>
    </div>

    <!-- transición con franjas de tránsito -->
    <div v-if="state.wipe" class="wipe" aria-hidden="true"><span>¡A TRABAJAR!</span></div>

    <!-- CRÉDITOS -->
    <div v-if="state.credits" class="panel">
      <h2>Créditos</h2>
      <p>Tarea H4_T4 · Programación Gráfica y Multimedia I · UNIFRANZ El Alto<br />Docente: Ing. Juan Gabriel Lazcano Balanza<br />Grupo 5 · Capa 8</p>
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
  animation: fadeLoad 0.2s 0.5s both; /* solo aparece si la carga tarda (al recargar no se ve) */
}
@keyframes fadeLoad { from { opacity: 0; } }

/* ---------------- PANTALLA DE INICIO ---------------- */
.vignette {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 45%, #0b0716cc 100%);
}
.skip {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); white-space: nowrap;
  font: 400 14px/1 'Bungee', sans-serif; letter-spacing: 1px; text-shadow: 0 2px 6px #000;
  animation: blink 1.2s infinite; pointer-events: none;
}
@keyframes blink { 50% { opacity: 0.35; } }
.intro { position: absolute; inset: 0; display: flex; flex-direction: column; pointer-events: none; animation: shake 0.35s 0.45s; }
.intro button { pointer-events: auto; }
.tape {
  flex: none; height: 38px; overflow: hidden; background: #fcbf49; box-shadow: 0 4px 14px #0008;
  border-top: 6px solid; border-bottom: 6px solid;
  border-image: repeating-linear-gradient(45deg, #111 0 12px, #fcbf49 12px 24px) 6;
}
.tape-top { margin: 12px -20px 0; transform: rotate(-1.5deg); animation: tapeIn 0.5s ease-out both; }
.tape-track { display: flex; width: max-content; animation: marquee 22s linear infinite; }
.tape-track span { white-space: nowrap; font: 400 15px/26px 'Bungee', sans-serif; color: #111; letter-spacing: 1px; }
@keyframes marquee { to { transform: translateX(-50%); } }
@keyframes tapeIn { from { transform: translateY(-90px) rotate(-1.5deg); } }

.brand { display: flex; align-items: center; justify-content: center; gap: clamp(10px, 3vw, 28px); margin-top: clamp(8px, 3vh, 26px); padding: 0 16px; }
.big-light {
  display: flex; flex-direction: column; gap: 6px; padding: 10px 8px; background: #111; border-radius: 14px;
  border: 3px solid #333; box-shadow: 0 8px 24px #000a; animation: drop 0.7s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}
.big-light i { width: clamp(18px, 3.4vw, 30px); aspect-ratio: 1; border-radius: 50%; opacity: 0.18; }
.big-light .r { background: #ff2a2a; animation: lampR 4s infinite; }
.big-light .a { background: #ffc21a; animation: lampA 4s infinite; }
.big-light .v { background: #2aff6a; animation: lampV 4s infinite; }
@keyframes lampR { 0%, 44% { opacity: 1; box-shadow: 0 0 18px #ff2a2a; } 45%, 100% { opacity: 0.18; } }
@keyframes lampV { 0%, 44% { opacity: 0.18; } 45%, 84% { opacity: 1; box-shadow: 0 0 18px #2aff6a; } 85%, 100% { opacity: 0.18; } }
@keyframes lampA { 0%, 84% { opacity: 0.18; } 85%, 100% { opacity: 1; box-shadow: 0 0 18px #ffc21a; } }
.brand-text { text-align: center; }
.badge {
  display: inline-block; font: 400 clamp(10px, 1.6vw, 14px)/1 'Bungee', sans-serif; color: #1b1230; background: #fff;
  padding: 6px 10px; border-radius: 6px; border: 2px solid #1b1230; transform: rotate(-3deg); animation: pop 0.4s 0.15s both;
}
.logo { margin: 6px 0 0; line-height: 0.92; font-family: 'Bungee', 'Segoe UI', sans-serif; font-weight: 400; transform: rotate(-3deg); animation: slam 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) both; }
.logo span { display: block; }
.l1 { font-size: clamp(30px, 6.5vw, 64px); color: #fff; -webkit-text-stroke: 2px #1b1230; text-shadow: 0 3px 0 #9aa0a6, 0 6px 0 #5b6066, 0 10px 18px #000c; }
.l2 {
  font-size: clamp(42px, 11vw, 124px); color: #fcbf49; -webkit-text-stroke: 3px #1b1230;
  text-shadow: 0 3px 0 #e09e1f, 0 6px 0 #c47f10, 0 9px 0 #8a5a0a, 0 12px 0 #5c3a06, 0 18px 28px #000d;
}
@keyframes slam {
  0% { transform: scale(2.8) rotate(-12deg); opacity: 0; filter: blur(6px); }
  60% { transform: scale(0.94) rotate(-2deg); opacity: 1; filter: none; }
  80% { transform: scale(1.03) rotate(-3.5deg); }
  100% { transform: scale(1) rotate(-3deg); }
}
.tagline { margin: 12px 0 0; font-weight: 800; font-size: clamp(13px, 2vw, 18px); text-shadow: 0 2px 6px #000; animation: fadeUp 0.5s 0.5s both; }
.spacer { flex: 1; }
.cards { display: flex; gap: clamp(6px, 1.4vw, 14px); justify-content: center; padding: 0 10px; }
.card {
  width: clamp(62px, 11vw, 112px); padding: 10px 4px 8px; border-radius: 14px; background: #1b1230d9; border: 3px solid;
  display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; box-shadow: 0 8px 20px #0008;
  animation: bounceIn 0.6s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}
.card.bad { border-color: #c1121f; }
.card.good { border-color: #2a9d4a; }
.card .icon { font-size: clamp(22px, 4vw, 38px); }
.card b { font-size: clamp(10px, 1.5vw, 14px); }
.stamp { font: 400 clamp(9px, 1.3vw, 12px)/1 'Bungee', sans-serif; padding: 4px 6px; border-radius: 4px; transform: rotate(-8deg); }
.bad .stamp { background: #c1121f; }
.good .stamp { background: #2a9d4a; }
@keyframes bounceIn { from { transform: translateY(80px) scale(0.5); opacity: 0; } }
.cta { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 16px 14px; animation: fadeUp 0.5s 0.8s both; }
.play-btn {
  font: 400 clamp(16px, 2.6vw, 26px)/1 'Bungee', sans-serif; color: #1b1230; background: #fcbf49; padding: 16px 28px;
  border-radius: 16px; border: 4px solid #1b1230; box-shadow: 0 6px 0 #8a5a0a, 0 12px 26px #000a;
  animation: pulse2 1.1s ease-in-out infinite alternate;
}
.play-btn:hover { background: #ffd166; }
.play-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #8a5a0a; }
@keyframes pulse2 { to { transform: scale(1.05); } }
.meta { display: flex; gap: 14px; align-items: center; }
.record { font-weight: 800; color: #a8e6a1; text-shadow: 0 2px 4px #000; }
.link { background: none; text-decoration: underline; min-height: 32px; padding: 0 6px; backdrop-filter: none; }
.hint { margin: 0; font-size: 12px; opacity: 0.85; text-shadow: 0 1px 3px #000; text-align: center; }
@keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } }
@keyframes pop { from { transform: scale(0) rotate(-3deg); } }
@keyframes drop { from { transform: translateY(-220px); } }
@keyframes shake { 0%, 100% { transform: none; } 25% { transform: translate(-6px, 4px); } 50% { transform: translate(5px, -3px); } 75% { transform: translate(-3px, 2px); } }
@media (max-width: 600px) {
  .big-light { display: none; }
  .hint { display: none; }
}

/* escupitajo en la pantalla */
.splat { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
.blob {
  position: absolute; transform: translate(-50%, -50%); border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffffee 0 12%, #dff6ffd9 30%, #a8dcffb0 62%, #a8dcff00 72%);
  filter: drop-shadow(0 2px 3px #0004);
  animation: splatIn 0.16s ease-out both, drip 1.6s ease-in forwards;
}
.blob::after {
  content: ''; position: absolute; left: 44%; top: 58%; width: 16%; height: 75%; border-radius: 0 0 50% 50%;
  background: linear-gradient(#dff6ffd0, #a8dcff00);
}
@keyframes splatIn { from { transform: translate(-50%, -50%) scale(0); } }
@keyframes drip { to { transform: translate(-50%, -20%) scaleY(1.3); opacity: 0; } }

/* transición con franjas de tránsito */
.wipe {
  position: absolute; inset: -10%; z-index: 20; display: grid; place-items: center; pointer-events: none;
  background: repeating-linear-gradient(45deg, #111 0 40px, #fcbf49 40px 80px);
  animation: wipe 1s cubic-bezier(0.7, 0, 0.3, 1) both;
}
.wipe span {
  font: 400 clamp(28px, 7vw, 72px)/1 'Bungee', sans-serif; color: #fff; background: #1b1230; padding: 14px 26px;
  border-radius: 14px; transform: rotate(-4deg); border: 4px solid #fcbf49;
}
@keyframes wipe {
  0% { transform: translateX(-110%) skewX(-12deg); }
  40%, 60% { transform: translateX(0) skewX(-12deg); }
  100% { transform: translateX(110%) skewX(-12deg); }
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
