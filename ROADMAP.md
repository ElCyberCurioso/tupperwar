# Tupperwar: análisis del proyecto y plan de mejora

Estado a 16 de noviembre de 2026, versión 1.2.

## 1. Análisis

### Lo que está bien resuelto

- **Arquitectura.** El motor (`engine.js`) es un estado plano, clonable y determinista, separado de la interfaz. Eso es lo que permite que la IA simule jugadas, que el online solo envíe acciones y que se puedan lanzar miles de partidas de prueba sin navegador.
- **Coste de añadir contenido.** Una carta es un objeto en `cards.js` y un dibujo en `art.js`. Las 20 cartas de la versión 1.1 no tocaron la interfaz salvo para las trampas.
- **Despliegue.** Web estática sin compilación ni dependencias externas en tiempo de ejecución (tipografías y PeerJS van dentro del repositorio).
- **Online.** Sincronización por semilla y lista de acciones, con huella de estado por jugada, reenvío del historial si hay desincronización y reconexión del invitado.

### Debilidades de jugabilidad (el motivo de este documento)

| Problema | Efecto en la partida | Estado |
|---|---|---|
| Mazos 100 % aleatorios y sin coherencia | No hay plan de juego: se juega «lo que quepa en la curva» | Mitigado en 1.1 (mazos temáticos). Falta editor |
| Cartas sin relación entre sí | Ninguna carta hace mejor a otra, así que todas las partidas se parecen | Resuelto en 1.1 (familias) |
| La posición en la balda era cosmética | Una decisión menos por jugada | Resuelto en 1.1 (vecinos) |
| El orden de las cartas en el turno daba igual | Turnos mecánicos | Resuelto en 1.1 (guarnición) |
| Siempre convenía jugar la carta cuanto antes | No había tensión entre tempo y valor | Resuelto en 1.1 (fermenta) |
| Sin información oculta más allá de la mano | No había faroles ni lectura del rival | Resuelto en 1.1 (trampas) |
| Los héroes solo se diferencian por el poder | Elegir héroe apenas cambia la partida | Pendiente (cartas de héroe) |
| Sin progresión ni objetivos entre partidas | Poca razón para volver | Pendiente |

### Debilidades técnicas

- **IA de un solo paso.** Evalúa cada acción por separado y no planifica el turno completo ni el siguiente del rival. No valora bien las trampas propias ni guarda las cartas que fermentan.
- **Equilibrio a medio afinar.** En 500 partidas de IA contra IA tras la 1.2: gana quien empieza el 58 % (margen de unos ±4 puntos), duración media de 22,4 turnos, y por héroe Michi 56 %, Toni 51 %, Abuela 49 %, Chef 44 %. Casi todas las cartas con muestra suficiente quedan entre el 36 % y el 62 % de victorias cuando se juegan; la excepción es El Yogur Primigenio (72 %), que la IA solo baja cuando ya va ganando. La ventaja de salir primero y el Chef son lo siguiente a vigilar. Las cartas más flojas en manos de la IA son las reactivas (trampas, Siesta, Vuelta al Táper), en parte porque no sabe usarlas.
- **Información oculta en online.** Cada navegador calcula la partida entera, así que mano, mazo y trampas del rival son visibles desde las herramientas de desarrollo. Aceptable entre amigos, no para juego competitivo.
- **Dependencia del servidor público de PeerJS** para el emparejamiento, y sin servidor TURN propio para redes restrictivas. El online todavía no se ha probado desplegado en GitHub Pages con ese servidor público, solo con uno local.
- **Pruebas fuera del repositorio.** Los simuladores y las pruebas de interfaz que se usaron durante el desarrollo no están versionados ni automatizados.
- **Móvil.** Solo horizontal, y las vistas previas dependen de pasar el ratón por encima.
- **Accesibilidad.** No se puede jugar con teclado y los estados (jugable, objetivo) se distinguen sobre todo por color.

## 2. Mecánicas añadidas en la versión 1.1

Cinco sistemas pensados para que haya decisiones distintas en cada partida. Son 20 cartas nuevas (72 en total).

1. **Familias** (Verdura, Chicha, Lácteo, Guiso). Cada comida muestra su familia en la carta. Hay cartas que premian concentrarse en una (Brócoli Culturista, Albóndigas en Pandilla, Morcilla de Burgos, Cartón de Leche, Huerto Urbano, Barbacoa Dominguera, Nata Montada) y una que premia mezclarlas (Cocido Completo).
2. **Vecinos.** Efectos sobre los esbirros de al lado: Mantequilla Derretida, Nachos con Todo y el Rodillo de Amasar, que castiga al rival por colocar juntas sus piezas valiosas.
3. **Guarnición.** Efecto extra si ya has jugado otra carta ese turno (Patatas Fritas, Alioli Casero, Salsa Brava). La carta brilla en dorado cuando está activa.
4. **Fermenta.** La carta gana +1/+1 cada turno que pasa en tu mano, hasta +3/+3 (Kéfir Ancestral, Queso Curado, Kombucha Rebelde). Obliga a elegir entre jugar ya o esperar.
5. **Trampas.** Trucos ocultos que saltan en el turno del rival: Cáscara de Plátano (anula un ataque a tu héroe), Nota Pasivo-Agresiva (anula un truco) y Wasabi Camuflado (3 de daño a la comida que saque). El rival solo ve un «?», así que puede intentar gastarlas con una carta barata, por ejemplo tirando el Cupón de Descuento contra una posible Nota.

Además, los **mazos aleatorios ahora son temáticos**: cada mazo tira hacia una familia y el juego lo indica en el mulligan.

## 2 bis. Cambios de la versión 1.2

- **Combate.** Cinco mecánicas nuevas: Con hambre, A distancia, Arrollar, Salpicón y Cabreo, más una cuarta trampa que salta en los combates entre esbirros (Suelo Recién Fregado).
- **13 cartas nuevas (85 en total)** enlazadas con lo que ya había: Yogurtera de los 80 acelera las cartas que fermentan, Helado de Tres Bolas y Romper el Hielo dan salida a la congelación, Recalentar en la Sartén reutiliza los Últimos bocados, Fiambrera de Acero premia tener trampas y Tapa de Bravas amplía la Guarnición.
- **Equilibrio.** Abuela Puri cura 3, El Yogur Primigenio baja a 8/8, se recortan varios Lácteos (Queso Curado, Queso Apestoso, Mantequilla) y suben Alioli, Croqueta y Tupper Misterioso.
- **Ilustraciones rehechas**: Berenjena de Gimnasio, El Yogur Primigenio, Olla de Lentejas Infinita, Limón Resentido, Chorizo Vengativo, Queso Apestoso y Microondas a Tope, con retoques en Huevo Duro, Coliflor Cerebrito y Kéfir Ancestral.
- **Animaciones.** La vista reproduce cada jugada paso a paso (golpe, daño, muertes, invocaciones y robos en orden) en lugar de saltar al estado final. Ataques con impulso, impacto y retroceso, partículas, cartel de turno, entrada pausada de la partida y velocidad configurable.

## 3. Plan de mejora

Ordenado por relación entre impacto y esfuerzo. El esfuerzo es orientativo: S (una sesión), M (dos o tres), L (más).

### Fase 1. Profundidad estratégica

| # | Mejora | Qué aporta | Esfuerzo |
|---|---|---|---|
| 1.1 | **Editor de mazos** en la Colección, con guardado local, código de mazo para compartir y selección de mazo antes de jugar (CPU y online) | Es la mayor fuente de estrategia que falta. `Decks.validate` y el guardado ya existen | M |
| 1.2 | **Modo «Hacer la compra»** (draft): eliges 1 de 3 cartas, 30 veces | Decisiones de construcción sin exigir conocer toda la colección | S |
| 1.3 | **Cartas de héroe**: 6 a 8 cartas exclusivas por héroe y un segundo poder a elegir | Que elegir héroe cambie el plan de juego | M |
| 1.4 | **Rastreador de mazo** en partida y registro de jugadas legible | Permite planificar con lo que queda por robar | S |
| 1.5 | Más cartas para las mecánicas nuevas: de 4 a 6 trampas más, legendarias de familia, más efectos de posición | Variedad dentro de cada arquetipo | M |

### Fase 2. IA y equilibrio

| # | Mejora | Qué aporta | Esfuerzo |
|---|---|---|---|
| 2.1 | Búsqueda por turno completo (beam search sobre secuencias) y comprobación de letal | Rival menos predecible y que no regala daño | M |
| 2.2 | Que la IA juegue alrededor de las trampas, guarde las cartas que fermentan y ordene la guarnición | Las mecánicas nuevas también importan contra la CPU | M |
| 2.3 | Nivel «Difícil» y personalidades (agresiva, de control) | Rejugabilidad en solitario | S |
| 2.4 | Banco de equilibrio versionado: simulación de 2.000 partidas con informe por carta y héroe, y ajuste de la ventaja de salir primero | Decisiones de equilibrio con datos | S |

### Fase 3. Modos y progresión

| # | Mejora | Qué aporta | Esfuerzo |
|---|---|---|---|
| 3.1 | **Modo «Pelea de sobras»**: reglas especiales rotativas (todo cuesta 1 menos, baldas de 4 huecos, solo una familia) | Partidas distintas sin cartas nuevas | S |
| 3.2 | **Jefes** contra la CPU con mazo y poder propios (la Suegra, el Inspector de Sanidad) | Contenido para un jugador | M |
| 3.3 | Misiones diarias, logros y desbloqueo de dorsos y héroes alternativos, todo en `localStorage` | Motivo para volver | M |
| 3.4 | Tutorial guiado de la primera partida | Entrada para quien no conoce Hearthstone | S |
| 3.5 | Estadísticas por héroe y por mazo, y repetición de partidas a partir de semilla y acciones | Aprender de las derrotas. El motor ya lo permite | S |

### Fase 4. Online

| # | Mejora | Qué aporta | Esfuerzo |
|---|---|---|---|
| 4.1 | Probar en GitHub Pages con el servidor público de PeerJS y documentar un TURN alternativo | Cerrar la única parte no verificada en producción | S |
| 4.2 | Modo espectador y chat de texto corto | Jugar en grupo | M |
| 4.3 | Reconexión también del anfitrión (guardar la partida en `sessionStorage`) | Hoy, si el anfitrión cierra la pestaña, la partida se pierde | S |
| 4.4 | Servidor árbitro opcional (Cloudflare Workers con Durable Objects) que guarde manos y mazos | Elimina la trampa por inspección del estado y permite emparejamiento público | L |

### Fase 5. Pulido

| # | Mejora | Esfuerzo |
|---|---|---|
| 5.1 | Móvil vertical y vista previa con pulsación larga | M |
| 5.2 | Juego con teclado, modo de alto contraste e indicadores que no dependan del color | M |
| 5.3 | Animaciones propias por carta legendaria, sonidos grabados en lugar de sintetizados, música y más voces | M |
| 5.4 | PWA instalable y jugable sin conexión contra la CPU | S |
| 5.5 | Pruebas en el repositorio (simulador y Playwright) y GitHub Actions que las ejecute en cada push | S |
| 5.6 | Inglés como segundo idioma (textos ya centralizados en `cards.js`) | M |

## 4. Orden recomendado

1. Editor de mazos (1.1) y rastreador (1.4): convierten las familias y las trampas en decisiones de construcción.
2. IA por turno completo (2.1, 2.2) y banco de equilibrio (2.4).
3. Prueba del online en producción (4.1) y pruebas automatizadas (5.5).
4. Cartas de héroe (1.3) y draft (1.2).
5. El resto según apetezca: jefes, misiones, móvil vertical.
