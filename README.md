# Tupperwar · La guerra de la nevera

Juego de cartas para el navegador al estilo Hearthstone, con temática absurda: la comida de la nevera se pelea por la balda. Todas las cartas tienen caricatura propia (SVG con ojos saltones que siguen al ratón), se juegan arrastrando con el ratón o con el dedo y se puede jugar contra la CPU u online contra otra persona con un enlace de invitación.

Es una web estática: sin servidor, sin compilación y sin dependencias. Funciona tal cual en GitHub Pages.

## Desplegar en GitHub Pages

1. Crea un repositorio (por ejemplo `tupperwar`) y sube **todo el contenido de esta carpeta** a la raíz de la rama `main`, incluido el archivo oculto `.nojekyll`.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
3. En un minuto estará en `https://TU-USUARIO.github.io/tupperwar/`.

Desde la terminal:

```bash
cd tupperwar
git init && git add . && git commit -m "Tupperwar"
git branch -M main
git remote add origin git@github.com:TU-USUARIO/tupperwar.git
git push -u origin main
```

Para probarlo en local basta con un servidor estático cualquiera:

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

Abrir `index.html` con doble clic también funciona para jugar contra la CPU. Para el modo online hace falta servirlo por HTTP o HTTPS.

## Modo clásico

- Cada héroe tiene 30 de salud. Gana quien deje al rival a 0.
- **Calorías** (el maná): empiezas con 1 y ganas una más por turno, hasta 10. Se recargan al empezar tu turno.
- Robas una carta por turno. Mano máxima de 10 (la que sobra «se cae al suelo») y balda máxima de 7 esbirros.
- Mulligan inicial: el primero recibe 3 cartas y el segundo 4 más un **Cupón de Descuento** (+1 caloría un turno).
- Con el mazo vacío, cada robo hace daño creciente («¡Nevera vacía!»).
- Los esbirros no atacan el turno en que salen, salvo los que tienen **Exprés**.

Tipos de carta: **Comida** (esbirros, con forma de tupper), **Trucos** (hechizos, con forma de ficha de receta) y **Utensilios** (armas para el héroe, con forma de tabla de cortar). El color de la tapa indica la rareza: gris común, azul rara, morada épica y dorada legendaria.

Palabras clave: Estorbo (provocar), Cáscara (escudo divino), Caducado (veneno), Exprés (carga), Doble ración (viento furioso), Al fondo (sigilo), Nutritivo (robo de vida), Al sacarlo (grito de batalla), Último bocado (último aliento), Congelar, Soso (silenciar), Descubre y Elige una.

### Mecánicas de estrategia (versión 1.1)

- **Familias** (Verdura, Chicha, Lácteo, Guiso): hay cartas que mejoran a las de su familia y otras que premian mezclarlas. Los mazos al azar tiran hacia una familia y el juego te dice cuál en el mulligan.
- **Vecinos**: efectos sobre los esbirros de al lado. Importa dónde sueltas cada carta.
- **Guarnición**: efecto extra si ya has jugado otra carta ese turno (la carta brilla en dorado).
- **Fermenta**: la carta gana +1/+1 cada turno que pasa en tu mano, hasta +3/+3.
- **Trampas**: trucos ocultos junto a tu héroe que saltan solos en el turno del rival. Máximo 3 y todas distintas.

### Mecánicas de combate (versión 1.2)

- **Con hambre**: puede atacar a esbirros el turno en que sale (a héroes, desde el siguiente).
- **A distancia**: no recibe el daño de vuelta cuando ataca.
- **Arrollar**: el daño que sobra al matar un esbirro se lo lleva el héroe rival.
- **Salpicón**: al atacar también daña a los vecinos del objetivo.
- **Cabreo**: efecto que se activa cada vez que el esbirro sobrevive a un golpe.

La velocidad de las animaciones se cambia en el menú principal o en la pausa (normales o rápidas).

El análisis del proyecto y el plan de mejora están en [ROADMAP.md](ROADMAP.md).

Hay 4 héroes con poder propio (2 calorías): Abuela Puri cura, Toni hace 1 de daño, Chef Gastón invoca un Microbrote 1/1 y Michi gana ataque y armadura.

### Controles

- Arrastra una carta de la mano a tu balda para jugarla. Puedes soltar el esbirro entre otros para elegir su posición.
- Para atacar, arrastra desde un esbirro que brille en verde hasta el objetivo. También vale clic en el atacante y clic en el objetivo.
- Los trucos y gritos de batalla con objetivo muestran una flecha de kétchup.
- Clic derecho o Esc cancela. Pasa el ratón por encima de cualquier cosa para ver la carta en grande y sus palabras clave.
- En móvil: toca una carta para seleccionarla y toca la balda para jugarla.

### RNG

Todo el azar sale de un generador con semilla (`js/rng.js`), así que una partida es reproducible a partir de su semilla y su lista de jugadas. Hay cartas aleatorias a propósito: el Pimiento de Padrón (unos pican y otros no), el Tupper Misterioso, la Lluvia de Garbanzos, Mirar la Nevera (Descubre) o el Tupper Ajeno.

## Modo online

1. Pulsa **Jugar online → Crear sala e invitar**.
2. Envía el enlace (`...?sala=CODIGO`) a tu rival.
3. Al abrirlo, tu rival elige héroe, pulsa **Entrar en la partida** y empieza el mulligan.

Cómo funciona por dentro:

- Los navegadores se conectan directamente por **WebRTC** usando [PeerJS](https://peerjs.com). El servidor público gratuito de PeerJS solo se usa para que los dos navegadores se encuentren. Después las jugadas viajan directamente de uno a otro. No necesitas montar nada.
- El motor es **determinista**: los dos navegadores ejecutan la misma partida con la misma semilla y solo se envían las jugadas. Cada jugada lleva una huella del estado para detectar desincronizaciones, que se corrigen solas reenviando el historial.
- Si el invitado recarga la página o pierde la conexión, vuelve a entrar en la misma partida automáticamente.
- Incluye revancha, frases rápidas («¡Hola!», «Bien jugado», «Esto huele raro»...) y un temporizador de 90 segundos por turno.

Limitaciones a tener en cuenta:

- Quien crea la sala tiene que mantener la pestaña abierta.
- Como cada navegador calcula la partida entera, alguien con conocimientos podría ver la mano del rival desde las herramientas de desarrollador. Para jugar entre amigos no es un problema. Para algo competitivo haría falta un servidor que haga de árbitro.
- En algunas redes muy cerradas (NAT simétrico de empresa) WebRTC no conecta sin un servidor TURN. PeerJS trae uno por defecto, pero si falla se puede configurar otro en `js/net.js`.
- Si algún día el servidor público de PeerJS deja de funcionar, se puede desplegar uno propio ([peerjs-server](https://github.com/peers/peerjs-server)) y usarlo con parámetros en la URL: `?peerhost=mi.servidor.com&peerport=443&peerpath=/myapp`. Los enlaces de invitación conservan esos parámetros.

Para probar el online sin internet, abre dos pestañas del mismo navegador con `?transporte=local` (usa `BroadcastChannel` en lugar de WebRTC):
`http://localhost:8000/?transporte=local`.

## Estructura

```
index.html
css/style.css        Estilos: cartas, tablero, menús
fonts/               Fredoka y Permanent Marker (incluidas, funcionan sin conexión)
js/rng.js            Generador aleatorio con semilla
js/cards.js          Cartas, héroes y palabras clave  ← aquí se añaden cartas
js/art.js            Ilustraciones SVG de cada carta y héroe
js/decks.js          Mazos aleatorios y validación de mazos
js/engine.js         Motor de reglas (estado plano, clonable y determinista)
js/ai.js             IA de la CPU (simula cada jugada y elige la mejor)
js/render.js         HTML de cartas
js/game-view.js      Tablero, arrastrar y soltar, flechas y animaciones
js/net.js            Conexión online (PeerJS / transporte local)
js/vendor/           PeerJS (MIT)
js/sfx.js            Sonidos sintetizados con WebAudio
js/main.js           Menús, colección, salas online
```

## Añadir una carta

1. En `js/cards.js`, añade un objeto a la lista. Por ejemplo:

```js
{ id: 'gazpacho', name: 'Gazpacho Fresquito', type: 'minion', cost: 3, attack: 2, health: 3, rarity: 'rara',
  kw: ['battlecry', 'freeze'], text: '**Al sacarlo:** congela a un personaje.',
  flavor: 'Se toma frío. Y se pelea frío.', quote: '¡Fresquito!',
  battlecry: { target: 'any', run: (g, c) => g.freeze(c.target) } },
```

2. En `js/art.js`, añade `A.gazpacho = () => ...` con su dibujo. Puedes usar las piezas del kit: `eyes()`, `mouth()`, `brows()`, `arm()`, `blush()`, `sweat()`...
3. Listo: aparece en la colección y en los mazos aleatorios.

Los efectos usan la API del motor: `g.damage`, `g.heal`, `g.summon`, `g.draw`, `g.freeze`, `g.buff`, `g.destroy`, `g.silence`, `g.bounce`, `g.transform`, `g.discover`, `g.addToHand`, `g.randomSplash`, `g.pick`, `g.chance`...

## Siguiente paso: mazos personalizados

La base ya está preparada:

- `TW.Decks.validate(lista)` aplica las reglas de construcción (30 cartas, máximo 2 copias y 1 por legendaria).
- `TW.Decks.loadSaved()` y `TW.Decks.saveAll()` guardan mazos en `localStorage`.
- El motor recibe los mazos como listas de ids (`new TW.Game({ decks: [[...], [...]] })`), así que un editor solo tiene que producir esa lista. En online, quien crea la sala ya envía los mazos de los dos jugadores.

## Créditos

- Código, cartas e ilustraciones: originales de este proyecto.
- Tipografías: [Fredoka](https://github.com/hafontia/Fredoka-One) (SIL Open Font License 1.1) y [Permanent Marker](https://fonts.google.com/specimen/Permanent+Marker) (Apache 2.0). Licencias en `fonts/`.
- Conexión online: [PeerJS](https://peerjs.com) 1.5.5 (MIT), incluido en `js/vendor/` y cargado solo al jugar online.
