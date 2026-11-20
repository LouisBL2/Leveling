/* =========================================================
   CATALOGUE DES QUÊTES
   d   : domaine
   p   : périodicité  (daily | weekly | monthly)
   r   : difficulté   (E D C B A S)
   lv  : [niveau min, niveau max] conseillé pour la recommandation
   ========================================================= */
(function () {
  const DIFF = {
    E: { xp: 10, label: 'E' }, D: { xp: 20, label: 'D' }, C: { xp: 35, label: 'C' },
    B: { xp: 55, label: 'B' }, A: { xp: 80, label: 'A' }, S: { xp: 120, label: 'S' }
  };
  const PERIOD = {
    daily: { mult: 1, label: 'Quotidienne', short: 'JOUR', cap: 7 },
    weekly: { mult: 3, label: 'Hebdomadaire', short: 'SEMAINE', cap: 4 },
    monthly: { mult: 7, label: 'Mensuelle', short: 'MOIS', cap: 2 }
  };
  const DOMAINS = {
    sport: { label: 'Sport', stat: 'FORCE', icon: '⚔', color: '#4dd0ff',
      titles: ['Sédentaire', 'Éveillé', 'Endurant', 'Triathlète', 'Ironman', 'Élite D1'] },
    finance: { label: 'Finance', stat: 'RICHESSE', icon: '◆', color: '#ffcf5c',
      titles: ['Endetté', 'Survivant', 'Épargnant', 'Investisseur', 'Capitaliste', 'Rentier'] },
    relation: { label: 'Relation', stat: 'CHARISME', icon: '❖', color: '#ff6fb5',
      titles: ['Isolé', 'Solitaire', 'Sociable', 'Connecté', 'Magnétique', 'Pilier'] }
  };

  let i = 0;
  const C = [];
  const q = (d, p, r, lv, t, desc) => C.push({ cid: 'c' + (++i), d, p, r, lv, t, desc: desc || '' });

  /* ---------------- SPORT ---------------- */
  q('sport', 'daily', 'E', [0, 35], 'Marcher 30 minutes', 'Marche active, sans t\'arrêter.');
  q('sport', 'daily', 'E', [0, 45], '8 000 pas minimum');
  q('sport', 'daily', 'E', [0, 30], '20 pompes (en plusieurs séries si besoin)');
  q('sport', 'daily', 'D', [25, 70], '50 pompes + 50 squats');
  q('sport', 'daily', 'E', [0, 100], 'Boire 2 L d\'eau');
  q('sport', 'daily', 'D', [0, 100], 'Dormir 7 h minimum');
  q('sport', 'daily', 'C', [0, 100], 'Aucun aliment ultra-transformé ni sucre ajouté');
  q('sport', 'daily', 'E', [0, 100], '15 min de mobilité / étirements');
  q('sport', 'daily', 'E', [0, 60], 'Gainage 3 × 1 min');
  q('sport', 'daily', 'D', [20, 60], 'Footing 30 min en endurance fondamentale');
  q('sport', 'daily', 'C', [40, 100], 'Réaliser la séance du plan (natation, vélo ou course)');
  q('sport', 'daily', 'B', [65, 100], 'Double séance (ex. natation le matin, vélo le soir)');
  q('sport', 'weekly', 'D', [0, 40], '3 séances de sport de 30 min');
  q('sport', 'weekly', 'C', [20, 65], '2 séances de natation');
  q('sport', 'weekly', 'B', [55, 100], '3 séances de natation (6 km au total)');
  q('sport', 'weekly', 'C', [20, 100], '2 séances de renforcement musculaire');
  q('sport', 'weekly', 'B', [45, 100], 'Sortie vélo longue de 2 h 30 ou plus');
  q('sport', 'weekly', 'B', [45, 100], 'Sortie longue course à pied (1 h 15 ou plus)');
  q('sport', 'weekly', 'C', [35, 100], 'Séance de fractionné / seuil en course');
  q('sport', 'weekly', 'A', [60, 100], 'Enchaînement vélo-course (brick)');
  q('sport', 'weekly', 'E', [0, 100], 'Pesée et mesures de la semaine');
  q('sport', 'weekly', 'S', [78, 100], 'Volume d\'entraînement de 12 h dans la semaine');
  q('sport', 'monthly', 'C', [0, 100], 'Bilan d\'entraînement du mois + plan du mois suivant');
  q('sport', 'monthly', 'B', [0, 45], 'Perdre 1 à 2 kg de masse grasse');
  q('sport', 'monthly', 'B', [25, 100], 'Test chrono 5 km ou test FTP');
  q('sport', 'monthly', 'A', [30, 100], 'Participer à une course officielle');
  q('sport', 'monthly', 'S', [75, 100], 'Sortie vélo de 150 km');

  /* ---------------- FINANCE ---------------- */
  q('finance', 'daily', 'E', [0, 100], 'Noter toutes ses dépenses du jour');
  q('finance', 'daily', 'D', [0, 70], 'Aucune dépense impulsive');
  q('finance', 'daily', 'E', [0, 60], 'Préparer ses repas (pas de livraison)');
  q('finance', 'daily', 'D', [0, 100], 'Lire 10 pages d\'un livre finance / business');
  q('finance', 'daily', 'C', [25, 100], '30 min de formation (investissement, business, compétences)');
  q('finance', 'daily', 'B', [35, 100], '1 h de travail sur un projet de revenu secondaire');
  q('finance', 'weekly', 'D', [0, 100], 'Revue du budget de la semaine');
  q('finance', 'weekly', 'C', [0, 100], 'Virement vers l\'épargne');
  q('finance', 'weekly', 'B', [0, 40], 'Rembourser un montant supplémentaire sur une dette');
  q('finance', 'weekly', 'D', [0, 60], 'Résilier ou renégocier un abonnement / contrat');
  q('finance', 'weekly', 'D', [0, 55], 'Une journée à zéro dépense');
  q('finance', 'weekly', 'C', [30, 100], 'Investir (DCA ETF, PEA, assurance-vie…)');
  q('finance', 'weekly', 'B', [35, 100], 'Une action concrète pour un nouveau revenu (prospection, offre, mise en ligne)');
  q('finance', 'weekly', 'C', [50, 100], 'Analyser une opportunité d\'investissement');
  q('finance', 'monthly', 'C', [0, 100], 'Bilan patrimonial du mois');
  q('finance', 'monthly', 'D', [0, 50], 'Vendre des objets inutiles');
  q('finance', 'monthly', 'B', [0, 50], 'Épargner 10 % des revenus du mois');
  q('finance', 'monthly', 'A', [40, 100], 'Épargner 25 % des revenus du mois');
  q('finance', 'monthly', 'A', [0, 55], 'Ajouter 1 mois de dépenses à l\'épargne de précaution');
  q('finance', 'monthly', 'A', [20, 100], 'Demander une augmentation / augmenter ses tarifs');
  q('finance', 'monthly', 'S', [60, 100], 'Créer une nouvelle source de revenu passif');

  /* ---------------- RELATION ---------------- */
  q('relation', 'daily', 'E', [0, 100], 'Envoyer un message sincère à un proche');
  q('relation', 'daily', 'E', [0, 100], '5 min de gratitude / journal');
  q('relation', 'daily', 'E', [0, 100], '10 min de méditation');
  q('relation', 'daily', 'E', [0, 100], 'Faire un compliment sincère à quelqu\'un');
  q('relation', 'daily', 'D', [0, 60], 'Discuter avec un inconnu (commerçant, voisin, collègue)');
  q('relation', 'daily', 'D', [0, 40], 'Sortir de chez soi et voir du monde');
  q('relation', 'daily', 'C', [40, 100], '30 min de temps de qualité sans écran avec partenaire / famille');
  q('relation', 'weekly', 'D', [0, 100], 'Appeler un membre de sa famille');
  q('relation', 'weekly', 'C', [0, 100], 'Une sortie sociale (amis, soirée, activité)');
  q('relation', 'weekly', 'B', [0, 100], 'Un rendez-vous amoureux (ou une soirée en couple)');
  q('relation', 'weekly', 'C', [0, 100], 'Activité de groupe (club, association, sport collectif)');
  q('relation', 'weekly', 'C', [0, 70], 'Reprendre contact avec un ancien ami');
  q('relation', 'weekly', 'D', [0, 50], 'Engager 5 conversations sur une appli / événement de rencontre');
  q('relation', 'weekly', 'B', [40, 100], 'Organiser un repas ou une soirée chez soi');
  q('relation', 'monthly', 'C', [0, 40], 'Séance avec un psy / coach (si besoin)');
  q('relation', 'monthly', 'B', [0, 70], 'Rejoindre un nouveau cercle (club, cours, association)');
  q('relation', 'monthly', 'B', [0, 100], 'Faire du bénévolat');
  q('relation', 'monthly', 'A', [40, 100], 'Organiser un événement (anniversaire, sortie de groupe, week-end)');
  q('relation', 'monthly', 'A', [50, 100], 'Escapade / week-end avec partenaire ou amis');

  /* ---------------- QUÊTES DE PÉNALITÉ ---------------- */
  const PENALTIES = [
    { t: '100 pompes', desc: 'En autant de séries que nécessaire, avant la fin du délai.' },
    { t: '100 squats + 50 fentes', desc: 'Sans tricher sur l\'amplitude.' },
    { t: '50 burpees', desc: 'Le Système ne pardonne pas.' },
    { t: 'Course de 5 km', desc: 'Peu importe l\'allure, mais sans marcher.' },
    { t: 'Gainage 5 min cumulées', desc: 'Planche, côtés, dos.' },
    { t: 'Douche froide de 3 minutes', desc: 'Forge ta discipline.' },
    { t: '24 h sans écran récréatif', desc: 'Ni réseaux sociaux, ni séries, ni jeux.' },
    { t: '48 h sans aucune dépense non essentielle', desc: 'Seulement le strict nécessaire.' },
    { t: 'Écrire une page de bilan sur l\'échec', desc: 'Pourquoi ? Qu\'est-ce que tu changes demain ?' },
    { t: 'Ranger et nettoyer entièrement ton logement', desc: 'Environnement propre, esprit clair.' },
    { t: '200 sauts à la corde + 50 pompes', desc: 'Pas d\'excuse.' },
    { t: 'Appeler un proche que tu négliges', desc: 'Une vraie conversation, pas un message.' }
  ];

  window.GAME = { DIFF, PERIOD, DOMAINS, CATALOG: C, PENALTIES };
})();
