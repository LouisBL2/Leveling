/* =========================================================
   SUCCÈS — débloqués automatiquement, une seule fois.
   test(x) reçoit un résumé de la partie :
   x.st (état), x.lv {sport, finance, relation}, x.max, x.min,
   x.rank (0 = E … 5 = S), x.sCount (stats ≥ 90), x.daysNoPen
   ========================================================= */
(function () {
  const A = [];
  const a = (id, icon, cat, t, desc, test) => A.push({ id, icon, cat, t, desc, test });
  const s = (x) => x.st.stats;

  // Quêtes
  a('q1', '✦', 'Quêtes', 'Premier pas', 'Accomplir ta première quête.', (x) => s(x).questsDone >= 1);
  a('q50', '✦', 'Quêtes', 'Habitué', 'Accomplir 50 quêtes.', (x) => s(x).questsDone >= 50);
  a('q100', '✦', 'Quêtes', 'Centurion', 'Accomplir 100 quêtes.', (x) => s(x).questsDone >= 100);
  a('q250', '✦', 'Quêtes', 'Infatigable', 'Accomplir 250 quêtes.', (x) => s(x).questsDone >= 250);
  a('q500', '✦', 'Quêtes', 'Machine de guerre', 'Accomplir 500 quêtes.', (x) => s(x).questsDone >= 500);
  a('tgt1', '◎', 'Quêtes', 'Objectif atteint', 'Remplir une quête à objectif chiffré.', (x) => s(x).targetsDone >= 1);
  a('tgt10', '◎', 'Quêtes', 'Comptable de l\'effort', 'Remplir 10 quêtes à objectif chiffré.', (x) => s(x).targetsDone >= 10);
  a('ch1', '✧', 'Quêtes', 'Audacieux', 'Relever un défi du jour.', (x) => s(x).challengesDone >= 1);
  a('ch10', '✧', 'Quêtes', 'Chercheur de défis', 'Relever 10 défis du jour.', (x) => s(x).challengesDone >= 10);
  a('ch30', '✧', 'Quêtes', 'Insatiable', 'Relever 30 défis du jour.', (x) => s(x).challengesDone >= 30);
  a('custom', '✎', 'Quêtes', 'Maître de son destin', 'Créer une quête personnalisée.', (x) => s(x).customMade >= 1);

  // Régularité
  a('st3', '🔥', 'Régularité', 'Étincelle', 'Série de 3 jours parfaits.', (x) => s(x).maxStreak >= 3);
  a('st7', '🔥', 'Régularité', 'Semaine parfaite', 'Série de 7 jours parfaits.', (x) => s(x).maxStreak >= 7);
  a('st30', '🔥', 'Régularité', 'Discipline de fer', 'Série de 30 jours parfaits.', (x) => s(x).maxStreak >= 30);
  a('st100', '🔥', 'Régularité', 'Inébranlable', 'Série de 100 jours parfaits.', (x) => s(x).maxStreak >= 100);
  a('nopen30', '🛡', 'Régularité', 'Intouchable', '30 jours sans Zone de pénalité.', (x) => x.daysNoPen >= 30);
  a('pen1', '⚠', 'Régularité', 'Rédemption', 'Accomplir une quête de pénalité.', (x) => s(x).penDone >= 1);

  // Boss
  a('b1', '☠', 'Boss', 'Tueur de gardiens', 'Vaincre ton premier boss ou mini-boss.', (x) => s(x).bossKills >= 1);
  a('bbig', '☠', 'Boss', 'Briseur de boss', 'Vaincre un vrai BOSS (niveau 10, 20, 30…).', (x) => s(x).bigKills >= 1);
  a('b5', '☠', 'Boss', 'Chasseur', 'Vaincre 5 gardiens.', (x) => s(x).bossKills >= 5);
  a('b10', '☠', 'Boss', 'Fléau des donjons', 'Vaincre 10 gardiens.', (x) => s(x).bossKills >= 10);

  // Niveaux et rangs
  a('l50', '▲', 'Niveaux', 'Mi-parcours', 'Une stat au niveau 50.', (x) => x.max >= 50);
  a('l75', '▲', 'Niveaux', 'Expert', 'Une stat au niveau 75.', (x) => x.max >= 75);
  a('l90', '▲', 'Niveaux', 'Sommet', 'Une stat au niveau 90 (rang S).', (x) => x.max >= 90);
  a('all50', '▲', 'Niveaux', 'Équilibre', 'Les trois stats au niveau 50.', (x) => x.min >= 50);
  a('rB', '♛', 'Niveaux', 'Rang B', 'Atteindre le rang global B.', (x) => x.rank >= 3);
  a('rA', '♛', 'Niveaux', 'Rang A', 'Atteindre le rang global A.', (x) => x.rank >= 4);
  a('rS', '♛', 'Niveaux', 'Rang S', 'Atteindre le rang global S.', (x) => x.rank >= 5);
  a('hyb', '✪', 'Niveaux', 'Hybride', 'Débloquer un statut hybride (2 stats au niveau 90).', (x) => x.sCount >= 2);
  a('legend', '✪', 'Niveaux', 'Légende absolue', 'Les trois stats au niveau 90.', (x) => x.sCount >= 3);

  // Système
  a('save', '⛁', 'Système', 'Prévoyant', 'Exporter une sauvegarde.', (x) => s(x).exports >= 1);

  window.ACHIEVEMENTS = A;
})();
