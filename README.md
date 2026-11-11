# Llama Andina: Cosecha de El Alto

Videojuego 3D con Three.js + Vue + Vite. Tarea H4_T4, Hito 4 — Programación Gráfica y Multimedia I (UNIFRANZ, sede El Alto).

## Eje de innovación social
**Eje 5: Seguridad alimentaria y nutrición.** Una llama recorre El Alto (Illimani, teleférico, casas de ladrillo) recogiendo
alimentos andinos (papa, choclo, haba, oca, quinua) y esquivando comida ultraprocesada. Completar los 5 alimentos arma un
**plato balanceado** que da puntos extra y una vida. Público: jóvenes y familias de El Alto.

## Instalación y ejecución
Requiere Node.js 18+.

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # build de producción en dist/
npm run preview   # sirve el build
```

## Controles
| Acción | Teclado | Táctil / mouse |
|---|---|---|
| Saltar / iniciar | Espacio, ↑, W, Enter | Tocar o clic en el juego |
| Pausa | P o Esc | Botón ⏸ |

## Estructura
```
src/
  main.js, App.vue          Arranque de Vue
  components/GameView.vue   Monta el juego, HUD, comunicación Vue <-> juego, limpieza
  game/
    Game.js                 Renderer, cámara, bucle, resize, cambio de escenas
    scenes/                 BaseScene (preload/create/update), MenuScene, PlayScene, EndScene
    utils/                  Parallax, textures (procedurales), input, sfx, storage, emitter
docs/                       Enunciado de la tarea
```

## Requisitos de la tarea
| Req. | Dónde |
|---|---|
| R1 Escenas modulares | `src/game/scenes/` (menú, juego, fin) |
| R2 Interacción, física, puntaje | `PlayScene.js` (gravedad, salto, colisiones), HUD en `GameView.vue` |
| R3 Parallax 3D | `utils/Parallax.js` (6 capas en Z) |
| R4 Escalamiento | `Game.resize()` + `ResizeObserver`, pixel ratio ≤ 2 |
| R5 Vue | `GameView.vue` |
| R6 Persistencia | `utils/storage.js` (localStorage) |
| R7 README | este archivo |

## Trabajo en equipo
Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Créditos
Integrantes: _completar_. Docente: Ing. Juan Gabriel Lazcano Balanza. Arte generado con código (Canvas 2D); emojis del sistema.
