const Zombie = (() => {
  function create(x, y, worldSpeed) {
    return {
      x, y, type: 'zombie',
      hp: 125, maxHp: 125,
      speed: 1.0 * worldSpeed,
      dead: false,
      staggerTimer: 0,
      attackCooldown: 0,
      meleeDamage: 12,
    };
  }

  function update(z, dt, player, level) {
    if (z.dead) return;

    z.attackCooldown = Math.max(0, z.attackCooldown - dt);

    if (z.staggerTimer > 0) {
      z.staggerTimer -= dt;
      return;
    }

    // Move toward player
    const dx = player.x - z.x, dy = player.y - z.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;

    if (dist > 0.7) {
      const nx = z.x + (dx / dist) * z.speed * dt;
      const ny = z.y + (dy / dist) * z.speed * dt;
      if (!level.isWall(nx, z.y) && !level.isWall(nx, z.y + 0.2) && !level.isWall(nx, z.y - 0.2))
        z.x = nx;
      if (!level.isWall(z.x, ny) && !level.isWall(z.x + 0.2, ny) && !level.isWall(z.x - 0.2, ny))
        z.y = ny;
    }

    // Melee attack
    if (dist < 0.65 && z.attackCooldown === 0) {
      Player.takeDamage(player, z.meleeDamage, 'zombie');
      z.attackCooldown = 1.2;
    }
  }

  function takeDamage(z, amount) {
    z.hp -= amount;
    if (z.hp <= 0) { z.dead = true; return; }
    z.staggerTimer = 0.2;
  }

  return { create, update, takeDamage };
})();
