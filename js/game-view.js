/* Tupperwar — vista de partida.
   Dibuja el tablero (escenario fijo de 1600×900 escalado a la ventana), gestiona
   arrastrar y soltar con ratón o táctil, las flechas de objetivo y las animaciones.
   El rival lo controla la IA (modo CPU) o el otro navegador (modo online). */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const W = 1600, H = 900;
  const L = {
    hero: [[800, 702], [800, 150]], // [mío, rival]
    power: [[950, 716], [950, 158]],
    weapon: [[650, 716], [650, 158]],
    traps: [[596, 716], [596, 158]],
    boardY: [538, 326],
    gap: 124,
    deck: [[1492, 646], [1492, 236]],
    handY: 886, liftY: 742, oppHandY: 2,
    mana: [[1218, 850], [1218, 34]],
  };
  // Todas las pausas pasan por aquí: TW.speed las escala (1 = normal, 0.6 = rápidas)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms * (TW.speed || 1)));
  const T = {
    lunge: 980, damage: 680, death: 780, summon: 560, draw: 520, drawOpp: 320, heal: 560, buff: 560, small: 460, say: 420,
    cast: 700, showcase: 1500, aiThink: 1200, aiBetween: 820, bannerMine: 1550, bannerOpp: 1300, introPause: 850, introLine: 1650,
  };
  const MISSILE = { garbanzo: '#e8c28a', ketchup: '#e23a2e', fuego: '#ff8a2a', acido: '#ffe75a', peste: '#8fc04a', sal: '#ffffff', bolita: '#a55eea' };
  const ICONS = {
    dr: '<svg viewBox="0 0 20 20"><path d="M5 7h10l-1.2 10H6.2Z M3.5 5.5h13 M8 3.5h4" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    trg: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="none" stroke="#2b1e3f" stroke-width="2"/><path d="M10 5.5V10l3 2" stroke="#2b1e3f" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    poi: '<svg viewBox="0 0 20 20"><path d="M10 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9Z" fill="#2b1e3f"/></svg>',
    ls: '<svg viewBox="0 0 20 20"><path d="M10 17C3 12 2 8 4 5.5 6 3 9 4 10 6.5 11 4 14 3 16 5.5 18 8 17 12 10 17Z" fill="#2b1e3f"/></svg>',
    ranged: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="none" stroke="#2b1e3f" stroke-width="2"/><path d="M10 1v5M10 14v5M1 10h5M14 10h5" stroke="#2b1e3f" stroke-width="2" stroke-linecap="round"/></svg>',
    cleave: '<svg viewBox="0 0 20 20"><path d="M3 15 8 4M8 16l5-12M13 16l4-10" stroke="#2b1e3f" stroke-width="2.4" stroke-linecap="round"/></svg>',
    trample: '<svg viewBox="0 0 20 20"><path d="M3 4l6 6-6 6M10 4l6 6-6 6" fill="none" stroke="#2b1e3f" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    enrage: '<svg viewBox="0 0 20 20"><path d="M7 3v4H3M13 3v4h4M7 17v-4H3M13 17v-4h4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const EMOTES = ['¡Hola!', 'Bien jugado', '¡Ñam!', 'Uy...', 'Esto huele raro', 'Gracias'];

  class GameView {
    /* o: { game, me, mode:'cpu'|'online', level, onExit, onRematch, sendAct, sendMull, sendEmote, sendRematch, onLog } */
    constructor(o) {
      this.o = o;
      this.g = o.game;
      this.me = o.me;
      this.opp = 1 - o.me;
      this.mode = o.mode;
      this.level = o.level || 'normal';
      this.minEls = new Map();
      this.handEls = new Map();
      this.oppHandEls = new Map();
      this.busy = false;
      this.aim = null;
      this.drag = null;
      this.sel = null;
      this.insertAt = null;
      this.hoverUid = null;
      this.myMull = null;
      this.oppMull = null;
      this.log = o.log ? [...o.log] : [];
      this.remoteChain = Promise.resolve();
      this.aiRunning = false;
      this.dead = false;
      this.timerTurn = -1;
      this.listeners = [];
      this.shown = new Map(); // estadísticas que se ven mientras se reproduce una jugada
      this.rp = null;
    }

    /* ---------- montaje ---------- */
    mount(wrap) {
      this.wrap = wrap;
      wrap.innerHTML = '<div id="stage"></div>';
      const st = (this.stage = wrap.querySelector('#stage'));
      const me = this.me, op = this.opp;
      const P = (p) => this.g.player(p);
      st.innerHTML = `
        <div class="freezer"></div><div class="fridge-side l"></div><div class="fridge-side r"></div>
        <div class="shelf top"></div><div class="shelf bot"></div><div class="crisper"></div>
        <div class="lane opp"></div><div class="lane me"></div>
        ${[me, op].map((p, k) => `
          <div class="hero ${k ? 'opp' : 'mine'}" data-uid="hero${p}" style="left:${L.hero[k][0]}px;top:${L.hero[k][1]}px">
            <div class="polaroid"><div class="ph">${TW.Art.hero(P(p).heroId)}</div><div class="pname">${TW.esc(P(p).name)}</div></div>
            <div class="magnet"></div>
            <div class="h-atk"><span></span></div><div class="h-arm"><span></span></div><div class="h-hp"><span></span></div>
          </div>
          <button class="hpower ${k ? 'opp' : 'mine'}" data-power="${p}" style="left:${L.power[k][0]}px;top:${L.power[k][1]}px" aria-label="Poder de héroe"></button>
          <div class="weapon empty" data-weapon="${p}" style="left:${L.weapon[k][0]}px;top:${L.weapon[k][1]}px"></div>
          <div class="traps" data-traps="${p}" style="left:${L.traps[k][0]}px;top:${L.traps[k][1]}px"></div>
          <div class="mana" data-mana="${p}" style="left:${L.mana[k][0]}px;top:${L.mana[k][1] - 16}px"></div>
          <div class="deck" data-deck="${p}" style="left:${L.deck[k][0]}px;top:${L.deck[k][1]}px">${TW.cardBackHTML()}${TW.cardBackHTML()}${TW.cardBackHTML()}<div class="cnt"></div></div>
        `).join('')}
        <button class="end-btn" disabled>Turno rival</button>
        <div class="timer"><i></i></div>
        <div class="history"></div>
        <div class="topbar">
          <button class="icon-btn" data-act="menu" aria-label="Menú de partida"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="#2b1e3f" stroke-width="3" stroke-linecap="round"/></svg></button>
          <button class="icon-btn" data-act="sound" aria-label="Sonido"></button>
        </div>
        ${this.mode === 'online' ? '<div class="net-badge"><span class="dot ok"></span><span class="nb-txt">Conectado</span></div>' : ''}
        <button class="btn small white emote-btn" data-act="emote">Decir algo</button>
        <div class="emote-wheel">${EMOTES.map((e) => `<button class="btn small white" data-emote="${TW.esc(e)}">${TW.esc(e)}</button>`).join('')}</div>
        <svg id="arrow" viewBox="0 0 ${W} ${H}"></svg>
        <div id="fx"></div>
        <div class="vignette"></div>
        <div class="preview"></div>
      `;
      this.endBtn = st.querySelector('.end-btn');
      this.timerEl = st.querySelector('.timer');
      this.arrowSvg = st.querySelector('#arrow');
      this.fx = st.querySelector('#fx');
      this.previewEl = st.querySelector('.preview');
      this.histEl = st.querySelector('.history');
      this.heroEl = (p) => st.querySelector(`.hero[data-uid="hero${p}"]`);
      this.powerEl = (p) => st.querySelector(`[data-power="${p}"]`);
      this.weaponEl = (p) => st.querySelector(`[data-weapon="${p}"]`);
      this.manaEl = (p) => st.querySelector(`[data-mana="${p}"]`);
      this.trapsEl = (p) => st.querySelector(`[data-traps="${p}"]`);
      this.deckEl = (p) => st.querySelector(`[data-deck="${p}"]`);
      this.laneMe = st.querySelector('.lane.me');
      this.updateSoundBtn();
      this.bind();
      this.fit();
      this.render();
      return this;
    }

    on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); this.listeners.push([target, ev, fn, opt]); }

    destroy() {
      this.dead = true;
      for (const [t, e, f, o] of this.listeners) t.removeEventListener(e, f, o);
      clearInterval(this.timerInt);
      this.wrap.innerHTML = '';
    }

    fit() {
      const w = window.innerWidth, h = window.innerHeight;
      const s = (this.scale = Math.min(w / W, h / H));
      this.stage.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`;
    }
    toStage(e) {
      const r = this.stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / this.scale, y: (e.clientY - r.top) / this.scale };
    }
    centerOf(el) {
      const r = el.getBoundingClientRect(), sr = this.stage.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - sr.left) / this.scale, y: (r.top + r.height / 2 - sr.top) / this.scale };
    }
    elFor(uid) {
      if (!uid) return null;
      if (uid.startsWith('hero')) return this.heroEl(+uid.slice(4));
      return this.minEls.get(uid) || null;
    }
    ent(uid) { return this.g.byUid(uid); }

    /* ---------- dibujo ---------- */
    render() {
      if (this.dead) return;
      const g = this.g;
      for (const p of [this.me, this.opp]) {
        this.renderHero(p); this.renderPower(p); this.renderWeapon(p); this.renderMana(p); this.renderDeck(p); this.renderTraps(p);
      }
      this.renderBoards();
      this.renderHand();
      this.renderOppHand();
      this.renderEnd();
      this.renderHistory();
      const sb = this.stage.querySelector('[data-act="sound"]');
      if (sb) sb.innerHTML = TW.Sfx.enabled ? '♪' : '<s>♪</s>';
      if (g.s.over) this.endBtn.disabled = true;
    }
    updateSoundBtn() { const sb = this.stage.querySelector('[data-act="sound"]'); if (sb) sb.innerHTML = TW.Sfx.enabled ? '♪' : '<s>♪</s>'; }

    renderHero(p) {
      const g = this.g, h = g.hero(p), el = this.heroEl(p);
      const sh = this.rp ? this.shown.get(h.uid) : null;
      const health = sh && sh.h !== undefined ? sh.h : h.health;
      const armor = sh && sh.arm !== undefined ? sh.arm : h.armor;
      const hp = el.querySelector('.h-hp');
      hp.querySelector('span').textContent = health;
      hp.classList.toggle('down', health < h.maxHealth);
      const arm = el.querySelector('.h-arm');
      arm.style.display = armor > 0 ? '' : 'none';
      arm.querySelector('span').textContent = armor;
      const atk = g.attackValue(h);
      const ae = el.querySelector('.h-atk');
      ae.style.display = atk > 0 ? '' : 'none';
      ae.querySelector('span').textContent = atk;
      el.classList.toggle('frozen', h.frozen);
      el.classList.toggle('can-attack', p === this.me && this.interactive() && g.canAttack(h));
    }

    renderPower(p) {
      const g = this.g, pl = g.player(p), el = this.powerEl(p);
      const key = pl.heroId + (pl.heroPowerUsed ? 'u' : '');
      if (el.dataset.k !== key) { el.innerHTML = TW.heroPowerHTML(pl.heroId, pl.heroPowerUsed); el.dataset.k = key; }
      const ready = p === this.me && this.interactive() && g.canHeroPower(p);
      el.classList.toggle('ready', ready);
      el.disabled = p !== this.me;
    }
    renderWeapon(p) {
      const w = this.g.player(p).weapon, el = this.weaponEl(p);
      el.classList.toggle('empty', !w);
      if (!w) { el.dataset.k = ''; el.innerHTML = ''; return; }
      if (el.dataset.k !== w.uid) {
        el.dataset.k = w.uid;
        el.innerHTML = `<div class="w-face">${TW.Art.svg(w.cardId)}</div><div class="w-atk"><span></span></div><div class="w-dur"><span></span></div>`;
        el.animate([{ transform: 'scale(0.3)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 400 });
      }
      el.querySelector('.w-atk span').textContent = w.attack;
      el.querySelector('.w-dur span').textContent = w.durability;
    }
    renderTraps(p) {
      const tr = this.g.player(p).traps, el = this.trapsEl(p), mine = p === this.me;
      const key = tr.map((t) => t.uid).join(',');
      if (el.dataset.k === key) return;
      el.dataset.k = key;
      el.innerHTML = tr.map((t) => mine
        ? `<div class="trap" data-trapcard="${t.cardId}">${TW.Art.svg(t.cardId)}</div>`
        : '<div class="trap hidden" title="Trampa oculta"><span>?</span></div>').join('');
    }
    renderMana(p) {
      const pl = this.g.player(p), el = this.manaEl(p);
      let gems = '';
      for (let i = 0; i < 10; i++) gems += `<div class="gem ${i < pl.mana ? '' : i < pl.maxMana ? 'spent' : 'locked'}"></div>`;
      const html = `<div class="mtext">${pl.mana}<small>/${pl.maxMana}</small></div><div class="gems">${gems}</div>`;
      if (el.innerHTML !== html) el.innerHTML = html;
      el.title = `${pl.mana} de ${pl.maxMana} calorías disponibles`;
    }
    renderDeck(p) {
      const n = this.g.player(p).deck.length, el = this.deckEl(p);
      el.querySelector('.cnt').textContent = n === 1 ? '1 carta' : `${n} cartas`;
      el.classList.toggle('empty', n === 0);
    }

    minionPos(p, i, count) {
      const x0 = W / 2 - ((count - 1) / 2) * L.gap;
      return { x: x0 + i * L.gap, y: L.boardY[p === this.me ? 0 : 1] };
    }

    renderBoards() {
      const g = this.g, seen = new Set(), rp = this.rp;
      for (const p of [this.me, this.opp]) {
        const board = g.board(p).filter((m) => !(rp && rp.summon.has(m.uid)));
        const gapAt = p === this.me && this.insertAt !== null ? Math.min(this.insertAt, board.length) : -1;
        const count = board.length + (gapAt >= 0 ? 1 : 0);
        let slot = 0;
        board.forEach((m, i) => {
          if (i === gapAt) slot++;
          const pos = this.minionPos(p, slot++, count);
          let el = this.minEls.get(m.uid);
          if (!el) el = this.makeMinionEl(m.uid, pos);
          this.updateMinion(el, m, p);
          el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
          seen.add(m.uid);
        });
        if (gapAt >= 0 && this.ghost) {
          const pos = this.minionPos(p, gapAt, count);
          this.ghost.style.left = pos.x + 'px'; this.ghost.style.top = pos.y + 'px';
        }
      }
      for (const [uid, el] of this.minEls) {
        if (seen.has(uid) || (rp && rp.gone.has(uid))) continue;
        this.killEl(uid, el);
      }
    }

    makeMinionEl(uid, pos) {
      const el = document.createElement('div');
      el.className = 'minion spawn';
      el.dataset.uid = uid;
      el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
      el.innerHTML = '<div class="m-body"></div><div class="m-atk"><span></span></div><div class="m-hp"><span></span></div><div class="m-icons"></div><div class="m-zzz">Zzz</div>';
      this.stage.appendChild(el);
      this.minEls.set(uid, el);
      setTimeout(() => el.classList.remove('spawn'), 700);
      setTimeout(() => { if (!this.dead) { this.ring(pos.x, pos.y + 44); this.burst(pos.x, pos.y + 50, { n: 7, color: '#d9eef0', dist: 80, size: 16, flat: true, dur: 520 }); } }, 230);
      return el;
    }

    // Esbirro que entra y muere dentro de la misma jugada: se muestra igualmente
    ghostMinion(d) {
      if (this.minEls.has(d.uid)) return;
      const n = this.g.board(d.p).length, pos = this.minionPos(d.p, n, n + 1);
      const el = this.makeMinionEl(d.uid, pos);
      el.dataset.card = d.cardId;
      el.querySelector('.m-body').innerHTML = TW.Art.svg(d.cardId);
      el.querySelector('.m-atk span').textContent = d.a;
      el.querySelector('.m-hp span').textContent = d.h;
    }

    killEl(uid, el) {
      this.minEls.delete(uid);
      if (el.dataset.bounce) { el.classList.add('bouncing'); setTimeout(() => el.remove(), 560); return; }
      el.classList.add('dying');
      const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
      setTimeout(() => { if (!this.dead) this.burst(x, y, { n: 10, color: '#d5cfe0', dist: 78, size: 24, grow: 1.5, dur: 620 }); }, 430);
      setTimeout(() => el.remove(), 820);
    }

    updateMinion(el, m, p) {
      const g = this.g, d = g.def(m.cardId);
      if (el.dataset.card !== m.cardId) {
        if (el.dataset.card) { el.classList.remove('transformed'); void el.offsetWidth; el.classList.add('transformed'); }
        el.dataset.card = m.cardId;
        el.querySelector('.m-body').innerHTML = TW.Art.svg(m.cardId);
      }
      const sh = this.rp ? this.shown.get(m.uid) : null;
      const atk = sh && sh.a !== undefined ? sh.a : m.attack, hp = sh && sh.h !== undefined ? sh.h : m.health;
      const a = el.querySelector('.m-atk'), h = el.querySelector('.m-hp');
      a.querySelector('span').textContent = atk;
      h.querySelector('span').textContent = hp;
      a.className = 'm-atk ' + (atk > m.baseAttack ? 'up' : atk < m.baseAttack ? 'down' : '');
      h.className = 'm-hp ' + (hp < m.maxHealth ? 'down' : m.maxHealth > m.baseHealth ? 'up' : '');
      const cls = el.classList;
      cls.toggle('taunt', m.taunt); cls.toggle('shield', m.divineShield); cls.toggle('frozen', m.frozen);
      cls.toggle('stealth', m.stealth); cls.toggle('silenced', m.silenced);
      cls.toggle('asleep', m.sleeping && !m.charge && !m.rush && g.s.current === p && !g.s.over);
      cls.toggle('can-attack', p === this.me && this.interactive() && g.canAttack(m));
      let icons = '';
      if (!m.silenced && d.deathrattle) icons += `<span class="m-icon dr" title="Último bocado">${ICONS.dr}</span>`;
      if (!m.silenced && (d.endOfTurn || d.startOfTurn)) icons += `<span class="m-icon trg" title="Efecto de turno">${ICONS.trg}</span>`;
      if (!m.silenced && d.onDamaged) icons += `<span class="m-icon enr" title="Cabreo">${ICONS.enrage}</span>`;
      if (m.poisonous) icons += `<span class="m-icon poi" title="Caducado">${ICONS.poi}</span>`;
      if (m.lifesteal) icons += `<span class="m-icon ls" title="Nutritivo">${ICONS.ls}</span>`;
      if (m.windfury) icons += `<span class="m-icon wf" title="Doble ración">×2</span>`;
      if (m.ranged) icons += `<span class="m-icon rng" title="A distancia">${ICONS.ranged}</span>`;
      if (m.cleave) icons += `<span class="m-icon clv" title="Salpicón">${ICONS.cleave}</span>`;
      if (m.trample) icons += `<span class="m-icon trp" title="Arrollar">${ICONS.trample}</span>`;
      const ic = el.querySelector('.m-icons');
      if (ic.innerHTML !== icons) ic.innerHTML = icons;
    }

    handLayout(n, i) {
      const spread = Math.min(108, 700 / Math.max(n, 1));
      const mid = (n - 1) / 2, k = i - mid;
      return { x: W / 2 + k * spread, y: L.handY + k * k * 2.2, r: k * 3.2 };
    }

    renderHand() {
      const g = this.g, rp = this.rp;
      const hand = g.player(this.me).hand.filter((c) => !(rp && rp.draw.has(c.uid))), n = hand.length;
      const seen = new Set();
      hand.forEach((c, i) => {
        let el = this.handEls.get(c.uid);
        if (!el) {
          el = document.createElement('div');
          el.className = 'hand-card mine';
          el.dataset.hand = c.uid;
          const [dx, dy] = L.deck[0];
          el.style.left = dx + 'px'; el.style.top = dy + 'px'; el.style.transform = 'scale(0.62) rotate(-24deg)';
          this.stage.appendChild(el);
          this.handEls.set(c.uid, el);
        }
        seen.add(c.uid);
        const cd = g.def(c.cardId), bonus = c.bonus || 0;
        if (el.dataset.b !== String(bonus)) {
          const first = el.dataset.b === undefined;
          el.dataset.b = bonus;
          el.innerHTML = TW.cardHTML(c.cardId, bonus ? { attack: cd.attack + bonus, health: cd.health + bonus } : {});
          if (first) void el.offsetWidth;
          else el.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.7) saturate(1.4)' }, { filter: 'brightness(1)' }], { duration: 700 });
        }
        const canPlay = this.interactive() && g.canPlay(this.me, c.uid);
        el.classList.toggle('playable', canPlay);
        el.classList.toggle('combo', canPlay && !!cd.garnish && g.player(this.me).playedThisTurn > 0);
        if (el.dataset.cast) return;
        if (this.drag && this.drag.uid === c.uid && this.drag.moved) return;
        if (this.aim && this.aim.cardUid === c.uid && this.aim.sc) return;
        if (this.sel === c.uid || (this.aim && this.aim.cardUid === c.uid)) {
          const lx = Math.max(150, Math.min(W - 150, this.handLayout(n, i).x));
          this.place(el, lx, L.liftY - 20, 0, 1.45, 75);
          return;
        }
        const pos = this.handLayout(n, i);
        if (this.hoverUid === c.uid && !this.drag && !this.aim) {
          const lx = Math.max(150, Math.min(W - 150, pos.x));
          this.place(el, lx, L.liftY, 0, 1.55, 70);
        } else this.place(el, pos.x, pos.y, pos.r, 1, 20 + i);
      });
      for (const [uid, el] of this.handEls) {
        if (seen.has(uid)) continue;
        this.handEls.delete(uid);
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }
    }

    place(el, x, y, r, s, z) {
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.style.transform = `rotate(${r}deg) scale(${s})`;
      el.style.zIndex = z;
    }

    renderOppHand() {
      const rp = this.rp;
      const hand = this.g.player(this.opp).hand.filter((c) => !(rp && rp.draw.has(c.uid))), n = hand.length, seen = new Set();
      hand.forEach((c, i) => {
        let el = this.oppHandEls.get(c.uid);
        if (!el) {
          el = document.createElement('div');
          el.className = 'hand-card opp';
          el.innerHTML = TW.cardBackHTML();
          const [dx, dy] = L.deck[1];
          el.style.left = dx + 'px'; el.style.top = dy + 'px';
          this.stage.appendChild(el);
          this.oppHandEls.set(c.uid, el);
          void el.offsetWidth;
        }
        seen.add(c.uid);
        const spread = Math.min(64, 560 / Math.max(n, 1)), k = i - (n - 1) / 2;
        this.place(el, W / 2 + k * spread, L.oppHandY - k * k * 1.2, 180 - k * 3, 1, 10 + i);
      });
      for (const [uid, el] of this.oppHandEls) {
        if (seen.has(uid)) continue;
        this.oppHandEls.delete(uid);
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }
    }

    hasActions() {
      const g = this.g, me = this.me, pl = g.player(me);
      if (pl.hand.some((c) => g.canPlay(me, c.uid))) return true;
      if ([pl.hero, ...pl.board].some((e) => g.canAttack(e))) return true;
      return g.canHeroPower(me);
    }
    renderEnd() {
      const g = this.g, mine = g.s.current === this.me && g.s.phase === 'play' && !g.s.over;
      this.endBtn.disabled = !mine || this.busy;
      this.endBtn.textContent = mine ? 'Cerrar la nevera' : g.s.phase === 'mulligan' ? 'Preparando...' : 'Turno rival';
      this.endBtn.classList.toggle('done', mine && !this.busy && !this.hasActions());
    }
    renderHistory() {
      const h = this.g.s.history.slice(-8).reverse();
      const key = this.g.s.history.length + ':' + h.map((x) => (x.cardId || x.heroId) + x.kind).join(',');
      if (this.histEl.dataset.k === key) return;
      this.histEl.dataset.k = key;
      this.histEl.innerHTML = h.map((x, i) => {
        const secret = x.kind === 'trapSet' && x.p !== this.me;
        const art = secret ? '<div class="q">?</div>' : x.kind === 'power' ? TW.Art.hero(x.heroId) : x.cardId ? TW.Art.svg(x.cardId) : TW.Art.hero(x.heroId);
        const tag = x.kind === 'attack' ? 'ataque' : x.kind === 'power' ? 'poder' : x.kind === 'trapSet' || x.kind === 'trap' ? 'trampa' : '';
        return `<div class="hi ${x.p === this.me ? 'p0' : 'p1'}" data-hist="${i}">${art}${tag ? `<span class="tag">${tag}</span>` : ''}</div>`;
      }).join('');
      this.histItems = h;
    }

    /* ---------- estado de interacción ---------- */
    interactive() {
      const g = this.g;
      return !this.busy && !this.overlayOpen && g.canAct(this.me);
    }

    /* ---------- eventos de entrada ---------- */
    bind() {
      const st = this.stage;
      this.on(window, 'resize', () => this.fit());
      // Evita que el foco de un botón desplace el escenario
      const unscroll = (el) => this.on(el, 'scroll', () => { if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; } });
      unscroll(this.wrap); unscroll(this.wrap.parentElement); unscroll(st);
      this.on(st, 'pointerdown', (e) => this.onDown(e));
      this.on(window, 'pointermove', (e) => this.onMove(e));
      this.on(window, 'pointerup', (e) => this.onUp(e));
      this.on(window, 'pointercancel', () => this.cancelAll());
      this.on(window, 'keydown', (e) => { if (e.key === 'Escape') this.cancelAll(); });
      this.on(st, 'contextmenu', (e) => { e.preventDefault(); this.cancelAll(); });
      this.on(st, 'pointerover', (e) => this.onOver(e));
      this.on(st, 'pointerout', (e) => this.onOut(e));
      this.on(this.endBtn, 'click', () => {
        if (!this.interactive()) return;
        this.cancelAll();
        this.perform({ type: 'end', p: this.me });
      });
      this.on(st, 'click', (e) => {
        const b = e.target.closest('[data-act]');
        if (b) {
          const a = b.dataset.act;
          if (a === 'menu') this.showMenu();
          if (a === 'sound') { TW.Sfx.setEnabled(!TW.Sfx.enabled); TW.saveSettings && TW.saveSettings({ sound: TW.Sfx.enabled }); this.updateSoundBtn(); }
          if (a === 'emote') this.stage.querySelector('.emote-wheel').classList.toggle('on');
          return;
        }
        const em = e.target.closest('[data-emote]');
        if (em) { this.stage.querySelector('.emote-wheel').classList.remove('on'); this.emote(this.me, em.dataset.emote, true); }
      });
      this.timerInt = setInterval(() => this.tickTimer(), 250);
    }

    onOver(e) {
      if (this.drag || this.aim) return;
      const hc = e.target.closest('.hand-card.mine');
      if (hc && this.hoverUid !== hc.dataset.hand) {
        this.hoverUid = hc.dataset.hand;
        this.renderHand();
        const c = this.g.player(this.me).hand.find((x) => x.uid === this.hoverUid);
        if (c) this.showNotes(c.cardId, hc);
        return;
      }
      const m = e.target.closest('.minion');
      if (m && m.dataset.uid && !m.classList.contains('dying')) { this.previewMinion(m.dataset.uid, m); return; }
      const tp = e.target.closest('[data-trapcard]');
      if (tp) { this.previewCard(tp.dataset.trapcard, tp); return; }
      const pw = e.target.closest('[data-power]');
      if (pw) { this.previewPower(+pw.dataset.power, pw); return; }
      const wp = e.target.closest('[data-weapon]');
      if (wp && !wp.classList.contains('empty')) { const w = this.g.player(+wp.dataset.weapon).weapon; if (w) this.previewCard(w.cardId, wp, { attack: w.attack, durability: w.durability }); return; }
      const hi = e.target.closest('[data-hist]');
      if (hi && this.histItems) {
        const x = this.histItems[+hi.dataset.hist];
        if (x && x.kind === 'trapSet' && x.p !== this.me) return;
        if (x && x.cardId) this.previewCard(x.cardId, hi);
        else if (x) this.previewPower(x.p, hi);
      }
    }
    onOut(e) {
      const to = e.relatedTarget;
      const hc = e.target.closest('.hand-card.mine');
      if (hc && (!to || !hc.contains(to))) {
        if (this.hoverUid === hc.dataset.hand) { this.hoverUid = null; this.renderHand(); }
        this.hidePreview();
      }
      const m = e.target.closest('.minion, [data-power], [data-weapon], [data-hist], .trap');
      if (m && (!to || !m.contains(to))) this.hidePreview();
    }

    onDown(e) {
      if (e.button === 2) return;
      TW.Sfx.unlock();
      const p = this.toStage(e);
      if (this.aim) { this.aim.downAt = p; return; }
      if (this.sel) { this.selDown = p; return; }
      if (!this.interactive()) return;
      const hc = e.target.closest('.hand-card.mine');
      if (hc) {
        e.preventDefault();
        this.drag = { uid: hc.dataset.hand, el: hc, start: p, moved: false };
        return;
      }
      const m = e.target.closest('.minion');
      const h = e.target.closest('.hero');
      const src = m || h;
      if (src) {
        const ent = this.ent(src.dataset.uid);
        if (ent && ent.owner === this.me && this.g.canAttack(ent)) {
          e.preventDefault();
          this.hidePreview();
          this.startAim({
            from: this.centerOf(src), start: p, srcUid: ent.uid,
            targets: this.g.attackTargets(ent).map((t) => t.uid),
            onPick: (t) => this.perform({ type: 'attack', p: this.me, a: ent.uid, t }),
          });
        }
        return;
      }
      const pw = e.target.closest('.hpower.mine');
      if (pw && this.g.canHeroPower(this.me)) {
        e.preventDefault();
        const spec = this.g.heroPowerSpec(this.me);
        if (!spec) { this.perform({ type: 'power', p: this.me }); return; }
        this.startAim({
          from: this.centerOf(pw), start: p, armed: false,
          targets: this.g.targetsFor(this.me, spec).map((t) => t.uid),
          onPick: (t) => this.perform({ type: 'power', p: this.me, target: t }),
        });
      }
    }

    onMove(e) {
      if (this.dead) return;
      if (!this.drag && !this.aim) return;
      const p = this.toStage(e);
      if (this.drag) {
        const d = this.drag;
        if (!d.moved && Math.hypot(p.x - d.start.x, p.y - d.start.y) > 7) {
          d.moved = true;
          this.hoverUid = null;
          this.hidePreview();
          d.el.classList.add('dragging');
          TW.Sfx.play('card');
        }
        if (d.moved) this.dragTo(p);
      }
      if (this.aim) this.aimTo(p, e);
    }

    onUp(e) {
      if (this.dead) return;
      const p = this.toStage(e);
      if (this.drag) {
        const d = this.drag;
        this.drag = null;
        if (!d.moved) { this.clickCard(d.uid); return; }
        this.dropCard(d, p, e);
        return;
      }
      if (this.aim) {
        const a = this.aim;
        const moved = a.start ? Math.hypot(p.x - a.start.x, p.y - a.start.y) > 10 : true;
        if (!a.armed && !moved) { a.armed = true; return; }
        if (!a.downAt && a.armed && !moved) return;
        const uid = this.hitUid(e);
        if (uid && a.targets.includes(uid)) { this.finishAim(uid); return; }
        this.cancelAim();
        return;
      }
      if (this.sel) {
        const uid = this.sel;
        const hc = e.target.closest('.hand-card.mine');
        if (hc && hc.dataset.hand === uid) { this.sel = null; this.renderHand(); return; }
        if (p.y < 760 && !hc) this.tryPlay(uid, p, true);
        else { this.sel = null; this.renderHand(); }
      }
    }

    hitUid(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const t = el && el.closest('[data-uid]');
      return t ? t.dataset.uid : null;
    }

    clickCard(uid) {
      if (!this.interactive()) return;
      if (!this.g.canPlay(this.me, uid)) { this.nope(uid); return; }
      const card = this.g.player(this.me).hand.find((c) => c.uid === uid);
      const d = this.g.def(card.cardId);
      if (d.type === 'spell' && this.g.targetSpec(this.me, card)) {
        const el = this.handEls.get(uid);
        this.sel = null;
        this.startAim({
          from: { x: Math.max(150, Math.min(W - 150, parseFloat(el.style.left))), y: L.liftY - 60 }, armed: true, cardUid: uid,
          targets: this.g.targetsFor(this.me, this.g.targetSpec(this.me, card)).map((t) => t.uid),
          onPick: (t) => this.perform({ type: 'play', p: this.me, uid, target: t }),
        });
        this.renderHand();
        return;
      }
      this.sel = uid;
      this.renderHand();
      this.toast(d.type === 'minion' ? 'Toca la balda para sacarlo' : 'Toca el tablero para jugarla');
    }

    nope(uid) {
      const card = this.g.player(this.me).hand.find((c) => c.uid === uid);
      TW.Sfx.play('error');
      if (!card) return;
      const d = this.g.def(card.cardId);
      const pl = this.g.player(this.me);
      let msg = 'Ahora no se puede';
      if (d.cost > pl.mana) msg = 'No tienes calorías suficientes';
      else if (d.trap) msg = pl.traps.length >= 3 ? 'Ya tienes tres trampas' : 'Esa trampa ya está preparada';
      else if (d.type === 'minion' && pl.board.length >= TW.RULES.MAX_BOARD) msg = 'La balda está llena';
      else if (d.type === 'spell' && d.spell.target) msg = 'No hay objetivos válidos';
      this.say(this.heroEl(this.me), msg, false);
    }

    dragTo(p) {
      const d = this.drag, el = d.el;
      const card = this.g.player(this.me).hand.find((c) => c.uid === d.uid);
      if (!card) return;
      const def = this.g.def(card.cardId);
      const playable = this.g.canPlay(this.me, d.uid);
      if (def.type === 'spell' && this.g.targetSpec(this.me, card) && playable && p.y < 740) {
        // Convertir el arrastre en flecha de objetivo
        this.drag = null;
        el.classList.remove('dragging');
        this.startAim({
          from: { x: 230, y: 560 }, start: { x: -999, y: -999 }, cardUid: d.uid,
          targets: this.g.targetsFor(this.me, this.g.targetSpec(this.me, card)).map((t) => t.uid),
          onPick: (t) => this.perform({ type: 'play', p: this.me, uid: d.uid, target: t }),
          showCard: card.cardId,
        });
        this.aimTo(p);
        this.renderHand();
        return;
      }
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      el.style.transform = 'rotate(0deg) scale(1)';
      if (def.type === 'minion' && playable) {
        const inLane = p.y > 420 && p.y < 760;
        const idx = inLane ? this.slotFor(p.x) : null;
        this.laneMe.classList.toggle('drop', inLane);
        if (idx !== this.insertAt) { this.insertAt = idx; this.renderBoards(); }
      }
    }

    slotFor(x) {
      const b = this.g.board(this.me);
      for (let i = 0; i < b.length; i++) {
        const el = this.minEls.get(b[i].uid);
        const cx = el ? parseFloat(el.style.left) : this.minionPos(this.me, i, b.length).x;
        if (x < cx) return i;
      }
      return b.length;
    }

    dropCard(d, p) {
      this.laneMe.classList.remove('drop');
      d.el.classList.remove('dragging');
      if (!this.g.canPlay(this.me, d.uid)) { this.nope(d.uid); this.insertAt = null; this.render(); return; }
      if (p.y > 770) { this.insertAt = null; this.render(); return; }
      this.tryPlay(d.uid, p, false);
    }

    async tryPlay(uid, p) {
      const g = this.g, me = this.me;
      this.sel = null;
      const card = g.player(me).hand.find((c) => c.uid === uid);
      if (!card || !g.canPlay(me, uid)) { this.nope(uid); this.insertAt = null; this.render(); return; }
      const d = g.def(card.cardId);
      if (d.type !== 'minion') {
        this.insertAt = null;
        const spec = g.targetSpec(me, card);
        if (spec) { this.clickCard(uid); return; }
        this.perform({ type: 'play', p: me, uid });
        return;
      }
      const pos = this.insertAt !== null ? this.insertAt : p.y > 420 && p.y < 760 ? this.slotFor(p.x) : g.board(me).length;
      this.insertAt = pos;
      let choice;
      if (d.chooseOne) {
        choice = await this.chooseOne(d);
        if (choice === null) { this.insertAt = null; this.render(); return; }
      }
      const spec = g.targetSpec(me, card);
      if (spec) {
        this.ghost = document.createElement('div');
        this.ghost.className = 'minion ghost';
        this.ghost.innerHTML = `<div class="m-body">${TW.Art.svg(d.id)}</div>`;
        this.stage.appendChild(this.ghost);
        this.renderBoards();
        const from = { x: parseFloat(this.ghost.style.left), y: parseFloat(this.ghost.style.top) };
        this.startAim({
          from, armed: true, cardUid: uid,
          targets: g.targetsFor(me, spec).map((t) => t.uid),
          onPick: (t) => this.perform({ type: 'play', p: me, uid, pos, target: t, choice }),
          onCancel: () => { this.insertAt = null; },
        });
        this.renderHand();
        return;
      }
      this.perform({ type: 'play', p: me, uid, pos, choice });
    }

    /* ---------- flecha de objetivo ---------- */
    startAim(a) {
      this.aim = Object.assign({ armed: false }, a);
      for (const uid of a.targets) { const el = this.elFor(uid); if (el) el.classList.add('targetable'); }
      if (a.showCard) {
        const sc = document.createElement('div');
        sc.className = 'showcase in';
        sc.style.left = '230px'; sc.style.top = '560px';
        sc.innerHTML = TW.cardHTML(a.showCard);
        sc.querySelector('.card').style.setProperty('--cw', '150px');
        this.stage.appendChild(sc);
        this.aim.sc = sc;
        const hel = this.handEls.get(a.cardUid);
        if (hel) hel.classList.add('aiming');
      }
      this.drawArrow(a.from, a.from);
    }
    aimTo(p, e) {
      const a = this.aim;
      let to = p;
      const uid = e ? this.hitUid(e) : null;
      for (const t of a.targets) { const el = this.elFor(t); if (el) el.classList.toggle('hovered', t === uid); }
      if (uid && a.targets.includes(uid)) { const el = this.elFor(uid); if (el) to = this.centerOf(el); }
      this.drawArrow(a.from, to, !!(uid && a.targets.includes(uid)));
    }
    drawArrow(from, to, locked) {
      const dx = to.x - from.x, dy = to.y - from.y;
      if (Math.hypot(dx, dy) < 6) { this.arrowSvg.innerHTML = ''; return; }
      const mx = (from.x + to.x) / 2 - dy * 0.15, my = (from.y + to.y) / 2 + dx * 0.15 - 40;
      const d = `M${from.x} ${from.y} Q${mx} ${my} ${to.x} ${to.y}`;
      this.arrowSvg.innerHTML = `<path class="shaft" d="${d}"/><path class="shaft-dash" d="${d}"/><circle class="reticle" cx="${to.x}" cy="${to.y}" r="${locked ? 34 : 24}"/><circle cx="${to.x}" cy="${to.y}" r="7" fill="#e23a2e"/>`;
    }
    clearAim() {
      if (!this.aim) return;
      for (const uid of this.aim.targets) { const el = this.elFor(uid); if (el) el.classList.remove('targetable', 'hovered'); }
      if (this.aim.sc) {
        this.aim.sc.remove();
        const hel = this.handEls.get(this.aim.cardUid);
        if (hel) hel.classList.remove('aiming');
      }
      this.aim = null;
      this.arrowSvg.innerHTML = '';
      if (this.ghost) { this.ghost.remove(); this.ghost = null; }
    }
    finishAim(uid) { const a = this.aim; this.clearAim(); a.onPick(uid); }
    cancelAim() {
      const a = this.aim;
      this.clearAim();
      if (a && a.onCancel) a.onCancel();
      this.insertAt = null;
      this.render();
    }
    cancelAll() {
      if (this.aim) this.cancelAim();
      if (this.drag) { this.drag.el.classList.remove('dragging'); this.drag = null; }
      this.sel = null; this.insertAt = null;
      this.laneMe && this.laneMe.classList.remove('drop');
      if (!this.dead) this.render();
    }

    /* ---------- acciones ---------- */
    applyLogged(act) {
      const ok = this.g.apply(act);
      if (ok) { this.log.push(act); this.o.onLog && this.o.onLog(act, this.log.length - 1); }
      return ok;
    }

    async perform(act) {
      if (this.busy || this.dead) return;
      this.busy = true;
      this.hidePreview();
      this.clearAim();
      this.sel = null;
      this.stage.querySelector('.emote-wheel').classList.remove('on');
      this.render();
      try {
        if (act.type === 'attack') await this.lunge(act.a, act.t);
        if (act.type === 'play') { TW.Sfx.play('play'); await this.castAnim(act.uid); }
        if (act.type === 'power') {
          const pw = this.powerEl(act.p);
          pw.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-6deg)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
          await sleep(300);
        }
        const ok = this.applyLogged(act);
        this.insertAt = null;
        if (!ok) { TW.Sfx.play('error'); return; }
        if (this.mode === 'online' && this.o.sendAct) this.o.sendAct(act, this.log.length - 1, this.g.fingerprint());
        await this.playEvents(this.g.flush());
      } finally {
        this.busy = false;
        this.insertAt = null;
        this.render();
        this.after();
      }
    }

    // Trucos, trampas y utensilios propios: la carta se enseña en grande antes de resolverse
    async castAnim(uid) {
      const card = this.g.player(this.me).hand.find((c) => c.uid === uid), el = this.handEls.get(uid);
      if (!card || !el || this.g.def(card.cardId).type === 'minion') return;
      el.dataset.cast = '1';
      el.classList.remove('dragging', 'aiming');
      el.style.opacity = '1';
      this.place(el, 330, 445, -3, 1.85, 91);
      await sleep(T.cast);
      el.animate([{ filter: 'brightness(1)', opacity: 1 }, { filter: 'brightness(2.6)', opacity: 0 }], { duration: 360, fill: 'forwards', easing: 'ease-in' });
      this.burst(330, 445, { n: 12, color: '#ffe48a', dist: 150, size: 14, dur: 600 });
      await sleep(300);
      el.style.opacity = '0';
    }

    async performRemote(act) {
      while ((this.busy || this.overlayOpen === 'mull') && !this.dead) await sleep(60);
      if (this.dead) return;
      this.busy = true;
      try {
        const g = this.g;
        if (act.type === 'play') {
          const card = g.player(act.p).hand.find((c) => c.uid === act.uid);
          if (card) await this.showcase(card.cardId, act.target, act.choice, !!TW.CARDS[card.cardId].trap);
        } else if (act.type === 'attack') {
          await this.flashArrow(this.centerOf(this.elFor(act.a) || this.heroEl(act.p)), act.t, 520);
          await this.lunge(act.a, act.t);
        } else if (act.type === 'power') {
          const pw = this.powerEl(act.p);
          pw.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-6deg)' }, { transform: 'scale(1)' }], { duration: 700, easing: 'ease-out' });
          if (act.target) await this.flashArrow(this.centerOf(pw), act.target, 750);
          else await sleep(600);
        } else if (act.type === 'end') {
          await sleep(T.small);
        }
        const ok = this.applyLogged(act);
        if (!ok) { console.warn('Acción remota rechazada', act); this.o.onDesync && this.o.onDesync(act); return; }
        await this.playEvents(g.flush());
      } finally {
        this.busy = false;
        this.render();
        this.after();
      }
    }

    receiveRemote(act) {
      this.remoteChain = this.remoteChain.then(() => this.performRemote(act)).catch((e) => console.error(e));
      return this.remoteChain;
    }

    after() {
      const g = this.g;
      if (this.dead || g.s.over) return;
      if (g.s.pending && g.s.pending.p === this.me && !this.overlayOpen) this.showDiscover();
      if (this.mode === 'cpu' && g.s.current === this.opp && g.s.phase === 'play' && !this.aiRunning) this.runAI();
    }

    async runAI() {
      this.aiRunning = true;
      try {
        await sleep(T.aiThink);
        let n = 0;
        while (!this.dead && !this.g.s.over && this.g.s.current === this.opp && n++ < 40) {
          await sleep(40);
          const act = TW.AI.chooseAction(this.g, this.opp, this.level);
          if (!act) break;
          await this.performRemote(act);
          await sleep(T.aiBetween);
        }
        if (!this.dead && !this.g.s.over && this.g.s.current === this.opp) await this.performRemote({ type: 'end', p: this.opp });
      } finally { this.aiRunning = false; }
    }

    /* ---------- animaciones ---------- */
    // Ataque: toma impulso, embiste, se queda un instante en el impacto y vuelve
    async lunge(aUid, tUid) {
      const a = this.elFor(aUid), t = this.elFor(tUid);
      if (!a || !t) return;
      const A = this.centerOf(a), B = this.centerOf(t);
      const len = Math.hypot(B.x - A.x, B.y - A.y) || 1, reach = Math.max(0, len - 88) / len;
      const dx = (B.x - A.x) * reach, dy = (B.y - A.y) * reach, ux = (B.x - A.x) / len, uy = (B.y - A.y) / len;
      const dur = T.lunge * (TW.speed || 1), tilt = ux * 9;
      a.style.zIndex = 60;
      a.classList.add('attacking');
      const an = a.animate([
        { transform: 'translate(0,0) scale(1) rotate(0deg)', easing: 'cubic-bezier(.3,0,.3,1)' },
        { transform: `translate(${-ux * 34}px, ${-uy * 34}px) scale(1.16) rotate(${-tilt}deg)`, offset: 0.34, easing: 'cubic-bezier(.7,0,.9,.4)' },
        { transform: `translate(${dx}px, ${dy}px) scale(1.1) rotate(${tilt}deg)`, offset: 0.5 },
        { transform: `translate(${dx - ux * 10}px, ${dy - uy * 10}px) scale(1.04) rotate(0deg)`, offset: 0.62, easing: 'cubic-bezier(.3,0,.2,1)' },
        { transform: 'translate(0,0) scale(1) rotate(0deg)' },
      ], { duration: dur });
      an.onfinish = () => { a.style.zIndex = ''; a.classList.remove('attacking'); };
      await new Promise((r) => setTimeout(r, dur * 0.5));
      TW.Sfx.play('hit');
      this.impact(B.x - ux * 46, B.y - uy * 46);
      t.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${ux * 22}px, ${uy * 22}px) scale(0.94)` }, { transform: 'translate(0,0)' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.3,1)' });
      this.shakeStage(tUid.startsWith('hero') ? 9 : 5);
      await new Promise((r) => setTimeout(r, dur * 0.16));
    }
    shakeStage(amp = 5) {
      this.stage.animate([{ translate: '0 0' }, { translate: `${-amp}px ${amp * 0.6}px` }, { translate: `${amp * 0.8}px ${-amp * 0.5}px` }, { translate: `${-amp * 0.4}px ${amp * 0.3}px` }, { translate: '0 0' }], { duration: 320 });
    }

    /* Partículas y destellos */
    burst(x, y, o = {}) {
      const n = o.n || 8;
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'spark';
        const ang = (i / n) * Math.PI * 2 + Math.random() * 0.7, dist = (o.dist || 70) * (0.55 + Math.random() * 0.6), sz = (o.size || 12) * (0.6 + Math.random() * 0.8);
        d.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${o.color || '#ffd23f'}`;
        this.fx.appendChild(d);
        const ex = Math.cos(ang) * dist, ey = o.up ? -Math.abs(Math.sin(ang)) * dist - 24 : o.flat ? Math.sin(ang) * dist * 0.25 : Math.sin(ang) * dist;
        d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${ex}px), calc(-50% + ${ey}px)) scale(${o.grow || 0.15})`, opacity: 0 }],
          { duration: o.dur || 540, easing: 'cubic-bezier(.15,.7,.3,1)' }).onfinish = () => d.remove();
      }
    }
    impact(x, y) {
      const d = document.createElement('div');
      d.className = 'impact';
      d.style.left = x + 'px'; d.style.top = y + 'px';
      this.fx.appendChild(d);
      setTimeout(() => d.remove(), 420);
      this.burst(x, y, { n: 9, color: '#fff3b0', dist: 95, size: 13, dur: 460 });
    }
    ring(x, y) {
      const d = document.createElement('div');
      d.className = 'ring';
      d.style.left = x + 'px'; d.style.top = y + 'px';
      this.fx.appendChild(d);
      setTimeout(() => d.remove(), 620);
    }
    hurt() {
      const v = this.stage.querySelector('.vignette');
      v.classList.remove('on'); void v.offsetWidth; v.classList.add('on');
    }
    flash(uid, cls) {
      const el = this.elFor(uid);
      if (!el) return null;
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 900);
      return this.centerOf(el);
    }
    hitFx(uid, n) {
      const c = this.flash(uid, 'hit');
      if (!c) return;
      this.pop(uid, 'dmg', '-' + n, n);
      this.burst(c.x, c.y, { n: 6 + Math.min(n, 6), color: '#e23a2e', dist: 62 + n * 7, size: 11 });
      if (uid.startsWith('hero')) this.shakeStage(Math.min(11, 4 + n));
    }
    healFx(uid, n) {
      const c = this.flash(uid, 'healed');
      if (!c) return;
      this.pop(uid, 'heal', '+' + n, n);
      this.burst(c.x, c.y + 20, { n: 8, color: '#7dea9c', dist: 70, size: 12, up: true, dur: 800 });
    }
    buffFx(uid, text) {
      const c = this.flash(uid, 'buffed');
      if (!c) return;
      this.pop(uid, 'txt', text);
      this.burst(c.x, c.y + 30, { n: 8, color: '#ffd23f', dist: 76, size: 11, up: true, dur: 800 });
    }

    async showcase(cardId, targetUid, choice, hidden) {
      const sc = document.createElement('div');
      sc.className = 'showcase in';
      sc.innerHTML = hidden ? `${TW.cardBackHTML()}<div class="trap-title">Trampa oculta</div>` : TW.cardHTML(cardId);
      const d = TW.CARDS[cardId];
      if (!hidden && d.chooseOne && (choice === 0 || choice === 1)) {
        const opt = d.chooseOne[choice];
        sc.querySelector('.c-text').innerHTML = `<p><b>${TW.esc(opt.name)}:</b> ${TW.fmt(opt.text)}</p>`;
      }
      this.stage.appendChild(sc);
      TW.Sfx.play('play');
      await sleep(T.showcase);
      if (targetUid) await this.flashArrow({ x: 330, y: 445 }, targetUid, 800);
      sc.classList.remove('in'); sc.classList.add('out');
      setTimeout(() => sc.remove(), 320);
      await sleep(150);
    }
    async revealTrap(cardId) {
      const sc = document.createElement('div');
      sc.className = 'showcase in';
      sc.style.left = '800px';
      sc.innerHTML = `<div class="trap-title top">¡Trampa!</div>${TW.cardHTML(cardId)}`;
      this.stage.appendChild(sc);
      TW.Sfx.play('shield');
      await sleep(1700);
      sc.classList.remove('in'); sc.classList.add('out');
      setTimeout(() => sc.remove(), 320);
    }
    async flashArrow(from, targetUid, ms) {
      const el = this.elFor(targetUid);
      if (!el) return;
      el.classList.add('targetable', 'hovered');
      this.drawArrow(from, this.centerOf(el), true);
      await sleep(ms);
      this.arrowSvg.innerHTML = '';
      el.classList.remove('targetable', 'hovered');
    }

    async missile(fromUid, toUid, kind) {
      const fe = this.elFor(fromUid) || this.heroEl(this.g.s.current), te = this.elFor(toUid);
      if (!fe || !te) return;
      const A = this.centerOf(fe), B = this.centerOf(te), color = MISSILE[kind] || '#e8c28a';
      const m = document.createElement('div');
      m.className = 'missile';
      m.style.setProperty('--mc', color);
      m.style.left = A.x + 'px'; m.style.top = A.y + 'px';
      this.fx.appendChild(m);
      const midY = Math.min(A.y, B.y) - 90, dur = 520 * (TW.speed || 1);
      m.animate([
        { transform: 'translate(0,0) scale(0.5)', easing: 'ease-out' },
        { transform: `translate(${(B.x - A.x) / 2}px, ${midY - A.y}px) scale(1.35) rotate(200deg)`, easing: 'ease-in' },
        { transform: `translate(${B.x - A.x}px, ${B.y - A.y}px) scale(1) rotate(400deg)` },
      ], { duration: dur });
      await new Promise((r) => setTimeout(r, dur - 20));
      m.remove();
      this.burst(B.x, B.y, { n: 7, color, dist: 60, size: 12, dur: 420 });
    }

    pop(uid, kind, text, n = 0) {
      const el = this.elFor(uid);
      if (!el) return;
      const c = this.centerOf(el);
      const d = document.createElement('div');
      d.className = 'pop ' + kind;
      d.textContent = text;
      d.style.left = c.x + 'px'; d.style.top = (kind === 'txt' ? c.y - 44 : c.y) + 'px';
      if (kind !== 'txt') {
        const sz = 78 + Math.min(n, 9) * 6;
        d.style.width = d.style.height = sz + 'px'; d.style.margin = `${-sz / 2}px 0 0 ${-sz / 2}px`; d.style.fontSize = 30 + Math.min(n, 9) * 2.4 + 'px';
      }
      this.fx.appendChild(d);
      setTimeout(() => d.remove(), 1700);
    }

    say(el, text, below, long) {
      if (!el) return;
      const c = this.centerOf(el);
      const isOpp = below ?? c.y < 450;
      const b = document.createElement('div');
      b.className = 'bubble' + (isOpp ? ' below' : '') + (long ? ' long' : '');
      b.textContent = text;
      b.style.left = Math.max(130, Math.min(W - 130, c.x)) + 'px';
      b.style.top = (isOpp ? c.y + 74 : c.y - 74) + 'px';
      this.fx.appendChild(b);
      setTimeout(() => b.remove(), long ? 3400 : 2600);
    }

    toast(text) {
      const b = document.createElement('div');
      b.className = 'pop txt';
      b.style.left = '800px'; b.style.top = '660px';
      b.style.fontSize = '24px';
      b.textContent = text;
      this.fx.appendChild(b);
      setTimeout(() => b.remove(), 1350);
    }

    snapshotShown() {
      this.shown.clear();
      for (const [uid, el] of this.minEls) this.shown.set(uid, { a: +el.querySelector('.m-atk span').textContent, h: +el.querySelector('.m-hp span').textContent });
      for (const p of [0, 1]) {
        const el = this.heroEl(p);
        this.shown.set('hero' + p, { h: +el.querySelector('.h-hp span').textContent, arm: +el.querySelector('.h-arm span').textContent || 0 });
      }
    }
    setShown(uid, o) {
      const cur = this.shown.get(uid) || {};
      for (const k in o) if (o[k] !== undefined) cur[k] = o[k];
      this.shown.set(uid, cur);
    }

    /* Reproduce los eventos de una jugada paso a paso. El motor ya tiene el estado final;
       mientras tanto la vista enseña solo lo que ya «ha ocurrido» (this.rp y this.shown). */
    async playEvents(evs, pre) {
      const me = this.me;
      if (this.minEls.size || this.g.s.phase !== 'mulligan') this.snapshotShown();
      const rp = (this.rp = { summon: new Set(), gone: new Set(), draw: new Set() });
      for (const e of evs) {
        if (e.t === 'summon') rp.summon.add(e.uid);
        else if (e.t === 'death' || e.t === 'bounce') rp.gone.add(e.uid);
        else if (e.t === 'draw') rp.draw.add(e.uid);
      }
      this.render();
      const run = (i, types) => i < evs.length && types.includes(evs[i].t);
      let i = 0, over = false;
      try {
        if (pre) await pre();
        while (i < evs.length && !this.dead) {
          const e = evs[i];
          switch (e.t) {
            case 'damage': case 'shieldPop': {
              let heroHit = false;
              while (run(i, ['damage', 'shieldPop'])) {
                const d = evs[i++];
                if (d.t === 'damage') { this.setShown(d.uid, { h: d.hp, arm: d.arm }); this.hitFx(d.uid, d.n); if (d.uid === 'hero' + me) heroHit = true; }
                else { const c = this.flash(d.uid, 'buffed'); this.pop(d.uid, 'txt', '¡Crac!'); if (c) this.burst(c.x, c.y, { n: 10, color: '#ffd64d', dist: 90, size: 13 }); TW.Sfx.play('shield'); }
              }
              this.render();
              TW.Sfx.play('hit');
              if (heroHit) this.hurt();
              await sleep(T.damage);
              continue;
            }
            case 'death': {
              while (run(i, ['death'])) rp.gone.delete(evs[i++].uid);
              this.renderBoards();
              TW.Sfx.play('death');
              await sleep(T.death);
              continue;
            }
            case 'summon': {
              while (run(i, ['summon'])) {
                const d = evs[i++];
                rp.summon.delete(d.uid);
                this.shown.set(d.uid, { a: d.a, h: d.h });
                if (!this.ent(d.uid)) this.ghostMinion(d);
              }
              this.render();
              TW.Sfx.play('summon');
              await sleep(T.summon);
              continue;
            }
            case 'heal': {
              while (run(i, ['heal'])) { const d = evs[i++]; this.setShown(d.uid, { h: d.hp }); this.healFx(d.uid, d.n); }
              this.render();
              TW.Sfx.play('heal');
              await sleep(T.heal);
              continue;
            }
            case 'buff': {
              while (run(i, ['buff'])) { const d = evs[i++]; this.setShown(d.uid, { a: d.ta, h: d.th }); this.buffFx(d.uid, `+${d.a}/+${d.h}`); }
              this.render();
              TW.Sfx.play('pop');
              await sleep(T.buff);
              continue;
            }
            case 'freeze': {
              while (run(i, ['freeze'])) { const d = evs[i++]; const c = this.flash(d.uid, 'healed'); this.pop(d.uid, 'txt', '¡Congelado!'); if (c) this.burst(c.x, c.y, { n: 9, color: '#bfe8fb', dist: 70, size: 13 }); }
              this.render();
              TW.Sfx.play('freeze');
              await sleep(T.small);
              continue;
            }
            case 'draw':
              rp.draw.delete(e.uid);
              if (e.p === me) { this.renderHand(); TW.Sfx.play('card'); await sleep(T.draw); }
              else { this.renderOppHand(); await sleep(T.drawOpp); }
              break;
            case 'bounce': {
              rp.gone.delete(e.uid);
              const el = this.minEls.get(e.uid);
              if (el) el.dataset.bounce = '1';
              this.renderBoards();
              TW.Sfx.play('card');
              await sleep(T.small);
              break;
            }
            case 'missile': this.render(); await this.missile(e.from, e.to, e.kind); break;
            case 'say': this.render(); this.say(this.elFor(e.uid), e.text); await sleep(T.say); break;
            case 'silence': this.setShown(e.uid, { a: e.ta, h: e.th }); this.render(); this.pop(e.uid, 'txt', 'Soso'); await sleep(T.small); break;
            case 'transform': {
              this.setShown(e.uid, { a: e.ta, h: e.th });
              const el = this.elFor(e.uid);
              if (el) { const c = this.centerOf(el); this.burst(c.x, c.y, { n: 12, color: '#d5cfe0', dist: 90, size: 26, grow: 1.4, dur: 600 }); }
              this.render();
              TW.Sfx.play('summon');
              await sleep(T.summon);
              break;
            }
            case 'armor': this.setShown(e.uid, { arm: e.arm }); this.render(); this.pop(e.uid, 'txt', `+${e.n} armadura`); await sleep(T.small); break;
            case 'fatigue': this.pop('hero' + e.p, 'txt', '¡Nevera vacía!'); await sleep(T.small); break;
            case 'burn': {
              const c = this.centerOf(this.deckEl(e.p));
              const b = document.createElement('div');
              b.className = 'pop txt'; b.style.left = c.x + 'px'; b.style.top = c.y - 90 + 'px'; b.style.fontSize = '18px';
              b.textContent = `${TW.CARDS[e.cardId].name}: ¡al suelo!`;
              this.fx.appendChild(b); setTimeout(() => b.remove(), 1700);
              await sleep(T.small);
              break;
            }
            case 'weapon': this.render(); await sleep(T.small); break;
            case 'weaponBreak': this.pop('hero' + e.p, 'txt', 'Utensilio roto'); break;
            case 'trapSet': this.render(); this.pop('hero' + e.p, 'txt', 'Trampa preparada'); TW.Sfx.play('card'); await sleep(T.small); break;
            case 'trap': this.render(); await this.revealTrap(e.cardId); break;
            case 'ferment': if (e.p === me) this.renderHand(); break;
            case 'thaw': this.render(); break;
            case 'turn': this.render(); if (!this.g.s.over) await this.band(e.p === me ? 'Tu turno' : `Turno de ${this.g.player(e.p).name}`, e.p === me ? '' : 'opp', e.p === me ? T.bannerMine : T.bannerOpp, e.p === me ? 'turn' : 'oppTurn'); break;
            case 'gameOver': over = true; break;
            default: break;
          }
          i++;
        }
      } finally {
        this.rp = null;
        this.shown.clear();
      }
      if (this.dead) return;
      this.render();
      if (over) { await sleep(1200); this.showGameOver(); }
    }

    async band(text, cls, ms, sfx) {
      const b = document.createElement('div');
      b.className = 'turn-band ' + (cls || '');
      b.innerHTML = `<span>${TW.esc(text)}</span>`;
      b.style.animationDuration = b.firstChild.style.animationDuration = (ms + 350) * (TW.speed || 1) + 'ms';
      this.fx.appendChild(b);
      if (sfx) TW.Sfx.play(sfx);
      setTimeout(() => b.remove(), (ms + 400) * (TW.speed || 1));
      await sleep(ms);
    }

    /* ---------- vistas previas ---------- */
    showPreviewAt(html, anchorEl, side) {
      const pe = this.previewEl;
      pe.innerHTML = html;
      pe.classList.add('on');
      const c = this.centerOf(anchorEl);
      const w = pe.offsetWidth, h = pe.offsetHeight;
      let x = side === 'left' || c.x > W / 2 ? c.x - 90 - w : c.x + 90;
      x = Math.max(10, Math.min(W - w - 10, x));
      const y = Math.max(10, Math.min(H - h - 10, c.y - h / 2));
      pe.style.left = x + 'px'; pe.style.top = y + 'px';
    }
    hidePreview() { this.previewEl.classList.remove('on'); clearTimeout(this.pvT); }
    previewCard(cardId, el, o = {}) {
      if (this.busy) return;
      clearTimeout(this.pvT);
      this.pvT = setTimeout(() => {
        this.showPreviewAt(`${TW.cardHTML(cardId, o)}<div class="notes-col">${TW.notesHTML(cardId)}</div>`, el);
      }, 180);
    }
    previewMinion(uid, el) {
      if (this.busy) return;
      const m = this.ent(uid);
      if (!m) return;
      const extra = [];
      if (m.silenced) extra.push(TW.KEYWORDS.silence);
      if (m.frozen) extra.push({ name: 'Congelado', desc: 'Pierde su próximo ataque.' });
      if (m.taunt && !(TW.CARDS[m.cardId].kw || []).includes('taunt')) extra.push(TW.KEYWORDS.taunt);
      if (m.divineShield && !(TW.CARDS[m.cardId].kw || []).includes('divineShield')) extra.push(TW.KEYWORDS.divineShield);
      if (m.charge && !(TW.CARDS[m.cardId].kw || []).includes('charge')) extra.push(TW.KEYWORDS.charge);
      if (m.sleeping && !m.charge && m.owner === this.g.s.current) extra.push({ name: 'Recién sacado', desc: 'Podrá atacar a partir de tu próximo turno.' });
      clearTimeout(this.pvT);
      this.pvT = setTimeout(() => {
        this.showPreviewAt(`${TW.cardHTML(m.cardId, { attack: m.attack, health: m.health, maxHealth: m.maxHealth })}<div class="notes-col">${TW.notesHTML(m.cardId, extra)}</div>`, el);
      }, 220);
    }
    previewPower(p, el) {
      if (this.busy) return;
      clearTimeout(this.pvT);
      this.pvT = setTimeout(() => this.showPreviewAt(TW.powerNoteHTML(this.g.player(p).heroId), el), 150);
    }
    showNotes(cardId, el) {
      const html = TW.notesHTML(cardId);
      if (!html) { this.hidePreview(); return; }
      clearTimeout(this.pvT);
      this.pvT = setTimeout(() => {
        if (!this.hoverUid) return;
        const pe = this.previewEl;
        pe.innerHTML = `<div class="notes-col">${html}</div>`;
        pe.classList.add('on');
        const x = parseFloat(el.style.left);
        const left = x + 120 + 230 < W ? x + 120 : x - 120 - 230;
        pe.style.left = left + 'px';
        pe.style.top = Math.min(H - pe.offsetHeight - 20, 560) + 'px';
      }, 120);
    }

    /* ---------- capas modales ---------- */
    overlay(html, kind) {
      this.closeOverlay();
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML = html;
      this.stage.appendChild(o);
      this.overlayEl = o;
      this.overlayOpen = kind || true;
      this.render();
      return o;
    }
    closeOverlay() {
      if (this.overlayEl) this.overlayEl.remove();
      this.overlayEl = null;
      this.overlayOpen = false;
    }

    start() {
      const g = this.g;
      if (g.s.phase === 'mulligan') {
        if (!g.player(this.me).mulliganDone) this.showMulligan();
        return;
      }
      this.render();
      this.after();
    }

    showMulligan() {
      const g = this.g, hand = g.player(this.me).hand;
      const first = g.s.first === this.me;
      const out = new Set();
      const theme = TW.Decks.themeOf([...hand, ...g.player(this.me).deck].map((c) => c.cardId));
      const themeTxt = theme ? ` Tu mazo de hoy tira a ${TW.FAMILIES[theme].name}.` : '';
      const o = this.overlay(`<div class="box">
        <h2>Tu mano inicial</h2>
        <p class="sub">${first ? 'Empiezas tú.' : 'Vas segundo: recibirás un Cupón de Descuento.'} Toca las cartas que quieras cambiar.${themeTxt}</p>
        <div class="row">${hand.map((c) => `<div class="pick" data-u="${c.uid}">${TW.cardHTML(c.cardId)}</div>`).join('')}</div>
        <button class="btn" data-ok>Confirmar</button></div>`, 'mull');
      o.querySelectorAll('.pick').forEach((pk) => pk.addEventListener('click', () => {
        const u = pk.dataset.u;
        if (out.has(u)) out.delete(u); else out.add(u);
        pk.classList.toggle('out', out.has(u));
        TW.Sfx.play('pop');
      }));
      o.querySelector('[data-ok]').addEventListener('click', () => {
        this.myMull = [...out];
        if (this.mode === 'online') {
          this.o.sendMull && this.o.sendMull(this.myMull);
          if (this.oppMull === null) {
            o.querySelector('.box').innerHTML = `<h2>Esperando a ${TW.esc(this.g.player(this.opp).name)}</h2><p class="sub">Está eligiendo su mano inicial...</p>`;
          }
        } else {
          this.oppMull = TW.AI.mulligan(this.g, this.opp);
        }
        this.tryMulligans();
      });
    }

    receiveMull(uids) { this.oppMull = uids || []; this.tryMulligans(); }

    async tryMulligans() {
      if (this.myMull === null || this.oppMull === null || this.g.s.phase !== 'mulligan') return;
      const mine = this.myMull, theirs = this.oppMull;
      for (const p of [0, 1]) this.applyLogged({ type: 'mulligan', p, uids: p === this.me ? mine : theirs });
      const evs = this.g.flush();
      this.busy = true;
      try {
        // Arranque pausado: saludo de cada héroe, cartel y solo entonces empieza el primer turno
        await this.playEvents(evs, async () => {
          this.closeOverlay();
          this.render();
          await sleep(T.introPause);
          this.say(this.heroEl(this.opp), TW.HEROES[this.g.player(this.opp).heroId].hello, undefined, true);
          await sleep(T.introLine);
          this.say(this.heroEl(this.me), TW.HEROES[this.g.player(this.me).heroId].hello, undefined, true);
          await sleep(T.introLine);
          await this.band('¡A comer!', 'start', 1500, 'turn');
          await sleep(300);
        });
      } finally { this.busy = false; this.render(); this.after(); }
    }

    chooseOne(d) {
      return new Promise((res) => {
        const o = this.overlay(`<div class="box"><h2>Elige una</h2><p class="sub">${TW.esc(d.name)}</p>
          <div class="row">${d.chooseOne.map((opt, i) => `<div class="pick" data-i="${i}">${TW.cardHTML(d.id)}<div class="choice-name">${TW.esc(opt.name)}</div></div>`).join('')}</div>
          <button class="btn white" data-cancel>Cancelar</button></div>`, 'choose');
        o.querySelectorAll('.pick').forEach((pk) => {
          const opt = d.chooseOne[+pk.dataset.i];
          pk.querySelector('.c-text').innerHTML = `<p>${TW.fmt(opt.text)}</p>`;
          pk.querySelector('.c-tape span').textContent = opt.name;
          pk.addEventListener('click', () => { this.closeOverlay(); res(+pk.dataset.i); });
        });
        o.querySelector('[data-cancel]').addEventListener('click', () => { this.closeOverlay(); res(null); });
      });
    }

    showDiscover() {
      const pe = this.g.s.pending;
      const o = this.overlay(`<div class="box"><h2>Descubre una carta</h2><p class="sub">Elige una para añadirla a tu mano.</p>
        <div class="row">${pe.options.map((id, i) => `<div class="pick" data-i="${i}">${TW.cardHTML(id)}</div>`).join('')}</div></div>`, 'discover');
      o.querySelectorAll('.pick').forEach((pk) => pk.addEventListener('click', () => {
        this.closeOverlay();
        this.perform({ type: 'choose', p: this.me, i: +pk.dataset.i });
      }));
    }

    showMenu() {
      this.cancelAll();
      const online = this.mode === 'online';
      const o = this.overlay(`<div class="menu-box"><h2>Pausa</h2>
        <button class="btn mint" data-m="back">Seguir jugando</button>
        <button class="btn white" data-m="help">Cómo se juega</button>
        <button class="btn white" data-m="sound">Sonido: ${TW.Sfx.enabled ? 'activado' : 'desactivado'}</button>
        <button class="btn white" data-m="speed">Animaciones: ${TW.speedName ? TW.speedName() : 'normales'}</button>
        ${this.g.s.over ? '' : `<button class="btn red" data-m="concede">Rendirse</button>`}
        <button class="btn white" data-m="exit">${online ? 'Salir de la sala' : 'Salir al menú'}</button></div>`, 'menu');
      o.addEventListener('click', (e) => {
        const b = e.target.closest('[data-m]');
        if (!b) { if (e.target === o) { this.closeOverlay(); this.render(); } return; }
        const m = b.dataset.m;
        if (m === 'back') { this.closeOverlay(); this.render(); this.after(); }
        if (m === 'help') TW.showHelp();
        if (m === 'sound') { TW.Sfx.setEnabled(!TW.Sfx.enabled); TW.saveSettings && TW.saveSettings({ sound: TW.Sfx.enabled }); b.textContent = `Sonido: ${TW.Sfx.enabled ? 'activado' : 'desactivado'}`; this.updateSoundBtn(); }
        if (m === 'speed' && TW.toggleSpeed) { TW.toggleSpeed(); b.textContent = `Animaciones: ${TW.speedName()}`; }
        if (m === 'concede') { this.closeOverlay(); this.concede(); }
        if (m === 'exit') {
          if (!this.g.s.over && online) this.concede(true);
          this.o.onExit && this.o.onExit();
        }
      });
    }

    async concede(silent) {
      if (this.g.s.over) return;
      const act = { type: 'concede', p: this.me };
      this.applyLogged(act);
      if (this.mode === 'online' && this.o.sendConcede) this.o.sendConcede();
      const evs = this.g.flush();
      if (!silent) await this.playEvents(evs);
    }

    showGameOver() {
      if (this.dead || this.overlayOpen === 'over') return;
      const g = this.g, w = g.s.winner, won = w === this.me, draw = w === -1;
      const hero = TW.HEROES[g.player(this.me).heroId];
      const lastConcede = this.log.length && this.log[this.log.length - 1].type === 'concede' ? this.log[this.log.length - 1].p : null;
      let sub = draw ? 'Los dos héroes han caído a la vez.' : won ? hero.win : hero.lose;
      if (lastConcede === this.opp) sub = `${g.player(this.opp).name} se ha rendido.`;
      TW.Sfx.play(won ? 'win' : 'lose');
      if (this.o.onResult) this.o.onResult(won ? 'win' : draw ? 'draw' : 'loss');
      const online = this.mode === 'online';
      const o = this.overlay(`<div class="result-card">
        <div class="ph">${TW.Art.hero(g.player(won || draw ? this.me : this.opp).heroId)}</div>
        <h2>${draw ? 'Empate' : won ? '¡Victoria!' : 'Derrota'}</h2>
        <p class="quote">${TW.esc(sub)}</p>
        <div class="btns">
          <button class="btn" data-r="again">${online ? 'Pedir revancha' : 'Otra partida'}</button>
          <button class="btn white" data-r="look">Ver el tablero</button>
          <button class="btn white" data-r="exit">Menú principal</button>
        </div></div>`, 'over');
      o.addEventListener('click', (e) => {
        const b = e.target.closest('[data-r]');
        if (!b) return;
        if (b.dataset.r === 'again') {
          if (online) { b.disabled = true; b.textContent = 'Esperando respuesta...'; this.o.sendRematch && this.o.sendRematch(); }
          else this.o.onRematch && this.o.onRematch();
        }
        if (b.dataset.r === 'look') { this.closeOverlay(); this.showLookBar(); }
        if (b.dataset.r === 'exit') this.o.onExit && this.o.onExit();
      });
    }
    showLookBar() {
      this.endBtn.disabled = false;
      this.endBtn.textContent = 'Ver resultado';
      this.endBtn.classList.remove('done');
      const fn = () => { this.endBtn.removeEventListener('click', fn); this.showGameOver(); };
      this.endBtn.addEventListener('click', fn);
    }
    rematchOffered() {
      const b = this.overlayEl && this.overlayEl.querySelector('[data-r="again"]');
      if (b && !b.disabled) b.textContent = 'Aceptar revancha';
      this.say(this.heroEl(this.opp), '¿Revancha?');
    }

    emote(p, text, local) {
      this.say(this.heroEl(p), text);
      TW.Sfx.play('emote');
      if (!local) return;
      if (this.mode === 'online') this.o.sendEmote && this.o.sendEmote(text);
      else if (Math.random() < 0.6 && !this.g.s.over) {
        const replies = ['Ñam.', 'Uy...', '¡Hola!', 'Bien jugado', 'Esto huele raro'];
        setTimeout(() => !this.dead && this.say(this.heroEl(this.opp), replies[Math.floor(Math.random() * replies.length)]), 900);
      }
    }

    setNet(state, text) {
      const nb = this.stage.querySelector('.net-badge');
      if (!nb) return;
      nb.querySelector('.dot').className = 'dot ' + (state === 'ok' ? 'ok' : state === 'bad' ? 'bad' : 'wait');
      nb.querySelector('.nb-txt').textContent = text;
    }

    /* Temporizador de turno (solo online): 90 s */
    tickTimer() {
      if (this.mode !== 'online' || this.dead) return;
      const g = this.g;
      if (g.s.over || g.s.phase !== 'play') { this.timerEl.classList.remove('on'); return; }
      if (this.timerTurn !== g.s.turn) { this.timerTurn = g.s.turn; this.timerStart = Date.now(); }
      const LIMIT = 90000, left = LIMIT - (Date.now() - this.timerStart);
      this.timerEl.classList.add('on');
      this.timerEl.classList.toggle('hurry', left < 15000);
      this.timerEl.querySelector('i').style.transform = `scaleX(${Math.max(0, left / LIMIT)})`;
      if (left <= 0 && g.s.current === this.me && !this.busy) {
        this.closeOverlay();
        this.cancelAll();
        if (g.s.pending && g.s.pending.p === this.me) { this.perform({ type: 'choose', p: this.me, i: 0 }); return; }
        this.toast('Se acabó el tiempo');
        this.perform({ type: 'end', p: this.me });
      }
    }
  }

  TW.GameView = GameView;
})();
