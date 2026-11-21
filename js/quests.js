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
  // tgt : objectif chiffré optionnel { n: valeur cible, unit: unité, step: pas de saisie }
  const q = (d, p, r, lv, t, desc, tgt) => C.push({ cid: 'c' + (++i), d, p, r, lv, t, desc: desc || '', tgt: tgt || null });

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

  /* ---------------- QUÊTES À OBJECTIF CHIFFRÉ ---------------- */
  q('sport', 'daily', 'D', [0, 60], '100 pompes dans la journée', 'En autant de séries que tu veux.', { n: 100, unit: 'pompes', step: 10 });
  q('sport', 'weekly', 'C', [0, 50], 'Courir 10 km dans la semaine', '', { n: 10, unit: 'km', step: 1 });
  q('sport', 'weekly', 'B', [45, 100], 'Courir 25 km dans la semaine', '', { n: 25, unit: 'km', step: 1 });
  q('sport', 'weekly', 'B', [40, 100], 'Nager 4 km dans la semaine', '', { n: 4, unit: 'km', step: 0.5 });
  q('sport', 'weekly', 'A', [60, 100], 'Rouler 150 km dans la semaine', '', { n: 150, unit: 'km', step: 10 });
  q('finance', 'weekly', 'D', [0, 100], 'Lire 70 pages finance / business', '', { n: 70, unit: 'pages', step: 10 });
  q('finance', 'monthly', 'B', [0, 100], 'Épargner 300 € ce mois', '', { n: 300, unit: '€', step: 50 });
  q('relation', 'weekly', 'C', [0, 100], 'Contacter 5 personnes de ton entourage', 'Appel, message sincère ou rencontre.', { n: 5, unit: 'personnes', step: 1 });
  q('relation', 'monthly', 'B', [0, 100], 'Faire 4 sorties sociales ce mois', '', { n: 4, unit: 'sorties', step: 1 });

  /* ---------------- QUÊTES DE PÉNALITÉ ---------------- */
  // Pénalités adaptées au rang global : chaque intitulé dépend de k = 0 (rang E) … 5 (rang S).
  const V = (arr) => (k) => arr[Math.max(0, Math.min(5, k))];
  const PENALTIES = [
    { t: (k) => `Réveil à 5 h et séance de sport à jeun ${V(['demain', 'demain', 'pendant 2 jours', 'pendant 2 jours', 'pendant 3 jours', 'pendant 3 jours'])(k)}`, desc: 'Pas de snooze. Le Système voit tout.' },
    { t: (k) => `Chaise contre le mur : ${V([3, 4, 6, 8, 12, 15])(k)} min cumulées`, desc: 'Cuisses à l\'horizontale, dos collé au mur.' },
    { t: (k) => `Monter et descendre ${V([10, 15, 20, 30, 45, 60])(k)} étages à pied`, desc: 'En une seule session.' },
    { t: (k) => { const km = V([0.5, 0.5, 1, 1, 1.5, 2])(k), b = V([25, 35, 50, 50, 75, 100])(k); const kms = String(km).replace('.', ','); return `Circuit punitif : ${kms} km de course, ${b} burpees, ${kms} km de course`; }, desc: 'Chronométré, sans pause entre les blocs.' },
    { t: (k) => { const n = V([1, 2, 2, 3, 4, 5])(k); return `Rejet volontaire : ${n} demande${n > 1 ? 's' : ''} qui ${n > 1 ? 'risquent' : 'risque'} un refus`; }, desc: 'Demander une réduction, un service inhabituel, un numéro… Le but : affronter le « non ».' },
    { t: (k) => `Mode moine pendant ${V([24, 24, 36, 48, 60, 72])(k)} h`, desc: 'Téléphone en noir et blanc, réseaux sociaux et apps de loisir supprimés.' },
    { t: (k) => `Zéro plaisir pendant ${V([2, 2, 3, 4, 5, 7])(k)} jours`, desc: 'Ni sucre, ni alcool, ni série, ni jeu vidéo, ni livraison.' },
    { t: (k) => `Douche froide de ${V([1, 1, 2, 3, 4, 5])(k)} min`, desc: 'Forge ta discipline.' },
    { t: (k) => `Douche froide chaque jour pendant ${V([3, 3, 4, 5, 6, 7])(k)} jours`, desc: 'Au moins 1 min d\'eau froide, tous les jours, sans exception.' },
    { t: () => 'Mettre 50 € de côté sur ton épargne', desc: 'Virement immédiat vers un livret ou un compte d\'épargne. L\'échec a un prix.' },

    // --- Relation ---
    { t: (k) => { const n = V([1, 1, 2, 2, 3, 3])(k); return `Appeler ${n} personne${n > 1 ? 's' : ''} avec qui tu as perdu contact`; }, desc: 'Un vrai appel vocal, pas un message.' },
    { t: (k) => { const n = V([1, 2, 2, 3, 4, 5])(k); return `Faire un compliment sincère en face à ${n} inconnu${n > 1 ? 's' : ''}`; }, desc: 'Sans rien attendre en retour.' },
    { t: (k) => `Inviter quelqu'un dans les 48 h : ${V(['1 invitation', '1 invitation', '1 invitation', '1 invitation et rendez-vous fixé', '1 invitation et rendez-vous fixé', '2 invitations'])(k)}`, desc: 'Café, sortie ou rendez-vous amoureux.' },
    { t: (k) => { const h = V([2, 2, 3, 4, 5, 0])(k); return `Soirée sans téléphone avec ton entourage ${h ? `pendant ${h} h` : 'toute la soirée'}`; }, desc: 'Téléphone dans une autre pièce.' },
    { t: (k) => { const n = V([1, 1, 1, 1, 2, 2])(k); return `T'inscrire à une activité de groupe et y aller ${n > 1 ? `${n} fois` : 'une fois'} cette semaine`; }, desc: 'Club, cours, association, sport collectif.' },
    { min: 1, t: () => 'Conversation difficile : aborder le sujet que tu repousses avec quelqu\'un', desc: 'Calmement, mais sans l\'éviter une fois de plus.' },

    // --- Finance ---
    { t: (k) => `Gel des dépenses pendant ${V([3, 3, 4, 5, 6, 7])(k)} jours`, desc: 'Uniquement loyer, factures et courses de base.' },
    { t: (k) => { const n = V([1, 1, 2, 2, 3, 3])(k); return `Vendre ${n} objet${n > 1 ? 's' : ''} inutilisé${n > 1 ? 's' : ''} et verser la somme en épargne`; }, desc: 'Mise en vente dans les 24 h.' },
    { t: (k) => { const n = V([1, 1, 1, 1, 2, 2])(k); return `Résilier ou renégocier ${n > 1 ? `${n} abonnements ou contrats` : 'un abonnement ou un contrat'}`; }, desc: 'Box, assurance, téléphone, streaming…' },
    { t: (k) => { const n = V([1, 1, 2, 2, 3, 3])(k); return `Audit de tes relevés bancaires sur ${n} mois, ligne par ligne`; }, desc: 'Avec une liste écrite des économies possibles.' },
    { t: (k) => { const [d, e] = V([[2, 40], [3, 50], [3, 50], [4, 60], [5, 70], [7, 80]])(k); return `Pas de carte bancaire pendant ${d} jours : ${e} € en liquide maximum`; }, desc: 'Retire la somme à l\'avance. Quand c\'est fini, c\'est fini.' },
    { t: (k) => `Faire un don de ${V([10, 15, 20, 25, 35, 50])(k)} € à une association`, desc: 'Restos du Cœur, Croix-Rouge… L\'échec profite au moins à quelqu\'un.' },
    { t: (k) => `${V([1, 1, 2, 2, 3, 3])(k)} h de travail sur un revenu secondaire, sans distraction`, desc: 'Téléphone éteint, minuteur lancé.' }
  ];



  window.GAME = { DIFF, PERIOD, DOMAINS, CATALOG: C, PENALTIES };
})();
