/* =========================================================
   EFFETS SONORES — synthétisés en direct (Web Audio API)
   Aucun fichier audio : tout est généré, fonctionne hors ligne.
   Palette douce « interface holographique » : cloches FM,
   nappes, souffles filtrés, réverbération synthétique.
   ========================================================= */
(function () {
  let ctx = null, bus = null, verb = null, noiseBuf = null, out = null;
  let musicOut = null, mBus = null, mVerb = null, target = 'sfx';
  const SFX = { enabled: true, volume: 0.7, music: true, musicVolume: 0.5 };

  /* ---------- chaîne audio : voix → (sec + réverb) → compresseur doux → sortie ---------- */
  function makeImpulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        lp += 0.35 * ((Math.random() * 2 - 1) - lp);             // bruit adouci (moins de brillance)
        d[i] = lp * Math.pow(1 - i / len, decay);
      }
    }
    return ir;
  }
  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    out = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 20; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 9000; // retire l'aigreur
    out.connect(tone); tone.connect(comp); comp.connect(ctx.destination);

    bus = ctx.createGain(); bus.connect(out);                     // signal sec
    verb = ctx.createGain(); verb.gain.value = 1;                 // envoi réverb
    const conv = ctx.createConvolver(); conv.buffer = makeImpulse(1.1, 4.5); // réverb courte = peu d'écho
    const wet = ctx.createGain(); wet.gain.value = 0.18;
    verb.connect(conv); conv.connect(wet); wet.connect(out);

    // bus séparé pour la musique (son propre volume et sa propre réverb, plus ample)
    musicOut = ctx.createGain(); musicOut.gain.value = 0.0001; musicOut.connect(tone);
    mBus = ctx.createGain(); mBus.connect(musicOut);
    mVerb = ctx.createGain();
    const mConv = ctx.createConvolver(); mConv.buffer = makeImpulse(3.2, 3);
    const mWet = ctx.createGain(); mWet.gain.value = 0.45;
    mVerb.connect(mConv); mConv.connect(mWet); mWet.connect(musicOut);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    applyVolume();
    return ctx;
  }
  function applyVolume() { if (out) out.gain.value = SFX.volume * 1.6; }

  function unlock() {
    const c = init(); if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
    if (SFX.music && !document.hidden) Music.start();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { passive: true }));

  /* ---------- briques sonores ---------- */
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);   // numéro MIDI → Hz
  const T = () => ctx.currentTime + 0.02;

  // sortie d'une voix : panoramique + envoi sec / réverb
  function route(node, pan = 0, wet = 0.35) {
    let n = node;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
    const dry = ctx.createGain(); dry.gain.value = 1 - wet * 0.5;
    const send = ctx.createGain(); send.gain.value = wet;
    n.connect(dry); dry.connect(target === 'music' ? mBus : bus); n.connect(send); send.connect(target === 'music' ? mVerb : verb);
  }
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // Cloche cristalline (synthèse FM : porteuse + modulateur qui s'éteint)
  function bell(f, t, { vol = 0.12, dur = 1.2, ratio = 3.5, index = 1.2, pan = 0, wet = 0.45, attack = 0.004 } = {}) {
    const st = T() + t;
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine';
    car.frequency.value = f; mod.frequency.value = f * ratio;
    mg.gain.setValueAtTime(f * index, st); mg.gain.exponentialRampToValueAtTime(f * 0.01, st + dur * 0.6);
    mod.connect(mg); mg.connect(car.frequency);
    env(g, st, attack, vol, dur);
    car.connect(g); route(g, pan, wet);
    car.start(st); mod.start(st); car.stop(st + dur + 0.1); mod.stop(st + dur + 0.1);
    // octave douce pour la rondeur
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2;
    env(g2, st, attack, vol * 0.18, dur * 0.5);
    o2.connect(g2); route(g2, pan, wet); o2.start(st); o2.stop(st + dur);
  }

  // Nappe : plusieurs oscillateurs légèrement désaccordés, filtrés, attaque lente
  function pad(freqs, t, { vol = 0.05, dur = 2, attack = 0.5, cutoff = 1800, wet = 0.6, type = 'triangle' } = {}) {
    const st = T() + t;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff; lp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(vol, st + attack);
    g.gain.setValueAtTime(vol, st + Math.max(attack, dur - 0.9));
    g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
    lp.connect(g); route(g, 0, wet);
    freqs.forEach((f, i) => [-7, 7].forEach((cents) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = cents + i;
      o.connect(lp); o.start(st); o.stop(st + dur + 0.1);
    }));
  }

  // Souffle : bruit filtré dont la fréquence glisse (whoosh)
  function swoosh(t, dur, from, to, { vol = 0.05, q = 1.2, pan = 0, wet = 0.4 } = {}) {
    const st = T() + t;
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; bp.type = 'bandpass'; bp.Q.value = q;
    bp.frequency.setValueAtTime(from, st); bp.frequency.exponentialRampToValueAtTime(to, st + dur);
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(vol, st + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
    s.connect(bp); bp.connect(g); route(g, pan, wet);
    s.start(st); s.stop(st + dur + 0.05);
  }

  // Grave doux (sub) : sinus qui descend, pour les impacts et les battements
  function sub(f1, f2, t, dur, vol = 0.25) {
    const st = T() + t, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f1, st); o.frequency.exponentialRampToValueAtTime(f2, st + dur);
    env(g, st, 0.01, vol, dur);
    o.connect(g); route(g, 0, 0.15); o.start(st); o.stop(st + dur + 0.05);
  }

  // Bourdon grave qui enfle (boss)
  function drone(f, t, dur, vol = 0.12) {
    const st = T() + t, lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(120, st); lp.frequency.exponentialRampToValueAtTime(700, st + dur * 0.7); lp.Q.value = 2;
    g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(vol, st + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
    lp.connect(g); route(g, 0, 0.5);
    [0, 7, 12].forEach((semi, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f * Math.pow(2, semi / 12); o.detune.value = (i - 1) * 6;
      o.connect(lp); o.start(st); o.stop(st + dur + 0.1);
    });
  }

  /* ---------- les sons ---------- */
  const SOUNDS = {
    // ouverture d'une fenêtre système : souffle aérien + deux cloches de verre
    open() {
      swoosh(0, 0.32, 700, 4200, { vol: 0.035, q: 0.9 });
      bell(N(86), 0.06, { vol: 0.07, dur: 0.9, ratio: 4.0, index: 0.6, pan: -0.15 });
      bell(N(93), 0.12, { vol: 0.045, dur: 1.1, ratio: 4.0, index: 0.5, pan: 0.2 });
    },
    // changement d'onglet : petit « tic » de verre
    tab() { bell(N(91), 0, { vol: 0.06, dur: 0.3, ratio: 5, index: 0.4, wet: 0.25 }); },
    // quête validée : carillon cristallin à trois notes
    quest() {
      bell(N(84), 0, { vol: 0.1, dur: 1.2, ratio: 3.5, index: 0.9, pan: -0.2 });
      bell(N(88), 0.07, { vol: 0.08, dur: 1.2, ratio: 3.5, index: 0.8, pan: 0 });
      bell(N(91), 0.14, { vol: 0.07, dur: 1.6, ratio: 3.5, index: 0.7, pan: 0.2 });
      swoosh(0.1, 0.6, 5000, 9000, { vol: 0.012, q: 2, wet: 0.6 });
    },
    // montée de niveau : souffle qui monte, arpège de cloches, nappe lumineuse
    levelup() {
      swoosh(0, 0.7, 400, 6000, { vol: 0.04, q: 0.8 });
      [72, 76, 79, 83, 84, 88].forEach((n, i) => bell(N(n), 0.12 + i * 0.075, { vol: 0.075, dur: 1.4, ratio: 3.5, index: 0.8, pan: -0.5 + i * 0.2 }));
      pad([N(60), N(64), N(67), N(71)], 0.45, { vol: 0.04, dur: 2.2, attack: 0.35, cutoff: 2200 });
      bell(N(96), 0.7, { vol: 0.035, dur: 2, ratio: 4.5, index: 0.4, wet: 0.8 });
    },
    // montée de rang / nouveau statut : grave profond, nappe épique qui s'ouvre, cascade de cloches
    rankup() {
      sub(70, 45, 0, 1.2, 0.22);
      swoosh(0, 1.2, 200, 5000, { vol: 0.05, q: 0.7 });
      pad([N(48), N(55), N(60), N(64), N(67), N(74)], 0.1, { vol: 0.055, dur: 3.4, attack: 0.9, cutoff: 2600 });
      [67, 72, 76, 79, 84, 88, 91].forEach((n, i) => bell(N(n), 0.6 + i * 0.09, { vol: 0.07, dur: 1.8, ratio: 3.5, index: 0.7, pan: Math.sin(i) * 0.5 }));
      bell(N(96), 1.35, { vol: 0.05, dur: 2.6, ratio: 4, index: 0.5, wet: 0.85 });
    },
    // apparition / combat de boss : bourdon sombre qui enfle, battements de cœur, dissonance lointaine
    boss() {
      drone(N(29), 0, 2.6, 0.13);
      swoosh(0, 2.2, 90, 400, { vol: 0.06, q: 0.6, wet: 0.6 });
      [0.35, 0.6, 1.35, 1.6].forEach((t, i) => sub(i % 2 ? 52 : 62, 38, t, 0.32, i % 2 ? 0.18 : 0.26));
      bell(N(74), 0.9, { vol: 0.03, dur: 2.2, ratio: 2.76, index: 1.4, pan: -0.4, wet: 0.9 });
      bell(N(75), 1.0, { vol: 0.025, dur: 2.2, ratio: 2.76, index: 1.4, pan: 0.4, wet: 0.9 });
    },
    // boss vaincu : impact sourd, souffle, arpège de victoire, nappe majeure
    victory() {
      sub(90, 40, 0, 0.7, 0.26);
      swoosh(0, 0.9, 300, 7000, { vol: 0.05, q: 0.7 });
      [72, 76, 79, 84, 88, 91].forEach((n, i) => bell(N(n), 0.35 + i * 0.08, { vol: 0.07, dur: 1.6, ratio: 3.5, index: 0.8, pan: -0.5 + i * 0.2 }));
      pad([N(60), N(64), N(67), N(72), N(76)], 0.7, { vol: 0.05, dur: 2.8, attack: 0.5, cutoff: 2400 });
    },
    // avertissement / pénalité : deux pulsations graves et une cloche en triton, inquiétant mais doux
    warn() {
      sub(110, 80, 0, 0.45, 0.2); sub(104, 76, 0.5, 0.45, 0.2);
      bell(N(69), 0.05, { vol: 0.06, dur: 1.4, ratio: 1.41, index: 1.1, pan: -0.2, wet: 0.6 });
      bell(N(63), 0.55, { vol: 0.06, dur: 1.8, ratio: 1.41, index: 1.1, pan: 0.2, wet: 0.7 });
      pad([N(45), N(51)], 0, { vol: 0.03, dur: 1.8, attack: 0.3, cutoff: 600 });
    },
    // niveau perdu : cloches mineures qui descendent dans le grave
    down() {
      [79, 75, 72, 67].forEach((n, i) => bell(N(n), i * 0.16, { vol: 0.07, dur: 1.4, ratio: 2, index: 0.6, pan: 0.3 - i * 0.2, wet: 0.55 }));
      pad([N(43), N(46), N(50)], 0.3, { vol: 0.035, dur: 2, attack: 0.4, cutoff: 700 });
    }
  };

  /* =======================================================
     MUSIQUE D'AMBIANCE — générée en continu, jamais identique
     Nappe sombre et calme (la mineur), basse douce,
     notes de cloche éparses tirées des accords.
     ======================================================= */
  const PROG = [
    { root: 45, notes: [57, 60, 64, 67, 71] },  // Am9
    { root: 41, notes: [53, 57, 60, 64, 67] },  // Fmaj9
    { root: 48, notes: [55, 59, 60, 64, 67] },  // Cmaj7
    { root: 40, notes: [52, 55, 59, 62, 66] }   // Em9
  ];
  const CHORD = 9; // secondes par accord
  const Music = {
    timer: null, next: 0, idx: 0, playing: false,
    start() {
      if (this.playing || !init()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      this.playing = true;
      this.next = ctx.currentTime + 0.1;
      musicOut.gain.cancelScheduledValues(ctx.currentTime);
      musicOut.gain.setValueAtTime(Math.max(musicOut.gain.value, 0.0001), ctx.currentTime);
      musicOut.gain.exponentialRampToValueAtTime(Math.max(0.0001, SFX.musicVolume * 0.9), ctx.currentTime + 4);
      this.tick();
      this.timer = setInterval(() => this.tick(), 500);
    },
    stop() {
      if (!this.playing) return;
      this.playing = false;
      clearInterval(this.timer); this.timer = null;
      if (ctx) {
        musicOut.gain.cancelScheduledValues(ctx.currentTime);
        musicOut.gain.setValueAtTime(Math.max(musicOut.gain.value, 0.0001), ctx.currentTime);
        musicOut.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      }
    },
    // planifie les accords un peu à l'avance
    tick() {
      while (this.playing && this.next < ctx.currentTime + 2) {
        this.chord(PROG[this.idx % PROG.length], this.next - ctx.currentTime);
        this.idx++; this.next += CHORD;
      }
    },
    chord(c, t) {
      target = 'music';
      try {
        pad(c.notes.map(N), t, { vol: 0.03, dur: CHORD + 3, attack: 3, cutoff: 950, wet: 0.5 });
        pad([N(c.root)], t, { vol: 0.045, dur: CHORD + 1.5, attack: 2.5, cutoff: 300, wet: 0.2, type: 'sine' });
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const note = c.notes[Math.floor(Math.random() * c.notes.length)] + (Math.random() < 0.6 ? 12 : 24);
          bell(N(note), t + 1 + Math.random() * (CHORD - 2), { vol: 0.018 + Math.random() * 0.014, dur: 3.5, ratio: 3.5, index: 0.5, pan: Math.random() * 1.2 - 0.6, wet: 0.6, attack: 0.02 });
        }
        if (Math.random() < 0.35) swoosh(t + Math.random() * 4, 5, 300, 1400, { vol: 0.008, q: 0.6, wet: 0.7 });
      } finally { target = 'sfx'; }
    },
    // baisse la musique pendant les grands effets (boss, rang…)
    duck(seconds) {
      if (!this.playing || !ctx) return;
      const now = ctx.currentTime, v = Math.max(0.0001, SFX.musicVolume * 0.9);
      musicOut.gain.cancelScheduledValues(now);
      musicOut.gain.setValueAtTime(Math.max(musicOut.gain.value, 0.0001), now);
      musicOut.gain.exponentialRampToValueAtTime(Math.max(0.0001, v * 0.25), now + 0.3);
      musicOut.gain.setValueAtTime(Math.max(0.0001, v * 0.25), now + seconds);
      musicOut.gain.exponentialRampToValueAtTime(v, now + seconds + 2);
    }
  };
  // musique uniquement quand l'app est à l'écran
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Music.stop();
    else if (SFX.music && ctx) Music.start();
  });

  SFX.setMusic = function (on, vol) {
    SFX.music = !!on;
    if (typeof vol === 'number') SFX.musicVolume = vol;
    if (!SFX.music) { Music.stop(); return; }
    if (ctx && ctx.state === 'running') {
      if (!Music.playing) Music.start();
      else { musicOut.gain.cancelScheduledValues(ctx.currentTime); musicOut.gain.setTargetAtTime(Math.max(0.0001, SFX.musicVolume * 0.9), ctx.currentTime, 0.2); }
    }
  };
  const DUCK = { boss: 3.5, rankup: 4, victory: 3.5, levelup: 2.5, warn: 2.5, down: 2.5 };

  SFX.play = function (name) {
    if (!SFX.enabled || !SOUNDS[name]) return;
    try {
      if (!init()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      applyVolume();
      if (DUCK[name]) Music.duck(DUCK[name]);
      SOUNDS[name]();
    } catch (e) { /* le son ne doit jamais bloquer l'application */ }
  };
  SFX.Music = Music;
  window.SFX = SFX;
})();
