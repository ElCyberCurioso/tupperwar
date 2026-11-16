/* Tupperwar — menús, flujo de pantallas y sesiones online. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const $ = (s, el = document) => el.querySelector(s);
  const esc = TW.esc;

  /* ---------- ajustes persistentes ---------- */
  const DEFAULTS = { sound: true, level: 'normal', name: '', hero: null, speed: 'normal' };
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
  let current = null;
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === 'screen-' + id));
    current = id;
    document.querySelector('.rotate-hint').classList.toggle('show', id === 'game');
  }

  function modal(html, cls = '') {
    const b = document.createElement('div');
    b.className = 'modal-back';
    b.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}<p style="text-align:center;margin:18px 0 0"><button class="btn small white" data-close>Cerrar</button></p></div>`;
    document.body.appendChild(b);
    const close = () => b.remove();
    b.addEventListener('click', (e) => { if (e.target === b || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    return b;
  }

  TW.showHelp = function () {
    const kws = Object.values(TW.KEYWORDS).map((k) => `<div><b>${esc(k.name)}.</b> ${esc(k.desc)}</div>`).join('');
    modal(`<h2>Cómo se juega</h2>
      <p>Cada jugador defiende su balda de la nevera con un héroe de 30 de salud. Gana quien deje al otro a 0.</p>
      <h3>Turnos y calorías</h3>
      <p>Las calorías son tu energía: empiezas con 1 y ganas una más cada turno, hasta 10. Se recargan al empezar tu turno. Cada turno robas una carta. Quien empieza segundo recibe un <b>Cupón de Descuento</b> (+1 caloría un turno).</p>
      <h3>Tipos de carta</h3>
      <p><b>Comida</b> (tuppers): esbirros que se quedan en tu balda y atacan desde el turno siguiente. <b>Trucos</b> (fichas de receta): efectos de un solo uso. <b>Utensilios</b>: armas para que tu héroe ataque.</p>
      <h3>Controles</h3>
      <p>Arrastra una carta de tu mano a la balda para jugarla. Para atacar, arrastra desde un esbirro que brille en verde hasta el objetivo (o haz clic en él y luego en el objetivo). Los trucos con objetivo muestran una flecha de kétchup. Clic derecho o Esc cancela. Pasa el ratón por encima de cualquier cosa para leerla.</p>
      <h3>Estrategia</h3>
      <p><b>Familias.</b> Muchas comidas son Verdura, Chicha, Lácteo o Guiso, y hay cartas que premian juntar las de una familia (o mezclarlas todas). Cada mazo al azar tira hacia una. <b>Vecinos.</b> Algunas cartas afectan a los esbirros de al lado, así que importa dónde sueltas cada uno, y también cómo coloca los suyos tu rival. <b>Guarnición.</b> Efecto extra si ya has jugado otra carta ese turno: brillan en dorado cuando está activa. <b>Fermenta.</b> Cartas que mejoran cada turno que aguantan en tu mano. <b>Combate.</b> Hay esbirros <i>Con hambre</i> (atacan a otros esbirros nada más salir), <i>A distancia</i> (no reciben el golpe de vuelta), con <i>Arrollar</i> (el daño que sobra va al héroe), con <i>Salpicón</i> (dañan también a los vecinos del objetivo) y con <i>Cabreo</i> (reaccionan cada vez que sobreviven a un golpe). <b>Trampas.</b> Se quedan ocultas junto a tu héroe y saltan en el turno del rival: él solo ve un «?».</p>
      <h3>Reglas que conviene saber</h3>
      <p>Máximo 7 esbirros en la balda y 10 cartas en la mano (si robas con la mano llena, la carta se cae al suelo). Si tu mazo se vacía, cada robo te hace daño creciente: «¡Nevera vacía!».</p>
      <h3>Palabras clave</h3><div class="kw-list">${kws}</div>`);
  };

  function zoomCard(id) {
    modal(`<div class="zoom-wrap">${TW.cardHTML(id)}<div class="zoom-notes">${TW.notesHTML(id) || ''}${TW.CARDS[id].text ? '' : `<div class="flavor-note">${esc(TW.CARDS[id].flavor)}</div>`}<div class="kw-note"><b>${TW.RARITY[TW.CARDS[id].rarity].name}</b><span>${TW.TYPE_NAME[TW.CARDS[id].type]} · hasta ${TW.Decks.maxCopies(TW.CARDS[id])} ${TW.Decks.maxCopies(TW.CARDS[id]) === 1 ? 'copia' : 'copias'} por mazo</span></div></div></div>`);
  }

  /* ---------- menú principal ---------- */
  function renderMenu() {
    const letters = 'TUPPERWAR'.split('');
    const colors = ['var(--ketchup)', 'var(--mustard)', 'var(--r-rara)', '#49d27a', 'var(--r-epica)', 'var(--orange)'];
    const rots = [-8, 5, -3, 7, -6, 4, -9, 3, 6];
    const peek = ['croqueta', 'pulpo', 'tortilla', 'cebolla', 'tupper', 'chorizo', 'pan', 'yogur'];
    const pick3 = peek.sort(() => Math.random() - 0.5).slice(0, 3);
    const n = TW.CARD_LIST.filter((c) => !c.token).length;
    const line = (s) => `${s.w} ${s.w === 1 ? 'victoria' : 'victorias'} y ${s.l} ${s.l === 1 ? 'derrota' : 'derrotas'}`;
    $('#screen-menu').innerHTML = `<div class="door"><div class="handle"></div><div class="wrap">
      <h1 class="logo" aria-label="Tupperwar">${letters.map((l, i) => `<span style="--c:${colors[i % colors.length]};--rot:${rots[i]}deg;--dy:${(i % 3) * 4 - 4}px">${l}</span>`).join('')}</h1>
      <span class="tagline">La guerra de la nevera</span>
      <div class="notes">
        <button class="note-btn yellow" style="--rot:-2deg" data-go="cpu"><h3>Jugar contra la CPU</h3><p>Mazos al azar y un rival con muy mala leche. Ideal para pillarle el truco.</p></button>
        <button class="note-btn pink" style="--rot:1.5deg" data-go="online"><h3>Jugar online</h3><p>Crea una sala y manda el enlace a quien quieras retar.</p></button>
        <button class="note-btn blue" style="--rot:-1deg" data-go="collection"><h3>Colección</h3><p>Las ${n} cartas, con sus palabras clave y sus chistes malos.</p></button>
        <button class="note-btn white" style="--rot:2deg" data-go="help"><h3>Cómo se juega</h3><p>Reglas, palabras clave y controles en dos minutos.</p></button>
      </div>
      <div class="menu-foot">
        <span>Dificultad de la CPU</span>
        <div class="seg" role="group" aria-label="Dificultad"><button data-level="facil" class="${settings.level === 'facil' ? 'on' : ''}">Fácil</button><button data-level="normal" class="${settings.level === 'normal' ? 'on' : ''}">Normal</button></div>
        <button class="chip ${settings.sound ? 'on' : ''}" data-sound>Sonido: ${settings.sound ? 'sí' : 'no'}</button>
        <button class="chip" data-speed>Animaciones: ${TW.speedName()}</button>
      </div>
      <div class="menu-foot"><span class="stats-line">Contra la CPU: ${line(stats.cpu)}</span><span class="stats-line">Online: ${line(stats.online)}</span></div>
    </div></div>
    <div class="peekers">${pick3.map((id) => `<div class="peeker">${TW.Art.svg(id)}</div>`).join('')}</div>`;
    const sc = $('#screen-menu');
    sc.onclick = (e) => {
      TW.Sfx.unlock();
      const go = e.target.closest('[data-go]');
      if (go) {
        TW.Sfx.play('pop');
        const g = go.dataset.go;
        if (g === 'cpu') renderHeroSelect();
        if (g === 'online') renderOnline();
        if (g === 'collection') renderCollection();
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

  /* ---------- selección de héroe ---------- */
  function heroCards(selected, compact) {
    const rot = [-2, 1.5, -1, 2, -1.5];
    return TW.HERO_LIST.map((id, i) => {
      const h = TW.HEROES[id];
      return `<button class="polaroid-btn ${selected === id ? 'on' : ''}" style="--rot:${rot[i]}deg" data-hero="${id}">
        <div class="ph">${TW.Art.hero(id)}</div><div class="nm">${esc(h.name)}</div><div class="tt">${esc(h.title)}</div>
        <div class="pw"><b>${esc(h.power.name)} (${h.power.cost})</b>${TW.fmt(h.power.text)}</div></button>`;
    }).join('') + `<button class="polaroid-btn random ${selected === 'random' ? 'on' : ''}" style="--rot:${rot[4]}deg" data-hero="random">
      <div class="ph">?</div><div class="nm">Al azar</div><div class="tt">Que decida la nevera</div><div class="pw"><b>Sorpresa</b>Un héroe cualquiera.</div></button>`;
  }
  const resolveHero = (h) => (!h || h === 'random' ? TW.HERO_LIST[Math.floor(Math.random() * TW.HERO_LIST.length)] : h);

  function renderHeroSelect() {
    let sel = settings.hero || 'random';
    const sc = $('#screen-heroes');
    const draw = () => {
      sc.innerHTML = `<div class="door"><div class="handle"></div><div class="wrap">
        <button class="btn small white back-btn" data-back>Volver</button>
        <h2 class="page-title">¿Quién defiende tu nevera?</h2>
        <p class="page-sub">Tu mazo y el de la CPU se reparten al azar. Dificultad: ${settings.level === 'facil' ? 'fácil' : 'normal'}.</p>
        <div class="heroes">${heroCards(sel)}</div>
        <div class="choose-row"><button class="btn red" data-start>Empezar partida</button></div>
      </div></div>`;
    };
    draw();
    sc.onclick = (e) => {
      if (e.target.closest('[data-back]')) { renderMenu(); return; }
      const h = e.target.closest('[data-hero]');
      if (h) { sel = h.dataset.hero; TW.saveSettings({ hero: sel }); TW.Sfx.play('pop'); draw(); return; }
      if (e.target.closest('[data-start]')) startCpu(resolveHero(sel));
    };
    show('heroes');
  }

  /* ---------- partida contra la CPU ---------- */
  let view = null;
  function startCpu(hero) {
    const others = TW.HERO_LIST.filter((h) => h !== hero);
    const oppHero = others[Math.floor(Math.random() * others.length)];
    const seed = TW.randomSeed();
    const game = new TW.Game({
      seed, heroes: [hero, oppHero],
      decks: [TW.Decks.random(seed ^ 0x9e3779b9), TW.Decks.random(seed ^ 0x85ebca6b)],
      ai: [false, true],
      names: [settings.name || TW.HEROES[hero].name, TW.HEROES[oppHero].name],
    });
    if (view) view.destroy();
    show('game');
    view = new TW.GameView({
      game, me: 0, mode: 'cpu', level: settings.level,
      onExit: () => { view.destroy(); view = null; renderMenu(); },
      onRematch: () => startCpu(hero),
      onResult: (r) => record('cpu', r),
    }).mount($('#stage-wrap'));
    view.start();
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
      sc.innerHTML = `<div class="door"><div class="handle"></div><div class="wrap">
        <button class="btn small white back-btn" data-back>Volver</button>
        <h2 class="page-title">Colección</h2>
        <p class="page-sub">De momento los mazos se reparten al azar con estas cartas. Toca una para verla en grande.</p>
        <div class="coll-bar">${['all', '0', '1', '2', '3', '4', '5', '6', '7'].map((c) => `<button class="chip ${cost === c ? 'on' : ''}" data-cost="${c}">${c === 'all' ? 'Todas' : c === '7' ? '7+' : c}</button>`).join('')}</div>
        <div class="coll-bar">${[['all', 'Todo'], ['minion', 'Comida'], ['spell', 'Trucos'], ['trap', 'Trampas'], ['weapon', 'Utensilios']].map(([k, l]) => `<button class="chip ${type === k ? 'on' : ''}" data-type="${k}">${l}</button>`).join('')}</div>
        <div class="coll-bar">${[['all', 'Todas las familias'], ...Object.entries(TW.FAMILIES).map(([k, f]) => [k, f.name])].map(([k, l]) => `<button class="chip ${fam === k ? 'on' : ''}" data-fam="${k}">${l}</button>`).join('')}</div>
        <div class="coll-grid">${list.map((c) => TW.cardHTML(c.id)).join('') || '<p>No hay cartas con ese filtro.</p>'}</div>
      </div></div>`;
    };
    draw();
    sc.onclick = (e) => {
      if (e.target.closest('[data-back]')) { renderMenu(); return; }
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
      c.send({ k: 'hello', v: TW.Net.VERSION, name: me.name, hero: me.hero, resume });
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
        this.opp = { name: String(m.name || '').slice(0, 20), hero: TW.HEROES[m.hero] ? m.hero : resolveHero('random') };
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
        decks: [TW.Decks.random(seed ^ 0x9e3779b9), TW.Decks.random(seed ^ 0x85ebca6b)],
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
    let hero = settings.hero || 'random';
    const nameVal = () => ($('#on-name') ? $('#on-name').value.trim().slice(0, 20) : settings.name);
    const me = () => ({ name: nameVal(), hero: resolveHero(hero) });
    let state = joinCode ? 'join' : 'idle';
    let invite = '', status = '', err = '';

    const draw = () => {
      const heroPanel = `<div class="field"><label for="on-name">Tu nombre (opcional)</label><input id="on-name" maxlength="20" placeholder="Cómo te verá tu rival" value="${esc(settings.name)}"></div>
        <div class="field"><span>Tu héroe</span><div class="heroes compact">${heroCards(hero, true)}</div></div>`;
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
      sc.innerHTML = `<div class="door"><div class="handle"></div><div class="wrap">
        <button class="btn small white back-btn" data-back>Volver</button>
        <h2 class="page-title">Jugar online</h2>
        <p class="page-sub">Partida uno contra uno, con mazos al azar para los dos.</p>
        ${body}</div></div>`;
    };
    const ui = {
      error: (msg) => { err = msg; if (state === 'creating' || state === 'joining') state = joinCode ? 'join' : 'idle'; if (current === 'online') draw(); },
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
      const arts = document.querySelectorAll('.screen.on svg.art');
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
  TW.App = { renderMenu, startCpu, renderOnline, get view() { return view || (session && session.view); }, get session() { return session; } };
})();
