const Level = (() => {
  // Parse string map into a numeric grid and enemy spawn list
  function parse(def) {
    const grid = [];
    const enemySpawns = [];
    const boostPositions = [];
    const holePositions = [];
    let playerStart = def.playerStart;

    for (let row = 0; row < def.map.length; row++) {
      const line = def.map[row];
      const gridRow = [];
      for (let col = 0; col < line.length; col++) {
        const c = line[col];
        switch (c) {
          case '#': gridRow.push(1); break;
          case 's': gridRow.push(0); enemySpawns.push({ type: 'slime', x: col + 0.5, y: row + 0.5 }); break;
          case 'z': gridRow.push(0); enemySpawns.push({ type: 'zombie', x: col + 0.5, y: row + 0.5 }); break;
          case 'e': gridRow.push(8); break;
          case 'B': gridRow.push(0); boostPositions.push({ x: col + 0.5, y: row + 0.5 }); break;
          case 'H': gridRow.push(0); holePositions.push({ x: col + 0.5, y: row + 0.5 }); break;
          default:  gridRow.push(0);
        }
      }
      grid.push(gridRow);
    }

    return { grid, enemySpawns, boostPositions, holePositions, playerStart, worldIndex: def.worldIndex, levelInWorld: def.levelInWorld, crushers: def.crushers || [] };
  }

  function build(def, worldSpeed) {
    const data = parse(def);
    const ps = data.playerStart;
    const MIN_DIST_SQ = 4.5 * 4.5;
    const enemies = data.enemySpawns
      .filter(sp => {
        const dx = sp.x - ps.x, dy = sp.y - ps.y;
        return dx * dx + dy * dy >= MIN_DIST_SQ;
      })
      .map(sp => {
        if (sp.type === 'slime') return Slime.create(sp.x, sp.y, 2, worldSpeed);
        if (sp.type === 'zombie') return Zombie.create(sp.x, sp.y, worldSpeed);
      });

    return {
      grid: data.grid,
      enemies,
      boosts: data.boostPositions.slice(),
      holes: data.holePositions.slice(),
      crushers: data.crushers.map(c => Object.assign({}, c)),
      playerStart: data.playerStart,
      worldIndex: data.worldIndex,
      levelInWorld: data.levelInWorld,
      isBossLevel: data.levelInWorld === 4,

      isWall(x, y) {
        const col = Math.floor(x), row = Math.floor(y);
        if (row < 0 || row >= this.grid.length) return true;
        if (col < 0 || col >= this.grid[row].length) return true;
        return this.grid[row][col] === 1;
      },

      updateCrushers(dt, px, py) {
        for (const c of this.crushers) {
          const rowAligned = Math.abs(py - c.y) < 0.55;
          const colAligned = Math.abs(px - c.x) < 0.55;
          let vx = 0, vy = 0;
          if (rowAligned && this._axisLOS(c.x, c.y, px, c.y)) {
            vx = px - c.x;
          } else if (colAligned && this._axisLOS(c.x, c.y, c.x, py)) {
            vy = py - c.y;
          }
          if (vx !== 0 || vy !== 0) {
            const d = Math.sqrt(vx * vx + vy * vy) || 1;
            const nx = c.x + (vx / d) * c.speed * dt;
            const ny = c.y + (vy / d) * c.speed * dt;
            if (!this.isWall(nx, c.y)) c.x = nx;
            if (!this.isWall(c.x, ny)) c.y = ny;
          }
        }
      },

      _axisLOS(x1, y1, x2, y2) {
        const steps = Math.ceil((Math.abs(x2 - x1) + Math.abs(y2 - y1)) * 2);
        if (steps === 0) return true;
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          if (this.isWall(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
        }
        return true;
      },

      crusherNear(px, py) {
        for (const c of this.crushers) {
          const dx = c.x - px, dy = c.y - py;
          if (dx * dx + dy * dy < 0.55 * 0.55) return c;
        }
        return null;
      },

      // Used by raycaster: walls AND exits are visually solid
      isRenderWall(x, y) {
        const col = Math.floor(x), row = Math.floor(y);
        if (row < 0 || row >= this.grid.length) return true;
        if (col < 0 || col >= this.grid[row].length) return true;
        const cell = this.grid[row][col];
        return cell === 1 || cell === 8;
      },

      cellAt(x, y) {
        const col = Math.floor(x), row = Math.floor(y);
        if (row < 0 || row >= this.grid.length) return 1;
        if (col < 0 || col >= this.grid[row].length) return 1;
        return this.grid[row][col];
      },

      collectBoost(px, py) {
        for (let i = 0; i < this.boosts.length; i++) {
          const b = this.boosts[i];
          const dx = b.x - px, dy = b.y - py;
          if (dx * dx + dy * dy < 0.4 * 0.4) { this.boosts.splice(i, 1); return true; }
        }
        return false;
      },

      isExit(x, y) {
        const col = Math.floor(x), row = Math.floor(y);
        if (row < 0 || row >= this.grid.length) return false;
        if (col < 0 || col >= this.grid[row].length) return false;
        return this.grid[row][col] === 8;
      },

      isHole(x, y) {
        const col = Math.floor(x), row = Math.floor(y);
        for (const h of this.holes) {
          if (Math.floor(h.x) === col && Math.floor(h.y) === row) return true;
        }
        return false;
      },
    };
  }

  return { build };
})();
