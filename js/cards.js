/* Tupperwar — cartas, héroes y palabras clave.
   Para añadir una carta: añade un objeto a la lista y una ilustración en art.js
   con la misma id. Los efectos reciben (g, ctx) con ctx = { p, self, target, choice, pos }. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});

  TW.KEYWORDS = {
    taunt: { name: 'Estorbo', desc: 'Los enemigos tienen que atacarlo antes que a cualquier otro objetivo.' },
    divineShield: { name: 'Cáscara', desc: 'Ignora el primer daño que recibe.' },
    poisonous: { name: 'Caducado', desc: 'Destruye a cualquier esbirro al que inflija daño.' },
    charge: { name: 'Exprés', desc: 'Puede atacar en el mismo turno en que sale de la nevera.' },
    windfury: { name: 'Doble ración', desc: 'Puede atacar dos veces por turno.' },
    stealth: { name: 'Al fondo', desc: 'Escondido detrás del kétchup: no se le puede atacar ni elegir como objetivo hasta que ataque.' },
    lifesteal: { name: 'Nutritivo', desc: 'El daño que inflige cura a tu héroe.' },
    battlecry: { name: 'Al sacarlo', desc: 'Se activa al jugar la carta desde tu mano.' },
    deathrattle: { name: 'Último bocado', desc: 'Se activa cuando el esbirro muere.' },
    freeze: { name: 'Congelar', desc: 'Un personaje congelado pierde su próximo ataque.' },
    silence: { name: 'Soso', desc: 'Pierde todo su texto, sus palabras clave y sus mejoras.' },
    discover: { name: 'Descubre', desc: 'Elige una de tres cartas al azar y añádela a tu mano.' },
    chooseOne: { name: 'Elige una', desc: 'Al jugarla, eliges uno de dos efectos.' },
    endOfTurn: { name: 'Al final de tu turno', desc: 'Se activa cada vez que terminas tu turno.' },
    garnish: { name: 'Guarnición', desc: 'Se activa si ya has jugado otra carta este mismo turno.' },
    ferment: { name: 'Fermenta', desc: 'Mientras está en tu mano gana +1/+1 al empezar cada turno tuyo (máximo +3/+3).' },
    neighbors: { name: 'Vecinos', desc: 'Los esbirros situados justo a su izquierda y a su derecha. La posición en la balda importa.' },
    trap: { name: 'Trampa', desc: 'Se queda oculta junto a tu héroe y salta sola en el turno del rival. Máximo 3, todas distintas.' },
  };

  const enemyRandom = (g, p) => g.pick(g.enemyChars(p));
  const enemyMinionRandom = (g, p) => g.pick(g.enemyMinions(p).filter((m) => g.alive(m)));

  const L = [
    /* ===================== ESBIRROS ===================== */
    { id: 'miga', name: 'Miga de Pan', type: 'minion', cost: 0, attack: 1, health: 1, rarity: 'comun',
      text: '', flavor: 'Lleva ahí desde 2019. Ya es de la familia.', quote: '¡Hola! ¿Me recordáis?' },

    { id: 'guisante', name: 'Guisante Fugitivo', type: 'minion', cost: 1, attack: 1, health: 2, rarity: 'comun',
      text: '', flavor: 'Se escapó del plato rodando y nunca miró atrás.', quote: '¡Nunca me cogeréis!' },

    { id: 'huevo', name: 'Huevo Duro', type: 'minion', cost: 1, attack: 1, health: 1, rarity: 'comun',
      keywords: ['divineShield'], kw: ['divineShield'], text: '**Cáscara**',
      flavor: 'Duro por fuera. Duro por dentro. Duro de verdad.', quote: 'Toc, toc. No hay nadie.' },

    { id: 'aceituna', name: 'Aceituna Espía', type: 'minion', cost: 1, attack: 2, health: 1, rarity: 'comun',
      keywords: ['stealth'], kw: ['stealth'], text: '**Al fondo**',
      flavor: 'Lleva tres semanas en el fondo del bote. Lo ha visto todo.', quote: 'Yo no estoy aquí.' },

    { id: 'ajo', name: 'Diente de Ajo', type: 'minion', cost: 1, attack: 1, health: 2, rarity: 'comun',
      keywords: ['taunt'], kw: ['taunt'], text: '**Estorbo**',
      flavor: 'Repele vampiros, citas y compañeros de piso.', quote: '¿A qué huele? A mí.' },

    { id: 'cubito', name: 'Cubito de Hielo', type: 'minion', cost: 1, attack: 1, health: 1, rarity: 'comun',
      kw: ['battlecry', 'freeze'], text: '**Al sacarlo:** congela a un esbirro enemigo.',
      flavor: 'Lo más frío de la nevera. Emocionalmente también.', quote: 'Brrr.',
      battlecry: { target: 'enemyMinion', run: (g, c) => g.freeze(c.target) } },

    { id: 'ketchup', name: 'Sobre de Kétchup', type: 'minion', cost: 1, attack: 1, health: 1, rarity: 'comun',
      kw: ['deathrattle'], text: '**Último bocado:** inflige 2 de daño a un enemigo aleatorio.',
      flavor: 'Siempre apunta a la camisa blanca.', quote: '¡Apretadme si os atrevéis!',
      deathrattle: (g, c) => { const t = enemyRandom(g, c.p); if (t) { g.missile(c.self, t, 'ketchup'); g.damage(g.spellSrc(c.p), t, 2); } } },

    { id: 'limon', name: 'Limón Resentido', type: 'minion', cost: 2, attack: 2, health: 1, rarity: 'comun',
      kw: ['battlecry'], text: '**Al sacarlo:** inflige 1 de daño.',
      flavor: 'Lleva medio año envuelto en film. Está amargado.', quote: '¡Ácido para todos!',
      battlecry: { target: 'any', run: (g, c) => { g.missile(c.self, c.target, 'acido'); g.damage(c.self, c.target, 1); } } },

    { id: 'salchicha', name: 'Salchicha Cohete', type: 'minion', cost: 2, attack: 2, health: 1, rarity: 'comun',
      keywords: ['charge'], kw: ['charge'], text: '**Exprés**',
      flavor: 'Saltó de la sartén. Literalmente.', quote: '¡Fiuuuuuu!' },

    { id: 'natillas', name: 'Natillas Temblonas', type: 'minion', cost: 2, attack: 2, health: 3, rarity: 'comun',
      text: '', flavor: 'Tiemblan. No sabemos si de miedo o de emoción.', quote: 'N-n-no tengo miedo.' },

    { id: 'kiwi', name: 'Kiwi Peludo', type: 'minion', cost: 2, attack: 3, health: 2, rarity: 'comun',
      text: '', flavor: 'Lleva diez años sin ir a la peluquería. Y se nota.', quote: '¡Ni se te ocurra pelarme!' },

    { id: 'maiz', name: 'Grano de Maíz', type: 'minion', cost: 2, attack: 1, health: 2, rarity: 'comun',
      kw: ['deathrattle'], text: '**Último bocado:** invoca una Palomita 2/1.',
      flavor: 'Bajo presión, todos explotamos.', quote: 'Hace calor aquí, ¿no?',
      deathrattle: (g, c) => { const m = g.summon(c.p, 'palomita', c.pos); if (m) g.say(m, '¡POP!'); } },

    { id: 'yogur', name: 'Yogur Caducado', type: 'minion', cost: 2, attack: 1, health: 2, rarity: 'rara',
      keywords: ['poisonous'], kw: ['poisonous'], text: '**Caducado**',
      flavor: 'Caducó en marzo. ¿De qué año? Nadie lo sabe.', quote: 'Huéleme. Te reto.' },

    { id: 'pimiento', name: 'Pimiento de Padrón', type: 'minion', cost: 2, attack: 2, health: 2, rarity: 'rara',
      kw: ['battlecry'], text: '**Al sacarlo:** 50 % de probabilidades de infligir 3 de daño a un enemigo aleatorio.',
      flavor: 'Unos pican y otros no.',
      battlecry: { run: (g, c) => {
        if (g.chance(0.5)) {
          const t = enemyRandom(g, c.p);
          g.say(c.self, '¡PICA, PICA, PICA!');
          if (t) { g.missile(c.self, t, 'fuego'); g.damage(c.self, t, 3); }
        } else g.say(c.self, 'Hoy no picaba...');
      } } },

    { id: 'croqueta', name: 'Croqueta de la Abuela', type: 'minion', cost: 3, attack: 3, health: 3, rarity: 'comun',
      kw: ['battlecry'], text: '**Al sacarlo:** restaura 3 de salud a tu héroe.',
      flavor: 'Nadie sabe qué lleva dentro. La abuela tampoco.', quote: '¡Hecha con amor y sobras!',
      battlecry: { run: (g, c) => g.heal(c.self, g.hero(c.p), 3) } },

    { id: 'cebolla', name: 'Cebolla Llorona', type: 'minion', cost: 3, attack: 2, health: 3, rarity: 'rara',
      kw: ['battlecry'], text: '**Al sacarlo:** inflige 1 de daño a todos los esbirros enemigos.',
      flavor: 'No está triste. Eres tú el que llora.', quote: '¡Buaaaaaa!',
      battlecry: { run: (g, c) => { for (const m of [...g.enemyMinions(c.p)]) g.damage(c.self, m, 1); } } },

    { id: 'queso', name: 'Queso Apestoso', type: 'minion', cost: 3, attack: 2, health: 4, rarity: 'rara',
      kw: ['endOfTurn'], text: '**Al final de tu turno,** inflige 1 de daño a un esbirro enemigo aleatorio.',
      flavor: 'Su olor tiene código postal propio.', quote: '¿Qué pasa? Es mi perfume.',
      endOfTurn: (g, c) => { const t = enemyMinionRandom(g, c.p); if (t) { g.missile(c.self, t, 'peste'); g.damage(c.self, t, 1); } } },

    { id: 'pan', name: 'Pan de Molde Soso', type: 'minion', cost: 3, attack: 2, health: 3, rarity: 'rara',
      kw: ['battlecry', 'silence'], text: '**Al sacarlo:** vuelve **Soso** a un esbirro.',
      flavor: 'Es tan aburrido que lo contagia.', quote: 'Hola. Soy pan.',
      battlecry: { target: 'minion', run: (g, c) => g.silence(c.target) } },

    { id: 'bocata', name: 'Bocata de Calamares', type: 'minion', cost: 3, attack: 3, health: 4, rarity: 'comun',
      text: '', flavor: 'Orgullo de la Plaza Mayor. Ni de mar ni de tierra: de Madrid.', quote: '¡Que no lleva mayonesa, hombre!' },

    { id: 'tupper', name: 'Tupper Misterioso', type: 'minion', cost: 3, attack: 3, health: 3, rarity: 'epica',
      kw: ['battlecry'], text: '**Al sacarlo:** ¡ábrelo! Se transforma en un esbirro aleatorio que cueste de 1 a 6.',
      flavor: 'Nadie se atreve a abrirlo desde 2021.', quote: 'Ñiiiic...',
      battlecry: { run: (g, c) => {
        const pool = g.collectible((d) => d.type === 'minion' && d.cost >= 1 && d.cost <= 6 && d.id !== 'tupper');
        const id = g.pick(pool);
        g.transform(c.self, id);
        g.say(c.self, '¡Sorpresa!');
      } } },

    { id: 'berenjena', name: 'Berenjena de Gimnasio', type: 'minion', cost: 3, attack: 2, health: 2, rarity: 'rara',
      kw: ['battlecry'], text: '**Al sacarlo:** gana +1/+1 por cada otro esbirro aliado.',
      flavor: 'Hace sentadillas en el cajón de las verduras.', quote: '¿Tú entrenas, bro?',
      battlecry: { run: (g, c) => { const n = g.friendlyMinions(c.p).length - 1; if (n > 0) g.buff(c.self, n, n); } } },

    { id: 'coliflor', name: 'Coliflor Cerebrito', type: 'minion', cost: 4, attack: 3, health: 3, rarity: 'comun',
      kw: ['battlecry'], text: '**Al sacarlo:** roba una carta.',
      flavor: 'Parece un cerebro. Lo es. Tiene un doctorado.', quote: 'Fascinante.',
      battlecry: { run: (g, c) => g.draw(c.p) } },

    { id: 'pizza', name: 'Pizza de Anoche', type: 'minion', cost: 4, attack: 3, health: 3, rarity: 'comun',
      kw: ['deathrattle'], text: '**Último bocado:** invoca dos Porciones Frías 1/1.',
      flavor: 'Fría está mejor. Esto no es negociable.', quote: '¿Piña? Jamás.',
      deathrattle: (g, c) => { g.summon(c.p, 'porcion', c.pos); g.summon(c.p, 'porcion', c.pos); } },

    { id: 'sandia', name: 'Sandía Sumo', type: 'minion', cost: 4, attack: 3, health: 5, rarity: 'comun',
      keywords: ['taunt'], kw: ['taunt'], text: '**Estorbo**',
      flavor: 'Pesa nueve kilos y sabe dar empujones.', quote: '¡De aquí no pasa nadie!' },

    { id: 'chorizo', name: 'Chorizo Vengativo', type: 'minion', cost: 4, attack: 4, health: 3, rarity: 'rara',
      keywords: ['charge'], kw: ['charge'], text: '**Exprés**',
      flavor: 'Lo echaron de la paella. Ahora tiene prisa.', quote: '¡En la paella no, dijeron!' },

    { id: 'tortilla', name: 'Tortilla de Patatas', type: 'minion', cost: 4, attack: 3, health: 4, rarity: 'legendaria',
      kw: ['chooseOne', 'charge', 'taunt'],
      text: '**Elige una:** Con cebolla: **Exprés**. Sin cebolla: +2 de salud y **Estorbo**.',
      flavor: 'El debate más violento de la península.',
      chooseOne: [
        { name: 'Con cebolla', text: '**Exprés**', run: (g, c) => { c.self.charge = true; g.say(c.self, '¡Con cebolla o nada!'); } },
        { name: 'Sin cebolla', text: '+2 de salud y **Estorbo**', run: (g, c) => { c.self.taunt = true; g.buff(c.self, 0, 2); g.say(c.self, 'Sin cebolla. Fin del debate.'); } },
      ] },

    { id: 'jamon', name: 'Jamón Ibérico', type: 'minion', cost: 5, attack: 4, health: 6, rarity: 'rara',
      keywords: ['lifesteal'], kw: ['lifesteal'], text: '**Nutritivo**',
      flavor: 'Pata negra. Exige que le hables de usted.', quote: 'Trátame de usted.' },

    { id: 'pulpo', name: 'Pulpo a Feira', type: 'minion', cost: 5, attack: 3, health: 5, rarity: 'rara',
      keywords: ['windfury'], kw: ['windfury'], text: '**Doble ración**',
      flavor: 'Ocho brazos. Ocho tortas.', quote: '¡Que vienen ocho!' },

    { id: 'guisantes', name: 'Guisantes Congelados', type: 'minion', cost: 5, attack: 4, health: 4, rarity: 'comun',
      kw: ['battlecry', 'freeze'], text: '**Al sacarlo:** congela a un esbirro enemigo y restaura 4 de salud a tu héroe.',
      flavor: 'No son para comer. Son para el chichón.', quote: '¿Dónde te duele?',
      battlecry: { target: 'enemyMinion', run: (g, c) => { g.freeze(c.target); g.heal(c.self, g.hero(c.p), 4); } } },

    { id: 'paella', name: 'Paella del Domingo', type: 'minion', cost: 6, attack: 4, health: 5, rarity: 'epica',
      kw: ['battlecry'], text: '**Al sacarlo:** otorga +1/+1 a tus demás esbirros.',
      flavor: 'Hecha para cuatro. Sobró para veinte.', quote: '¡A comer, que se enfría!',
      battlecry: { run: (g, c) => { for (const m of g.friendlyMinions(c.p)) if (m !== c.self) g.buff(m, 1, 1); } } },

    { id: 'pavo', name: 'Pavo Superviviente', type: 'minion', cost: 6, attack: 4, health: 5, rarity: 'rara',
      kw: ['deathrattle'], text: '**Último bocado:** invoca dos Sobras de Pavo 2/2.',
      flavor: 'Sobrevivió a Navidad. Y a Reyes. Y a febrero.', quote: 'Sigo aquí.',
      deathrattle: (g, c) => { g.summon(c.p, 'sobra', c.pos); g.summon(c.p, 'sobra', c.pos); } },

    { id: 'lasana', name: 'Lasaña Blindada', type: 'minion', cost: 6, attack: 4, health: 7, rarity: 'comun',
      keywords: ['taunt'], kw: ['taunt'], text: '**Estorbo**',
      flavor: 'Capa sobre capa sobre capa. Impenetrable.', quote: 'Capa uno: paciencia.' },

    { id: 'tarta', name: 'Tarta Olvidada', type: 'minion', cost: 7, attack: 6, health: 6, rarity: 'epica',
      kw: ['battlecry'], text: '**Al sacarlo:** inflige 2 de daño a todos los demás esbirros.',
      flavor: 'Era para el cumpleaños del primo. El primo ya tiene 40 años.', quote: '¡Soplad las velas! ¡TODAS!',
      battlecry: { run: (g, c) => { for (const m of g.allMinions()) if (m !== c.self) g.damage(c.self, m, 2); } } },

    { id: 'lentejas', name: 'Olla de Lentejas Infinita', type: 'minion', cost: 8, attack: 5, health: 8, rarity: 'legendaria',
      keywords: ['taunt'], kw: ['taunt', 'endOfTurn'],
      text: '**Estorbo.** **Al final de tu turno,** invoca un Táper de Lentejas 2/2 con **Estorbo**.',
      flavor: 'Si quieres las comes. Y si no, también.', quote: 'Hay más en la olla.',
      endOfTurn: (g, c) => { const pos = g.board(c.p).indexOf(c.self) + 1; const m = g.summon(c.p, 'taperlentejas', pos); if (m) g.say(m, 'Para el lunes.'); } },

    { id: 'fabada', name: 'Fabada Radiactiva', type: 'minion', cost: 8, attack: 6, health: 6, rarity: 'epica',
      kw: ['battlecry'], text: '**Al sacarlo:** inflige 3 de daño a todos los demás personajes.',
      flavor: 'Efectos secundarios: todos.', quote: 'Uy. Perdón.',
      battlecry: { run: (g, c) => {
        for (const m of g.allMinions()) if (m !== c.self) g.damage(c.self, m, 3);
        g.damage(c.self, g.hero(c.p), 3); g.damage(c.self, g.hero(1 - c.p), 3);
      } } },

    { id: 'primigenio', name: 'El Yogur Primigenio', type: 'minion', cost: 10, attack: 10, health: 10, rarity: 'legendaria',
      kw: ['battlecry'], text: '**Al sacarlo:** destruye a todos los demás esbirros.',
      flavor: 'El primer yogur que entró en esta nevera. Dentro hay una civilización.', quote: 'Postraos ante mí.',
      battlecry: { run: (g, c) => { for (const m of g.allMinions()) if (m !== c.self) g.destroy(m); } } },

    /* ===================== TRUCOS (hechizos) ===================== */
    { id: 'sal', name: 'Pellizco de Sal', type: 'spell', cost: 1, rarity: 'comun',
      text: 'Inflige 2 de daño.', flavor: 'En la herida, que es donde más escuece.',
      spell: { target: 'any', run: (g, c) => { g.missile(g.hero(c.p), c.target, 'sal'); g.damage(g.spellSrc(c.p), c.target, 2); } } },

    { id: 'aluminio', name: 'Papel de Aluminio', type: 'spell', cost: 1, rarity: 'comun', kw: ['divineShield'],
      text: 'Otorga **Cáscara** y +1 de salud a un esbirro.', flavor: 'Brillante, crujiente y sorprendentemente resistente.',
      spell: { target: 'minion', run: (g, c) => { c.target.divineShield = true; g.buff(c.target, 0, 1); } } },

    { id: 'nevera', name: 'Mirar la Nevera', type: 'spell', cost: 1, rarity: 'rara', kw: ['discover'],
      text: '**Descubre** una carta.', flavor: 'Llevas cuatro minutos mirando. No vas a coger nada.',
      spell: { run: (g, c) => g.discover(c.p, g.collectible()) } },

    { id: 'ajeno', name: 'Tupper Ajeno', type: 'spell', cost: 1, rarity: 'rara',
      text: 'Añade a tu mano una copia de una carta aleatoria del mazo rival.',
      flavor: 'Ponía «NO TOCAR – MARI CARMEN». Lo tocaste.',
      spell: { run: (g, c) => { const d = g.player(1 - c.p).deck; if (d.length) g.addToHand(c.p, g.pick(d).cardId); } } },

    { id: 'batido', name: 'Batido de Proteínas', type: 'spell', cost: 2, rarity: 'comun',
      text: 'Otorga +2/+2 a un esbirro.', flavor: 'Sabor vainilla y decisiones cuestionables.',
      spell: { target: 'minion', run: (g, c) => g.buff(c.target, 2, 2) } },

    { id: 'garbanzos', name: 'Lluvia de Garbanzos', type: 'spell', cost: 2, rarity: 'comun',
      text: 'Inflige 4 de daño repartido al azar entre los enemigos.', flavor: 'Del cocido a tu cara en 0,3 segundos.',
      spell: { run: (g, c) => g.randomSplash(c.p, 4) } },

    { id: 'vuelta', name: 'Vuelta al Táper', type: 'spell', cost: 2, rarity: 'comun',
      text: 'Devuelve un esbirro a la mano de su dueño.', flavor: 'Para mañana, que recalentado está mejor.',
      spell: { target: 'minion', run: (g, c) => g.bounce(c.target) } },

    { id: 'caldito', name: 'Caldito de la Abuela', type: 'spell', cost: 2, rarity: 'comun',
      text: 'Restaura 4 de salud. Roba una carta.', flavor: 'Cura resfriados, desamores y huesos rotos.',
      spell: { target: 'any', run: (g, c) => { g.heal(null, c.target, 4); g.draw(c.p); } } },

    { id: 'siesta', name: 'Siesta Obligatoria', type: 'spell', cost: 3, rarity: 'rara', kw: ['freeze'],
      text: '**Congela** a todos los esbirros enemigos.', flavor: 'De tres a cinco aquí no se mueve nadie.',
      spell: { run: (g, c) => { for (const m of g.enemyMinions(c.p)) g.freeze(m); } } },

    { id: 'asalto', name: 'Asalto Nocturno a la Nevera', type: 'spell', cost: 3, rarity: 'comun',
      text: 'Roba 2 cartas.', flavor: 'Nadie te vio. Salvo la lucecita de la nevera.',
      spell: { run: (g, c) => { g.draw(c.p); g.draw(c.p); } } },

    { id: 'microondas', name: 'Microondas a Tope', type: 'spell', cost: 4, rarity: 'rara',
      text: 'Inflige 2 de daño a todos los esbirros enemigos.', flavor: 'Metiste un tenedor. Error de principiante.',
      spell: { run: (g, c) => { for (const m of [...g.enemyMinions(c.p)]) g.damage(g.spellSrc(c.p), m, 2); } } },

    { id: 'caducidad', name: 'Fecha de Caducidad', type: 'spell', cost: 5, rarity: 'comun',
      text: 'Destruye a un esbirro enemigo.', flavor: 'Ya lo decía la etiqueta.',
      spell: { target: 'enemyMinion', run: (g, c) => g.destroy(c.target) } },

    { id: 'limpieza', name: 'Limpieza Anual de Nevera', type: 'spell', cost: 7, rarity: 'epica',
      text: 'Destruye a todos los esbirros.', flavor: 'Ocurre una vez al año. Mueren inocentes.',
      spell: { run: (g) => { for (const m of g.allMinions()) g.destroy(m); } } },

    /* ===================== EXPANSIÓN: FAMILIAS, VECINOS, GUARNICIÓN, FERMENTA Y TRAMPAS ===================== */
    { id: 'brocoli', name: 'Brócoli Culturista', type: 'minion', cost: 3, attack: 3, health: 2, rarity: 'rara',
      kw: ['battlecry'], text: '**Al sacarlo:** otorga +1/+1 a tus demás **Verduras**.',
      flavor: 'Come pollo con arroz. Él, que es un brócoli.', quote: '¡Día de pierna!',
      battlecry: { run: (g, c) => { for (const m of g.famMinions(c.p, 'verdura', c.self)) g.buff(m, 1, 1); } } },

    { id: 'albondiga', name: 'Albóndigas en Pandilla', type: 'minion', cost: 3, attack: 2, health: 2, rarity: 'comun',
      kw: ['battlecry'], text: '**Al sacarlo:** si controlas otra **Chicha**, invoca otra pandilla 2/2.',
      flavor: 'Nunca van solas. Nunca.', quote: '¿Algún problema, colega?',
      battlecry: { run: (g, c) => { if (g.famMinions(c.p, 'chicha', c.self).length) g.summon(c.p, 'albondiga', c.pos + 1); } } },

    { id: 'morcilla', name: 'Morcilla de Burgos', type: 'minion', cost: 2, attack: 2, health: 3, rarity: 'comun',
      kw: ['deathrattle'], text: '**Último bocado:** otorga +2/+2 a otra **Chicha** aliada aleatoria.',
      flavor: 'Lleva arroz. Y no admite preguntas.', quote: 'De Burgos, ¿eh? De Burgos.',
      deathrattle: (g, c) => { const t = g.pick(g.famMinions(c.p, 'chicha', c.self)); if (t) g.buff(t, 2, 2); } },

    { id: 'leche', name: 'Cartón de Leche', type: 'minion', cost: 2, attack: 1, health: 3, rarity: 'comun',
      kw: ['endOfTurn'], text: '**Al final de tu turno,** restaura 1 de salud a tu héroe por cada **Lácteo** que controles.',
      flavor: 'Abierto por el lado que no era.', quote: '¡Calcio para todos!',
      endOfTurn: (g, c) => g.heal(c.self, g.hero(c.p), g.famMinions(c.p, 'lacteo').length) },

    { id: 'kefir', name: 'Kéfir Ancestral', type: 'minion', cost: 1, attack: 1, health: 2, rarity: 'rara', ferment: true,
      kw: ['ferment'], text: '**Fermenta**',
      flavor: 'Te lo regaló un compañero de yoga. Sigue vivo. El kéfir.', quote: 'Blub.' },

    { id: 'quesocurado', name: 'Queso Curado', type: 'minion', cost: 4, attack: 3, health: 4, rarity: 'rara', ferment: true,
      keywords: ['taunt'], kw: ['taunt', 'ferment'], text: '**Estorbo.** **Fermenta**',
      flavor: 'Cuanto más viejo, más caro. Como los pisos.', quote: 'Yo ya estaba aquí antes que tú.' },

    { id: 'kombucha', name: 'Kombucha Rebelde', type: 'minion', cost: 4, attack: 3, health: 2, rarity: 'epica', ferment: true,
      keywords: ['charge'], kw: ['charge', 'ferment'], text: '**Exprés.** **Fermenta**',
      flavor: 'Nadie sabe si está buena o está mala. Ella tampoco.', quote: '¡Abajo el refresco!' },

    { id: 'cocido', name: 'Cocido Completo', type: 'minion', cost: 5, attack: 4, health: 4, rarity: 'epica',
      kw: ['battlecry'], text: '**Al sacarlo:** gana +1/+1 por cada familia distinta entre tus demás esbirros.',
      flavor: 'Sopa, garbanzos y carne. Tres vuelcos y una siesta.', quote: '¡Aquí cabe todo!',
      battlecry: { run: (g, c) => {
        const fams = new Set(g.friendlyMinions(c.p).filter((m) => m !== c.self).map((m) => g.def(m.cardId).fam).filter(Boolean));
        if (fams.size) g.buff(c.self, fams.size, fams.size);
      } } },

    { id: 'mantequilla', name: 'Mantequilla Derretida', type: 'minion', cost: 2, attack: 1, health: 3, rarity: 'rara',
      kw: ['endOfTurn', 'neighbors'], text: '**Al final de tu turno,** otorga +1 de ataque a sus **vecinos**.',
      flavor: 'Alguien la dejó fuera de la nevera. Ahora es de todos.', quote: 'Me derrito por vosotros.',
      endOfTurn: (g, c) => { for (const m of g.neighbors(c.self)) g.buff(m, 1, 0); } },

    { id: 'nachos', name: 'Nachos con Todo', type: 'minion', cost: 4, attack: 3, health: 3, rarity: 'rara',
      kw: ['battlecry', 'neighbors', 'taunt'], text: '**Al sacarlo:** otorga +1/+1 y **Estorbo** a sus **vecinos**.',
      flavor: 'Para compartir. Eso dijiste antes de comértelos tú.', quote: '¡Pegaos a mí!',
      battlecry: { run: (g, c) => { for (const m of g.neighbors(c.self)) { m.taunt = true; g.buff(m, 1, 1); } } } },

    { id: 'patatas', name: 'Patatas Fritas', type: 'minion', cost: 2, attack: 2, health: 2, rarity: 'comun', garnish: true,
      kw: ['garnish', 'charge'], text: '**Guarnición:** gana +1/+1 y **Exprés**.',
      flavor: 'Solo iba a coger una.', quote: '¿Con qué vengo hoy?',
      battlecry: { run: (g, c) => { if (c.combo) { c.self.charge = true; g.buff(c.self, 1, 1); } } } },

    { id: 'alioli', name: 'Alioli Casero', type: 'minion', cost: 1, attack: 1, health: 1, rarity: 'comun', garnish: true,
      kw: ['garnish'], text: '**Guarnición:** roba una carta.',
      flavor: 'Se cortó tres veces. A la cuarta, de bote.', quote: '¡Dale al mortero!',
      battlecry: { run: (g, c) => { if (c.combo) g.draw(c.p); } } },

    { id: 'huerto', name: 'Huerto Urbano', type: 'spell', cost: 3, rarity: 'rara', syn: 'verdura',
      text: 'Invoca dos Microbrotes 1/1. Después, tus **Verduras** ganan +1 de ataque.',
      flavor: 'Tres tomates en dos años. Carísimos.',
      spell: { canPlay: (g, p) => g.board(p).length < 7,
        run: (g, c) => { g.summon(c.p, 'microbrote'); g.summon(c.p, 'microbrote'); for (const m of g.famMinions(c.p, 'verdura')) g.buff(m, 1, 0); } } },

    { id: 'barbacoa', name: 'Barbacoa Dominguera', type: 'spell', cost: 2, rarity: 'rara', syn: 'chicha',
      text: 'Otorga +2 de ataque a tus **Chichas**.',
      flavor: 'El cuñado dice que él controla el fuego.',
      spell: { canPlay: (g, p) => g.famMinions(p, 'chicha').length > 0,
        run: (g, c) => { for (const m of g.famMinions(c.p, 'chicha')) g.buff(m, 2, 0); } } },

    { id: 'nata', name: 'Nata Montada', type: 'spell', cost: 1, rarity: 'comun', syn: 'lacteo',
      text: 'Otorga +1/+2 a un esbirro. Si es un **Lácteo**, roba una carta.',
      flavor: 'Directa del bote a la boca. No lo niegues.',
      spell: { target: 'minion', run: (g, c) => { g.buff(c.target, 1, 2); if (g.isFam(c.target, 'lacteo')) g.draw(c.p); } } },

    { id: 'rodillo', name: 'Rodillo de Amasar', type: 'spell', cost: 3, rarity: 'rara', kw: ['neighbors'],
      text: 'Inflige 3 de daño a un esbirro enemigo y 1 a sus **vecinos**.',
      flavor: 'Aplana masas, discusiones y lo que haga falta.',
      spell: { target: 'enemyMinion', run: (g, c) => {
        const ns = g.neighbors(c.target), src = g.spellSrc(c.p);
        g.damage(src, c.target, 3);
        for (const m of ns) g.damage(src, m, 1);
      } } },

    { id: 'salsa', name: 'Salsa Brava', type: 'spell', cost: 2, rarity: 'comun', garnish: true, kw: ['garnish'],
      text: 'Inflige 2 de daño. **Guarnición:** inflige 4 en su lugar.',
      flavor: 'La receta es secreta. El ardor, público.',
      spell: { target: 'any', run: (g, c) => { g.missile(g.hero(c.p), c.target, 'fuego'); g.damage(g.spellSrc(c.p), c.target, c.combo ? 4 : 2); } } },

    { id: 'platano', name: 'Cáscara de Plátano', type: 'spell', cost: 2, rarity: 'rara', kw: ['trap'],
      text: '**Trampa:** cuando un esbirro enemigo ataque a tu héroe, resbala: el ataque falla y vuelve a la mano de su dueño.',
      flavor: 'El clásico. Nunca falla.',
      trap: { on: 'attackHero', run: (g, c) => g.bounce(c.target) } },

    { id: 'nota', name: 'Nota Pasivo-Agresiva', type: 'spell', cost: 3, rarity: 'epica', kw: ['trap'],
      text: '**Trampa:** cuando tu rival juegue un truco, se anula.',
      flavor: '«Quien se haya comido mi yogur que sepa que LO SÉ. Gracias :)»',
      trap: { on: 'spell', run: () => {} } },

    { id: 'wasabi', name: 'Wasabi Camuflado', type: 'spell', cost: 2, rarity: 'rara', kw: ['trap'],
      text: '**Trampa:** cuando tu rival saque una comida, le inflige 3 de daño.',
      flavor: 'Parecía guacamole.',
      trap: { on: 'minion', run: (g, c) => g.damage(g.spellSrc(c.p), c.target, 3) } },

    /* ===================== UTENSILIOS (armas) ===================== */
    { id: 'tenedor', name: 'Tenedor de Plástico', type: 'weapon', cost: 1, attack: 1, durability: 3, rarity: 'comun',
      text: '', flavor: 'Se dobla, pero no se rompe. Bueno, sí se rompe.' },

    { id: 'chancla', name: 'La Chancla', type: 'weapon', cost: 3, attack: 3, durability: 2, rarity: 'rara',
      text: '', flavor: 'Alcance: ilimitado. Precisión: de madre.' },

    { id: 'cuchara', name: 'Cuchara de Palo', type: 'weapon', cost: 4, attack: 3, durability: 3, rarity: 'epica',
      keywords: ['lifesteal'], kw: ['lifesteal'], text: '**Nutritivo**', flavor: 'Ha educado a tres generaciones.' },

    /* ===================== FICHAS (no coleccionables) ===================== */
    { id: 'cupon', name: 'Cupón de Descuento', type: 'spell', cost: 0, rarity: 'comun', token: true,
      text: 'Gana 1 caloría solo este turno.', flavor: 'Caduca hoy. Como todo lo bueno.',
      spell: { run: (g, c) => { const pl = g.player(c.p); pl.mana = Math.min(10, pl.mana + 1); } } },
    { id: 'palomita', name: 'Palomita', type: 'minion', cost: 1, attack: 2, health: 1, rarity: 'comun', token: true,
      text: '', flavor: 'Explotó de alegría. Literalmente.' },
    { id: 'porcion', name: 'Porción Fría', type: 'minion', cost: 1, attack: 1, health: 1, rarity: 'comun', token: true,
      text: '', flavor: 'La última porción. Nadie se atreve.' },
    { id: 'sobra', name: 'Sobra de Pavo', type: 'minion', cost: 2, attack: 2, health: 2, rarity: 'comun', token: true,
      text: '', flavor: 'Croquetas en potencia.' },
    { id: 'taperlentejas', name: 'Táper de Lentejas', type: 'minion', cost: 2, attack: 2, health: 2, rarity: 'comun', token: true,
      keywords: ['taunt'], kw: ['taunt'], text: '**Estorbo**', flavor: 'Te lo llevas, que si no se pone malo.' },
    { id: 'microbrote', name: 'Microbrote', type: 'minion', cost: 1, attack: 1, health: 1, rarity: 'comun', token: true,
      text: '', flavor: 'Decoración. No se come. Bueno, se puede, pero no se debe.' },
  ];

  /* Familias: algunas cartas mejoran a las de su misma familia */
  TW.FAMILIES = {
    verdura: { name: 'Verdura', color: '#4fae4a' },
    chicha: { name: 'Chicha', color: '#c8463a' },
    lacteo: { name: 'Lácteo', color: '#4f9be8' },
    guiso: { name: 'Guiso', color: '#d98a2b' },
  };
  const FAM = {
    verdura: ['guisante', 'ajo', 'limon', 'kiwi', 'maiz', 'pimiento', 'cebolla', 'berenjena', 'coliflor', 'sandia', 'aceituna', 'guisantes', 'microbrote', 'brocoli'],
    chicha: ['salchicha', 'chorizo', 'jamon', 'pavo', 'pulpo', 'sobra', 'bocata', 'albondiga', 'morcilla'],
    lacteo: ['yogur', 'queso', 'natillas', 'primigenio', 'huevo', 'tarta', 'leche', 'kefir', 'quesocurado', 'mantequilla'],
    guiso: ['croqueta', 'tortilla', 'paella', 'lentejas', 'fabada', 'lasana', 'taperlentejas', 'pizza', 'porcion', 'tupper', 'cocido', 'nachos'],
  };
  for (const c of L) if (c.trap && !c.spell) c.spell = {};
  for (const [fam, ids] of Object.entries(FAM)) for (const id of ids) L.find((c) => c.id === id).fam = fam;

  TW.CARD_LIST = L;
  TW.CARDS = Object.fromEntries(L.map((c) => [c.id, c]));

  /* ===================== HÉROES ===================== */
  TW.HEROES = {
    abuela: {
      id: 'abuela', name: 'Abuela Puri', title: 'Cocina para veinte aunque seáis dos',
      hello: '¿Has comido? Te veo más delgado.', win: 'Toma, llévate un táper.', lose: 'Bueno, pero cena algo.',
      power: { name: '¡Pero come algo!', cost: 2, target: 'any', text: 'Restaura 2 de salud.',
        run: (g, c) => g.heal(c.self, c.target, 2) },
    },
    toni: {
      id: 'toni', name: 'Toni', title: 'El compañero de piso',
      hello: 'Este yogur no tenía nombre. Lo juro.', win: 'Lo que hay en la nevera es de todos.', lose: 'Vale, mañana friego yo.',
      power: { name: 'Esto no es mío', cost: 2, target: 'any', text: 'Inflige 1 de daño.',
        run: (g, c) => { g.missile(c.self, c.target, 'bolita'); g.damage(g.spellSrc(c.p), c.target, 1); } },
    },
    chef: {
      id: 'chef', name: 'Chef Gastón', title: 'Tres estrellas, cero humildad',
      hello: 'Esto no es una nevera. Es mi lienzo.', win: 'Deconstruido. Como tu estrategia.', lose: 'Le faltaba sal. A ti.',
      power: { name: 'Emplatar', cost: 2, text: 'Invoca un Microbrote 1/1.',
        canUse: (g, p) => g.board(p).length < TW.RULES.MAX_BOARD,
        run: (g, c) => g.summon(c.p, 'microbrote') },
    },
    michi: {
      id: 'michi', name: 'Michi', title: 'El gato de la encimera',
      hello: 'Miau. (Esto también lo voy a tirar).', win: 'Miau. (Todo al suelo).', lose: 'Miau. (Me voy a dormir 18 horas).',
      power: { name: 'Zarpazo', cost: 2, text: '+1 de ataque este turno y +2 de armadura.',
        run: (g, c) => { c.self.tempAttack += 1; g.gainArmor(c.p, 2); } },
    },
  };
  TW.HERO_LIST = Object.keys(TW.HEROES);

  TW.RARITY = {
    comun: { name: 'Común', copies: 2 },
    rara: { name: 'Rara', copies: 2 },
    epica: { name: 'Épica', copies: 2 },
    legendaria: { name: 'Legendaria', copies: 1 },
  };
  TW.TYPE_NAME = { minion: 'Comida', spell: 'Truco', weapon: 'Utensilio' };
})();
