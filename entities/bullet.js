const Bullet = (() => {
  const SPEED_3D = 4.2;  // tiles per second (banana speed — visibly lobbed)
  const SPEED_2D = 180;  // pixels per second

  function create3D(x, y, dirX, dirY) {
    return { x, y, vx: dirX * SPEED_3D, vy: dirY * SPEED_3D, is2D: false, dead: false };
  }

  function create2D(x, y, dir) {
    return { x, y, vx: dir * SPEED_2D, vy: 0, is2D: true, dead: false };
  }

  function update3D(b, dt, level, enemies) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (level.isWall(b.x, b.y)) { b.dead = true; return; }

    for (const e of enemies) {
      if (e.dead) continue;
      const dx = e.x - b.x, dy = e.y - b.y;
      if (dx*dx + dy*dy < 0.35 * 0.35) {
        // Call the correct module function based on enemy type
        if (e.type === 'slime')  Slime.takeDamage(e, 25);
        else if (e.type === 'zombie') Zombie.takeDamage(e, 25);
        b.dead = true;
        return;
      }
    }
  }

  function update2D(b, dt, boss, screenW) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x < 0 || b.x > screenW) { b.dead = true; return; }

    if (boss && !boss.dead) {
      const dx = b.x - boss.x, dy = b.y - boss.y;
      if (Math.abs(dx) < boss.w / 2 && Math.abs(dy) < boss.h / 2) {
        boss.takeDamage(25);
        b.dead = true;
      }
    }
  }

  return { create3D, create2D, update3D, update2D };
})();
