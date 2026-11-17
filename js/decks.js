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

    // Mazos guardados en este navegador: [{ id, name, cards, updated }]
    loadSaved() {
      try {
        const list = JSON.parse(localStorage.getItem('tw.decks') || '[]');
        return Array.isArray(list) ? list.filter((d) => d && Array.isArray(d.cards)).map((d) => ({ ...d, cards: d.cards.filter((id) => TW.CARDS[id] && !TW.CARDS[id].token) })) : [];
      } catch (e) { return []; }
    },
    saveAll(decks) {
      try { localStorage.setItem('tw.decks', JSON.stringify(decks)); return true; } catch (e) { return false; }
    },
    newId: () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),

    // Todos los mazos que se pueden elegir: los de la casa y los del jugador
    all() { return [...STARTERS.map((d) => ({ ...d, starter: true })), ...this.loadSaved()]; },
    find(id) { return this.all().find((d) => d.id === id) || null; },
    // Lista de cartas de un mazo elegido, o uno al azar si no existe o está incompleto
    resolve(id, seed) {
      const d = id && id !== 'random' ? this.find(id) : null;
      return d && this.validate(d.cards).ok ? this.sort(d.cards) : this.random(seed);
    },

    /* ---------- códigos de mazo ----------
       Formato: «TW-» + base64url de [versión, nº de cartas sueltas, índices..., nº de cartas dobles,
       índices..., longitud del nombre, nombre en UTF-8..., suma de control].
       Los índices salen de CODE_IDS: las cartas nuevas se añaden siempre al final para no romper códigos antiguos. */
    encode(cards, name = '') {
      const count = {};
      for (const id of cards) count[id] = (count[id] || 0) + 1;
      const singles = [], doubles = [];
      for (const [id, n] of Object.entries(count)) {
        const i = CODE_IDS.indexOf(id);
        if (i < 0) continue;
        (n >= 2 ? doubles : singles).push(i);
      }
      singles.sort((x, y) => x - y); doubles.sort((x, y) => x - y);
      const nameBytes = utf8(String(name).trim()).slice(0, 40);
      const bytes = [1, singles.length, ...singles, doubles.length, ...doubles, nameBytes.length, ...nameBytes];
      bytes.push(checksum(bytes));
      return 'TW-' + b64encode(bytes);
    },
    decode(text) {
      const m = String(text || '').replace(/\s+/g, '').match(/TW-([A-Za-z0-9_-]+)/);
      if (!m) return { ok: false, error: 'Eso no parece un código de mazo. Los códigos empiezan por «TW-».' };
      let bytes;
      try { bytes = b64decode(m[1]); } catch (e) { return { ok: false, error: 'El código está incompleto o mal copiado.' }; }
      if (bytes.length < 5 || checksum(bytes.slice(0, -1)) !== bytes[bytes.length - 1]) return { ok: false, error: 'El código está incompleto o mal copiado.' };
      if (bytes[0] !== 1) return { ok: false, error: 'Ese código es de otra versión del juego.' };
      let k = 1;
      const cards = [];
      const read = (copies) => {
        const n = bytes[k++];
        for (let j = 0; j < n; j++) {
          const id = CODE_IDS[bytes[k++]];
          if (!id || !TW.CARDS[id]) throw new Error('carta');
          for (let c = 0; c < copies; c++) cards.push(id);
        }
      };
      try { read(1); read(2); } catch (e) { return { ok: false, error: 'El código tiene cartas que no existen en esta versión del juego.' }; }
      const nl = bytes[k++] || 0;
      const name = utf8decode(bytes.slice(k, k + nl)) || 'Mazo importado';
      const v = this.validate(cards);
      return { ok: true, cards: this.sort(cards), name, complete: v.ok, errors: v.errors };
    },

    // Rellena un mazo incompleto respetando copias y una curva razonable
    fill(cards, seed) {
      const rng = new TW.RNG(seed ?? TW.randomSeed());
      const out = [...cards];
      const count = {};
      for (const id of out) count[id] = (count[id] || 0) + 1;
      const theme = this.themeOf(out) || this.topFamily(out);
      while (out.length < SIZE) {
        const curve = {};
        for (const id of out) { const c = Math.min(7, TW.CARDS[id].cost); curve[c] = (curve[c] || 0) + 1; }
        const want = CURVE.map(([lo, hi, n]) => [lo, hi, n - Object.entries(curve).filter(([c]) => +c >= lo && +c <= hi).reduce((a, [, v]) => a + v, 0)]);
        const gap = want.filter((w) => w[2] > 0).sort((x, y) => y[2] - x[2])[0];
        let pool = collectible().filter((d) => (count[d.id] || 0) < maxCopies(d) && (!gap || (d.cost >= gap[0] && d.cost <= gap[1])));
        if (!pool.length) pool = collectible().filter((d) => (count[d.id] || 0) < maxCopies(d));
        if (!pool.length) break;
        const fav = pool.filter((d) => theme && (d.fam === theme || d.syn === theme));
        const d = fav.length && rng.next() < 0.7 ? rng.pick(fav) : rng.pick(pool);
        out.push(d.id);
        count[d.id] = (count[d.id] || 0) + 1;
      }
      return this.sort(out);
    },
    topFamily(list) {
      const n = {};
      for (const id of list) { const d = TW.CARDS[id]; const f = d && (d.fam || d.syn); if (f) n[f] = (n[f] || 0) + 1; }
      const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
      return top ? top[0] : null;
    },
    curve(list) {
      const c = [0, 0, 0, 0, 0, 0, 0, 0];
      for (const id of list) c[Math.min(7, TW.CARDS[id].cost)]++;
      return c;
    },
  };

  /* Orden fijo para los códigos. ¡Solo se añade al final! */
  const CODE_IDS = ['miga', 'guisante', 'huevo', 'aceituna', 'ajo', 'cubito', 'ketchup', 'limon', 'salchicha', 'natillas', 'kiwi', 'maiz', 'yogur', 'pimiento',
    'croqueta', 'cebolla', 'queso', 'pan', 'bocata', 'tupper', 'berenjena', 'coliflor', 'pizza', 'sandia', 'chorizo', 'tortilla', 'jamon', 'pulpo', 'guisantes',
    'paella', 'pavo', 'lasana', 'tarta', 'lentejas', 'fabada', 'primigenio', 'sal', 'aluminio', 'nevera', 'ajeno', 'batido', 'garbanzos', 'vuelta', 'caldito',
    'siesta', 'asalto', 'microondas', 'caducidad', 'limpieza', 'brocoli', 'albondiga', 'morcilla', 'leche', 'kefir', 'quesocurado', 'kombucha', 'cocido',
    'mantequilla', 'nachos', 'patatas', 'alioli', 'huerto', 'barbacoa', 'nata', 'rodillo', 'salsa', 'platano', 'nota', 'wasabi', 'gamba', 'zanahoria', 'pollo',
    'bravas', 'yogurtera', 'fiambrera', 'helado', 'calabaza', 'costillar', 'chuleton', 'romperhielo', 'recalentar', 'fregado', 'tenedor', 'chancla', 'cuchara'];
  TW.Decks.CODE_IDS = CODE_IDS;

  function checksum(bytes) { let h = 7; for (const b of bytes) h = (h * 31 + b) & 0xff; return h; }
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64encode(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      const chars = i + 1 >= bytes.length ? 2 : i + 2 >= bytes.length ? 3 : 4;
      for (let j = 0; j < chars; j++) out += B64[(n >> (18 - 6 * j)) & 63];
    }
    return out;
  }
  function b64decode(str) {
    const out = [];
    let buf = 0, bits = 0;
    for (const ch of str) {
      const v = B64.indexOf(ch);
      if (v < 0) throw new Error('b64');
      buf = (buf << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 0xff); }
    }
    return out;
  }
  function utf8(s) {
    if (typeof TextEncoder !== 'undefined') return [...new TextEncoder().encode(s)];
    return [...unescape(encodeURIComponent(s))].map((c) => c.charCodeAt(0));
  }
  function utf8decode(b) {
    try {
      if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(new Uint8Array(b));
      return decodeURIComponent(escape(String.fromCharCode(...b)));
    } catch (e) { return ''; }
  }

  /* Mazos de la casa: uno por familia, listos para jugar o para copiar y retocar */
  const x2 = (...ids) => ids.flatMap((id) => [id, id]);
  const STARTERS = [
    { id: 'casa-verdura', name: 'Huerta Rebelde', theme: 'verdura', blurb: 'Verduras que se hacen fuertes juntas.',
      cards: [...x2('guisante', 'sal', 'limon', 'kiwi', 'zanahoria', 'brocoli', 'cebolla', 'huerto', 'coliflor', 'sandia', 'calabaza'), 'pimiento', 'berenjena', 'guisantes', 'microondas', 'asalto', 'caducidad', 'tarta', 'fabada'] },
    { id: 'casa-chicha', name: 'Carnicería Paco', theme: 'chicha', blurb: 'Carne con prisa: ataca pronto y no pares.',
      cards: [...x2('gamba', 'sal', 'salchicha', 'morcilla', 'patatas', 'barbacoa', 'salsa', 'albondiga', 'pollo', 'bocata', 'chorizo', 'jamon', 'costillar'), 'chancla', 'pulpo', 'pavo', 'chuleton'] },
    { id: 'casa-lacteo', name: 'Lácteos Peligrosos', theme: 'lacteo', blurb: 'Aguanta, congela y gana al final.',
      cards: [...x2('huevo', 'kefir', 'nata', 'cubito', 'natillas', 'leche', 'yogur', 'romperhielo', 'queso', 'quesocurado', 'helado'), 'mantequilla', 'yogurtera', 'siesta', 'asalto', 'microondas', 'caducidad', 'tarta', 'primigenio'] },
    { id: 'casa-guiso', name: 'Cocina de Cuchara', theme: 'guiso', blurb: 'Guisos contundentes y combos de bar.',
      cards: [...x2('alioli', 'sal', 'caldito', 'bravas', 'bocata', 'croqueta', 'pizza', 'nachos', 'cocido', 'lasana'), 'microondas', 'asalto', 'tupper', 'tortilla', 'cuchara', 'caducidad', 'paella', 'garbanzos', 'lentejas', 'fabada'] },
  ];
  TW.Decks.STARTERS = STARTERS;
})();
