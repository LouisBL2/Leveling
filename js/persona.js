/* =========================================================
   STATUTS DE PERSONNALITÉ + AVATAR GÉNÉRÉ
   Classe = domaine le plus fort. Palier = rang global (E → S).
   L'avatar est un SVG généré : aucune image externe.
   ========================================================= */
(function () {
  const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
  const RANK_COLORS = { E: '#9aa7b8', D: '#7fe0a0', C: '#49c6ff', B: '#b47cff', A: '#ffcf5c', S: '#ff4f7b' };

  const CLASSES = {
    sport: {
      cls: 'Guerrier',
      tiers: [
        { t: 'Recrue endormie', desc: 'Ton corps sommeille encore, mais l\'étincelle est là. Chaque pas compte.', traits: ['Potentiel caché', 'Volonté naissante'] },
        { t: 'Coureur éveillé', desc: 'Tu as quitté le canapé. Le souffle se construit et la discipline prend racine.', traits: ['Régulier', 'Tenace'] },
        { t: 'Combattant d\'endurance', desc: 'Nager, rouler, courir : ton corps devient une machine qui encaisse.', traits: ['Endurant', 'Discipliné', 'Résilient'] },
        { t: 'Chevalier du triathlon', desc: 'Tu domines les trois disciplines et tu chasses les chronos.', traits: ['Compétiteur', 'Polyvalent', 'Rigoureux'] },
        { t: 'Titan d\'acier', desc: 'Physique sec et puissant, mental de fer. Les podiums te regardent.', traits: ['Implacable', 'Explosif', 'Mental d\'acier'] },
        { t: 'Souverain de l\'endurance', desc: 'Niveau élite. Tu ne t\'entraînes plus pour progresser, mais pour régner.', traits: ['Légende', 'Inarrêtable', 'Élite'] }
      ]
    },
    finance: {
      cls: 'Stratège',
      tiers: [
        { t: 'Débiteur errant', desc: 'Les dettes pèsent, mais tu as ouvert les yeux. La reconquête commence ici.', traits: ['Lucide', 'Combatif'] },
        { t: 'Gardien des pièces', desc: 'Tu protèges chaque euro et tu sors la tête de l\'eau.', traits: ['Prudent', 'Économe'] },
        { t: 'Stratège épargnant', desc: 'Ton budget est sous contrôle, ton épargne grandit, tes premiers investissements sont posés.', traits: ['Méthodique', 'Patient', 'Organisé'] },
        { t: 'Marchand investisseur', desc: 'L\'argent travaille pour toi. Plusieurs flux de revenus s\'installent.', traits: ['Visionnaire', 'Calculateur', 'Ambitieux'] },
        { t: 'Seigneur du capital', desc: 'Ton patrimoine est solide et diversifié. La liberté est en vue.', traits: ['Bâtisseur', 'Influent', 'Serein'] },
        { t: 'Souverain de l\'abondance', desc: 'Rentier : le travail est devenu un choix, plus une obligation.', traits: ['Libre', 'Prospère', 'Maître du temps'] }
      ]
    },
    relation: {
      cls: 'Ambassadeur',
      tiers: [
        { t: 'Âme solitaire', desc: 'L\'isolement est lourd, mais chaque lien recréé brise une chaîne.', traits: ['Introspectif', 'Sensible'] },
        { t: 'Voyageur timide', desc: 'Tu tends la main au monde, pas à pas. Les portes commencent à s\'ouvrir.', traits: ['Courageux', 'Attentif'] },
        { t: 'Lien naissant', desc: 'Des amitiés solides se forment et ton cercle grandit.', traits: ['Fiable', 'Chaleureux', 'Ouvert'] },
        { t: 'Cœur rayonnant', desc: 'Les gens viennent à toi. Ta présence compte et ton énergie inspire.', traits: ['Charismatique', 'Empathique', 'Fédérateur'] },
        { t: 'Maître des liens', desc: 'Amour, famille, amis : ton réseau est une forteresse.', traits: ['Magnétique', 'Protecteur', 'Leader'] },
        { t: 'Souverain des cœurs', desc: 'Ta vie relationnelle est un royaume : amour épanoui, famille et amis indéfectibles.', traits: ['Légendaire', 'Aimé', 'Rayonnant'] }
      ]
    }
  };

  /* --- avatar SVG --- */
  function avatar(domain, rankIdx, color, uidSuffix) {
    const r = Math.max(0, Math.min(5, rankIdx));
    const rk = RANKS[r], rc = RANK_COLORS[rk], c = color;
    const id = 'av' + (uidSuffix || '') + domain + r;
    const cx = 100;

    // aura en flammes : plus de pointes et plus haute avec le rang
    const spikes = 8 + r * 3, inner = 62, outer = 70 + r * 7;
    let aura = '';
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 ? inner : outer + (i % 4 === 0 ? r * 3 : 0);
      aura += `${(cx + Math.cos(a) * rad).toFixed(1)},${(118 + Math.sin(a) * rad * 1.05).toFixed(1)} `;
    }

    // particules (rang B+)
    let parts = '';
    if (r >= 2) {
      const n = (r - 1) * 5;
      for (let i = 0; i < n; i++) {
        const a = (i * 137.5 * Math.PI) / 180, d = 50 + ((i * 29) % 45);
        parts += `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(118 + Math.sin(a) * d).toFixed(1)}" r="${1 + (i % 3) * 0.6}" fill="${i % 2 ? c : rc}" opacity="${0.4 + (i % 4) * 0.15}" class="av-p" style="animation-delay:${(i % 7) * 0.4}s"/>`;
      }
    }

    // arme / attribut de classe (rang C+)
    let gear = '';
    if (r >= 2) {
      if (domain === 'sport') {
        gear = `<g filter="url(#${id}g)"><path d="M150 40 L158 44 L120 160 L114 157 Z" fill="${c}" opacity=".9"/><path d="M108 150 L128 160 M112 168 L122 152" stroke="${c}" stroke-width="5" stroke-linecap="round"/></g>`;
      } else if (domain === 'finance') {
        const coins = [[52, 70], [150, 78], [42, 120], [160, 128]].slice(0, r);
        gear = coins.map(([x, y], i) => `<g class="av-f" style="animation-delay:${i * 0.6}s" filter="url(#${id}g)"><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${c}" stroke-width="2.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="900" fill="${c}">€</text></g>`).join('');
      } else {
        const hs = [[50, 76], [152, 70], [158, 126], [44, 128]].slice(0, r);
        gear = hs.map(([x, y], i) => `<path class="av-f" style="animation-delay:${i * 0.5}s" filter="url(#${id}g)" d="M${x} ${y + 6} l-8 -8 a5 5 0 0 1 8 -6 a5 5 0 0 1 8 6 z" fill="${c}"/>`).join('');
      }
    }

    // ailes (rang S)
    const wings = r >= 5 ? `<g opacity=".85" filter="url(#${id}g)" fill="none" stroke="${rc}" stroke-width="2.5">
      <path d="M70 120 C 30 100 18 70 14 40 C 34 62 48 70 62 74 C 40 72 30 84 26 98 C 44 92 56 96 66 104"/>
      <path d="M130 120 C 170 100 182 70 186 40 C 166 62 152 70 138 74 C 160 72 170 84 174 98 C 156 92 144 96 134 104"/></g>` : '';

    // épaulières (rang B+)
    const armor = r >= 3 ? `<path d="M58 132 Q 70 116 86 120 L 82 132 Z M142 132 Q 130 116 114 120 L 118 132 Z" fill="${c}" opacity=".75"/>` : '';

    // halo (A) / couronne (S)
    let crown = '';
    if (r >= 4) crown += `<ellipse cx="100" cy="42" rx="24" ry="6" fill="none" stroke="${rc}" stroke-width="2.5" filter="url(#${id}g)" class="av-h"/>`;
    if (r >= 5) crown += `<path d="M82 36 L86 22 L93 31 L100 16 L107 31 L114 22 L118 36 Z" fill="${rc}" filter="url(#${id}g)"/>`;

    // emblème de classe sur la poitrine
    const s = 0.8 + r * 0.1;
    const emb = {
      sport: `<path d="M3 -12 L-6 2 L0 2 L-3 12 L6 -2 L0 -2 Z" />`,
      finance: `<path d="M0 -11 L9 -3 L0 11 L-9 -3 Z" />`,
      relation: `<path d="M0 9 l-9 -9 a5.5 5.5 0 0 1 9 -7 a5.5 5.5 0 0 1 9 7 z" />`
    }[domain];

    const eyeOp = 0.45 + r * 0.11;
    const trail = r >= 4 ? `<path d="M110 88 Q 124 84 136 74" stroke="${c}" stroke-width="2" fill="none" opacity=".7" filter="url(#${id}g)"/>` : '';

    return `<svg class="avatar" viewBox="0 0 200 220" role="img" aria-label="Avatar">
      <defs>
        <radialGradient id="${id}bg" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="${c}" stop-opacity="${0.18 + r * 0.06}"/><stop offset="1" stop-color="#04060c" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121b33"/><stop offset="1" stop-color="#05070e"/></linearGradient>
        <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="${id}blur"><feGaussianBlur stdDeviation="${3 + r}"/></filter>
      </defs>
      <circle cx="100" cy="112" r="98" fill="url(#${id}bg)"/>
      <polygon points="${aura}" fill="${c}" opacity="${0.12 + r * 0.07}" filter="url(#${id}blur)" class="av-aura"/>
      ${wings}${parts}
      <path d="M100 48 C 78 48 68 64 68 84 C 68 98 74 108 82 114 C 60 120 46 134 40 162 L 34 214 L 166 214 L 160 162 C 154 134 140 120 118 114 C 126 108 132 98 132 84 C 132 64 122 48 100 48 Z"
        fill="url(#${id}body)" stroke="${c}" stroke-width="${1 + r * 0.25}" stroke-opacity=".8"/>
      <ellipse cx="100" cy="88" rx="20" ry="23" fill="#010205"/>
      <g filter="url(#${id}g)" class="av-eyes"><ellipse cx="91" cy="88" rx="4.5" ry="2.2" fill="${c}" opacity="${eyeOp}"/><ellipse cx="109" cy="88" rx="4.5" ry="2.2" fill="${c}" opacity="${eyeOp}"/></g>
      ${trail}${armor}${gear}${crown}
      <g transform="translate(100 164) scale(${s})" fill="${c}" filter="url(#${id}g)">${emb}</g>
      <circle cx="100" cy="112" r="98" fill="none" stroke="${rc}" stroke-width="2" stroke-opacity=".6"/>
    </svg>`;
  }

  window.PERSONA = { CLASSES, RANK_COLORS, avatar };
})();
