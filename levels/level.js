const Level = (() => {
  // Parse string map into a numeric grid and enemy spawn list
  function parse(def) {
    const grid = [];
    const enemySpawns = [];
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
          case 'e': gridRow.push(8); break;  // exit tile
          default:  gridRow.push(0);
        }
      }
      grid.push(gridRow);
    }

    return { grid, enemySpawns, playerStart, worldIndex: def.worldIndex, levelInWorld: def.levelInWorld };
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

      isExit(x, y) {
        const col = Math.floor(x), row = Math.floor(y);
        if (row < 0 || row >= this.grid.length) return false;
        if (col < 0 || col >= this.grid[row].length) return false;
        return this.grid[row][col] === 8;
      },
    };
  }

  return { build };
})();
