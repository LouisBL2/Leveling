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

  /* =======================================================
     PIXEL ART 16 BITS
     ======================================================= */
  // Rend une grille de caractères en SVG (pixels fusionnés par lignes).
  function pixelSVG(grid, pal, cls) {
    const h = grid.length, w = grid[0].length;
    let out = '';
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        const ch = grid[y][x];
        if (ch === '.' || !pal[ch]) { x++; continue; }
        let x2 = x + 1;
        while (x2 < w && grid[y][x2] === ch) x2++;
        out += `<rect x="${x}" y="${y}" width="${x2 - x}" height="1" fill="${pal[ch]}"/>`;
        x = x2;
      }
    }
    return `<svg class="${cls || 'pix'}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="Sprite">${out}</svg>`;
  }
  const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
  const mirror = (half) => half.map((r) => (r + r.split('').reverse().join('')).split(''));
  function stamp(g, rows, ox, oy) {
    rows.forEach((r, y) => r.split('').forEach((ch, x) => {
      if (ch !== '.' && g[oy + y] && g[oy + y][ox + x] !== undefined) g[oy + y][ox + x] = ch;
    }));
  }
  const set = (g, x, y, ch) => { if (g[y] && g[y][x] !== undefined) g[y][x] = ch; };
  const setM = (g, x, y, ch) => { set(g, x, y, ch); set(g, 31 - x, y, ch); };

  // Corps de base (moitié gauche, symétrisée). 32 × 32.
  const BODY = [
    '................', '................', '................',
    '..........KKKKKK', '........KKHHHHHH', '.......KHHHHHHHH', '......KHHHhHHHHH', '......KHHHHHHHHH',
    '......KHHHHHHHHH', '......KHHSSSSSSS', '......KSSSEESSSS', '......KSSSEESSSS', '......KsSSSSSSSS',
    '......KSSSSSSSSS', '.......KSSSSSSss', '........KKKSSSSS', '...........KKsss',
    '........KKKKKCCC', '.......KCCCCCCCC', '......KCCKCCCCCC', '.....KCCKCCCCCCA', '.....KCCKCCCCCCA',
    '.....KCCKCCCCCCC', '.....KSSKAAAAAAA', '.....KKKKPPPPPPP', '........KPPPPPPP',
    '........KPPPPPK.', '........KPPPPPK.', '........KBBBBBK.', '.......KBBBBBBK.', '.......KKKKKKKK.', '................'
  ];
  const WING = ['K....', 'LK...', 'LLK..', 'LLLK.', 'LLLLK', 'LLLLK', '.LLLK', '..LLK', '...LK'];
  const SWORD = ['.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', 'GGG', '.B.', '.B.'];
  const BAG = ['..KK..', '.KGGK.', 'KGGGGK', 'KGWGGK', 'KGGGGK', '.KKKK.'];
  const HEART = ['.KK.KK.', 'KAAKAAK', 'KAWAAAK', '.KAAAK.', '..KAK..', '...K...'];

  const CLASS_PAL = {
    sport: { C: '#1d6fd1', c: '#4dd0ff', A: '#4dd0ff', P: '#1a2a55', B: '#eef3ff', H: '#1f2433', h: '#3b4466', R: '#123d7a' },
    finance: { C: '#1b2440', c: '#2e3b66', A: '#ffcf5c', P: '#1b2440', B: '#3b2416', H: '#2b1d14', h: '#5a3d28', R: '#3d2a6b', W: '#e9eef7' },
    relation: { C: '#8a2d6b', c: '#c04a95', A: '#ff6fb5', P: '#2b2140', B: '#3b2416', H: '#4a2418', h: '#7a3b25', R: '#5c1a45' }
  };

  function avatar(domain, rankIdx, color) {
    const r = Math.max(0, Math.min(5, rankIdx));
    const pal = Object.assign({ K: '#0a0d18', S: '#f1c27d', s: '#d9a066', G: '#ffd34d', W: '#f4f8ff', L: '#e8f4ff', E: r < 2 ? '#1b1b2b' : color }, CLASS_PAL[domain]);
    if (r === 0) Object.assign(pal, { C: '#4a4f5c', c: '#5c6270', A: '#6b7280', P: '#2a2e38', R: '#333' });
    const g = blank(32, 32);

    // ailes (S)
    if (r >= 5) { stamp(g, WING, 0, 12); stamp(g, WING.map((x) => x.split('').reverse().join('')), 27, 12); }
    // cape (B+)
    if (r >= 3) for (let y = 18; y <= 29; y++) { const sp = Math.floor((y - 18) / 3); for (let x = 5 - sp; x <= 26 + sp; x++) set(g, x, y, 'R'); }

    // corps
    const body = mirror(BODY);
    body.forEach((row, y) => row.forEach((ch, x) => { if (ch !== '.') g[y][x] = ch; }));

    // variantes de classe
    if (domain === 'sport') {
      for (let x = 7; x <= 24; x++) if (g[8][x] === 'H') g[8][x] = 'A';            // bandeau
      for (let y = 21; y <= 22; y++) [6, 7, 24, 25].forEach((x) => { if (g[y][x] === 'C') g[y][x] = 'S'; }); // bras nus
      for (let y = 26; y <= 27; y++) for (let x = 9; x <= 22; x++) if (g[y][x] === 'P') g[y][x] = 'S';   // short
      for (let y = 20; y <= 21; y++) { set(g, 15, y, 'c'); set(g, 16, y, 'c'); }
    } else if (domain === 'finance') {
      [13, 14, 17, 18].forEach((x) => { set(g, x, 17, 'W'); });
      for (let y = 18; y <= 22; y++) { set(g, 15, y, 'A'); set(g, 16, y, 'A'); }
      [9, 10, 11, 12].forEach((x) => setM(g, x, 10, g[10][x] === 'E' ? 'E' : 'K')); // lunettes
    } else {
      for (let x = 9; x <= 22; x++) { if ('CK'.includes(g[17][x])) g[17][x] = 'A'; if (g[18][x] === 'C') g[18][x] = 'A'; }
      for (let y = 9; y <= 16; y++) { setM(g, 5, y, 'K'); setM(g, 6, y, 'H'); }       // cheveux longs
    }
    // contraste des vêtements
    for (let y = 19; y <= 22; y++) setM(g, 10, y, g[y][10] === 'C' ? 'c' : g[y][10]);

    // objet de classe (C+)
    if (r >= 2) {
      if (domain === 'sport') stamp(g, SWORD, 27, 9);
      else if (domain === 'finance') stamp(g, BAG, 0, 22);
      else stamp(g, HEART, 25, 18);
    }
    // épaulières (B+)
    if (r >= 3) [[7, 17], [8, 17], [6, 18], [7, 18]].forEach(([x, y]) => setM(g, x, y, 'G'));
    // halo (A) / couronne (S)
    if (r === 4) { for (let x = 11; x <= 20; x++) set(g, x, 1, 'G'); }
    if (r >= 5) {
      for (let x = 11; x <= 20; x++) set(g, x, 2, 'G');
      [11, 13, 15, 16, 18, 20].forEach((x) => set(g, x, 1, 'G'));
      [11, 15, 16, 20].forEach((x) => set(g, x, 0, 'G'));
      set(g, 15, 2, 'A'); set(g, 16, 2, 'A');
    }
    return pixelSVG(g, pal, 'pix avatar r' + r);
  }

  /* --- sprite de boss : monstre symétrique généré à partir de son nom --- */
  function bossSprite(name, color, big) {
    let seed = 0; for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const W = big ? 16 : 12, H = big ? 16 : 12, half = W / 2;
    const g = blank(W, H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < half; x++) {
      const dx = (half - x) / half, dy = Math.abs(y - H * 0.55) / (H / 2);
      if (rnd() < 1.25 - dx * 0.75 - dy * 0.7) { g[y][x] = rnd() < 0.22 ? 'c' : 'C'; g[y][W - 1 - x] = g[y][x]; }
    }
    // lissage : retire les pixels isolés, bouche les trous
    for (let pass = 0; pass < 2; pass++) {
      const cp = g.map((row) => row.slice());
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        let n = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (cp[y + b][x + a] !== '.') n++; });
        if (cp[y][x] !== '.' && n <= 1) g[y][x] = '.';
        else if (cp[y][x] === '.' && n >= 3) g[y][x] = 'C';
      }
    }
    const ey = Math.floor(H * 0.42), ex = half - 2 - (big ? 1 : 0);
    [[ex, ey], [W - 1 - ex, ey]].forEach(([x, y]) => { g[y][x] = 'E'; g[y - 1][x] = 'C'; g[y + 1][x] = 'C'; });
    if (big) { [[3, 0], [3, 1], [4, 1], [4, 2]].forEach(([x, y]) => { g[y][x] = 'G'; g[y][W - 1 - x] = 'G'; }); }
    for (let x = half - 2; x <= half + 1; x++) if (g[Math.floor(H * 0.68)][x] !== '.') g[Math.floor(H * 0.68)][x] = 'M';
    // contour
    const out = g.map((row) => row.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== '.') continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== '.')) out[y][x] = 'K';
    }
    return pixelSVG(out, { C: color, c: '#ffffff55', E: '#ff2a4d', K: '#05060c', G: '#ffd34d', M: '#05060c' }, 'pix boss-sprite');
  }

  window.PERSONA = { CLASSES, RANK_COLORS, avatar, bossSprite, pixelSVG };
})();
