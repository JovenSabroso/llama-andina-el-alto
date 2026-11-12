# Llama Tránsito: El Alto

Videojuego 3D con Three.js + Vue + Vite. Tarea H4_T4, Hito 4 — Programación Gráfica y Multimedia I (UNIFRANZ, sede El Alto).

Desde una pasarela peatonal de El Alto, una llama de tránsito vigila la avenida y **escupe a los conductores que infringen
las normas** (celular al volante, exceso de velocidad, moto sin casco, pasar en rojo). Quien cumple la norma debe pasar sin
multa, y a la ambulancia no se le escupe.

## Eje de innovación social
**Seguridad vial y prevención de accidentes** (salud pública). _Pendiente de confirmar con el docente, porque no figura
entre los 5 ejes del Anexo A._ Plan B: eje 4, alfabetización digital.

- **Problema:** el tránsito caótico de El Alto (minibuses, cruces sin respeto al peatón, motos sin casco).
- **Público:** jóvenes y futuros conductores de El Alto.
- **Mecánica con propósito:** el jugador tiene que *reconocer* la infracción para multar; multar a quien cumple resta
  puntos. Al final se muestra el **% de infracciones detectadas** (impacto medible) y un consejo de seguridad vial.

## Instalación y ejecución
Requiere Node.js 18+.

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # build de producción en dist/
npm run preview   # sirve el build
```
Para pruebas: `?scene=play` o `?scene=end` en la URL abre esa escena directamente, y `?debug` expone `window.__game`.

## Controles
| Acción | Teclado | Táctil |
|---|---|---|
| Cambiar de carril | ← → o A D | Deslizar o botones ◀ ▶ |
| Escupir / empezar | Espacio, ↑, W, Enter | Tocar la pantalla o 💦 |
| Cholita Inspectora (cuando la barra está llena) | E | Botón 👒 |
| Pausa | P o Esc | ⏸ |

**Recargar (F5) no reinicia:** el juego guarda su estado en `sessionStorage` cada 0,5 s y al salir de la página
(`utils/session.js`); al recargar continúa en la misma escena, con el mismo puntaje, vidas, carril, semáforo y vehículos.
Cerrar la pestaña sí empieza de cero.

## Reglas
| Situación | Resultado |
|---|---|
| Multar a un infractor | +100 (+20 por racha) y carga la barra de la Cholita |
| Multar a quien cumple | −50 |
| Escupir a una ambulancia | −150 |
| Un infractor pasa bajo la pasarela | −1 vida (3 vidas) |
| Cholita Inspectora | Frena el tráfico y multa a todos los infractores visibles |
| Baches | Los vehículos que caen en uno saltan y frenan (y cambia el momento del impacto del escupitajo) |

## Estructura
```
src/
  main.js, App.vue          Arranque de Vue
  components/GameView.vue   Monta el juego, HUD, menú, fin, créditos; comunicación Vue <-> juego; limpieza
  assets/img/               Foto del Illimani y texturas (ver créditos)
  game/
    Game.js                 Renderer, cámara, bucle, resize, cambio de escenas, comandos
    config.js               Constantes del mundo (carriles, semáforo, pasarela)
    assets.js               Carga de imágenes (fase preload) con caché
    scenes/                 BaseScene (preload/create/update), MenuScene, PlayScene, EndScene
    world/World.js          Avenida, cebra, semáforo, pasarela, casas, teleférico, luces y niebla
    systems/Traffic.js      Vehículos, frenado, colas, infracciones y peatones
    models/                 Llama, vehículos (auto, trufi, minibús, moto, ambulancia), personas y cholitas
    utils/                  Parallax, texturas por código, input, sonidos, almacenamiento, emisor de eventos
    data/contenido.js       Textos editables: infracciones, consejos, chistes, rutas y tiendas
docs/                       Enunciado de la tarea
```

## Requisitos de la tarea
| Req. | Dónde |
|---|---|
| R1 Escenas modulares | `src/game/scenes/` (menú, juego, fin) |
| R2 Interacción, física y puntaje | Escupitajo parabólico con gravedad y colisión esfera–caja (`PlayScene.js`), frenado de vehículos (`Traffic.js`), HUD |
| R3 Parallax 3D | `utils/Parallax.js`: foto del Illimani y nubes con factor de parallax, más teleférico, ciudad y pasarela en 3D real |
| R4 Escalamiento | `Game.resize()` + `ResizeObserver`, pixel ratio ≤ 2, FOV horizontal conservado en vertical |
| R5 Vue | `GameView.vue` (eventos del juego → HUD; botones → `game.command()`) |
| R6 Persistencia | `utils/storage.js` (localStorage) |
| R7 README | este archivo |

## Trabajo en equipo
Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Créditos
- Grupo: **Capa 8**. Integrantes: _completar_. Docente: Ing. Juan Gabriel Lazcano Balanza.
- Foto de fondo: ["Nevado del Illimani desde El Alto"](https://commons.wikimedia.org/wiki/File:Nevado_del_Illimani_desde_El_Alto.jpg), Qhanaaru, Wikimedia Commons, **CC0**.
- Texturas: Asphalt031 y Bricks105 de [ambientCG.com](https://ambientcg.com), **CC0**.
- Modelos 3D, sonidos (WebAudio), letreros, wiphala, aguayo, baches y propaganda: hechos con código por el grupo.
- Fotos de alcaldes (Wikimedia Commons, **CC BY 2.0**):
  ["Eliser Roca, Así Es Mi Pueblo"](https://commons.wikimedia.org/wiki/File:Eliser_Roca,_As%C3%AD_Es_Mi_Pueblo.jpg), autor: Asi Es Mi Pueblo;
  ["Mónica Eva Copa Murga (Official Photo, 2015)"](https://commons.wikimedia.org/wiki/File:M%C3%B3nica_Eva_Copa_Murga_(Official_Photo,_2015)_Alejandra_Vaca,_Chamber_of_Senators_of_Bolivia.jpg),
  autora: Alejandra Vaca, Cámara de Senadores de Bolivia. Los afiches de alcaldes reales solo muestran datos públicos
  (nombre, cargo, periodo, sigla), sin lemas inventados.
- **El resto de la propaganda política del juego es ficticia y en tono de parodia** (partidos, siglas y candidatos inventados en
  `src/game/data/contenido.js`); no representa a ningún partido ni persona real.
