/* Tupperwar — ilustraciones vectoriales.
   Cada carta tiene una caricatura en SVG (lienzo 200×200) dibujada con un kit común:
   contorno de tinta berenjena, colores planos y ojos saltones cuyas pupilas (.pupil)
   siguen al puntero gracias a las variables CSS --lx / --ly. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const INK = '#2b1e3f';
  const MOUTH = '#7a1f2b', TONGUE = '#ff7d8e';
  const n = (v) => Math.round(v * 10) / 10;
  const st = (w = 4, c = INK) => (w ? `stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"` : 'stroke="none"');
  const P = (d, fill = 'none', w = 4, x = '') => `<path d="${d}" fill="${fill}" ${st(w)} ${x}/>`;
  const Ln = (d, color, w = 3, x = '') => `<path d="${d}" fill="none" ${st(w, color)} ${x}/>`;
  const C = (cx, cy, r, fill, w = 4, x = '') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" ${st(w)} ${x}/>`;
  const E = (cx, cy, rx, ry, fill, w = 4, x = '') => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" ${st(w)} ${x}/>`;
  const R = (x, y, w, h, rx, fill, sw = 4, ex = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}" fill="${fill}" ${st(sw)} ${ex}/>`;
  const G = (tr, inner) => `<g transform="${tr}">${inner}</g>`;
  const T = (x, y, txt, size, fill, font = 'Fredoka', x2 = '') =>
    `<text x="${x}" y="${y}" font-family="${font}, 'Comic Sans MS', sans-serif" font-weight="700" font-size="${size}" fill="${fill}" text-anchor="middle" ${x2}>${txt}</text>`;
  const shine = (cx, cy, rx, ry, rot = -30, op = 0.55) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  const bg = (c1, c2) => `<rect x="-10" y="-10" width="220" height="220" fill="${c1}"/><circle cx="100" cy="106" r="82" fill="${c2}"/>`;
  const rays = (color, k = 14) => {
    let s = '';
    for (let i = 0; i < k; i++) {
      const a1 = (i / k) * Math.PI * 2, a2 = a1 + Math.PI / k;
      s += `<path d="M100 106 L${n(100 + Math.cos(a1) * 160)} ${n(106 + Math.sin(a1) * 160)} L${n(100 + Math.cos(a2) * 160)} ${n(106 + Math.sin(a2) * 160)} Z" fill="${color}"/>`;
    }
    return s;
  };

  /* ---------- ojos saltones ---------- */
  function lid(x, y, r, l, rr, fill) {
    r += 1.5;
    const ly = y + l * r, ry = y + rr * r;
    const lx = x - Math.sqrt(Math.max(0, r * r - (l * r) ** 2));
    const rx = x + Math.sqrt(Math.max(0, r * r - (rr * r) ** 2));
    const large = (l + rr) / 2 > 0 ? 1 : 0;
    return `<path d="M${n(lx)} ${n(ly)} A${n(r)} ${n(r)} 0 ${large} 1 ${n(rx)} ${n(ry)} Z" fill="${fill}" ${st(3)}/>`;
  }
  function eye(x, y, r, o = {}) {
    const pr = o.pr || r * 0.5;
    const m = Math.max(0, r - pr - 1.8);
    const dx = (o.dx || 0) * m, dy = (o.dy || 0) * m;
    let s = C(x, y, r, o.sclera || '#fff', 3);
    s += `<g class="pupil" style="--m:${n(m)}">${C(x + dx, y + dy, pr, INK, 0)}${C(x + dx - pr * 0.38, y + dy - pr * 0.38, pr * 0.34, '#fff', 0)}</g>`;
    if (o.lid) s += lid(x, y, r, o.lid[0], o.lid[1], o.skin || '#ddd');
    return s;
  }
  const MOODS = {
    angry: [[-0.9, -0.15], [-0.15, -0.9]],
    sad: [[-0.15, -0.85], [-0.85, -0.15]],
    sleepy: [[0.05, 0.05], [0.05, 0.05]],
    smug: [[-0.35, -0.35], [-0.35, -0.35]],
    bored: [[-0.05, -0.05], [-0.05, -0.05]],
  };
  function eyes(x, y, o = {}) {
    const gap = o.gap ?? 28, r = o.r ?? 12, r2 = o.r2 ?? r;
    const lids = o.mood ? MOODS[o.mood] : [null, null];
    const look = o.look || [0, 0];
    return eye(x - gap / 2, y, r, { lid: lids[0], skin: o.skin, sclera: o.sclera, dx: look[0], dy: look[1] }) +
      eye(x + gap / 2, y + (o.tilt || 0), r2, { lid: lids[1], skin: o.skin, sclera: o.sclera, dx: look[0], dy: look[1] });
  }
  function brows(x, y, gap, type = 'angry', w = 4) {
    const h = gap / 2;
    if (type === 'angry') return Ln(`M${x - h - 10} ${y - 6} L${x - h + 8} ${y + 2} M${x + h + 10} ${y - 6} L${x + h - 8} ${y + 2}`, INK, w);
    if (type === 'worried') return Ln(`M${x - h - 9} ${y + 1} L${x - h + 8} ${y - 6} M${x + h + 9} ${y + 1} L${x + h - 8} ${y - 6}`, INK, w);
    if (type === 'raised') return Ln(`M${x - h - 9} ${y} Q${x - h} ${y - 9} ${x - h + 9} ${y} M${x + h - 9} ${y - 2} Q${x + h} ${y - 12} ${x + h + 9} ${y - 2}`, INK, w);
    if (type === 'one') return Ln(`M${x - h - 9} ${y + 2} L${x - h + 8} ${y + 2} M${x + h - 9} ${y - 3} Q${x + h} ${y - 13} ${x + h + 9} ${y - 3}`, INK, w);
    return '';
  }
  function mouth(type, x, y, w = 24) {
    const h = w / 2;
    switch (type) {
      case 'smile': return P(`M${x - h} ${y} Q${x} ${y + w * 0.6} ${x + h} ${y}`, 'none', 4);
      case 'grin':
        return P(`M${x - h} ${y} Q${x} ${y + w * 1.0} ${x + h} ${y} Z`, MOUTH, 3.5) +
          E(x, y + w * 0.34, w * 0.2, w * 0.1, TONGUE, 0) + R(x - h * 0.62, y + 0.5, h * 1.24, w * 0.13, 2, '#fff', 0);
      case 'open': return E(x, y, w * 0.3, w * 0.38, MOUTH, 3.5) + E(x, y + w * 0.2, w * 0.18, w * 0.11, TONGUE, 0);
      case 'wail': return E(x, y, w * 0.42, w * 0.46, MOUTH, 3.5) + E(x, y + w * 0.24, w * 0.26, w * 0.14, TONGUE, 0);
      case 'o': return E(x, y, w * 0.2, w * 0.24, MOUTH, 3);
      case 'frown': return P(`M${x - h} ${y + 5} Q${x} ${y - w * 0.4} ${x + h} ${y + 5}`, 'none', 4);
      case 'flat': return P(`M${x - h} ${y} L${x + h} ${y}`, 'none', 4);
      case 'smirk': return P(`M${x - h} ${y + 1} Q${x + h * 0.2} ${y + w * 0.42} ${x + h} ${y - 6}`, 'none', 4);
      case 'wavy': return P(`M${x - h} ${y} q${w / 8} -5 ${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0`, 'none', 3.5);
      case 'teeth': {
        let s = R(x - h, y - w * 0.18, w, w * 0.38, 5, '#fff', 3.5);
        for (let i = 1; i < 4; i++) s += Ln(`M${x - h + (w / 4) * i} ${y - w * 0.18} L${x - h + (w / 4) * i} ${y + w * 0.2}`, INK, 2);
        return s + Ln(`M${x - h} ${y} L${x + h} ${y}`, INK, 2);
      }
      case 'evil': {
        let s = P(`M${x - h} ${y} Q${x} ${y + w * 0.9} ${x + h} ${y} Z`, MOUTH, 3.5);
        let z = `M${x - h * 0.8} ${y + 2}`;
        for (let i = 0; i < 6; i++) z += ` L${x - h * 0.8 + (w * 0.8 / 6) * (i + 0.5)} ${y + (i % 2 ? 3 : 9)}`;
        return s + P(z + ` L${x + h * 0.8} ${y + 2} Z`, '#fff', 0);
      }
      case 'cat': return P(`M${x - h} ${y} q${h / 2} 7 ${h} 0 q${h / 2} 7 ${h} 0`, 'none', 3.5);
      default: return '';
    }
  }
  const blush = (x, y, rx = 7, ry = 4.5) => E(x, y, rx, ry, '#ff7d8e', 0, 'opacity="0.55"');
  function glove(x, y, r = 8, fill = '#fff') { return C(x, y, r, fill, 3.5) + E(x - r * 0.7, y - r * 0.35, r * 0.38, r * 0.3, fill, 3); }
  function arm(x1, y1, x2, y2, bend = 0, fill = '#fff') {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / L) * bend, cy = my + (dx / L) * bend;
    return Ln(`M${x1} ${y1} Q${n(cx)} ${n(cy)} ${x2} ${y2}`, INK, 4.5) + glove(x2, y2, 7.5, fill);
  }
  function leg(x1, y1, x2, y2, shoe = '#e23a2e') {
    return Ln(`M${x1} ${y1} L${x2} ${y2}`, INK, 4.5) + E(x2 + (x2 > x1 ? 5 : -5), y2 + 3, 10, 6, shoe, 3.5);
  }
  const sweat = (x, y, s = 1) => P(`M${x} ${y} q${-6 * s} ${10 * s} 0 ${14 * s} q${6 * s} ${-4 * s} 0 ${-14 * s} Z`, '#8fd8ff', 2.5);
  const sparkle = (x, y, s = 1, c = '#fff') =>
    P(`M${x} ${y - 9 * s} Q${x + 1.5 * s} ${y - 1.5 * s} ${x + 9 * s} ${y} Q${x + 1.5 * s} ${y + 1.5 * s} ${x} ${y + 9 * s} Q${x - 1.5 * s} ${y + 1.5 * s} ${x - 9 * s} ${y} Q${x - 1.5 * s} ${y - 1.5 * s} ${x} ${y - 9 * s} Z`, c, 2);
  const stink = (x, y, c = '#8fc04a') => Ln(`M${x} ${y} q6 -8 0 -16 t0 -16`, c, 4) ;
  const heat = (x, y, c = '#ff6b4a') => Ln(`M${x} ${y} q5 -6 0 -12 t0 -12`, c, 3.5);
  const flame = (x, y, s = 1) =>
    P(`M${x} ${y} q${-14 * s} ${-14 * s} ${-2 * s} ${-34 * s} q${2 * s} ${12 * s} ${10 * s} ${14 * s} q${4 * s} ${-8 * s} ${2 * s} ${-14 * s} q${16 * s} ${18 * s} ${2 * s} ${34 * s} Z`, '#ff8a2a', 3) +
    P(`M${x + 1 * s} ${y - 4 * s} q${-7 * s} ${-8 * s} ${0} ${-17 * s} q${7 * s} ${8 * s} 0 ${17 * s} Z`, '#ffd23f', 0);
  // Silueta «unión de círculos» con un solo contorno
  function blob(circles, fill, w = 4) {
    return circles.map(([x, y, r]) => C(x, y, r + w / 2, INK, 0)).join('') + circles.map(([x, y, r]) => C(x, y, r - w / 2, fill, 0)).join('');
  }
  function zigzagRect(x, y, w, h, teeth = 9, amp = 5) {
    const step = w / teeth;
    let d = `M${x} ${y}`;
    for (let i = 0; i < teeth; i++) d += ` L${n(x + step * (i + 0.5))} ${y - amp} L${n(x + step * (i + 1))} ${y}`;
    d += ` L${x + w} ${y + h}`;
    for (let i = teeth - 1; i >= 0; i--) d += ` L${n(x + step * (i + 0.5))} ${y + h + amp} L${n(x + step * i)} ${y + h}`;
    return d + ' Z';
  }
  const glasses = (x, y, gap, r = 14, color = INK) =>
    C(x - gap / 2, y, r, 'none', 3) + C(x + gap / 2, y, r, 'none', 3) + Ln(`M${x - gap / 2 + r} ${y} Q${x} ${y - 5} ${x + gap / 2 - r} ${y}`, color, 3);

  /* ---------- ilustraciones ---------- */
  const A = {};

  A.miga = () => bg('#cfe9ee', '#e6f6f8') +
    leg(90, 144, 86, 160, '#3f8efc') + leg(112, 144, 116, 160, '#3f8efc') +
    arm(70, 124, 54, 138, 4) +
    P('M66 122 Q60 100 80 96 Q86 80 104 86 Q122 78 130 96 Q146 106 136 126 Q136 146 112 146 Q94 154 80 142 Q62 140 66 122 Z', '#e8bd72') +
    E(84, 133, 4, 3, '#c78f3e', 0) + E(122, 132, 5, 3, '#c78f3e', 0) + E(117, 97, 3, 2, '#c78f3e', 0) + E(76, 110, 2.5, 2, '#c78f3e', 0) +
    shine(88, 102, 10, 5) + eyes(100, 112, { gap: 24, r: 10 }) + mouth('smile', 100, 128, 14) + blush(82, 126, 5, 3) + blush(118, 126, 5, 3) +
    arm(132, 112, 158, 84, -8) + sparkle(168, 64, 0.7);

  A.guisante = () => bg('#d8f0c8', '#eefae6') +
    Ln('M18 86 L44 86 M12 104 L40 104 M20 122 L44 122', '#9ccf7e', 4) +
    leg(86, 138, 66, 160, '#e23a2e') + leg(112, 140, 128, 164, '#e23a2e') +
    arm(62, 110, 46, 90, 6) +
    C(100, 104, 44, '#7cc242') + P('M132 76 Q156 112 124 142 Q142 110 132 76 Z', '#5c9e2e', 0) + shine(84, 82, 12, 7) +
    eyes(100, 98, { gap: 32, r: 12, mood: 'angry', skin: '#7cc242' }) + mouth('teeth', 100, 124, 26) +
    arm(140, 112, 160, 130, -6) + sweat(146, 66);

  A.huevo = () => bg('#fff1c9', '#fff9e6') +
    P('M100 42 C134 42 150 96 148 124 C146 156 122 166 100 166 C78 166 54 156 52 124 C50 96 66 42 100 42 Z', '#fffaf0') +
    Ln('M82 58 L90 66 L97 57 L105 67 L113 58', INK, 3) + shine(78, 86, 9, 18, -15) +
    G('rotate(28 124 74)', R(110, 69, 30, 11, 5, '#f2c08a', 3) + C(121, 74.5, 1.4, '#c98a4b', 0) + C(129, 74.5, 1.4, '#c98a4b', 0)) +
    eyes(100, 104, { gap: 32, r: 13, mood: 'angry', skin: '#fffaf0' }) + mouth('smirk', 100, 130, 26) +
    arm(54, 130, 118, 142, 10) + arm(146, 130, 84, 146, -10);

  A.aceituna = () => bg('#e3edc4', '#f2f7df') +
    E(100, 112, 46, 54, '#7d9b35') + E(100, 64, 16, 8, '#d7372f', 3) + shine(76, 98, 9, 18, -15, 0.35) +
    eyes(100, 96, { gap: 30, r: 12, look: [0.9, 0.1] }) +
    R(70, 112, 26, 14, 6, INK, 0) + R(104, 112, 26, 14, 6, INK, 0) + Ln('M96 117 L104 117', INK, 3) +
    Ln('M74 115 L82 115', '#6c6c80', 2) + Ln('M108 115 L116 115', '#6c6c80', 2) +
    mouth('smirk', 100, 140, 20) + Ln('M146 100 q8 4 4 10 t4 10 t-2 12 q-2 6 4 8', '#e6e6ea', 2.5);

  A.ajo = () => bg('#ece4fb', '#f7f3ff') +
    stink(30, 130) + stink(170, 130) + stink(40, 88) +
    P('M100 44 Q106 62 118 68 Q150 82 148 116 Q146 150 100 152 Q54 150 52 116 Q50 82 82 68 Q94 62 100 44 Z', '#fbf7ff') +
    Ln('M100 72 Q80 100 86 150 M100 72 Q120 100 114 150', '#cdb8e8', 3) +
    Ln('M90 152 l-4 9 M100 153 l0 10 M110 152 l4 9', INK, 3) + shine(76, 96, 7, 14, -10, 0.7) +
    eyes(100, 106, { gap: 30, r: 12, mood: 'smug', skin: '#fbf7ff' }) + mouth('smirk', 100, 128, 22) + blush(76, 122) + blush(124, 122);

  A.cubito = () => bg('#d6f1ff', '#eefaff') +
    R(52, 56, 96, 96, 18, '#bfe8fb') + R(60, 62, 80, 18, 8, '#e3f6ff', 0) +
    Ln('M66 92 L66 132 M74 136 L90 136', '#ffffff', 4) +
    eyes(100, 102, { gap: 34, r: 13, mood: 'sleepy', skin: '#bfe8fb' }) + mouth('flat', 100, 128, 20) +
    sparkle(40, 50, 0.8) + sparkle(162, 164, 0.7) + sparkle(164, 58, 0.6) +
    P('M126 128 q10 -6 18 0 q8 -4 12 4 q-4 8 -14 4 q-8 6 -16 -8 Z', '#ffffff', 2.5);

  A.ketchup = () => bg('#ffe0dc', '#fff0ee') +
    P(zigzagRect(52, 58, 96, 94, 9, 5), '#e23a2e') + shine(70, 80, 6, 16, -10, 0.4) +
    R(62, 130, 76, 16, 4, '#fff', 0) + T(100, 142.5, 'KÉTCHUP', 12, '#e23a2e') +
    eyes(100, 94, { gap: 30, r: 12, mood: 'angry', skin: '#e23a2e' }) + mouth('evil', 100, 112, 30) +
    P('M146 60 Q162 46 170 30 Q178 40 166 52 Q174 50 178 58 Q168 64 150 66 Z', '#c4231a', 3) + C(176, 26, 4, '#c4231a', 2.5) + C(184, 42, 3, '#c4231a', 2);

  A.limon = () => {
    let seg = '';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; seg += `M100 106 L${n(100 + Math.cos(a) * 43)} ${n(106 + Math.sin(a) * 43)} `; }
    return bg('#fff6c2', '#fffbe3') +
      C(100, 106, 54, '#f7d21a') + C(100, 106, 47, '#fffbe8', 0) + C(100, 106, 43, '#ffe75a', 0) + Ln(seg, '#fffbe8', 4) + C(100, 106, 6, '#fffbe8', 0) +
      eyes(100, 98, { gap: 34, r: 13, mood: 'angry', skin: '#ffe75a' }) + mouth('frown', 100, 128, 26) +
      G('rotate(-18 100 106)', `<rect x="30" y="60" width="140" height="92" rx="6" fill="#ffffff" opacity="0.28"/>` + Ln('M40 70 l20 6 l14 -4 M120 140 l18 -4 l12 6 M44 140 l14 -6', '#ffffff', 3));
  };

  A.salchicha = () => bg('#ffe5d4', '#fff3ea') +
    Ln('M150 150 L180 150 M140 166 L174 166', '#f2b8a0', 4) +
    G('rotate(-12 108 103)',
      P('M56 90 Q26 78 14 104 Q26 130 56 118 Q42 104 56 90 Z', '#ff8a2a', 3) + P('M54 96 Q36 92 30 104 Q36 116 54 112 Q46 104 54 96 Z', '#ffd23f', 0) +
      R(48, 80, 124, 46, 23, '#d9785a') + shine(80, 90, 18, 4, 0, 0.5) +
      C(172, 103, 4, '#b9583c', 3) +
      eyes(132, 98, { gap: 24, r: 10 }) + mouth('open', 134, 116, 16) +
      Ln('M110 80 Q132 70 156 78', INK, 4) + C(122, 80, 8, '#9fe3ff', 3) + C(144, 79, 8, '#9fe3ff', 3));

  A.natillas = () => bg('#fff0cf', '#fff8e8') +
    Ln('M30 96 q-8 16 0 32 M22 90 q-10 22 0 44 M170 96 q8 16 0 32 M178 90 q10 22 0 44', '#e0b45a', 3.5) +
    P('M50 78 L150 78 L138 162 Q100 172 62 162 Z', '#eaf7fb') +
    P('M55 84 L145 84 L134 155 Q100 164 66 155 Z', '#ffd24d', 0) +
    C(80, 96, 2, '#b8742c', 0) + C(122, 100, 2, '#b8742c', 0) + C(100, 92, 2, '#b8742c', 0) +
    Ln('M62 92 L58 140', '#ffffff', 4, 'opacity="0.8"') +
    E(100, 76, 44, 12, '#e3a65b') + E(100, 75, 32, 7, '#d08e45', 0) +
    eyes(100, 110, { gap: 30, r: 12, mood: 'sad', skin: '#ffd24d' }) + brows(100, 92, 30, 'worried') + mouth('wavy', 100, 136, 26);

  A.kiwi = () => {
    const fur = [[70, 120], [80, 140], [96, 150], [116, 146], [130, 132], [136, 112], [64, 104], [124, 150], [86, 128], [110, 130], [60, 132], [140, 124]];
    return bg('#e8f3d2', '#f4faea') +
      E(100, 114, 48, 52, '#9b6b3d') + fur.map(([x, y]) => Ln(`M${x} ${y} l-3 -6 M${x + 5} ${y + 2} l2 -7`, '#6f4826', 2)).join('') +
      P('M56 86 Q54 40 104 42 Q152 44 146 88 Q136 62 112 72 Q96 52 78 70 Q66 66 56 86 Z', '#6f4826') + shine(88, 54, 12, 4, -10, 0.35) +
      eyes(100, 106, { gap: 30, r: 12, mood: 'angry', skin: '#9b6b3d' }) + mouth('teeth', 100, 132, 22) +
      arm(146, 124, 166, 98, -6) + R(160, 70, 10, 26, 3, '#ff7d8e', 3) + Ln('M162 74 l-6 0 M162 80 l-6 0 M162 86 l-6 0 M162 92 l-6 0', INK, 2);
  };

  A.maiz = () => bg('#fff2c4', '#fffae6') +
    heat(50, 60) + heat(150, 56) + heat(100, 40) +
    P('M66 74 Q100 46 134 74 Q148 112 120 148 Q100 162 80 148 Q52 112 66 74 Z', '#ffcf33') +
    P('M84 141 Q100 154 116 141 Q100 132 84 141 Z', '#fff1b0', 0) + shine(80, 84, 8, 14, -20) +
    eyes(100, 98, { gap: 30, r: 12 }) + brows(100, 80, 30, 'worried') + mouth('wavy', 100, 124, 24) +
    sweat(140, 84) + sweat(56, 96, 0.8);

  A.palomita = () => bg('#fff3d6', '#fffaec') +
    arm(66, 112, 42, 78, 6) + arm(136, 112, 160, 78, -6) +
    blob([[78, 96, 24], [104, 80, 26], [128, 98, 24], [92, 122, 26], [120, 124, 24], [68, 122, 18], [140, 122, 16]], '#fffaf0') +
    C(90, 74, 5, '#ffd86b', 0) + C(132, 116, 6, '#ffd86b', 0) + C(70, 128, 4, '#ffd86b', 0) +
    eyes(102, 102, { gap: 30, r: 12, r2: 15 }) + mouth('grin', 102, 122, 30) + sparkle(40, 52, 0.7, '#ffd23f') + sparkle(166, 50, 0.6, '#ffd23f');

  A.yogur = () => bg('#e6f2d6', '#f2f9ea') +
    P('M58 74 L142 74 L132 162 Q100 170 68 162 Z', '#fbfbf5') +
    P('M64 138 L136 138 L134 154 Q100 160 66 154 Z', '#8fc6e8', 0) + T(100, 152, 'YOGUR', 12, '#fff') +
    P('M54 74 L146 74 L152 56 Q124 44 70 58 Z', '#cfd6dc') + Ln('M70 64 L140 58', '#ffffff', 3) +
    blob([[66, 76, 9], [80, 72, 8], [132, 76, 7]], '#8fc04a', 3) + C(122, 112, 5, '#8fc04a', 2.5) + C(76, 124, 4, '#8fc04a', 2.5) +
    eyes(100, 98, { gap: 30, r: 12, mood: 'angry', skin: '#fbfbf5' }) + mouth('evil', 100, 116, 28) +
    C(160, 64, 3.5, INK, 0) + E(156, 58, 4, 2.5, '#ffffff', 1.5) + E(164, 58, 4, 2.5, '#ffffff', 1.5) + Ln('M150 72 q-8 8 0 16 q6 6 -2 12', '#9a8fae', 1.8, 'stroke-dasharray="2 4"') +
    C(40, 110, 3, INK, 0) + E(37, 105, 3.5, 2, '#fff', 1.5) + E(43, 105, 3.5, 2, '#fff', 1.5);

  A.pimiento = () => bg('#dff3dc', '#f0faee') +
    Ln('M100 62 Q98 44 112 36', INK, 10) + Ln('M100 62 Q98 44 112 36', '#6f9e2e', 5) +
    P('M74 64 Q56 104 82 146 Q96 166 112 156 Q140 128 134 84 Q130 58 102 60 Q84 58 74 64 Z', '#3fa34d') +
    Ln('M84 80 Q78 110 92 140 M118 76 Q126 100 118 126', '#2f7d3a', 3) + shine(82, 82, 6, 14, -10, 0.45) +
    eyes(102, 98, { gap: 28, r: 11 }) + brows(102, 82, 28, 'one') + mouth('smirk', 104, 122, 22) +
    flame(146, 74, 0.6) + sweat(64, 110, 0.8);

  A.croqueta = () => bg('#ffe6c7', '#fff3e3') +
    P('M92 50 q-10 -12 0 -18 q8 -4 8 6 q0 -10 8 -6 q10 6 0 18 l-8 8 Z', '#ff7d8e', 2.5) +
    R(42, 76, 116, 68, 34, '#d39543') +
    [[58, 92], [66, 130], [140, 98], [146, 124], [96, 140], [120, 138], [78, 84], [130, 84], [56, 112]].map(([x, y]) => C(x, y, 2.2, '#a8692a', 0)).join('') +
    [[64, 100], [138, 110], [110, 86], [86, 136]].map(([x, y]) => C(x, y, 2, '#f0c070', 0)).join('') +
    shine(72, 88, 14, 5, -10, 0.45) +
    eyes(100, 104, { gap: 30, r: 11 }) + glasses(100, 104, 30, 14) + mouth('smile', 100, 124, 22) + blush(74, 122) + blush(126, 122);

  A.cebolla = () => bg('#f3dcef', '#faeef8') +
    Ln('M100 50 Q94 28 84 18 M100 50 Q108 28 120 22', INK, 10) + Ln('M100 50 Q94 28 84 18 M100 50 Q108 28 120 22', '#5aa641', 5) +
    P('M100 46 Q110 66 126 72 Q156 88 152 120 Q148 156 100 158 Q52 156 48 120 Q44 88 74 72 Q90 66 100 46 Z', '#c4609a') +
    Ln('M100 66 Q76 100 82 154 M100 66 Q124 100 118 154', '#dd8cbc', 3.5) + Ln('M90 158 l-4 8 M100 159 l0 9 M110 158 l4 8', INK, 3) +
    P('M80 112 Q70 136 74 164 L86 164 Q82 138 88 114 Z', '#8fd8ff', 2.5) + P('M120 112 Q130 136 126 164 L114 164 Q118 138 112 114 Z', '#8fd8ff', 2.5) +
    E(80, 168, 20, 5, '#8fd8ff', 2.5) + E(120, 168, 20, 5, '#8fd8ff', 2.5) +
    eyes(100, 104, { gap: 32, r: 12, mood: 'sad', skin: '#c4609a' }) + brows(100, 86, 32, 'worried') + mouth('wail', 100, 134, 28);

  A.queso = () => bg('#fff1c4', '#fff9e3') +
    stink(60, 76) + stink(84, 64) + stink(140, 58) +
    P('M28 120 L150 78 L168 96 L36 134 Z', '#fff3c4') +
    P('M36 134 L168 96 L168 152 L36 152 Z', '#f9e39b') +
    Ln('M50 144 q10 -8 18 0 t16 -2 M140 140 q6 -10 14 -6 M60 122 q14 -6 22 -14 M110 96 q10 2 16 -6', '#5f8fb8', 3) +
    E(64, 140, 5, 4, '#e8c86a', 0) + E(156, 128, 5, 6, '#e8c86a', 0) + E(150, 104, 4, 3, '#efd27a', 0) +
    eyes(116, 122, { gap: 26, r: 11, mood: 'smug', skin: '#f9e39b' }) + brows(116, 106, 26, 'raised') + mouth('smirk', 118, 142, 20) +
    C(172, 64, 3, INK, 0) + E(168, 59, 3.5, 2, '#fff', 1.5) + E(176, 59, 3.5, 2, '#fff', 1.5);

  A.pan = () => bg('#f1ece2', '#faf7f0') +
    P('M52 166 L52 86 Q46 52 76 52 Q90 36 108 44 Q126 36 140 52 Q160 56 150 86 L150 166 Z', '#e0b066') +
    P('M61 158 L61 88 Q57 63 80 62 Q92 50 108 56 Q122 50 134 62 Q148 66 141 90 L141 158 Z', '#fff9ea', 0) +
    [[76, 140], [126, 146], [118, 80], [70, 96], [132, 120]].map(([x, y]) => E(x, y, 2.5, 1.5, '#efe0c0', 0)).join('') +
    eyes(101, 104, { gap: 30, r: 12, mood: 'bored', skin: '#fff9ea' }) + mouth('flat', 101, 130, 16) +
    E(162, 46, 22, 14, '#fff', 3) + P('M148 56 L142 66 L156 58 Z', '#fff', 0) + C(153, 46, 2.5, INK, 0) + C(162, 46, 2.5, INK, 0) + C(171, 46, 2.5, INK, 0);

  A.bocata = () => bg('#ffe9cf', '#fff4e6') +
    R(24, 110, 152, 40, 20, '#dca355') +
    [[50, 112], [78, 115], [108, 112], [136, 115], [160, 111]].map(([x, y]) => C(x, y, 11, 'none', 0) + `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="${INK}" stroke-width="12"/><circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#f2b33e" stroke-width="6"/>`).join('') +
    P('M24 114 Q26 62 100 62 Q174 62 176 114 Z', '#e8b468') + Ln('M52 82 l10 -10 M146 82 l-10 -10 M44 98 l8 -8', '#c98a3e', 3) +
    P('M68 66 Q70 38 104 38 Q134 38 138 58 L154 64 Q124 70 68 66 Z', '#6b6b78') + Ln('M80 46 L82 64 M96 40 L96 64 M112 40 L112 64 M126 44 L124 64 M74 56 L136 56', '#8b8b98', 2) + C(104, 38, 3, '#6b6b78', 2.5) +
    eyes(100, 84, { gap: 30, r: 11 }) + mouth('grin', 100, 96, 22) + blush(76, 98) + blush(124, 98);

  A.tupper = () => bg('#dcecff', '#eef6ff') +
    T(56, 58, '?', 30, '#3f8efc') + T(150, 50, '?', 24, '#a55eea') + T(172, 84, '?', 16, '#3f8efc') +
    R(38, 84, 124, 80, 14, 'rgba(214,236,251,0.85)') +
    P('M46 160 Q44 120 60 108 Q80 96 100 104 Q124 94 142 108 Q158 122 154 160 Z', '#4b3b63', 0) +
    eye(76, 128, 9, { sclera: '#fff36b' }) + eye(102, 120, 11, { sclera: '#fff36b' }) + eye(126, 132, 8, { sclera: '#fff36b' }) +
    Ln('M50 96 L50 150', '#ffffff', 4, 'opacity="0.7"') +
    R(32, 70, 136, 20, 9, '#3f8efc') + R(26, 80, 12, 18, 3, '#2f6fd0', 3) + R(162, 80, 12, 18, 3, '#2f6fd0', 3) +
    G('rotate(-6 108 152)', R(84, 144, 50, 15, 1, '#f3e3b3', 0) + T(109, 156, '¿2021?', 11, INK, 'Permanent Marker'));

  A.berenjena = () => bg('#ece0fb', '#f6f0ff') +
    Ln('M66 108 L38 106 L40 76', INK, 15) + Ln('M66 108 L38 106 L40 76', '#7a4cb3', 9) + C(46, 98, 10, '#7a4cb3', 3) + glove(40, 70, 9) +
    Ln('M134 108 L162 106 L160 76', INK, 15) + Ln('M134 108 L162 106 L160 76', '#7a4cb3', 9) + C(154, 98, 10, '#7a4cb3', 3) + glove(160, 70, 9) +
    P('M100 56 Q132 54 138 96 Q152 152 100 162 Q48 152 62 96 Q68 54 100 56 Z', '#6b3fa0') + shine(80, 92, 8, 20, -10, 0.35) +
    P('M78 62 Q88 50 100 56 Q112 50 122 62 Q112 60 100 66 Q88 60 78 62 Z', '#5aa641', 3) + Ln('M100 54 L102 38', INK, 6) +
    P('M64 84 Q100 70 136 84 L134 94 Q100 82 66 94 Z', '#e23a2e', 3) +
    eyes(100, 108, { gap: 30, r: 12, mood: 'smug', skin: '#6b3fa0' }) + mouth('grin', 100, 130, 26);

  A.pizza = () => bg('#ffe9cc', '#fff4e6') +
    P('M44 64 Q100 46 156 64 L104 168 Q100 174 96 168 Z', '#ffd257') +
    P('M64 104 q2 14 6 0 M128 108 q2 16 6 2 M90 152 q2 10 5 0', '#ffd257', 3) +
    P('M38 64 Q100 40 162 64 Q160 78 152 76 Q100 60 48 76 Q40 78 38 64 Z', '#d98f45') +
    C(68, 84, 8, '#c8372d', 3) + C(132, 84, 8, '#c8372d', 3) + C(100, 148, 7, '#c8372d', 3) + C(116, 126, 6, '#c8372d', 3) +
    P('M68 60 Q68 24 100 24 Q132 24 132 60 Z', '#3f8efc') + R(62, 52, 76, 13, 6, '#2f6fd0') + C(100, 22, 9, '#fff', 3) +
    eyes(100, 98, { gap: 26, r: 11, mood: 'smug', skin: '#ffd257' }) + mouth('smile', 100, 116, 18) +
    sparkle(34, 110, 0.6, '#cfeeff') + sparkle(168, 118, 0.6, '#cfeeff');

  A.sandia = () => bg('#dff3dc', '#f0faee') +
    leg(78, 150, 60, 164, '#f1e6c8') + leg(122, 150, 140, 164, '#f1e6c8') +
    arm(48, 108, 28, 118, 4) + arm(152, 108, 172, 118, -4) +
    C(100, 104, 56, '#3fa34d') +
    Ln('M70 56 q-10 24 -2 48 t-2 46 M100 48 q-8 30 0 56 t0 56 M130 56 q10 24 2 48 t2 46', '#2a7a36', 6) +
    P('M46 124 Q100 142 154 124 L151 141 Q100 158 49 141 Z', '#f1e6c8') + R(92, 138, 16, 24, 3, '#f1e6c8') +
    E(100, 46, 9, 7, INK, 0) + Ln('M100 40 q4 -10 12 -8', INK, 4) +
    eyes(100, 94, { gap: 32, r: 12, mood: 'angry', skin: '#3fa34d' }) + mouth('frown', 100, 114, 24);

  A.chorizo = () => bg('#ffe0d6', '#fff0ea') +
    `<path d="M56 158 Q34 66 100 60 Q166 66 144 158" fill="none" stroke="${INK}" stroke-width="58" stroke-linecap="round"/>` +
    `<path d="M56 158 Q34 66 100 60 Q166 66 144 158" fill="none" stroke="#b8342b" stroke-width="50" stroke-linecap="round"/>` +
    [[56, 134], [60, 100], [146, 126], [140, 96], [74, 74], [150, 150], [52, 160]].map(([x, y]) => E(x, y, 3, 2, '#f3c7b8', 0)).join('') +
    Ln('M50 182 l-6 10 M150 182 l6 10', INK, 3) +
    Ln('M64 50 Q100 26 136 50', INK, 9) + Ln('M136 50 l22 -8 M136 50 l22 6', INK, 6) +
    eyes(100, 62, { gap: 28, r: 11, mood: 'angry', skin: '#b8342b' }) + mouth('teeth', 100, 82, 20);

  A.tortilla = () => bg('#fff0c8', '#fff8e5') +
    E(100, 124, 70, 40, '#e0a33a') + E(100, 110, 70, 40, '#f6c44f') +
    E(70, 98, 10, 6, '#d68a2c', 0, 'opacity="0.8"') + E(134, 120, 12, 6, '#d68a2c', 0, 'opacity="0.8"') + E(120, 92, 6, 4, '#d68a2c', 0, 'opacity="0.8"') + E(76, 128, 7, 4, '#d68a2c', 0, 'opacity="0.8"') +
    shine(70, 88, 16, 5, -8) +
    eyes(100, 104, { gap: 32, r: 13 }) + brows(100, 84, 32, 'raised') + mouth('open', 100, 128, 22) +
    arm(160, 112, 176, 76, -6) + Ln('M176 68 L176 58', INK, 4.5) +
    `<circle cx="36" cy="62" r="13" fill="none" stroke="${INK}" stroke-width="11"/><circle cx="36" cy="62" r="13" fill="none" stroke="#efe0f5" stroke-width="6"/>` + T(36, 40, '?', 16, INK);

  A.coliflor = () => bg('#e9f4e2', '#f5faf0') +
    P('M40 140 Q30 112 60 124 Q72 150 40 140 Z', '#6fb552') + P('M160 140 Q170 112 140 124 Q128 150 160 140 Z', '#6fb552') + P('M70 150 Q100 176 130 150 Q100 162 70 150 Z', '#5aa641') +
    blob([[76, 92, 24], [104, 76, 26], [130, 94, 24], [90, 118, 24], [118, 120, 24], [64, 116, 16], [142, 116, 16]], '#f6f1df') +
    Ln('M80 70 q6 6 0 12 M118 64 q-6 6 0 12 M140 84 q-6 4 -2 10 M60 98 q6 2 6 8', '#d8cfae', 2.5) +
    eyes(102, 104, { gap: 34, r: 11 }) + glasses(102, 104, 34, 15) + brows(102, 84, 34, 'one') + mouth('smirk', 104, 128, 18) +
    arm(66, 160, 94, 140, 6);

  A.jamon = () => bg('#ffe2da', '#fff1ec') +
    P('M28 108 Q28 60 82 58 Q132 60 160 92 L172 98 L172 118 L160 122 Q132 154 82 156 Q28 158 28 108 Z', '#bd4a3c') +
    Ln('M42 82 Q80 62 138 80', '#f6dcc0', 5) + Ln('M48 132 q20 8 40 4 M120 134 q14 -4 22 -12', '#e98a7a', 3) +
    P('M168 94 L188 92 Q196 108 188 124 L168 122 Z', INK, 3) +
    eyes(92, 98, { gap: 30, r: 11 }) + C(107, 98, 15, 'none', 0) + `<circle cx="107" cy="98" r="15" fill="none" stroke="#d9a930" stroke-width="3.5"/>` +
    Ln('M107 113 q4 14 -6 22 q-8 6 -2 16', '#d9a930', 2) +
    brows(92, 80, 30, 'raised') +
    P('M92 118 Q78 110 68 118 Q62 126 56 116 Q62 132 78 126 Q88 124 92 120 Q96 124 106 126 Q122 132 128 116 Q122 126 116 118 Q106 110 92 118 Z', INK, 2) +
    mouth('smile', 92, 134, 10);

  A.pulpo = () => {
    let t = '';
    const ten = ['M70 116 Q50 150 30 150 Q22 146 30 140', 'M84 124 Q76 160 58 170', 'M100 126 Q100 164 92 176', 'M116 124 Q124 160 142 170', 'M130 116 Q150 150 170 150 Q178 146 170 140'];
    for (const d of ten) t += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#e8789a" stroke-width="11" stroke-linecap="round"/>`;
    const up = ['M66 100 Q44 92 38 66', 'M134 100 Q156 92 162 66'];
    for (const d of up) t += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#e8789a" stroke-width="11" stroke-linecap="round"/>`;
    const gloveB = (x, y) => C(x, y, 15, '#e23a2e', 3.5) + E(x - 11, y + 4, 6, 8, '#e23a2e', 3) + R(x - 10, y + 12, 20, 8, 3, '#fff', 3);
    return bg('#ffe0ea', '#fff0f4') + t + gloveB(38, 54) + gloveB(162, 54) +
      E(100, 90, 46, 42, '#e8789a') + C(80, 66, 4, '#f6b1c5', 0) + C(124, 70, 5, '#f6b1c5', 0) + C(70, 88, 3, '#f6b1c5', 0) + shine(82, 70, 10, 6) +
      eyes(100, 94, { gap: 30, r: 13, mood: 'angry', skin: '#e8789a' }) + mouth('grin', 100, 114, 22);
  };

  A.guisantes = () => bg('#dff0ff', '#f0f8ff') +
    P('M52 62 L148 62 L144 162 Q100 170 56 162 Z', '#8fd0ff') + P(zigzagRect(50, 54, 100, 10, 10, 3), '#6fb8f0', 3) +
    E(76, 84, 10, 4, '#ffffff', 0, 'opacity="0.7"') + E(132, 136, 8, 4, '#ffffff', 0, 'opacity="0.7"') +
    [[72, 146], [86, 150], [100, 146], [114, 150], [128, 146], [80, 138], [94, 138], [108, 138], [122, 138]].map(([x, y]) => C(x, y, 5, '#7cc242', 2)).join('') +
    P('M70 52 L76 28 Q100 20 124 28 L130 52 Z', '#ffffff') + R(96, 30, 8, 16, 1, '#e23a2e', 0) + R(92, 34, 16, 8, 1, '#e23a2e', 0) +
    eyes(100, 98, { gap: 30, r: 12 }) + mouth('smile', 100, 118, 22) + blush(76, 116) + blush(124, 116);

  A.paella = () => bg('#fff0cc', '#fff8e6') +
    Ln('M70 48 q6 -8 0 -16 t0 -16 M100 40 q6 -8 0 -16 t0 -16 M130 48 q6 -8 0 -16 t0 -16', '#d9d4cc', 3.5) +
    E(20, 112, 14, 8, '#3d3d48', 3.5) + E(180, 112, 14, 8, '#3d3d48', 3.5) +
    E(100, 112, 80, 50, '#4a4a56') + E(100, 110, 72, 43, '#f4c23a', 0) +
    Ln('M44 120 l12 4 M150 96 l12 -4 M62 140 l10 -6 M138 142 l-10 -8', '#d63b2e', 5) +
    [[56, 104], [150, 124], [120, 146], [80, 148], [150, 106]].map(([x, y]) => C(x, y, 3.5, '#5aa641', 1.5)).join('') +
    `<path d="M40 96 q10 -20 26 -6" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M40 96 q10 -20 26 -6" fill="none" stroke="#ff8a5c" stroke-width="6" stroke-linecap="round"/>` + C(44, 86, 1.6, INK, 0) +
    `<path d="M136 150 q14 6 22 -10" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M136 150 q14 6 22 -10" fill="none" stroke="#ff8a5c" stroke-width="6" stroke-linecap="round"/>` + C(156, 142, 1.6, INK, 0) +
    G('rotate(-30 148 82)', E(148, 82, 12, 6, '#2c3550', 3)) + G('rotate(20 54 136)', E(54, 136, 11, 6, '#2c3550', 3)) +
    P('M132 70 L158 74 Q150 90 132 70 Z', '#fff36b', 3) +
    eyes(100, 102, { gap: 32, r: 13 }) + mouth('grin', 100, 120, 30) + blush(72, 122) + blush(128, 122);

  A.pavo = () => {
    const stick = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="#fff6e8" stroke-width="6" stroke-linecap="round"/>` + P(zigzagRect(x2 - 8, y2 - 10, 16, 8, 3, 3), '#fff', 2.5);
    return bg('#ffe6cf', '#fff3e8') +
      stick(64, 92, 46, 54) + stick(136, 92, 154, 54) + G('rotate(-25 62 88)', E(62, 88, 14, 18, '#b8692f')) + G('rotate(25 138 88)', E(138, 88, 14, 18, '#b8692f')) +
      P('M40 122 Q40 78 100 76 Q160 78 160 122 Q160 162 100 164 Q40 162 40 122 Z', '#c97a3a') + shine(74, 96, 16, 6, -15, 0.45) +
      P('M88 80 L104 34 L122 76 Z', '#a55eea', 3.5) + Ln('M94 66 L114 60 M98 52 L110 48', '#ffd23f', 3) + C(104, 32, 6, '#ffd23f', 3) +
      eyes(100, 112, { gap: 32, r: 12, mood: 'sleepy', skin: '#c97a3a' }) +
      Ln('M76 126 q8 5 16 0 M108 126 q8 5 16 0', '#7a4a8a', 2.5) + mouth('flat', 100, 140, 18) +
      [[86, 148], [92, 152], [108, 152], [114, 148], [100, 154]].map(([x, y]) => C(x, y, 1.3, '#6b3f1c', 0)).join('');
  };

  A.lasana = () => bg('#ffe5d6', '#fff2ea') +
    R(36, 82, 128, 76, 8, '#f3c460') +
    `<rect x="38" y="96" width="124" height="9" fill="#c9402e"/><rect x="38" y="110" width="124" height="6" fill="#fff3d6"/><rect x="38" y="126" width="124" height="9" fill="#c9402e"/><rect x="38" y="140" width="124" height="6" fill="#fff3d6"/>` +
    R(36, 82, 128, 76, 8, 'none') +
    P('M36 84 L164 84 L150 64 L50 64 Z', '#e9a84d') + P('M120 70 q8 -8 16 0 q-8 6 -16 0 Z', '#5aa641', 2) +
    P('M72 66 Q72 30 100 28 Q128 30 128 66 Z', '#b9c2cc') + Ln('M80 52 L120 52 M84 44 L116 44', '#8b95a1', 3) + Ln('M100 28 Q112 10 128 14', INK, 9) + Ln('M100 28 Q112 10 128 14', '#e23a2e', 5) +
    eyes(100, 106, { gap: 36, r: 12, mood: 'angry', skin: '#f3c460' }) + mouth('flat', 100, 136, 22) +
    P('M158 108 L180 108 L180 130 Q180 146 169 152 Q158 146 158 130 Z', '#3f8efc', 3.5) + Ln('M169 112 L169 146 M160 124 L178 124', '#ffd23f', 3);

  A.tarta = () => {
    let candles = '';
    const xs = [56, 68, 80, 92, 104, 116, 128, 140, 150];
    xs.forEach((x, i) => {
      const tilt = [8, -6, 0, 10, -4, 6, -10, 2, 12][i];
      const col = ['#3f8efc', '#ffd23f', '#7cc242', '#a55eea', '#ff8a2a', '#3f8efc', '#e23a2e', '#7cc242', '#ffd23f'][i];
      candles += G(`rotate(${tilt} ${x} 86)`, R(x - 3, 58, 6, 28, 2, col, 2.5) + P(`M${x} 56 q-5 -6 0 -14 q5 8 0 14 Z`, '#ff8a2a', 2));
    });
    return bg('#ffe0ef', '#fff0f7') +
      Ln('M20 20 L60 50 M20 20 L40 60 M20 20 L64 30 M30 30 q8 2 12 -6 M34 42 q10 0 16 -10', '#b9b2c6', 1.5) +
      candles + R(40, 88, 120, 72, 10, '#f7a8c4') +
      P('M40 96 Q48 112 56 98 Q64 116 74 98 Q84 114 96 98 Q106 116 118 98 Q128 112 138 98 Q148 114 160 96 L160 92 L40 92 Z', '#fff0f6', 0) +
      E(100, 90, 60, 14, '#ffd6e6') + C(60, 146, 2, '#b9b2c6', 0) + C(140, 130, 2, '#b9b2c6', 0) +
      eyes(100, 120, { gap: 34, r: 12, r2: 15 }) + mouth('grin', 100, 140, 34);
  };

  A.lentejas = () => bg('#ffe6d8', '#fff2ea') +
    Ln('M70 44 q6 -8 0 -16 t0 -16 M130 40 q6 -8 0 -16 t0 -16', '#d9d4cc', 3.5) +
    `<path d="M66 82 L44 40" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M66 82 L44 40" stroke="#c9d2da" stroke-width="5" stroke-linecap="round"/>` +
    E(30, 108, 11, 7, '#b8342b', 3.5) + E(170, 108, 11, 7, '#b8342b', 3.5) +
    P('M38 88 L162 88 L156 150 Q100 170 44 150 Z', '#d64535') +
    [[56, 104], [80, 146], [144, 104], [130, 150], [52, 132], [150, 130]].map(([x, y]) => C(x, y, 3, '#fff', 0)).join('') +
    E(100, 88, 64, 12, '#b8342b') +
    blob([[70, 84, 7], [84, 80, 7], [98, 84, 7], [112, 80, 6], [126, 84, 7]], '#8b5a2b', 3) +
    G('rotate(-14 128 66)', E(128, 66, 42, 9, '#d64535') + C(128, 56, 5, INK, 0)) +
    eyes(100, 114, { gap: 34, r: 12 }) + glasses(100, 114, 34, 15) + mouth('smile', 100, 134, 24) + blush(70, 132) + blush(130, 132);

  A.fabada = () => bg('#e6f8d6', '#f3fcea') +
    C(100, 104, 74, '#c6f36b', 0, 'opacity="0.55"') +
    Ln('M60 70 q-10 -14 2 -26 t2 -24 M140 68 q10 -14 -2 -26 t-2 -24 M100 60 q-8 -12 2 -22', '#8fd14a', 5) +
    P('M34 98 Q36 156 100 160 Q164 156 166 98 Z', '#c0703a') + E(100, 98, 66, 16, '#a85b2b') + E(100, 97, 58, 11, '#efe6cc', 0) +
    [[74, 96], [92, 100], [118, 94], [136, 99], [104, 92]].map(([x, y]) => E(x, y, 5, 3, '#fffaf0', 1.5)).join('') +
    C(84, 94, 5, '#c8372d', 2) + C(128, 94, 5, '#3a2030', 2) +
    C(60, 80, 6, '#d8ff7a', 2.5) + C(150, 84, 4, '#d8ff7a', 2.5) + C(112, 74, 5, '#d8ff7a', 2.5) +
    Ln('M146 96 L152 56', INK, 3) + P('M150 34 L166 60 L134 60 Z', '#ffd23f', 3) + T(150, 57, '!', 16, INK) +
    eyes(100, 124, { gap: 30, r: 12, look: [-0.9, 0.2] }) + brows(100, 106, 30, 'worried') + mouth('o', 100, 144, 14) + sweat(136, 112);

  A.primigenio = () => bg('#fff2c2', '#fff9e0') + rays('#ffe28a') + C(100, 106, 70, '#fff6d4', 0, 'opacity="0.6"') +
    P('M46 74 L154 74 L144 168 Q100 178 56 168 Z', '#f3efe2') + Ln('M60 92 l10 8 l-4 10 M138 140 l-8 6 l2 10', '#c8bfa4', 2.5) +
    P('M42 76 Q50 56 70 62 Q84 50 100 58 Q118 48 132 60 Q152 56 158 76 Z', '#8fc04a') +
    R(66, 50, 10, 10, 1, '#fff', 2) + P('M64 51 L71 42 L78 51 Z', '#e23a2e', 2) +
    R(116, 46, 12, 12, 1, '#fff', 2) + P('M114 47 L122 37 L130 47 Z', '#3f8efc', 2) + Ln('M96 56 L96 40', INK, 2) + P('M96 40 L106 43 L96 47 Z', '#e23a2e', 1.5) +
    P('M68 102 Q100 162 132 102 Q126 132 100 138 Q74 132 68 102 Z', '#7fae3e') +
    R(58, 146, 84, 18, 4, '#c9a24a', 3) + T(100, 160, '1998', 14, INK) +
    eyes(100, 94, { gap: 34, r: 13 }) + Ln('M70 76 Q82 70 94 78 M106 78 Q118 70 130 76', '#e9e4d8', 7) + Ln('M70 76 Q82 70 94 78 M106 78 Q118 70 130 76', INK, 2) +
    mouth('o', 100, 118, 10);

  /* fichas */
  A.porcion = () => bg('#ffe9cc', '#fff4e6') +
    P('M52 64 Q100 50 148 64 L104 162 Q100 168 96 162 Z', '#ffd257') +
    P('M46 64 Q100 44 154 64 Q152 76 144 74 Q100 60 56 74 Q48 76 46 64 Z', '#d98f45') +
    C(76, 84, 7, '#c8372d', 3) + C(118, 132, 6, '#c8372d', 3) +
    eyes(100, 100, { gap: 26, r: 10, mood: 'sad', skin: '#ffd257' }) + mouth('frown', 100, 120, 16);

  A.sobra = () => bg('#ffe6cf', '#fff3e8') +
    `<path d="M116 132 L146 166" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M116 132 L146 166" stroke="#fff6e8" stroke-width="9" stroke-linecap="round"/>` +
    C(144, 172, 8, '#fff6e8', 3) + C(154, 162, 8, '#fff6e8', 3) +
    G('rotate(25 96 96)', E(96, 96, 40, 48, '#c97a3a')) + shine(78, 78, 12, 6, -30, 0.45) +
    eyes(96, 94, { gap: 28, r: 11, mood: 'sleepy', skin: '#c97a3a' }) + mouth('flat', 96, 118, 16);

  A.taperlentejas = () => bg('#e7f5e0', '#f3faef') +
    R(46, 84, 108, 70, 12, 'rgba(214,236,251,0.85)') + R(54, 96, 92, 50, 8, '#8b5a2b', 0) +
    [[66, 104], [82, 140], [120, 102], [134, 136], [70, 128], [138, 116]].map(([x, y]) => E(x, y, 4, 2.5, '#a8743c', 0)).join('') +
    R(40, 72, 120, 18, 8, '#5aa641') +
    eyes(100, 116, { gap: 28, r: 11 }) + mouth('smile', 100, 134, 18);

  A.microbrote = () => bg('#eef6e6', '#f6fbf1') +
    Ln('M100 116 Q96 90 104 66', INK, 8) + Ln('M100 116 Q96 90 104 66', '#6fb552', 4) +
    P('M104 70 Q84 46 66 62 Q84 76 104 70 Z', '#7cc242', 3) + P('M104 68 Q124 40 144 54 Q126 74 104 68 Z', '#7cc242', 3) +
    P('M64 120 L136 120 L126 168 L74 168 Z', '#d0703f') + R(58, 112, 84, 14, 4, '#e08550') +
    eyes(100, 142, { gap: 24, r: 9, mood: 'smug', skin: '#d0703f' }) + `<circle cx="112" cy="142" r="12" fill="none" stroke="#d9a930" stroke-width="3"/>` + mouth('smirk', 101, 158, 12);

  /* trucos */
  A.cupon = () => bg('#ffe9d0', '#fff5e8') +
    G('rotate(-8 100 104)', R(30, 62, 140, 84, 8, '#fff3c4') + R(40, 72, 120, 64, 4, 'none', 2.5, 'stroke-dasharray="6 5"') +
      T(74, 118, '+1', 36, '#e23a2e') + T(74, 132, 'caloría', 10, INK) +
      eyes(130, 98, { gap: 22, r: 10 }) + mouth('smile', 130, 116, 16)) +
    G('rotate(30 160 54)', C(150, 46, 7, 'none', 3) + C(150, 64, 7, 'none', 3) + Ln('M155 50 L178 66 M155 60 L178 44', INK, 3.5));

  A.sal = () => bg('#e8f0f8', '#f5f9fc') +
    G('rotate(24 100 110)',
      P('M74 82 L126 82 L132 158 Q100 166 68 158 Z', '#f4f8fb') + P('M71 118 L129 118 L132 158 Q100 166 68 158 Z', '#ffffff', 0) + Ln('M80 92 L78 146', '#ffffff', 4) +
      R(72, 62, 56, 22, 8, '#b9c2cc') + C(88, 70, 2, INK, 0) + C(100, 68, 2, INK, 0) + C(112, 70, 2, INK, 0) +
      eyes(100, 112, { gap: 26, r: 11 }) + brows(100, 96, 26, 'one') + mouth('smirk', 102, 134, 18)) +
    [[46, 58], [36, 74], [52, 86], [28, 92], [42, 104], [24, 60]].map(([x, y]) => R(x, y, 5, 5, 1, '#fff', 1.5)).join('');

  A.aluminio = () => bg('#e9eef3', '#f6f8fb') +
    P('M100 52 L124 58 L146 76 L152 104 L144 132 L124 152 L98 158 L72 150 L54 130 L48 102 L58 74 L78 58 Z', '#c9d2da') +
    P('M78 58 L100 52 L104 78 L82 84 Z', '#eef2f5', 0) + P('M124 58 L146 76 L126 88 Z', '#e1e7ec', 0) + P('M54 130 L72 150 L82 128 Z', '#a9b4be', 0) + P('M124 152 L144 132 L120 126 Z', '#a9b4be', 0) +
    Ln('M82 84 L104 78 L126 88 M82 128 L120 126', '#a9b4be', 2) +
    sparkle(150, 54, 0.8) + sparkle(46, 150, 0.6) + sparkle(160, 140, 0.5) +
    eyes(100, 100, { gap: 30, r: 12 }) + brows(100, 82, 30, 'raised') + mouth('grin', 100, 120, 24);

  A.nevera = () => bg('#2f3c5a', '#3c4b6e') +
    `<path d="M58 48 L-10 210 L210 210 L126 48 Z" fill="#fff3b0" opacity="0.18"/>` +
    R(50, 36, 84, 150, 10, '#eef3f6') + R(58, 44, 68, 132, 6, '#fff3b0', 3) +
    Ln('M60 110 L124 110 M60 142 L124 142', '#e0d28a', 3) +
    R(66, 120, 12, 20, 3, '#ffffff', 2.5) + R(96, 124, 18, 16, 4, '#e23a2e', 2.5) + C(110, 156, 8, '#7cc242', 2.5) +
    P('M134 36 L172 26 L172 194 L134 186 Z', '#dfe7ec') + Ln('M144 90 L144 128', INK, 5) +
    eyes(92, 74, { gap: 30, r: 13 }) + mouth('o', 92, 96, 14);

  A.ajeno = () => bg('#e6f0ff', '#f2f7ff') +
    R(40, 90, 112, 70, 12, 'rgba(214,236,251,0.9)') + R(48, 102, 96, 50, 8, '#f2a65a', 0) +
    R(34, 76, 124, 20, 9, '#e23a2e') +
    G('rotate(-7 92 64)', R(60, 40, 66, 44, 2, '#ffe066', 3) + T(93, 58, 'NO TOCAR', 11, INK, 'Permanent Marker') + T(93, 74, 'M. Carmen', 9, '#c4231a', 'Permanent Marker')) +
    eyes(92, 124, { gap: 26, r: 11, look: [1, 0] }) + mouth('wavy', 92, 144, 18) + sweat(130, 106) +
    Ln('M210 150 L164 132', INK, 18) + Ln('M210 150 L164 132', '#3a4566', 12) + glove(160, 130, 11, '#2b1e3f') ;

  A.batido = () => bg('#ffe3ea', '#fff1f5') +
    R(66, 62, 64, 108, 12, '#f6f6fa') + R(70, 98, 56, 68, 8, '#f5a3b8', 0) + Ln('M118 74 L126 74 M118 86 L126 86', INK, 2) +
    R(64, 46, 68, 20, 8, '#3a3a46') + R(90, 34, 16, 14, 3, '#3a3a46', 3) +
    eyes(98, 116, { gap: 26, r: 10, mood: 'angry', skin: '#f5a3b8' }) + mouth('teeth', 98, 142, 20) +
    Ln('M130 120 L160 118 L162 86', INK, 16) + Ln('M130 120 L160 118 L162 86', '#f3c7a1', 10) + C(154, 108, 10, '#f3c7a1', 3) + glove(162, 80, 10, '#f3c7a1');

  A.garbanzos = () => {
    const pea = (x, y, r, rot) => G(`rotate(${rot} ${x} ${y})`,
      Ln(`M${x - r - 30} ${y - 6} L${x - r - 8} ${y - 6} M${x - r - 24} ${y + 6} L${x - r - 6} ${y + 6}`, '#e3c79a', 3.5) +
      P(`M${x} ${y - r} Q${x + r * 1.3} ${y - r} ${x + r} ${y + r * 0.3} Q${x + r * 0.6} ${y + r} ${x} ${y + r} Q${x - r} ${y + r} ${x - r} ${y} Q${x - r} ${y - r} ${x} ${y - r} Z`, '#e8c28a', 3.5) +
      eye(x - r * 0.25, y - r * 0.2, r * 0.32) + eye(x + r * 0.35, y - r * 0.2, r * 0.32) + Ln(`M${x - r * 0.4} ${y - r * 0.62} L${x - r * 0.05} ${y - r * 0.45} M${x + r * 0.55} ${y - r * 0.62} L${x + r * 0.18} ${y - r * 0.45}`, INK, 2.5) +
      mouth('flat', x + r * 0.05, y + r * 0.38, r * 0.5));
    return bg('#fff0d4', '#fff8ea') + pea(70, 64, 18, 20) + pea(140, 58, 15, 10) + pea(150, 122, 19, 30) + pea(86, 126, 22, 15) + pea(50, 162, 14, 25);
  };

  A.vuelta = () => bg('#e2f4ec', '#f0faf5') +
    G('rotate(-28 48 98)', R(44, 82, 112, 16, 8, '#7fd1b9')) +
    R(46, 98, 108, 62, 12, 'rgba(214,236,251,0.9)') +
    `<path d="M160 52 Q140 20 112 40 Q96 52 104 84" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M160 52 Q140 20 112 40 Q96 52 104 84" fill="none" stroke="#e23a2e" stroke-width="6" stroke-linecap="round"/>` +
    P('M92 76 L104 96 L116 76 Z', '#e23a2e', 3.5) +
    eyes(100, 124, { gap: 28, r: 11 }) + mouth('smile', 100, 142, 18) + blush(76, 140) + blush(124, 140);

  A.caldito = () => bg('#fff0d8', '#fff8ec') +
    Ln('M84 70 q-12 -16 0 -26 q8 -6 16 4 q8 -10 16 -4 q12 10 0 26 l-16 16 Z', '#ff8a9a', 3.5) +
    `<path d="M118 98 L162 50" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M118 98 L162 50" stroke="#c9d2da" stroke-width="5" stroke-linecap="round"/>` +
    P('M34 100 Q38 162 100 164 Q162 162 166 100 Z', '#ffffff') + Ln('M42 124 Q100 140 158 124', '#3f8efc', 4) +
    E(100, 100, 66, 14, '#f2c14e') + C(80, 98, 4, '#ff8a2a', 2) + C(116, 102, 4, '#ff8a2a', 2) + C(132, 96, 3, '#7cc242', 1.5) +
    eyes(100, 138, { gap: 30, r: 10 }) + mouth('smile', 100, 152, 16) + blush(76, 150) + blush(124, 150);

  A.siesta = () => bg('#dfe2fb', '#eef0ff') +
    P('M36 98 Q30 62 60 66 Q100 56 140 66 Q170 62 164 98 Q170 142 140 146 Q100 154 60 146 Q30 142 36 98 Z', '#ffffff') +
    Ln('M44 70 l-8 -8 M156 70 l8 -8 M44 142 l-8 8 M156 142 l8 8', INK, 3) +
    P('M58 78 Q100 64 142 78 L140 92 Q100 80 60 92 Z', '#a55eea') +
    Ln('M70 104 q8 6 16 0', INK, 3.5) + eye(120, 102, 12, { lid: [0.15, 0.15], skin: '#ffffff' }) +
    mouth('o', 100, 126, 12) + P('M104 132 q-2 10 2 14 q4 -4 2 -14 Z', '#8fd8ff', 2) +
    T(160, 50, 'Z', 22, '#6d5bd0') + T(176, 34, 'z', 16, '#6d5bd0') + T(142, 36, 'z', 13, '#6d5bd0');

  A.asalto = () => bg('#1f2a48', '#2b3a62') + C(42, 44, 16, '#fff3c4', 0) + C(36, 40, 3, '#f0dca0', 0) + C(48, 50, 2.5, '#f0dca0', 0) +
    `<path d="M110 52 L-20 220 L120 220 Z" fill="#fff3b0" opacity="0.28"/>` +
    R(110, 30, 76, 170, 8, '#eef3f6') + Ln('M122 90 L122 130', INK, 5) +
    R(104, 30, 8, 170, 0, '#fff3b0', 0) +
    eye(107, 76, 7) + eye(107, 94, 7) +
    `<path d="M-10 168 L92 120" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M-10 168 L92 120" stroke="#7fb2ff" stroke-width="15" stroke-linecap="round"/>` +
    Ln('M30 146 l6 12 M54 136 l6 12 M78 126 l5 10', '#e9f2ff', 4) + glove(96, 118, 10, '#f3c7a1');

  A.microondas = () => bg('#e6ecf2', '#f3f6f9') +
    Ln('M70 52 q6 -8 0 -16 t0 -16 M100 48 q-6 -8 0 -16', '#9aa4b0', 4) +
    R(28, 58, 144, 98, 12, '#dfe5ea') + R(40, 70, 88, 74, 6, '#2b3346') +
    R(136, 70, 26, 74, 4, '#c9d2da', 3) + C(149, 86, 5, '#e23a2e', 2.5) + C(149, 104, 4, '#ffffff', 2.5) + C(149, 120, 4, '#ffffff', 2.5) +
    R(44, 156, 14, 8, 2, INK, 0) + R(142, 156, 14, 8, 2, INK, 0) +
    Ln('M70 136 L94 112 M90 110 l8 -8 M94 114 l8 -8 M98 118 l8 -8', '#c9d2da', 4) +
    P('M104 112 L114 100 L110 98 L120 86 L112 102 L118 104 Z', '#ffe066', 2.5) + P('M56 120 L48 108 L54 108 L46 96 L60 110 L54 110 Z', '#ffe066', 2.5) +
    eyes(84, 90, { gap: 30, r: 12, mood: 'sad', skin: '#2b3346' }) + mouth('wail', 84, 120, 16) + sweat(170, 52);

  A.caducidad = () => bg('#f0e6ff', '#f8f3ff') +
    G('rotate(-6 100 100)', R(34, 50, 132, 98, 10, '#ffffff') + R(42, 58, 116, 82, 6, 'none', 2.5, 'stroke-dasharray="5 5"') +
      eyes(100, 80, { gap: 30, r: 11, mood: 'sleepy', skin: '#ffffff' }) + T(100, 108, 'CONSUMIR ANTES DE', 9, INK) + T(100, 132, '03/98', 24, INK)) +
    G('rotate(-14 132 164)', `<rect x="90" y="152" width="86" height="24" rx="4" fill="#fff0f0" stroke="#e23a2e" stroke-width="3.5"/>` + T(133, 169, 'CADUCADO', 14, '#e23a2e'));

  A.limpieza = () => bg('#e8e8ee', '#f4f4f8') +
    Ln('M52 112 L22 88', INK, 18) + Ln('M52 112 L22 88', '#ffd23f', 12) + glove(18, 84, 11, '#ffd23f') +
    Ln('M148 112 L178 88', INK, 18) + Ln('M148 112 L178 88', '#ffd23f', 12) + glove(182, 84, 11, '#ffd23f') +
    P('M60 70 Q40 110 50 150 Q60 172 100 172 Q140 172 150 150 Q160 110 140 70 Q120 60 100 62 Q80 60 60 70 Z', '#2f2f3a') +
    P('M86 66 Q76 38 94 42 Q100 56 106 42 Q124 38 114 66 Z', '#2f2f3a') + Ln('M62 98 Q58 126 66 150 M140 92 q4 14 2 26', '#4a4a58', 4) +
    eyes(100, 104, { gap: 32, r: 12, mood: 'angry', skin: '#2f2f3a' }) + mouth('evil', 100, 128, 36);

  /* utensilios */
  A.tenedor = () => bg('#e8f0f8', '#f5f9fc') +
    R(86, 94, 28, 82, 14, '#ffffff') +
    P('M68 70 L68 86 Q68 104 100 104 Q132 104 132 86 L132 70 Z', '#ffffff') +
    R(68, 30, 10, 48, 5, '#ffffff', 3.5) + R(86, 30, 10, 48, 5, '#ffffff', 3.5) + G('rotate(28 109 76)', R(104, 30, 10, 48, 5, '#ffffff', 3.5)) + R(122, 30, 10, 48, 5, '#ffffff', 3.5) +
    eyes(100, 122, { gap: 22, r: 9 }) + mouth('wavy', 100, 144, 14) + sweat(126, 110, 0.8);

  A.chancla = () => bg('#dcecff', '#eef6ff') +
    Ln('M22 150 L58 126 M20 120 L52 102 M40 172 L70 150', '#a8c8f0', 5) +
    G('rotate(-28 104 104)',
      P('M100 40 Q132 40 134 80 Q136 112 128 140 Q120 170 98 168 Q74 166 70 136 Q64 100 68 70 Q72 40 100 40 Z', '#3f8efc') +
      P('M100 50 Q124 50 125 82 Q126 110 120 134 Q114 158 98 158 Q80 156 78 132 Q74 100 77 72 Q80 50 100 50 Z', '#6fb0ff', 0) +
      `<path d="M100 64 L74 110 M100 64 L128 110" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M100 64 L74 110 M100 64 L128 110" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>` + C(100, 64, 5, '#ffffff', 3) +
      eyes(100, 128, { gap: 26, r: 10, mood: 'angry', skin: '#6fb0ff' }) + mouth('teeth', 100, 150, 18)) +
    sparkle(164, 50, 0.9, '#ffd23f') + sparkle(176, 80, 0.5, '#ffd23f');

  A.cuchara = () => bg('#ffe9cf', '#fff4e6') +
    G('rotate(22 100 104)',
      R(92, 104, 16, 86, 8, '#c98a4b') + Ln('M100 116 L100 176', '#a86d36', 2) +
      E(100, 68, 36, 46, '#c98a4b') + E(100, 70, 28, 37, '#d9a066', 0) + Ln('M84 50 q8 20 2 40 M116 48 q-6 22 0 44', '#c08048', 2) +
      eyes(100, 64, { gap: 24, r: 9 }) + glasses(100, 64, 24, 11) + brows(100, 48, 24, 'angry', 3.5) + mouth('frown', 100, 90, 16));

  /* expansión */
  A.brocoli = () => bg('#e3f3d8', '#f1f9ea') +
    arm(72, 132, 40, 106, 6) + arm(128, 132, 160, 106, -6) +
    P('M84 108 L80 168 Q100 176 120 168 L116 108 Z', '#8fc85a') +
    blob([[70, 84, 24], [100, 66, 28], [130, 84, 24], [86, 98, 20], [114, 98, 20]], '#3f9a3a') +
    Ln('M78 70 q6 4 2 10 M112 56 q6 4 2 10 M132 76 q4 4 0 8', '#2c7a2b', 2.5) +
    eyes(100, 130, { gap: 24, r: 10, mood: 'smug', skin: '#8fc85a' }) + mouth('grin', 100, 148, 18);

  A.huerto = () => bg('#e6f4dc', '#f3faec') +
    [60, 100, 140].map((x, i) => { const y = 76 - (i % 2) * 10; return Ln(`M${x} 120 Q${x - 4} 96 ${x + 2} ${y}`, INK, 7) + Ln(`M${x} 120 Q${x - 4} 96 ${x + 2} ${y}`, '#6fb552', 3.5) +
      P(`M${x + 2} ${y + 2} q-18 -16 -26 2 q14 10 26 -2 Z`, '#7cc242', 3) + P(`M${x + 2} ${y} q16 -20 28 -4 q-12 14 -28 4 Z`, '#7cc242', 3); }).join('') +
    P('M30 118 L170 118 L160 168 L40 168 Z', '#c98a4b') + R(24, 110, 152, 14, 4, '#dca066') +
    eyes(100, 142, { gap: 28, r: 10 }) + mouth('smile', 100, 157, 16);

  A.albondiga = () => bg('#ffe3d2', '#fff1e8') + E(100, 162, 64, 12, '#e04a32', 3) +
    C(66, 134, 26, '#9a5a34') + C(134, 134, 26, '#9a5a34') + C(100, 98, 31, '#a8653b') +
    eyes(100, 94, { gap: 24, r: 10, mood: 'angry', skin: '#a8653b' }) + mouth('teeth', 100, 114, 18) +
    eyes(66, 131, { gap: 18, r: 7, mood: 'angry', skin: '#9a5a34' }) + eyes(134, 131, { gap: 18, r: 7, mood: 'smug', skin: '#9a5a34' }) +
    mouth('smirk', 66, 145, 10) + mouth('smirk', 134, 145, 10) + Ln('M100 66 L104 36', INK, 4) + C(104, 34, 5, '#e23a2e', 3);

  A.barbacoa = () => bg('#ffe2cc', '#fff1e4') + flame(64, 90, 0.9) + flame(104, 84, 1.1) + flame(142, 90, 0.9) +
    Ln('M62 150 L48 188 M138 150 L152 188', INK, 6) +
    P('M34 96 Q36 154 100 156 Q164 154 166 96 Z', '#3d3d48') + E(100, 96, 66, 12, '#5a5a66') +
    Ln('M50 96 L150 96 M60 90 L140 90 M60 102 L140 102', '#8b8b98', 2.5) +
    eyes(100, 124, { gap: 30, r: 11, mood: 'angry', skin: '#3d3d48' }) + mouth('evil', 100, 138, 26);

  A.morcilla = () => bg('#ecdfe6', '#f7eff3') +
    G('rotate(-14 100 108)', Ln('M42 106 l-14 -8 M158 106 l14 8', INK, 4) + R(40, 80, 120, 54, 27, '#3a2230') +
      [[60, 96], [84, 122], [136, 94], [146, 118]].map(([x, y]) => E(x, y, 3, 2, '#f3e9d8', 0)).join('') + shine(76, 90, 16, 4, 0, 0.3) +
      eyes(104, 102, { gap: 28, r: 11 }) + Ln('M92 121 Q106 131 120 117', '#f3e9d8', 3.5) + E(104, 78, 30, 9, '#1c1c24', 3) + Ln('M104 70 l0 -8', INK, 4));

  A.leche = () => bg('#dcefff', '#eef7ff') +
    P('M62 70 L100 44 L138 70 Z', '#e9f3fb') + R(92, 38, 16, 10, 2, '#3f8efc', 3) +
    R(62, 70, 76, 102, 4, '#ffffff') + P('M64 132 Q100 114 136 132 L136 170 L64 170 Z', '#3f8efc', 0) + R(62, 70, 76, 102, 4, 'none') +
    T(100, 162, 'LECHE', 14, '#fff') + eyes(100, 98, { gap: 28, r: 11 }) + mouth('smile', 100, 115, 18) + blush(78, 114) + blush(122, 114);

  A.kefir = () => bg('#eef0dc', '#f7f8ec') +
    [[70, 46, 5], [122, 36, 4], [138, 52, 6], [88, 30, 3]].map(([x, y, r]) => C(x, y, r, '#fff', 2.5)).join('') +
    R(60, 70, 80, 102, 16, 'rgba(214,236,251,0.9)') + R(66, 92, 68, 74, 10, '#f6f3e4', 0) + R(56, 58, 88, 18, 6, '#b9a15a') +
    eyes(100, 116, { gap: 26, r: 10, mood: 'sleepy', skin: '#f6f3e4' }) + P('M82 132 Q100 172 118 132 Q100 142 82 132 Z', '#fff') + mouth('o', 100, 135, 8);

  A.quesocurado = () => bg('#fbeecb', '#fff8e4') +
    E(100, 130, 68, 34, '#c98f2e') + E(100, 108, 68, 34, '#f1c95a') + P('M100 108 L167 102 L150 84 Z', '#fbe6a0', 3) +
    Ln('M38 124 q8 6 16 2 M148 132 q6 4 12 0', '#a8741f', 3) +
    eyes(88, 106, { gap: 26, r: 10, mood: 'smug', skin: '#f1c95a' }) + brows(88, 90, 26, 'raised', 3.5) + mouth('flat', 88, 124, 14) + T(100, 158, '1987', 12, '#fff3c4', 'Permanent Marker');

  A.kombucha = () => bg('#e2f3ea', '#f0faf4') +
    P('M84 30 L90 6 L98 24 L106 2 L114 28 Z', '#a55eea', 3) +
    P('M86 38 L114 38 L114 60 Q136 76 136 104 L136 172 L64 172 L64 104 Q64 76 86 60 Z', '#c98f4a') + R(84, 28, 32, 12, 4, '#3d3d48') +
    R(70, 126, 60, 40, 4, '#e9a94e', 0) + [[80, 136], [118, 142], [96, 158]].map(([x, y]) => C(x, y, 3, '#fff3c4', 0)).join('') +
    eyes(100, 96, { gap: 26, r: 10, mood: 'angry', skin: '#c98f4a' }) + mouth('grin', 100, 112, 20);

  A.nata = () => bg('#ffe8f0', '#fff4f8') +
    blob([[100, 138, 40], [66, 142, 22], [134, 142, 22], [100, 104, 30], [100, 78, 20]], '#fffdf8') +
    Ln('M72 118 q28 12 56 0 M84 90 q16 8 32 0', '#e3d6c4', 3) + C(100, 52, 10, '#e23a2e', 3.5) + Ln('M100 44 q4 -12 14 -14', INK, 3) +
    eyes(100, 134, { gap: 28, r: 10 }) + mouth('grin', 100, 150, 20) + blush(74, 150) + blush(126, 150);

  A.cocido = () => bg('#ffe9d2', '#fff4e8') + heat(60, 52, '#d9d4cc') + heat(146, 50, '#d9d4cc') +
    C(64, 84, 12, '#e8c28a', 3) + C(86, 78, 12, '#e8c28a', 3) + G('rotate(-20 120 76)', R(104, 62, 34, 22, 10, '#b8342b', 3.5)) + P('M134 88 q14 -22 26 -4 q-12 12 -26 4 Z', '#7cc242', 3) +
    E(26, 116, 10, 7, '#a85b2b', 3.5) + E(174, 116, 10, 7, '#a85b2b', 3.5) +
    P('M34 92 Q30 166 100 168 Q170 166 166 92 Z', '#c0703a') + E(100, 92, 66, 12, '#a85b2b') +
    eyes(100, 124, { gap: 32, r: 12 }) + mouth('grin', 100, 142, 28) + blush(68, 142) + blush(132, 142);

  A.mantequilla = () => bg('#fff3c0', '#fffbe2') + E(100, 160, 72, 12, '#ffe98a', 3) +
    P('M44 90 L156 90 L160 150 Q130 164 100 152 Q70 166 40 150 Z', '#ffe066') + P('M44 90 L60 72 L170 72 L156 90 Z', '#fff2a8', 3.5) + P('M156 90 L170 72 L174 130 L160 150 Z', '#f2c93a', 3.5) +
    eyes(98, 116, { gap: 30, r: 11, mood: 'sleepy', skin: '#ffe066' }) + mouth('smile', 98, 135, 18) + sweat(54, 112, 0.8) + sweat(142, 122, 0.7);

  A.nachos = () => bg('#ffe6c4', '#fff3e0') + E(100, 158, 76, 16, '#ffffff') +
    P('M38 152 L62 86 L92 152 Z', '#f2b33e') + P('M108 152 L138 84 L164 152 Z', '#f2b33e') + P('M60 154 L100 58 L140 154 Z', '#f7c552') +
    P('M82 96 L100 58 L118 96 q-2 12 -8 2 q-4 14 -10 0 q-4 10 -8 0 q-4 8 -10 -2 Z', '#ffe066', 3) + C(80, 142, 5, '#e23a2e', 2.5) + C(122, 144, 5, '#7cc242', 2.5) +
    eyes(100, 118, { gap: 22, r: 9 }) + mouth('grin', 100, 134, 16);

  A.rodillo = () => bg('#f3e6d6', '#faf3ea') + Ln('M24 152 L52 142 M30 172 L60 158', '#d9c2a4', 4) + G('rotate(-24 100 104)',
    R(14, 94, 40, 20, 10, '#b8742c') + R(146, 94, 40, 20, 10, '#b8742c') + R(44, 78, 112, 52, 22, '#e0b074') + Ln('M62 88 L138 88', '#f0cf9c', 4) +
    eyes(100, 102, { gap: 28, r: 10, mood: 'angry', skin: '#e0b074' }) + mouth('teeth', 100, 120, 18)) + sparkle(162, 54, 0.8, '#ffd23f');

  A.patatas = () => bg('#ffe9c4', '#fff5e0') +
    [[70, -12], [84, 4], [98, -6], [112, 6], [128, -10]].map(([x, r]) => G(`rotate(${r} ${x} 100)`, R(x - 7, 36, 14, 74, 3, '#ffd257', 3.5))).join('') +
    P('M56 96 Q100 114 144 96 L134 172 L66 172 Z', '#e23a2e') +
    eyes(100, 130, { gap: 28, r: 11 }) + mouth('grin', 100, 148, 22);

  A.alioli = () => bg('#f4f1dc', '#fbf9ec') + stink(34, 76) +
    `<path d="M120 86 L156 36" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M120 86 L156 36" stroke="#d9c49a" stroke-width="9" stroke-linecap="round"/>` +
    P('M40 92 Q44 162 100 164 Q156 162 160 92 Z', '#f2d44e') + Ln('M52 112 Q100 126 148 112', '#3fa34d', 4) + E(100, 92, 60, 12, '#fbf6e0') +
    eyes(100, 130, { gap: 28, r: 11, mood: 'smug', skin: '#f2d44e' }) + mouth('smirk', 100, 148, 18);

  A.salsa = () => bg('#ffdcd2', '#ffeee8') + flame(156, 84, 0.8) + flame(40, 96, 0.6) +
    R(88, 30, 24, 28, 4, '#3d3d48') + P('M82 56 L118 56 Q134 80 134 104 L134 170 L66 170 L66 104 Q66 80 82 56 Z', '#e04a32') + R(72, 134, 56, 26, 4, '#fff3c4', 3) + T(100, 152, 'BRAVA', 12, '#c4231a') +
    eyes(100, 92, { gap: 26, r: 10, mood: 'angry', skin: '#e04a32' }) + mouth('evil', 100, 106, 20);

  A.platano = () => bg('#fff5c2', '#fffbe2') + Ln('M150 60 l14 -10 M160 80 l16 -2 M40 64 l-12 -8', '#e0c040', 4) +
    P('M100 70 Q58 90 32 152 Q64 152 94 116 Z', '#ffd93b') + P('M100 70 Q142 90 168 152 Q136 152 106 116 Z', '#ffd93b') + P('M100 70 Q86 122 100 174 Q114 122 100 70 Z', '#ffe76b') +
    P('M92 74 Q100 38 108 74 Z', '#b8962a', 3.5) +
    eyes(100, 102, { gap: 16, r: 7, mood: 'smug', skin: '#ffe76b' }) + mouth('smirk', 100, 118, 10);

  A.nota = () => bg('#e6ecf2', '#f3f6f9') + G('rotate(-5 100 104)', R(38, 44, 124, 122, 2, '#ffe97a') + C(100, 44, 9, '#e23a2e', 3.5) +
    T(100, 78, 'QUIEN SE COMIÓ', 11, INK, 'Permanent Marker') + T(100, 96, 'MI YOGUR', 15, '#c4231a', 'Permanent Marker') +
    eyes(100, 120, { gap: 28, r: 10, mood: 'angry', skin: '#ffe97a' }) + mouth('flat', 100, 138, 18) + T(100, 158, 'Gracias :)', 11, INK, 'Permanent Marker'));

  A.wasabi = () => bg('#e2f3d6', '#f0f9ea') + flame(164, 156, 0.5) +
    `<ellipse cx="100" cy="60" rx="24" ry="7" fill="none" stroke="${INK}" stroke-width="8"/><ellipse cx="100" cy="60" rx="24" ry="7" fill="none" stroke="#f7b500" stroke-width="4"/>` +
    P('M56 152 Q46 112 76 106 Q80 80 104 84 Q130 78 132 108 Q158 118 146 152 Q100 168 56 152 Z', '#9ccc3c') + shine(84, 102, 10, 5) +
    eyes(100, 124, { gap: 28, r: 11, look: [0, -0.8] }) + mouth('smile', 100, 142, 16) + blush(76, 140) + blush(124, 140);

  /* héroes */
  A.hero_abuela = () => bg('#f6e3f0', '#fbf0f7') +
    P('M24 210 Q30 152 100 148 Q170 152 176 210 Z', '#9b5de5') + P('M74 150 L100 176 L126 150 Z', '#ffffff', 3) +
    [74, 84, 94, 106, 116, 126].map((x, i) => C(x, 152 + Math.sin(i / 1.6) * 6 + 6, 4, '#fff8ee', 2)).join('') +
    E(54, 104, 8, 11, '#f6c9a8', 3.5) + E(146, 104, 8, 11, '#f6c9a8', 3.5) +
    E(100, 102, 46, 52, '#f6c9a8') +
    blob([[60, 74, 16], [74, 56, 18], [100, 48, 19], [126, 56, 18], [140, 74, 16], [100, 26, 16]], '#dcdce4') +
    Ln('M84 34 q4 -6 10 0 M104 30 q4 -6 10 0', '#b9b9c6', 2.5) +
    eyes(100, 100, { gap: 34, r: 11 }) + glasses(100, 100, 34, 15) + Ln('M68 100 Q60 124 62 150 M132 100 Q140 124 138 150', '#d9a930', 1.8) +
    Ln('M70 116 l-6 3 M130 116 l6 3', '#d79a80', 2) + blush(72, 122, 9, 6) + blush(128, 122, 9, 6) + mouth('smile', 100, 126, 26);

  A.hero_toni = () => bg('#dff3ec', '#eefaf5') +
    P('M22 210 Q28 148 100 144 Q172 148 178 210 Z', '#3fa58a') + Ln('M86 150 L84 180 M114 150 L116 180', '#ffffff', 3) +
    `<path d="M58 146 Q100 176 142 146" fill="none" stroke="${INK}" stroke-width="9"/>` + R(48, 136, 18, 24, 8, INK, 0) + R(134, 136, 18, 24, 8, INK, 0) +
    E(56, 106, 8, 11, '#f1c09a', 3.5) + E(144, 106, 8, 11, '#f1c09a', 3.5) +
    E(100, 102, 44, 50, '#f1c09a') +
    P('M56 92 L52 62 L68 72 L70 46 L86 62 L96 38 L106 60 L122 42 L126 66 L144 58 L144 92 Q126 70 100 74 Q74 70 56 92 Z', '#5a3b2a') +
    [[78, 134], [86, 140], [96, 142], [106, 142], [116, 140], [124, 134], [72, 126], [128, 126]].map(([x, y]) => C(x, y, 1.6, '#9a7a68', 0)).join('') +
    eyes(100, 102, { gap: 32, r: 11, mood: 'smug', skin: '#f1c09a' }) + brows(100, 86, 32, 'one') + mouth('smirk', 100, 124, 24) +
    `<path d="M110 126 L150 118" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M110 126 L150 118" stroke="#c9d2da" stroke-width="4" stroke-linecap="round"/>` +
    P('M146 150 L178 150 L174 186 Q162 192 150 186 Z', '#fbfbf5', 3.5) + R(148, 160, 28, 12, 2, '#ffe066', 0) + T(162, 170, 'MARI', 9, INK, 'Permanent Marker');

  A.hero_chef = () => bg('#fff0e0', '#fff8f0') +
    P('M22 210 Q28 156 100 152 Q172 156 178 210 Z', '#ffffff') + C(86, 180, 3.5, INK, 0) + C(114, 180, 3.5, INK, 0) + C(86, 196, 3.5, INK, 0) + C(114, 196, 3.5, INK, 0) +
    P('M74 152 Q100 172 126 152 L120 166 Q100 178 80 166 Z', '#e23a2e', 3) +
    E(100, 110, 42, 48, '#f3c7a1') +
    R(70, 28, 60, 44, 6, '#ffffff', 0) + blob([[80, 30, 18], [100, 18, 22], [120, 30, 18]], '#ffffff') + R(70, 26, 60, 46, 4, 'none', 0) +
    `<rect x="68" y="56" width="64" height="20" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="4"/>` + Ln('M70 30 L70 58 M130 30 L130 58', INK, 4) +
    eyes(100, 106, { gap: 30, r: 11, mood: 'smug', skin: '#f3c7a1' }) + brows(100, 90, 30, 'one') +
    P('M100 126 Q84 116 72 124 Q62 132 58 120 Q56 112 64 112 Q58 120 66 122 Q80 112 100 122 Q120 112 134 122 Q142 120 136 112 Q144 112 142 120 Q138 132 128 124 Q116 116 100 126 Z', INK, 2) +
    mouth('smirk', 102, 140, 14);

  A.hero_michi = () => bg('#ffe9cf', '#fff4e6') +
    P('M30 210 Q36 160 100 156 Q164 160 170 210 Z', '#f39c3d') +
    P('M50 122 Q46 74 70 62 L62 22 L94 52 Q100 50 106 52 L138 22 L130 62 Q154 74 150 122 Q148 162 100 164 Q52 162 50 122 Z', '#f39c3d') +
    P('M68 56 L66 34 L84 50 Z', '#ffb3c1', 0) + P('M132 56 L134 34 L116 50 Z', '#ffb3c1', 0) +
    Ln('M92 58 l2 14 M100 56 l0 16 M108 58 l-2 14 M54 108 l14 4 M54 122 l14 0 M146 108 l-14 4 M146 122 l-14 0', '#cf7420', 4) +
    E(100, 132, 28, 18, '#fff4e6', 0) + P('M94 124 L106 124 L100 131 Z', '#ff8fa3', 2.5) + mouth('cat', 100, 134, 16) +
    Ln('M70 130 L36 124 M70 136 L38 140 M130 130 L164 124 M130 136 L162 140', INK, 2) +
    eyes(100, 102, { gap: 42, r: 14, mood: 'bored', skin: '#f39c3d', sclera: '#eaf37a' }) +
    G('rotate(28 172 150)', P('M160 128 L184 128 L180 170 L164 170 Z', 'rgba(214,236,251,0.9)', 3.5) + R(163, 146, 18, 22, 2, '#8fd8ff', 0)) +
    C(150, 176, 12, '#f39c3d', 3.5) + C(146, 172, 3, '#ffb3c1', 0) + C(154, 172, 3, '#ffb3c1', 0);

  /* ---------- API ---------- */
  const cache = {};
  TW.Art = {
    has: (id) => !!A[id],
    svg(id) {
      if (cache[id]) return cache[id];
      const fn = A[id] || A.miga;
      return (cache[id] = `<svg class="art" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${fn()}</svg>`);
    },
    hero(id) { return this.svg('hero_' + id); },
    // Imágenes sueltas para el menú (cara de comida decorativa)
    face(id) { return this.svg(id); },
  };
})();
