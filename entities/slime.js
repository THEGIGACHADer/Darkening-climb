const Slime = (() => {
  function create(x, y, size, worldSpeed) {
    // size: 1=small, 2=medium, 3=large
    const hp = size * 25;
    return {
      x, y, type: 'slime',
      hp, maxHp: hp, size,
      hopTimer: Math.random() * 1.2,
      hopInterval: 1.2 / worldSpeed,
      hopVx: 0, hopVy: 0,
      hopDecay: 0.85,
      dead: false,
      contactDamage: 8,
      attackCooldown: 0,
    };
  }

  function update(s, dt, player, level) {
    if (s.dead) return;

    s.attackCooldown = Math.max(0, s.attackCooldown - dt);
    s.hopTimer -= dt;

    // Hop toward player
    if (s.hopTimer <= 0) {
      s.hopTimer = s.hopInterval;
      const dx = player.x - s.x, dy = player.y - s.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const speed = 2.5 + s.size * 0.5;
      s.hopVx = (dx / dist) * speed;
      s.hopVy = (dy / dist) * speed;
    }

    // Apply hop movement with wall sliding
    const nx = s.x + s.hopVx * dt;
    const ny = s.y + s.hopVy * dt;
    if (!level.isWall(nx, s.y) && !level.isWall(nx, s.y + 0.2) && !level.isWall(nx, s.y - 0.2))
      s.x = nx;
    else s.hopVx = 0;
    if (!level.isWall(s.x, ny) && !level.isWall(s.x + 0.2, ny) && !level.isWall(s.x - 0.2, ny))
      s.y = ny;
    else s.hopVy = 0;

    s.hopVx *= s.hopDecay;
    s.hopVy *= s.hopDecay;

    // Contact damage
    const pdx = player.x - s.x, pdy = player.y - s.y;
    if (pdx*pdx + pdy*pdy < 0.5 * 0.5 && s.attackCooldown === 0) {
      Player.takeDamage(player, s.contactDamage, 'slime');
      s.attackCooldown = 0.8;
    }
  }

  function takeDamage(s, amount) {
    s.hp -= amount;
    if (s.hp <= 0) s.dead = true;
  }

  // Returns smaller slimes when a medium or large slime dies
  function splitSpawns(s) {
    if (s.size <= 1) return [];
    const newSize = s.size - 1;
    const offset = 0.4;
    return [
      create(s.x - offset, s.y, newSize, 1),
      create(s.x + offset, s.y, newSize, 1),
    ];
  }

  return { create, update, takeDamage, splitSpawns };
})();
