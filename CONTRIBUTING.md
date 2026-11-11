# Cómo trabajamos en paralelo con Git

## Reglas
1. `main` siempre debe compilar (`npm run build`). Nadie hace push directo a `main`: todo entra por Pull Request.
2. Una rama por tarea, con prefijo: `feat/`, `fix/`, `docs/` (ej. `feat/sonidos-andinos`).
3. Commits pequeños y en español, en imperativo: "Agrega pantalla de pausa".
4. Antes de empezar a trabajar: `git switch main && git pull`.
5. Antes de abrir el PR: `git fetch && git rebase origin/main` y `npm run build`.

## Flujo diario
```bash
git switch main && git pull
git switch -c feat/mi-tarea
# ...trabajar...
git add <archivos> && git commit -m "Describe el cambio"
git push -u origin feat/mi-tarea
gh pr create --fill          # el otro revisa y hace merge
```

## Para evitar conflictos
Repartir por archivos. Sugerencia de reparto:
- **Programación:** `scenes/PlayScene.js` (reglas, puntaje), `systems/Traffic.js` (tráfico, dificultad), `utils/sfx.js`.
- **Arte y escenario:** `models/` (llama, vehículos, personas), `world/World.js`, `utils/Parallax.js`, `utils/textures.js`.
- **Interfaz:** `components/GameView.vue` (menú, HUD, fin), `MenuScene`/`EndScene`.
- **Documentación:** solo `docs/`. Textos del juego en `src/game/data/contenido.js`.
- **Compartido, avisar antes de tocar:** `Game.js`, `config.js`, `README.md`, `package.json`.

## Si hay conflicto
`git rebase origin/main`, resolver archivo por archivo, `git add`, `git rebase --continue`. Si hay duda, preguntar antes de forzar nada.
Nunca usar `git push --force` sobre `main`.
