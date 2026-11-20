/* =========================================================
   QUESTIONNAIRE D'ÉVEIL — 107 questions
   Chaque option a un score de 0 à 100. Le score d'un domaine
   est la moyenne pondérée (poids w) des réponses.
   Aucune réponse n'est envoyée nulle part : tout reste
   dans le localStorage du navigateur.
   ========================================================= */
(function () {
  const Q = [];
  let n = 0;
  const add = (d, w, q, o, hint) => Q.push({ id: d[0] + (++n), d, w, q, o, hint: hint || '' });

  /* ---------------------------------------------------------
     SPORT — 0 : obésité + gros problèmes de santé
             100 : triathlète D1 podium, physique sec et volumineux
     --------------------------------------------------------- */
  const S = 'sport';
  add(S, 2, 'Quelle est ta corpulence actuelle (IMC) ?', [
    ['Obésité sévère (IMC > 35)', 0], ['Obésité (IMC 30–35)', 10], ['Surpoids marqué (IMC 27–30)', 28],
    ['Léger surpoids (IMC 25–27)', 45], ['Maigreur (IMC < 18,5)', 40], ['Poids normal (IMC 18,5–25)', 70],
    ['Athlétique : IMC normal/élevé dû au muscle, peu de gras', 100]], 'IMC = poids (kg) / taille² (m)');
  add(S, 2, 'Ton taux de masse grasse estimé ?', [
    ['> 35 % (homme) / > 42 % (femme)', 0], ['28–35 % / 35–42 %', 15], ['22–28 % / 29–35 %', 35],
    ['17–22 % / 24–29 %', 55], ['12–17 % / 19–24 %', 75], ['8–12 % / 15–19 %', 92], ['< 8 % / < 15 % (très sec)', 100]]);
  add(S, 2, 'Ta masse musculaire / ton volume ?', [
    ['Très faible, aucune force', 0], ['Faible', 22], ['Moyenne', 45], ['Muscles visibles', 65],
    ['Physique athlétique développé', 85], ['Volumineux ET sec', 100]]);
  add(S, 3, 'Problèmes de santé chroniques (diabète, hypertension, apnée du sommeil, cholestérol…) ?', [
    ['Plusieurs problèmes graves', 0], ['Un problème sérieux', 25], ['Problèmes mineurs, suivis', 60], ['Aucun', 100]]);
  add(S, 1.5, 'Ta fréquence cardiaque au repos ?', [
    ['> 85 bpm', 0], ['75–85 bpm', 25], ['65–75 bpm', 48], ['55–65 bpm', 68], ['45–55 bpm', 88], ['< 45 bpm', 100], ['Je ne sais pas', 35]]);
  add(S, 1.5, 'Monter 4 étages à pied, ça donne quoi ?', [
    ['Impossible ou très pénible', 0], ['Très essoufflé', 25], ['Légèrement essoufflé', 60], ['Aucun effort, je peux les courir', 100]]);
  add(S, 2, 'Combien de séances de sport par semaine ?', [
    ['0', 0], ['1–2', 28], ['3–4', 52], ['5–7', 72], ['8–10', 88], ['11+ (biquotidien)', 100]]);
  add(S, 2, 'Volume d\'entraînement hebdomadaire moyen ?', [
    ['0 h', 0], ['< 2 h', 18], ['2–5 h', 42], ['5–8 h', 62], ['8–12 h', 78], ['12–18 h', 92], ['> 18 h', 100]]);
  add(S, 1, 'Depuis combien de temps pratiques-tu un sport d\'endurance ?', [
    ['Jamais', 0], ['< 1 an', 20], ['1–3 ans', 45], ['3–5 ans', 65], ['5–10 ans', 85], ['> 10 ans', 100]]);
  add(S, 2, 'Ton record sur 5 km course à pied ?', [
    ['Incapable de courir 5 km', 0], ['> 35 min', 20], ['30–35 min', 35], ['25–30 min', 52], ['22–25 min', 68],
    ['19–22 min', 82], ['17–19 min', 93], ['< 17 min', 100]]);
  add(S, 3, 'Ton record sur 10 km ?', [
    ['Jamais couru 10 km', 0], ['> 70 min', 15], ['60–70 min', 30], ['50–60 min', 48], ['45–50 min', 62],
    ['40–45 min', 75], ['36–40 min', 86], ['33–36 min', 95], ['< 33 min', 100]]);
  add(S, 1.5, 'Ton record sur semi-marathon ?', [
    ['Jamais fait', 10], ['> 2 h 15', 25], ['2 h – 2 h 15', 40], ['1 h 45 – 2 h', 55], ['1 h 30 – 1 h 45', 70],
    ['1 h 20 – 1 h 30', 84], ['1 h 12 – 1 h 20', 93], ['< 1 h 12', 100]]);
  add(S, 1, 'Ton record sur marathon ?', [
    ['Jamais fait', 15], ['> 4 h 30', 35], ['4 h – 4 h 30', 50], ['3 h 30 – 4 h', 65], ['3 h – 3 h 30', 80], ['2 h 45 – 3 h', 91], ['< 2 h 45', 100]]);
  add(S, 1, 'La plus longue distance courue sans t\'arrêter ?', [
    ['< 1 km', 0], ['1–5 km', 22], ['5–10 km', 42], ['10–21 km', 62], ['21–42 km', 84], ['Ultra (> 42 km)', 100]]);
  add(S, 2, 'Ton niveau en natation ?', [
    ['Je ne sais pas nager', 0], ['Brasse, quelques longueurs', 18], ['Crawl 100 m en continu', 40],
    ['Crawl 1 000 m en continu', 62], ['Crawl 2 000 m+ facilement', 80], ['Nageur club, 4 km+ par séance', 100]]);
  add(S, 2, 'Ton temps sur 100 m crawl ?', [
    ['Impossible en crawl', 0], ['> 2 min 30', 18], ['2 min – 2 min 30', 38], ['1 min 45 – 2 min', 54], ['1 min 30 – 1 min 45', 70],
    ['1 min 20 – 1 min 30', 84], ['1 min 10 – 1 min 20', 94], ['< 1 min 10', 100]]);
  add(S, 2, 'Ton temps sur 1 500 m natation ?', [
    ['Impossible', 0], ['> 40 min', 25], ['32–40 min', 45], ['27–32 min', 62], ['24–27 min', 77], ['21–24 min', 90], ['< 21 min', 100]]);
  add(S, 1, 'Ton aisance en eau libre (lac, mer) ?', [
    ['Jamais nagé en eau libre', 8], ['Mal à l\'aise / panique', 22], ['Quelques fois, ça va', 50],
    ['À l\'aise avec combinaison', 75], ['À l\'aise même en départ groupé / bagarre', 100]]);
  add(S, 1, 'Ta technique de nage ?', [
    ['Aucune', 0], ['Autodidacte', 30], ['Quelques cours', 55], ['Entraînement en club régulier', 80], ['Ancien nageur de compétition', 100]]);
  add(S, 3, 'Ta FTP vélo (puissance seuil) rapportée au poids ?', [
    ['Je ne sais pas / pas de vélo', 10], ['< 2 W/kg', 18], ['2–2,5 W/kg', 33], ['2,5–3 W/kg', 48], ['3–3,5 W/kg', 63],
    ['3,5–4 W/kg', 76], ['4–4,5 W/kg', 88], ['4,5–5 W/kg', 95], ['> 5 W/kg', 100]], 'FTP ≈ puissance tenable 1 h. Exemple : 280 W pour 70 kg = 4 W/kg');
  add(S, 1.5, 'Ta plus longue sortie vélo ?', [
    ['Jamais fait de vélo sportif', 0], ['< 20 km', 15], ['20–50 km', 32], ['50–100 km', 52], ['100–150 km', 72], ['150–200 km', 88], ['> 200 km', 100]]);
  add(S, 1.5, 'Ta vitesse moyenne seul sur 40 km plat ?', [
    ['Pas de vélo', 0], ['< 20 km/h', 15], ['20–25 km/h', 32], ['25–30 km/h', 52], ['30–35 km/h', 72], ['35–40 km/h', 90], ['> 40 km/h', 100]]);
  add(S, 0.5, 'Ton matériel vélo ?', [
    ['Aucun vélo', 0], ['VTT / vélo de ville', 20], ['Vélo de route', 50], ['Route + capteur de puissance / home trainer', 72],
    ['Vélo de CLM/triathlon + capteur + home trainer', 100]]);
  add(S, 3, 'Le plus grand triathlon que tu as terminé ?', [
    ['Aucun', 0], ['XS / découverte', 30], ['S / sprint', 45], ['M / olympique', 60], ['L / 70.3', 78], ['Ironman (XXL)', 90], ['Plusieurs Ironman', 100]]);
  add(S, 3, 'Ton classement habituel en course ?', [
    ['Je ne fais pas de course', 0], ['Dans les derniers 25 %', 30], ['Milieu de peloton', 50], ['Top 25 %', 64], ['Top 10 %', 77],
    ['Podium catégorie d\'âge', 87], ['Podium scratch / qualif championnats du monde', 96], ['Élite, podium D1', 100]]);
  add(S, 2, 'Ton niveau de compétition ?', [
    ['Aucune compétition', 0], ['Courses populaires', 30], ['Licencié en club, loisir', 48], ['Compétitions régionales', 64],
    ['Championnats de France / D3', 80], ['D2', 90], ['D1', 100]]);
  add(S, 2, 'Ton temps sur triathlon M (olympique : 1,5 km / 40 km / 10 km) ?', [
    ['Jamais fait', 10], ['> 3 h', 30], ['2 h 45 – 3 h', 44], ['2 h 30 – 2 h 45', 58], ['2 h 15 – 2 h 30', 72],
    ['2 h 05 – 2 h 15', 84], ['1 h 55 – 2 h 05', 93], ['< 1 h 55', 100]]);
  add(S, 0.5, 'Maîtrise des transitions et enchaînements vélo-course ?', [
    ['Jamais enchaîné', 0], ['Quelques fois', 40], ['Enchaînements réguliers à l\'entraînement', 75], ['Transitions rapides maîtrisées', 100]]);
  add(S, 1.5, 'Ta VO2max estimée (montre / test) ?', [
    ['Je ne sais pas', 35], ['< 35', 10], ['35–42', 33], ['42–50', 54], ['50–57', 72], ['57–65', 88], ['> 65', 100]]);
  add(S, 1, 'Nombre maximum de pompes d\'affilée ?', [
    ['0', 0], ['1–10', 20], ['10–20', 40], ['20–35', 60], ['35–50', 80], ['50+', 100]]);
  add(S, 1, 'Nombre maximum de tractions d\'affilée ?', [
    ['0', 8], ['1–5', 32], ['5–10', 54], ['10–15', 74], ['15–20', 90], ['20+', 100]]);
  add(S, 1, 'Renforcement musculaire par semaine ?', [
    ['Jamais', 0], ['Occasionnel', 30], ['1 fois', 55], ['2 fois', 80], ['3 fois ou plus', 100]]);
  add(S, 1.5, 'Ton sommeil moyen ?', [
    ['< 5 h', 0], ['5–6 h', 28], ['6–7 h', 52], ['7–8 h', 82], ['8 h+ de qualité, horaires réguliers', 100]]);
  add(S, 2, 'Ton alimentation ?', [
    ['Fast-food / grignotage quotidien', 0], ['Déséquilibrée', 25], ['Correcte', 50], ['Saine et équilibrée', 75],
    ['Optimisée pour la performance (macros, timing, hydratation)', 100]]);
  add(S, 1.5, 'Alcool et tabac ?', [
    ['Fumeur + alcool régulier', 0], ['Fumeur', 18], ['Alcool fréquent', 35], ['Occasionnel', 70], ['Ni l\'un ni l\'autre', 100]]);
  add(S, 1, 'Les blessures ?', [
    ['Blessé actuellement / douleurs chroniques', 10], ['Blessures fréquentes', 35], ['Occasionnelles', 70], ['Rarement ou jamais', 100]]);
  add(S, 0.5, 'Ta mobilité / souplesse ?', [
    ['Très raide', 10], ['Raide', 35], ['Moyenne', 60], ['Bonne', 85], ['Excellente', 100]]);
  add(S, 1, 'Comment est structuré ton entraînement ?', [
    ['Aucun entraînement', 0], ['Au feeling', 25], ['Suivi sur une appli (Strava…)', 50], ['Plan structuré', 75],
    ['Coach + zones + périodisation', 100]]);

  /* ---------------------------------------------------------
     FINANCE — 0 : très endetté, dans le rouge
               100 : rentier, plusieurs revenus, patrimoine 1 M€
     --------------------------------------------------------- */
  const F = 'finance';
  add(F, 3, 'Comment se passent tes fins de mois ?', [
    ['Découvert permanent', 0], ['Souvent dans le rouge', 15], ['Juste à l\'équilibre', 35], ['Il reste un peu', 55],
    ['J\'épargne confortablement', 80], ['Aucune contrainte, revenus largement supérieurs aux dépenses', 100]]);
  add(F, 3, 'Tes dettes à la consommation (crédits conso, revolving, découvert, dettes perso) ?', [
    ['Surendettement', 0], ['Très lourdes', 12], ['Importantes', 28], ['Modérées', 50], ['Faibles', 75], ['Aucune', 100]]);
  add(F, 1.5, 'Ton taux d\'endettement (mensualités / revenus) ?', [
    ['> 50 %', 0], ['35–50 %', 20], ['25–35 %', 50], ['10–25 %', 75], ['< 10 % ou crédits uniquement autofinancés', 100]]);
  add(F, 1, 'Incidents bancaires ?', [
    ['Fiché à la Banque de France', 0], ['Incidents récents', 20], ['Incidents anciens', 60], ['Jamais', 100]]);
  add(F, 3, 'Ton épargne de précaution couvre combien de mois de dépenses ?', [
    ['Aucune', 0], ['< 1 mois', 15], ['1–3 mois', 40], ['3–6 mois', 65], ['6–12 mois', 85], ['> 12 mois', 100]]);
  add(F, 2, 'Ton taux d\'épargne mensuel ?', [
    ['0 % ou négatif', 0], ['< 5 %', 20], ['5–10 %', 38], ['10–20 %', 58], ['20–35 %', 78], ['> 35 %', 100]]);
  add(F, 3, 'Ton patrimoine net (actifs – dettes) ?', [
    ['Négatif', 0], ['0 – 5 k€', 10], ['5 – 20 k€', 24], ['20 – 50 k€', 36], ['50 – 100 k€', 48], ['100 – 250 k€', 62],
    ['250 – 500 k€', 77], ['500 k€ – 1 M€', 90], ['> 1 M€', 100]]);
  add(F, 1.5, 'Ton revenu net mensuel (toutes sources) ?', [
    ['< 1 000 €', 8], ['1 000 – 1 500 €', 22], ['1 500 – 2 000 €', 36], ['2 000 – 3 000 €', 52], ['3 000 – 4 500 €', 68],
    ['4 500 – 7 000 €', 84], ['> 7 000 €', 100]]);
  add(F, 2.5, 'Combien de sources de revenus distinctes ?', [
    ['Aucune stable', 0], ['1', 28], ['2', 52], ['3', 72], ['4', 88], ['5+', 100]]);
  add(F, 3, 'Tes revenus passifs couvrent quelle part de tes dépenses ?', [
    ['0 %', 0], ['< 10 %', 22], ['10–25 %', 42], ['25–50 %', 62], ['50–100 %', 84], ['> 100 % (rentier)', 100]]);
  add(F, 3, 'Combien de temps pourrais-tu vivre sans emploi, à train de vie égal ?', [
    ['< 1 mois', 0], ['1–3 mois', 22], ['3–6 mois', 42], ['6–12 mois', 62], ['1–3 ans', 82], ['Indéfiniment', 100]]);
  add(F, 1.5, 'Tes investissements en bourse ?', [
    ['Aucun', 0], ['Uniquement des livrets', 15], ['Quelques actions au hasard', 38], ['ETF en investissement régulier (DCA)', 70],
    ['Portefeuille diversifié conséquent', 100]]);
  add(F, 2, 'Ta situation immobilière ?', [
    ['Locataire, aucun projet', 5], ['J\'épargne pour un apport', 25], ['Résidence principale avec crédit', 48],
    ['Résidence principale payée', 68], ['1 bien locatif', 78], ['Plusieurs biens locatifs', 100]]);
  add(F, 1, 'Enveloppes fiscales (PEA, assurance-vie, PER…) ?', [
    ['Aucune', 0], ['Une ouverte, peu alimentée', 30], ['Deux alimentées régulièrement', 62], ['Toutes optimisées', 100]]);
  add(F, 1.5, 'Le suivi de ton budget ?', [
    ['Aucune idée de mes dépenses', 0], ['Vague idée', 25], ['Appli de temps en temps', 50], ['Budget mensuel suivi', 75],
    ['Budget + patrimoine suivis précisément', 100]]);
  add(F, 1, 'Tes connaissances financières ?', [
    ['Aucune', 0], ['Notions de base', 30], ['Intermédiaire', 55], ['Avancées', 80], ['Expert', 100]]);
  add(F, 1.5, 'Les achats impulsifs ?', [
    ['Très fréquents, je regrette souvent', 0], ['Fréquents', 25], ['Parfois', 55], ['Rares', 80], ['Jamais', 100]]);
  add(F, 1.5, 'Ta stabilité professionnelle ?', [
    ['Sans emploi / très précaire', 8], ['CDD / intérim', 30], ['CDI', 58], ['CDI + compétences très recherchées', 78],
    ['Entrepreneur rentable / libre financièrement', 100]]);
  add(F, 1, 'L\'évolution de tes revenus sur 3 ans ?', [
    ['En baisse', 10], ['Stagnation', 35], ['Suit l\'inflation', 55], ['+20 %', 80], ['+50 % ou plus', 100]]);
  add(F, 2, 'Activité secondaire / side business ?', [
    ['Aucune', 0], ['Juste une idée', 15], ['Démarrée, < 100 €/mois', 38], ['100 – 500 €/mois', 58], ['500 – 2 000 €/mois', 80], ['> 2 000 €/mois', 100]]);
  add(F, 1, 'La préparation de ta retraite / indépendance ?', [
    ['Aucune', 0], ['J\'y pense', 25], ['Épargne dédiée (PER…)', 60], ['Plan clair d\'indépendance financière (FIRE)', 100]]);
  add(F, 0.5, 'Tes assurances et protections ?', [
    ['Aucune', 10], ['Minimales', 40], ['Adaptées', 75], ['Complètes + prévoyance', 100]]);
  add(F, 2, 'Ton stress lié à l\'argent ?', [
    ['Angoisse permanente', 0], ['Fréquent', 25], ['Occasionnel', 55], ['Rare', 80], ['Aucun', 100]]);
  add(F, 1, 'Tes objectifs financiers ?', [
    ['Aucun', 0], ['Vagues', 30], ['Chiffrés', 65], ['Plan détaillé et suivi', 100]]);
  add(F, 1.5, 'Tes dépenses fixes représentent quelle part de tes revenus ?', [
    ['> 90 %', 0], ['70–90 %', 25], ['50–70 %', 55], ['30–50 %', 80], ['< 30 %', 100]]);
  add(F, 2, 'Dividendes, intérêts et loyers perçus par an ?', [
    ['0 €', 0], ['< 500 €', 22], ['500 – 2 000 €', 42], ['2 000 – 6 000 €', 62], ['6 000 – 20 000 €', 82], ['> 20 000 €', 100]]);
  add(F, 1, 'Diversification de ton patrimoine (cash, actions, immo, entreprise, or, crypto…) ?', [
    ['0–1 classe d\'actif', 10], ['2 classes', 35], ['3 classes', 60], ['4 classes', 80], ['5 ou plus', 100]]);
  add(F, 0.5, 'Négocies-tu (salaire, prix, contrats) ?', [
    ['Jamais', 10], ['Rarement', 35], ['Parfois', 60], ['Systématiquement', 100]]);
  add(F, 0.5, 'Tes abonnements ?', [
    ['Beaucoup que je n\'utilise pas', 10], ['Quelques inutiles', 50], ['Audités régulièrement', 100]]);
  add(F, 2, 'Un imprévu de 1 000 € tombe demain ?', [
    ['Impossible à payer', 0], ['Crédit ou aide nécessaire', 15], ['Difficile', 40], ['Facile', 75], ['Insignifiant', 100]]);
  add(F, 2, 'Un imprévu de 10 000 € tombe demain ?', [
    ['Impossible', 0], ['Crédit obligatoire', 18], ['En vidant mon épargne', 42], ['Facilement', 80], ['Insignifiant', 100]]);
  add(F, 0.5, 'Investis-tu en toi (formations, livres) pour augmenter tes revenus ?', [
    ['Jamais', 10], ['Rarement', 35], ['Parfois', 65], ['Constamment', 100]]);
  add(F, 1, 'L\'argent et ton entourage ?', [
    ['J\'emprunte souvent à mes proches', 0], ['Parfois', 30], ['Jamais', 70], ['Je peux aider les autres facilement', 100]]);
  add(F, 1.5, 'Possèdes-tu une entreprise ou des parts qui génèrent des revenus ?', [
    ['Non', 0], ['En création', 25], ['Petite activité', 50], ['Entreprise rentable', 80], ['Plusieurs entreprises / participations', 100]]);

  /* ---------------------------------------------------------
     RELATION — 0 : déprime chronique, solitude, célibat subi
                100 : succès amoureux / couple marié stable,
                      famille, amis proches, vie sociale riche
     --------------------------------------------------------- */
  const R = 'relation';
  add(R, 3, 'Ton humeur générale ces deux dernières semaines ?', [
    ['Très déprimé, presque tous les jours', 0], ['Souvent triste', 20], ['Mitigée', 45], ['Plutôt bonne', 70], ['Excellente', 100]]);
  add(R, 2, 'Côté santé mentale ?', [
    ['Dépression sévère non suivie', 0], ['Dépression / anxiété en cours, suivie', 25], ['Épisodes difficiles passés', 58], ['Rien à signaler', 100]],
    'Si tu traverses une période très sombre, parle-en à un professionnel ou appelle le 3114 (France, 24 h/24).');
  add(R, 3, 'Le sentiment de solitude ?', [
    ['Écrasant, permanent', 0], ['Fréquent', 20], ['Parfois', 50], ['Rare', 80], ['Jamais', 100]]);
  add(R, 3, 'Ta situation amoureuse ?', [
    ['Célibat subi depuis plus de 3 ans', 0], ['Célibat subi depuis 1 à 3 ans', 15], ['Célibataire récent', 35],
    ['Relation compliquée / instable', 30], ['Célibataire épanoui avec des rencontres', 62], ['En couple récent', 66],
    ['Couple stable', 82], ['Célibataire avec beaucoup de succès', 95], ['Marié(e) / pacsé(e) épanoui(e)', 100]]);
  add(R, 2, 'Ta satisfaction de ta vie sentimentale ?', [
    ['Très insatisfait', 0], ['Insatisfait', 25], ['Neutre', 50], ['Satisfait', 75], ['Comblé', 100]]);
  add(R, 2, 'Ta vie sexuelle ?', [
    ['Inexistante depuis longtemps et subie', 0], ['Rare', 25], ['Occasionnelle', 50], ['Régulière et satisfaisante', 80], ['Épanouissante', 100]]);
  add(R, 2, 'Ton succès en séduction (ou l\'attirance dans ton couple) ?', [
    ['Aucun intérêt reçu', 0], ['Rare', 25], ['Parfois', 50], ['Régulier', 75], ['Très fréquent', 100]]);
  add(R, 1.5, 'Tes perspectives d\'évolution amoureuse ?', [
    ['Aucune', 0], ['Faibles', 25], ['Possibles', 55], ['Bonnes', 80], ['Déjà comblé', 100]]);
  add(R, 3, 'Combien d\'amis proches à qui te confier vraiment ?', [
    ['0', 0], ['1', 30], ['2–3', 60], ['4–5', 85], ['6+', 100]]);
  add(R, 1.5, 'Ton cercle social élargi (connaissances que tu vois) ?', [
    ['Personne', 0], ['< 5', 25], ['5–15', 50], ['15–40', 75], ['40+', 100]]);
  add(R, 2, 'Sorties sociales par mois (amis, soirées, activités) ?', [
    ['0', 0], ['1', 20], ['2–4', 45], ['5–8', 75], ['9+', 100]]);
  add(R, 1.5, 'Fréquence de contact avec tes amis ?', [
    ['Jamais', 0], ['Quelques fois par an', 15], ['Une fois par mois', 35], ['Chaque semaine', 65], ['Quasi quotidien', 100]]);
  add(R, 1.5, 'Ta relation avec ta famille ?', [
    ['Rupture / conflit', 10], ['Distante', 35], ['Correcte', 60], ['Bonne', 80], ['Très proche', 100]]);
  add(R, 1.5, 'As-tu construit le foyer / la famille que tu souhaites ?', [
    ['J\'en suis très loin', 0], ['En partie', 40], ['En bonne voie', 70], ['Totalement', 100]]);
  add(R, 2, 'En cas de coup dur, sur qui peux-tu compter ?', [
    ['Personne', 0], ['Une personne, peut-être', 30], ['Quelques personnes', 65], ['Beaucoup de monde', 100]]);
  add(R, 1.5, 'Ta confiance en toi en société ?', [
    ['Très anxieux, j\'évite', 0], ['Mal à l\'aise', 25], ['Moyenne', 50], ['À l\'aise', 75], ['Charismatique', 100]]);
  add(R, 1, 'Aborder un inconnu (soirée, rue, travail) ?', [
    ['Impossible', 0], ['Très difficile', 25], ['Possible', 50], ['Facile', 75], ['Naturel', 100]]);
  add(R, 1, 'Exprimer tes émotions à tes proches ?', [
    ['Impossible', 0], ['Difficile', 30], ['Ça dépend', 55], ['Facile', 80], ['Naturel et sain', 100]]);
  add(R, 1, 'La gestion des conflits ?', [
    ['Fuite ou explosion', 0], ['Difficile', 30], ['Correcte', 60], ['Sereine et constructive', 100]]);
  add(R, 2, 'Combien de jours par semaine sans parler vraiment à personne ?', [
    ['5 jours ou plus', 0], ['3–4 jours', 25], ['1–2 jours', 55], ['Aucun', 100]]);
  add(R, 0.5, 'Écrans / réseaux sociaux vs vraies interactions ?', [
    ['Les écrans remplacent tout', 0], ['Beaucoup d\'écran', 30], ['Équilibré', 65], ['Je privilégie le réel', 100]]);
  add(R, 1, 'Activités de groupe (club, association, sport collectif…) ?', [
    ['Aucune', 0], ['Occasionnelles', 40], ['Une activité régulière', 70], ['Plusieurs', 100]]);
  add(R, 1.5, 'Reçois-tu des invitations ?', [
    ['Jamais', 0], ['Rarement', 25], ['Parfois', 55], ['Souvent', 80], ['Très souvent', 100]]);
  add(R, 1, 'Organises-tu des événements (repas, soirées, sorties) ?', [
    ['Jamais', 10], ['Rarement', 35], ['Parfois', 65], ['Souvent', 100]]);
  add(R, 2, 'Ton estime de toi ?', [
    ['Très faible', 0], ['Faible', 25], ['Moyenne', 50], ['Bonne', 75], ['Solide', 100]]);
  add(R, 1.5, 'Ton énergie et ta motivation au réveil ?', [
    ['Aucune, je subis', 0], ['Faible', 25], ['Moyenne', 50], ['Bonne', 75], ['Je saute du lit', 100]]);
  add(R, 0.5, 'Pratiques de bien-être mental (méditation, journal, thérapie, gratitude) ?', [
    ['Aucune', 20], ['Parfois', 50], ['Régulièrement', 80], ['Ancrées dans mon quotidien', 100]]);
  add(R, 1.5, 'Moments de rire / de joie partagés par semaine ?', [
    ['Aucun', 0], ['Un', 30], ['Plusieurs', 65], ['Tous les jours', 100]]);
  add(R, 1, 'Tes relations au travail / études ?', [
    ['Conflit ou isolé', 10], ['Neutres', 45], ['Bonnes', 75], ['Excellentes', 100]]);
  add(R, 0.5, 'Ton réseau professionnel ?', [
    ['Inexistant', 10], ['Petit', 40], ['Moyen', 70], ['Large et actif', 100]]);
  add(R, 1, 'Dépendance affective / jalousie ?', [
    ['Très forte', 10], ['Forte', 35], ['Modérée', 65], ['Attachement serein', 100]]);
  add(R, 1, 'Relations toxiques ou ruptures douloureuses ?', [
    ['Relation toxique en cours', 0], ['Rupture récente difficile', 30], ['Passées et surmontées', 70], ['Aucune', 100]]);
  add(R, 1.5, 'Rencontres amoureuses sur 12 mois (ou soirées en amoureux si en couple) ?', [
    ['Aucune', 0], ['Une', 30], ['Quelques-unes', 65], ['Nombreuses / très régulières', 100]]);
  add(R, 0.5, 'Le soin de ton apparence (style, hygiène, présentation) ?', [
    ['Négligé', 10], ['Basique', 40], ['Soigné', 75], ['Très soigné', 100]]);
  add(R, 3, 'Globalement, ta satisfaction de ta vie relationnelle ?', [
    ['0–2 / 10', 0], ['3–4 / 10', 25], ['5–6 / 10', 50], ['7–8 / 10', 78], ['9–10 / 10', 100]]);

  window.QUESTIONS = Q;
})();
