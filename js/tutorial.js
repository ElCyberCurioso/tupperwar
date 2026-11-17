/* Tupperwar — tutorial jugable.
   Una partida de práctica con mazos y jugadas preparadas: la Abuela Puri (la CPU)
   explica cada cosa justo cuando aparece y solo deja hacer el paso que toca.
   Hay dos lecciones: «Lo básico» y «Trucos de chef» (familias, vecinos y combate).
   Guion: lista de pasos. Cada paso es uno de estos:
     { say, next: true }          explicación con botón «Siguiente»
     { say, do: {...} }            el jugador debe hacer esa acción
     { say, free: true }           el jugador juega libremente (final)
     { say, free: 'turn' }         juega libremente hasta cerrar la nevera
     { cpu: {...} }                jugada de la Abuela
     { say, cpuSay: true }         comentario de la Abuela durante su turno
   Las acciones se describen por carta: { play: 'kiwi', target: 'ajo' | 'hero1' },
   { attack: ['kiwi', 'ajo'] }, { power: 'hero1' }, { end: true }. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const STEPS = [
    /* ---------- Turno 1: calorías y sacar comida ---------- */
    { next: true, say: '¡Hola, cariño! Soy la **Abuela Puri** y te voy a enseñar a jugar. Tú defiendes tu balda de la nevera y yo la mía. Gana quien deje al otro **sin salud**.', focus: 'hero:1' },
    { next: true, say: 'Ese corazón rojo es la salud de cada héroe. Yo tengo 15 y tú 30, que para eso soy mayor.', focus: 'hero:0' },
    { next: true, say: 'Abajo tienes tus cartas. El círculo naranja de cada una es lo que cuesta en **calorías**. Pasa el ratón por encima de una carta para leerla en grande.', focus: 'handzone' },
    { next: true, say: 'Tus calorías están aquí. Este turno tienes **1**. Cada turno ganas una más, hasta 10, y se recargan al empezar tu turno.', focus: 'mana:0', pos: 'left' },
    { do: { play: 'guisante' }, say: 'Vamos a sacar comida. **Arrastra el Guisante Fugitivo** desde tu mano hasta tu balda.', drag: ['hand:guisante', 'lane'] },
    { next: true, say: 'Las comidas recién sacadas están dormidas (**Zzz**): podrán atacar en tu próximo turno. El círculo amarillo es su **ataque** y el corazón, su **salud**.', focus: 'mine:guisante' },
    { do: { end: true }, say: 'Ya no te quedan calorías. Pulsa **Cerrar la nevera** para terminar tu turno.', point: 'end', pos: 'left' },

    /* ---------- Turno 1 de la Abuela ---------- */
    { cpu: { play: 'miga' } },
    { cpuSay: true, say: 'Yo saco esta **Miga de Pan**. No cuesta nada, pero algo es algo. Te toca.', focus: 'opp:miga' },

    /* ---------- Turno 2: atacar ---------- */
    { next: true, say: 'Tu Guisante ya se ha despertado. Las comidas que **brillan en verde** pueden atacar este turno.', focus: 'mine:guisante' },
    { do: { attack: ['guisante', 'miga'] }, say: 'Para atacar, **arrastra desde tu Guisante hasta mi Miga**. Saldrá una flecha de kétchup para apuntar.', drag: ['mine:guisante', 'opp:miga'] },
    { next: true, say: 'Al chocar, **cada uno hace su ataque al otro**. Mi Miga tenía 1 de salud y se ha muerto; tu Guisante ha perdido 1 pero sigue vivo. ¡Buen cambio!', focus: 'mine:guisante' },
    { do: { play: 'kiwi' }, say: 'Tienes 2 calorías. **Saca al Kiwi Peludo**.', drag: ['hand:kiwi', 'lane'] },
    { next: true, say: 'Ese **Kéfir** de tu mano tiene **Fermenta**: cada turno que lo guardas, crece +1/+1. Mira cómo ha cambiado. Guárdalo de momento.', focus: 'hand:kefir' },
    { do: { end: true }, say: 'Termina el turno.', point: 'end', pos: 'left' },

    /* ---------- Turno 2 de la Abuela ---------- */
    { cpu: { play: 'ajo' } },
    { cpuSay: true, say: 'Este **Diente de Ajo** tiene **Estorbo** (el escudo gris de detrás): mientras esté vivo, tendrás que atacarle a él antes que a nada.', focus: 'opp:ajo' },

    /* ---------- Turno 3: Estorbo, atacar al héroe, poder de héroe ---------- */
    { do: { attack: ['kiwi', 'ajo'] }, say: 'Quítame el Ajo de en medio: **ataca al Ajo con el Kiwi**. Si intentas atacarme a mí, no te dejará.', drag: ['mine:kiwi', 'opp:ajo'] },
    { do: { attack: ['guisante', 'hero1'] }, say: 'Sin Estorbo, ya puedes ir a por mí. **Ataca mi foto con el Guisante**.', drag: ['mine:guisante', 'hero:1'] },
    { next: true, say: 'Tu héroe también tiene una **habilidad**: el círculo junto a tu foto. Cuesta 2 calorías y se puede usar una vez por turno. La tuya hace 1 de daño.', focus: 'power:0', pos: 'left' },
    { do: { power: 'hero1' }, say: '**Pulsa tu habilidad y apunta a mi foto.**', drag: ['power:0', 'hero:1'] },
    { do: { play: 'kefir' }, say: 'Tu Kéfir lleva tres turnos fermentando: ahora es un **4/5 que sigue costando 1**. ¡Sácalo!', drag: ['hand:kefir', 'lane'] },
    { do: { end: true }, say: 'Muy bien. Termina el turno.', point: 'end', pos: 'left' },

    /* ---------- Turno 3 de la Abuela: trampa y Cáscara ---------- */
    { cpu: { play: 'platano' } },
    { cpuSay: true, say: 'Uy, ¿qué será ese **«?»** junto a mi foto? Es una **trampa**: está escondida y salta sola cuando haces algo concreto. Ya verás.', focus: 'traps:1', pos: 'right' },
    { cpu: { play: 'huevo' } },
    { cpuSay: true, say: 'Y este **Huevo Duro** tiene **Cáscara** (el brillo dorado): el primer golpe que reciba no le hará nada.', focus: 'opp:huevo' },

    /* ---------- Turno 4: romper la Cáscara, caer en la trampa ---------- */
    { do: { power: 'huevo' }, say: 'Truco de abuela: rompe la Cáscara con algo pequeño. **Usa tu habilidad contra el Huevo.**', drag: ['power:0', 'opp:huevo'] },
    { do: { attack: ['guisante', 'huevo'] }, say: 'Sin cáscara ya no se protege. **Ataca al Huevo con el Guisante.** Los dos tienen 1 de salud, así que caerán los dos.', drag: ['mine:guisante', 'opp:huevo'] },
    { do: { attack: ['kiwi', 'hero1'] }, say: 'Ahora **ataca mi foto con el Kiwi**, a ver qué pasa...', drag: ['mine:kiwi', 'hero:1'] },
    { next: true, say: '¡Ja! Era una **Cáscara de Plátano**: tu Kiwi ha resbalado y ha vuelto a tu mano. Así son las trampas: no sabes cuál es hasta que salta. Ya se ha gastado.', focus: 'hand:kiwi' },
    { do: { attack: ['kefir', 'hero1'] }, say: 'Ya no hay trampa. **Ataca mi foto con el Kéfir.**', drag: ['mine:kefir', 'hero:1'] },
    { do: { play: 'kiwi' }, say: 'Te quedan 2 calorías: **vuelve a sacar el Kiwi**.', drag: ['hand:kiwi', 'lane'] },
    { do: { end: true }, say: 'Termina el turno.', point: 'end', pos: 'left' },

    /* ---------- Turno 4 de la Abuela: Con hambre ---------- */
    { cpu: { play: 'gamba' } },
    { cpuSay: true, say: 'Esta **Gamba Saltarina** tiene **Con hambre**: puede atacar a otras comidas el mismo turno en que sale. Lo siento por tu Kiwi.', focus: 'opp:gamba' },
    { cpu: { attack: ['gamba', 'kiwi'] } },
    { cpu: { play: 'natillas' } },
    { cpuSay: true, say: 'Me quedo con 9 de salud. Prepárate, que el turno que viene te enseño a hacer **combos**.', focus: 'hero:1', pos: 'right' },

    /* ---------- Turno 5: trucos con objetivo y Guarnición ---------- */
    { next: true, say: 'Las fichas de receta son **trucos**: efectos de un solo uso. Algunos piden un objetivo y te dejan elegir con la flecha.', focus: 'hand:sal' },
    { do: { play: 'sal', target: 'natillas' }, say: '**Arrastra el Pellizco de Sal y apunta a mis Natillas.** Les hará 2 de daño.', drag: ['hand:sal', 'opp:natillas'] },
    { next: true, say: '¿Ves que la **Salsa Brava** y las **Patatas** brillan en dorado? Tienen **Guarnición**: hacen algo extra si ya has jugado otra carta este turno.', focus: 'hand:salsa' },
    { do: { play: 'salsa', target: 'hero1' }, say: 'Con Guarnición, la Salsa Brava hace 4 de daño en vez de 2. **Lánzamela a la cara.**', drag: ['hand:salsa', 'hero:1'] },
    { do: { play: 'patatas' }, say: 'Las **Patatas Fritas** con Guarnición salen con +1/+1 y **Exprés**: pueden atacar ya. **Sácalas.**', drag: ['hand:patatas', 'lane'] },
    { do: { attack: ['patatas', 'hero1'] }, say: '**Ataca mi foto con las Patatas.** El Exprés les deja atacar recién sacadas.', drag: ['mine:patatas', 'hero:1'] },
    { do: { attack: ['kefir', 'natillas'] }, say: 'Y remata mis Natillas con el **Kéfir**: ya están tocadas por la sal.', drag: ['mine:kefir', 'opp:natillas'] },
    { do: { end: true }, say: '¡Qué bien lo haces! Termina el turno.', point: 'end', pos: 'left' },

    /* ---------- Turno 5 de la Abuela ---------- */
    { cpu: { play: 'sandia' } },
    { cpuSay: true, say: 'Me quedan 2 de salud y saco una **Sandía Sumo** con Estorbo. A ver cómo me ganas ahora, listillo.', focus: 'opp:sandia' },

    /* ---------- Turno 6: libre ---------- */
    { next: true, say: 'El Estorbo solo frena a las comidas que atacan. **Los trucos y tu habilidad** pueden ir directos a mi foto.', focus: 'hero:1', pos: 'right' },
    { free: true, say: 'Ahora tú solo: **gana la partida**. Pista: tienes otro Pellizco de Sal y 6 calorías.' },
  ];

  /* ---------- Lección 2: familias, vecinos y combate ---------- */
  const STEPS2 = [
    { next: true, say: 'Segunda lección: **trucos de chef**. Hoy juegas con **Lola**, la heladera, y ya tienes comida en tu balda. Empezamos con 5 calorías.', focus: 'hero:0' },
    { next: true, say: 'Cada comida tiene una **familia**, escrita en la parte de abajo de su carta: **Verdura**, **Chicha**, **Lácteo** o **Guiso**. Pasa el ratón por tus comidas para verlo.', focus: 'lane' },
    { do: { play: 'brocoli' }, say: 'El **Brócoli Culturista** da +1/+1 a tus demás **Verduras**. **Sácalo.**', drag: ['hand:brocoli', 'lane'] },
    { next: true, say: 'El Guisante y la Zanahoria son Verduras y han crecido. El Costillar es **Chicha**, así que se queda igual. Montar un mazo de una familia tiene premio.', focus: 'lane' },
    { next: true, say: 'Mi **Pollo Asado** tiene **Cabreo**: cada vez que sobrevive a un golpe se enfada y gana +2 de ataque. El icono rojo de debajo te lo recuerda.', focus: 'opp:pollo', pos: 'right' },
    { do: { attack: ['zanahoria', 'pollo'] }, say: 'Tu **Zanahoria** ataca **A distancia**: no recibe el golpe de vuelta. **Ataca al Pollo con ella.**', drag: ['mine:zanahoria', 'opp:pollo'] },
    { next: true, say: 'Tu Zanahoria sigue intacta, pero mi Pollo se ha cabreado y ahora pega 4. Mejor que no te ataque...', focus: 'opp:pollo', pos: 'right' },
    { do: { power: 'pollo' }, say: 'Tu habilidad, **Brisa ártica**, congela a una comida enemiga y le hace perder su próximo ataque. **Congela al Pollo.**', drag: ['power:0', 'opp:pollo'] },
    { do: { end: true }, say: 'Perfecto. Cierra la nevera.', point: 'end', pos: 'left' },

    { cpu: { play: 'pizza' } },
    { cpu: { play: 'miga' } },
    { cpuSay: true, say: 'He puesto mi **Pizza** entre el Pollo y la Miga. Mi Pollo sigue congelado y no puede atacar. Te toca.', focus: 'opp:pizza', pos: 'right' },

    { next: true, say: 'Las comidas que están justo al lado de otra son sus **vecinos**. Algunas cartas golpean o mejoran a los vecinos, así que importa dónde se coloca cada una.', focus: 'opp:pizza', pos: 'right' },
    { do: { attack: ['costillar', 'pizza'] }, say: 'Tu **Costillar** tiene **Salpicón**: al atacar, daña también a los vecinos del objetivo. **Ataca a la Pizza.**', drag: ['mine:costillar', 'opp:pizza'] },
    { next: true, say: '¡Tres de un golpe! Y mi Pizza tenía **Último bocado** (el icono gris): al morir ha dejado dos Porciones Frías.', focus: 'opp:porcion', pos: 'right' },
    { do: { play: 'helado', target: 'porcion' }, say: 'El **Helado de Tres Bolas** congela a una comida y a sus vecinos. **Sácalo y apunta a una Porción.**', drag: ['hand:helado', 'lane'] },
    { do: { power: 'porcion' }, say: 'Ahora lo bueno: Brisa ártica hace **2 de daño a lo que ya está congelado**. **Úsala en una Porción.**', drag: ['power:0', 'opp:porcion'] },
    { free: 'turn', say: 'Ahora ataca con lo que quieras (a mi foto, por ejemplo) y, cuando acabes, **cierra la nevera**.' },

    { cpu: { play: 'natillas' } },
    { cpu: { play: 'bocata' } },
    { cpuSay: true, say: 'Unas natillas y un bocata. Con esto aguanto, ya verás.', focus: 'opp:bocata', pos: 'right' },

    { next: true, say: 'Te ha llegado el **Chuletón de Ávila**: tiene **Con hambre** (puede atacar a comidas nada más salir) y **Arrollar** (el daño que sobra al matar una comida me llega a mí).', focus: 'hand:chuleton' },
    { do: { play: 'chuleton' }, say: '**Saca el Chuletón.** Cuesta 7 y tienes 7 justas.', drag: ['hand:chuleton', 'lane'] },
    { do: { attack: ['chuleton', 'natillas'] }, say: '**Ataca a mis Natillas con el Chuletón.** Tienen 3 de salud y él pega 6: los otros 3 me los llevo yo.', drag: ['mine:chuleton', 'opp:natillas'] },
    { free: true, say: 'Ya conoces todos los trucos de la cocina. **Remátame** con lo que tengas.' },
  ];

  const LESSONS = {
    basico: {
      id: 'basico', title: 'Lo básico', heroes: ['toni', 'abuela'], tutorHp: 15,
      playerDeck: ['guisante', 'kiwi', 'kefir', 'sal', 'patatas', 'salsa', 'sal', 'nata', 'garbanzos', 'caldito', 'miga', 'miga', 'croqueta', 'bocata'],
      cpuDeck: ['miga', 'ajo', 'platano', 'huevo', 'gamba', 'natillas', 'sandia', 'croqueta', 'bocata', 'pan', 'leche', 'queso'],
      steps: STEPS, flag: 'tutorialDone', next: 'experto',
      learned: 'calorías, sacar comida, atacar, Estorbo, habilidad de héroe, Fermenta, Cáscara, trampas, Con hambre, trucos con objetivo, Guarnición y Exprés',
      more: 'En la <b>lección 2</b> verás las <b>familias</b>, los <b>vecinos</b>, Salpicón, Arrollar, A distancia, Cabreo, Último bocado y cómo combinar la congelación.',
    },
    experto: {
      id: 'experto', title: 'Trucos de chef', heroes: ['lola', 'abuela'], tutorHp: 20,
      playerDeck: ['brocoli', 'helado', 'chuleton', 'nata', 'sal', 'garbanzos', 'caldito', 'miga', 'bocata', 'croqueta'],
      cpuDeck: ['pizza', 'miga', 'natillas', 'bocata', 'pan', 'leche', 'queso', 'croqueta', 'huevo', 'ajo'],
      setup(g) {
        for (const pl of g.s.players) pl.maxMana = 4;
        for (const id of ['guisante', 'zanahoria', 'costillar']) g.summon(0, id);
        g.summon(1, 'pollo');
      },
      steps: STEPS2, flag: 'tutorial2Done',
      learned: 'familias, vecinos, A distancia, Cabreo, congelar, Salpicón, Último bocado, Con hambre y Arrollar',
      more: 'Con esto ya conoces todas las mecánicas. Prueba a montar un <b>mazo de una sola familia</b> en Mis mazos y estrénalo contra la CPU.',
    },
  };

  /* ---------- controlador ---------- */
  class Tutorial {
    constructor(lesson, opts) {
      this.lesson = lesson;
      this.steps = lesson.steps;
      this.opts = opts;
      this.idx = 0;
      this.shown = -1;
      this.waitNext = null;
    }

    start(wrap) {
      const L = this.lesson;
      const game = new TW.Game({
        seed: 20261117, heroes: L.heroes, decks: [L.playerDeck, L.cpuDeck], first: 0,
        noShuffle: true, noCoin: true, ai: [false, true], names: ['Tú', 'Abuela Puri'],
      });
      const t = game.hero(1);
      t.health = t.maxHealth = L.tutorHp;
      if (L.setup) L.setup(game);
      game.flush();
      this.g = game;
      this.view = new TW.GameView({
        game, me: 0, mode: 'cpu', tutorial: true, skipMulligan: true,
        gate: (a) => this.gate(a),
        onAfter: (a) => this.onAfter(a),
        aiPick: () => this.aiPick(),
        highlight: (kind, uid) => this.highlight(kind, uid),
        onGameOver: (v) => this.finish(v),
        onExit: () => this.exit(),
      }).mount(wrap);
      this.layer = document.createElement('div');
      this.layer.className = 'tut-layer';
      this.layer.innerHTML = `<div class="tut-spot"></div><svg class="tut-drag" viewBox="0 0 1600 900"><path class="td-path"/></svg><div class="tut-hand"></div><div class="tut-arrow"></div>
        <div class="tut-box"><div class="tb-face">${TW.Art.hero('abuela')}</div><div class="tb-body"><div class="tb-name">Abuela Puri</div><p class="tb-text"></p><p class="tb-hint"></p>
        <div class="tb-row"><span class="tb-prog"></span><button class="btn small tb-next">Siguiente</button></div></div></div>`;
      this.view.stage.appendChild(this.layer);
      this.box = this.layer.querySelector('.tut-box');
      this.layer.querySelector('.tb-next').addEventListener('click', () => this.next());
      this.onKey = (e) => { if ((e.key === 'Enter' || e.key === ' ') && this.box.classList.contains('needs-next') && !e.target.closest('input')) { e.preventDefault(); this.next(); } };
      window.addEventListener('keydown', this.onKey);
      this.tick = setInterval(() => this.update(), 150);
      this.view.start();
      return this;
    }

    get step() { return this.steps[this.idx]; }
    isPlayerStep(s) { return s && (s.next || s.do || s.free); }

    /* --- utilidades de cartas --- */
    handCard(id) { return this.g.player(0).hand.find((c) => c.cardId === id); }
    minion(p, id) { return this.g.board(p).find((m) => m.cardId === id); }
    entMatches(uid, want) {
      if (!want) return true;
      if (want === 'hero0' || want === 'hero1') return uid === want;
      const e = this.g.byUid(uid);
      return !!e && e.kind === 'minion' && e.cardId === want;
    }
    matches(act, spec) {
      if (!spec) return false;
      const g = this.g;
      if (spec.end) return act.type === 'end';
      if (spec.play) {
        if (act.type !== 'play') return false;
        const c = g.player(act.p).hand.find((x) => x.uid === act.uid);
        return !!c && c.cardId === spec.play && (!spec.target || this.entMatches(act.target, spec.target));
      }
      if (spec.attack) return act.type === 'attack' && this.entMatches(act.a, spec.attack[0]) && this.entMatches(act.t, spec.attack[1]);
      if (spec.power) return act.type === 'power' && this.entMatches(act.target, spec.power);
      return false;
    }
    resolveCpu(spec) {
      const g = this.g, p = 1;
      const uidOf = (want, side) => (want === 'hero0' || want === 'hero1' ? want : (this.minion(side, want) || {}).uid);
      if (spec.play) {
        const c = g.player(p).hand.find((x) => x.cardId === spec.play);
        return c ? { type: 'play', p, uid: c.uid, pos: g.board(p).length, target: spec.target ? uidOf(spec.target, 0) : undefined } : null;
      }
      if (spec.attack) return { type: 'attack', p, a: uidOf(spec.attack[0], 1), t: uidOf(spec.attack[1], 0) };
      if (spec.power) return { type: 'power', p, target: uidOf(spec.power, spec.power === 'hero1' ? 1 : 0) };
      return null;
    }

    /* --- ganchos de la vista --- */
    gate(act) {
      const s = this.step;
      if (act.type === 'choose' || act.type === 'concede') return true;
      if (s && s.free) return true;
      if (s && s.do && this.matches(act, s.do)) { this.allowed = act; return true; }
      this.complain(s && s.next ? 'Primero lee esto y pulsa **Siguiente**.' : 'Ahora no, cariño. Haz lo que te digo y luego juegas como quieras.');
      return false;
    }
    // La comprobación se hizo antes de jugar (después la carta ya no está en la mano o el esbirro ha muerto)
    onAfter(act) {
      if (act === this.allowed) { this.allowed = null; this.advance(); return; }
      const s = this.step;
      if (s && s.free === 'turn' && act.type === 'end') this.advance();
    }
    highlight(kind, uid) {
      const s = this.step;
      if (!s || s.free) return true;
      if (!s.do) return false;
      const d = s.do;
      if (kind === 'end') return !!d.end;
      if (kind === 'power') return !!d.power;
      if (kind === 'play') { const c = this.g.player(0).hand.find((x) => x.uid === uid); return !!d.play && !!c && c.cardId === d.play; }
      if (kind === 'attack') return !!d.attack && this.entMatches(uid, d.attack[0]);
      return false;
    }
    async aiPick() {
      for (;;) {
        if (this.view.dead) return null;
        const s = this.step;
        if (!s || this.isPlayerStep(s)) return null;
        if (s.cpu) { this.advance(); const a = this.resolveCpu(s.cpu); if (a) return a; continue; }
        if (s.cpuSay) {
          this.show(s);
          await new Promise((r) => { this.waitNext = r; });
          await sleep(250);
          continue;
        }
        this.advance();
      }
    }

    /* --- flujo --- */
    advance() { this.idx++; this.hide(); }
    next() {
      const s = this.step;
      if (!s || !(s.next || s.cpuSay)) return;
      TW.Sfx.play('pop');
      const w = this.waitNext;
      this.waitNext = null;
      this.advance();
      if (w) w();
    }
    update() {
      const v = this.view;
      if (!v || v.dead) return;
      this.position();
      const s = this.step;
      if (!this.isPlayerStep(s) || this.shown === this.idx) return;
      if (v.busy || v.overlayOpen || v.aiRunning || this.g.s.phase !== 'play' || this.g.s.current !== 0) return;
      this.show(s);
    }

    show(s) {
      this.shown = this.idx;
      const b = this.box;
      b.querySelector('.tb-text').innerHTML = TW.fmt(s.say);
      b.querySelector('.tb-hint').innerHTML = '';
      const total = this.steps.filter((x) => x.say).length, n = this.steps.slice(0, this.idx + 1).filter((x) => x.say).length;
      b.querySelector('.tb-prog').textContent = `${n} de ${total}`;
      b.classList.toggle('needs-next', !!(s.next || s.cpuSay));
      b.classList.toggle('pos-right', s.pos === 'right');
      b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
      this.cur = s;
      this.position();
      TW.Sfx.play('emote');
    }
    hide() {
      this.cur = null;
      this.box.classList.remove('on');
      this.layer.querySelector('.tut-spot').classList.remove('on');
      this.layer.querySelector('.tut-arrow').classList.remove('on');
      this.layer.querySelector('.tut-hand').classList.remove('on');
      this.layer.querySelector('.tut-drag').classList.remove('on');
    }
    complain(text) {
      const h = this.box.querySelector('.tb-hint');
      h.innerHTML = TW.fmt(text);
      this.box.classList.remove('shake'); void this.box.offsetWidth; this.box.classList.add('shake');
    }

    // Busca el elemento del tablero al que se refiere un paso
    el(ref) {
      const v = this.view;
      if (!ref) return null;
      const [k, a] = ref.split(':');
      if (k === 'hand') { const c = this.handCard(a); return c ? v.handEls.get(c.uid) : null; }
      if (k === 'mine' || k === 'opp') { const m = this.minion(k === 'mine' ? 0 : 1, a); return m ? v.minEls.get(m.uid) : null; }
      if (k === 'hero') return v.heroEl(+a);
      if (k === 'power') return v.powerEl(+a);
      if (k === 'mana') return v.manaEl(+a);
      if (k === 'traps') return v.trapsEl(+a);
      if (k === 'end') return v.endBtn;
      if (k === 'lane') return v.laneMe;
      if (k === 'olane') return v.stage.querySelector('.lane.opp');
      if (k === 'handzone') return null;
      return null;
    }
    rectOf(ref) {
      if (ref === 'handzone') return { x: 430, y: 770, w: 740, h: 140 };
      const el = this.el(ref);
      if (!el) return null;
      const v = this.view, r = el.getBoundingClientRect(), sr = v.stage.getBoundingClientRect();
      let x = (r.left - sr.left) / v.scale, y = (r.top - sr.top) / v.scale, w = r.width / v.scale, h = r.height / v.scale;
      if (ref.startsWith('hand:')) { y -= 20; h = Math.max(h, 180); }
      return { x, y, w, h };
    }
    position() {
      const s = this.cur;
      if (!s) return;
      const spot = this.layer.querySelector('.tut-spot'), arrow = this.layer.querySelector('.tut-arrow');
      const hand = this.layer.querySelector('.tut-hand'), drag = this.layer.querySelector('.tut-drag');
      const f = s.focus ? this.rectOf(s.focus) : null;
      spot.classList.toggle('on', !!f);
      if (f) { const pad = 14; Object.assign(spot.style, { left: f.x - pad + 'px', top: f.y - pad + 'px', width: f.w + pad * 2 + 'px', height: f.h + pad * 2 + 'px' }); }
      const p = s.point ? this.rectOf(s.point) : null;
      arrow.classList.toggle('on', !!p);
      if (p) { arrow.style.left = p.x + p.w / 2 + 'px'; arrow.style.top = p.y - 8 + 'px'; }
      const d = s.drag ? [this.rectOf(s.drag[0]), this.rectOf(s.drag[1])] : null;
      const ok = d && d[0] && d[1] && !this.view.busy && !this.view.aim && !this.view.drag;
      hand.classList.toggle('on', !!ok);
      drag.classList.toggle('on', !!ok);
      if (ok) {
        const ax = d[0].x + d[0].w / 2, ay = d[0].y + Math.min(d[0].h / 2, 70), bx = d[1].x + d[1].w / 2, by = d[1].y + d[1].h / 2;
        const key = [ax, ay, bx, by].map(Math.round).join(',');
        if (this.dragKey !== key) {
          this.dragKey = key;
          const mx = (ax + bx) / 2, my = Math.min(ay, by) - 80;
          drag.querySelector('.td-path').setAttribute('d', `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`);
          hand.style.setProperty('--ax', ax + 'px'); hand.style.setProperty('--ay', ay + 'px');
          hand.style.setProperty('--bx', bx + 'px'); hand.style.setProperty('--by', by + 'px');
          hand.style.animation = 'none'; void hand.offsetWidth; hand.style.animation = '';
        }
      }
    }

    finish(v) {
      const won = this.g.s.winner === 0, L = this.lesson;
      if (won) try { TW.saveSettings && TW.saveSettings({ [L.flag]: true }); } catch (e) { /* nada */ }
      this.hide();
      TW.Sfx.play(won ? 'win' : 'lose');
      const o = v.overlay(`<div class="result-card tut-end">
        <div class="ph">${TW.Art.hero('abuela')}</div>
        <h2>${won ? '¡Lo has bordado!' : 'Casi, cariño'}</h2>
        <p class="quote">${won ? (L.next ? 'Ya sabes lo básico. Toma, llévate un táper.' : 'Ya cocinas como yo. Bueno, casi.') : 'Vuelve a intentarlo, que se aprende jugando.'}</p>
        <div class="tut-learn">
          <p><b>Has aprendido:</b> ${L.learned}.</p>
          <p>${L.more}</p>
        </div>
        <div class="btns">
          ${L.next ? `<button class="btn red" data-t="lesson:${L.next}">Siguiente lección</button>` : `<button class="btn red" data-t="cpu">Jugar contra la CPU</button>`}
          ${L.next ? `<button class="btn" data-t="cpu">Jugar contra la CPU</button>` : `<button class="btn" data-t="decks">Crear un mazo</button>`}
          <button class="btn white" data-t="lesson:${L.id}">Repetir lección</button>
          <button class="btn white" data-t="menu">Menú principal</button>
        </div></div>`, 'over');
      o.addEventListener('click', (e) => {
        const b = e.target.closest('[data-t]');
        if (!b) return;
        const t = b.dataset.t;
        this.exit(t);
      });
    }

    destroy() {
      clearInterval(this.tick);
      window.removeEventListener('keydown', this.onKey);
      if (this.waitNext) { const w = this.waitNext; this.waitNext = null; w(); }
      if (this.view) this.view.destroy();
      this.view = null;
    }
    exit(to) {
      this.destroy();
      if (this.opts.onExit) this.opts.onExit(to || 'menu');
    }
  }

  TW.Tutorial = {
    LESSONS,
    start(wrap, opts = {}) { return new Tutorial(LESSONS[opts.lesson] || LESSONS.basico, opts).start(wrap); },
  };
})();
