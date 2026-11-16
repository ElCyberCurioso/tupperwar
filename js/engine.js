/* Tupperwar — motor de reglas.
   El estado (this.s) es un objeto plano y clonable: las IA lo clonan para simular
   jugadas y el modo online lo reproduce paso a paso en los dos navegadores.
   Las definiciones de cartas viven en TW.CARDS y se consultan por id. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});

  const MAX_HAND = 10, MAX_BOARD = 7, MAX_MANA = 10, START_HP = 30, FERMENT_MAX = 3, MAX_TRAPS = 3;
  TW.RULES = { MAX_HAND, MAX_BOARD, MAX_MANA, START_HP, DECK_SIZE: 30 };

  const KW = ['taunt', 'divineShield', 'poisonous', 'charge', 'windfury', 'stealth', 'lifesteal'];

  class Game {
    /* opts: { seed, heroes:[id,id], decks:[[ids],[ids]], first?:0|1, ai?:[bool,bool], names?:[str,str] } */
    constructor(opts) {
      this.events = [];
      this.silent = false;
      if (!opts) return; // usado por clone()
      const seed = (opts.seed ?? TW.randomSeed()) >>> 0;
      const s = (this.s = {
        seed, rng: seed | 0, uid: 0, turn: 0, current: 0, first: 0,
        phase: 'mulligan', over: false, winner: null, pending: null,
        players: [], history: [],
      });
      for (let i = 0; i < 2; i++) {
        s.players.push({
          idx: i,
          heroId: opts.heroes[i],
          name: (opts.names && opts.names[i]) || TW.HEROES[opts.heroes[i]].name,
          isAI: !!(opts.ai && opts.ai[i]),
          hero: {
            uid: 'hero' + i, kind: 'hero', owner: i, health: START_HP, maxHealth: START_HP,
            armor: 0, tempAttack: 0, frozen: false, frozenAt: 0, attacksThisTurn: 0,
          },
          deck: opts.decks[i].map((id) => this.mkCard(id)),
          hand: [], board: [], weapon: null,
          mana: 0, maxMana: 0, heroPowerUsed: false, fatigue: 0, mulliganDone: false,
          traps: [], playedThisTurn: 0,
        });
      }
      for (const pl of s.players) this.shuffle(pl.deck);
      s.first = opts.first ?? this.int(2);
      s.current = s.first;
      for (let i = 0; i < 3; i++) this.draw(s.first);
      for (let i = 0; i < 4; i++) this.draw(1 - s.first);
      this.events = [];
    }

    clone() {
      const g = new Game(null);
      g.s = structuredClone(this.s);
      g.silent = true;
      return g;
    }

    /* ---------- utilidades ---------- */
    emit(e) { if (!this.silent) this.events.push(e); }
    flush() { const e = this.events; this.events = []; return e; }
    rand() { const [v, st] = TW.rngStep(this.s.rng); this.s.rng = st; return v; }
    int(n) { return Math.floor(this.rand() * n); }
    chance(p) { return this.rand() < p; }
    pick(arr) { return arr.length ? arr[this.int(arr.length)] : null; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    mkCard(id) { return { uid: 'c' + ++this.s.uid, cardId: id }; }
    def(id) { return TW.CARDS[id]; }
    player(p) { return this.s.players[p]; }
    hero(p) { return this.s.players[p].hero; }
    board(p) { return this.s.players[p].board; }
    heroDef(p) { return TW.HEROES[this.s.players[p].heroId]; }
    spellSrc(p) { return { kind: 'spell', owner: p, uid: 'hero' + p }; }
    chars(p) { return [this.hero(p), ...this.board(p)]; }
    allMinions() { const c = this.s.current; return [...this.board(c), ...this.board(1 - c)]; }
    enemyMinions(p) { return this.board(1 - p); }
    friendlyMinions(p) { return this.board(p); }
    enemyChars(p) { return this.chars(1 - p).filter((e) => this.alive(e)); }
    alive(e) { return e.kind === 'hero' ? e.health > 0 : !e.dead && !e.destroyed && e.health > 0; }
    byUid(uid) {
      if (!uid) return null;
      for (const pl of this.s.players) {
        if (pl.hero.uid === uid) return pl.hero;
        const m = pl.board.find((x) => x.uid === uid);
        if (m) return m;
      }
      return null;
    }
    collectible(filter = () => true) {
      return TW.CARD_LIST.filter((c) => !c.token && filter(c)).map((c) => c.id);
    }
    pushHistory(h) {
      this.s.history.push(h);
      if (this.s.history.length > 14) this.s.history.shift();
    }

    /* ---------- estado de turno ---------- */
    canAct(p) {
      const s = this.s;
      return !s.over && s.phase === 'play' && s.current === p && !s.pending;
    }

    mulligan(p, uids = []) {
      const s = this.s, pl = this.player(p);
      if (s.phase !== 'mulligan' || pl.mulliganDone) return false;
      const back = [];
      pl.hand = pl.hand.map((c) => {
        if (!uids.includes(c.uid) || !pl.deck.length) return c;
        back.push(c);
        return pl.deck.shift();
      });
      pl.deck.push(...back);
      this.shuffle(pl.deck);
      pl.mulliganDone = true;
      this.emit({ t: 'mulligan', p, n: back.length });
      if (s.players.every((x) => x.mulliganDone)) this.begin();
      return true;
    }

    begin() {
      const s = this.s;
      s.phase = 'play';
      this.addToHand(1 - s.first, 'cupon');
      this.startTurn(s.first);
    }

    startTurn(p) {
      const s = this.s, pl = this.player(p);
      s.turn++;
      s.current = p;
      pl.maxMana = Math.min(MAX_MANA, pl.maxMana + 1);
      pl.mana = pl.maxMana;
      pl.heroPowerUsed = false;
      pl.playedThisTurn = 0;
      pl.hero.attacksThisTurn = 0;
      // Fermenta: las cartas maduran en la mano
      for (const c of pl.hand) {
        if (this.def(c.cardId).ferment && (c.bonus || 0) < FERMENT_MAX) {
          c.bonus = (c.bonus || 0) + 1;
          this.emit({ t: 'ferment', p, uid: c.uid });
        }
      }
      for (const m of pl.board) { m.sleeping = false; m.attacksThisTurn = 0; }
      this.emit({ t: 'turn', p, turn: s.turn });
      for (const m of [...pl.board]) {
        const d = this.def(m.cardId);
        if (d.startOfTurn && !m.silenced && pl.board.includes(m)) d.startOfTurn(this, { p, self: m });
      }
      this.draw(p);
      this.resolveDeaths();
    }

    endTurn(p) {
      if (!this.canAct(p)) return false;
      const s = this.s, pl = this.player(p);
      this.emit({ t: 'endTurn', p });
      for (const m of [...pl.board]) {
        const d = this.def(m.cardId);
        if (d.endOfTurn && !m.silenced && pl.board.includes(m) && this.alive(m)) {
          d.endOfTurn(this, { p, self: m });
          this.resolveDeaths();
          if (s.over) return true;
        }
      }
      this.resolveDeaths();
      if (s.over) return true;
      for (const c of [pl.hero, ...pl.board]) {
        if (c.frozen && (c.frozenAt < s.turn || c.attacksThisTurn > 0)) {
          c.frozen = false;
          this.emit({ t: 'thaw', uid: c.uid });
        }
      }
      pl.hero.tempAttack = 0;
      this.startTurn(1 - p);
      return true;
    }

    concede(p) {
      const s = this.s;
      if (s.over) return false;
      s.over = true; s.phase = 'over'; s.winner = 1 - p; s.pending = null;
      this.emit({ t: 'gameOver', winner: s.winner, conceded: p });
      return true;
    }

    /* ---------- cartas ---------- */
    costOf(p, card) { return this.def(card.cardId).cost; }

    targetsFor(p, spec) {
      if (!spec) return [];
      const op = 1 - p;
      let list;
      switch (spec) {
        case 'any': list = [this.hero(p), ...this.board(p), this.hero(op), ...this.board(op)]; break;
        case 'minion': list = [...this.board(p), ...this.board(op)]; break;
        case 'enemyMinion': list = [...this.board(op)]; break;
        case 'friendlyMinion': list = [...this.board(p)]; break;
        case 'enemyChar': list = [this.hero(op), ...this.board(op)]; break;
        case 'friendlyChar': list = [this.hero(p), ...this.board(p)]; break;
        default: list = [];
      }
      return list.filter((e) => this.alive(e) && !(e.kind === 'minion' && e.owner !== p && e.stealth));
    }

    // Especificación de objetivo que necesita la carta (o null)
    targetSpec(p, card) {
      const d = this.def(card.cardId);
      if (d.type === 'spell') return d.spell.target || null;
      if (d.type === 'minion' && d.battlecry && d.battlecry.target) {
        return this.targetsFor(p, d.battlecry.target).length ? d.battlecry.target : null;
      }
      return null;
    }

    canPlay(p, cardUid) {
      if (!this.canAct(p)) return false;
      const pl = this.player(p);
      const card = pl.hand.find((c) => c.uid === cardUid);
      if (!card) return false;
      const d = this.def(card.cardId);
      if (this.costOf(p, card) > pl.mana) return false;
      if (d.type === 'minion' && pl.board.length >= MAX_BOARD) return false;
      if (d.trap && (pl.traps.length >= MAX_TRAPS || pl.traps.some((t) => t.cardId === d.id))) return false;
      if (d.type === 'spell') {
        if (d.spell.target && !this.targetsFor(p, d.spell.target).length) return false;
        if (d.spell.canPlay && !d.spell.canPlay(this, p)) return false;
      }
      return true;
    }

    /* o: { pos, target (uid), choice } */
    playCard(p, cardUid, o = {}) {
      if (!this.canPlay(p, cardUid)) return false;
      const pl = this.player(p);
      const card = pl.hand.find((c) => c.uid === cardUid);
      const d = this.def(card.cardId);
      const spec = this.targetSpec(p, card);
      let target = null;
      if (spec) {
        target = this.byUid(o.target);
        if (!target || !this.targetsFor(p, spec).includes(target)) return false;
      }
      if (d.chooseOne && !(o.choice === 0 || o.choice === 1)) return false;

      const combo = pl.playedThisTurn > 0; // Guarnición
      pl.playedThisTurn++;
      pl.mana -= this.costOf(p, card);
      pl.hand.splice(pl.hand.indexOf(card), 1);
      this.pushHistory({ p, cardId: d.id, kind: d.trap ? 'trapSet' : 'play' });
      this.emit({ t: 'play', p, cardId: d.id, uid: card.uid, target: target && target.uid, choice: o.choice });

      if (d.type === 'minion') {
        const pos = Math.max(0, Math.min(o.pos ?? pl.board.length, pl.board.length));
        const m = this.createMinion(p, d.id);
        m.uid = 'm' + card.uid; // mantiene el vínculo visual carta → esbirro
        if (card.bonus) { m.attack += card.bonus; m.health += card.bonus; m.maxHealth += card.bonus; }
        pl.board.splice(pos, 0, m);
        this.emit({ t: 'summon', p, uid: m.uid, fromHand: true });
        if (d.quote) this.say(m, d.quote);
        const ctx = { p, self: m, target, choice: o.choice, pos, combo };
        if (d.battlecry) d.battlecry.run(this, ctx);
        if (d.chooseOne) d.chooseOne[o.choice].run(this, ctx);
        this.resolveDeaths();
        if (pl.board.includes(m) && this.alive(m)) this.triggerTrap(1 - p, 'minion', { target: m });
      } else if (d.trap) {
        pl.traps.push({ uid: card.uid, cardId: d.id });
        this.emit({ t: 'trapSet', p });
      } else if (d.type === 'spell') {
        if (!this.triggerTrap(1 - p, 'spell', { cardId: d.id })) d.spell.run(this, { p, self: null, target, combo });
      } else if (d.type === 'weapon') {
        this.equipWeapon(p, d.id);
      }
      this.resolveDeaths();
      return true;
    }

    createMinion(p, id) {
      const d = this.def(id);
      const m = {
        uid: 'm' + ++this.s.uid, kind: 'minion', owner: p, cardId: id,
        attack: d.attack, health: d.health, maxHealth: d.health,
        baseAttack: d.attack, baseHealth: d.health,
        sleeping: true, attacksThisTurn: 0, frozen: false, frozenAt: 0,
        silenced: false, destroyed: false, dead: false,
      };
      for (const k of KW) m[k] = !!(d.keywords && d.keywords.includes(k));
      return m;
    }

    equipWeapon(p, id) {
      const pl = this.player(p), d = this.def(id);
      if (pl.weapon) this.emit({ t: 'weaponBreak', p, cardId: pl.weapon.cardId });
      pl.weapon = { uid: 'w' + ++this.s.uid, cardId: id, attack: d.attack, durability: d.durability };
      this.emit({ t: 'weapon', p, cardId: id });
    }

    destroyWeapon(p) {
      const pl = this.player(p);
      if (!pl.weapon) return;
      this.emit({ t: 'weaponBreak', p, cardId: pl.weapon.cardId });
      pl.weapon = null;
    }

    /* ---------- combate ---------- */
    attackValue(e) {
      if (e.kind === 'minion') return e.attack;
      const w = this.player(e.owner).weapon;
      return e.tempAttack + (w ? w.attack : 0);
    }

    canAttack(e) {
      if (!e || !this.canAct(e.owner) || !this.alive(e)) return false;
      if (e.frozen || this.attackValue(e) <= 0) return false;
      if (e.kind === 'minion') {
        if (e.sleeping && !e.charge) return false;
        return e.attacksThisTurn < (e.windfury ? 2 : 1);
      }
      return e.attacksThisTurn < 1;
    }

    attackTargets(e) {
      const op = 1 - e.owner;
      const cands = this.chars(op).filter((x) => this.alive(x) && !(x.kind === 'minion' && x.stealth));
      const taunts = cands.filter((x) => x.kind === 'minion' && x.taunt);
      return taunts.length ? taunts : cands;
    }

    attack(p, aUid, tUid) {
      const a = this.byUid(aUid), t = this.byUid(tUid);
      if (!a || a.owner !== p || !this.canAttack(a)) return false;
      if (!t || !this.attackTargets(a).includes(t)) return false;
      a.attacksThisTurn++;
      if (a.kind === 'minion') a.stealth = false;
      this.emit({ t: 'attack', a: a.uid, d: t.uid, p });
      this.pushHistory({ p, kind: 'attack', cardId: a.kind === 'minion' ? a.cardId : null, heroId: this.player(p).heroId });
      if (t.kind === 'hero' && a.kind === 'minion' && this.triggerTrap(t.owner, 'attackHero', { target: a })) {
        this.resolveDeaths();
        return true;
      }
      const ad = this.attackValue(a);
      const dd = t.kind === 'minion' ? t.attack : 0;
      this.damage(a, t, ad);
      if (dd > 0) this.damage(t, a, dd);
      if (a.kind === 'hero') {
        const w = this.player(p).weapon;
        if (w) { w.durability--; if (w.durability <= 0) this.destroyWeapon(p); }
      }
      this.resolveDeaths();
      return true;
    }

    /* ---------- trampas, familias y vecinos ---------- */
    triggerTrap(owner, on, ctx) {
      const pl = this.player(owner);
      const i = pl.traps.findIndex((t) => this.def(t.cardId).trap.on === on);
      if (i < 0) return false;
      const [t] = pl.traps.splice(i, 1);
      const d = this.def(t.cardId);
      this.emit({ t: 'trap', p: owner, cardId: d.id });
      this.pushHistory({ p: owner, cardId: d.id, kind: 'trap' });
      d.trap.run(this, Object.assign({ p: owner, self: null }, ctx));
      return true;
    }
    isFam(m, fam) { return !!m && m.kind === 'minion' && this.def(m.cardId).fam === fam; }
    famMinions(p, fam, except) { return this.board(p).filter((m) => m !== except && this.alive(m) && this.isFam(m, fam)); }
    neighbors(m) {
      const b = this.board(m.owner), i = b.indexOf(m);
      if (i < 0) return [];
      return [b[i - 1], b[i + 1]].filter((x) => x && this.alive(x));
    }

    /* ---------- poder de héroe ---------- */
    heroPowerSpec(p) { return this.heroDef(p).power.target || null; }
    canHeroPower(p) {
      if (!this.canAct(p)) return false;
      const pl = this.player(p), pw = this.heroDef(p).power;
      if (pl.heroPowerUsed || pl.mana < pw.cost) return false;
      if (pw.target && !this.targetsFor(p, pw.target).length) return false;
      if (pw.canUse && !pw.canUse(this, p)) return false;
      return true;
    }
    heroPower(p, tUid) {
      if (!this.canHeroPower(p)) return false;
      const pl = this.player(p), pw = this.heroDef(p).power;
      let target = null;
      if (pw.target) {
        target = this.byUid(tUid);
        if (!target || !this.targetsFor(p, pw.target).includes(target)) return false;
      }
      pl.mana -= pw.cost;
      pl.heroPowerUsed = true;
      this.emit({ t: 'power', p, target: target && target.uid });
      this.pushHistory({ p, kind: 'power', heroId: pl.heroId });
      pw.run(this, { p, self: pl.hero, target });
      this.resolveDeaths();
      return true;
    }

    /* ---------- elecciones pendientes (Descubre) ---------- */
    discover(p, pool) {
      const opts = this.shuffle([...new Set(pool)]).slice(0, 3);
      if (!opts.length) return;
      if (this.silent || this.player(p).isAI) {
        const i = TW.AI ? TW.AI.pickDiscover(this, p, opts) : 0;
        this.addToHand(p, opts[i]);
      } else {
        this.s.pending = { p, kind: 'discover', options: opts };
        this.emit({ t: 'pending', p });
      }
    }
    resolvePending(p, i) {
      const pe = this.s.pending;
      if (!pe || pe.p !== p || !pe.options[i]) return false;
      this.s.pending = null;
      this.addToHand(p, pe.options[i]);
      this.resolveDeaths();
      return true;
    }

    /* ---------- efectos básicos ---------- */
    isLifesteal(src) {
      if (!src) return false;
      if (src.kind === 'minion') return src.lifesteal && !src.silenced;
      if (src.kind === 'hero') {
        const w = this.player(src.owner).weapon;
        return !!(w && this.def(w.cardId).keywords && this.def(w.cardId).keywords.includes('lifesteal'));
      }
      return false;
    }

    damage(src, t, n) {
      if (!t || n <= 0) return 0;
      if (t.kind === 'minion') {
        if (t.dead) return 0;
        if (t.divineShield) {
          t.divineShield = false;
          this.emit({ t: 'shieldPop', uid: t.uid });
          return 0;
        }
        t.health -= n;
        this.emit({ t: 'damage', uid: t.uid, n, src: src && src.uid });
        if (src && src.kind === 'minion' && src.poisonous) t.destroyed = true;
      } else {
        let rest = n;
        if (t.armor > 0) { const a = Math.min(t.armor, rest); t.armor -= a; rest -= a; }
        t.health -= rest;
        this.emit({ t: 'damage', uid: t.uid, n, src: src && src.uid });
      }
      if (this.isLifesteal(src)) this.heal(src, this.hero(src.owner), n);
      return n;
    }

    heal(src, t, n) {
      if (!t || n <= 0 || !this.alive(t)) return 0;
      const a = Math.min(n, t.maxHealth - t.health);
      if (a <= 0) return 0;
      t.health += a;
      this.emit({ t: 'heal', uid: t.uid, n: a });
      return a;
    }

    freeze(t) {
      if (!t || !this.alive(t)) return;
      t.frozen = true;
      t.frozenAt = this.s.turn;
      this.emit({ t: 'freeze', uid: t.uid });
    }

    buff(m, a, h) {
      if (!m || !this.alive(m)) return;
      m.attack += a; m.maxHealth += h; m.health += h;
      this.emit({ t: 'buff', uid: m.uid, a, h });
    }

    destroy(m) { if (m && m.kind === 'minion') m.destroyed = true; }

    silence(m) {
      if (!m || m.kind !== 'minion') return;
      for (const k of KW) m[k] = false;
      m.silenced = true; m.frozen = false;
      m.attack = m.baseAttack; m.maxHealth = m.baseHealth;
      m.health = Math.min(m.health, m.maxHealth);
      this.emit({ t: 'silence', uid: m.uid });
    }

    bounce(m) {
      if (!m || m.kind !== 'minion') return;
      const b = this.board(m.owner), i = b.indexOf(m);
      if (i < 0) return;
      b.splice(i, 1);
      this.emit({ t: 'bounce', uid: m.uid, p: m.owner });
      this.addToHand(m.owner, m.cardId);
    }

    transform(m, id) {
      const d = this.def(id);
      m.cardId = id;
      m.attack = m.baseAttack = d.attack;
      m.health = m.maxHealth = m.baseHealth = d.health;
      for (const k of KW) m[k] = !!(d.keywords && d.keywords.includes(k));
      m.silenced = false; m.frozen = false; m.destroyed = false;
      this.emit({ t: 'transform', uid: m.uid, cardId: id });
    }

    summon(p, id, pos) {
      const b = this.board(p);
      if (b.length >= MAX_BOARD) return null;
      const m = this.createMinion(p, id);
      b.splice(Math.max(0, Math.min(pos ?? b.length, b.length)), 0, m);
      this.emit({ t: 'summon', p, uid: m.uid });
      return m;
    }

    draw(p) {
      const pl = this.player(p);
      if (!pl.deck.length) {
        pl.fatigue++;
        this.emit({ t: 'fatigue', p, n: pl.fatigue });
        this.damage(null, pl.hero, pl.fatigue);
        return null;
      }
      const card = pl.deck.shift();
      if (pl.hand.length >= MAX_HAND) {
        this.emit({ t: 'burn', p, cardId: card.cardId });
        return null;
      }
      pl.hand.push(card);
      this.emit({ t: 'draw', p, uid: card.uid, cardId: card.cardId });
      return card;
    }

    addToHand(p, id) {
      const pl = this.player(p);
      if (pl.hand.length >= MAX_HAND) { this.emit({ t: 'burn', p, cardId: id }); return null; }
      const c = this.mkCard(id);
      pl.hand.push(c);
      this.emit({ t: 'draw', p, uid: c.uid, cardId: id, generated: true });
      return c;
    }

    gainArmor(p, n) { this.hero(p).armor += n; this.emit({ t: 'armor', uid: 'hero' + p, n }); }
    say(e, text) { if (e) this.emit({ t: 'say', uid: e.uid, text }); }
    missile(from, to, kind = 'bolita') { this.emit({ t: 'missile', from: from && from.uid, to: to && to.uid, kind }); }

    // Daño aleatorio repartido: misiles de 1 en 1
    randomSplash(p, n, minionsOnly = false) {
      for (let i = 0; i < n; i++) {
        const c = minionsOnly ? this.enemyMinions(p).filter((m) => this.alive(m)) : this.enemyChars(p);
        const t = this.pick(c);
        if (!t) return;
        this.missile(this.hero(p), t, 'garbanzo');
        this.damage(this.spellSrc(p), t, 1);
      }
    }

    /* ---------- muertes ---------- */
    resolveDeaths() {
      const s = this.s;
      for (let guard = 0; guard < 60; guard++) {
        const dead = [];
        for (const pi of [s.current, 1 - s.current]) {
          const b = this.board(pi);
          let removedBefore = 0;
          b.forEach((m, i) => {
            if (m.health <= 0 || m.destroyed) {
              dead.push({ m, pi, pos: i - removedBefore });
              removedBefore++;
            }
          });
        }
        if (!dead.length) break;
        for (const pi of [0, 1]) {
          const b = this.board(pi);
          for (let i = b.length - 1; i >= 0; i--) if (b[i].health <= 0 || b[i].destroyed) b.splice(i, 1);
        }
        for (const d of dead) { d.m.dead = true; this.emit({ t: 'death', uid: d.m.uid, p: d.pi, cardId: d.m.cardId }); }
        for (const d of dead) {
          const def = this.def(d.m.cardId);
          if (def.deathrattle && !d.m.silenced) def.deathrattle(this, { p: d.pi, self: d.m, pos: d.pos });
        }
      }
      this.checkOver();
    }

    checkOver() {
      const s = this.s;
      if (s.over) return;
      const d0 = this.hero(0).health <= 0, d1 = this.hero(1).health <= 0;
      if (d0 || d1) {
        s.over = true; s.phase = 'over'; s.pending = null;
        s.winner = d0 && d1 ? -1 : d0 ? 1 : 0;
        this.emit({ t: 'gameOver', winner: s.winner });
      }
    }

    /* Huella del estado para detectar desincronizaciones online */
    fingerprint() {
      const s = this.s;
      const parts = [s.turn, s.current, s.rng];
      for (const pl of s.players) {
        parts.push(pl.hero.health, pl.hero.armor, pl.mana, pl.hand.length, pl.deck.length, pl.traps.length);
        for (const m of pl.board) parts.push(m.cardId, m.attack, m.health);
      }
      return parts.join('|');
    }
  }

  /* Aplica una acción serializable (IA, red o repetición) */
  Game.prototype.apply = function (a) {
    switch (a.type) {
      case 'play': return this.playCard(a.p, a.uid, { pos: a.pos, target: a.target, choice: a.choice });
      case 'attack': return this.attack(a.p, a.a, a.t);
      case 'power': return this.heroPower(a.p, a.target);
      case 'end': return this.endTurn(a.p);
      case 'choose': return this.resolvePending(a.p, a.i);
      case 'mulligan': return this.mulligan(a.p, a.uids || []);
      case 'concede': return this.concede(a.p);
      default: return false;
    }
  };

  TW.Game = Game;
})();
