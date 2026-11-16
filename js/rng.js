/* Tupperwar — generador pseudoaleatorio con semilla (mulberry32).
   Todo el RNG de una partida sale de aquí para que sea reproducible
   y para que dos clientes online calculen exactamente lo mismo. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});

  // Un paso de mulberry32: devuelve [valor 0..1, nuevoEstado]
  TW.rngStep = function (state) {
    const a = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
  };

  // RNG independiente (para generar mazos fuera del motor)
  class RNG {
    constructor(seed) { this.state = seed | 0; }
    next() { const [v, s] = TW.rngStep(this.state); this.state = s; return v; }
    int(n) { return Math.floor(this.next() * n); }
    pick(arr) { return arr.length ? arr[this.int(arr.length)] : undefined; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  }
  TW.RNG = RNG;
  TW.randomSeed = () => (Math.random() * 4294967296) >>> 0;
})();
