/* =========================================================
   EFFETS SONORES — synthétisés en direct (Web Audio API)
   Aucun fichier audio : tout est généré, fonctionne hors ligne.
   ========================================================= */
(function () {
  let ctx = null, master = null, noiseBuf = null;
  const SFX = { enabled: true, volume: 0.7 };

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = SFX.volume * 0.5;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  // iPhone : le son doit être débloqué par un premier contact de l'utilisateur.
  function unlock() {
    const c = init(); if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { passive: true }));

  // Une note : fréquence, départ, durée, forme d'onde, volume, glissando, filtre passe-bas.
  function tone(f, t, dur, type = 'sine', vol = 0.3, f2 = null, lp = null) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const now = ctx.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(f, now);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    let node = o;
    if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); node = fl; }
    node.connect(g); g.connect(master);
    o.start(now); o.stop(now + dur + 0.05);
  }
  function noise(t, dur, vol = 0.2, lp = 800, hp = 0) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    const now = ctx.currentTime + t;
    s.buffer = noiseBuf; s.loop = true;
    fl.type = hp ? 'highpass' : 'lowpass'; fl.frequency.value = hp || lp;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(fl); fl.connect(g); g.connect(master);
    s.start(now); s.stop(now + dur + 0.05);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // numéro MIDI → Hz

  const SOUNDS = {
    // ouverture d'une fenêtre système : double bip cristallin
    open() {
      tone(N(84), 0, 0.09, 'triangle', 0.4);
      tone(N(91), 0.055, 0.18, 'sine', 0.34);
      noise(0, 0.08, 0.06, 0, 6000);
    },
    // changement d'onglet : bip discret
    tab() { tone(N(88), 0, 0.07, 'sine', 0.28); },
    // quête validée : « ding » brillant
    quest() {
      tone(N(88), 0, 0.22, 'sine', 0.55);
      tone(N(95), 0.06, 0.4, 'sine', 0.4);
      tone(N(100), 0.12, 0.5, 'triangle', 0.16);
    },
    // montée de niveau : arpège ascendant + accord
    levelup() {
      [72, 76, 79, 84, 88].forEach((n, i) => tone(N(n), i * 0.075, 0.25, 'triangle', 0.2));
      [84, 88, 91].forEach((n) => tone(N(n), 0.4, 0.9, 'sine', 0.13));
      noise(0.38, 0.6, 0.04, 0, 7000);
    },
    // montée de rang / nouveau statut : fanfare
    rankup() {
      const brass = (n, t, d, v) => { tone(N(n), t, d, 'sawtooth', v, null, 2200); tone(N(n) * 1.003, t, d, 'sawtooth', v * 0.6, null, 1800); };
      brass(67, 0, 0.16, 0.12); brass(67, 0.17, 0.16, 0.12); brass(67, 0.34, 0.16, 0.12);
      brass(72, 0.52, 0.5, 0.14); brass(76, 0.52, 0.5, 0.1); brass(79, 0.52, 0.5, 0.1);
      brass(84, 1.0, 1.2, 0.15); brass(88, 1.0, 1.2, 0.11); brass(91, 1.0, 1.2, 0.11);
      tone(N(36), 1.0, 1.2, 'sine', 0.25);
      noise(1.0, 1.1, 0.05, 0, 6000);
    },
    // apparition / combat de boss : grondement grave + alarme
    boss() {
      tone(70, 0, 1.8, 'sawtooth', 0.28, 38, 400);
      tone(73, 0, 1.8, 'sawtooth', 0.2, 40, 300);
      noise(0, 1.6, 0.18, 220);
      [0.15, 0.55, 0.95].forEach((t) => { tone(N(69), t, 0.18, 'square', 0.08, null, 1800); tone(N(63), t + 0.2, 0.18, 'square', 0.08, null, 1800); });
      tone(N(33), 0, 1.5, 'sine', 0.35);
    },
    // boss vaincu
    victory() {
      tone(90, 0, 0.5, 'sawtooth', 0.2, 45, 500); noise(0, 0.5, 0.15, 300);
      [72, 76, 79, 84, 88, 91, 96].forEach((n, i) => tone(N(n), 0.3 + i * 0.07, 0.3, 'triangle', 0.17));
      [84, 88, 91, 96].forEach((n) => tone(N(n), 0.85, 1.2, 'sine', 0.11));
    },
    // avertissement / pénalité
    warn() {
      [0, 0.3, 0.6].forEach((t) => { tone(N(81), t, 0.14, 'square', 0.2, null, 2500); tone(N(76), t + 0.14, 0.14, 'square', 0.2, null, 2500); });
      tone(N(40), 0, 1, 'sawtooth', 0.12, null, 300);
    },
    // niveau perdu
    down() { [76, 72, 67, 60].forEach((n, i) => tone(N(n), i * 0.12, 0.25, 'triangle', 0.3)); tone(N(36), 0.3, 0.8, 'sawtooth', 0.12, 30, 300); }
  };

  SFX.play = function (name) {
    if (!SFX.enabled || !SOUNDS[name]) return;
    try {
      if (!init()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      master.gain.value = SFX.volume * 0.5;
      SOUNDS[name]();
    } catch (e) { /* le son ne doit jamais bloquer l'application */ }
  };
  window.SFX = SFX;
})();
