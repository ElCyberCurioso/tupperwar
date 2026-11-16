/* Tupperwar — efectos de sonido sintetizados con WebAudio (sin archivos externos). */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.12, freq = 1200, delay = 0) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = a.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(a.destination);
    src.start(t);
  }

  const S = {
    card: () => noise(0.12, 0.08, 2400),
    play: () => { tone(320, 0.12, 'triangle', 0.14, 260); noise(0.06, 0.05, 900); },
    summon: () => tone(220, 0.25, 'sine', 0.16, 500),
    hit: () => { tone(140, 0.18, 'square', 0.08, -80); noise(0.1, 0.12, 500); },
    death: () => { tone(400, 0.35, 'sawtooth', 0.06, -330); noise(0.2, 0.08, 300); },
    heal: () => { tone(520, 0.12, 'sine', 0.1); tone(780, 0.18, 'sine', 0.1, 0, 0.08); },
    shield: () => tone(1400, 0.2, 'triangle', 0.08, -600),
    freeze: () => { tone(1600, 0.3, 'sine', 0.05, 800); noise(0.25, 0.04, 6000); },
    turn: () => { tone(660, 0.12, 'sine', 0.12); tone(880, 0.2, 'sine', 0.12, 0, 0.1); },
    oppTurn: () => tone(330, 0.2, 'sine', 0.1, -60),
    error: () => tone(160, 0.18, 'square', 0.06),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.13, 0, i * 0.12)),
    lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.11, 0, i * 0.15)),
    pop: () => tone(600, 0.08, 'sine', 0.12, 400),
    emote: () => tone(700, 0.1, 'sine', 0.1, 200),
  };

  TW.Sfx = {
    play(name) { if (!enabled || !S[name]) return; try { S[name](); } catch (e) { /* sin audio */ } },
    setEnabled(v) { enabled = !!v; },
    get enabled() { return enabled; },
    unlock() { try { ac(); } catch (e) { /* nada */ } },
  };
})();
