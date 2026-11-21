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

  /* --- statuts hybrides : 2 ou 3 stats au rang S (niveau 90+) --- */
  const HYBRIDS = {
    'sport+finance': { t: 'Empereur de fer et d\'or', cls: 'Conquérant', desc: 'Discipline d\'athlète et stratégie d\'investisseur : tu bâtis ton empire comme tu prépares une course.', traits: ['Implacable', 'Visionnaire', 'Discipliné'] },
    'sport+relation': { t: 'Champion des foules', cls: 'Héros', desc: 'Un corps d\'élite et un cœur rayonnant : tu inspires tous ceux qui t\'entourent.', traits: ['Charismatique', 'Inarrêtable', 'Inspirant'] },
    'finance+relation': { t: 'Souverain au cœur d\'or', cls: 'Mécène', desc: 'Riche et aimé : ton abondance nourrit tes liens, et tes liens multiplient ton abondance.', traits: ['Généreux', 'Influent', 'Magnétique'] },
    'sport+finance+relation': { t: 'Légende absolue', cls: 'Transcendant', desc: 'Corps, fortune et cœur au sommet. Le Système n\'a plus rien à t\'apprendre.', traits: ['Transcendant', 'Accompli', 'Légendaire', 'Éveillé'] }
  };

  let uidN = 0;
  const EMB = {
    sport: '<path d="M3 -12 L-6 2 L0 2 L-3 12 L6 -2 L0 -2 Z" />',
    finance: '<path d="M0 -11 L9 -3 L0 11 L-9 -3 Z" />',
    relation: '<path d="M0 9 l-9 -9 a5.5 5.5 0 0 1 9 -7 a5.5 5.5 0 0 1 9 7 z" />'
  };
  function auraPoints(spikes, inner, outer, r, rot, cy) {
    let pts = '';
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2 + (rot || 0);
      const rad = i % 2 ? inner : outer + (i % 4 === 0 ? r * 3 : 0);
      pts += `${(100 + Math.cos(a) * rad).toFixed(1)},${((cy || 118) + Math.sin(a) * rad * 1.05).toFixed(1)} `;
    }
    return pts;
  }

  /* --- avatar SVG ---
     domain : 'sport' | 'finance' | 'relation'  OU  tableau de domaines (statut hybride)
     color  : couleur                            OU  tableau de couleurs */
  function avatar(domain, rankIdx, color) {
    const doms = Array.isArray(domain) ? domain : [domain];
    const cols = Array.isArray(color) ? color : [color];
    const hybrid = doms.length > 1;
    const r = hybrid ? 5 : Math.max(0, Math.min(5, rankIdx));
    const rk = RANKS[r], c = cols[0];
    const rc = hybrid ? '#ffd34d' : RANK_COLORS[rk];
    const id = 'av' + (++uidN);
    const mix = hybrid ? `url(#${id}mix)` : c;
    const has = (d) => doms.includes(d);

    // aura : une flamme par domaine, décalées pour se mélanger
    const spikes = 8 + r * 3;
    const auras = cols.map((col, i) => `<polygon points="${auraPoints(spikes, 62, 70 + r * 7 + (hybrid ? 6 : 0), r, i * Math.PI / (spikes * cols.length))}" fill="${col}" opacity="${hybrid ? 0.42 / cols.length : 0.12 + r * 0.07}" filter="url(#${id}blur)" class="av-aura" style="animation-delay:${i * 0.8}s"/>`).join('');

    // particules
    let parts = '';
    if (r >= 2) {
      const n = (r - 1) * 5 + (hybrid ? 8 : 0), pc = cols.concat(rc);
      for (let i = 0; i < n; i++) {
        const a = (i * 137.5 * Math.PI) / 180, d = 50 + ((i * 29) % 45);
        parts += `<circle cx="${(100 + Math.cos(a) * d).toFixed(1)}" cy="${(118 + Math.sin(a) * d).toFixed(1)}" r="${1 + (i % 3) * 0.6}" fill="${pc[i % pc.length]}" opacity="${0.4 + (i % 4) * 0.15}" class="av-p" style="animation-delay:${(i % 7) * 0.4}s"/>`;
      }
    }

    // objets de classe (rang C+), placés pour ne pas se chevaucher en hybride
    const colOf = (d) => cols[doms.indexOf(d)];
    const coin = (x, y, i, col) => `<g class="av-f" style="animation-delay:${i * 0.6}s" filter="url(#${id}g)"><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${col}" stroke-width="2.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="900" fill="${col}">€</text></g>`;
    const heart = (x, y, i, col) => `<path class="av-f" style="animation-delay:${i * 0.5}s" filter="url(#${id}g)" d="M${x} ${y + 6} l-8 -8 a5 5 0 0 1 8 -6 a5 5 0 0 1 8 6 z" fill="${col}"/>`;
    let gear = '';
    if (r >= 2) {
      if (has('sport')) { const col = colOf('sport'); gear += `<g filter="url(#${id}g)"><path d="M150 40 L158 44 L120 160 L114 157 Z" fill="${col}" opacity=".9"/><path d="M108 150 L128 160 M112 168 L122 152" stroke="${col}" stroke-width="5" stroke-linecap="round"/></g>`; }
      if (has('finance')) {
        const pos = !hybrid ? [[52, 70], [150, 78], [42, 120], [160, 128]].slice(0, r)
          : has('relation') && has('sport') ? [[50, 72], [38, 114]]
          : has('sport') ? [[52, 70], [40, 114], [40, 158]] : [[52, 72], [40, 116], [44, 160]];
        gear += pos.map(([x, y], i) => coin(x, y, i, colOf('finance'))).join('');
      }
      if (has('relation')) {
        let pos = [[50, 76], [152, 70], [158, 126], [44, 128]].slice(0, r);
        if (hybrid) pos = has('sport') && has('finance') ? [[40, 158], [172, 104], [166, 150]] : has('sport') ? [[50, 76], [40, 118], [42, 160]] : [[150, 74], [162, 118], [158, 160]];
        gear += pos.map(([x, y], i) => heart(x, y, i, colOf('relation'))).join('');
      }
    }

    // ailes (S) : dégradé des couleurs en hybride
    const wings = r >= 5 ? `<g opacity=".9" filter="url(#${id}g)" fill="none" stroke="${hybrid ? mix : rc}" stroke-width="${hybrid ? 3 : 2.5}">
      <path d="M70 120 C 30 100 18 70 14 40 C 34 62 48 70 62 74 C 40 72 30 84 26 98 C 44 92 56 96 66 104"/>
      <path d="M130 120 C 170 100 182 70 186 40 C 166 62 152 70 138 74 C 160 72 170 84 174 98 C 156 92 144 96 134 104"/>
      ${hybrid ? '<path d="M66 104 C 40 110 26 126 20 146 C 38 132 52 128 68 128"/><path d="M134 104 C 160 110 174 126 180 146 C 162 132 148 128 132 128"/>' : ''}</g>` : '';

    // épaulières (B+)
    const armor = r >= 3 ? `<path d="M58 132 Q 70 116 86 120 L 82 132 Z" fill="${c}" opacity=".8"/><path d="M142 132 Q 130 116 114 120 L 118 132 Z" fill="${cols[cols.length > 1 ? 1 : 0]}" opacity=".8"/>` : '';

    // halo (A) / couronne (S) — couronne à gemmes en hybride
    let crown = '';
    if (r >= 4) crown += `<ellipse cx="100" cy="42" rx="${hybrid ? 30 : 24}" ry="6" fill="none" stroke="${rc}" stroke-width="2.5" filter="url(#${id}g)" class="av-h"/>`;
    if (r >= 5) {
      crown += hybrid
        ? `<path d="M78 37 L82 18 L90 29 L100 10 L110 29 L118 18 L122 37 Z" fill="${rc}" filter="url(#${id}g)"/>` + cols.map((col, i) => `<circle cx="${100 + (i - (cols.length - 1) / 2) * 11}" cy="31" r="3.2" fill="${col}"/>`).join('')
        : `<path d="M82 36 L86 22 L93 31 L100 16 L107 31 L114 22 L118 36 Z" fill="${rc}" filter="url(#${id}g)"/>`;
    }

    // emblèmes côte à côte
    const s = 0.8 + r * 0.1;
    const embs = doms.map((d, i) => `<g transform="translate(${100 + (i - (doms.length - 1) / 2) * 22} ${hybrid ? 190 : 164}) scale(${hybrid ? 0.9 : s})" fill="${cols[i]}" filter="url(#${id}g)">${EMB[d]}</g>`).join('');

    // yeux : vairons en hybride, 3e œil au front pour les 3 stats
    const eyeOp = 0.45 + r * 0.11;
    const eyeR = cols[cols.length > 1 ? 1 : 0];
    const third = doms.length === 3 ? `<path d="M100 72 l5 3 l-5 3 l-5 -3 z" fill="${cols[2]}" filter="url(#${id}g)"/>` : '';
    const trail = r >= 4 ? `<path d="M110 88 Q 124 84 136 74" stroke="${eyeR}" stroke-width="2" fill="none" opacity=".7" filter="url(#${id}g)"/>` + (hybrid ? `<path d="M90 88 Q 76 84 64 74" stroke="${c}" stroke-width="2" fill="none" opacity=".7" filter="url(#${id}g)"/>` : '') : '';

    const mixDef = hybrid ? `<linearGradient id="${id}mix" x1="0" y1="0" x2="1" y2="1">${cols.map((col, i) => `<stop offset="${i / (cols.length - 1)}" stop-color="${col}"/>`).join('')}</linearGradient>` : '';
    const bgs = cols.map((col, i) => `<radialGradient id="${id}bg${i}" cx="${hybrid ? 30 + i * (40 / (cols.length - 1)) : 50}%" cy="45%" r="60%"><stop offset="0" stop-color="${col}" stop-opacity="${hybrid ? 0.2 : 0.18 + r * 0.06}"/><stop offset="1" stop-color="#04060c" stop-opacity="0"/></radialGradient>`).join('');

    return `<svg class="avatar${hybrid ? ' hybrid' : ''}" viewBox="0 0 200 220" role="img" aria-label="Avatar">
      <defs>${bgs}${mixDef}
        <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121b33"/><stop offset="1" stop-color="#05070e"/></linearGradient>
        <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="${id}blur"><feGaussianBlur stdDeviation="${3 + r}"/></filter>
      </defs>
      ${cols.map((_, i) => `<circle cx="100" cy="112" r="98" fill="url(#${id}bg${i})"/>`).join('')}
      ${auras}${wings}${parts}
      <path d="M100 48 C 78 48 68 64 68 84 C 68 98 74 108 82 114 C 60 120 46 134 40 162 L 34 214 L 166 214 L 160 162 C 154 134 140 120 118 114 C 126 108 132 98 132 84 C 132 64 122 48 100 48 Z"
        fill="url(#${id}body)" stroke="${mix}" stroke-width="${1 + r * 0.25}" stroke-opacity=".85"/>
      <ellipse cx="100" cy="88" rx="20" ry="23" fill="#010205"/>
      <g filter="url(#${id}g)" class="av-eyes"><ellipse cx="91" cy="88" rx="4.5" ry="2.2" fill="${c}" opacity="${eyeOp}"/><ellipse cx="109" cy="88" rx="4.5" ry="2.2" fill="${eyeR}" opacity="${eyeOp}"/></g>
      ${third}${trail}${armor}${gear}${crown}${embs}
      <circle cx="100" cy="112" r="98" fill="none" stroke="${hybrid ? mix : rc}" stroke-width="${hybrid ? 3 : 2}" stroke-opacity="${hybrid ? 0.9 : 0.6}"/>
    </svg>`;
  }

  /* --- boss : créature générée à partir de son nom, même style que l'avatar --- */
  function bossSprite(name, color, big) {
    let seed = 7; for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const id = 'bs' + (++uidN);
    const RED = '#ff2a4d';
    const f = (n) => n.toFixed(1);
    const kind = Math.floor(rnd() * 3);               // 0 bête cornue · 1 spectre · 2 colosse
    const hr = 20 + rnd() * 9, hy = 84 + rnd() * 8;   // tête
    const sw = (kind === 2 ? 66 : 50) + rnd() * 16;    // demi-largeur des épaules
    const hunch = rnd() * 14;

    // aura
    const auraCol = big ? RED : color;
    const auras = `<polygon points="${auraPoints(big ? 16 : 11, 60, big ? 96 : 80, big ? 4 : 2, 0, 122)}" fill="${auraCol}" opacity="${big ? 0.4 : 0.28}" filter="url(#${id}blur)" class="av-aura"/>`
      + `<polygon points="${auraPoints(big ? 13 : 9, 54, big ? 82 : 70, 2, 0.3, 122)}" fill="${color}" opacity=".25" filter="url(#${id}blur)" class="av-aura" style="animation-delay:1s"/>`;

    // corps symétrique
    const L = (x) => f(100 - x), R = (x) => f(100 + x);
    const neckY = hy + hr * 0.9, shY = neckY + 14 + hunch;
    let bottom;
    if (kind === 1) { // bas en lambeaux
      bottom = '';
      const n = 7; for (let i = 0; i <= n; i++) { const x = -sw + 6 + (i * (2 * sw - 12)) / n; bottom += `L ${f(100 + x)} ${f(i % 2 ? 196 + rnd() * 6 : 216)} `; }
    } else bottom = `L ${R(sw - 6)} 216 `;
    const body = `M 100 ${f(hy - hr)}
      C ${L(hr * 1.15)} ${f(hy - hr)} ${L(hr * 1.25)} ${f(hy + hr * 0.5)} ${L(hr * 0.7)} ${f(neckY)}
      C ${L(sw * 0.8)} ${f(shY - 6)} ${L(sw + 4)} ${f(shY + 10)} ${L(sw)} ${f(shY + 40)}
      L ${L(sw - 6)} 216 ${bottom}
      L ${R(sw)} ${f(shY + 40)}
      C ${R(sw + 4)} ${f(shY + 10)} ${R(sw * 0.8)} ${f(shY - 6)} ${R(hr * 0.7)} ${f(neckY)}
      C ${R(hr * 1.25)} ${f(hy + hr * 0.5)} ${R(hr * 1.15)} ${f(hy - hr)} 100 ${f(hy - hr)} Z`;

    // cornes
    let horns = '';
    const hp = kind === 1 ? (big ? 1 : 0) : (big ? 2 : 1);
    for (let k = 0; k < hp; k++) {
      const bx = hr * (0.45 + k * 0.35), by = hy - hr * (0.75 - k * 0.25);
      const tx = hr + 14 + rnd() * 22 + k * 8, ty = hy - hr - 24 - rnd() * 20 + k * 12;
      [-1, 1].forEach((sd) => {
        const X = (x) => f(100 + sd * x);
        horns += `<path d="M ${X(bx - 5)} ${f(by)} Q ${X(tx - 2)} ${f(by - 4)} ${X(tx)} ${f(ty)} Q ${X(tx - 14)} ${f(by - 12)} ${X(bx + 6)} ${f(by + 4)} Z" fill="url(#${id}body)" stroke="${big ? RED : color}" stroke-width="2"/>`;
      });
    }

    // pointes sur les épaules
    let spikes = '';
    const ns = (kind === 2 ? 2 : 1) + (big ? 1 : 0);
    for (let k = 0; k < ns; k++) {
      const x = sw * (0.55 + k * 0.18), y = shY + 2 + k * 6, hgt = 14 + rnd() * 12;
      [-1, 1].forEach((sd) => { spikes += `<path d="M ${f(100 + sd * (x - 6))} ${f(y + 4)} L ${f(100 + sd * (x + 3))} ${f(y - hgt)} L ${f(100 + sd * (x + 8))} ${f(y + 6)} Z" fill="#0b1124" stroke="${color}" stroke-width="1.5"/>`; });
    }

    // griffes
    const cy = 186 + rnd() * 10, cx = sw - 2;
    let claws = '';
    [-1, 1].forEach((sd) => { for (let k = 0; k < 3; k++) claws += `<path d="M ${f(100 + sd * (cx - 8 + k * 6))} ${f(cy)} q ${f(sd * 4)} 10 ${f(sd * -2)} 18" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`; });

    // ailes (certains boss)
    const wings = big && rnd() > 0.35 ? `<g fill="#070c1c" stroke="${RED}" stroke-width="2" opacity=".95">
      <path d="M ${L(sw * 0.6)} ${f(shY)} C ${L(sw + 30)} ${f(shY - 60)} ${L(96)} ${f(shY - 50)} ${L(98)} ${f(shY - 20)} L ${L(84)} ${f(shY - 4)} L ${L(90)} ${f(shY + 18)} L ${L(76)} ${f(shY + 18)} L ${L(sw)} ${f(shY + 30)} Z"/>
      <path d="M ${R(sw * 0.6)} ${f(shY)} C ${R(sw + 30)} ${f(shY - 60)} ${R(96)} ${f(shY - 50)} ${R(98)} ${f(shY - 20)} L ${R(84)} ${f(shY - 4)} L ${R(90)} ${f(shY + 18)} L ${R(76)} ${f(shY + 18)} L ${R(sw)} ${f(shY + 30)} Z"/></g>` : '';

    // yeux plissés et menaçants (2 à 4)
    const ne = big ? (rnd() > 0.5 ? 4 : 2) : (rnd() > 0.75 ? 3 : 2);
    let eyes = '';
    const eye = (x, y, w, sd) => `<path d="M ${f(x - w * sd)} ${f(y - 3)} L ${f(x + w * sd)} ${f(y + 1)} L ${f(x - w * 0.6 * sd)} ${f(y + 3)} Z" fill="${RED}"/>`;
    if (ne === 3) eyes = eye(90, hy + 2, 6, 1) + eye(110, hy + 2, 6, -1) + `<circle cx="100" cy="${f(hy - 9)}" r="3.4" fill="${RED}"/>`;
    else { eyes = eye(90, hy + 2, 6, 1) + eye(110, hy + 2, 6, -1); if (ne === 4) eyes += eye(87, hy - 8, 4.5, 1) + eye(113, hy - 8, 4.5, -1); }

    // gueule
    let mouth = '';
    if (rnd() > 0.35) {
      const my = hy + hr * 0.55; let d = `M ${f(100 - 10)} ${f(my)}`;
      for (let i = 1; i <= 6; i++) d += ` L ${f(90 + i * (20 / 6))} ${f(my + (i % 2 ? 4 : 0))}`;
      mouth = `<path d="${d}" stroke="${color}" stroke-width="1.6" fill="none" filter="url(#${id}g)"/>`;
    }

    // cœur de la créature
    const core = `<g filter="url(#${id}g)"><path d="M100 ${f(shY + 22)} l9 13 l-9 13 l-9 -13 z" fill="none" stroke="${big ? RED : color}" stroke-width="2.2"/><circle cx="100" cy="${f(shY + 35)}" r="3" fill="${big ? RED : color}" class="av-p"/></g>`;

    return `<svg class="boss-svg" viewBox="0 0 200 220" role="img" aria-label="${name.replace(/"/g, '')}">
      <defs>
        <radialGradient id="${id}bg" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="${big ? RED : color}" stop-opacity=".25"/><stop offset="1" stop-color="#04060c" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151a2e"/><stop offset="1" stop-color="#04050a"/></linearGradient>
        <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="${id}blur"><feGaussianBlur stdDeviation="${big ? 7 : 5}"/></filter>
      </defs>
      <circle cx="100" cy="112" r="98" fill="url(#${id}bg)"/>
      ${auras}${wings}
      <path d="${body}" fill="url(#${id}body)" stroke="${color}" stroke-width="${big ? 2.5 : 2}" stroke-opacity=".9"/>
      ${horns}${spikes}
      <ellipse cx="100" cy="${f(hy + 1)}" rx="${f(hr * 0.78)}" ry="${f(hr * 0.72)}" fill="#010205"/>
      <g filter="url(#${id}g)" class="av-eyes" style="transform-origin:100px ${f(hy)}px">${eyes}</g>
      ${mouth}${claws}${core}
      <circle cx="100" cy="112" r="98" fill="none" stroke="${big ? RED : color}" stroke-width="2" stroke-opacity=".6"/>
    </svg>`;
  }

  window.PERSONA = { CLASSES, HYBRIDS, RANK_COLORS, avatar, bossSprite };
})();
