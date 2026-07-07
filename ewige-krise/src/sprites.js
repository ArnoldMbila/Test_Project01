/* =========================================================
 * EWIGE KRISE — Sprite-Engine
 * Alle Sprites werden prozedural aus Pixel-Maps generiert.
 * '.' = transparent, jeder andere Buchstabe = Palettenfarbe.
 * ========================================================= */

const SpriteFactory = (() => {

  function build(def, scale) {
    const rows = def.rows;
    const h = rows.length;
    const w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ') continue;
        const col = def.pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  }

  function flip(canvas) {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    const ctx = c.getContext('2d');
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, 0, 0);
    return c;
  }

  function silhouette(canvas, color) {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /* ---------------- HELDEN (16 x 24) ---------------- */

  // Kaiser Aurel — Lorbeerkranz, graues Haar, weiße Robe, Goldrüstung
  const AUREL = {
    pal: {
      S: '#9a9aa4', s: '#7c7c88', G: '#d9a72c', g: '#b3841c',
      F: '#e0b48a', d: '#3a3a44', W: '#f3eee2', w: '#d8d2c0',
      A: '#e3b93f', a: '#b8902a', B: '#8a5a30', N: '#6f4726'
    },
    rows: [
      '....SSSSSSSS....',
      '...SSSSSSSSSS...',
      '..SGGGGGGGGGGS..',
      '..SSFFFFFFFFSS..',
      '..SsFdFFFFdFsS..',
      '..SsFFFFFFFFsS..',
      '..SssFFFFFFssS..',
      '..SssWWWWWWssS..',
      '..SsWAAAAAAWsS..',
      '.SsWAAAAAAAAWsS.',
      '.SsWAAgAAgAAWsS.',
      '.SsWAAAAAAAAWsS.',
      '..sWWBBBBBBWWs..',
      '..wWWWWWWWWWWw..',
      '..wWWWWWWWWWWw..',
      '..wWWWWWWWWWWw..',
      '..wWWWWWWWWWWw..',
      '..wWWWWWWWWWWw..',
      '..wWWaAWWAawWw..',
      '...WWaAWWAaWW...',
      '...WWaAWWAaWW...',
      '....WaAWWAaW....',
      '....NNN..NNN....',
      '....NNN..NNN....'
    ]
  };

  // Prophet Elior — grauer Bart, dunkle Robe, brauner Mantel
  const ELIOR = {
    pal: {
      S: '#b9b4ab', s: '#8f8a80', F: '#caa07a', d: '#332f2c',
      D: '#3c3a40', e: '#2c2a30', B: '#5c452f', b: '#49361f',
      N: '#8a6a44'
    },
    rows: [
      '....SSSSSSSS....',
      '...SSSSSSSSSS...',
      '..SSFFFFFFFFSS..',
      '..SsFdFFFFdFsS..',
      '..SsFFFFFFFFsS..',
      '..SsSFFFFFFSsS..',
      '..SsSSSSSSSSsS..',
      '...sSSSSSSSSs...',
      '..BBDsSSSSsDBB..',
      '.BBbDDsSSsDDbBB.',
      '.BBbDDDssDDDbBB.',
      '.BBbDDDDDDDDbBB.',
      '.BBbDbbbbbbDbBB.',
      '.BBbDDDDDDDDbBB.',
      '.BBbDDDDDDDDbBB.',
      '.BBBbDDDDDDbBBB.',
      '..BBBbDDDDbBBB..',
      '..BBBBBBBBBBBB..',
      '..BBBBBBBBBBBB..',
      '..bBBBBBBBBBBb..',
      '...eeeeeeeeee...',
      '...eeeeeeeeee...',
      '....FF....FF....',
      '....NNN..NNN....'
    ]
  };

  // Seraph — weißes Lockenhaar, glühende Augen, weiße Robe, Silberschwert
  const SERAPH = {
    pal: {
      W: '#f4f1ea', w: '#dcd6c8', P: '#efe3d6', p: '#d9c8b6',
      G: '#f2c130', g: '#ffe98a', R: '#faf7ef', r: '#e4ddcc',
      V: '#c9ccd4', v: '#9aa0ac', H: '#b3841c'
    },
    rows: [
      '...WWWWWWWWWW...',
      '..WWWWWWWWWWWW..',
      '..WWPPPPPPPPWW..',
      'ggWPGgPPPPgGPWgg',
      '..WWPPPPPPPPWW..',
      '..WWpPPPPPPpWW..',
      '..WWWpPPPPpWWW..',
      '..WWWRRRRRRWWW..',
      '..WWRRRRRRRRWW..',
      '..WWRRRRRRRRWWV.',
      '..WWRRGGGGRRWWV.',
      '..WWRRRRRRRRWWV.',
      '..WWRRRRRRRRWHV.',
      '..WwRRRRRRRRwHV.',
      '..wRRRRRRRRRRwV.',
      '..wRRRRRRRRRRwV.',
      '..wRRRRRRRRRRwV.',
      '..wRRRRRRRRRRwV.',
      '..wRrRRRRRRrRwV.',
      '..wRrRRRRRRrRw..',
      '...rRRRRRRRRr...',
      '...rrRRRRRRrr...',
      '....pp....pp....',
      '...gpp....ppg...'
    ]
  };

  // Kade — schwarzes Haar, schwarzer Mantel, Rollkragen
  const KADE = {
    pal: {
      K: '#17171c', k: '#26262e', F: '#c98f62', d: '#151517',
      C: '#232329', c: '#2f2f38', L: '#111114'
    },
    rows: [
      '.....KKKKKK.....',
      '....KKKKKKKK....',
      '....KKKKKKKK....',
      '....kFFFFFFk....',
      '....FdFFFFdF....',
      '....FFFFFFFF....',
      '.....FFFFFF.....',
      '....KKKKKKKK....',
      '...CcKKKKKKcC...',
      '..CCcCCCCCCcCC..',
      '..CCcCCCCCCcCC..',
      '..CCcCCCCCCcCC..',
      '..CCcCkkkkCcCC..',
      '..CC.cCCCCc.CC..',
      '..CC.cCCCCc.CC..',
      '..FF.cCCCCc.FF..',
      '.....cCCCCc.....',
      '.....cCCCCc.....',
      '.....cCCCCc.....',
      '.....cCCCCc.....',
      '.....KK..KK.....',
      '.....KK..KK.....',
      '....LLL..LLL....',
      '....LLL..LLL....'
    ]
  };

  // Malik — Dreadlocks, schwarzes Langarmshirt, Uhr
  const MALIK = {
    pal: {
      L: '#241a12', l: '#38281a', M: '#8a5a38', m: '#744a2c',
      d: '#1e1410', K: '#1b1b20', k: '#26262e', V: '#c9ccd4',
      S: '#101013'
    },
    rows: [
      '....LLLLLLLL....',
      '...LLLLLLLLLL...',
      '..LLlMMMMMMlLL..',
      '..LlMdMMMMdMlL..',
      '..LlMMMMMMMMlL..',
      '..LlMMMMMMMMlL..',
      '..LLlMMMMMMlLL..',
      '..LL.MMMMMM.LL..',
      '..LLKKKKKKKKLL..',
      '..LkKKKKKKKKkL..',
      '..LkKKKKKKKKkL..',
      '..kKKkKKKKkKKk..',
      '..kKK.KKKK.KKk..',
      '..kKK.KKKK.KKk..',
      '..VKK.kKKk.KKV..',
      '..MM..kKKk..MM..',
      '......kKKk......',
      '.....KKkkKK.....',
      '.....KK..KK.....',
      '.....KK..KK.....',
      '.....KK..KK.....',
      '.....KK..KK.....',
      '....SSS..SSS....',
      '....SSS..SSS....'
    ]
  };

  /* ---------------- GEGNER ---------------- */

  // Heuschrecken-Schwarm (Rev 9) — gepanzertes Insekt (20 x 14)
  const HEUSCHRECKE = {
    pal: {
      G: '#7a8a2e', g: '#5c6a1e', A: '#c9a53a', a: '#a3832a',
      R: '#b03a2e', w: '#d9d4b8', d: '#26260f'
    },
    rows: [
      '......ww......ww....',
      '.....wwww....wwww...',
      '..A..wwwwwwwwwww....',
      '.AAA.GGGGGGGGGGg....',
      '.AaAGGgGGGGGGGGGg...',
      '..AGGRdGGAAAGGGGGg..',
      '..GGGRRGGAaAGGGGGGg.',
      '.GGgGGGGGAAAGGGGGGg.',
      '.GgGGGGGGGGGGGGGgg..',
      '..gGGgGGgGGgGGgg....',
      '...gg.gg.gg.gg......',
      '...g...g..g..g......',
      '..gg..gg..gg.gg.....',
      '....................'
    ]
  };

  // Aschekriecher — dunkle Bestie mit Glutaugen (20 x 14)
  const KRIECHER = {
    pal: {
      D: '#33302f', d: '#242120', E: '#e06428', e: '#8a3a14',
      g: '#4a4644', c: '#141212'
    },
    rows: [
      '....................',
      '.....DDDD...........',
      '....DDDDDD..DDD.....',
      '...DDEeDDDDDDDDDD...',
      '...DDEEDDDDDDDDDDD..',
      '..DDDDDDgDDgDDgDDD..',
      '..DdDDDDDDDDDDDDdD..',
      '..DdDDDDDDDDDDDDdD..',
      '...dDDDDDDDDDDDDd...',
      '...dDDdDDddDDdDDd...',
      '..dDD.dDD..dDD.dD...',
      '..cc...cc...cc..cc..',
      '..cc...cc...cc..cc..',
      '....................'
    ]
  };

  // Schattenwache — humanoider Schemen (16 x 24)
  const WACHE = {
    pal: {
      D: '#2a2438', d: '#1c1828', V: '#6a5a9a', v: '#463c6a',
      E: '#b46ae0', c: '#120e1c'
    },
    rows: [
      '.....DDDDDD.....',
      '....DDDDDDDD....',
      '....DDEDDEDD....',
      '....DDDDDDDD....',
      '.....DDDDDD.....',
      '....VVVVVVVV....',
      '...VVvVVVVvVV...',
      '..VVvVVVVVVvVV..',
      '..VvVVVVVVVVvV..',
      '..VvVVvvvvVVvV..',
      '..VvVVVVVVVVvV..',
      '..VvVVVVVVVVvV..',
      '..vVVVVVVVVVVv..',
      '..vVVVVVVVVVVv..',
      '..vDVVVVVVVVDv..',
      '...dVVVVVVVVd...',
      '...dVVVVVVVVd...',
      '...dvVVVVVVvd...',
      '....vvVVVVvv....',
      '....dvvvvvvd....',
      '.....dvvvvd.....',
      '.....ddddddd....',
      '......cc.cc.....',
      '.....ccc.ccc....'
    ]
  };

  // Gefallener Stern — brennender Sternenkern (18 x 18), Boss Kapitel 1
  const STERN = {
    pal: {
      F: '#f2a13a', f: '#e0742a', Y: '#ffe07a', y: '#ffc94a',
      D: '#4a2a1a', d: '#2e1a10', W: '#fff4d0'
    },
    rows: [
      '........YY........',
      '.......YyyY.......',
      '..F....YyyY....F..',
      '..fF..YyyyyY..Ff..',
      '...fFYyyyyyyYFf...',
      '....FyyYYYYyyF....',
      '..YYyyYWWWWYyyYY..',
      '.YyyyYWWDDWWYyyyY.',
      '.YyyyYWDddDWYyyyY.',
      '.YyyyYWDddDWYyyyY.',
      '.YyyyYWWDDWWYyyyY.',
      '..YYyyYWWWWYyyYY..',
      '....FyyYYYYyyF....',
      '...fFYyyyyyyYFf...',
      '..fF..YyyyyY..Ff..',
      '..F....YyyY....F..',
      '.......YyyY.......',
      '........YY........'
    ]
  };

  // Bestie aus der Tiefe — Boss Kapitel 2 (24 x 20)
  const BESTIE = {
    pal: {
      B: '#3a5a6a', b: '#2a4450', G: '#5a7a8a', g: '#48626e',
      R: '#c03a2e', Y: '#e0c05a', d: '#14202a', W: '#c8d8de'
    },
    rows: [
      '...Y....Y....Y....Y.....',
      '...YY..YY....YY..YY.....',
      '..BBBBBBBB..BBBBBBBB....',
      '..BRdBBBBB..BBBBBdRB....',
      '..BRRBBBBBBBBBBBBRRB....',
      '..BBBWWBBBBBBBBWWBBB....',
      '...BBBBBBBBBBBBBBBB.....',
      '..GBBBBBBBBBBBBBBBBG....',
      '.GGBBBbBBBBBBBBbBBBGG...',
      '.GgBBBBBBBBBBBBBBBBgG...',
      '.GgBBBBbbBBBBbbBBBBgG...',
      '.GgGBBBBBBBBBBBBBBGgG...',
      '..GgGBBBBBBBBBBBBGgG....',
      '..GgGGBBBBBBBBBBGGgG....',
      '...GgGGGBBBBBBGGGgG.....',
      '...bGGgGGGGGGGGgGGb.....',
      '..bbGG.bGGGGb.GGbb......',
      '..dd.dd.dddd.dd.dd......',
      '..dd.dd.d..d.dd.dd......',
      '........................'
    ]
  };

  // Der Drache — Endboss (26 x 22), rot mit sieben Kronenzacken
  const DRACHE = {
    pal: {
      R: '#a82a22', r: '#7e1e18', O: '#d0452a', Y: '#ffd44a',
      y: '#e0aa2a', d: '#2a0c0a', W: '#f0e6c8', g: '#521410'
    },
    rows: [
      '..Y..Y..Y..Y..Y..Y..Y.....',
      '..Yy.Yy.Yy.Yy.Yy.Yy.Yy....',
      '..RRRRRR..RRRRRR..RRRR....',
      '..RdWRRR..RRdWRR..RdWR....',
      '..RRRRRR..RRRRRR..RRRR....',
      '...RRRO....RROO....RRO....',
      '....RRO....RRO.....RRO....',
      '.....RRRRRRRRRRRRRRRO.....',
      '....RRRRRRRRRRRRRRRRRR....',
      '...RRrRRRRRRRRRRRRRrRRR...',
      '..RRrRROOOOOOOOOORRrRRRR..',
      '..RrRROyyyyyyyyyyORRrRRR..',
      '..RrRROyyyyyyyyyyORRrRRR..',
      '..RrRROOyyyyyyyyOORRrRRR..',
      '..RRrRRROOOOOOOORRRrRRR...',
      '...RRrRRRRRRRRRRRRrRRR....',
      '....RRrrRRRRRRRRrrRRR.....',
      '.....RRRRrrrrrrRRRR..R....',
      '....RRR.RRR..RRR.RRRRr....',
      '...RRr..RRr..RRr..RRr.....',
      '...gg...gg....gg...gg.....',
      '..ggg..ggg....ggg..ggg....'
    ]
  };

  /* ---------------- Registry ---------------- */

  const DEFS = {
    aurel: AUREL, elior: ELIOR, seraph: SERAPH, kade: KADE, malik: MALIK,
    heuschrecke: HEUSCHRECKE, kriecher: KRIECHER, wache: WACHE,
    stern: STERN, bestie: BESTIE, drache: DRACHE
  };

  const cache = {};

  function get(id, scale) {
    const key = id + '@' + scale;
    if (!cache[key]) {
      const base = build(DEFS[id], scale);
      cache[key] = {
        base,
        flipped: flip(base),
        white: silhouette(base, '#ffffff'),
        whiteFlipped: silhouette(flip(base), '#ffffff'),
        w: base.width,
        h: base.height
      };
    }
    return cache[key];
  }

  // Rohdaten (Palette + Pixel-Zeilen) — u. a. für die Voxel-Extrusion der 3D-Version
  function getDef(id) { return DEFS[id]; }

  return { get, getDef };
})();
