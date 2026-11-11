# Llama Andina: Cosecha de El Alto

Juego 3D (Three.js + Vue 3 + Vite) para la tarea H4_T4. Enunciado en `docs/`. Responder y comentar el código en español.

## Comandos
- `npm run dev`: servidor de desarrollo. `npm run build`: debe pasar antes de cada PR.

## Arquitectura (no romper)
- Cada escena extiende `BaseScene` e implementa `preload() -> create() -> update(dt)`; `Game.start(nombre)` las encadena.
- Vue solo habla con `Game` (eventos `score`, `lives`, `plate`, `best`, `pause`, `scene`; métodos `restart`, `setPaused`, `start`).
- Parallax: capas planas a distinto Z con la misma velocidad de mundo (`utils/Parallax.js`). No hardcodear velocidades por capa.
- Medidas de gameplay en unidades escaladas por `this.s` (altura visible / 18.65) para que funcione en cualquier pantalla.
- Todo recurso Three.js creado debe liberarse (ver `BaseScene.destroy`).

## Git
Seguir `CONTRIBUTING.md`: ramas por tarea, PR a `main`, sin push directo ni `--force`.
