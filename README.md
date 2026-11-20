# Leveling System

Système de progression personnelle façon « fenêtre système » d'anime, sur les 3 strates de la vie : **Sport** (triathlon), **Finance** et **Relation**.

## Fonctionnement

- **Questionnaire d'éveil (107 questions)** au premier lancement, qui détermine un niveau de 0 à 100 dans chaque domaine.
  - Sport : 0 = obésité et gros problèmes de santé, 100 = triathlète D1 sur le podium, physique sec et volumineux.
  - Finance : 0 = très endetté, dans le rouge, 100 = rentier, plusieurs sources de revenus, patrimoine de 1 M€.
  - Relation : 0 = déprime chronique, solitude et célibat subi, 100 = grand succès amoureux ou couple marié avec famille et amis solides.
- **Quêtes** quotidiennes, hebdomadaires et mensuelles, avec un rang de difficulté de E à S. L'XP dépend de la difficulté et de la périodicité.
- **Pénalités** : une quête non accomplie à temps fait perdre 60 % de son XP (on peut perdre des niveaux) et ouvre une **quête de pénalité** de 24 h (pompes, burpees, douche froide…). Si tu la réussis, tu récupères 50 % de l'XP perdue. Si tu l'échoues, tu perds cette XP une deuxième fois.
- **Récompense journalière** quand toutes les quêtes du jour sont accomplies, avec un bonus qui grandit avec ta série de jours.
- **Catalogue** de quêtes recommandées selon ton niveau, et création de quêtes personnalisées.
- **Mode repos** (vacances, blessure) : suspend les pénalités.

## Confidentialité

L'application est 100 % statique. **Toutes les données (réponses, niveaux, quêtes) restent dans le `localStorage` de ton navigateur.** Rien n'est envoyé sur GitHub ni sur aucun serveur : le dépôt public ne contient que le code. Il n'y a ni compte, ni mot de passe, ni tracker.

Chaque appareil a donc ses propres données. Pour passer du téléphone à l'ordinateur ou faire une sauvegarde, va dans **Système → Exporter / Importer**. Garde le fichier JSON exporté pour toi et ne le committe pas.

## Mise en ligne avec GitHub Pages

1. Sur GitHub : **Settings → Pages**.
2. Dans *Source*, choisis **Deploy from a branch**, puis la branche voulue et le dossier **/ (root)**, et clique sur **Save**.
3. Au bout d'une minute environ, l'application est disponible sur `https://<ton-pseudo>.github.io/Leveling/`.

## Installer sur téléphone

- **iPhone (Safari)** : Partager → *Sur l'écran d'accueil*.
- **Android (Chrome)** : menu ⋮ → *Installer l'application*.

L'application fonctionne ensuite hors connexion.

## Structure

```
index.html            page unique
css/style.css         thème « fenêtre système »
js/questions.js       les 107 questions et leur barème
js/quests.js          catalogue des quêtes, pénalités, domaines
js/app.js             logique (XP, niveaux, cycles, pénalités, rendu)
sw.js                 service worker (mode hors ligne)
```

Pour une mise à jour, incrémente `VERSION` dans `sw.js`.
