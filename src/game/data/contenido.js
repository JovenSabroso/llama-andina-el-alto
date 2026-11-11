// Contenido editable del juego (textos). Se puede cambiar sin tocar la lógica.

// Infracciones que la llama debe multar.
export const INFRACCIONES = {
  celular: { emoji: '📱', label: 'Celular al volante' },
  velocidad: { emoji: '💨', label: 'Exceso de velocidad' },
  casco: { emoji: '⛑️', label: 'Moto sin casco' },
  rojo: { emoji: '🚦', label: '¡Pasó en rojo!' },
}

// Consejos de seguridad vial (pantalla de fin).
export const CONSEJOS = [
  'Cruza siempre por el paso de cebra o la pasarela, aunque tardes un poco más.',
  'El semáforo en rojo protege a quien está cruzando: espera aunque la calle parezca vacía.',
  'No uses el celular mientras conduces: unos segundos sin mirar bastan para un accidente.',
  'En moto, el casco bien abrochado protege la cabeza en caso de caída.',
  'Cede el paso a ambulancias y bomberos: llevan a alguien que necesita ayuda urgente.',
  'Respeta los límites de velocidad, sobre todo cerca de colegios y mercados.',
]

// Chistes locales para la pantalla de fin.
export const CHISTES = [
  'El chofer dijo: "¡Solo estaba cuadrando, jefe!". La llama no le creyó.',
  'El minibús prometió que "hay campito atrás"... no había.',
  'Hasta la llama sabe que el rojo es para parar.',
  'Ninguna llama fue atropellada en este juego: todas cruzaron por la pasarela.',
  'La llama escupe, pero con justicia.',
]

// Rutas de minibús (zonas reales de El Alto).
export const RUTAS = [
  'CEJA - SENKATA',
  '16 DE JULIO - RÍO SECO',
  'VILLA ADELA - CEJA',
  'ALTO LIMA - SATÉLITE',
  'RÍO SECO - CEJA',
  'SENKATA - 16 DE JULIO',
]

// Propaganda política FICTICIA (parodia). Partidos, siglas y candidatos inventados:
// no representan a ningún partido ni persona real.
export const PROPAGANDA = [
  { sigla: 'PSU', nombre: 'DON PROMESAS', lema: '¡Taparemos TODOS los baches!', bg: '#ffffff', main: '#c1121f', accent: '#1b1230' },
  { sigla: 'MAC', nombre: 'JUANCITO BACHE', lema: 'Asfalto para todos... mañana', bg: '#fcbf49', main: '#1d3f8f', accent: '#c1121f' },
  { sigla: 'FTL', nombre: 'FRENTE TRUFI LIBRE', lema: 'Parada donde tú quieras', bg: '#ffffff', main: '#2a9d4a', accent: '#1b1230' },
  { sigla: 'CHP', nombre: 'DOÑA PANCHITA', lema: '¡Chola power! Mercado limpio', bg: '#f4e1ff', main: '#7b2cbf', accent: '#d63384' },
  { sigla: 'MAP', nombre: 'MOVIMIENTO API', lema: 'Api y buñuelo gratis los lunes', bg: '#ffffff', main: '#6a1b9a', accent: '#f77f00' },
  { sigla: 'ULL', nombre: 'UNIÓN LLAMERA', lema: 'Menos promesas, más educación vial', bg: '#e8f6ff', main: '#0b7285', accent: '#c1121f' },
]

// Pasacalles (pancartas que cruzan la avenida).
export const PASACALLES = [
  '¡BIENVENIDOS A LA 16 DE JULIO!',
  'DON PROMESAS CUMPLE (A VECES)',
  'FERIA 16 DE JULIO: JUEVES Y DOMINGO',
  'JUANCITO BACHE: ¡OBRAS, NO PALABRAS!',
]

// Carteles hechos a mano junto a los baches.
export const CARTELES_BACHE = ['¡OJO BACHE!', 'BACHE DESDE 2019', 'AQUÍ PROMETIERON ASFALTO', 'CUIDADO: CRÁTER']

// Letreros de tiendas en planta baja.
export const TIENDAS = [
  'SALTEÑAS', 'POLLOS', 'INTERNET', 'FOTOCOPIAS', 'API Y BUÑUELOS',
  'CERRAJERÍA', 'PELUQUERÍA', 'TIENDA DOÑA JUANA', 'ABARROTES', 'CELULARES',
]
