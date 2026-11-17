/* Tupperwar — menús, flujo de pantallas y sesiones online. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const $ = (s, el = document) => el.querySelector(s);
  const esc = TW.esc;

  /* ---------- ajustes persistentes ---------- */
  const DEFAULTS = { sound: true, level: 'normal', name: '', hero: null, speed: 'normal', deck: 'random', tutorialDone: false, tutorial2Done: false };
  function load(key, def) { try { return Object.assign({}, def, JSON.parse(localStorage.getItem(key) || '{}')); } catch (e) { return Object.assign({}, def); } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } }
  const settings = load('tw.settings', DEFAULTS);
  const stats = load('tw.stats', { cpu: { w: 0, l: 0 }, online: { w: 0, l: 0 } });
  TW.saveSettings = (patch) => { Object.assign(settings, patch); save('tw.settings', settings); };
  TW.Sfx.setEnabled(settings.sound);
  const velParam = +new URLSearchParams(location.search).get('vel'); // ?vel=0.3 para pruebas
  const applySpeed = () => { TW.speed = velParam > 0 ? velParam : settings.speed === 'rapida' ? 0.6 : 1; };
  applySpeed();
  TW.toggleSpeed = () => { TW.saveSettings({ speed: settings.speed === 'rapida' ? 'normal' : 'rapida' }); applySpeed(); return settings.speed; };
  TW.speedName = () => (settings.speed === 'rapida' ? 'rápidas' : 'normales');
  function record(mode, r) {
    if (r === 'win') stats[mode].w++;
    else if (r === 'loss') stats[mode].l++;
    save('tw.stats', stats);
  }

  /* ---------- pantallas ---------- */
  const show = (id) => TW.UI.show(id);
  const modal = (html, cls) => TW.UI.modal(html, cls);
  const deckOK = (id) => id === 'random' || (TW.Decks.find(id) && TW.Decks.validate(TW.Decks.find(id).cards).ok);
  const selDeck = () => (deckOK(settings.deck) ? settings.deck : 'random');

  TW.showHelp = function () {
    const kws = Object.values(TW.KEYWORDS).map((k) => `<div><b>${esc(k.name)}.</b> ${esc(k.desc)}</div>`).join('');
    modal(`<h2>Cómo se juega</h2>
      <p>Cada jugador defiende su balda de la nevera con un héroe de 30 de salud. Gana quien deje al otro a 0. Si nunca has jugado a algo así, prueba el <b>tutorial</b> del menú principal: es una partida guiada de unos minutos.</p>
      <h3>Turnos y calorías</h3>
      <p>Las calorías son tu energía: empiezas con 1 y ganas una más cada turno, hasta 10. Se recargan al empezar tu turno. Cada turno robas una carta. Quien empieza segundo recibe un <b>Cupón de Descuento</b> (+1 caloría un turno).</p>
      <h3>Tipos de carta</h3>
      <p><b>Comida</b> (tuppers): esbirros que se quedan en tu balda y atacan desde el turno siguiente. <b>Trucos</b> (fichas de receta): efectos de un solo uso. <b>Utensilios</b>: armas para que tu héroe ataque.</p>
      <h3>Controles</h3>
      <p>Arrastra una carta de tu mano a la balda para jugarla. Para atacar, arrastra desde un esbirro que brille en verde hasta el objetivo (o haz clic en él y luego en el objetivo). Los trucos con objetivo muestran una flecha de kétchup. Clic derecho o Esc cancela. Pasa el ratón por encima de cualquier cosa para leerla.</p>
      <h3>Estrategia</h3>
      <p><b>Familias.</b> Muchas comidas son Verdura, Chicha, Lácteo o Guiso, y hay cartas que premian juntar las de una familia (o mezclarlas todas). Cada mazo al azar tira hacia una. <b>Vecinos.</b> Algunas cartas afectan a los esbirros de al lado, así que importa dónde sueltas cada uno, y también cómo coloca los suyos tu rival. <b>Guarnición.</b> Efecto extra si ya has jugado otra carta ese turno: brillan en dorado cuando está activa. <b>Fermenta.</b> Cartas que mejoran cada turno que aguantan en tu mano. <b>Combate.</b> Hay esbirros <i>Con hambre</i> (atacan a otros esbirros nada más salir), <i>A distancia</i> (no reciben el golpe de vuelta), con <i>Arrollar</i> (el daño que sobra va al héroe), con <i>Salpicón</i> (dañan también a los vecinos del objetivo) y con <i>Cabreo</i> (reaccionan cada vez que sobreviven a un golpe). <b>Trampas.</b> Se quedan ocultas junto a tu héroe y saltan en el turno del rival: él solo ve un «?».</p>
      <h3>Héroes y mazos</h3>
      <p>Cada héroe tiene una <b>habilidad</b> distinta que cuesta calorías y se usa una vez por turno. Los mazos tienen 30 cartas (máximo 2 copias de cada una y 1 de cada legendaria). En <b>Mis mazos</b> puedes crear los tuyos; cada uno tiene un código para recuperarlo o compartirlo.</p>
      <h3>Reglas que conviene saber</h3>
      <p>Máximo 7 esbirros en la balda y 10 cartas en la mano (si robas con la mano llena, la carta se cae al suelo). Si tu mazo se vacía, cada robo te hace daño creciente: «¡Nevera vacía!».</p>
      <h3>Palabras clave</h3><div class="kw-list">${kws}</div>`);
  };

  TW.zoomCard = (id) => zoomCard(id);
  function zoomCard(id) {
    modal(`<div class="zoom-wrap">${TW.cardHTML(id)}<div class="zoom-notes">${TW.notesHTML(id) || ''}${TW.CARDS[id].text ? '' : `<div class="flavor-note">${esc(TW.CARDS[id].flavor)}</div>`}<div class="kw-note"><b>${TW.RARITY[TW.CARDS[id].rarity].name}</b><span>${TW.TYPE_NAME[TW.CARDS[id].type]} · hasta ${TW.Decks.maxCopies(TW.CARDS[id])} ${TW.Decks.maxCopies(TW.CARDS[id]) === 1 ? 'copia' : 'copias'} por mazo</span></div></div></div>`);
  }

  /* ---------- menú principal ---------- */
  const HEADLINES = [
    'Un yogur caducado se niega a abandonar la nevera: «Yo estaba aquí antes»',
    'El Cuñado asegura que controla la barbacoa. Los bomberos lo desmienten',
    'Detenida una aceituna espía en el fondo del bote',
    'La tortilla con cebolla y la sin cebolla firman una tregua de tres minutos',
    'Doña Concha confirma que ya lo sabía',
    'Récord: la Olla de Lentejas Infinita llena su táper número 400',
    'Kevin entrega un pedido en el portal equivocado por quinta vez esta semana',
    'Michi tira un vaso al suelo. Fuentes cercanas: «Lo volverá a hacer»',
    'Un Pimiento de Padrón pica. Los otros once piden calma',
    'Se busca tupper azul con tapa verde. Responde al nombre de «el de mamá»',
    'Marisa pregunta a la mantequilla si le da alegría. La mantequilla se derrite',
    'Paco anuncia que esta ronda la paga la casa. La casa no ha sido consultada',
  ];
  const SHELVES = [['limon', 'pulpo', 'queso'], ['tortilla', 'yogur', 'croqueta'], ['chorizo', 'lentejas', 'natillas'], ['pizza', 'kiwi', 'jamon'], ['huevo', 'cebolla', 'tarta']];
  const CRISPER = ['brocoli', 'zanahoria', 'berenjena', 'guisante', 'pimiento', 'calabaza'];

  function cardOfDay() {
    const pool = TW.CARD_LIST.filter((c) => !c.token && c.text);
    const d = new Date(), k = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    return pool[(k * 2654435761 >>> 0) % pool.length].id;
  }

  function renderMenu() {
    const n = TW.CARD_LIST.filter((c) => !c.token).length;
    const shuffled = [...SHELVES].sort(() => Math.random() - 0.5).slice(0, 3);
    const crisper = [...CRISPER].sort(() => Math.random() - 0.5).slice(0, 3);
    const letters = 'TUPPERWAR'.split('');
    const colors = ['var(--ketchup)', 'var(--mustard)', 'var(--r-rara)', '#49d27a', 'var(--r-epica)', 'var(--orange)'];
    const rots = [-8, 5, -3, 7, -6, 4, -9, 3, 6];
    const line = (st) => `${st.w} ${st.w === 1 ? 'victoria' : 'victorias'} y ${st.l} ${st.l === 1 ? 'derrota' : 'derrotas'}`;
    const cod = cardOfDay();
    const heads = [...HEADLINES].sort(() => Math.random() - 0.5);
    const lidColors = ['#e23a2e', '#3f8efc', '#49d27a', '#f4b41a', '#a55eea', '#ff8a2a'];
    let k = 0;
    const tupper = (id) => `<div class="fr-tupper" style="--lidc:${lidColors[k % lidColors.length]};--i:${k++}">${TW.Art.svg(id)}</div>`;
    const doorSvg = `<svg viewBox="0 0 200 440" aria-hidden="true"><rect x="6" y="6" width="188" height="428" rx="18" fill="#f7fbfb" stroke="#2b1e3f" stroke-width="6"/>
      <rect x="20" y="22" width="160" height="396" rx="10" fill="#e6f2f4"/>
      ${[118, 248, 378].map((y) => `<rect x="16" y="${y}" width="168" height="34" rx="6" fill="#ffffff" stroke="#2b1e3f" stroke-width="5"/>`).join('')}
      <rect x="34" y="40" width="34" height="86" rx="10" fill="#e23a2e" stroke="#2b1e3f" stroke-width="5"/><rect x="42" y="26" width="18" height="18" rx="4" fill="#ffffff" stroke="#2b1e3f" stroke-width="4"/>
      <rect x="80" y="54" width="32" height="72" rx="10" fill="#f4b41a" stroke="#2b1e3f" stroke-width="5"/><path d="M90 54 L96 34 L102 54 Z" fill="#e23a2e" stroke="#2b1e3f" stroke-width="4"/>
      <path d="M124 70 L150 52 L174 70 L174 126 L124 126 Z" fill="#ffffff" stroke="#2b1e3f" stroke-width="5"/><rect x="124" y="92" width="50" height="18" fill="#3f8efc"/>
      <rect x="36" y="180" width="60" height="76" rx="8" fill="#9fe08a" stroke="#2b1e3f" stroke-width="5"/><rect x="40" y="168" width="52" height="16" rx="5" fill="#49d27a" stroke="#2b1e3f" stroke-width="4"/>
      <circle cx="140" cy="226" r="24" fill="#fff6d6" stroke="#2b1e3f" stroke-width="5"/><circle cx="132" cy="220" r="5" fill="#f4b41a"/><circle cx="148" cy="232" r="5" fill="#f4b41a"/>
      <rect x="30" y="300" width="40" height="86" rx="12" fill="#a55eea" stroke="#2b1e3f" stroke-width="5"/><rect x="84" y="316" width="40" height="70" rx="12" fill="#ff8a2a" stroke="#2b1e3f" stroke-width="5"/><rect x="138" y="306" width="34" height="80" rx="10" fill="#bfe8fb" stroke="#2b1e3f" stroke-width="5"/></svg>`;
    const tutBadge = settings.tutorialDone ? '' : '<span class="ribbon">Empieza aquí</span>';
    $('#screen-menu').innerHTML = `<div class="title-screen">
      <div class="ts-ticker" aria-label="Radio Nevera"><span class="tk-label">Radio Nevera</span>
        <div class="tk-track"><div class="tk-run">${[...heads, ...heads].map((h) => `<span>${esc(h)}</span>`).join('')}</div></div></div>
      <div class="ts-floor" aria-hidden="true"></div>
      <div class="ts-main">
        <div class="ts-stage" aria-hidden="true">
          <div class="fr-light"></div>
          <div class="fridge">
            <div class="fr-freezer">
              <div class="fr-handle top"></div>
              <button class="fr-cod" data-zoom="${cod}" tabindex="-1"><span class="cod-tape">Carta del día</span><span class="cod-magnet"></span>${TW.cardHTML(cod)}</button>
              <div class="fr-vent"></div>
            </div>
            <div class="fr-inside">
              <div class="fr-lamp"></div>
              ${shuffled.map((row) => `<div class="fr-shelf"><div class="fr-items">${row.map(tupper).join('')}</div><div class="fr-glass"></div></div>`).join('')}
              <div class="fr-crisper"><div class="fr-peek">${crisper.map((id, i) => `<span style="--i:${i}">${TW.Art.svg(id)}</span>`).join('')}</div><div class="fr-drawer"></div></div>
            </div>
            <div class="fr-door">${doorSvg}</div>
            <div class="fr-feet"><i></i><i></i></div>
          </div>
        </div>
        <div class="ts-menu">
          <h1 class="logo big" aria-label="Tupperwar">${letters.map((l, i) => `<span style="--c:${colors[i % colors.length]};--rot:${rots[i]}deg;--dy:${(i % 3) * 4 - 4}px">${l}</span>`).join('')}</h1>
          <p class="ts-tag">La guerra de la nevera</p>
          <button class="ts-cta" data-go="cpu"><span class="cta-art">${TW.Art.svg('chorizo')}</span><span class="cta-txt"><b>Jugar contra la CPU</b><small>Elige héroe y mazo, y a pelear</small></span></button>
          <div class="ts-grid">
            <button class="ts-tile t-online" data-go="online"><span class="tt-art">${TW.Art.hero('kevin')}</span><span class="tt-txt"><b>Jugar online</b><small>Reta a quien quieras con un enlace</small></span></button>
            <button class="ts-tile t-tut" data-go="tutorial">${tutBadge}<span class="tt-art">${TW.Art.hero('abuela')}</span><span class="tt-txt"><b>Tutorial</b><small>${settings.tutorialDone ? 'Dos lecciones guiadas por la Abuela Puri' : 'La Abuela Puri te enseña jugando'}</small></span></button>
            <button class="ts-tile t-decks" data-go="decks"><span class="tt-art">${TW.Art.svg('tupper')}</span><span class="tt-txt"><b>Mis mazos</b><small>Crea mazos y comparte su código</small></span></button>
            <button class="ts-tile t-coll" data-go="collection"><span class="tt-art">${TW.Art.svg('primigenio')}</span><span class="tt-txt"><b>Colección</b><small>${n} cartas y ${TW.HERO_LIST.length} héroes</small></span></button>
          </div>
          <div class="ts-foot">
            <button class="link-btn" data-go="help">Cómo se juega</button>
            <div class="ts-settings">
              <div class="seg dark" role="group" aria-label="Dificultad de la CPU"><button data-level="facil" class="${settings.level === 'facil' ? 'on' : ''}">CPU fácil</button><button data-level="normal" class="${settings.level === 'normal' ? 'on' : ''}">CPU normal</button></div>
              <button class="chip dark ${settings.sound ? 'on' : ''}" data-sound>Sonido: ${settings.sound ? 'sí' : 'no'}</button>
              <button class="chip dark" data-speed>Animaciones: ${TW.speedName()}</button>
            </div>
            <p class="ts-record">Contra la CPU: ${line(stats.cpu)}. Online: ${line(stats.online)}.</p>
          </div>
        </div>
      </div>
    </div>`;
    const sc = $('#screen-menu');
    sc.onclick = (e) => {
      TW.Sfx.unlock();
      const z = e.target.closest('[data-zoom]');
      if (z) { zoomCard(z.dataset.zoom); return; }
      const go = e.target.closest('[data-go]');
      if (go) {
        TW.Sfx.play('pop');
        const g = go.dataset.go;
        if (g === 'cpu') renderSetup();
        if (g === 'online') renderOnline();
        if (g === 'collection') renderCollection();
        if (g === 'decks') TW.DeckBuilder.openList({ onBack: renderMenu });
        if (g === 'tutorial') chooseLesson();
        if (g === 'help') TW.showHelp();
        return;
      }
      const lv = e.target.closest('[data-level]');
      if (lv) { TW.saveSettings({ level: lv.dataset.level }); renderMenu(); return; }
      if (e.target.closest('[data-speed]')) { TW.toggleSpeed(); renderMenu(); return; }
      if (e.target.closest('[data-sound]')) { TW.saveSettings({ sound: !settings.sound }); TW.Sfx.setEnabled(settings.sound); renderMenu(); }
    };
    show('menu');
  }

  /* ---------- preparar partida contra la CPU ---------- */
  const resolveHero = (h) => (!h || h === 'random' ? TW.HERO_LIST[Math.floor(Math.random() * TW.HERO_LIST.length)] : h);

  function renderSetup() {
    let sel = TW.HEROES[settings.hero] || settings.hero === 'random' ? settings.hero : 'random';
    const sc = $('#screen-heroes');
    const draw = () => {
      sc.innerHTML = `<div class="page"><div class="wrap">
        <button class="btn small white back-btn" data-back>Volver</button>
        <h2 class="page-title">Prepara la partida</h2>
        <p class="page-sub">Elige quién defiende tu nevera y con qué mazo. La CPU juega con un héroe y un mazo al azar.</p>
        <section class="setup-sec"><h3 class="sec-title">Tu héroe</h3>${TW.UI.heroPickerHTML(sel)}</section>
        <section class="setup-sec"><h3 class="sec-title">Tu mazo</h3>${TW.UI.deckChooserHTML(selDeck())}</section>
        <div class="setup-go">
          <div class="seg" role="group" aria-label="Dificultad"><button data-level="facil" class="${settings.level === 'facil' ? 'on' : ''}">CPU fácil</button><button data-level="normal" class="${settings.level === 'normal' ? 'on' : ''}">CPU normal</button></div>
          <button class="btn red big" data-start>Empezar partida</button>
        </div>
      </div></div>`;
      TW.UI.bindHeroPicker(sc, () => sel);
    };
    draw();
    sc.onclick = (e) => {
      if (e.target.closest('[data-back]')) { renderMenu(); return; }
      const h = e.target.closest('[data-hero]');
      if (h) { sel = h.dataset.hero; TW.saveSettings({ hero: sel }); TW.Sfx.play('pop'); draw(); return; }
      const d = e.target.closest('[data-deck]');
      if (d) { TW.saveSettings({ deck: d.dataset.deck }); TW.Sfx.play('pop'); draw(); return; }
      if (e.target.closest('[data-newdeck]')) { TW.DeckBuilder.openList({ onBack: renderSetup }); return; }
      const lv = e.target.closest('[data-level]');
      if (lv) { TW.saveSettings({ level: lv.dataset.level }); draw(); return; }
      if (e.target.closest('[data-start]')) startCpu(resolveHero(sel), selDeck());
    };
    show('heroes');
  }

  /* ---------- partida contra la CPU ---------- */
  let view = null;
  function startCpu(hero, deckId = 'random') {
    const others = TW.HERO_LIST.filter((h) => h !== hero);
    const oppHero = others[Math.floor(Math.random() * others.length)];
    const seed = TW.randomSeed();
    const game = new TW.Game({
      seed, heroes: [hero, oppHero],
      decks: [TW.Decks.resolve(deckId, seed ^ 0x9e3779b9), TW.Decks.random(seed ^ 0x85ebca6b)],
      ai: [false, true],
      names: [settings.name || TW.HEROES[hero].name, TW.HEROES[oppHero].name],
    });
    if (view) view.destroy();
    show('game');
    view = new TW.GameView({
      game, me: 0, mode: 'cpu', level: settings.level,
      onExit: () => { view.destroy(); view = null; renderMenu(); },
      onRematch: () => startCpu(hero, deckId),
      onResult: (r) => record('cpu', r),
    }).mount($('#stage-wrap'));
    view.start();
  }

  /* ---------- tutorial ---------- */
  let tutorial = null;
  function chooseLesson() {
    if (!settings.tutorialDone) { startTutorial('basico'); return; }
    const L = TW.Tutorial.LESSONS;
    const m = modal(`<h2>Tutorial</h2><p>Dos partidas guiadas contra la Abuela Puri. Puedes repetirlas cuando quieras.</p>
      <div class="lessons">
        <button class="lesson" data-lesson="basico"><span class="ls-art">${TW.Art.hero('toni')}</span><span><b>Lección 1: ${esc(L.basico.title)}</b><small>Calorías, atacar, Estorbo, habilidades, trampas y combos.</small>${settings.tutorialDone ? '<em>Completada</em>' : ''}</span></button>
        <button class="lesson" data-lesson="experto"><span class="ls-art">${TW.Art.hero('lola')}</span><span><b>Lección 2: ${esc(L.experto.title)}</b><small>Familias, vecinos, congelar y las mecánicas de combate.</small>${settings.tutorial2Done ? '<em>Completada</em>' : ''}</span></button>
      </div>`, 'small');
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-lesson]'); if (b) { m.close(); startTutorial(b.dataset.lesson); } });
  }
  function startTutorial(lesson = 'basico') {
    if (view) { view.destroy(); view = null; }
    show('game');
    tutorial = TW.Tutorial.start($('#stage-wrap'), {
      lesson,
      onExit: (to) => {
        tutorial = null;
        if (to === 'cpu') renderSetup();
        else if (to === 'decks') TW.DeckBuilder.openList({ onBack: renderMenu });
        else if (to.startsWith('lesson:')) startTutorial(to.slice(7));
        else renderMenu();
      },
    });
  }

  /* ---------- colección ---------- */
  function renderCollection() {
    const sc = $('#screen-collection');
    let cost = 'all', type = 'all', fam = 'all';
    const draw = () => {
      const list = TW.CARD_LIST.filter((c) => !c.token)
        .filter((c) => cost === 'all' || (cost === '7' ? c.cost >= 7 : c.cost === +cost))
        .filter((c) => type === 'all' || (type === 'trap' ? !!c.trap : c.type === type && !c.trap))
        .filter((c) => fam === 'all' || c.fam === fam || c.syn === fam)
        .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'es'));
      sc.innerHTML = `<div class="page"><div class="wrap">
        <button class="btn small white back-btn" data-back>Volver</button>
        <button class="btn small top-right" data-decks>Mis mazos</button>
        <h2 class="page-title">Colección</h2>
        <p class="page-sub">Toca una carta para verla en grande. Para montar tus propios mazos, ve a Mis mazos.</p>
        <div class="coll-bar">${['all', '0', '1', '2', '3', '4', '5', '6', '7'].map((c) => `<button class="chip ${cost === c ? 'on' : ''}" data-cost="${c}">${c === 'all' ? 'Todas' : c === '7' ? '7+' : c}</button>`).join('')}</div>
        <div class="coll-bar">${[['all', 'Todo'], ['minion', 'Comida'], ['spell', 'Trucos'], ['trap', 'Trampas'], ['weapon', 'Utensilios']].map(([k, l]) => `<button class="chip ${type === k ? 'on' : ''}" data-type="${k}">${l}</button>`).join('')}</div>
        <div class="coll-bar">${[['all', 'Todas las familias'], ...Object.entries(TW.FAMILIES).map(([k, f]) => [k, f.name])].map(([k, l]) => `<button class="chip ${fam === k ? 'on' : ''}" data-fam="${k}">${l}</button>`).join('')}</div>
        <div class="coll-grid">${list.map((c) => TW.cardHTML(c.id)).join('') || '<p>No hay cartas con ese filtro.</p>'}</div>
      </div></div>`;
    };
    draw();
    sc.onclick = (e) => {
      if (e.target.closest('[data-back]')) { renderMenu(); return; }
      if (e.target.closest('[data-decks]')) { TW.DeckBuilder.openList({ onBack: renderMenu }); return; }
      const c = e.target.closest('[data-cost]');
      if (c) { cost = c.dataset.cost; draw(); return; }
      const f = e.target.closest('[data-fam]');
      if (f) { fam = f.dataset.fam; draw(); return; }
      const t = e.target.closest('[data-type]');
      if (t) { type = t.dataset.type; draw(); return; }
      const card = e.target.closest('.card[data-card]');
      if (card) zoomCard(card.dataset.card);
    };
    show('collection');
    sc.scrollTop = 0;
  }

  /* =========================================================
     ONLINE
     ========================================================= */
  class OnlineSession {
    constructor() {
      this.conn = null; this.room = null; this.view = null; this.config = null;
      this.role = null; this.code = null; this.nextN = 0; this.lastMsg = Date.now();
      this.wantRematch = false; this.oppRematch = false; this.pendingMull = null;
      this.closed = false; this.retries = 0;
      this.hb = setInterval(() => this.heartbeat(), 4000);
    }
    send(m) { if (this.conn) this.conn.send(m); }

    async host(me, ui) {
      this.role = 'host'; this.me = me; this.ui = ui;
      this.room = await TW.Net.createRoom({
        onConnection: (c) => this.attach(c),
        onError: (e) => { if (!this.view) ui.error(TW.Net.errorText(e)); },
      });
      this.code = this.room.code;
      return this.code;
    }

    attach(c) {
      c.onMessage((m) => { if (this.conn === c || m.k === 'hello') this.onMsg(m, c); });
      c.onClose(() => { if (this.conn === c) this.lost(); });
    }

    async join(code, me, ui) {
      this.role = 'guest'; this.me = me; this.code = code; this.ui = ui;
      const c = await TW.Net.joinRoom(code);
      this.conn = c;
      this.attach(c);
      let resume = null;
      try { resume = sessionStorage.getItem('tw.resume.' + code); } catch (e) { /* nada */ }
      c.send({ k: 'hello', v: TW.Net.VERSION, name: me.name, hero: me.hero, deck: me.deck, resume });
    }

    onMsg(m, c) {
      this.lastMsg = Date.now();
      switch (m.k) {
        case 'ping': return;
        case 'hello': return this.onHello(m, c);
        case 'start':
          try { sessionStorage.setItem('tw.resume.' + this.code, m.config.gameId); } catch (e) { /* nada */ }
          return this.launch(m.config, 1);
        case 'resume':
          try { sessionStorage.setItem('tw.resume.' + this.code, m.config.gameId); } catch (e) { /* nada */ }
          return this.launch(m.config, 1, m.log, m.mull);
        case 'full': return this.ui && this.ui.error('Esa partida ya tiene dos jugadores.');
        case 'error': return this.ui && this.ui.error(m.msg);
        case 'mull':
          if (this.view) this.view.receiveMull(m.uids); else this.pendingMull = m.uids;
          return;
        case 'act': return this.onAct(m);
        case 'concede': if (this.view) this.view.receiveRemote({ type: 'concede', p: this.view.opp }); return;
        case 'emote': if (this.view) this.view.emote(this.view.opp, String(m.text).slice(0, 40), false); return;
        case 'sync': if (this.role === 'host') this.sendResume(); return;
        case 'rematch':
          this.oppRematch = true;
          if (this.view) this.view.rematchOffered();
          if (this.role === 'host' && this.wantRematch) this.newGame();
          return;
        case 'bye':
          if (this.view) {
            this.view.setNet('bad', 'Tu rival se ha ido');
            if (!this.view.g.s.over) this.view.receiveRemote({ type: 'concede', p: this.view.opp });
          }
          this.conn = null;
          return;
        default: return;
      }
    }

    onHello(m, c) {
      if (this.role !== 'host') return;
      if (m.v !== TW.Net.VERSION) { c.send({ k: 'error', msg: 'Tenéis versiones distintas del juego. Recargad la página los dos.' }); return; }
      if (!this.config) {
        this.conn = c;
        const deck = Array.isArray(m.deck) && TW.Decks.validate(m.deck).ok ? m.deck : null;
        this.opp = { name: String(m.name || '').slice(0, 20), hero: TW.HEROES[m.hero] ? m.hero : resolveHero('random'), deck };
        this.newGame();
      } else if (m.resume && m.resume === this.config.gameId) {
        this.conn = c;
        this.sendResume();
        if (this.view) this.view.setNet('ok', 'Conectado');
      } else {
        c.send({ k: 'full' });
      }
    }

    newGame() {
      const seed = TW.randomSeed();
      const heroes = [this.me.hero, this.opp.hero];
      const config = {
        gameId: Math.random().toString(36).slice(2, 10), seed, heroes,
        names: [this.me.name || TW.HEROES[heroes[0]].name, this.opp.name || TW.HEROES[heroes[1]].name],
        decks: [this.me.deck ? TW.Decks.sort(this.me.deck) : TW.Decks.random(seed ^ 0x9e3779b9), this.opp.deck ? TW.Decks.sort(this.opp.deck) : TW.Decks.random(seed ^ 0x85ebca6b)],
        first: seed % 2,
      };
      this.send({ k: 'start', config });
      this.launch(config, 0);
    }

    sendResume() {
      if (!this.view || !this.config) return;
      const v = this.view;
      const mullPending = v.g.s.phase === 'mulligan' && v.myMull !== null ? v.myMull : null;
      this.send({ k: 'resume', config: this.config, log: v.log, mull: mullPending });
    }

    launch(config, me, log, mull) {
      if (this.view) this.view.destroy();
      this.config = config;
      this.wantRematch = false; this.oppRematch = false; this.nextN = (log || []).length;
      const game = new TW.Game({ seed: config.seed, heroes: config.heroes, decks: config.decks, first: config.first, names: config.names, ai: [false, false] });
      for (const a of log || []) game.apply(a);
      game.flush();
      show('game');
      const v = (this.view = new TW.GameView({
        game, me, mode: 'online', log: log || [],
        onExit: () => this.leave(),
        sendAct: (a, n, fp) => { this.nextN = n + 1; this.send({ k: 'act', n, a, fp }); },
        sendMull: (uids) => this.send({ k: 'mull', uids }),
        sendConcede: () => this.send({ k: 'concede' }),
        sendEmote: (text) => this.send({ k: 'emote', text }),
        sendRematch: () => {
          this.wantRematch = true;
          this.send({ k: 'rematch' });
          if (this.role === 'host' && this.oppRematch) this.newGame();
        },
        onResult: (r) => record('online', r),
        onLog: () => {},
      }).mount($('#stage-wrap')));
      if (mull) v.receiveMull(mull);
      if (this.pendingMull) { v.receiveMull(this.pendingMull); this.pendingMull = null; }
      v.start();
    }

    onAct(m) {
      const v = this.view;
      if (!v) return;
      // Número de jugadas conocidas: las aplicadas o las ya recibidas y en cola
      const expected = Math.max(this.nextN, v.log.length);
      if (m.n !== expected) { console.warn('Secuencia inesperada', m.n, expected); return this.desync(); }
      this.nextN = m.n + 1;
      v.receiveRemote(m.a).then(() => {
        if (this.view !== v) return;
        if (m.fp && v.g.fingerprint() !== m.fp && !v.g.s.over) { console.warn('Huella distinta tras', m.a); this.desync(); }
      });
    }

    desync() {
      if (this.role === 'host') this.sendResume();
      else this.send({ k: 'sync' });
    }

    heartbeat() {
      if (this.closed) return;
      if (this.conn) this.send({ k: 'ping' });
      if (this.conn && this.view && Date.now() - this.lastMsg > 15000) this.lost();
    }

    lost() {
      if (this.closed) return;
      const v = this.view;
      this.conn = null;
      if (!v) { this.ui && this.ui.error('Se ha perdido la conexión.'); return; }
      if (this.role === 'host') { v.setNet('wait', 'Esperando a que vuelva tu rival...'); return; }
      v.setNet('wait', 'Reconectando...');
      this.reconnect();
    }

    async reconnect() {
      if (this.closed || this.conn) return;
      if (this.retries++ > 20) { this.view && this.view.setNet('bad', 'Sin conexión'); return; }
      try {
        await this.join(this.code, this.me, this.ui);
        this.retries = 0;
        this.lastMsg = Date.now();
        this.view && this.view.setNet('ok', 'Conectado');
      } catch (e) {
        setTimeout(() => this.reconnect(), 3000);
      }
    }

    leave() {
      this.closed = true;
      clearInterval(this.hb);
      try { this.send({ k: 'bye' }); } catch (e) { /* nada */ }
      setTimeout(() => {
        try { this.conn && this.conn.close(); } catch (e) { /* nada */ }
        try { this.room && this.room.close(); } catch (e) { /* nada */ }
      }, 200);
      if (this.view) { this.view.destroy(); this.view = null; }
      try { sessionStorage.removeItem('tw.resume.' + this.code); } catch (e) { /* nada */ }
      const u = new URL(location.href);
      u.searchParams.delete('sala');
      history.replaceState(null, '', u);
      session = null;
      renderMenu();
    }
  }

  let session = null;
  function inviteURL(code) {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('sala', code);
    const q = new URLSearchParams(location.search);
    for (const k of ['transporte', 'peerhost', 'peerport', 'peerpath', 'peersecure', 'vel']) if (q.get(k)) u.searchParams.set(k, q.get(k));
    return u.toString();
  }

  function renderOnline(joinCode) {
    const sc = $('#screen-online');
    let hero = TW.HEROES[settings.hero] ? settings.hero : 'random';
    const nameVal = () => ($('#on-name') ? $('#on-name').value.trim().slice(0, 20) : settings.name);
    const me = () => { const id = selDeck(); return { name: nameVal(), hero: resolveHero(hero), deck: id === 'random' ? null : TW.Decks.resolve(id) }; };
    let state = joinCode ? 'join' : 'idle';
    let invite = '', status = '', err = '';

    const draw = () => {
      const heroPanel = `<div class="field"><label for="on-name">Tu nombre (opcional)</label><input id="on-name" maxlength="20" placeholder="Cómo te verá tu rival" value="${esc(settings.name)}"></div>
        <div class="field"><span>Tu héroe</span>${TW.UI.heroPickerHTML(hero)}</div>
        <div class="field"><span>Tu mazo</span>${TW.UI.deckChooserHTML(selDeck())}</div>`;
      let body = '';
      if (state === 'join' || state === 'joining') {
        body = `<div class="panel"><h2>Te han retado a una partida</h2><p>Sala <b>${esc(joinCode)}</b>. Elige con quién juegas y entra: la partida empieza en cuanto conectéis.</p>${heroPanel}
          <button class="btn red" data-join ${state === 'joining' ? 'disabled' : ''}>${state === 'joining' ? 'Conectando...' : 'Entrar en la partida'}</button>
          ${status ? `<div class="status"><span class="dot wait"></span>${esc(status)}</div>` : ''}${err ? `<p class="err">${esc(err)}</p>` : ''}</div>`;
      } else if (state === 'hosting') {
        body = `<div class="panel"><h2>Tu sala está lista</h2><p>Envía este enlace a tu rival. Al abrirlo entrará directamente en la partida.</p>
          <div class="invite"><input id="on-link" readonly value="${esc(invite)}"><button class="btn small" data-copy>Copiar enlace</button>${navigator.share ? '<button class="btn small white" data-share>Compartir</button>' : ''}</div>
          <div class="status"><span class="dot wait"></span>Esperando a tu rival...</div>${err ? `<p class="err">${esc(err)}</p>` : ''}
          <p style="margin-top:16px"><button class="btn small white" data-cancel>Cancelar sala</button></p></div>`;
      } else {
        body = `<div class="panel"><h2>Crear una sala</h2><p>Se genera un enlace de invitación. Quien lo abra entra directamente en tu partida.</p>${heroPanel}
          <button class="btn red" data-host ${state === 'creating' ? 'disabled' : ''}>${state === 'creating' ? 'Creando sala...' : 'Crear sala e invitar'}</button>${err ? `<p class="err">${esc(err)}</p>` : ''}</div>
          <div class="panel"><h2>¿Tienes un código?</h2><div class="invite"><input id="on-code" placeholder="Código o enlace de la sala"><button class="btn small" data-code>Unirme</button></div></div>`;
      }
      sc.innerHTML = `<div class="page"><div class="wrap">
        <button class="btn small white back-btn" data-back>Volver</button>
        <h2 class="page-title">Jugar online</h2>
        <p class="page-sub">Partida uno contra uno. Cada jugador elige su héroe y su mazo.</p>
        ${body}</div></div>`;
      TW.UI.bindHeroPicker(sc, () => hero);
    };
    const ui = {
      error: (msg) => { err = msg; if (state === 'creating' || state === 'joining') state = joinCode ? 'join' : 'idle'; if (TW.UI.current === 'online') draw(); },
    };
    draw();

    sc.onclick = async (e) => {
      if (e.target.closest('[data-back]') || e.target.closest('[data-cancel]')) {
        if (session) { session.leave(); return; }
        const u = new URL(location.href); u.searchParams.delete('sala'); history.replaceState(null, '', u);
        renderMenu(); return;
      }
      const h = e.target.closest('[data-hero]');
      if (h) { TW.saveSettings({ name: nameVal() }); hero = h.dataset.hero; TW.saveSettings({ hero }); TW.Sfx.play('pop'); draw(); return; }
      const dk = e.target.closest('[data-deck]');
      if (dk) { TW.saveSettings({ name: nameVal(), deck: dk.dataset.deck }); TW.Sfx.play('pop'); draw(); return; }
      if (e.target.closest('[data-newdeck]')) { TW.saveSettings({ name: nameVal() }); TW.DeckBuilder.openList({ onBack: () => renderOnline(joinCode) }); return; }
      if (e.target.closest('[data-host]')) {
        TW.saveSettings({ name: nameVal() });
        state = 'creating'; err = ''; draw();
        try {
          session = new OnlineSession();
          const code = await session.host(me(), ui);
          invite = inviteURL(code);
          state = 'hosting'; draw();
        } catch (x) { session = null; state = 'idle'; err = TW.Net.errorText(x); draw(); }
        return;
      }
      if (e.target.closest('[data-copy]')) {
        const inp = $('#on-link');
        try { await navigator.clipboard.writeText(inp.value); e.target.textContent = '¡Copiado!'; } catch (x) { inp.select(); document.execCommand && document.execCommand('copy'); e.target.textContent = '¡Copiado!'; }
        return;
      }
      if (e.target.closest('[data-share]')) {
        try { await navigator.share({ title: 'Tupperwar', text: '¿Te atreves con una partida de Tupperwar?', url: invite }); } catch (x) { /* cancelado */ }
        return;
      }
      if (e.target.closest('[data-code]')) {
        const raw = $('#on-code').value.trim();
        let code = raw;
        try { code = new URL(raw).searchParams.get('sala') || raw; } catch (x) { /* no era un enlace */ }
        code = TW.Net.cleanCode(code);
        if (!code) { err = 'Escribe el código de la sala.'; draw(); return; }
        joinCode = code; state = 'join'; err = ''; draw();
        return;
      }
      if (e.target.closest('[data-join]')) {
        TW.saveSettings({ name: nameVal() });
        state = 'joining'; err = ''; status = 'Conectando con la sala...'; draw();
        try {
          session = new OnlineSession();
          await session.join(joinCode, me(), ui);
          status = 'Conectado. Preparando la partida...'; draw();
        } catch (x) { session = null; state = 'join'; status = ''; err = TW.Net.errorText(x); draw(); }
      }
    };
    show('online');
  }

  /* ---------- ojos que siguen al puntero ---------- */
  let px = window.innerWidth / 2, py = window.innerHeight / 2, dirty = true;
  window.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; dirty = true; }, { passive: true });
  setInterval(() => { dirty = true; }, 400);
  (function loop() {
    if (dirty) {
      dirty = false;
      const arts = document.querySelectorAll('.screen.on svg.art, .modal svg.art');
      for (const a of arts) {
        const r = a.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > window.innerHeight) continue;
        const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / (r.width * 0.8));
        a.style.setProperty('--lx', ((dx / d) * k).toFixed(2));
        a.style.setProperty('--ly', ((dy / d) * k).toFixed(2));
      }
    }
    requestAnimationFrame(loop);
  })();

  /* ---------- arranque ---------- */
  const sala = TW.Net.cleanCode(new URLSearchParams(location.search).get('sala'));
  if (sala) renderOnline(sala);
  else renderMenu();
  TW.App = { renderMenu, renderSetup, startCpu, startTutorial, renderOnline, get view() { return view || (session && session.view) || (tutorial && tutorial.view); }, get tutorial() { return tutorial; }, get session() { return session; } };
})();
