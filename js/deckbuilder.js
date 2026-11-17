/* Tupperwar — mis mazos y editor de mazos.
   Los mazos se guardan en este navegador y cada uno tiene un código «TW-...»
   que recupera exactamente las mismas cartas (y el nombre) en cualquier otro. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const UI = TW.UI;
  const esc = (s) => TW.esc(s);
  const $ = (s, el = document) => el.querySelector(s);
  const SIZE = 30;

  let backTo = null;

  function curveHTML(cards, big) {
    const c = TW.Decks.curve(cards), max = Math.max(4, ...c), H = big ? 64 : 24;
    return `<div class="curve ${big ? 'big' : ''}" aria-label="Curva de calorías">${c.map((n, i) =>
      `<div class="cv-col">${big ? `<span class="cv-n">${n || ''}</span>` : ''}<span class="cv-bar" style="height:${Math.max(2, Math.round((n / max) * H))}px"></span><span class="cv-c">${i === 7 ? '7+' : i}</span></div>`).join('')}</div>`;
  }

  function codeModal(deck) {
    const code = TW.Decks.encode(deck.cards, deck.name);
    const m = UI.modal(`<h2>Código de «${esc(deck.name || 'Sin nombre')}»</h2>
      <p>Guárdalo o compártelo. Pegándolo en <b>Mis mazos → Importar código</b> se recupera este mazo tal cual, en cualquier navegador.</p>
      <div class="code-box"><input readonly value="${esc(code)}" aria-label="Código del mazo"><button class="btn small" data-copycode>Copiar</button></div>`, 'small');
    const inp = m.querySelector('input');
    inp.addEventListener('focus', () => inp.select());
    m.querySelector('[data-copycode]').onclick = async (e) => {
      const ok = await UI.copy(code, inp);
      e.target.textContent = ok ? '¡Copiado!' : 'Selecciónalo y cópialo';
    };
  }

  /* ---------- lista de mazos ---------- */
  function deckBox(d, starter) {
    const v = TW.Decks.validate(d.cards);
    const fam = TW.Decks.themeOf(d.cards) || TW.Decks.topFamily(d.cards);
    const famInfo = fam && TW.FAMILIES[fam];
    return `<article class="deck-box ${v.ok ? '' : 'incomplete'}" style="--lid:${famInfo ? famInfo.color : '#9aa4b0'}" data-id="${d.id}">
      <div class="db-lid"></div>
      <div class="db-body">
        <div class="db-art">${TW.Art.svg(UI.deckCover(d.cards))}</div>
        <div class="db-info">
          <h3>${esc(d.name || 'Sin nombre')}</h3>
          <p class="db-sub">${v.ok ? (starter ? esc(d.blurb) : `30 cartas${famInfo ? ', tira a ' + famInfo.name : ''}`) : `Incompleto: ${d.cards.length} de 30 cartas`}</p>
          ${curveHTML(d.cards)}
        </div>
      </div>
      <div class="db-actions">
        ${starter ? `<button class="btn small" data-act="copyedit">Copiar y editar</button>` : `<button class="btn small" data-act="edit">Editar</button>`}
        <button class="btn small white" data-act="code" ${d.cards.length ? '' : 'disabled'}>Código</button>
        ${starter ? '' : `<button class="btn small white" data-act="del" aria-label="Borrar mazo">Borrar</button>`}
      </div>
    </article>`;
  }

  function openList(opts) {
    if (opts && opts.onBack) backTo = opts.onBack;
    const sc = $('#screen-decks');
    const draw = (msg) => {
      const saved = TW.Decks.loadSaved();
      sc.innerHTML = `<div class="page"><div class="wrap">
        <button class="btn small white back-btn" data-back>Volver</button>
        <h2 class="page-title">Mis mazos</h2>
        <p class="page-sub">Un mazo tiene 30 cartas: hasta 2 copias de cada una y 1 de cada legendaria.</p>
        <div class="deck-toolbar">
          <button class="btn red" data-new>Nuevo mazo</button>
          <form class="import" data-import><input id="imp-code" placeholder="Pega aquí un código TW-..." autocomplete="off" aria-label="Código de mazo"><button class="btn small" type="submit">Importar código</button></form>
        </div>
        ${msg ? `<p class="${msg.err ? 'err' : 'ok-msg'}">${esc(msg.text)}</p>` : ''}
        <h3 class="sec-title">Tus mazos</h3>
        ${saved.length ? `<div class="deck-grid">${saved.map((d) => deckBox(d)).join('')}</div>`
          : `<div class="empty-note">Aún no tienes mazos. Crea uno desde cero o copia uno de la casa y retócalo a tu gusto.</div>`}
        <h3 class="sec-title">Mazos de la casa</h3>
        <div class="deck-grid">${TW.Decks.STARTERS.map((d) => deckBox(d, true)).join('')}</div>
      </div></div>`;
    };
    draw();
    sc.onsubmit = (e) => {
      e.preventDefault();
      const r = TW.Decks.decode($('#imp-code').value);
      if (!r.ok) { draw({ err: true, text: r.error }); return; }
      const saved = TW.Decks.loadSaved();
      saved.unshift({ id: TW.Decks.newId(), name: r.name, cards: r.cards, updated: Date.now() });
      TW.Decks.saveAll(saved);
      draw({ text: r.complete ? `Mazo «${r.name}» importado. Ya puedes jugar con él.` : `Mazo «${r.name}» importado, pero está incompleto. Ábrelo para terminarlo.` });
      TW.Sfx.play('pop');
    };
    sc.onclick = async (e) => {
      if (e.target.closest('[data-back]')) { (backTo || TW.App.renderMenu)(); return; }
      if (e.target.closest('[data-new]')) { openEditor({ id: null, name: '', cards: [] }); return; }
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const id = btn.closest('[data-id]').dataset.id;
      const deck = TW.Decks.find(id);
      if (!deck) return;
      const act = btn.dataset.act;
      if (act === 'edit') openEditor(deck);
      if (act === 'copyedit') openEditor({ id: null, name: deck.name + ' (copia)', cards: [...deck.cards] });
      if (act === 'code') codeModal(deck);
      if (act === 'del' && (await UI.confirm(`¿Borrar el mazo «${esc(deck.name || 'Sin nombre')}»? Si no has guardado su código, no se podrá recuperar.`, 'Borrar', 'Cancelar'))) {
        TW.Decks.saveAll(TW.Decks.loadSaved().filter((d) => d.id !== id));
        draw({ text: 'Mazo borrado.' });
      }
    };
    UI.show('decks');
  }

  /* ---------- editor ---------- */
  function openEditor(deck) {
    const sc = $('#screen-decks');
    const st = { id: deck.id, name: deck.name || '', cards: TW.Decks.sort(deck.cards), dirty: false };
    const f = { q: '', cost: 'all', type: 'all', fam: 'all' };
    const count = () => { const c = {}; for (const id of st.cards) c[id] = (c[id] || 0) + 1; return c; };

    sc.innerHTML = `<div class="page editor"><div class="ed-layout">
      <section class="ed-coll">
        <div class="ed-head">
          <button class="btn small white" data-back>Volver</button>
          <h2>Editor de mazos</h2>
          <p class="ed-hint">Toca una carta para añadirla. Clic derecho para verla en grande.</p>
        </div>
        <div class="ed-filters">
          <input class="ed-search" placeholder="Buscar por nombre o texto" aria-label="Buscar carta">
          <div class="chips" data-f="cost">${['all', '0', '1', '2', '3', '4', '5', '6', '7'].map((c) => `<button class="chip ${c === 'all' ? 'on' : ''}" data-v="${c}">${c === 'all' ? 'Todo' : c === '7' ? '7+' : c}</button>`).join('')}</div>
          <div class="chips" data-f="type">${[['all', 'Todo'], ['minion', 'Comida'], ['spell', 'Trucos'], ['trap', 'Trampas'], ['weapon', 'Utensilios']].map(([k, l]) => `<button class="chip ${k === 'all' ? 'on' : ''}" data-v="${k}">${l}</button>`).join('')}</div>
          <div class="chips" data-f="fam">${[['all', 'Todas las familias'], ...Object.entries(TW.FAMILIES).map(([k, x]) => [k, x.name])].map(([k, l]) => `<button class="chip ${k === 'all' ? 'on' : ''}" data-v="${k}">${l}</button>`).join('')}</div>
        </div>
        <div class="ed-grid"></div>
      </section>
      <aside class="ed-side">
        <input class="ed-name" maxlength="30" placeholder="Nombre del mazo" aria-label="Nombre del mazo">
        <div class="ed-count"><span class="ec-n"></span><span class="ec-bar"><i></i></span></div>
        <div class="ed-curve"></div>
        <div class="ed-fams"></div>
        <ol class="ed-list"></ol>
        <div class="ed-btns">
          <button class="btn red" data-save>Guardar mazo</button>
          <button class="btn small white" data-fill>Completar al azar</button>
          <button class="btn small white" data-code>Ver código</button>
          <button class="btn small white" data-clear>Vaciar</button>
        </div>
        <p class="ed-msg" role="status"></p>
      </aside>
    </div></div>`;
    const grid = $('.ed-grid', sc), list = $('.ed-list', sc), nameInp = $('.ed-name', sc), msg = $('.ed-msg', sc);
    nameInp.value = st.name;

    const matches = (d) => {
      if (f.cost !== 'all' && !(f.cost === '7' ? d.cost >= 7 : d.cost === +f.cost)) return false;
      if (f.type !== 'all' && !(f.type === 'trap' ? !!d.trap : d.type === f.type && !d.trap)) return false;
      if (f.fam !== 'all' && d.fam !== f.fam && d.syn !== f.fam) return false;
      if (f.q) {
        const q = f.q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const hay = (d.name + ' ' + (d.text || '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (!hay.includes(q)) return false;
      }
      return true;
    };

    function drawGrid() {
      const c = count();
      const cards = TW.CARD_LIST.filter((d) => !d.token && matches(d)).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'es'));
      grid.innerHTML = cards.length ? cards.map((d) => {
        const n = c[d.id] || 0, max = TW.Decks.maxCopies(d);
        return `<button class="ed-card ${n >= max ? 'maxed' : ''}" data-add="${d.id}" aria-label="Añadir ${esc(d.name)}">${TW.cardHTML(d.id)}${n ? `<span class="ed-badge">${n}/${max}</span>` : ''}</button>`;
      }).join('') : '<p class="empty-note">Ninguna carta coincide con esos filtros.</p>';
    }

    function drawSide() {
      const c = count(), n = st.cards.length;
      $('.ec-n', sc).innerHTML = `<b>${n}</b> / ${SIZE} cartas`;
      $('.ec-bar i', sc).style.width = (n / SIZE) * 100 + '%';
      $('.ed-count', sc).classList.toggle('full', n === SIZE);
      $('.ed-curve', sc).innerHTML = curveHTML(st.cards, true);
      const fams = {};
      for (const id of st.cards) { const fm = TW.CARDS[id].fam; if (fm) fams[fm] = (fams[fm] || 0) + 1; }
      $('.ed-fams', sc).innerHTML = Object.entries(TW.FAMILIES).map(([k, x]) => `<span class="fam-pill" style="--fam:${x.color}">${x.name} <b>${fams[k] || 0}</b></span>`).join('');
      const ids = Object.keys(c).sort((a, b) => TW.CARDS[a].cost - TW.CARDS[b].cost || TW.CARDS[a].name.localeCompare(TW.CARDS[b].name, 'es'));
      list.innerHTML = ids.length ? ids.map((id) => {
        const d = TW.CARDS[id];
        return `<li><button class="ed-row r-${d.rarity}" data-remove="${id}" aria-label="Quitar ${esc(d.name)}">
          <span class="er-cost">${d.cost}</span><span class="er-name">${esc(d.name)}</span><span class="er-art">${TW.Art.svg(id)}</span>${c[id] > 1 ? `<span class="er-n">×${c[id]}</span>` : d.rarity === 'legendaria' ? '<span class="er-n leg">★</span>' : ''}</button></li>`;
      }).join('') : '<li class="ed-empty">Tu mazo está vacío. Toca cartas de la izquierda para añadirlas.</li>';
      $('[data-code]', sc).disabled = !n;
    }

    const say = (text, err) => { msg.textContent = text; msg.className = 'ed-msg ' + (err ? 'err' : 'ok-msg'); };
    const redraw = () => { drawGrid(); drawSide(); };
    redraw();

    function add(id) {
      const d = TW.CARDS[id], c = count();
      if (st.cards.length >= SIZE) { say('El mazo ya tiene 30 cartas. Quita alguna para meter otra.', true); TW.Sfx.play('error'); return; }
      if ((c[id] || 0) >= TW.Decks.maxCopies(d)) { say(d.rarity === 'legendaria' ? 'Las legendarias solo pueden ir una vez.' : 'Ya tienes las 2 copias permitidas.', true); TW.Sfx.play('error'); return; }
      st.cards = TW.Decks.sort([...st.cards, id]); st.dirty = true; say('');
      TW.Sfx.play('card');
      redraw();
      const row = list.querySelector(`[data-remove="${id}"]`);
      if (row) row.animate([{ background: '#fff3b0' }, { background: 'transparent' }], { duration: 600 });
    }
    function remove(id) {
      const i = st.cards.indexOf(id);
      if (i < 0) return;
      st.cards.splice(i, 1); st.dirty = true; say('');
      TW.Sfx.play('pop');
      redraw();
    }
    function save() {
      st.name = nameInp.value.trim() || 'Mazo sin nombre';
      nameInp.value = st.name;
      const saved = TW.Decks.loadSaved();
      if (!st.id) st.id = TW.Decks.newId();
      const entry = { id: st.id, name: st.name, cards: [...st.cards], updated: Date.now() };
      const i = saved.findIndex((d) => d.id === st.id);
      if (i >= 0) saved[i] = entry; else saved.unshift(entry);
      if (!TW.Decks.saveAll(saved)) { say('No se ha podido guardar: el navegador no permite almacenamiento.', true); return false; }
      st.dirty = false;
      say(st.cards.length === SIZE ? 'Guardado. Ya puedes elegirlo antes de jugar.' : `Guardado, pero le faltan ${SIZE - st.cards.length} cartas para poder jugar con él.`);
      TW.Sfx.play('pop');
      return true;
    }

    nameInp.addEventListener('input', () => { st.dirty = true; });
    $('.ed-search', sc).addEventListener('input', (e) => { f.q = e.target.value.trim(); drawGrid(); });
    sc.onsubmit = null;
    sc.oncontextmenu = (e) => {
      const card = e.target.closest('[data-add]') || e.target.closest('[data-remove]');
      if (!card) return;
      e.preventDefault();
      TW.zoomCard && TW.zoomCard(card.dataset.add || card.dataset.remove);
    };
    sc.onclick = async (e) => {
      const chip = e.target.closest('.chips .chip');
      if (chip) {
        const box = chip.closest('[data-f]');
        f[box.dataset.f] = chip.dataset.v;
        box.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === chip));
        drawGrid();
        return;
      }
      const a = e.target.closest('[data-add]');
      if (a) { add(a.dataset.add); return; }
      const r = e.target.closest('[data-remove]');
      if (r) { remove(r.dataset.remove); return; }
      if (e.target.closest('[data-save]')) { save(); return; }
      if (e.target.closest('[data-fill]')) {
        if (st.cards.length >= SIZE) { say('El mazo ya está completo.'); return; }
        st.cards = TW.Decks.fill(st.cards); st.dirty = true; redraw();
        say('Completado con cartas que encajan con lo que ya tenías. Revísalo y guarda.');
        return;
      }
      if (e.target.closest('[data-clear]')) {
        if (st.cards.length && (await UI.confirm('¿Quitar todas las cartas del mazo?', 'Vaciar', 'Cancelar'))) { st.cards = []; st.dirty = true; redraw(); }
        return;
      }
      if (e.target.closest('[data-code]')) { codeModal({ name: nameInp.value.trim() || 'Mazo sin nombre', cards: st.cards }); return; }
      if (e.target.closest('[data-back]')) {
        if (st.dirty && st.cards.length) {
          const keep = await UI.confirm('Tienes cambios sin guardar. ¿Los guardas antes de salir?', 'Guardar', 'Salir sin guardar');
          if (keep && !save()) return;
        }
        openList();
      }
    };
    UI.show('decks');
  }

  TW.DeckBuilder = { openList, openEditor, codeModal };
})();
