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
        if (this.grid[row][col] === 1) return true;
        for (const c of this.crushers) {
          const p0 = Math.floor(c.pos), p1 = p0 + c.length - 1;
          if (c.axis === 'v') { if (col === c.fixed && row >= p0 && row <= p1) return true; }
          else                { if (row === c.fixed && col >= p0 && col <= p1) return true; }
        }
        return false;
      },

      updateCrushers(dt, px, py) {
        let dmg = 0;
        for (const c of this.crushers) {
          c.pos += c.dir * c.speed * dt;
          if (c.pos <= c.min) { c.pos = c.min; c.dir = 1; }
          else if (c.pos >= c.max) { c.pos = c.max; c.dir = -1; }

          c.dmgCooldown = Math.max(0, c.dmgCooldown - dt);
          if (c.dmgCooldown <= 0) {
            const perp = c.axis === 'v' ? Math.abs(px - (c.fixed + 0.5)) : Math.abs(py - (c.fixed + 0.5));
            const par  = c.axis === 'v' ? py : px;
            if (perp < 0.72 && par >= c.pos - 0.4 && par <= c.pos + c.length + 0.4) {
              c.dmgCooldown = 0.75;
              dmg += 25;
            }
          }
        }
        return dmg;
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
