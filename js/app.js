/* =========================================================
   LEVELING SYSTEM — logique de l'application
   100 % local : toutes les données sont dans le localStorage
   du navigateur. Rien n'est envoyé sur un serveur.
   ========================================================= */
(function () {
  'use strict';
  const { DIFF, PERIOD, DOMAINS, CATALOG, PENALTIES } = window.GAME;
  const { CLASSES, HYBRIDS, avatar, bossSprite } = window.PERSONA;
  const BOSSES = window.BOSSES;
  const ACHIEVEMENTS = window.ACHIEVEMENTS;
  const BOSS_DAYS = { mini: 30, big: 30 };     // délai maximum pour vaincre un gardien apparu
  const BOSS_FAIL_RATE = { mini: 0.35, big: 0.5 }; // part de need(L) perdue si le délai expire
  const CHART_COLORS = { sport: '#2b9fd6', finance: '#b8891f', relation: '#d9468f' }; // palette validée (daltonisme, fond sombre)
  const REGEN_COOLDOWN = 7; // jours entre deux régénérations complètes
  const QUESTIONS = window.QUESTIONS;
  const KEY = 'leveling.system.v1';
  const APP_VERSION = '20';
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
    settings: { pause: false, sound: true, volume: 0.7, music: true, musicVolume: 0.5 },
    changes: { day: '', add: 0, rem: 0, removedDone: [] },
    setupDay: '', lastRegen: '', persona: '',
    bosses: { sport: [], finance: [], relation: [] },
    history: [], achievements: {}, achInit: false,
    stats: { questsDone: 0, penDone: 0, bossKills: 0, bigKills: 0, maxStreak: 0, challengesDone: 0, targetsDone: 0, customMade: 0, exports: 0 },
    challenge: null, bossTimers: {}, lastPenaltyDay: '', lastExport: 0, lastExportPrompt: 0,
    reminderHour: 20
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
    state.bosses = Object.assign(def.bosses, state.bosses || {});
    if (!state.bossesInit) { markPassedBosses(); state.bossesInit = true; } // paliers déjà dépassés = vaincus
    state.stats = Object.assign(def.stats, state.stats || {});
    if (!Array.isArray(state.history)) state.history = [];
    if (!state.achievements) state.achievements = {};
    if (!state.bossTimers) state.bossTimers = {};
    state.stats.maxStreak = Math.max(state.stats.maxStreak, state.streak || 0);
    if (!state.lastExport) state.lastExport = state.created || Date.now();
    state.quests.forEach((q) => { if (q.tgt && typeof q.prog !== 'number') q.prog = 0; });
    if (!state.bossDays30) {
      DKEYS.forEach((d) => { const t = state.bossTimers[d]; const b = t && bossAt(d, t.L); if (b && !b.big) t.deadline += 9 * 864e5; });
      state.bossDays30 = true;
    }
    // un boss déjà présent au moment de la mise à jour reçoit son délai à partir d'aujourd'hui
    if (state.calibrated) DKEYS.forEach((d) => { const L = state.domains[d].level; if (sealed(d, L) && !state.bossTimers[d]) startBossTimer(d, L); });
  }
  function save() {
    if (state.calibrated) { recordHistory(); checkAchievements(); noteWaiting(); }
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast('⚠ Impossible d\'enregistrer (stockage plein ou bloqué)', 'bad'); }
  }
  function log(k, m) { state.log.unshift({ t: Date.now(), k, m }); if (state.log.length > 400) state.log.length = 400; }

  let ui = { tab: 'status', filter: 'all', range: 30 };

  /* ---------------- XP & niveaux ---------------- */
  const overlayQueue = [];
  /* ---------------- boss ---------------- */
  const isGate = (L) => L > 0 && L % 5 === 0;
  const defeated = (d, L) => state.bosses[d].includes(L);
  const sealed = (d, L) => isGate(L) && L < 100 && !defeated(d, L);
  const bossAt = (d, L) => BOSSES[d].find((b) => b.lvl === L);
  const bossReward = (b) => Math.round(need(b.lvl) * (b.big ? 1 : 0.5));
  const nextBoss = (d) => BOSSES[d].find((b) => !defeated(d, b.lvl)) || null;
  // Une stat est « en attente du boss » quand elle est bloquée à un palier non vaincu :
  // ses quêtes ne comptent alors ni pour le seuil des 2/3, ni pour la perte d'XP.
  const bossWaiting = (d) => sealed(d, state.domains[d].level);
  // quêtes facultatives aujourd'hui : stat bloquée maintenant, ou bloquée plus tôt dans la journée
  const exemptToday = (d) => bossWaiting(d) || !!(state.waitSeen && state.waitSeen.day === dk(new Date()) && state.waitSeen.doms.includes(d));
  // mémorise les stats qui ont été en attente d'un boss à un moment de la journée
  function noteWaiting() {
    const t = dk(new Date());
    if (!state.waitSeen || state.waitSeen.day !== t) state.waitSeen = { day: t, doms: [] };
    DKEYS.filter(bossWaiting).forEach((d) => { if (!state.waitSeen.doms.includes(d)) state.waitSeen.doms.push(d); });
  }
  function markPassedBosses() {
    DKEYS.forEach((d) => BOSSES[d].forEach((b) => {
      if (b.lvl < state.domains[d].level && !defeated(d, b.lvl)) state.bosses[d].push(b.lvl);
    }));
  }
  function defeatBoss(d, L) {
    const b = bossAt(d, L);
    if (!b || defeated(d, L) || state.domains[d].level < L) return;
    state.bosses[d].push(L);
    state.stats.bossKills++; if (b.big) state.stats.bigKills++;
    delete state.bossTimers[d];
    const xp = bossReward(b);
    log('lvl', `${b.big ? 'BOSS' : 'Mini-boss'} vaincu : ${b.name} (${DOMAINS[d].label} niv. ${L}) · +${xp} XP`);
    overlayQueue.push({ type: 'bossWin', d, L, xp });
    addXP(d, xp);
    checkPersona();
    save(); render(); flushOverlays();
  }

  function addXP(d, amt) {
    const D = state.domains[d];
    const before = D.level, beforeTier = tier(before), beforeRank = globalRank();
    D.xp += amt;
    if (amt > 0) state.totalXp += amt;
    while (D.level < 100 && D.xp >= need(D.level) && !sealed(d, D.level)) { D.xp -= need(D.level); D.level++; }
    if (D.level >= 100) { D.level = 100; D.xp = Math.min(D.xp, need(100)); }
    while (D.xp < 0 && D.level > 0) { D.level--; D.xp += need(D.level); }
    if (D.level === 0 && D.xp < 0) D.xp = 0;
    if (D.level > before) {
      log('lvl', `${DOMAINS[d].label} : niveau ${before} → ${D.level}`);
      overlayQueue.push({ type: 'up', d, from: before, to: D.level, title: tier(D.level) > beforeTier ? DOMAINS[d].titles[tier(D.level)] : null, rank: globalRank() !== beforeRank ? globalRank() : null });
      if (isGate(D.level) && !defeated(d, D.level)) {
        const b = bossAt(d, D.level);
        log('pen', `${b.big ? 'BOSS' : 'Mini-boss'} apparu : ${b.name} (${DOMAINS[d].label} niv. ${D.level})`);
        startBossTimer(d, D.level);
        overlayQueue.push({ type: 'bossAppear', d, L: D.level });
      }
    } else if (D.level < before) {
      log('fail', `${DOMAINS[d].label} : niveau perdu ${before} → ${D.level}`);
      overlayQueue.push({ type: 'down', d, from: before, to: D.level });
    }
  }
  const avgLevel = () => Math.round(DKEYS.reduce((s, d) => s + state.domains[d].level, 0) / 3);
  const globalRank = () => RANKS[tier(avgLevel())];

  /* ---------------- statut de personnalité ---------------- */
  const S_LEVEL = 90; // rang S d'une stat
  function persona() {
    const r = tier(avgLevel());
    const sDoms = DKEYS.filter((d) => state.domains[d].level >= S_LEVEL);
    if (sDoms.length >= 2) { // statut hybride
      const key = sDoms.join('+');
      return Object.assign({ hybrid: true, key, doms: sDoms, dom: sDoms[0], r, rank: RANKS[r] }, HYBRIDS[key]);
    }
    const dom = DKEYS.slice().sort((a, b) => state.domains[b].level - state.domains[a].level)[0];
    return Object.assign({ dom, r, rank: RANKS[r], cls: CLASSES[dom].cls }, CLASSES[dom].tiers[r]);
  }
  function personaKey() { const p = persona(); return p.hybrid ? 'H:' + p.key : p.dom + ':' + p.r; }
  function personaAvatar(P) {
    return P.hybrid ? avatar(P.doms, 5, P.doms.map((d) => DOMAINS[d].color)) : avatar(P.dom, P.r, DOMAINS[P.dom].color);
  }
  function checkPersona() {
    const k = personaKey();
    if (state.persona && k !== state.persona) {
      const p = persona();
      overlayQueue.push({ type: 'persona' });
      log('lvl', `Nouveau statut de personnalité : « ${p.t} » (${p.cls}${p.hybrid ? ', hybride' : ', rang ' + p.rank})`);
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

  /* ---------------- historique de progression ---------------- */
  function recordHistory() {
    const d = dk(new Date()), L = state.domains;
    const e = { d, s: L.sport.level, f: L.finance.level, r: L.relation.level };
    const last = state.history[state.history.length - 1];
    if (last && last.d === d) Object.assign(last, e); else state.history.push(e);
    if (state.history.length > 730) state.history.splice(0, state.history.length - 730);
  }

  /* ---------------- succès ---------------- */
  function achContext() {
    const lv = {}; DKEYS.forEach((d) => (lv[d] = state.domains[d].level));
    const vals = Object.values(lv);
    const since = state.lastPenaltyDay || dk(new Date(state.created || Date.now()));
    return { st: state, lv, max: Math.max(...vals), min: Math.min(...vals), rank: tier(avgLevel()),
      sCount: vals.filter((v) => v >= S_LEVEL).length, daysNoPen: cyclesBetween('daily', since, dk(new Date())) };
  }
  function checkAchievements() {
    const x = achContext(), silent = !state.achInit;
    ACHIEVEMENTS.forEach((a) => {
      if (state.achievements[a.id]) return;
      let ok = false; try { ok = a.test(x); } catch (e) { ok = false; }
      if (!ok) return;
      state.achievements[a.id] = Date.now();
      if (!silent) { log('lvl', `Succès débloqué : « ${a.t} »`); overlayQueue.push({ type: 'ach', id: a.id }); }
    });
    state.achInit = true; // les succès déjà mérités avant la mise à jour sont débloqués sans fenêtre
  }

  /* ---------------- défi du jour (bonus, facultatif, XP ×2, sans pénalité) ---------------- */
  function ensureChallenge() {
    const today = dk(new Date());
    if (state.challenge && state.challenge.day === today) return;
    const active = new Set(state.quests.map((q) => q.cid).filter(Boolean));
    let pool = CATALOG.filter((c) => c.p === 'daily' && !c.tgt && !active.has(c.cid) && state.domains[c.d].level >= c.lv[0] && state.domains[c.d].level <= c.lv[1] + 10);
    if (!pool.length) pool = CATALOG.filter((c) => c.p === 'daily' && !c.tgt);
    const c = pool[Math.floor(Math.random() * pool.length)];
    state.challenge = { day: today, cid: c.cid, d: c.d, r: c.r, t: c.t, desc: c.desc, xp: questXP(c.r, 'daily') * 2, done: false };
  }
  function toggleChallenge() {
    const c = state.challenge; if (!c) return;
    if (!c.done && penaltyLock()) return lockToast();
    c.done = !c.done;
    if (c.done) {
      addXP(c.d, c.xp); state.stats.challengesDone++;
      log('ok', `Défi du jour relevé : « ${c.t} » (+${c.xp} XP ${DOMAINS[c.d].label})`);
      toast(`Défi relevé · +${c.xp} XP`, 'good'); window.SFX.play('quest');
    } else {
      addXP(c.d, -c.xp); state.stats.challengesDone = Math.max(0, state.stats.challengesDone - 1);
      log('info', `Défi du jour annulé (−${c.xp} XP)`);
    }
    checkPersona(); save(); render(); flushOverlays();
  }

  /* ---------------- quêtes à objectif chiffré ---------------- */
  const fmtN = (v) => (Math.round(v * 100) / 100).toLocaleString('fr-FR');
  function addProgress(id, amount) {
    const q = state.quests.find((x) => x.id === id);
    if (!q || !q.tgt || !isFinite(amount) || amount === 0) return;
    if (amount > 0 && penaltyLock()) return lockToast();
    q.prog = Math.max(0, Math.round(((q.prog || 0) + amount) * 100) / 100);
    if (!q.done && q.prog >= q.tgt.n) { state.stats.targetsDone++; completeQuest(q); }
    else if (q.done && q.prog < q.tgt.n) { state.stats.targetsDone = Math.max(0, state.stats.targetsDone - 1); uncompleteQuest(q); }
    else toast(`${fmtN(q.prog)} / ${fmtN(q.tgt.n)} ${q.tgt.unit}`, 'good');
    checkPersona(); save(); render(); flushOverlays();
  }

  /* ---------------- délai des boss ---------------- */
  function startBossTimer(d, L) {
    const b = bossAt(d, L); if (!b) return;
    state.bossTimers[d] = { L, deadline: Date.now() + (b.big ? BOSS_DAYS.big : BOSS_DAYS.mini) * 864e5 };
  }
  function checkBossTimers(now, failedBosses) {
    DKEYS.forEach((d) => {
      const t = state.bossTimers[d]; if (!t) return;
      if (defeated(d, t.L) || state.domains[d].level < t.L) { delete state.bossTimers[d]; return; }
      if (now < t.deadline) return;
      const b = bossAt(d, t.L);
      if (state.settings.pause) { t.deadline = now + 864e5; return; }
      const loss = Math.round(need(t.L) * (b.big ? BOSS_FAIL_RATE.big : BOSS_FAIL_RATE.mini));
      addXP(d, -loss);
      log('fail', `Délai expiré : ${b.name} n'a pas été vaincu (−${loss} XP ${DOMAINS[d].label})`);
      failedBosses.push({ d, b, loss });
      if (state.domains[d].level >= t.L) t.deadline = now + (b.big ? BOSS_DAYS.big : BOSS_DAYS.mini) * 864e5; // nouveau délai
      else delete state.bossTimers[d];
    });
  }

  /* ---------------- remplacement d'une quête ---------------- */
  function showReplace(qid) {
    const old = state.quests.find((q) => q.id === qid); if (!old) return;
    const active = new Set(state.quests.map((q) => q.cid).filter(Boolean));
    const order = [old.d, ...DKEYS.filter((d) => d !== old.d)];
    const groups = order.map((d) => {
      const lvl = state.domains[d].level, M = DOMAINS[d];
      const list = CATALOG.filter((c) => c.d === d && c.p === old.p && !active.has(c.cid))
        .map((c) => ({ c, rec: lvl >= c.lv[0] && lvl <= c.lv[1] }))
        .sort((a, b) => (b.rec - a.rec) || (b.c.lv[0] - a.c.lv[0]));
      if (!list.length) return '';
      return `<div class="gal-sec" style="color:${M.color}">${M.icon} ${M.label.toUpperCase()}${d === old.d ? ' · même stat' : ''}</div>
        ${list.map(({ c, rec }) => `<button class="repl-opt" data-act="repl-pick" data-q="${old.id}" data-cid="${c.cid}" style="--c:${M.color}">
          <span class="q-rank r-${c.r}">${c.r}</span>
          <span class="repl-body"><span class="q-title">${esc(c.t)}</span>
          <span class="q-meta">+${questXP(c.r, c.p)} XP${c.tgt ? ` · ◎ ${fmtN(c.tgt.n)} ${esc(c.tgt.unit)}` : ''}${rec ? ' · <span class="rec">recommandée</span>' : ''}</span></span>
        </button>`).join('')}`;
    }).join('');
    modal(`<div class="sys-head">REMPLACER</div>
      <p class="center">Remplacer « <b>${esc(old.t)}</b> » par une autre quête <b>${PERIOD[old.p].label.toLowerCase()}</b> :</p>
      <p class="center muted tiny">${freeSetup() ? 'Journée de réglage : changements illimités aujourd\'hui.' : 'Ce remplacement utilise ton changement de quête du jour.'}</p>
      <div class="repl-list">${groups || '<p class="muted center">Aucune autre quête disponible pour cette périodicité.</p>'}</div>`,
    [{ label: 'Annuler' }], 'replace');
  }
  function replaceQuest(qid, cid) {
    const old = state.quests.find((q) => q.id === qid), src = CATALOG.find((c) => c.cid === cid);
    if (!old || !src) return;
    if (!canRem() || !canAdd()) { lockedMsg('rem'); return; }
    const wasDone = old.done, idx = state.quests.indexOf(old);
    removeQuest(old);
    addQuest(src);
    const nq = state.quests.pop();
    if (wasDone) nq.done = true;                 // déjà validée sur ce cycle : pas de double XP
    state.quests.splice(Math.min(idx, state.quests.length), 0, nq); // garde la position dans la liste
    log('info', `Quête remplacée : « ${old.t} » → « ${nq.t} »`);
    toast('Quête remplacée', 'good');
    save(); render();
  }

  /* ---------------- quêtes ---------------- */
  function makeQuest(src) {
    const q = {
      id: uid(), cid: src.cid || null, d: src.d, p: src.p, r: src.r, t: src.t, desc: src.desc || '',
      xp: questXP(src.r, src.p), cycle: cycleKey(src.p), done: false, custom: !!src.custom
    };
    if (src.tgt) { q.tgt = { n: src.tgt.n, unit: src.tgt.unit, step: src.tgt.step || 1 }; q.prog = 0; }
    return q;
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
    const waiting = DKEYS.filter(bossWaiting);
    // + les stats qui étaient bloquées pendant la journée écoulée (boss vaincu en cours de route)
    if (state.waitSeen && state.waitSeen.day !== curDay) state.waitSeen.doms.forEach((d) => { if (!waiting.includes(d)) waiting.push(d); });
    const closedDaily = state.quests.filter((q) => q.p === 'daily' && q.cycle !== curDay && !waiting.includes(q.d));
    let dayRatio = 1, dayDone = 0;
    if (closedDaily.length) {
      const skippedDays = closedDaily.some((q) => cyclesBetween('daily', q.cycle, curDay) > 1);
      dayDone = skippedDays ? 0 : closedDaily.filter((q) => q.done).length;
      dayRatio = dayDone / closedDaily.length;
    }
    const PEN_THRESHOLD = 2 / 3; // part minimale des quêtes du jour à valider
    const belowThird = closedDaily.length > 0 && dayRatio < PEN_THRESHOLD && !state.settings.pause;
    state.quests.forEach((q) => {
      const cur = cycleKey(q.p, now);
      if (q.cycle === cur) return;
      const gap = cyclesBetween(q.p, q.cycle, cur);
      let m = (q.done ? 0 : 1) + Math.max(0, gap - 1);
      m = Math.min(m, PERIOD[q.p].cap);
      if (waiting.includes(q.d)) m = 0; // boss en attente : quête facultative, aucune perte
      if (m > 0 && !state.settings.pause) {
        loss[q.d] += Math.round(q.xp * PENALTY_RATE) * m;
        missed.push({ t: q.t, d: q.d, m, amt: Math.round(q.xp * PENALTY_RATE) * m });
      }
      q.cycle = cur; q.done = false;
      if (q.tgt) q.prog = 0;
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
    // Quête de pénalité : si moins de 2/3 des quêtes du jour ont été validées.
    const newPens = [];
    const drawPenalty = (stake, reason) => {
      const k = tier(avgLevel());
      const pool = PENALTIES.filter((x) => (x.min || 0) <= k); // certaines pénalités n'existent qu'à partir d'un rang
      const pick = pool[Math.floor(Math.random() * pool.length)];
      state.lastPenaltyDay = dk(now);
      const p = { id: uid(), t: pick.t(k), desc: pick.desc, created: now.getTime(), deadline: now.getTime() + PENALTY_DELAY, loss: stake, reason };
      state.penalties.push(p); newPens.push(p);
      return p;
    };
    if (belowThird) {
      pen = drawPenalty(total > 0 ? loss : { sport: 30, finance: 30, relation: 30 },
        `${dayDone}/${closedDaily.length} quêtes du jour validées (minimum : ${Math.ceil(closedDaily.length * 2 / 3)})`);
      log('pen', `Moins de 2/3 des quêtes validées (${dayDone}/${closedDaily.length}) → Zone de pénalité : « ${pen.t} »`);
    }
    // Boss non vaincu dans les 30 jours : perte d'XP + quête de pénalité
    const failedBosses = [];
    checkBossTimers(now.getTime(), failedBosses);
    failedBosses.forEach((x) => {
      const p = drawPenalty({ [x.d]: x.loss }, `${x.b.name} non vaincu en ${BOSS_DAYS.big} jours (${DOMAINS[x.d].label} niv. ${x.b.lvl})`);
      log('pen', `Délai du gardien expiré → Zone de pénalité : « ${p.t} »`);
    });
    ensureChallenge();
    checkPersona();
    save();
    if (missed.length || newPens.length || failed.length || failedBosses.length) showPenaltyAlert(missed, newPens, failed, failedBosses);
  }

  // Zone de pénalité bloquante : tant qu'une pénalité est en cours, aucune quête ne peut être validée.
  const penaltyLock = () => state.penalties.length > 0 && !state.settings.pause;
  function lockToast() { toast('🔒 Zone de pénalité : accomplis d\'abord ta pénalité', 'bad'); window.SFX.play('warn'); }
  function completeQuest(q) {
    q.done = true;
    addXP(q.d, q.xp);
    state.stats.questsDone++;
    log('ok', `Quête accomplie : « ${q.t} » (+${q.xp} XP ${DOMAINS[q.d].label})`);
    toast(`+${q.xp} XP · ${DOMAINS[q.d].stat}`, 'good');
    window.SFX.play('quest');
    checkDailyBonus();
  }
  function uncompleteQuest(q) {
    q.done = false;
    addXP(q.d, -q.xp);
    state.stats.questsDone = Math.max(0, state.stats.questsDone - 1);
    log('info', `Quête annulée : « ${q.t} » (−${q.xp} XP)`);
    if (q.p === 'daily') revokeDailyBonus();
  }
  function toggleQuest(id) {
    const q = state.quests.find((x) => x.id === id);
    if (!q || q.tgt) return; // les quêtes chiffrées se valident en remplissant l'objectif
    if (!q.done && penaltyLock()) return lockToast();
    if (!q.done) completeQuest(q); else uncompleteQuest(q);
    checkPersona();
    save(); render(); flushOverlays();
  }

  function checkDailyBonus() {
    const today = dk(new Date());
    const dailies = state.quests.filter((q) => q.p === 'daily' && !exemptToday(q.d));
    if (!dailies.length || !dailies.every((q) => q.done) || state.lastFullDay === today) return;
    const prev = { streak: state.streak, lastFullDay: state.lastFullDay };
    const yesterday = dk(new Date(Date.now() - 864e5));
    state.streak = state.lastFullDay === yesterday ? state.streak + 1 : 1;
    state.lastFullDay = today;
    state.stats.maxStreak = Math.max(state.stats.maxStreak, state.streak);
    const amt = 10 + 2 * Math.min(state.streak, 20);
    DKEYS.forEach((d) => addXP(d, amt));
    state.bonus = { day: today, amt, prev };
    log('ok', `Toutes les quêtes du jour accomplies ! Série : ${state.streak} j (+${amt} XP par domaine)`);
    setTimeout(() => modal(`
      <div class="sys-head">QUÊTE JOURNALIÈRE TERMINÉE</div>
      <p class="center big">Toutes les quêtes quotidiennes sont accomplies.</p>
      <p class="center">Récompense : <b class="glow">+${amt} XP</b> dans chaque domaine</p>
      <p class="center muted">Série en cours : <b>${state.streak}</b> jour(s)</p>`, [{ label: 'Confirmer', primary: true }], '', 'levelup'), 400);
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
    state.stats.penDone++;
    const sum = DKEYS.reduce((s, d) => s + back[d], 0);
    log('ok', `Pénalité accomplie : « ${p.t} » (+${sum} XP récupérée)`);
    toast(`Pénalité accomplie · +${sum} XP récupérée`, 'good');
    window.SFX.play('quest');
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
    markPassedBosses();
    // gardien accessible dès la fin du questionnaire : son compteur de 30 jours démarre maintenant
    DKEYS.forEach((d) => { const L = state.domains[d].level; if (sealed(d, L)) { if (!state.bossTimers[d] || state.bossTimers[d].L !== L) startBossTimer(d, L); } else delete state.bossTimers[d]; });
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
    const items = [['status', '◈', 'Statut'], ['quests', '!', 'Quêtes'], ['catalog', '✚', 'Catalogue'], ['journal', '▲', 'Progrès'], ['settings', '⚙', 'Système']];
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
    let personaHtml;
    if (P.hybrid) {
      const grad = `linear-gradient(90deg, ${P.doms.map((d) => DOMAINS[d].color).join(', ')})`;
      const missing = DKEYS.find((d) => !P.doms.includes(d));
      personaHtml = `<section class="window persona hybrid" style="--c:${PC};--grad:${grad}">
        <div class="sys-head hy-head">STATUT HYBRIDE</div>
        <div class="av-wrap">${personaAvatar(P)}</div>
        <div class="p-title hy-title">${esc(P.t)}</div>
        <div class="p-cls">Classe ${esc(P.cls)} · Rang <b class="rank-${P.rank}">${P.rank}</b></div>
        <div class="hy-badges">${P.doms.map((d) => `<span style="--c:${DOMAINS[d].color}">${DOMAINS[d].icon} ${DOMAINS[d].stat} S</span>`).join('')}</div>
        <p class="p-desc">${esc(P.desc)}</p>
        <div class="p-traits">${P.traits.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        ${missing ? `<p class="center muted tiny">Atteins le niveau ${S_LEVEL} en ${DOMAINS[missing].label} pour devenir « ${esc(HYBRIDS['sport+finance+relation'].t)} »</p>` : '<p class="center tiny glow">Statut ultime atteint : les trois strates au sommet.</p>'}
        <button class="btn ghost sm gal-btn" data-act="gallery">Galerie des statuts</button>
      </section>`;
    } else {
      const ladder = CLASSES[P.dom].tiers.map((x, i) => `<span class="lad ${i === P.r ? 'on' : i < P.r ? 'past' : ''}" title="${esc(x.t)}">${RANKS[i]}</span>`).join('');
      const sCount = DKEYS.filter((d) => state.domains[d].level >= S_LEVEL).length;
      personaHtml = `<section class="window persona" style="--c:${PC}">
        <div class="sys-head" style="color:${PC}">STATUT DE PERSONNALITÉ</div>
        <div class="av-wrap">${personaAvatar(P)}</div>
        <div class="p-title">${esc(P.t)}</div>
        <div class="p-cls">Classe ${esc(P.cls)} · Rang <b class="rank-${P.rank}">${P.rank}</b> · Stat dominante : ${DOMAINS[P.dom].stat}</div>
        <p class="p-desc">${esc(P.desc)}</p>
        <div class="p-traits">${P.traits.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="ladder">${ladder}</div>
        ${P.r < 5 ? `<p class="center muted tiny">Prochain statut au rang ${RANKS[P.r + 1]} : « ${esc(CLASSES[P.dom].tiers[P.r + 1].t)} »</p>` : ''}
        <p class="center muted tiny">✦ Statut hybride : atteins le niveau ${S_LEVEL} dans 2 stats (${sCount}/2)</p>
        <button class="btn ghost sm gal-btn" data-act="gallery">Galerie des statuts</button>
      </section>`;
    }
    return `
      ${pen}${pause}
      ${personaHtml}
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
          <div class="stat-foot"><span>${D.level >= 100 ? 'NIVEAU MAX' : `XP ${D.xp} / ${need(D.level)}`}${sealed(d, D.level) && D.xp >= need(D.level) ? ' · <b class="red-t">🔒 BOSS REQUIS</b>' : ''}</span><span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲ +' : '▼ '}${delta} depuis l'évaluation</span></div>
          ${bossRow(d)}
        </section>`;
      }).join('')}
    `;
  }

  function bossRow(d) {
    const b = nextBoss(d), D = state.domains[d];
    if (!b) return '<div class="boss-row cleared">♛ Tous les gardiens de cette stat sont vaincus</div>';
    const ready = D.level >= b.lvl, left = b.lvl - D.level;
    return `<div class="boss-row ${ready ? 'ready' : ''} ${b.big ? 'big' : ''}">
      <div class="boss-spr">${bossSprite(b.name, DOMAINS[d].color, b.big)}</div>
      <div class="boss-info">
        <div class="boss-type">${b.big ? 'BOSS' : 'MINI-BOSS'} · NIV. ${b.lvl}</div>
        <div class="boss-name">${esc(b.name)}</div>
        <div class="boss-task">${esc(b.task)}</div>
        <div class="boss-meta">${ready ? `<b class="red-t">⚠ Bloque ta progression</b>` : `Apparaît dans ${left} niveau${left > 1 ? 'x' : ''}`} · Récompense +${bossReward(b)} XP</div>
        ${ready ? `<div class="boss-meta">⏸ Quêtes ${DOMAINS[d].label} facultatives tant qu'il n'est pas vaincu</div>` : ''}
        ${ready && state.bossTimers[d] ? `<div class="boss-meta">⏳ Délai : <b class="cd red-t" data-until="${state.bossTimers[d].deadline}">${fmtLeft(state.bossTimers[d].deadline - Date.now())}</b> · sinon −${Math.round(need(b.lvl) * (b.big ? BOSS_FAIL_RATE.big : BOSS_FAIL_RATE.mini))} XP et Zone de pénalité</div>` : ''}
      </div>
      ${ready ? `<button class="btn sm red" data-act="boss" data-d="${d}" data-l="${b.lvl}">Affronter</button>` : ''}
    </div>`;
  }

  function questCard(q) {
    const M = DOMAINS[q.d];
    return `<div class="quest ${q.done ? 'done' : ''}" style="--c:${M.color}">
      <div class="q-rank r-${q.r}">${q.r}</div>
      <div class="q-body">
        <div class="q-title">${esc(q.t)}</div>
        <div class="q-meta"><span style="color:${M.color}">${M.icon} ${M.label}</span> · +${q.xp} XP · ${(q.p === 'daily' ? exemptToday(q.d) : bossWaiting(q.d)) ? '<span class="wait">⏸ boss en attente : facultative</span>' : `<span class="pen">−${Math.round(q.xp * PENALTY_RATE)} si échec</span>`}</div>
        ${q.desc ? `<div class="q-desc">${esc(q.desc)}</div>` : ''}
        ${q.tgt ? `<div class="tgt">
          <div class="tgt-bar"><i style="width:${Math.min(100, ((q.prog || 0) / q.tgt.n) * 100)}%"></i></div>
          <div class="tgt-row"><span class="tgt-v"><b>${fmtN(q.prog || 0)}</b> / ${fmtN(q.tgt.n)} ${esc(q.tgt.unit)}</span>
            <form class="tgt-form" data-id="${q.id}"><input name="v" type="number" inputmode="decimal" step="any" value="${q.tgt.step}" aria-label="Quantité à ajouter"><button class="btn sm" type="submit" ${penaltyLock() ? 'disabled' : ''}>+ Ajouter</button></form></div>
        </div>` : ''}
      </div>
      ${q.tgt ? `<div class="check tgt-check" aria-hidden="true">${q.done ? '✔' : Math.floor(((q.prog || 0) / q.tgt.n) * 100) + '%'}</div>`
        : `<button class="check ${!q.done && penaltyLock() ? 'locked' : ''}" data-act="toggle" data-id="${q.id}" aria-label="${q.done ? 'Annuler' : 'Valider'}">${q.done ? '✔' : penaltyLock() ? '🔒' : ''}</button>`}
    </div>`;
  }
  function challengeCard() {
    ensureChallenge();
    const c = state.challenge, M = DOMAINS[c.d];
    return `<section class="window challenge" style="--c:${M.color}">
      <div class="sys-head ch-head">✧ DÉFI DU JOUR ✧</div>
      <div class="quest ${c.done ? 'done' : ''}" style="--c:${M.color}">
        <div class="q-rank r-${c.r}">${c.r}</div>
        <div class="q-body"><div class="q-title">${esc(c.t)}</div>
          <div class="q-meta"><span style="color:${M.color}">${M.icon} ${M.label}</span> · <b class="ch-xp">+${c.xp} XP (×2)</b> · facultatif, sans pénalité</div></div>
        <button class="check ${!c.done && penaltyLock() ? 'locked' : ''}" data-act="challenge" aria-label="${c.done ? 'Annuler' : 'Valider'}">${c.done ? '✔' : penaltyLock() ? '🔒' : ''}</button>
      </div>
      <div class="sec-info"><span>Nouveau défi dans</span><b class="cd" data-until="${nextReset('daily').getTime()}">${fmtLeft(nextReset('daily') - Date.now())}</b></div>
    </section>`;
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
        <p class="center tiny lock-note">🔒 Zone de pénalité : la validation de toutes les quêtes est bloquée jusqu'à ce que cette pénalité soit accomplie.</p>
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
    return `${pens}${todayHeader()}${challengeCard()}<div class="chips">${chips}</div>${sections}`;
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
            <div class="q-meta">${PERIOD[c.p].label} · +${questXP(c.r, c.p)} XP${c.tgt ? ` · ◎ objectif ${fmtN(c.tgt.n)} ${esc(c.tgt.unit)}` : ''} ${rec ? '· <span class="rec">recommandée</span>' : ''}</div></div>
          <button class="btn sm ${on ? 'ghost' : ''}" data-act="cat" data-id="${c.cid}" ${(on ? canRem() && canAdd() : canAdd()) ? '' : 'disabled'}>${on ? '⇄ Remplacer' : 'Ajouter'}</button>
        </div>`;
      }).join('');
      return `<section class="window" style="--c:${DOMAINS[d].color}"><div class="sys-head" style="color:${DOMAINS[d].color}">${DOMAINS[d].icon} ${DOMAINS[d].label.toUpperCase()} · NIV. ${lvl}</div>${rows}</section>`;
    }).join('');
    const chips = [['all', 'Tous'], ...DKEYS.map((d) => [d, DOMAINS[d].label])].map(([k, l]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-act="filter" data-v="${k}">${l}</button>`).join('');
    const c = changes(), rw = regenWait();
    const tomorrow = nextReset('daily').getTime();
    const lockInfo = freeSetup()
      ? '<div class="window note">🛠 Journée de réglage : changements de quêtes illimités aujourd\'hui. À partir de demain : 1 changement par jour.</div>'
      : `<div class="window note ${canAdd() || canRem() ? '' : 'locked'}">🔒 1 changement de quête par jour (1 ajout ou 1 remplacement) · Ajout ${c.add}/1 · Retrait ${c.rem}/1${canAdd() || canRem() ? '' : ` · Déblocage dans <b class="cd" data-until="${tomorrow}">${fmtLeft(tomorrow - Date.now())}</b>`}</div>`;
    return `
      ${lockInfo}
      <section class="window">
        <div class="sys-head">CRÉER UNE QUÊTE</div>
        <form id="customForm" class="form">
          <input name="t" maxlength="90" placeholder="Intitulé de la quête" required>
          <div class="row3"><select name="d">${dSel}</select><select name="p">${pSel}</select></div>
          <select name="r">${rSel}</select>
          <details class="tgt-opt"><summary>Objectif chiffré (facultatif)</summary>
            <div class="row3"><input name="tn" type="number" inputmode="decimal" step="any" min="0" placeholder="Cible, ex. 20"><input name="tu" maxlength="12" placeholder="Unité, ex. km"></div>
          </details>
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

  /* ---------------- en-tête « Ma journée » (haut de l'onglet Quêtes) ---------------- */
  function todayHeader() {
    const now = new Date(), reset = nextReset('daily');
    const dl = state.quests.filter((q) => q.p === 'daily' && !exemptToday(q.d)), dd = dl.filter((q) => q.done).length;
    const need3 = Math.ceil(dl.length * 2 / 3), safe = dd >= need3;
    const waitNote = DKEYS.filter(exemptToday).map((d) => `${DOMAINS[d].icon} ${DOMAINS[d].label}`).join(', ');
    const pct = dl.length ? (dd / dl.length) * 100 : 0, mark = dl.length ? (need3 / dl.length) * 100 : 0;
    const dayName = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<section class="window today-head">
        <div class="sys-head">MA JOURNÉE</div>
        <div class="td-date">${esc(dayName)}</div>
        <div class="td-grid">
          <div><div class="lbl">FIN DE JOURNÉE</div><div class="val"><b class="cd" data-until="${reset.getTime()}">${fmtLeft(reset - now)}</b></div></div>
          <div><div class="lbl">SÉRIE</div><div class="val">${state.streak} j 🔥</div></div>
        </div>
        ${dl.length ? `<div class="td-prog ${safe ? 'safe' : ''}">
          <div class="td-bar"><i style="width:${pct}%"></i><span class="td-mark" style="left:${mark}%" title="Seuil 2/3"></span></div>
          <div class="td-txt">${safe ? '✔ Seuil des 2/3 atteint' : `⚠ Encore ${need3 - dd} quête(s) pour éviter la Zone de pénalité`} · <b>${dd}/${dl.length}</b></div>
          <div class="td-sub">Chaque quête manquée coûte de l'XP.</div>
        </div>` : ''}
        ${waitNote ? `<div class="td-wait">⏸ Boss en attente (${waitNote}) : ces quêtes sont facultatives et ne comptent pas pour la pénalité tant que le gardien n'est pas vaincu.</div>` : ''}
      </section>`;
  }

  /* ---------------- graphique de progression (1 axe, 3 séries, survol) ---------------- */
  function progressChart() {
    const all = state.history.slice();
    const days = ui.range || 30;
    const cutoff = days >= 9999 ? '' : dk(new Date(Date.now() - (days - 1) * 864e5));
    const data = all.filter((e) => !cutoff || e.d >= cutoff);
    const ranges = [[7, '7 j'], [30, '30 j'], [90, '90 j'], [9999, 'Tout']];
    const chips = `<div class="chips chart-chips">${ranges.map(([v, l]) => `<button class="chip ${days === v ? 'on' : ''}" data-act="chart-range" data-v="${v}">${l}</button>`).join('')}</div>`;
    const legend = `<div class="ch-legend">${DKEYS.map((d) => `<span><i style="background:${CHART_COLORS[d]}"></i>${DOMAINS[d].label}</span>`).join('')}</div>`;
    if (data.length < 2) {
      return `${chips}${legend}<p class="muted center tiny">La courbe se dessine jour après jour : reviens demain pour voir ta progression.</p>`;
    }
    const W = 340, H = 190, ml = 28, mr = 62, mt = 12, mb = 24;
    const keys = { sport: 's', finance: 'f', relation: 'r' };
    let lo = 100, hi = 0;
    data.forEach((e) => DKEYS.forEach((d) => { lo = Math.min(lo, e[keys[d]]); hi = Math.max(hi, e[keys[d]]); }));
    lo = Math.max(0, Math.floor((lo - 5) / 10) * 10); hi = Math.min(100, Math.ceil((hi + 5) / 10) * 10);
    if (hi - lo < 20) hi = Math.min(100, lo + 20);
    const n = data.length;
    const x = (i) => ml + (i / (n - 1)) * (W - ml - mr);
    const y = (v) => mt + (1 - (v - lo) / (hi - lo)) * (H - mt - mb);
    let grid = '';
    for (let v = lo; v <= hi; v += (hi - lo > 40 ? 20 : 10)) grid += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" class="cg"/><text x="${ml - 6}" y="${y(v) + 3}" class="ct" text-anchor="end">${v}</text>`;
    const fmtD = (k) => { const dt = fromDk(k); return `${dt.getDate()}/${dt.getMonth() + 1}`; };
    const ticks = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i)
      .map((i) => `<text x="${x(i)}" y="${H - 6}" class="ct" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${fmtD(data[i].d)}</text>`).join('');
    const lines = DKEYS.map((d) => `<polyline points="${data.map((e, i) => `${x(i).toFixed(1)},${y(e[keys[d]]).toFixed(1)}`).join(' ')}" class="cl" style="stroke:${CHART_COLORS[d]}"/>`).join('');
    // étiquettes directes en fin de courbe, écartées pour ne pas se chevaucher
    const ends = DKEYS.map((d) => ({ d, v: data[n - 1][keys[d]], yy: y(data[n - 1][keys[d]]) })).sort((a, b) => a.yy - b.yy);
    for (let i = 1; i < ends.length; i++) if (ends[i].yy - ends[i - 1].yy < 13) ends[i].yy = ends[i - 1].yy + 13;
    const labels = ends.map((e) => `<circle cx="${x(n - 1)}" cy="${y(e.v)}" r="4" fill="${CHART_COLORS[e.d]}" class="cdot"/><text x="${x(n - 1) + 8}" y="${e.yy + 4}" class="cn">${DOMAINS[e.d].label} ${e.v}</text>`).join('');
    const table = `<details class="ch-table"><summary>Voir les données</summary><table><thead><tr><th>Jour</th>${DKEYS.map((d) => `<th>${DOMAINS[d].label}</th>`).join('')}</tr></thead><tbody>${data.slice().reverse().map((e) => `<tr><td>${fmtD(e.d)}</td><td>${e.s}</td><td>${e.f}</td><td>${e.r}</td></tr>`).join('')}</tbody></table></details>`;
    return `${chips}${legend}
      <div class="chart" data-n="${n}" data-ml="${ml}" data-mr="${mr}" data-w="${W}">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution des niveaux Sport, Finance et Relation">${grid}${ticks}${lines}${labels}
          <line class="cx" x1="0" x2="0" y1="${mt}" y2="${H - mb}" style="display:none"/>
        </svg>
        <div class="ctip" style="display:none"></div>
        <script type="application/json" class="cdata">${JSON.stringify(data.map((e) => [fmtD(e.d), e.s, e.f, e.r]))}</script>
      </div>${table}`;
  }
  // survol / toucher : réticule + infobulle
  function chartHover(e) {
    const box = e.target.closest('.chart'); if (!box) return;
    const svg = box.querySelector('svg'), r = svg.getBoundingClientRect();
    const n = +box.dataset.n, ml = +box.dataset.ml, mr = +box.dataset.mr, W = +box.dataset.w;
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - ml) / (W - ml - mr)) * (n - 1))));
    const data = JSON.parse(box.querySelector('.cdata').textContent), row = data[i];
    const cx = ml + (i / (n - 1)) * (W - ml - mr);
    const line = box.querySelector('.cx'); line.setAttribute('x1', cx); line.setAttribute('x2', cx); line.style.display = '';
    const tip = box.querySelector('.ctip');
    tip.innerHTML = `<b>${row[0]}</b>${DKEYS.map((d, k) => `<span><i style="background:${CHART_COLORS[d]}"></i>${DOMAINS[d].label} <b>${row[k + 1]}</b></span>`).join('')}`;
    tip.style.display = '';
    const left = (cx / W) * r.width;
    tip.style.left = Math.min(r.width - tip.offsetWidth, Math.max(0, left - tip.offsetWidth / 2)) + 'px';
  }
  document.addEventListener('pointermove', chartHover);
  document.addEventListener('pointerdown', chartHover);
  document.addEventListener('pointerleave', (e) => {
    const box = e.target.closest && e.target.closest('.chart'); if (!box) return;
    box.querySelector('.cx').style.display = 'none'; box.querySelector('.ctip').style.display = 'none';
  }, true);

  function renderAchievements() {
    const got = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
    const cats = [...new Set(ACHIEVEMENTS.map((a) => a.cat))];
    return `<section class="window"><div class="sys-head">SUCCÈS · ${got}/${ACHIEVEMENTS.length}</div>
      ${bar(got, ACHIEVEMENTS.length, '#ffd34d')}
      ${cats.map((c) => `<div class="gal-sec">${c.toUpperCase()}</div><div class="ach-grid">${ACHIEVEMENTS.filter((a) => a.cat === c).map((a) => {
        const t = state.achievements[a.id];
        return `<div class="ach ${t ? 'got' : ''}" title="${esc(a.desc)}"><div class="ach-ic">${t ? a.icon : '🔒'}</div><div class="ach-t">${esc(a.t)}</div><div class="ach-d">${esc(a.desc)}</div>${t ? `<div class="ach-date">${new Date(t).toLocaleDateString('fr-FR')}</div>` : ''}</div>`;
      }).join('')}</div>`).join('')}
    </section>`;
  }

  function renderJournal() {
    const icons = { ok: '✔', fail: '✖', lvl: '▲', pen: '⚠', info: '•' };
    const rows = state.log.slice(0, 200).map((e) => {
      const d = new Date(e.t);
      return `<div class="log log-${e.k}"><span class="log-ic">${icons[e.k] || '•'}</span><div><div>${esc(e.m)}</div><small>${d.toLocaleDateString('fr-FR')} ${pad(d.getHours())}:${pad(d.getMinutes())}</small></div></div>`;
    }).join('');
    return `<section class="window"><div class="sys-head">PROGRESSION</div>${progressChart()}</section>
      ${renderAchievements()}
      <section class="window"><div class="sys-head">JOURNAL DU SYSTÈME</div>${rows || '<p class="muted center">Aucune entrée.</p>'}</section>`;
  }

  function renderSettings() {
    return `
      <section class="window"><div class="sys-head">PROFIL</div>
        <form id="nameForm" class="form"><input name="n" maxlength="30" value="${esc(state.name)}" placeholder="Pseudo"><button class="btn" type="submit">Renommer</button></form>
      </section>
      <section class="window"><div class="sys-head">EFFETS SONORES</div>
        <p class="muted">Sons du Système : ouverture des fenêtres, quêtes, niveaux, rangs et boss. Sur iPhone, le bouton silencieux coupe aussi ces sons.</p>
        <div class="row2"><button class="btn ${state.settings.sound ? '' : 'ghost'}" data-act="sound">${state.settings.sound ? '🔊 Son activé' : '🔇 Son coupé'}</button><button class="btn ghost" data-act="sound-test">Tester</button></div>
        <label class="vol">Volume <input type="range" id="vol" min="0" max="1" step="0.05" value="${state.settings.volume ?? 0.7}"></label>
      </section>
      <section class="window"><div class="sys-head">MUSIQUE D'AMBIANCE</div>
        <p class="muted">Ambiance calme générée en continu, jamais identique. Elle s'arrête quand tu quittes l'app et baisse pendant les grands moments (boss, rang).</p>
        <button class="btn ${state.settings.music !== false ? '' : 'ghost'}" data-act="music">${state.settings.music !== false ? '♫ Musique activée' : '🔇 Musique coupée'}</button>
        <label class="vol">Volume <input type="range" id="mvol" min="0" max="1" step="0.05" value="${state.settings.musicVolume ?? 0.5}"></label>
      </section>
      <section class="window"><div class="sys-head">MODE REPOS</div>
        <p class="muted">Vacances, maladie, blessure : active le mode repos pour suspendre toutes les pénalités. Les quêtes continuent de se réinitialiser.</p>
        <button class="btn ${state.settings.pause ? 'red' : ''}" data-act="pause">${state.settings.pause ? 'Désactiver le mode repos' : 'Activer le mode repos'}</button>
      </section>
      <section class="window"><div class="sys-head">RAPPEL QUOTIDIEN</div>
        <p class="muted">Une app web ne peut pas envoyer de notification toute seule sans serveur. La solution fiable : un rappel quotidien dans le calendrier de ton téléphone, qui t'envoie une notification à l'heure choisie et ouvre l'app d'un appui.</p>
        <div class="row2"><select id="remHour">${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === (state.reminderHour ?? 20) ? 'selected' : ''}>${pad(h)}:00</option>`).join('')}</select>
        <button class="btn" data-act="reminder">Ajouter au calendrier</button></div>
      </section>
      <section class="window"><div class="sys-head">SAUVEGARDE</div>
        <p class="muted">Dernier export : <b>${state.lastExport ? `il y a ${Math.floor((Date.now() - state.lastExport) / 864e5)} jour(s)` : 'jamais'}</b> · Rappel automatique chaque semaine. ${state.persisted ? '🛡 Stockage protégé contre l\'effacement automatique.' : ''}</p>
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
      <section class="window"><div class="sys-head">MISE À JOUR</div>
        <p class="muted">Version installée : <b class="glow">${APP_VERSION}</b>. Si l'affichage ne correspond pas à la dernière version, force la mise à jour. Tes données ne sont pas touchées.</p>
        <button class="btn" data-act="force-update">Forcer la mise à jour</button>
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
  function modal(html, buttons = [{ label: 'OK', primary: true }], cls = '', sound = 'open') {
    if (sound) window.SFX.play(sound);
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
    if (o.type === 'bossAppear' || o.type === 'bossWin') {
      const b = bossAt(o.d, o.L);
      if (o.type === 'bossAppear') {
        modal(`<div class="sys-head red">${b.big ? 'BOSS' : 'MINI-BOSS'} APPARU</div>
          <div class="boss-big shake">${bossSprite(b.name, M.color, b.big)}</div>
          <div class="pen-title">${esc(b.name)}</div>
          <p class="center muted">Gardien du niveau ${o.L} · ${M.label}</p>
          <p class="center">Épreuve : <b>${esc(b.task)}</b></p>
          <p class="center muted tiny">Ta stat ${M.stat} est bloquée au niveau ${o.L} tant que ce gardien n'est pas vaincu. Ton XP continue de s'accumuler.</p>`,
        [{ label: 'Relever le défi', primary: true, red: true }], 'danger', 'boss');
      } else {
        modal(`<div class="lvlup" style="--c:${M.color}"><div class="lvlup-t">VICTOIRE</div>
          <div class="boss-big dead">${bossSprite(b.name, M.color, b.big)}</div>
          <div class="lvlup-d">${b.big ? 'BOSS' : 'MINI-BOSS'} VAINCU</div>
          <div class="p-title">${esc(b.name)}</div>
          <div class="lvlup-x">+${o.xp} XP · ${M.stat} débloquée</div></div>`, [{ label: 'Confirmer', primary: true }], 'levelup', 'victory');
      }
      return;
    }
    if (o.type === 'ach') {
      const a = ACHIEVEMENTS.find((x) => x.id === o.id);
      modal(`<div class="lvlup ach-pop"><div class="sys-head" style="color:#ffd34d">SUCCÈS DÉBLOQUÉ</div>
        <div class="ach-ic big">${a.icon}</div>
        <div class="p-title">${esc(a.t)}</div>
        <p class="p-desc">${esc(a.desc)}</p></div>`, [{ label: 'Confirmer', primary: true }], 'levelup', 'achieve');
      return;
    }
    if (o.type === 'persona') {
      const P = persona(), PC = DOMAINS[P.dom].color;
      modal(`<div class="lvlup" style="--c:${PC}"><div class="sys-head" style="color:${P.hybrid ? '#ffd34d' : PC}">${P.hybrid ? 'STATUT HYBRIDE DÉBLOQUÉ' : 'NOUVEAU STATUT'}</div>
        <div class="av-wrap sm">${personaAvatar(P)}</div>
        <div class="p-title">${esc(P.t)}</div>
        <div class="p-cls">Classe ${esc(P.cls)} · ${P.hybrid ? P.doms.map((d) => DOMAINS[d].stat + ' S').join(' + ') : 'Rang ' + P.rank}</div>
        <p class="p-desc">${esc(P.desc)}</p></div>`, [{ label: 'Confirmer', primary: true }], 'levelup', 'rankup');
      return;
    }
    if (o.type === 'up') {
      modal(`<div class="lvlup" style="--c:${M.color}"><div class="lvlup-t">LEVEL UP!</div>
        <div class="lvlup-d">${M.icon} ${M.label.toUpperCase()}</div>
        <div class="lvlup-n">${o.from} <span>→</span> <b>${o.to}</b></div>
        ${o.title ? `<div class="lvlup-x">Nouveau titre obtenu : « ${esc(o.title)} »</div>` : ''}
        ${o.rank ? `<div class="lvlup-x">Rang global : <b>${o.rank}</b></div>` : ''}</div>`, [{ label: 'Confirmer', primary: true }], 'levelup', o.rank ? 'rankup' : 'levelup');
    } else {
      modal(`<div class="sys-head red">NIVEAU PERDU</div><p class="center big">${M.label} : ${o.from} → <b class="red-t">${o.to}</b></p><p class="center muted">Le Système ne tolère pas la faiblesse.</p>`, [{ label: 'Compris', primary: true, red: true }], 'danger', 'down');
    }
  }
  function showPenaltyAlert(missed, pens, failed, failedBosses = []) {
    const list = missed.map((x) => `<li><span style="color:${DOMAINS[x.d].color}">${DOMAINS[x.d].icon}</span> ${esc(x.t)}${x.m > 1 ? ' ×' + x.m : ''} <b class="red-t">−${x.amt} XP</b></li>`).join('');
    const fl = failed.map((p) => `<li>Pénalité non accomplie : « ${esc(p.t)} » <b class="red-t">−${DKEYS.reduce((s, d) => s + (p.loss[d] || 0), 0)} XP</b></li>`).join('')
      + failedBosses.map((x) => `<li>${DOMAINS[x.d].icon} Délai expiré : ${esc(x.b.name)} n'a pas été vaincu <b class="red-t">−${x.loss} XP</b></li>`).join('');
    modal(`<div class="sys-head red">AVERTISSEMENT</div>
      ${missed.length ? '<p class="center">Des quêtes n\'ont pas été accomplies dans le temps imparti.</p>' : ''}
      <ul class="pen-list">${list}${fl}</ul>
      ${missed.length && !pens.some((p) => /quêtes du jour/.test(p.reason)) ? '<p class="center muted tiny">Tu as validé au moins 2/3 des quêtes du jour : pas de quête de pénalité pour les quêtes, seulement la perte d\'XP.</p>' : ''}
      ${pens.length ? `<p class="center">Tu es transféré dans la <b class="red-t">ZONE DE PÉNALITÉ</b>.</p>
      ${pens.map((p) => `<p class="center tiny" style="color:#ffb3c0">Motif : ${esc(p.reason)}</p><div class="pen-title">${esc(p.t)}</div>`).join('')}
      <p class="center muted">Délai : 24 h. Réussite : 50 % de l'XP perdue récupérée. Échec : la perte est appliquée une seconde fois.</p>
      <p class="center tiny lock-note">🔒 Tant que ${pens.length > 1 ? 'les pénalités ne sont pas accomplies' : 'la pénalité n\'est pas accomplie'}, tu ne peux valider aucune quête.</p>` : ''}`,
    [{ label: 'Accepter', primary: true, red: true }], 'danger', 'warn');
  }

  /* ---------------- galerie des statuts ---------------- */
  function showGallery() {
    const cur = persona();
    const cell = (svg, title, sub, on, got) => `<div class="gal-cell ${on ? 'on' : ''} ${got ? '' : 'locked'}"><div class="gal-av">${svg}</div><div class="gal-t">${esc(title)}</div><div class="gal-s">${sub}</div></div>`;
    let html = '<div class="sys-head">GALERIE DES STATUTS</div><p class="center muted tiny">Ton statut actuel est encadré. Les statuts grisés ne sont pas encore atteints.</p>';
    DKEYS.forEach((d) => {
      const M = DOMAINS[d];
      html += `<div class="gal-sec" style="color:${M.color}">${M.icon} ${CLASSES[d].cls.toUpperCase()} · stat dominante ${M.stat}</div><div class="gal-grid">`;
      CLASSES[d].tiers.forEach((x, i) => {
        html += cell(avatar(d, i, M.color), x.t, 'Rang ' + RANKS[i], !cur.hybrid && cur.dom === d && cur.r === i, !cur.hybrid && cur.dom === d && cur.r >= i);
      });
      html += '</div>';
    });
    html += '<div class="gal-sec" style="color:#ffd34d">✦ STATUTS HYBRIDES · 2 ou 3 stats au niveau ' + S_LEVEL + '</div><div class="gal-grid two">';
    Object.keys(HYBRIDS).forEach((k) => {
      const ds = k.split('+');
      html += cell(avatar(ds, 5, ds.map((d) => DOMAINS[d].color)), HYBRIDS[k].t, ds.map((d) => DOMAINS[d].stat + ' S').join(' + '), cur.hybrid && cur.key === k, cur.hybrid && ds.every((d) => cur.doms.includes(d)));
    });
    html += '</div>';
    modal(html, [{ label: 'Fermer', primary: true }], 'gallery');
  }

  /* ---------------- import / export ---------------- */
  async function doExport() {
    state.lastExport = Date.now(); state.stats.exports++;
    save();
    const name = `leveling-sauvegarde-${dk(new Date())}.json`;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Sauvegarde Leveling' });
        toast('Sauvegarde exportée', 'good'); render(); flushOverlays(); return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde exportée', 'good'); render(); flushOverlays();
  }
  // rappel de sauvegarde hebdomadaire
  function maybeExportReminder() {
    if (!state.calibrated || state.onboarding.step !== 'done') return;
    const last = Math.max(state.lastExport || 0, state.lastExportPrompt || 0);
    if (Date.now() - last < 7 * 864e5) return;
    state.lastExportPrompt = Date.now(); save();
    const days = Math.floor((Date.now() - (state.lastExport || state.created)) / 864e5);
    modal(`<div class="sys-head">SAUVEGARDE HEBDOMADAIRE</div>
      <p class="center">Dernière sauvegarde il y a <b>${days} jour(s)</b>.</p>
      <p class="center muted tiny">Tes données ne sont que sur cet appareil. Un export te protège en cas de perte du téléphone ou d'effacement du navigateur.</p>`,
    [{ label: 'Exporter maintenant', primary: true }, { label: 'Plus tard' }]).then((i) => { if (i === 0) doExport(); });
  }
  // rappel quotidien : événement récurrent à ajouter au calendrier du téléphone
  function downloadReminder() {
    const h = Math.max(0, Math.min(23, state.reminderHour ?? 20));
    const now = new Date(), st = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(h)}0000`;
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const url = location.origin + location.pathname.replace(/index\.html$/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Leveling System//FR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:leveling-rappel-${uid()}@leveling`, `DTSTAMP:${stamp}`, `DTSTART:${st}`, 'DURATION:PT15M', 'RRULE:FREQ=DAILY',
      'SUMMARY:⚔ Leveling : quêtes du jour',
      'DESCRIPTION:Valide au moins 2/3 de tes quêtes avant minuit pour éviter la Zone de pénalité.',
      `URL:${url}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Quêtes du jour', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
    a.download = 'rappel-leveling.ics';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Ouvre le fichier pour l\'ajouter à ton calendrier', 'good');
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
          save(); applySound(); evaluate(); render(); toast('Sauvegarde restaurée', 'good');
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
      case 'tab': if (ui.tab !== el.dataset.v) window.SFX.play('tab'); ui.tab = el.dataset.v; render(); window.scrollTo(0, 0); break;
      case 'filter': ui.filter = el.dataset.v; render(); break;
      case 'gallery': showGallery(); break;
      case 'boss': {
        const d = el.dataset.d, L = +el.dataset.l, b = bossAt(d, L), M = DOMAINS[d];
        const ok = await modal(`<div class="sys-head red">COMBAT</div>
          <div class="boss-big">${bossSprite(b.name, M.color, b.big)}</div>
          <div class="pen-title">${esc(b.name)}</div>
          <p class="center">Épreuve : <b>${esc(b.task)}</b></p>
          <p class="center muted tiny">As-tu réellement accompli cette épreuve ? Le Système te fait confiance : ne triche qu'avec toi-même.</p>`,
        [{ label: 'Épreuve accomplie', primary: true, red: true }, { label: 'Pas encore' }], 'danger', 'boss');
        if (ok === 0) defeatBoss(d, L);
        break;
      }
      case 'toggle': toggleQuest(el.dataset.id); break;
      case 'challenge': toggleChallenge(); break;
      case 'chart-range': ui.range = +el.dataset.v; render(); break;
      case 'reminder': downloadReminder(); break;
      case 'penalty': {
        const ok = await modal('<div class="sys-head red">CONFIRMATION</div><p class="center">As-tu réellement accompli la quête de pénalité ?</p><p class="center muted tiny">Le Système te fait confiance. Ne triche qu\'avec toi-même.</p>', [{ label: 'Oui, accomplie', primary: true, red: true }, { label: 'Pas encore' }], 'danger');
        if (ok === 0) completePenalty(el.dataset.id);
        break;
      }
      case 'cat': {
        const cid = el.dataset.id;
        const existing = state.quests.find((q) => q.cid === cid);
        if (existing) {
          if (!canRem() || !canAdd()) { lockedMsg('rem'); break; }
          showReplace(existing.id);
          break;
        } else {
          if (!canAdd()) { lockedMsg('add'); break; }
          addQuest(CATALOG.find((c) => c.cid === cid));
          toast('Quête ajoutée', 'good');
        }
        save(); render(); break;
      }
      case 'repl-pick': {
        const m = document.querySelector('.modal'); if (m) m.remove();
        replaceQuest(el.dataset.q, el.dataset.cid);
        flushOverlays();
        break;
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
      case 'sound':
        state.settings.sound = !state.settings.sound; applySound();
        if (state.settings.sound) window.SFX.play('quest');
        save(); render(); break;
      case 'music':
        state.settings.music = state.settings.music === false; applySound(); save(); render(); break;
      case 'sound-test': {
        const seq = ['open', 'quest', 'levelup', 'rankup', 'boss'];
        seq.forEach((n, i) => setTimeout(() => window.SFX.play(n), i * 2200));
        toast('Ouverture · Quête · Niveau · Rang · Boss', 'good');
        break;
      }
      case 'pause':
        state.settings.pause = !state.settings.pause;
        log('info', state.settings.pause ? 'Mode repos activé' : 'Mode repos désactivé');
        save(); render(); break;
      case 'export': doExport(); break;
      case 'force-update': {
        toast('Mise à jour en cours…', 'good');
        try {
          if ('serviceWorker' in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map((r) => r.unregister())); }
          if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
        } catch (err) { /* on recharge quand même */ }
        location.replace(location.pathname + '?u=' + Date.now());
        break;
      }
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
      case 'ob-accept': window.SFX.play('open'); o.step = 'name'; save(); render(); break;
      case 'answer': {
        const q = QUESTIONS[o.idx];
        o.answers[q.id] = +el.dataset.i;
        window.SFX.play('tab');
        el.classList.add('sel');
        save();
        setTimeout(() => {
          if (o.idx < QUESTIONS.length - 1) { o.idx++; save(); render(); }
          else { finishQuiz(); render(); window.SFX.play('rankup'); }
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
      const tn = parseFloat(f.tn.value), tu = f.tu.value.trim().slice(0, 12);
      const tgt = tn > 0 ? { n: tn, unit: tu || 'fois', step: tn >= 20 ? Math.round(tn / 10) : 1 } : null;
      addQuest({ d: f.d.value, p: f.p.value, r: f.r.value, t, custom: true, tgt });
      state.stats.customMade++;
      save(); toast('Quête ajoutée', 'good'); render(); flushOverlays();
    }
    if (f.classList.contains('tgt-form')) {
      const v = parseFloat(String(f.v.value).replace(',', '.'));
      if (!isFinite(v) || v === 0) { toast('Entre une quantité', 'bad'); return; }
      addProgress(f.dataset.id, v);
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

  function applySound() {
    window.SFX.enabled = state.settings.sound !== false;
    window.SFX.volume = typeof state.settings.volume === 'number' ? state.settings.volume : 0.7;
    window.SFX.setMusic(state.settings.music !== false, typeof state.settings.musicVolume === 'number' ? state.settings.musicVolume : 0.5);
  }
  document.addEventListener('change', (e) => {
    if (e.target.id === 'vol') { state.settings.volume = +e.target.value; applySound(); window.SFX.play('quest'); save(); }
    if (e.target.id === 'mvol') { state.settings.musicVolume = +e.target.value; applySound(); save(); }
    if (e.target.id === 'remHour') { state.reminderHour = +e.target.value; save(); }
  });

  /* ---------------- démarrage ---------------- */
  load();
  applySound();
  if (state.calibrated && state.onboarding.step === 'result') state.onboarding.step = 'done';
  render();
  evaluate();
  flushOverlays();
  // demande au navigateur de ne pas effacer les données (silencieux)
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((p) => (p ? true : navigator.storage.persist())).then((ok) => { if (ok && !state.persisted) { state.persisted = true; save(); } }).catch(() => {});
  }
  // rappel de sauvegarde : attend que les autres fenêtres (pénalités, succès…) soient fermées
  (function waitForCalm(n) { if (n > 60) return; if (document.querySelector('.modal') || overlayQueue.length) setTimeout(() => waitForCalm(n + 1), 2000); else maybeExportReminder(); })(0);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    // Vérifie s'il existe une nouvelle version à chaque ouverture et recharge automatiquement.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); }
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
  }
})();
