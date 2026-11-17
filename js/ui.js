/* Tupperwar — piezas de interfaz compartidas: pantallas, diálogos, avisos,
   selector de héroe (con su habilidad siempre visible) y selector de mazo. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const esc = (s) => TW.esc(s);

  const UI = (TW.UI = {
    current: null,

    show(id) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === 'screen-' + id));
      UI.current = id;
      const hint = document.querySelector('.rotate-hint');
      if (hint) hint.classList.toggle('show', id === 'game');
      const sc = document.getElementById('screen-' + id);
      if (sc) sc.scrollTop = 0;
    },

    modal(html, cls = '', opts = {}) {
      const b = document.createElement('div');
      b.className = 'modal-back';
      const closeBtn = opts.noClose ? '' : '<p class="modal-foot"><button class="btn small white" data-close>Cerrar</button></p>';
      b.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}${closeBtn}</div>`;
      document.body.appendChild(b);
      const close = () => { b.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      b.addEventListener('click', (e) => { if (e.target === b || e.target.closest('[data-close]')) close(); });
      document.addEventListener('keydown', onKey);
      b.close = close;
      return b;
    },

    confirm(text, okLabel = 'Sí', cancelLabel = 'No') {
      return new Promise((res) => {
        let answered = false;
        const m = UI.modal(`<p class="confirm-text">${text}</p><div class="confirm-row"><button class="btn red" data-ok>${esc(okLabel)}</button><button class="btn white" data-no>${esc(cancelLabel)}</button></div>`,
          'small', { noClose: true, onClose: () => { if (!answered) res(false); } });
        m.querySelector('[data-ok]').onclick = () => { answered = true; m.close(); res(true); };
        m.querySelector('[data-no]').onclick = () => { answered = true; m.close(); res(false); };
      });
    },

    toast(text, kind = '') {
      let t = document.querySelector('.toast');
      if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.className = 'toast on ' + kind;
      t.textContent = text;
      clearTimeout(t._h);
      t._h = setTimeout(() => t.classList.remove('on'), 2400);
    },

    async copy(text, input) {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) {
        if (input) { input.select(); try { return document.execCommand('copy'); } catch (x) { return false; } }
        return false;
      }
    },

    /* ---------- héroes ---------- */
    heroDetailHTML(id) {
      if (!id || id === 'random') {
        return `<div class="hd-top"><div class="hd-ph random">?</div><div><div class="hd-name">Al azar</div><div class="hd-title">Que decida la nevera</div></div></div>
          <div class="hd-power"><div class="hd-pw-head"><span class="hd-pw-name">Sorpresa</span></div><p>Te toca uno de los ${TW.HERO_LIST.length} héroes, cada uno con su habilidad.</p></div>`;
      }
      const h = TW.HEROES[id];
      return `<div class="hd-top"><div class="hd-ph">${TW.Art.hero(id)}</div><div><div class="hd-name">${esc(h.name)}</div><div class="hd-title">${esc(h.title)}</div></div></div>
        <div class="hd-power">
          <div class="hd-pw-head"><span class="hd-pw-icon">${TW.Art.svg(TW.POWER_ICON[id] || 'hero_' + id)}<b>${h.power.cost}</b></span>
            <span><span class="hd-pw-label">Habilidad</span><span class="hd-pw-name">${esc(h.power.name)}</span></span></div>
          <p>${TW.fmt(h.power.text)}</p>
          <div class="hd-pw-cost">Cuesta ${h.power.cost} ${h.power.cost === 1 ? 'caloría' : 'calorías'}. Se puede usar una vez por turno.</div>
        </div>
        <p class="hd-quote">«${esc(h.hello)}»</p>`;
    },

    heroPickerHTML(sel) {
      const tiles = [...TW.HERO_LIST, 'random'].map((id) => {
        const h = TW.HEROES[id];
        return `<button class="hero-tile ${sel === id ? 'on' : ''}" data-hero="${id}" aria-pressed="${sel === id}">
          <span class="ht-ph ${id === 'random' ? 'random' : ''}">${id === 'random' ? '?' : TW.Art.hero(id)}</span>
          <span class="ht-name">${id === 'random' ? 'Al azar' : esc(h.name)}</span></button>`;
      }).join('');
      return `<div class="hero-picker"><div class="hp-grid">${tiles}</div><aside class="hero-detail" aria-live="polite">${UI.heroDetailHTML(sel)}</aside></div>`;
    },

    // Al pasar por encima de un héroe, la ficha enseña su habilidad; al salir, vuelve al elegido
    bindHeroPicker(root, getSel) {
      const pick = root.querySelector('.hero-picker');
      if (!pick) return;
      const detail = pick.querySelector('.hero-detail');
      let shown = null;
      const set = (id) => { if (id !== shown) { shown = id; detail.innerHTML = UI.heroDetailHTML(id); } };
      shown = getSel();
      pick.addEventListener('pointerover', (e) => { const t = e.target.closest('[data-hero]'); if (t) set(t.dataset.hero); });
      pick.addEventListener('focusin', (e) => { const t = e.target.closest('[data-hero]'); if (t) set(t.dataset.hero); });
      pick.querySelector('.hp-grid').addEventListener('pointerleave', () => set(getSel()));
    },

    /* ---------- mazos ---------- */
    deckCover(cards) {
      let best = null;
      for (const id of cards) {
        const d = TW.CARDS[id];
        if (d && d.type === 'minion' && (!best || d.cost > best.cost || (d.cost === best.cost && d.rarity === 'legendaria'))) best = d;
      }
      return best ? best.id : 'tupper';
    },

    deckChooserHTML(selId) {
      const saved = TW.Decks.loadSaved();
      const tile = (id, name, sub, cover, ok = true, extra = '') =>
        `<button class="deck-tile ${selId === id ? 'on' : ''} ${ok ? '' : 'off'}" data-deck="${id}" ${ok ? '' : 'disabled'} aria-pressed="${selId === id}">
          <span class="dt-art">${cover ? TW.Art.svg(cover) : '<span class="dt-q">?</span>'}</span>
          <span class="dt-txt"><span class="dt-name">${esc(name)}</span><span class="dt-sub">${esc(sub)}</span></span>${extra}</button>`;
      const famName = (cards) => { const f = TW.Decks.themeOf(cards) || TW.Decks.topFamily(cards); return f && TW.FAMILIES[f] ? `tira a ${TW.FAMILIES[f].name}` : 'variado'; };
      let h = tile('random', 'Al azar', 'Uno nuevo cada partida', null);
      for (const d of TW.Decks.STARTERS) h += tile(d.id, d.name, 'De la casa, ' + famName(d.cards), UI.deckCover(d.cards));
      for (const d of saved) {
        const ok = TW.Decks.validate(d.cards).ok;
        h += tile(d.id, d.name || 'Sin nombre', ok ? 'Tuyo, ' + famName(d.cards) : `Incompleto: ${d.cards.length}/30`, UI.deckCover(d.cards), ok);
      }
      return `<div class="deck-chooser">${h}<button class="deck-tile new" data-newdeck><span class="dt-art plus">+</span><span class="dt-txt"><span class="dt-name">Crear mazo</span><span class="dt-sub">Abre el editor</span></span></button></div>`;
    },
  });
})();
