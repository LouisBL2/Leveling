/* =========================================================
   BOSS — un gardien tous les 5 niveaux de chaque stat
   Niveaux 5, 15, 25… : MINI-BOSS · Niveaux 10, 20, 30… : BOSS
   Tant que le gardien d'un palier n'est pas vaincu, la stat
   ne peut pas dépasser ce niveau (l'XP continue de s'accumuler).
   Chaque boss est une épreuve réelle, validée sur l'honneur.
   ========================================================= */
(function () {
  const B = {
    sport: [
      ['Slime de la Paresse', 'Marcher 1 h d\'affilée sans t\'arrêter.'],
      ['Golem du Canapé', 'Courir 2 km sans t\'arrêter.'],
      ['Méduse des Profondeurs', 'Nager 200 m sans t\'arrêter (n\'importe quelle nage).'],
      ['Loup des Collines', 'Courir 5 km sans t\'arrêter.'],
      ['Sanglier Rouleur', 'Faire une sortie vélo de 40 km.'],
      ['Hydre des Trois Voies', 'Enchaîner 400 m de natation, 10 km de vélo et 2,5 km de course (ou finir un triathlon XS).'],
      ['Spectre du Chrono', 'Courir 5 km en moins de 30 min.'],
      ['Minotaure du Bitume', 'Courir 10 km sans t\'arrêter ET nager 1 000 m en crawl (deux jours différents possibles).'],
      ['Griffon des Cols', 'Faire une sortie vélo de 80 km.'],
      ['Chimère du Sprint', 'Terminer un triathlon S (distance sprint).'],
      ['Lynx du Dix Mille', 'Courir 10 km en moins de 50 min.'],
      ['Titan Olympique', 'Terminer un triathlon M (distance olympique).'],
      ['Kraken du Lac', 'Nager 1 500 m en moins de 30 min.'],
      ['Wyvern du Semi', 'Courir un semi-marathon en moins de 1 h 45.'],
      ['Béhémoth de l\'Asphalte', 'Faire une sortie vélo de 150 km OU atteindre une FTP de 3,5 W/kg.'],
      ['Colosse du Demi-Fer', 'Terminer un triathlon 70.3 (half Ironman).'],
      ['Faucon du Seuil', 'Courir 10 km en moins de 40 min.'],
      ['Dragon de Fer', 'Terminer un Ironman OU monter sur un podium de catégorie d\'âge.'],
      ['Phénix du Record', 'Triathlon M en moins de 2 h 05 OU FTP de 4,5 W/kg.'],
      ['Roi des Trois Éléments', 'Podium sur une course D1 ou podium scratch en triathlon.']
    ],
    finance: [
      ['Gobelin du Découvert', 'Lister toutes tes dettes et toutes tes dépenses du mois.'],
      ['Ogre des Agios', 'Rester positif sur ton compte un mois entier.'],
      ['Rat des Frais Cachés', 'Mettre 500 € de côté sur un livret.'],
      ['Liche du Revolving', 'Rembourser entièrement une dette ou un crédit à la consommation.'],
      ['Mimic des Abonnements', 'Mettre en place un virement automatique vers l\'épargne.'],
      ['Banshee des Fins de Mois', 'Constituer 3 mois de dépenses en épargne de précaution.'],
      ['Gardien du Coffre', 'Ouvrir un PEA ou une assurance-vie et y investir 1 000 €.'],
      ['Serpent de la Dette', 'Atteindre zéro dette à la consommation.'],
      ['Golem de l\'Épargne', 'Tenir un taux d\'épargne de 20 % pendant 3 mois consécutifs.'],
      ['Sphinx du Patrimoine', 'Atteindre 50 000 € de patrimoine net OU 6 mois d\'épargne de précaution.'],
      ['Djinn du Revenu', 'Générer 100 €/mois de revenu secondaire.'],
      ['Dragon des 100 k', 'Atteindre 100 000 € de patrimoine net.'],
      ['Vampire de l\'Inflation', 'Avoir une 2e source de revenus de plus de 300 €/mois.'],
      ['Hydre des Flux', 'Avoir des revenus passifs qui couvrent 10 % de tes dépenses.'],
      ['Basilic de la Pierre', 'Acheter un bien immobilier OU détenir plus de 50 000 € investis.'],
      ['Léviathan des 250 k', 'Atteindre 250 000 € de patrimoine net.'],
      ['Oracle des Dividendes', 'Avoir des revenus passifs qui couvrent 25 % de tes dépenses.'],
      ['Wyrm d\'Or', 'Atteindre 500 000 € de patrimoine net et 3 sources de revenus.'],
      ['Chimère de la Rente', 'Avoir des revenus passifs qui couvrent 75 % de tes dépenses.'],
      ['Empereur de l\'Abondance', 'Atteindre 1 M€ de patrimoine et des revenus passifs supérieurs à tes dépenses.']
    ],
    relation: [
      ['Ombre de l\'Isolement', 'Sortir de chez toi et voir du monde 3 jours d\'affilée.'],
      ['Spectre du Silence', 'Appeler 3 personnes de ton entourage dans la même semaine.'],
      ['Gargouille Timide', 'Tenir une conversation de 5 min avec un inconnu.'],
      ['Brume de la Solitude', 'Aller seul à un événement ou une activité de groupe.'],
      ['Écho du Passé', 'Organiser un café ou un verre avec un ami.'],
      ['Sirène du Rejet', 'Avoir un rendez-vous amoureux (ou une soirée spéciale en couple).'],
      ['Golem de la Routine', 'Rejoindre un club ou une association et y aller 3 fois.'],
      ['Harpie du Doute', 'Organiser une soirée avec au moins 4 personnes.'],
      ['Masque de la Façade', 'Avoir une conversation sincère et profonde avec un proche.'],
      ['Wraith de l\'Ennui', 'Faire 4 sorties sociales dans le mois.'],
      ['Gardien des Rancunes', 'Renouer ou réparer une relation importante.'],
      ['Chimère de la Distance', 'Passer un week-end avec des amis ou ton/ta partenaire.'],
      ['Djinn de la Méfiance', 'Te faire 2 nouveaux amis que tu vois régulièrement.'],
      ['Titan de l\'Ego', 'Organiser un événement de 10 personnes ou plus.'],
      ['Basilic de la Jalousie', 'Un mois avec une sortie sociale par semaine + un rendez-vous ou une soirée en couple.'],
      ['Wyvern de l\'Habitude', 'Partir en voyage avec ton/ta partenaire ou des amis.'],
      ['Dragon de l\'Indifférence', 'Organiser 3 événements dans le même mois.'],
      ['Liche du Cœur Froid', 'Une relation amoureuse épanouie depuis 6 mois (ou une vie amoureuse riche) + 5 amis proches.'],
      ['Hydre des Malentendus', 'Accompagner ou mentorer quelqu\'un régulièrement pendant un mois.'],
      ['Souverain du Vide', 'Organiser un grand événement qui réunit ta famille et tes amis.']
    ]
  };
  const BOSSES = {};
  Object.keys(B).forEach((d) => {
    BOSSES[d] = B[d].map(([name, task], i) => {
      const lvl = (i + 1) * 5;
      return { d, lvl, name, task, big: lvl % 10 === 0 };
    });
  });
  window.BOSSES = BOSSES;
})();
