// Procedural level generator — 4 worlds × 5 levels = 20 levels
// Interior: 24 cols × 18 rows inside '#' border walls

const WORLD_SPEEDS = [1.0, 1.2, 1.4, 1.8];

const _IW = 24, _IH = 18;

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
  if (r >= 0 && r < _IH && c >= 0 && c < _IW) g[r][c] = ch;
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

// Always run after layout generation to keep start/exit clear
function _clearZones(g) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r][c] = '.';
  for (let r = _IH-3; r < _IH; r++) for (let c = _IW-3; c < _IW; c++) g[r][c] = '.';
}

// ─── Layout templates ────────────────────────────────────────────────────────
// diff: [min, max] on 0–19 scale (worldIndex*5 + levelInWorld)
// Templates with overlapping ranges ensure ≥3 choices at every difficulty.

const _LAYOUTS = [
  // ── Very easy ────────────────────────────────────────────────────────────
  { id: 'bare', diff: [0, 3],
    fn(g, rng) {
      _set(g, 9+(rng()*6|0), 6+(rng()*6|0), '#');
      if (rng() > 0.4) _set(g, 10+(rng()*5|0), 7+(rng()*5|0), '#');
    }
  },
  { id: 'lone_block', diff: [0, 5],
    fn(g, rng) {
      _solidRect(g, 7+(rng()*10|0), 4+(rng()*9|0), 2, 2);
    }
  },
  { id: 'scattered_pillars', diff: [0, 7],
    fn(g, rng) {
      const n = 4+(rng()*4|0);
      for (let i = 0; i < n; i++)
        _set(g, 4+(rng()*16|0), 2+(rng()*13|0), '#');
    }
  },
  // ── Easy ─────────────────────────────────────────────────────────────────
  { id: 'one_wall', diff: [1, 7],
    fn(g, rng) {
      const row = 5+(rng()*7|0);
      const g1 = 1+(rng()*9|0), g2 = 14+(rng()*6|0);
      for (let c = 0; c < _IW; c++)
        if (!(c >= g1 && c <= g1+2) && !(c >= g2 && c <= g2+2)) _set(g, c, row, '#');
    }
  },
  { id: 'twin_2x2', diff: [2, 8],
    fn(g, rng) {
      _solidRect(g, 4+(rng()*5|0), 3+(rng()*4|0), 2, 2);
      _solidRect(g, 14+(rng()*4|0), 10+(rng()*4|0), 2, 2);
    }
  },
  { id: 'cross', diff: [2, 9],
    fn(g, rng) {
      const cx = 9+(rng()*5|0), cy = 6+(rng()*5|0);
      _hwall(g, cy, cx-(3+(rng()*3|0)), cx+(3+(rng()*3|0)));
      _vwall(g, cx, cy-(2+(rng()*3|0)), cy+(2+(rng()*3|0)));
    }
  },
  { id: 'grid_pillars', diff: [2, 9],
    fn(g, rng) {
      const sc = 3+(rng()*3|0), sr = 2+(rng()*2|0);
      const nc = 3+(rng()*2|0), nr = 3;
      const gc = 5+(rng()*2|0), gr = 4+(rng()*2|0);
      for (let ir = 0; ir < nr; ir++)
        for (let ic = 0; ic < nc; ic++)
          _set(g, sc+ic*gc, sr+ir*gr, '#');
    }
  },
  // ── Medium-easy ──────────────────────────────────────────────────────────
  { id: 'box_room', diff: [3, 9],
    fn(g, rng) {
      const c = 5+(rng()*5|0), r = 3+(rng()*4|0);
      const w = Math.min(7+(rng()*5|0), _IW-c-2);
      const h = Math.min(5+(rng()*4|0), _IH-r-2);
      _hollowRect(g, c, r, w, h);
    }
  },
  { id: 'island_blocks', diff: [3, 10],
    fn(g, rng) {
      for (let i = 0, n = 3+(rng()*3|0); i < n; i++)
        _solidRect(g, 3+(rng()*16|0), 2+(rng()*12|0), 2+(rng()*2|0), 2+(rng()*2|0));
    }
  },
  { id: 'corner_blocks', diff: [3, 10],
    fn(g, rng) {
      _solidRect(g, _IW-(3+(rng()*2|0))-1, 1, 3+(rng()*2|0), 3+(rng()*2|0));
      _solidRect(g, 1, _IH-(3+(rng()*2|0))-1, 3+(rng()*2|0), 3+(rng()*2|0));
      if (rng() > 0.4) _solidRect(g, 10+(rng()*4|0), 6+(rng()*4|0), 2+(rng()*2|0), 2+(rng()*2|0));
    }
  },
  { id: 'ring_pillars', diff: [4, 11],
    fn(g, rng) {
      const cx = 10+(rng()*4|0), cy = 7+(rng()*4|0), rad = 4+(rng()*2|0);
      const n = 8+(rng()*4|0);
      for (let i = 0; i < n; i++) {
        const a = i/n*Math.PI*2;
        _set(g, Math.round(cx+Math.cos(a)*rad*1.4), Math.round(cy+Math.sin(a)*rad), '#');
      }
    }
  },
  // ── Medium ───────────────────────────────────────────────────────────────
  { id: 'twin_walls', diff: [4, 11],
    fn(g, rng) {
      const r1 = 5+(rng()*2|0), r2 = 11+(rng()*2|0);
      const g1a = 1+(rng()*9|0), g1b = 14+(rng()*6|0);
      const g2a = 2+(rng()*8|0), g2b = 14+(rng()*6|0);
      for (let c = 0; c < _IW; c++) {
        if (!(c>=g1a && c<=g1a+2) && !(c>=g1b && c<=g1b+2)) _set(g, c, r1, '#');
        if (!(c>=g2a && c<=g2a+2) && !(c>=g2b && c<=g2b+2)) _set(g, c, r2, '#');
      }
    }
  },
  { id: 'diagonal', diff: [4, 12],
    fn(g, rng) {
      const sc = 5+(rng()*6|0), sr = 1+(rng()*3|0);
      const len = 7+(rng()*5|0), dir = rng()<0.5?1:-1;
      for (let i = 0; i < len; i++) {
        _set(g, sc+i, sr+i*dir, '#');
        _set(g, sc+i, sr+i*dir+1, '#');
      }
    }
  },
  { id: 'zigzag', diff: [5, 12],
    fn(g, rng) {
      let r = 3+(rng()*4|0);
      for (let c = 1; c < _IW-1; c += 3) {
        for (let i = 0; i < 3 && c+i < _IW-1; i++) _set(g, c+i, r, '#');
        r += rng()<0.5 ? 3 : -3;
        r = Math.max(2, Math.min(_IH-3, r));
      }
    }
  },
  { id: 'two_rooms', diff: [5, 12],
    fn(g, rng) {
      _hollowRect(g, 3, 2, 8, 6);
      _hollowRect(g, 13, 9, 8, 6);
      const d1 = 4+(rng()*4|0); g[2][d1] = '.'; g[2][d1+1] = '.';
      const d2 = 14+(rng()*4|0); g[14][d2] = '.'; g[14][d2+1] = '.';
    }
  },
  // ── Medium-hard ──────────────────────────────────────────────────────────
  { id: 'comb', diff: [6, 13],
    fn(g, rng) {
      const sp = 4+(rng()*2|0), len = 5+(rng()*3|0);
      for (let c = sp; c < _IW-2; c += sp) {
        const top = (Math.floor(c/sp) % 2 === 0);
        for (let i = 0; i < len; i++) _set(g, c, top ? i : _IH-1-i, '#');
      }
    }
  },
  { id: 'gauntlet', diff: [7, 14],
    fn(g, rng) {
      for (const row of [4, 9, 14]) {
        const gp = 1+(rng()*(_IW-6)|0);
        for (let c = 0; c < _IW; c++)
          if (!(c>=gp && c<=gp+3)) _set(g, c, row, '#');
      }
    }
  },
  { id: 'maze_lite', diff: [8, 15],
    fn(g, rng) {
      const g1 = 1+(rng()*4|0);
      _hwall(g, 6, 0, 17+(rng()*3|0));
      g[6][g1] = '.'; g[6][g1+1] = '.';
      const g2 = 15+(rng()*4|0);
      _hwall(g, 12, 4+(rng()*4|0), _IW-1);
      if (g2+1 < _IW) { g[12][g2] = '.'; g[12][g2+1] = '.'; }
      _solidRect(g, 3+(rng()*3|0), 8+(rng()*2|0), 2, 2);
    }
  },
  // ── Hard ─────────────────────────────────────────────────────────────────
  { id: 'fortress', diff: [10, 17],
    fn(g, rng) {
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
  { id: 'dense_pillars', diff: [10, 17],
    fn(g, rng) {
      for (let r = 2; r < _IH-1; r += 2) {
        const off = (r/2|0)%2;
        for (let c = 2+off; c < _IW-1; c += 3) _set(g, c, r, '#');
      }
    }
  },
  { id: 'v_columns', diff: [9, 16],
    fn(g, rng) {
      const cols = [5+(rng()*2|0), 11+(rng()*2|0), 17+(rng()*2|0)];
      const starts = [1, 4+(rng()*3|0), 2+(rng()*2|0)];
      const lens   = [8+(rng()*4|0), 8+(rng()*4|0), 7+(rng()*4|0)];
      for (let i = 0; i < 3; i++) _vwall(g, cols[i], starts[i], starts[i]+lens[i]);
    }
  },
  // ── Very hard ────────────────────────────────────────────────────────────
  { id: 'spiral', diff: [12, 19],
    fn(g, rng) {
      _hollowRect(g, 2, 1, 18, 13);
      _hollowRect(g, 6, 5, 10, 6);
      // Outer gaps
      g[1][9] = '.'; g[1][10] = '.';
      g[13][9] = '.'; g[13][10] = '.';
      g[5][2] = '.'; g[6][2] = '.';
      g[5][19] = '.'; g[6][19] = '.';
      // Inner gaps
      const ig = 7+(rng()*4|0); g[5][ig] = '.'; g[10][ig] = '.';
      g[7][6] = '.'; g[8][15] = '.';
    }
  },
  { id: 'cross_maze', diff: [12, 19],
    fn(g, rng) {
      const g1 = 1+(rng()*5|0);
      _hwall(g, 5, 2, _IW-2); g[5][g1] = '.'; g[5][g1+1] = '.';
      const g2 = 15+(rng()*4|0);
      _hwall(g, 12, 1, _IW-2); if (g2+1<_IW) { g[12][g2] = '.'; g[12][g2+1] = '.'; }
      const vc = 9+(rng()*4|0), vg = 6+(rng()*3|0);
      _vwall(g, vc, 1, 16); g[vg][vc] = '.'; if (vg+1<_IH) g[vg+1][vc] = '.';
    }
  },
  { id: 'inner_fortress', diff: [14, 19],
    fn(g, rng) {
      _hollowRect(g, 2, 1, 18, 13);
      _hollowRect(g, 6, 5, 9, 5);
      g[1][8] = '.'; g[1][9] = '.';
      g[13][8] = '.'; g[13][9] = '.';
      g[5][2] = '.'; g[6][2] = '.';
      g[5][19] = '.'; g[6][19] = '.';
      g[5][9] = '.'; g[9][9] = '.';
      g[7][6] = '.'; g[8][14] = '.';
    }
  },
  { id: 'pillared_gauntlet', diff: [14, 19],
    fn(g, rng) {
      for (let r = 3; r < _IH-2; r += 4) {
        const off = (r/4|0)%2*2;
        for (let c = 1+off; c < _IW-1; c += 4) _solidRect(g, c, r, 2, 2);
      }
    }
  },
];

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
    case 0: slimes = 3+lv; break;
    case 1: zombies = 3+lv; break;
    case 2: slimes = 2+lv; zombies = 2+lv; break;
    case 3: slimes = 4+lv*2; zombies = 3+lv*2; break;
  }

  let idx = 0;
  for (let i = 0; i < slimes  && idx < cells.length; i++, idx++) g[cells[idx][0]][cells[idx][1]] = 's';
  for (let i = 0; i < zombies && idx < cells.length; i++, idx++) g[cells[idx][0]][cells[idx][1]] = 'z';
}

// ─── Map assembly ─────────────────────────────────────────────────────────────
function _buildMap(g) {
  const rows = ['##########################'];
  for (let r = 0; r < _IH; r++)
    rows.push('#' + g[r].join('') + (r === _IH-1 ? 'e' : '#'));
  rows.push('##########################');
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
  layout.fn(g, rng);
  _clearZones(g);
  _placeEnemies(g, rng, worldIndex, levelInWorld);

  return {
    worldIndex,
    levelInWorld,
    playerStart: { x: 1.5, y: 1.5, angle: 0 },
    map: _buildMap(g),
  };
}

function getTotalLevels() { return 20; }
