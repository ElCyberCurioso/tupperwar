/* Tupperwar — HTML de cartas y piezas reutilizables (mano, colección, vistas previas). */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  function nameSize(name) {
    const l = name.length;
    return l <= 13 ? 'n-s' : l <= 19 ? 'n-m' : 'n-l';
  }

  /* o: { attack, health, maxHealth, baseAttack, baseHealth, durability, cost, extraClass } */
  TW.cardHTML = function (id, o = {}) {
    const d = TW.CARDS[id];
    const cost = o.cost ?? d.cost;
    const text = d.text ? `<p>${fmt(d.text)}</p>` : `<p class="flav">${esc(d.flavor)}</p>`;
    let stats = '';
    if (d.type === 'minion') {
      const a = o.attack ?? d.attack, h = o.health ?? d.health;
      const ac = a > d.attack ? 'up' : a < d.attack ? 'down' : '';
      const hc = o.maxHealth !== undefined && h < o.maxHealth ? 'down' : h > d.health ? 'up' : '';
      stats = `<div class="c-atk ${ac}"><span>${a}</span></div><div class="c-hp ${hc}"><span>${h}</span></div>`;
    } else if (d.type === 'weapon') {
      const a = o.attack ?? d.attack, du = o.durability ?? d.durability;
      stats = `<div class="c-atk"><span>${a}</span></div><div class="c-dur ${du < d.durability ? 'down' : ''}"><span>${du}</span></div>`;
    }
    const fam = d.fam && TW.FAMILIES[d.fam];
    const kind = d.type !== 'minion' ? `<div class="c-kind">${d.trap ? 'Trampa' : TW.TYPE_NAME[d.type]}</div>`
      : fam ? `<div class="c-kind fam" style="--fam:${fam.color}">${fam.name}</div>` : '';
    return `<div class="card t-${d.type} r-${d.rarity} ${o.extraClass || ''}" data-card="${d.id}">
      <div class="c-shell">
        <div class="c-lid"></div>
        <div class="c-art">${TW.Art.svg(d.id)}</div>
        <div class="c-tape ${nameSize(d.name)}"><span>${esc(d.name)}</span></div>
        <div class="c-text">${text}</div>
        ${kind}
      </div>
      <div class="c-cost ${cost < d.cost ? 'up' : ''}"><span>${cost}</span></div>
      ${stats}
    </div>`;
  };

  TW.cardBackHTML = function () {
    return `<div class="card back"><div class="c-shell"><div class="back-logo">T</div></div></div>`;
  };

  // Notas laterales: palabras clave y texto de ambientación
  TW.notesHTML = function (id, extra = []) {
    const d = TW.CARDS[id];
    const kws = (d.kw || []).map((k) => TW.KEYWORDS[k]).filter(Boolean);
    let h = kws.map((k) => `<div class="kw-note"><b>${esc(k.name)}</b><span>${esc(k.desc)}</span></div>`).join('');
    for (const e of extra) h += `<div class="kw-note"><b>${esc(e.name)}</b><span>${esc(e.desc)}</span></div>`;
    if (d.fam) h += `<div class="kw-note"><b>Familia: ${TW.FAMILIES[d.fam].name}</b><span>Algunas cartas mejoran a las de esta familia o se hacen más fuertes con ellas.</span></div>`;
    if (d.text && d.flavor) h += `<div class="flavor-note">${esc(d.flavor)}</div>`;
    return h;
  };

  TW.heroPowerHTML = function (heroId, used) {
    const h = TW.HEROES[heroId];
    const icon = { abuela: 'caldito', toni: 'ajeno', chef: 'microbrote', michi: 'hero_michi' }[heroId];
    return `<div class="hp-face ${used ? 'used' : ''}">${TW.Art.svg(icon)}</div><div class="hp-cost"><span>${h.power.cost}</span></div>`;
  };

  TW.powerNoteHTML = function (heroId) {
    const h = TW.HEROES[heroId];
    return `<div class="power-card"><div class="pc-title">${esc(h.power.name)}</div><div class="pc-cost">${h.power.cost} calorías</div><p>${fmt(h.power.text)}</p><div class="pc-who">Poder de ${esc(h.name)}</div></div>`;
  };

  TW.esc = esc;
  TW.fmt = fmt;
})();
