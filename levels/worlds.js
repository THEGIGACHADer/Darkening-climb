// Procedural level generator — 4 worlds × 5 levels = 20 levels
// Interior: 80 cols × 60 rows inside '#' border walls

const WORLD_SPEEDS = [1.0, 1.2, 1.4, 1.8];

const _IW = 40, _IH = 30;
const _LW = 24, _LH = 18; // layout template size (obstacles placed in sub-grids)

// ─── Seeded LCG RNG ──────────────────────────────────────────────────────────
let _seeds = null;

function newRun() {
  _seeds = Array.from({length: 20}, () => Math.random() * 0xFFFFFF | 0);
}

function _mkRng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2**32; };
}

// ─── Grid utilities ──────────────────────────────────────────────────────────
function _blank() {
  return Array.from({length: _IH}, () => Array(_IW).fill('.'));
}

function _set(g, c, r, ch) {
  const rows = g.length, cols = g[0] ? g[0].length : 0;
  if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = ch;
}

function _solidRect(g, c, r, w, h) {
  for (let dr = 0; dr < h; dr++)
    for (let dc = 0; dc < w; dc++)
      _set(g, c+dc, r+dr, '#');
}

function _hollowRect(g, c, r, w, h) {
  if (w < 2 || h < 2) { _solidRect(g, c, r, w, h); return; }
  for (let dc = 0; dc < w; dc++) {
    _set(g, c+dc, r, '#'); _set(g, c+dc, r+h-1, '#');
  }
  for (let dr = 1; dr < h-1; dr++) {
    _set(g, c, r+dr, '#'); _set(g, c+w-1, r+dr, '#');
  }
}

function _hwall(g, row, c1, c2) {
  for (let c = c1; c <= c2; c++) _set(g, c, row, '#');
}

function _vwall(g, col, r1, r2) {
  for (let r = r1; r <= r2; r++) _set(g, col, r, '#');
}

// Cut a gap in an already-placed wall row
function _gapH(g, row, c, len) {
  for (let i = 0; i < len; i++) _set(g, c+i, row, '.');
}

// Always clear player-start zone (top-left) and exit approach (bottom-right)
function _clearZones(g) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r][c] = '.';
  for (let r = _IH-3; r < _IH; r++) for (let c = _IW-3; c < _IW; c++) g[r][c] = '.';
}

// ─── Layout templates ────────────────────────────────────────────────────────
// All geometric, no random scattering, no labyrinths.
// diff: [min, max] on 0–19 (worldIndex*5 + levelInWorld).

const _LAYOUTS = [

  // ── Easy ─────────────────────────────────────────────────────────────────

  { id: 'lone_cross', diff: [0, 4],
    fn(g, rng) {
      // Small cross obstacle — one thing to dodge
      const cx = 9+(rng()*6|0), cy = 6+(rng()*6|0);
      _hwall(g, cy, cx-3, cx+3);
      _vwall(g, cx, cy-2, cy+2);
    }
  },

  { id: 'split_corridor', diff: [0, 6],
    fn(g, rng) {
      // One full-width wall with two deliberate gaps
      const row = 6+(rng()*5|0);
      const g1 = 2+(rng()*7|0), g2 = 14+(rng()*5|0);
      _hwall(g, row, 0, _IW-1);
      _gapH(g, row, g1, 3);
      _gapH(g, row, g2, 3);
    }
  },

  { id: 'twin_sym_blocks', diff: [1, 6],
    fn(g, rng) {
      // Two large solid blocks, mirrored left/right
      const sz = 4+(rng()*2|0), lc = 3+(rng()*2|0), r = 4+(rng()*6|0);
      _solidRect(g, lc, r, sz, sz);
      _solidRect(g, _IW-lc-sz, r, sz, sz);
    }
  },

  // ── Medium-easy ──────────────────────────────────────────────────────────

  { id: 'cross', diff: [2, 9],
    fn(g, rng) {
      // Plus-sign wall cluster
      const cx = 9+(rng()*5|0), cy = 6+(rng()*5|0);
      _hwall(g, cy, cx-(4+(rng()*3|0)), cx+(4+(rng()*3|0)));
      _vwall(g, cx, cy-(3+(rng()*3|0)), cy+(3+(rng()*3|0)));
    }
  },

  { id: 'box_room', diff: [3, 9],
    fn(g, rng) {
      // One hollow rectangular obstacle to navigate around
      const c = 5+(rng()*5|0), r = 3+(rng()*4|0);
      _hollowRect(g, c, r, Math.min(9+(rng()*5|0), _IW-c-2), Math.min(6+(rng()*4|0), _IH-r-2));
    }
  },

  { id: 'corner_fortresses', diff: [3, 9],
    fn(g, rng) {
      // Large solid blocks in top-right and bottom-left corners + center obstacle
      const sz = 4+(rng()*2|0);
      _solidRect(g, _IW-sz-1, 1, sz, sz);
      _solidRect(g, 1, _IH-sz-1, sz, sz);
      _solidRect(g, (_IW/2|0)-2, (_IH/2|0)-1, 4, 3);
    }
  },

  { id: 'staircase', diff: [3, 9],
    fn(g, rng) {
      // Stepped wall segments — clear staircase direction
      const sw = 5+(rng()*2|0);
      let c = 1+(rng()*3|0), r = 1+(rng()*2|0);
      for (let i = 0; i < 4+(rng()*2|0) && c+sw < _IW-1 && r+2 < _IH-1; i++) {
        _solidRect(g, c, r, sw, 2);
        c += sw-1; r += 3;
      }
    }
  },

  // ── Medium ───────────────────────────────────────────────────────────────

  { id: 'ring_pillars', diff: [4, 11],
    fn(g, rng) {
      // Ring of pillars around a center point
      const cx = 10+(rng()*4|0), cy = 7+(rng()*4|0), rad = 4+(rng()*2|0);
      const n = 10+(rng()*4|0);
      for (let i = 0; i < n; i++) {
        const a = i/n*Math.PI*2;
        _solidRect(g, Math.round(cx+Math.cos(a)*rad*1.4)-1, Math.round(cy+Math.sin(a)*rad)-1, 2, 2);
      }
    }
  },

  { id: 'twin_walls', diff: [4, 11],
    fn(g, rng) {
      // Two full-width horizontal walls with deliberate staggered gaps
      const r1 = 5+(rng()*2|0), r2 = 11+(rng()*2|0);
      const g1a = 2+(rng()*8|0), g1b = 13+(rng()*7|0);
      const g2a = 3+(rng()*7|0), g2b = 14+(rng()*6|0);
      _hwall(g, r1, 0, _IW-1); _gapH(g, r1, g1a, 3); _gapH(g, r1, g1b, 3);
      _hwall(g, r2, 0, _IW-1); _gapH(g, r2, g2a, 3); _gapH(g, r2, g2b, 3);
    }
  },

  { id: 't_barrier', diff: [5, 11],
    fn(g, rng) {
      // T-shaped wall — horizontal bar + vertical stem pointing toward exit
      const cx = 8+(rng()*7|0), cy = 4+(rng()*5|0);
      _hwall(g, cy, cx-(5+(rng()*3|0)), cx+(5+(rng()*3|0)));
      _vwall(g, cx, cy+1, cy+5+(rng()*4|0));
    }
  },

  { id: 'two_rooms', diff: [5, 12],
    fn(g, rng) {
      // Two hollow room obstacles with door gaps
      _hollowRect(g, 3, 2, 8, 6);
      _hollowRect(g, 13, 9, 8, 6);
      const d1 = 4+(rng()*4|0); g[2][d1] = '.'; g[2][d1+1] = '.';
      const d2 = 14+(rng()*4|0); g[14][d2] = '.'; g[14][d2+1] = '.';
    }
  },

  { id: 'column_hall', diff: [6, 12],
    fn(g, rng) {
      // Alternating top/bottom 2-wide columns creating clear corridors
      const n = 3+(rng()*2|0);
      const colH = 8+(rng()*5|0);
      for (let i = 1; i <= n; i++) {
        const col = (i * _IW / (n+1) | 0) - 1;
        const fromTop = (i % 2 === 0);
        const r = fromTop ? 0 : Math.max(0, _IH-colH);
        _solidRect(g, col, r, 2, Math.min(colH, _IH-r));
      }
    }
  },

  // ── Medium-hard ──────────────────────────────────────────────────────────

  { id: 'comb', diff: [6, 13],
    fn(g, rng) {
      // Alternating top/bottom prongs — dodge left-right
      const sp = 4+(rng()*2|0), len = 6+(rng()*3|0);
      for (let c = sp; c < _IW-2; c += sp) {
        const top = (Math.floor(c/sp) % 2 === 0);
        _solidRect(g, c, top ? 0 : _IH-len, 2, len);
      }
    }
  },

  { id: 'gauntlet', diff: [7, 14],
    fn(g, rng) {
      // Three full-width walls, one gap each, staggered sides
      const rows = [4, 9, 14];
      const sides = ['left', 'right', 'left'];
      for (let i = 0; i < 3; i++) {
        const left = sides[i] === 'left';
        const gp = left ? 1+(rng()*8|0) : _IW-5-(rng()*8|0);
        _hwall(g, rows[i], 0, _IW-1);
        _gapH(g, rows[i], gp, 4);
      }
    }
  },

  { id: 'v_columns', diff: [9, 16],
    fn(g, rng) {
      // Three tall 2-wide vertical walls — corridors between them
      const cols = [5+(rng()*2|0), 11+(rng()*2|0), 17+(rng()*2|0)];
      const tops = [0, 5+(rng()*4|0), 1+(rng()*3|0)];
      const lens = [11+(rng()*4|0), 10+(rng()*4|0), 11+(rng()*4|0)];
      for (let i = 0; i < 3; i++)
        _solidRect(g, cols[i], tops[i], 2, Math.min(lens[i], _IH-tops[i]));
    }
  },

  // ── Hard ─────────────────────────────────────────────────────────────────

  { id: 'fortress', diff: [10, 17],
    fn(g, rng) {
      // Outer ring with 4 gaps + center obstacle
      const fc = 4, fr = 3, fw = 14, fh = 10;
      _hollowRect(g, fc, fr, fw, fh);
      const gc = fc+3+(rng()*7|0);
      g[fr][gc] = '.'; g[fr][gc+1] = '.';
      g[fr+fh-1][gc] = '.'; g[fr+fh-1][gc+1] = '.';
      g[fr+3][fc] = '.'; g[fr+4][fc] = '.';
      g[fr+3][fc+fw-1] = '.'; g[fr+4][fc+fw-1] = '.';
      _solidRect(g, fc+(fw/2|0)-1, fr+(fh/2|0)-1, 3, 2);
    }
  },

  { id: 'checkerboard', diff: [10, 17],
    fn(g, rng) {
      // Regular grid of 2×2 blocks — structured, predictable corridors
      const sc = 1+(rng()*3|0), sr = 1+(rng()*3|0);
      for (let r = sr; r+2 <= _IH-2; r += 5)
        for (let c = sc; c+2 <= _IW-2; c += 5)
          _solidRect(g, c, r, 2, 2);
    }
  },

  // ── Very hard ────────────────────────────────────────────────────────────

  { id: 'crucible', diff: [12, 19],
    fn(g, rng) {
      // Eight 2×2 anchor blocks in ring formation + center cross
      const cx = 11, cy = 8;
      for (const [dc, dr] of [[-8,-4],[-1,-5],[7,-4],[-9,0],[7,0],[-8,4],[-1,4],[6,4]])
        _solidRect(g, cx+dc, cy+dr, 2, 2);
      _hwall(g, cy, cx-2, cx+2);
      _vwall(g, cx, cy-2, cy+2);
    }
  },

  { id: 'double_gauntlet', diff: [13, 19],
    fn(g, rng) {
      // Six walls in 3 close pairs, gaps alternating left/right
      const rowPairs = [[3,5],[8,10],[13,15]];
      for (let i = 0; i < 3; i++) {
        const left = (i % 2 === 0);
        const gp = left ? 1+(rng()*6|0) : _IW-6-(rng()*6|0);
        for (const row of rowPairs[i]) {
          _hwall(g, row, 0, _IW-1);
          _gapH(g, row, gp, 4);
        }
      }
    }
  },

  { id: 'pillared_gauntlet', diff: [14, 19],
    fn(g, rng) {
      // Dense rows of 2×2 pillars, staggered — very tight corridors
      for (let r = 3; r < _IH-2; r += 4) {
        const off = (r/4|0)%2 * 2;
        for (let c = 1+off; c < _IW-2; c += 4) _solidRect(g, c, r, 2, 2);
      }
    }
  },
];

// ─── Hideout hole placement ──────────────────────────────────────────────────
// Divide map into a regular grid of zones; place one vent per zone.
function _placeHoles(g, rng) {
  const ZX = 8, ZY = 6;  // 48 zones → up to 46 vents (skip start + exit corners)
  const zW = _IW / ZX, zH = _IH / ZY;

  for (let zy = 0; zy < ZY; zy++) {
    for (let zx = 0; zx < ZX; zx++) {
      if (zy === 0 && zx === 0) continue;               // player start corner
      if (zy === ZY - 1 && zx === ZX - 1) continue;    // exit corner

      const r0 = Math.floor(zy * zH), r1 = Math.floor((zy + 1) * zH);
      const c0 = Math.floor(zx * zW), c1 = Math.floor((zx + 1) * zW);

      const cells = [];
      for (let r = r0; r < r1 && r < _IH; r++)
        for (let c = c0; c < c1 && c < _IW; c++)
          if (g[r][c] === '.') cells.push([r, c]);

      if (cells.length === 0) continue;
      const [r, c] = cells[rng() * cells.length | 0];
      g[r][c] = 'H';
    }
  }
}

// ─── Crusher placement ───────────────────────────────────────────────────────
function _placeCrushers(g, rng, worldIndex, levelInWorld) {
  if (levelInWorld === 4) return [];
  const count = 1 + (levelInWorld >= 2 ? 1 : 0);
  const cells = [];
  for (let r = 5; r < _IH - 5; r++)
    for (let c = 5; c < _IW - 5; c++)
      if (g[r][c] === '.' && !(r < 8 && c < 8))
        cells.push([r, c]);

  for (let i = cells.length - 1; i > 0; i--) {
    const j = rng() * (i + 1) | 0;
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const crushers = [];
  for (let i = 0; i < count && i < cells.length; i++) {
    const [r, c] = cells[i];
    // +1 for border offset, +0.5 to center within tile
    crushers.push({ x: c + 1.5, y: r + 1.5, speed: 1.8 + worldIndex * 0.35 });
  }
  return crushers;
}

// ─── Boost placement ─────────────────────────────────────────────────────────
function _placeBoosts(g, rng) {
  const cells = [];
  for (let r = 0; r < _IH; r++)
    for (let c = 0; c < _IW; c++)
      if (g[r][c] === '.' && !(r < 4 && c < 4) && !(r >= _IH - 4 && c >= _IW - 4))
        cells.push([r, c]);
  const count = 1 + (rng() < 0.55 ? 1 : 0);
  for (let i = 0; i < count && cells.length > 0; i++) {
    const idx = rng() * cells.length | 0;
    const [r, c] = cells.splice(idx, 1)[0];
    g[r][c] = 'B';
  }
}

// ─── Enemy placement ─────────────────────────────────────────────────────────
function _placeEnemies(g, rng, worldIndex, levelInWorld) {
  const cells = [];
  for (let r = 0; r < _IH; r++)
    for (let c = 0; c < _IW; c++)
      if (g[r][c] === '.' && !(r < 3 && c < 3) && !(r >= _IH-3 && c >= _IW-3))
        cells.push([r, c]);

  for (let i = cells.length-1; i > 0; i--) {
    const j = rng()*(i+1)|0;
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const lv = levelInWorld;
  let slimes = 0, zombies = 0;
  switch (worldIndex) {
    case 0: slimes  = 12+lv*2;  break;                      // 12–20
    case 1: zombies = 10+lv*2;  break;                      // 10–18
    case 2: slimes  = 8+lv*2;   zombies = 8+lv*2;  break;  // 8–16 each
    case 3: slimes  = 12+lv*3;  zombies = 10+lv*3; break;  // 12–24 + 10–22
  }

  let idx = 0;
  for (let i = 0; i < slimes  && idx < cells.length; i++, idx++) g[cells[idx][0]][cells[idx][1]] = 's';
  for (let i = 0; i < zombies && idx < cells.length; i++, idx++) g[cells[idx][0]][cells[idx][1]] = 'z';
}

// ─── Map assembly ─────────────────────────────────────────────────────────────
function _buildMap(g) {
  const border = '#'.repeat(_IW + 2);
  const rows = [border];
  for (let r = 0; r < _IH; r++)
    rows.push('#' + g[r].join('') + (r === _IH-1 ? 'e' : '#'));
  rows.push(border);
  return rows;
}

// ─── Public API ───────────────────────────────────────────────────────────────
function getLevelDef(levelIndex) {
  if (!_seeds) newRun();
  const worldIndex   = Math.floor(levelIndex / 5);
  const levelInWorld = levelIndex % 5;
  const difficulty   = worldIndex * 5 + levelInWorld;
  const rng          = _mkRng(_seeds[levelIndex]);

  const eligible = _LAYOUTS.filter(l => difficulty >= l.diff[0] && difficulty <= l.diff[1]);
  const layout   = eligible[rng() * eligible.length | 0];

  const g = _blank();
  // Scatter 3-5 layout instances across the larger map
  const nPasses = 3 + (rng() * 3 | 0);
  for (let p = 0; p < nPasses; p++) {
    const sub = Array.from({length: _LH}, () => Array(_LW).fill('.'));
    layout.fn(sub, rng);
    const offC = rng() * (_IW - _LW) | 0;
    const offR = rng() * (_IH - _LH) | 0;
    for (let r = 0; r < _LH; r++)
      for (let c = 0; c < _LW; c++)
        if (sub[r][c] === '#') _set(g, offC + c, offR + r, '#');
  }
  _clearZones(g);
  _placeHoles(g, rng);
  _placeEnemies(g, rng, worldIndex, levelInWorld);
  _placeBoosts(g, rng);

  return {
    worldIndex,
    levelInWorld,
    playerStart: { x: 1.5, y: 1.5, angle: 0 },
    map: _buildMap(g),
    crushers: _placeCrushers(g, rng, worldIndex, levelInWorld),
  };
}

function getTotalLevels() { return 20; }
