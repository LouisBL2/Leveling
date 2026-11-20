/* =========================================================
   LEVELING SYSTEM — logique de l'application
   100 % local : toutes les données sont dans le localStorage
   du navigateur. Rien n'est envoyé sur un serveur.
   ========================================================= */
(function () {
  'use strict';
  const { DIFF, PERIOD, DOMAINS, CATALOG, PENALTIES } = window.GAME;
  const { CLASSES, avatar } = window.PERSONA;
  const REGEN_COOLDOWN = 7; // jours entre deux régénérations complètes
  const QUESTIONS = window.QUESTIONS;
  const KEY = 'leveling.system.v1';
  const DKEYS = ['sport', 'finance', 'relation'];
  const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
  const PENALTY_RATE = 0.6;      // % de l'XP de la quête perdu si non faite
  const PENALTY_RECOVER = 0.5;   // % récupéré si la quête de pénalité est accomplie
  const PENALTY_DELAY = 24 * 3600 * 1000;

  /* ---------------- utilitaires ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const dk = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromDk = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const monday = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

  function cycleKey(p, now = new Date()) {
    if (p === 'daily') return dk(now);
    if (p === 'weekly') return 'W' + dk(monday(now));
    return now.getFullYear() + '-' + pad(now.getMonth() + 1);
  }
  function cyclesBetween(p, a, b) {
    if (!a || a === b) return 0;
    let n;
    if (p === 'daily') n = Math.round((fromDk(b) - fromDk(a)) / 864e5);
    else if (p === 'weekly') n = Math.round((fromDk(b.slice(1)) - fromDk(a.slice(1))) / (7 * 864e5));
    else { const [ya, ma] = a.split('-').map(Number); const [yb, mb] = b.split('-').map(Number); n = (yb - ya) * 12 + (mb - ma); }
    return Math.max(0, n || 0);
  }
  function nextReset(p, now = new Date()) {
    if (p === 'daily') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (p === 'weekly') { const m = monday(now); return new Date(m.getFullYear(), m.getMonth(), m.getDate() + 7); }
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  function fmtLeft(ms) {
    if (ms <= 0) return '0 min';
    const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    if (d > 0) return d + ' j ' + h + ' h';
    if (h > 0) return h + ' h ' + pad(mm) + ' min';
    return mm + ' min';
  }
  const need = (lvl) => 100 + 12 * lvl;
  const tier = (v) => (v < 20 ? 0 : v < 40 ? 1 : v < 60 ? 2 : v < 75 ? 3 : v < 90 ? 4 : 5);
  const questXP = (r, p) => DIFF[r].xp * PERIOD[p].mult;

  /* ---------------- état ---------------- */
  const fresh = () => ({
    v: 1, name: '', created: Date.now(),
    onboarding: { step: 'intro', idx: 0, answers: {} },
    calibrated: false,
    domains: { sport: { level: 0, xp: 0, base: 0 }, finance: { level: 0, xp: 0, base: 0 }, relation: { level: 0, xp: 0, base: 0 } },
    quests: [], penalties: [], log: [],
    streak: 0, lastFullDay: '', bonus: null, totalXp: 0,
    settings: { pause: false },
    changes: { day: '', add: 0, rem: 0, removedDone: [] },
    setupDay: '', lastRegen: '', persona: ''
  });
  let state;
  function load() {
    try { const raw = localStorage.getItem(KEY); state = raw ? Object.assign(fresh(), JSON.parse(raw)) : fresh(); }
    catch (e) { state = fresh(); }
    migrate();
  }
  // Mise à niveau des sauvegardes existantes : on ajoute les nouveaux champs sans rien effacer.
  function migrate() {
    const def = fresh();
    state.settings = Object.assign(def.settings, state.settings || {});
    state.changes = Object.assign(def.changes, state.changes || {});
    if (state.calibrated && !state.setupDay) state.setupDay = dk(new Date()); // 1 journée de réglage libre après la mise à jour
    if (state.calibrated && !state.persona) state.persona = personaKey();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast('⚠ Impossible d\'enregistrer (stockage plein ou bloqué)', 'bad'); }
  }
  function log(k, m) { state.log.unshift({ t: Date.now(), k, m }); if (state.log.length > 400) state.log.length = 400; }

  let ui = { tab: 'status', filter: 'all' };

  /* ---------------- XP & niveaux ---------------- */
  const overlayQueue = [];
  function addXP(d, amt) {
    const D = state.domains[d];
    const before = D.level, beforeTier = tier(before), beforeRank = globalRank();
    D.xp += amt;
    if (amt > 0) state.totalXp += amt;
    while (D.level < 100 && D.xp >= need(D.level)) { D.xp -= need(D.level); D.level++; }
    if (D.level >= 100) { D.level = 100; D.xp = Math.min(D.xp, need(100)); }
    while (D.xp < 0 && D.level > 0) { D.level--; D.xp += need(D.level); }
    if (D.level === 0 && D.xp < 0) D.xp = 0;
    if (D.level > before) {
      log('lvl', `${DOMAINS[d].label} : niveau ${before} → ${D.level}`);
      overlayQueue.push({ type: 'up', d, from: before, to: D.level, title: tier(D.level) > beforeTier ? DOMAINS[d].titles[tier(D.level)] : null, rank: globalRank() !== beforeRank ? globalRank() : null });
    } else if (D.level < before) {
      log('fail', `${DOMAINS[d].label} : niveau perdu ${before} → ${D.level}`);
      overlayQueue.push({ type: 'down', d, from: before, to: D.level });
    }
  }
  const avgLevel = () => Math.round(DKEYS.reduce((s, d) => s + state.domains[d].level, 0) / 3);
  const globalRank = () => RANKS[tier(avgLevel())];

  /* ---------------- statut de personnalité ---------------- */
  function persona() {
    const dom = DKEYS.slice().sort((a, b) => state.domains[b].level - state.domains[a].level)[0];
    const r = tier(avgLevel());
    return Object.assign({ dom, r, rank: RANKS[r], cls: CLASSES[dom].cls }, CLASSES[dom].tiers[r]);
  }
  function personaKey() { const p = persona(); return p.dom + ':' + p.r; }
  function checkPersona() {
    const k = personaKey();
    if (state.persona && k !== state.persona) {
      const p = persona();
      overlayQueue.push({ type: 'persona' });
      log('lvl', `Nouveau statut de personnalité : « ${p.t} » (${p.cls}, rang ${p.rank})`);
    }
    state.persona = k;
  }

  /* ---------------- limite de changement de quêtes ---------------- */
  // 1 changement par jour = au plus 1 retrait + 1 ajout (donc 1 échange de quête).
  function changes() {
    const t = dk(new Date());
    if (state.changes.day !== t) state.changes = { day: t, add: 0, rem: 0, removedDone: [] };
    return state.changes;
  }
  const freeSetup = () => state.setupDay === dk(new Date());
  const canAdd = () => freeSetup() || changes().add < 1;
  const canRem = () => freeSetup() || changes().rem < 1;
  function regenWait() {
    if (freeSetup()) return 0;
    const c = changes();
    if (c.add || c.rem) return -1;
    if (!state.lastRegen) return 0;
    return Math.max(0, REGEN_COOLDOWN - cyclesBetween('daily', state.lastRegen, dk(new Date())));
  }
  function lockedMsg(kind) {
    toast(`🔒 ${kind === 'add' ? 'Ajout' : 'Retrait'} de quête déjà utilisé aujourd'hui — reviens demain`, 'bad');
  }
  function removeQuest(q) {
    const c = changes();
    if (!freeSetup()) c.rem++;
    if (q.done && q.cid) c.removedDone.push(q.cid);
    state.quests = state.quests.filter((x) => x.id !== q.id);
    log('info', `Quête retirée : « ${q.t} »`);
  }
  function addQuest(src) {
    const c = changes();
    if (!freeSetup()) c.add++;
    const q = makeQuest(src);
    if (q.cid && c.removedDone.includes(q.cid)) q.done = true; // pas de double XP en retirant / remettant une quête
    state.quests.push(q);
    log('info', `Quête ajoutée : « ${q.t} »`);
  }

  /* ---------------- quêtes ---------------- */
  function makeQuest(src) {
    return {
      id: uid(), cid: src.cid || null, d: src.d, p: src.p, r: src.r, t: src.t, desc: src.desc || '',
      xp: questXP(src.r, src.p), cycle: cycleKey(src.p), done: false, custom: !!src.custom
    };
  }
  function recommend() {
    const picks = [];
    const counts = { daily: 3, weekly: 2, monthly: 1 };
    DKEYS.forEach((d) => {
      const lvl = state.domains[d].level;
      Object.keys(counts).forEach((p) => {
        const c = CATALOG.filter((x) => x.d === d && x.p === p && lvl >= x.lv[0] && lvl <= x.lv[1]).sort((a, b) => b.lv[0] - a.lv[0]);
        const n = counts[p], hard = Math.ceil(n / 2);
        const chosen = c.slice(0, hard);
        const rest = c.slice(hard).sort(() => Math.random() - 0.5);
        chosen.push(...rest.slice(0, n - hard));
        picks.push(...chosen);
      });
    });
    return picks;
  }
  function applyRecommendation() {
    state.quests = state.quests.filter((q) => q.custom);
    recommend().forEach((c) => state.quests.push(makeQuest(c)));
  }

  /* --- évaluation des cycles : pénalités --- */
  function evaluate() {
    if (!state.calibrated) return;
    const now = new Date();
    const loss = { sport: 0, finance: 0, relation: 0 };
    const missed = [];
    // Règle du tiers : on mesure la journée qui vient de se terminer AVANT de réinitialiser.
    const curDay = cycleKey('daily', now);
    const closedDaily = state.quests.filter((q) => q.p === 'daily' && q.cycle !== curDay);
    let dayRatio = 1, dayDone = 0;
    if (closedDaily.length) {
      const skippedDays = closedDaily.some((q) => cyclesBetween('daily', q.cycle, curDay) > 1);
      dayDone = skippedDays ? 0 : closedDaily.filter((q) => q.done).length;
      dayRatio = dayDone / closedDaily.length;
    }
    const belowThird = closedDaily.length > 0 && dayRatio < 1 / 3 && !state.settings.pause;
    state.quests.forEach((q) => {
      const cur = cycleKey(q.p, now);
      if (q.cycle === cur) return;
      const gap = cyclesBetween(q.p, q.cycle, cur);
      let m = (q.done ? 0 : 1) + Math.max(0, gap - 1);
      m = Math.min(m, PERIOD[q.p].cap);
      if (m > 0 && !state.settings.pause) {
        loss[q.d] += Math.round(q.xp * PENALTY_RATE) * m;
        missed.push({ t: q.t, d: q.d, m, amt: Math.round(q.xp * PENALTY_RATE) * m });
      }
      q.cycle = cur; q.done = false;
    });

    // quêtes de pénalité expirées
    const failed = [];
    state.penalties = state.penalties.filter((p) => {
      if (now.getTime() < p.deadline) return true;
      if (state.settings.pause) { p.deadline = now.getTime() + PENALTY_DELAY; return true; }
      DKEYS.forEach((d) => { if (p.loss[d]) addXP(d, -p.loss[d]); });
      log('fail', `Pénalité échouée : « ${p.t} » — XP perdue à nouveau`);
      failed.push(p);
      return false;
    });

    // série
    if (state.lastFullDay && cyclesBetween('daily', state.lastFullDay, dk(now)) > 1 && state.streak) {
      log('fail', `Série de ${state.streak} jour(s) interrompue`);
      state.streak = 0;
    }

    const total = DKEYS.reduce((s, d) => s + loss[d], 0);
    let pen = null;
    if (total > 0) {
      DKEYS.forEach((d) => { if (loss[d]) addXP(d, -loss[d]); });
      missed.forEach((x) => log('fail', `Quête manquée : « ${x.t} »${x.m > 1 ? ' ×' + x.m : ''} (−${x.amt} XP ${DOMAINS[x.d].label})`));
    }
    // Quête de pénalité : seulement si moins d'1/3 des quêtes du jour ont été validées.
    if (belowThird) {
      const pick = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
      const stake = total > 0 ? loss : { sport: 30, finance: 30, relation: 30 };
      pen = { id: uid(), t: pick.t, desc: pick.desc, created: now.getTime(), deadline: now.getTime() + PENALTY_DELAY, loss: stake,
        reason: `${dayDone}/${closedDaily.length} quêtes du jour validées (minimum : ${Math.ceil(closedDaily.length / 3)})` };
      state.penalties.push(pen);
      log('pen', `Moins d'1/3 des quêtes validées (${dayDone}/${closedDaily.length}) → Zone de pénalité : « ${pen.t} »`);
    }
    checkPersona();
    save();
    if (missed.length || pen || failed.length) showPenaltyAlert(missed, pen, failed);
  }

  function toggleQuest(id) {
    const q = state.quests.find((x) => x.id === id);
    if (!q) return;
    if (!q.done) {
      q.done = true;
      addXP(q.d, q.xp);
      log('ok', `Quête accomplie : « ${q.t} » (+${q.xp} XP ${DOMAINS[q.d].label})`);
      toast(`+${q.xp} XP · ${DOMAINS[q.d].stat}`, 'good');
      checkDailyBonus();
    } else {
      q.done = false;
      addXP(q.d, -q.xp);
      log('info', `Quête annulée : « ${q.t} » (−${q.xp} XP)`);
      if (q.p === 'daily') revokeDailyBonus();
    }
    checkPersona();
    save(); render(); flushOverlays();
  }

  function checkDailyBonus() {
    const today = dk(new Date());
    const dailies = state.quests.filter((q) => q.p === 'daily');
    if (!dailies.length || !dailies.every((q) => q.done) || state.lastFullDay === today) return;
    const prev = { streak: state.streak, lastFullDay: state.lastFullDay };
    const yesterday = dk(new Date(Date.now() - 864e5));
    state.streak = state.lastFullDay === yesterday ? state.streak + 1 : 1;
    state.lastFullDay = today;
    const amt = 10 + 2 * Math.min(state.streak, 20);
    DKEYS.forEach((d) => addXP(d, amt));
    state.bonus = { day: today, amt, prev };
    log('ok', `Toutes les quêtes du jour accomplies ! Série : ${state.streak} j (+${amt} XP par domaine)`);
    setTimeout(() => modal(`
      <div class="sys-head">QUÊTE JOURNALIÈRE TERMINÉE</div>
      <p class="center big">Toutes les quêtes quotidiennes sont accomplies.</p>
      <p class="center">Récompense : <b class="glow">+${amt} XP</b> dans chaque domaine</p>
      <p class="center muted">Série en cours : <b>${state.streak}</b> jour(s)</p>`, [{ label: 'Confirmer', primary: true }]), 400);
  }
  function revokeDailyBonus() {
    const today = dk(new Date());
    if (!state.bonus || state.bonus.day !== today) return;
    DKEYS.forEach((d) => addXP(d, -state.bonus.amt));
    state.streak = state.bonus.prev.streak; state.lastFullDay = state.bonus.prev.lastFullDay;
    log('info', 'Récompense journalière retirée');
    state.bonus = null;
  }

  function completePenalty(id) {
    const p = state.penalties.find((x) => x.id === id);
    if (!p) return;
    const back = {};
    DKEYS.forEach((d) => { back[d] = Math.round((p.loss[d] || 0) * PENALTY_RECOVER); if (back[d]) addXP(d, back[d]); });
    state.penalties = state.penalties.filter((x) => x.id !== id);
    const sum = DKEYS.reduce((s, d) => s + back[d], 0);
    log('ok', `Pénalité accomplie : « ${p.t} » (+${sum} XP récupérée)`);
    toast(`Pénalité accomplie · +${sum} XP récupérée`, 'good');
    checkPersona();
    save(); render(); flushOverlays();
  }

  /* ---------------- questionnaire ---------------- */
  function computeStats() {
    const acc = {}; DKEYS.forEach((d) => (acc[d] = { s: 0, w: 0 }));
    QUESTIONS.forEach((q) => {
      const a = state.onboarding.answers[q.id];
      if (a == null || !q.o[a]) return;
      acc[q.d].s += q.o[a][1] * q.w; acc[q.d].w += q.w;
    });
    const r = {}; DKEYS.forEach((d) => (r[d] = acc[d].w ? Math.round(acc[d].s / acc[d].w) : 0));
    return r;
  }
  function finishQuiz() {
    const stats = computeStats();
    const first = !state.calibrated;
    DKEYS.forEach((d) => { state.domains[d] = { level: stats[d], xp: 0, base: stats[d] }; });
    state.calibrated = true;
    if (first) { state.setupDay = dk(new Date()); state.lastRegen = dk(new Date()); }
    if (first || !state.quests.length) applyRecommendation();
    if (first) state.persona = personaKey(); else checkPersona();
    state.quests.forEach((q) => { q.cycle = cycleKey(q.p); });
    state.onboarding.step = 'result';
    log('info', `Évaluation terminée — Sport ${stats.sport} · Finance ${stats.finance} · Relation ${stats.relation}`);
    save();
  }

  /* ---------------- rendu ---------------- */
  const app = () => $('#app');

  function render() {
    if (!state.calibrated || state.onboarding.step !== 'done') return renderOnboarding();
    document.body.classList.remove('onboarding');
    const tabs = { status: renderStatus, quests: renderQuests, catalog: renderCatalog, journal: renderJournal, settings: renderSettings };
    app().innerHTML = `<main class="screen">${(tabs[ui.tab] || renderStatus)()}</main>${renderNav()}`;
  }

  function renderNav() {
    const items = [['status', '◈', 'Statut'], ['quests', '!', 'Quêtes'], ['catalog', '✚', 'Catalogue'], ['journal', '☰', 'Journal'], ['settings', '⚙', 'Système']];
    const badge = state.penalties.length ? '<i class="dot"></i>' : '';
    return `<nav class="nav">${items.map(([k, ic, l]) => `<button data-act="tab" data-v="${k}" class="${ui.tab === k ? 'on' : ''}"><span class="ic">${ic}</span>${l}${k === 'quests' ? badge : ''}</button>`).join('')}</nav>`;
  }

  function bar(v, max, color) {
    const pct = max ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
    return `<div class="bar"><i style="width:${pct}%;--c:${color}"></i></div>`;
  }

  function radar() {
    const cx = 120, cy = 112, R = 82;
    const ang = [-90, 30, 150].map((a) => (a * Math.PI) / 180);
    const pt = (i, v) => [cx + Math.cos(ang[i]) * R * v, cy + Math.sin(ang[i]) * R * v];
    const poly = (v) => ang.map((_, i) => pt(i, typeof v === 'function' ? v(i) : v).join(',')).join(' ');
    const grid = [0.25, 0.5, 0.75, 1].map((v) => `<polygon points="${poly(v)}" class="rg"/>`).join('');
    const axes = ang.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="rg"/>`; }).join('');
    const vals = DKEYS.map((d) => Math.max(0.03, state.domains[d].level / 100));
    const labels = DKEYS.map((d, i) => {
      const [x, y] = pt(i, 1.2);
      return `<text x="${x}" y="${y + (i === 0 ? -2 : 10)}" text-anchor="middle" fill="${DOMAINS[d].color}">${DOMAINS[d].stat} ${state.domains[d].level}</text>`;
    }).join('');
    return `<svg viewBox="0 0 240 230" class="radar" role="img" aria-label="Radar des statistiques">${grid}${axes}<polygon points="${poly((i) => vals[i])}" class="rv"/>${labels}</svg>`;
  }

  function renderStatus() {
    const avg = avgLevel(), rk = globalRank();
    const dailies = state.quests.filter((q) => q.p === 'daily');
    const doneD = dailies.filter((q) => q.done).length;
    const pen = state.penalties.length ? `<button class="window danger alert" data-act="tab" data-v="quests">⚠ ${state.penalties.length} quête(s) de pénalité en cours — accomplis-les avant la fin du délai</button>` : '';
    const pause = state.settings.pause ? '<div class="window note">⏸ Mode repos actif : aucune pénalité n\'est appliquée.</div>' : '';
    const P = persona(), PC = DOMAINS[P.dom].color;
    const ladder = CLASSES[P.dom].tiers.map((x, i) => `<span class="lad ${i === P.r ? 'on' : i < P.r ? 'past' : ''}" title="${esc(x.t)}">${RANKS[i]}</span>`).join('');
    return `
      ${pen}${pause}
      <section class="window persona" style="--c:${PC}">
        <div class="sys-head" style="color:${PC}">STATUT DE PERSONNALITÉ</div>
        <div class="av-wrap">${avatar(P.dom, P.r, PC, 's')}</div>
        <div class="p-title">${esc(P.t)}</div>
        <div class="p-cls">Classe ${esc(P.cls)} · Rang <b class="rank-${P.rank}">${P.rank}</b> · Stat dominante : ${DOMAINS[P.dom].stat}</div>
        <p class="p-desc">${esc(P.desc)}</p>
        <div class="p-traits">${P.traits.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="ladder">${ladder}</div>
        ${P.r < 5 ? `<p class="center muted tiny">Prochain statut au rang ${RANKS[P.r + 1]} : « ${esc(CLASSES[P.dom].tiers[P.r + 1].t)} »</p>` : '<p class="center tiny glow">Statut ultime atteint.</p>'}
      </section>
      <section class="window">
        <div class="sys-head">STATUT</div>
        <div class="status-top">
          <div><div class="lbl">NOM</div><div class="val">${esc(state.name || 'Joueur')}</div></div>
          <div class="rank rank-${rk}"><span>RANG</span><b>${rk}</b></div>
        </div>
        <div class="status-grid">
          <div><div class="lbl">NIVEAU</div><div class="val big glow">${avg}</div></div>
          <div><div class="lbl">SÉRIE</div><div class="val">${state.streak} j</div></div>
          <div><div class="lbl">XP TOTALE</div><div class="val">${state.totalXp.toLocaleString('fr-FR')}</div></div>
          <div><div class="lbl">QUÊTES DU JOUR</div><div class="val">${doneD}/${dailies.length}</div></div>
        </div>
        ${radar()}
      </section>
      ${DKEYS.map((d) => {
        const D = state.domains[d], M = DOMAINS[d];
        const delta = D.level - (D.base || 0);
        return `<section class="window stat" style="--c:${M.color}">
          <div class="stat-row">
            <div class="stat-ic">${M.icon}</div>
            <div class="stat-main">
              <div class="stat-name">${M.label.toUpperCase()} <small>· ${M.stat}</small></div>
              <div class="stat-title">« ${M.titles[tier(D.level)]} »</div>
            </div>
            <div class="stat-lvl"><small>NIV.</small>${D.level}<small>/100</small></div>
          </div>
          ${bar(D.level >= 100 ? 1 : D.xp, D.level >= 100 ? 1 : need(D.level), M.color)}
          <div class="stat-foot"><span>${D.level >= 100 ? 'NIVEAU MAX' : `XP ${D.xp} / ${need(D.level)}`}</span><span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲ +' : '▼ '}${delta} depuis l'évaluation</span></div>
        </section>`;
      }).join('')}
    `;
  }

  function questCard(q) {
    const M = DOMAINS[q.d];
    return `<div class="quest ${q.done ? 'done' : ''}" style="--c:${M.color}">
      <div class="q-rank r-${q.r}">${q.r}</div>
      <div class="q-body">
        <div class="q-title">${esc(q.t)}</div>
        <div class="q-meta"><span style="color:${M.color}">${M.icon} ${M.label}</span> · +${q.xp} XP · <span class="pen">−${Math.round(q.xp * PENALTY_RATE)} si échec</span></div>
        ${q.desc ? `<div class="q-desc">${esc(q.desc)}</div>` : ''}
      </div>
      <button class="check" data-act="toggle" data-id="${q.id}" aria-label="${q.done ? 'Annuler' : 'Valider'}">${q.done ? '✔' : ''}</button>
    </div>`;
  }

  function renderQuests() {
    const now = Date.now();
    const pens = state.penalties.map((p) => {
      const lost = DKEYS.reduce((s, d) => s + (p.loss[d] || 0), 0);
      return `<section class="window danger">
        <div class="sys-head red">QUÊTE DE PÉNALITÉ</div>
        <div class="pen-title">${esc(p.t)}</div>
        <p class="muted center">${esc(p.desc)}</p>
        ${p.reason ? `<p class="center tiny" style="color:#ffb3c0">Motif : ${esc(p.reason)}</p>` : ''}
        <div class="pen-info"><span>Temps restant : <b class="cd" data-until="${p.deadline}">${fmtLeft(p.deadline - now)}</b></span><span>Réussite : +${Math.round(lost * PENALTY_RECOVER)} XP récupérée</span><span>Échec : −${lost} XP</span></div>
        <button class="btn red" data-act="penalty" data-id="${p.id}">Pénalité accomplie</button>
      </section>`;
    }).join('');
    const chips = [['all', 'Tous'], ...DKEYS.map((d) => [d, DOMAINS[d].label])].map(([k, l]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-act="filter" data-v="${k}">${l}</button>`).join('');
    const sections = Object.keys(PERIOD).map((p) => {
      const list = state.quests.filter((q) => q.p === p && (ui.filter === 'all' || q.d === ui.filter));
      const done = list.filter((q) => q.done).length;
      return `<section class="window">
        <div class="sys-head">QUÊTES ${PERIOD[p].label.toUpperCase()}S</div>
        <div class="sec-info"><span>${done}/${list.length} accomplies</span><span>Réinitialisation : <b class="cd" data-until="${nextReset(p).getTime()}">${fmtLeft(nextReset(p) - now)}</b></span></div>
        ${list.length ? list.map(questCard).join('') : '<p class="muted center">Aucune quête. Ajoute-en depuis le catalogue.</p>'}
      </section>`;
    }).join('');
    const dl = state.quests.filter((q) => q.p === 'daily'), dd = dl.filter((q) => q.done).length, need3 = Math.ceil(dl.length / 3);
    const warn = dl.length ? `<p class="warn">${dd >= need3 ? '✔' : '⚠'} Quêtes du jour validées : <b>${dd}/${dl.length}</b> — minimum ${need3} pour éviter la Zone de pénalité. Chaque quête manquée coûte de l'XP.</p>` : '';
    return `${pens}<div class="chips">${chips}</div>${warn}${sections}`;
  }

  function renderCatalog() {
    const active = new Set(state.quests.map((q) => q.cid).filter(Boolean));
    const custom = state.quests.filter((q) => q.custom);
    const dSel = DKEYS.map((d) => `<option value="${d}">${DOMAINS[d].label}</option>`).join('');
    const pSel = Object.keys(PERIOD).map((p) => `<option value="${p}">${PERIOD[p].label}</option>`).join('');
    const rSel = Object.keys(DIFF).map((r) => `<option value="${r}" ${r === 'C' ? 'selected' : ''}>Rang ${r} (${DIFF[r].xp} XP de base)</option>`).join('');
    const groups = DKEYS.filter((d) => ui.filter === 'all' || ui.filter === d).map((d) => {
      const lvl = state.domains[d].level;
      const rows = CATALOG.filter((c) => c.d === d).map((c) => {
        const on = active.has(c.cid), rec = lvl >= c.lv[0] && lvl <= c.lv[1];
        return `<div class="cat-row ${on ? 'on' : ''}">
          <div class="q-rank r-${c.r}">${c.r}</div>
          <div class="q-body"><div class="q-title">${esc(c.t)}</div>
            <div class="q-meta">${PERIOD[c.p].label} · +${questXP(c.r, c.p)} XP ${rec ? '· <span class="rec">recommandée</span>' : ''}</div></div>
          <button class="btn sm ${on ? 'ghost' : ''}" data-act="cat" data-id="${c.cid}" ${(on ? canRem() : canAdd()) ? '' : 'disabled'}>${on ? 'Retirer' : 'Ajouter'}</button>
        </div>`;
      }).join('');
      return `<section class="window" style="--c:${DOMAINS[d].color}"><div class="sys-head" style="color:${DOMAINS[d].color}">${DOMAINS[d].icon} ${DOMAINS[d].label.toUpperCase()} · NIV. ${lvl}</div>${rows}</section>`;
    }).join('');
    const chips = [['all', 'Tous'], ...DKEYS.map((d) => [d, DOMAINS[d].label])].map(([k, l]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-act="filter" data-v="${k}">${l}</button>`).join('');
    const c = changes(), rw = regenWait();
    const tomorrow = nextReset('daily').getTime();
    const lockInfo = freeSetup()
      ? '<div class="window note">🛠 Journée de réglage : changements de quêtes illimités aujourd\'hui. À partir de demain : 1 changement par jour.</div>'
      : `<div class="window note ${canAdd() || canRem() ? '' : 'locked'}">🔒 1 changement de quête par jour · Ajout ${c.add}/1 · Retrait ${c.rem}/1${canAdd() || canRem() ? '' : ` · Déblocage dans <b class="cd" data-until="${tomorrow}">${fmtLeft(tomorrow - Date.now())}</b>`}</div>`;
    return `
      ${lockInfo}
      <section class="window">
        <div class="sys-head">CRÉER UNE QUÊTE</div>
        <form id="customForm" class="form">
          <input name="t" maxlength="90" placeholder="Intitulé de la quête" required>
          <div class="row3"><select name="d">${dSel}</select><select name="p">${pSel}</select></div>
          <select name="r">${rSel}</select>
          <button class="btn" type="submit" ${canAdd() ? '' : 'disabled'}>Ajouter la quête</button>
        </form>
        ${custom.length ? `<div class="sub">Tes quêtes personnalisées</div>${custom.map((q) => `<div class="cat-row on"><div class="q-rank r-${q.r}">${q.r}</div><div class="q-body"><div class="q-title">${esc(q.t)}</div><div class="q-meta">${DOMAINS[q.d].label} · ${PERIOD[q.p].label} · +${q.xp} XP</div></div><button class="btn sm ghost" data-act="del" data-id="${q.id}" ${canRem() ? '' : 'disabled'}>Supprimer</button></div>`).join('')}` : ''}
      </section>
      <section class="window"><div class="sys-head">RECOMMANDATIONS</div>
        <p class="muted">Le Système choisit des quêtes adaptées à ton niveau actuel dans chaque domaine (3 quotidiennes, 2 hebdomadaires et 1 mensuelle par domaine). Tes quêtes personnalisées sont conservées. Possible une fois tous les ${REGEN_COOLDOWN} jours, à la place du changement du jour.</p>
        <button class="btn" data-act="recommend" ${rw === 0 ? '' : 'disabled'}>${rw === 0 ? 'Régénérer les quêtes recommandées' : rw < 0 ? 'Indisponible : quêtes déjà modifiées aujourd\'hui' : `Régénération disponible dans ${rw} j`}</button>
      </section>
      <div class="chips">${chips}</div>
      ${groups}`;
  }

  function renderJournal() {
    const icons = { ok: '✔', fail: '✖', lvl: '▲', pen: '⚠', info: '•' };
    const rows = state.log.slice(0, 200).map((e) => {
      const d = new Date(e.t);
      return `<div class="log log-${e.k}"><span class="log-ic">${icons[e.k] || '•'}</span><div><div>${esc(e.m)}</div><small>${d.toLocaleDateString('fr-FR')} ${pad(d.getHours())}:${pad(d.getMinutes())}</small></div></div>`;
    }).join('');
    return `<section class="window"><div class="sys-head">JOURNAL DU SYSTÈME</div>${rows || '<p class="muted center">Aucune entrée.</p>'}</section>`;
  }

  function renderSettings() {
    return `
      <section class="window"><div class="sys-head">PROFIL</div>
        <form id="nameForm" class="form"><input name="n" maxlength="30" value="${esc(state.name)}" placeholder="Pseudo"><button class="btn" type="submit">Renommer</button></form>
      </section>
      <section class="window"><div class="sys-head">MODE REPOS</div>
        <p class="muted">Vacances, maladie, blessure : active le mode repos pour suspendre toutes les pénalités. Les quêtes continuent de se réinitialiser.</p>
        <button class="btn ${state.settings.pause ? 'red' : ''}" data-act="pause">${state.settings.pause ? 'Désactiver le mode repos' : 'Activer le mode repos'}</button>
      </section>
      <section class="window"><div class="sys-head">SAUVEGARDE</div>
        <p class="muted">Tes données sont stockées <b>uniquement dans ce navigateur</b>. Rien n'est envoyé sur GitHub ni ailleurs. Exporte une sauvegarde pour ne rien perdre ou pour transférer ta progression entre ton téléphone et ton ordinateur.</p>
        <div class="row2"><button class="btn" data-act="export">Exporter</button><button class="btn ghost" data-act="import">Importer</button></div>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
      </section>
      <section class="window"><div class="sys-head">RÉÉVALUATION</div>
        <p class="muted">Refaire le questionnaire complet (${QUESTIONS.length} questions). Tes niveaux seront recalibrés selon tes nouvelles réponses ; tes quêtes et ton journal sont conservés.</p>
        <button class="btn" data-act="retake">Refaire le questionnaire</button>
      </section>
      <section class="window"><div class="sys-head">INSTALLER SUR TÉLÉPHONE</div>
        <p class="muted"><b>iPhone (Safari)</b> : bouton Partager → « Sur l'écran d'accueil ».<br><b>Android (Chrome)</b> : menu ⋮ → « Installer l'application ».<br>L'application fonctionne ensuite hors connexion.</p>
      </section>
      <section class="window danger"><div class="sys-head red">ZONE DANGEREUSE</div>
        <button class="btn red" data-act="reset">Effacer toutes les données</button>
      </section>
      <p class="muted center tiny">Leveling System · données locales uniquement</p>`;
  }

  /* ---------------- onboarding ---------------- */
  function renderOnboarding() {
    document.body.classList.add('onboarding');
    const o = state.onboarding;
    if (o.step === 'intro') {
      app().innerHTML = `<div class="center-screen"><section class="window appear">
        <div class="sys-head">NOTIFICATION</div>
        <p class="center big">Tu as rempli les conditions pour devenir un <b class="glow">Joueur</b>.</p>
        <p class="center muted">Le Système va évaluer les trois strates de ta vie — <span style="color:${DOMAINS.sport.color}">Sport</span>, <span style="color:${DOMAINS.finance.color}">Finance</span> et <span style="color:${DOMAINS.relation.color}">Relation</span> — à travers ${QUESTIONS.length} questions. Réponds honnêtement : personne d'autre que toi ne verra tes réponses, elles restent stockées sur cet appareil.</p>
        <p class="center muted">Chaque jour, des quêtes te seront assignées. Les accomplir te fera monter en niveau. Les ignorer entraînera des <span class="red-t">pénalités</span>.</p>
        <div class="row2"><button class="btn" data-act="ob-accept">Accepter</button><button class="btn ghost" data-act="ob-import">Restaurer une sauvegarde</button></div>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
      </section></div>`;
      return;
    }
    if (o.step === 'name') {
      app().innerHTML = `<div class="center-screen"><section class="window appear">
        <div class="sys-head">IDENTIFICATION</div>
        <p class="center">Comment le Système doit-il t'appeler ?</p>
        <form id="obName" class="form"><input name="n" maxlength="30" placeholder="Pseudo (pas ton vrai nom nécessaire)" value="${esc(state.name)}" autofocus><button class="btn" type="submit">Continuer</button></form>
      </section></div>`;
      return;
    }
    if (o.step === 'quiz') {
      const q = QUESTIONS[o.idx];
      const M = DOMAINS[q.d];
      const sel = o.answers[q.id];
      const pct = Math.round((o.idx / QUESTIONS.length) * 100);
      const firstOfDomain = o.idx === 0 || QUESTIONS[o.idx - 1].d !== q.d;
      app().innerHTML = `<div class="quiz" style="--c:${M.color}">
        <div class="quiz-top">
          <button class="btn sm ghost" data-act="q-back" ${o.idx === 0 ? 'disabled' : ''}>← Retour</button>
          <span class="quiz-count">${o.idx + 1} / ${QUESTIONS.length}</span>
        </div>
        <div class="bar"><i style="width:${pct}%;--c:${M.color}"></i></div>
        <section class="window appear" key="${q.id}">
          <div class="sys-head" style="color:${M.color}">${M.icon} ÉVALUATION · ${M.label.toUpperCase()}</div>
          ${firstOfDomain ? `<p class="center muted tiny">${domainIntro(q.d)}</p>` : ''}
          <h2 class="q-text">${esc(q.q)}</h2>
          ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ''}
          <div class="opts">${q.o.map((op, i) => `<button class="opt ${sel === i ? 'sel' : ''}" data-act="answer" data-i="${i}">${esc(op[0])}</button>`).join('')}</div>
        </section>
      </div>`;
      return;
    }
    if (o.step === 'result') {
      const avg = avgLevel(), rk = globalRank();
      app().innerHTML = `<div class="center-screen"><section class="window appear">
        <div class="sys-head">ÉVALUATION TERMINÉE</div>
        <p class="center muted">Le Système a déterminé tes statistiques.</p>
        <div class="result">
          ${DKEYS.map((d) => `<div class="res-row" style="--c:${DOMAINS[d].color}">
            <span class="res-name">${DOMAINS[d].icon} ${DOMAINS[d].label}</span>
            <span class="res-val" data-count="${state.domains[d].level}">0</span>
            <div class="res-bar"><i style="--w:${state.domains[d].level}%"></i></div>
            <span class="res-title">« ${DOMAINS[d].titles[tier(state.domains[d].level)]} »</span>
          </div>`).join('')}
        </div>
        <div class="res-rank rank-${rk}">RANG <b>${rk}</b> · NIVEAU ${avg}</div>
        <p class="center muted tiny">${state.quests.length} quêtes adaptées à ton niveau t'ont été assignées.</p>
        <button class="btn" data-act="ob-done">Entrer dans le Système</button>
      </section></div>`;
      document.querySelectorAll('[data-count]').forEach((el) => countUp(el, +el.dataset.count));
    }
  }
  function domainIntro(d) {
    return {
      sport: 'Échelle : 0 = obésité et problèmes de santé graves · 100 = triathlète D1 sur le podium, physique sec et volumineux.',
      finance: 'Échelle : 0 = très endetté, dans le rouge chaque mois · 100 = rentier, plusieurs sources de revenus, patrimoine de 1 M€.',
      relation: 'Échelle : 0 = déprime chronique, solitude et célibat subi · 100 = grand succès amoureux ou couple marié épanoui, famille et amis solides.'
    }[d];
  }
  function countUp(el, to) {
    const t0 = performance.now(), dur = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------------- modales, toasts, overlays ---------------- */
  function modal(html, buttons = [{ label: 'OK', primary: true }], cls = '') {
    return new Promise((res) => {
      const m = document.createElement('div');
      m.className = 'modal';
      m.innerHTML = `<section class="window appear ${cls}">${html}<div class="row2">${buttons.map((b, i) => `<button class="btn ${b.primary ? '' : 'ghost'} ${b.red ? 'red' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></section>`;
      m.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (!b) return; m.remove(); res(+b.dataset.i); flushOverlays(); });
      document.body.appendChild(m);
    });
  }
  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2700);
  }
  function flushOverlays() {
    if (document.querySelector('.modal') || !overlayQueue.length) return;
    const o = overlayQueue.shift(), M = DOMAINS[o.d];
    if (o.type === 'persona') {
      const P = persona(), PC = DOMAINS[P.dom].color;
      modal(`<div class="lvlup" style="--c:${PC}"><div class="sys-head" style="color:${PC}">NOUVEAU STATUT</div>
        <div class="av-wrap sm">${avatar(P.dom, P.r, PC, 'm')}</div>
        <div class="p-title">${esc(P.t)}</div>
        <div class="p-cls">Classe ${esc(P.cls)} · Rang ${P.rank}</div>
        <p class="p-desc">${esc(P.desc)}</p></div>`, [{ label: 'Confirmer', primary: true }], 'levelup');
      return;
    }
    if (o.type === 'up') {
      modal(`<div class="lvlup" style="--c:${M.color}"><div class="lvlup-t">LEVEL UP!</div>
        <div class="lvlup-d">${M.icon} ${M.label.toUpperCase()}</div>
        <div class="lvlup-n">${o.from} <span>→</span> <b>${o.to}</b></div>
        ${o.title ? `<div class="lvlup-x">Nouveau titre obtenu : « ${esc(o.title)} »</div>` : ''}
        ${o.rank ? `<div class="lvlup-x">Rang global : <b>${o.rank}</b></div>` : ''}</div>`, [{ label: 'Confirmer', primary: true }], 'levelup');
    } else {
      modal(`<div class="sys-head red">NIVEAU PERDU</div><p class="center big">${M.label} : ${o.from} → <b class="red-t">${o.to}</b></p><p class="center muted">Le Système ne tolère pas la faiblesse.</p>`, [{ label: 'Compris', primary: true, red: true }], 'danger');
    }
  }
  function showPenaltyAlert(missed, pen, failed) {
    const list = missed.map((x) => `<li><span style="color:${DOMAINS[x.d].color}">${DOMAINS[x.d].icon}</span> ${esc(x.t)}${x.m > 1 ? ' ×' + x.m : ''} <b class="red-t">−${x.amt} XP</b></li>`).join('');
    const fl = failed.map((p) => `<li>Pénalité non accomplie : « ${esc(p.t)} » <b class="red-t">−${DKEYS.reduce((s, d) => s + (p.loss[d] || 0), 0)} XP</b></li>`).join('');
    modal(`<div class="sys-head red">AVERTISSEMENT</div>
      ${missed.length ? '<p class="center">Des quêtes n\'ont pas été accomplies dans le temps imparti.</p>' : ''}
      <ul class="pen-list">${list}${fl}</ul>
      ${missed.length && !pen ? '<p class="center muted tiny">Tu as validé au moins 1/3 des quêtes du jour : pas de quête de pénalité, seulement la perte d\'XP.</p>' : ''}
      ${pen ? `<p class="center">${esc(pen.reason)}.<br>Tu es transféré dans la <b class="red-t">ZONE DE PÉNALITÉ</b>.</p>
      <div class="pen-title">${esc(pen.t)}</div><p class="center muted">Délai : 24 h. Réussite : 50 % de l'XP perdue récupérée. Échec : la perte est appliquée une seconde fois.</p>` : ''}`,
    [{ label: 'Accepter', primary: true, red: true }], 'danger');
  }

  /* ---------------- import / export ---------------- */
  function doExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leveling-sauvegarde-${dk(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde exportée', 'good');
  }
  function doImport() {
    const inp = $('#importFile');
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = async () => {
        try {
          const data = JSON.parse(r.result);
          if (!data || !data.domains || !Array.isArray(data.quests)) throw new Error('format');
          const ok = await modal('<div class="sys-head">IMPORTER</div><p class="center">Remplacer les données actuelles par cette sauvegarde ?</p>', [{ label: 'Remplacer', primary: true }, { label: 'Annuler' }]);
          if (ok !== 0) return;
          state = Object.assign(fresh(), data);
          save(); evaluate(); render(); toast('Sauvegarde restaurée', 'good');
        } catch (e) { toast('Fichier de sauvegarde invalide', 'bad'); }
      };
      r.readAsText(f);
      inp.value = '';
    };
    inp.click();
  }

  /* ---------------- événements ---------------- */
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, o = state.onboarding;
    switch (act) {
      case 'tab': ui.tab = el.dataset.v; render(); window.scrollTo(0, 0); break;
      case 'filter': ui.filter = el.dataset.v; render(); break;
      case 'toggle': toggleQuest(el.dataset.id); break;
      case 'penalty': {
        const ok = await modal('<div class="sys-head red">CONFIRMATION</div><p class="center">As-tu réellement accompli la quête de pénalité ?</p><p class="center muted tiny">Le Système te fait confiance. Ne triche qu\'avec toi-même.</p>', [{ label: 'Oui, accomplie', primary: true, red: true }, { label: 'Pas encore' }], 'danger');
        if (ok === 0) completePenalty(el.dataset.id);
        break;
      }
      case 'cat': {
        const cid = el.dataset.id;
        const existing = state.quests.find((q) => q.cid === cid);
        if (existing) {
          if (!canRem()) { lockedMsg('rem'); break; }
          const ok = await modal(`<div class="sys-head">RETIRER</div><p class="center">Retirer « ${esc(existing.t)} » ?</p><p class="center muted tiny">${freeSetup() ? 'Journée de réglage : changements illimités aujourd\'hui.' : 'Tu ne pourras plus retirer de quête avant demain.'}</p>`, [{ label: 'Retirer', primary: true }, { label: 'Annuler' }]);
          if (ok !== 0) break;
          removeQuest(existing);
        } else {
          if (!canAdd()) { lockedMsg('add'); break; }
          addQuest(CATALOG.find((c) => c.cid === cid));
          toast('Quête ajoutée', 'good');
        }
        save(); render(); break;
      }
      case 'del': {
        const q = state.quests.find((x) => x.id === el.dataset.id);
        if (!q) break;
        if (!canRem()) { lockedMsg('rem'); break; }
        const ok = await modal(`<div class="sys-head">SUPPRIMER</div><p class="center">Supprimer « ${esc(q.t)} » ?</p><p class="center muted tiny">${freeSetup() ? 'Journée de réglage : changements illimités aujourd\'hui.' : 'Tu ne pourras plus retirer de quête avant demain.'}</p>`, [{ label: 'Supprimer', primary: true, red: true }, { label: 'Annuler' }]);
        if (ok === 0) { removeQuest(q); save(); render(); }
        break;
      }
      case 'recommend': {
        const w = regenWait();
        if (w !== 0) { toast(w < 0 ? '🔒 Tu as déjà modifié tes quêtes aujourd\'hui' : `🔒 Régénération disponible dans ${w} jour(s)`, 'bad'); break; }
        const ok = await modal(`<div class="sys-head">RECOMMANDATIONS</div><p class="center">Remplacer les quêtes du catalogue par une nouvelle sélection adaptée à ton niveau ?</p><p class="center muted tiny">${freeSetup() ? 'Journée de réglage : gratuit aujourd\'hui.' : `Cela utilise le changement du jour et bloque la régénération pendant ${REGEN_COOLDOWN} jours.`}</p>`, [{ label: 'Régénérer', primary: true }, { label: 'Annuler' }]);
        if (ok === 0) {
          if (!freeSetup()) { const c = changes(); c.add = 1; c.rem = 1; }
          state.lastRegen = dk(new Date());
          applyRecommendation(); log('info', 'Quêtes recommandées régénérées'); save(); ui.tab = 'quests'; render();
        }
        break;
      }
      case 'pause':
        state.settings.pause = !state.settings.pause;
        log('info', state.settings.pause ? 'Mode repos activé' : 'Mode repos désactivé');
        save(); render(); break;
      case 'export': doExport(); break;
      case 'import': case 'ob-import': doImport(); break;
      case 'retake': {
        const ok = await modal('<div class="sys-head">RÉÉVALUATION</div><p class="center">Recommencer le questionnaire ? Tes réponses précédentes sont pré-sélectionnées.</p>', [{ label: 'Commencer', primary: true }, { label: 'Annuler' }]);
        if (ok === 0) { o.step = 'quiz'; o.idx = 0; save(); render(); }
        break;
      }
      case 'reset': {
        const ok = await modal('<div class="sys-head red">EFFACER</div><p class="center">Toutes tes données (statistiques, quêtes, journal) seront définitivement supprimées de cet appareil.</p>', [{ label: 'Tout effacer', primary: true, red: true }, { label: 'Annuler' }], 'danger');
        if (ok === 0) { localStorage.removeItem(KEY); state = fresh(); ui.tab = 'status'; render(); }
        break;
      }
      case 'ob-accept': o.step = 'name'; save(); render(); break;
      case 'answer': {
        const q = QUESTIONS[o.idx];
        o.answers[q.id] = +el.dataset.i;
        el.classList.add('sel');
        save();
        setTimeout(() => {
          if (o.idx < QUESTIONS.length - 1) { o.idx++; save(); render(); }
          else { finishQuiz(); render(); }
        }, 180);
        break;
      }
      case 'q-back': if (o.idx > 0) { o.idx--; save(); render(); } break;
      case 'ob-done': o.step = 'done'; ui.tab = 'status'; save(); render(); break;
    }
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'obName') { state.name = f.n.value.trim().slice(0, 30) || 'Joueur'; state.onboarding.step = 'quiz'; save(); render(); }
    if (f.id === 'nameForm') { state.name = f.n.value.trim().slice(0, 30) || 'Joueur'; save(); toast('Nom mis à jour', 'good'); render(); }
    if (f.id === 'customForm') {
      const t = f.t.value.trim().slice(0, 90);
      if (!t) return;
      if (!canAdd()) { lockedMsg('add'); return; }
      addQuest({ d: f.d.value, p: f.p.value, r: f.r.value, t, custom: true });
      save(); toast('Quête ajoutée', 'good'); render();
    }
  });

  // minuteurs
  setInterval(() => {
    document.querySelectorAll('.cd').forEach((el) => { el.textContent = fmtLeft(+el.dataset.until - Date.now()); });
  }, 30000);
  let lastEval = Date.now();
  function tick() { if (state.calibrated) { evaluate(); if (state.onboarding.step === 'done') render(); flushOverlays(); } lastEval = Date.now(); }
  setInterval(() => { const now = new Date(); if (dk(now) !== dk(new Date(lastEval))) tick(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  /* ---------------- démarrage ---------------- */
  load();
  if (state.calibrated && state.onboarding.step === 'result') state.onboarding.step = 'done';
  render();
  evaluate();
  flushOverlays();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
