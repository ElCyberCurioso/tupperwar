/* Tupperwar — mazos.
   De momento las partidas usan mazos aleatorios con una curva de calorías razonable.
   validate() ya aplica las reglas de construcción (30 cartas, 2 copias, 1 legendaria)
   para cuando llegue el editor de mazos personalizados. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const SIZE = 30;

  // Cuotas por franja de coste: [min, max, cuántas]
  const CURVE = [
    [0, 1, 5], [2, 2, 6], [3, 3, 6], [4, 4, 5], [5, 5, 3], [6, 6, 2], [7, 99, 3],
  ];

  const maxCopies = (d) => (TW.RARITY[d.rarity] || TW.RARITY.comun).copies;
  const collectible = () => TW.CARD_LIST.filter((c) => !c.token);

  TW.Decks = {
    SIZE,
    maxCopies,

    random(seed) {
      const rng = new TW.RNG(seed ?? TW.randomSeed());
      const theme = rng.pick(Object.keys(TW.FAMILIES));
      const count = {};
      const deck = [];
      const add = (d) => { deck.push(d.id); count[d.id] = (count[d.id] || 0) + 1; };
      const available = (d) => (count[d.id] || 0) < maxCopies(d);
      let missing = 0;
      for (const [lo, hi, n] of CURVE) {
        const pool = [];
        for (const d of collectible()) if (d.cost >= lo && d.cost <= hi) for (let i = 0; i < maxCopies(d); i++) pool.push(d);
        rng.shuffle(pool);
        // Las cartas del tema del mazo tienen preferencia (no garantía)
        const fav = [], rest = [];
        for (const d of pool) ((d.fam === theme || d.syn === theme) && rng.next() < 0.8 ? fav : rest).push(d);
        pool.length = 0; pool.push(...fav, ...rest);
        let taken = 0;
        for (const d of pool) {
          if (taken >= n) break;
          if (available(d)) { add(d); taken++; }
        }
        missing += n - taken;
      }
      while (missing-- > 0) {
        const left = collectible().filter(available);
        if (!left.length) break;
        add(rng.pick(left));
      }
      return this.sort(deck);
    },

    // Familia dominante de un mazo (para contarle al jugador qué le ha tocado)
    themeOf(list) {
      const n = {};
      for (const id of list) { const d = TW.CARDS[id]; const f = d && (d.fam || d.syn); if (f) n[f] = (n[f] || 0) + 1; }
      const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
      return top && top[1] >= 8 ? top[0] : null;
    },

    sort(list) {
      return [...list].sort((a, b) => TW.CARDS[a].cost - TW.CARDS[b].cost || TW.CARDS[a].name.localeCompare(TW.CARDS[b].name, 'es'));
    },

    validate(list) {
      const errors = [];
      if (list.length !== SIZE) errors.push(`El mazo debe tener ${SIZE} cartas (tiene ${list.length}).`);
      const count = {};
      for (const id of list) {
        const d = TW.CARDS[id];
        if (!d || d.token) { errors.push(`Carta no válida: ${id}`); continue; }
        count[id] = (count[id] || 0) + 1;
        if (count[id] === maxCopies(d) + 1) errors.push(`Demasiadas copias de ${d.name} (máximo ${maxCopies(d)}).`);
      }
      return { ok: !errors.length, errors };
    },

    // Mazos guardados (preparado para el futuro editor)
    loadSaved() {
      try { return JSON.parse(localStorage.getItem('tw.decks') || '[]'); } catch (e) { return []; }
    },
    saveAll(decks) {
      try { localStorage.setItem('tw.decks', JSON.stringify(decks)); return true; } catch (e) { return false; }
    },
  };
})();
