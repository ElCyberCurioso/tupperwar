/* Tupperwar — IA rival.
   Codiciosa con simulación: prueba cada jugada legal sobre una copia del estado,
   puntúa el resultado y se queda con la mejor mientras mejore la posición.
   Las copias usan una semilla nueva, así que la IA no puede «ver el futuro» del RNG. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});

  const heroVal = (h) => (h <= 0 ? -1e5 : 12 * Math.log(1 + h));

  function minionVal(m) {
    const d = TW.CARDS[m.cardId];
    let v = m.attack * 1.1 + m.health * 0.9 + 1;
    if (m.attack === 0) v -= 1;
    if (m.taunt) v += 1.2 + m.health * 0.15;
    if (m.divineShield) v += 1 + m.attack * 0.6;
    if (m.poisonous) v += 2.5;
    if (m.windfury) v += m.attack * 0.7;
    if (m.stealth) v += 0.8;
    if (m.lifesteal) v += m.attack * 0.5;
    if (m.cleave) v += m.attack * 0.5;
    if (m.trample) v += m.attack * 0.3;
    if (m.ranged) v += m.attack * 0.6;
    if (!m.silenced) {
      if (d.deathrattle) v += 1.8;
      if (d.endOfTurn) v += 2.5;
      if (d.onDamaged) v += 1.2;
    }
    if (m.frozen) v -= m.attack * 0.4;
    return Math.max(0.5, v);
  }

  function potentialDamage(pl) {
    let n = 0;
    for (const m of pl.board) if (!m.frozen) n += m.attack * (m.windfury ? 2 : 1);
    if (pl.weapon && !pl.hero.frozen) n += pl.weapon.attack;
    return n;
  }

  function evaluate(s, p) {
    if (s.over) return s.winner === p ? 1e5 : s.winner === -1 ? -5e4 : -1e5;
    const me = s.players[p], op = s.players[1 - p];
    let v = 0;
    for (const m of me.board) v += minionVal(m);
    for (const m of op.board) v -= minionVal(m) * 1.05;
    v += heroVal(me.hero.health + me.hero.armor) - heroVal(op.hero.health + op.hero.armor);
    v += me.hand.length * 1.0 - op.hand.length * 1.0;
    if (me.weapon) v += me.weapon.attack * me.weapon.durability * 0.55;
    if (op.weapon) v -= op.weapon.attack * op.weapon.durability * 0.55;
    if (s.pending) v += 1.5; // un Descubre pendiente es una carta casi segura
    v += me.traps.length * 2.6; // una trampa preparada vale aunque no toque el tablero
    for (const c of me.hand) if (c.bonus) v += c.bonus * 0.5;
    const myHp = me.hero.health + me.hero.armor;
    const hasTaunt = me.board.some((m) => m.taunt);
    if (!hasTaunt && potentialDamage(op) >= myHp) v -= 40;
    return v;
  }

  function enumerate(g, p) {
    const pl = g.player(p), acts = [];
    for (const card of pl.hand) {
      if (!g.canPlay(p, card.uid)) continue;
      const d = g.def(card.cardId);
      const spec = g.targetSpec(p, card);
      const targets = spec ? g.targetsFor(p, spec).map((t) => t.uid) : [null];
      const choices = d.chooseOne ? [0, 1] : [undefined];
      for (const t of targets) for (const ch of choices) {
        acts.push({ type: 'play', p, uid: card.uid, pos: pl.board.length, target: t, choice: ch, cardId: d.id });
      }
    }
    for (const a of [pl.hero, ...pl.board]) {
      if (!g.canAttack(a)) continue;
      for (const t of g.attackTargets(a)) acts.push({ type: 'attack', p, a: a.uid, t: t.uid });
    }
    if (g.canHeroPower(p)) {
      const spec = g.heroPowerSpec(p);
      const targets = spec ? g.targetsFor(p, spec).map((t) => t.uid) : [null];
      for (const t of targets) acts.push({ type: 'power', p, target: t });
    }
    return acts;
  }

  function simulate(g, act) {
    const c = g.clone();
    c.s.rng = TW.randomSeed() | 0;
    c.player(1 - act.p).traps = []; // la IA no sabe qué trampas tiene el rival
    return c.apply(act) ? c : null;
  }

  function bestFollowUp(g, p) {
    const base = evaluate(g.s, p);
    let best = 0;
    for (const a of enumerate(g, p)) {
      const c = simulate(g, a);
      if (c) best = Math.max(best, evaluate(c.s, p) - base);
    }
    return best;
  }

  TW.AI = {
    evaluate,
    enumerate,

    chooseAction(g, p, level = 'normal') {
      if (!g.canAct(p)) return null;
      const base = evaluate(g.s, p);
      const noise = level === 'facil' ? 3.5 : 0;
      let best = null, bestVal = 0.2;
      for (const act of enumerate(g, p)) {
        // Las jugadas aleatorias se promedian con dos simulaciones
        const runs = act.type === 'play' && /pimiento|tupper|garbanzos|ketchup|nevera|ajeno/.test(act.cardId || '') ? 2 : 1;
        let v = 0, ok = true;
        for (let r = 0; r < runs; r++) {
          const c = simulate(g, act);
          if (!c) { ok = false; break; }
          let dv = evaluate(c.s, p) - base;
          // Jugadas «de preparación» (cupón, zarpazo): mirar un paso más allá
          const prep = (act.type === 'play' && act.cardId === 'cupon') || (act.type === 'power' && g.player(p).heroId === 'michi');
          if (prep && dv < 1 && !c.s.over) dv = dv * 0.3 + bestFollowUp(c, p) * 0.9 - 0.3;
          v += dv / runs;
        }
        if (!ok) continue;
        if (noise) v += (Math.random() - 0.5) * noise;
        if (v > bestVal) { bestVal = v; best = act; }
      }
      if (level === 'facil' && best && Math.random() < 0.12) return null;
      return best;
    },

    pickDiscover(g, p, options) {
      const pl = g.player(p);
      let bi = 0, bv = -1e9;
      options.forEach((id, i) => {
        const d = TW.CARDS[id];
        const fits = d.cost <= Math.max(pl.maxMana + 2, 3) ? 1 : 0;
        const v = fits * 10 + d.cost + (d.rarity === 'legendaria' ? 2 : d.rarity === 'epica' ? 1 : 0);
        if (v > bv) { bv = v; bi = i; }
      });
      return bi;
    },

    mulligan(g, p) {
      return g.player(p).hand.filter((c) => g.def(c.cardId).cost >= 4).map((c) => c.uid);
    },
  };
})();
