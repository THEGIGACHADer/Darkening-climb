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
      jumping: false,
      jumpTimer: 0,
      jumpScale: 1,
      jumpFrom: null, jumpOver: null, jumpTo: null,
    };
  }

  const JUMP_DUR = 0.9;   // total seconds per wall-hop animation
  const JUMP_MID = JUMP_DUR / 2;

  function _startJump(s, jumpOver, jumpTo) {
    s.jumping   = true;
    s.jumpTimer = 0;
    s.jumpScale = 1;
    s.jumpFrom  = { x: s.x, y: s.y };
    s.jumpOver  = jumpOver;
    s.jumpTo    = jumpTo;
    s.hopVx = s.hopVy = 0;
  }

  function update(s, dt, player, level) {
    if (s.dead) return;

    s.attackCooldown = Math.max(0, s.attackCooldown - dt);

    // ── Jump animation ────────────────────────────────────────────────────────
    if (s.jumping) {
      s.jumpTimer += dt;
      if (s.jumpTimer >= JUMP_DUR) {
        // Land
        s.x = s.jumpTo.x; s.y = s.jumpTo.y;
        s.jumping = false; s.jumpScale = 1;
        s.attackCooldown = Math.max(s.attackCooldown, 0.3);
      } else {
        const prog = s.jumpTimer / JUMP_DUR;
        if (s.jumpTimer < JUMP_MID) {
          const t = s.jumpTimer / JUMP_MID;
          const e = 1 - (1 - t) * (1 - t);           // ease-out: rise onto block
          s.x = s.jumpFrom.x + (s.jumpOver.x - s.jumpFrom.x) * e;
          s.y = s.jumpFrom.y + (s.jumpOver.y - s.jumpFrom.y) * e;
        } else {
          const t = (s.jumpTimer - JUMP_MID) / JUMP_MID;
          const e = t * t;                             // ease-in: slide off block
          s.x = s.jumpOver.x + (s.jumpTo.x - s.jumpOver.x) * e;
          s.y = s.jumpOver.y + (s.jumpTo.y - s.jumpOver.y) * e;
        }
        s.jumpScale = 1 + 0.55 * Math.sin(prog * Math.PI);  // swell then shrink
      }
      return;   // hitbox off, no new hops while mid-air
    }

    // ── Normal hop ────────────────────────────────────────────────────────────
    s.hopTimer -= dt;
    if (s.hopTimer <= 0) {
      s.hopTimer = s.hopInterval;
      const dx = player.x - s.x, dy = player.y - s.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const speed = 2.5 + s.size * 0.5;
      s.hopVx = (dx / dist) * speed;
      s.hopVy = (dy / dist) * speed;
    }

    const nx = s.x + s.hopVx * dt;
    const ny = s.y + s.hopVy * dt;

    // X movement — or animated jump over a 1-tile wall
    if (!level.isWall(nx, s.y) && !level.isWall(nx, s.y + 0.2) && !level.isWall(nx, s.y - 0.2) && !level.isHole(nx, s.y)) {
      s.x = nx;
    } else if (Math.abs(s.hopVx) > 1.0) {
      const dir = s.hopVx > 0 ? 1 : -1;
      const landX = nx + dir;
      if (!level.isWall(landX, s.y) && !level.isWall(landX, s.y + 0.2) && !level.isWall(landX, s.y - 0.2)) {
        const wc = Math.floor(nx);
        _startJump(s,
          { x: wc + 0.5, y: s.y },
          { x: dir > 0 ? wc + 1.5 : wc - 0.5, y: s.y });
      } else s.hopVx = 0;
    } else s.hopVx = 0;

    // Y movement — same animated jump, only if not already jumping from X
    if (!s.jumping) {
      if (!level.isWall(s.x, ny) && !level.isWall(s.x + 0.2, ny) && !level.isWall(s.x - 0.2, ny) && !level.isHole(s.x, ny)) {
        s.y = ny;
      } else if (Math.abs(s.hopVy) > 1.0) {
        const dir = s.hopVy > 0 ? 1 : -1;
        const landY = ny + dir;
        if (!level.isWall(s.x, landY) && !level.isWall(s.x + 0.2, landY) && !level.isWall(s.x - 0.2, landY)) {
          const wr = Math.floor(ny);
          _startJump(s,
            { x: s.x, y: wr + 0.5 },
            { x: s.x, y: dir > 0 ? wr + 1.5 : wr - 0.5 });
        } else s.hopVy = 0;
      } else s.hopVy = 0;
    }

    s.hopVx *= s.hopDecay;
    s.hopVy *= s.hopDecay;

    // Contact damage (only when not jumping)
    const pdx = player.x - s.x, pdy = player.y - s.y;
    if (!player.hiding && pdx*pdx + pdy*pdy < 0.5 * 0.5 && s.attackCooldown === 0) {
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
