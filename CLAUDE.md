# Llama Tránsito: El Alto

Juego 3D (Three.js + Vue 3 + Vite) para la tarea H4_T4. Enunciado en `docs/`. Responder y comentar el código en español.

## Comandos
- `npm run dev`: servidor de desarrollo. `npm run build`: debe pasar antes de cada PR.
- `?scene=play|end` abre una escena directamente; `?debug` expone `window.__game`.

## Arquitectura (no romper)
- Cada escena extiende `BaseScene`: `preload()` (carga imágenes con `loadAssets`) -> `create()` -> `update(dt)`.
  `Game.start(nombre)` las encadena. El escenario común se crea con `createStage()`.
- Vue solo habla con `Game`: métodos `command`, `start`, `restart`, `setPaused`; eventos `scene`, `score`, `lives`,
  `combo`, `power`, `light`, `toast`, `best`, `pause`, `end`, `loading`.
- Coordenadas: los vehículos avanzan hacia +z (hacia la cámara); la llama está en la pasarela en z = 0.
  Constantes en `src/game/config.js`.
- Parallax: capas lejanas en `utils/Parallax.js` con factor `p`; el resto es 3D real.
- Textos del juego en `src/game/data/contenido.js`, no hardcodear en la lógica.
- Todo recurso Three.js creado debe liberarse (ver `BaseScene.destroy`). Las imágenes cacheadas llevan
  `texture.userData.cached = true` y no se liberan.
- Imágenes nuevas: solo con licencia libre (CC0 o CC BY), en `src/assets/img/`, y con crédito en README.md.

## Git
Seguir `CONTRIBUTING.md`: ramas por tarea, PR a `main`, sin push directo ni `--force`.
