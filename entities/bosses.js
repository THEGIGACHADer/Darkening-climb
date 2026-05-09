const Bosses = (() => {
  const W2D = 320, H2D = 200;
  const FLOOR_Y = H2D * 0.55;

  // ─── Slime Queen ────────────────────────────────────────────────────────────
  function slimeQueen() {
    const boss = {
      name: 'SLIME QUEEN',
      x: W2D * 0.7, y: FLOOR_Y,
      w: 40, h: 30,
      hp: 300, maxHp: 300,
      dead: false,
      phase: 1,
      t: 0,
      projectiles: [],
      shootTimer: 0,
      bounceDir: 1,
      squishY: 0,
    };
    boss.takeDamage = (amt) => {
      boss.hp -= amt;
      Audio.playBossHit();
      if (boss.hp <= 0) boss.dead = true;
      boss.squishY = 1;
    };
    boss.update = (dt, player2d) => {
      boss.t += dt;
      boss.squishY = Math.max(0, boss.squishY - dt * 4);
      const pct = boss.hp / boss.maxHp;
      if (pct < 0.5) boss.phase = 2;
      if (pct < 0.25) boss.phase = 3;

      // Bounce horizontally
      const spd = 40 + (3 - boss.phase) * 0 + boss.phase * 15;
      boss.x += boss.bounceDir * spd * dt;
      if (boss.x > W2D - 40) boss.bounceDir = -1;
      if (boss.x < 40) boss.bounceDir = 1;

      // Shoot acid drops
      boss.shootTimer -= dt;
      const interval = boss.phase === 1 ? 2.0 : boss.phase === 2 ? 1.2 : 0.7;
      if (boss.shootTimer <= 0) {
        boss.shootTimer = interval;
        const count = boss.phase;
        for (let i = 0; i < count; i++) {
          const angle = -Math.PI / 2 + (i - (count - 1) / 2) * 0.4;
          boss.projectiles.push({
            x: boss.x, y: boss.y - boss.h,
            vx: Math.cos(angle) * 80,
            vy: Math.sin(angle) * 60,
            dead: false,
          });
        }
      }

      // Update projectiles
      for (const p of boss.projectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 150 * dt; // gravity on drops
        if (p.y > FLOOR_Y + 20) p.dead = true;

        // Hit player
        const dx = p.x - player2d.x2d, dy = p.y - player2d.y2d;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 12 && !p.dead) {
          Player.takeDamage(player2d, 8);
          p.dead = true;
        }
      }
      boss.projectiles = boss.projectiles.filter(p => !p.dead);
    };
    boss.draw = (ctx) => {
      const sy = boss.squishY;
      const w = boss.w + sy * 12, h = boss.h - sy * 7;
      const bx = boss.x - w / 2, by = boss.y - h;
      ctx.fillStyle = '#00aa33';
      ctx.fillRect(bx + 2, by + 2, w - 4, h - 4);
      ctx.fillStyle = '#22ee55';
      ctx.fillRect(bx, by, w, h);
      // Highlight
      ctx.fillStyle = '#55ff88';
      ctx.fillRect(bx + 4, by + 3, w / 3, 4);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(bx + 7, by + h * 0.3, 6, 6);
      ctx.fillRect(bx + w - 13, by + h * 0.3, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(bx + 9, by + h * 0.3 + 2, 3, 3);
      ctx.fillRect(bx + w - 11, by + h * 0.3 + 2, 3, 3);
      // Crown
      ctx.fillStyle = '#ffdd00';
      const cx = boss.x;
      ctx.beginPath();
      ctx.moveTo(cx - 12, by); ctx.lineTo(cx - 12, by - 6);
      ctx.lineTo(cx - 6,  by - 3); ctx.lineTo(cx, by - 9);
      ctx.lineTo(cx + 6,  by - 3); ctx.lineTo(cx + 12, by - 6);
      ctx.lineTo(cx + 12, by); ctx.fill();
    };
    return boss;
  }

  // ─── Zombie King ─────────────────────────────────────────────────────────────
  function zombieKing() {
    const boss = {
      name: 'ZOMBIE KING',
      x: W2D * 0.7, y: FLOOR_Y,
      w: 40, h: 72,
      hp: 400, maxHp: 400,
      dead: false,
      phase: 1,
      t: 0,
      projectiles: [],
      throwTimer: 0,
      chargeTimer: 0,
      charging: false,
      chargeDir: 0,
    };
    boss.takeDamage = (amt) => {
      boss.hp -= amt;
      Audio.playBossHit();
      if (boss.hp <= 0) boss.dead = true;
    };
    boss.update = (dt, player2d) => {
      boss.t += dt;
      const pct = boss.hp / boss.maxHp;
      if (pct < 0.5) boss.phase = 2;
      if (pct < 0.25) boss.phase = 3;

      // Throw gravestones
      boss.throwTimer -= dt;
      const throwInterval = boss.phase === 1 ? 3.0 : boss.phase === 2 ? 2.0 : 1.0;
      if (boss.throwTimer <= 0) {
        boss.throwTimer = throwInterval;
        const dx = player2d.x2d - boss.x;
        const vx = (dx > 0 ? 1 : -1) * (100 + boss.phase * 30);
        boss.projectiles.push({ x: boss.x, y: boss.y - 50, vx, vy: -120, dead: false, rot: 0 });
      }

      // Charge attack (phase 2+)
      if (boss.phase >= 2) {
        boss.chargeTimer -= dt;
        if (boss.chargeTimer <= 0 && !boss.charging) {
          boss.chargeTimer = 4.0;
          boss.charging = true;
          boss.chargeDir = player2d.x2d < boss.x ? -1 : 1;
        }
      }
      if (boss.charging) {
        boss.x += boss.chargeDir * 200 * dt;
        if (boss.x < 20 || boss.x > W2D - 20) {
          boss.charging = false;
          boss.chargeDir = 0;
        }
        const dx = boss.x - player2d.x2d, dy = (boss.y - 36) - player2d.y2d;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 36) {
          Player.takeDamage(player2d, 15);
        }
      } else {
        // Drift toward center
        boss.x += (W2D * 0.7 - boss.x) * 0.5 * dt;
      }

      // Update projectiles
      for (const p of boss.projectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        p.rot += 5 * dt;
        if (p.y > FLOOR_Y + 20) p.dead = true;
        const dx = p.x - player2d.x2d, dy = p.y - player2d.y2d;
        if (Math.abs(dx) < 12 && Math.abs(dy) < 14 && !p.dead) {
          Player.takeDamage(player2d, 18);
          p.dead = true;
        }
      }
      boss.projectiles = boss.projectiles.filter(p => !p.dead);
    };
    boss.draw = (ctx) => {
      const bx = boss.x - boss.w / 2, by = boss.y - boss.h;
      // Body
      ctx.fillStyle = boss.charging ? '#cc3333' : '#667788';
      ctx.fillRect(bx, by + 24, boss.w, boss.h - 24);
      // Head
      ctx.fillStyle = '#aabbcc';
      ctx.fillRect(bx + 8, by, boss.w - 16, 28);
      // Eyes
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(bx + 10, by + 8, 6, 6);
      ctx.fillRect(bx + boss.w - 16, by + 8, 6, 6);
      // Arms (outstretched if charging)
      ctx.fillStyle = '#557788';
      if (boss.charging) {
        const armDir = boss.chargeDir;
        ctx.fillRect(boss.x + armDir * 20, by + 28, armDir * 20, 10);
      } else {
        ctx.fillRect(bx - 14, by + 28, 14, 10);
        ctx.fillRect(bx + boss.w, by + 28, 14, 10);
      }
      // Crown
      ctx.fillStyle = '#cc8800';
      ctx.fillRect(bx + 5, by - 8, boss.w - 10, 10);
      ctx.fillRect(bx + 10, by - 16, 8, 10);
      ctx.fillRect(bx + boss.w - 18, by - 16, 8, 10);
      // Gravestones
      ctx.fillStyle = '#445566';
      for (const p of boss.projectiles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-7, -10, 14, 16);
        ctx.fillRect(-4, -16, 8, 8);
        ctx.restore();
      }
    };
    return boss;
  }

  // ─── Necromancer ──────────────────────────────────────────────────────────────
  function necromancer() {
    const boss = {
      name: 'NECROMANCER',
      x: W2D * 0.75, y: FLOOR_Y,
      w: 32, h: 60,
      hp: 350, maxHp: 350,
      dead: false,
      phase: 1,
      t: 0,
      projectiles: [],
      summonTimer: 0,
      floatOffset: 0,
      orbs: [],
    };
    boss.takeDamage = (amt) => {
      boss.hp -= amt;
      Audio.playBossHit();
      if (boss.hp <= 0) boss.dead = true;
    };
    boss.update = (dt, player2d) => {
      boss.t += dt;
      boss.floatOffset = Math.sin(boss.t * 2) * 8;
      const pct = boss.hp / boss.maxHp;
      if (pct < 0.5) boss.phase = 2;
      if (pct < 0.25) boss.phase = 3;

      // Orbit orb attack
      const orbCount = boss.phase;
      while (boss.orbs.length < orbCount) {
        boss.orbs.push({ angle: Math.random() * Math.PI * 2, r: 40, dead: false });
      }
      for (const o of boss.orbs) {
        o.angle += (2 + boss.phase * 0.5) * dt;
        const ox = boss.x + Math.cos(o.angle) * o.r;
        const oy = (boss.y - boss.h / 2 + boss.floatOffset) + Math.sin(o.angle) * o.r * 0.5;
        const dx = ox - player2d.x2d, dy = oy - player2d.y2d;
        if (dx*dx + dy*dy < 100) Player.takeDamage(player2d, 6 * dt);
      }

      // Projectile burst
      boss.summonTimer -= dt;
      const interval = boss.phase === 1 ? 2.5 : boss.phase === 2 ? 1.5 : 0.8;
      if (boss.summonTimer <= 0) {
        boss.summonTimer = interval;
        const count = 3 + boss.phase * 2;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          boss.projectiles.push({
            x: boss.x, y: boss.y - boss.h / 2 + boss.floatOffset,
            vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, dead: false,
          });
        }
      }

      for (const p of boss.projectiles) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > W2D || p.y < 0 || p.y > H2D) { p.dead = true; continue; }
        const dx = p.x - player2d.x2d, dy = p.y - player2d.y2d;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && !p.dead) {
          Player.takeDamage(player2d, 10);
          p.dead = true;
        }
      }
      boss.projectiles = boss.projectiles.filter(p => !p.dead);
    };
    boss.draw = (ctx) => {
      const by = boss.y - boss.h + boss.floatOffset;
      const bx = boss.x - boss.w / 2;
      // Robe
      ctx.fillStyle = '#1a0033';
      ctx.fillRect(bx - 4, by + 20, boss.w + 8, boss.h - 20);
      // Body
      ctx.fillStyle = '#2a0044';
      ctx.fillRect(bx, by + 20, boss.w, boss.h - 24);
      // Head
      ctx.fillStyle = '#ccbbaa';
      ctx.fillRect(bx + 6, by, boss.w - 12, 24);
      // Eyes (glowing purple)
      ctx.fillStyle = '#cc00ff';
      ctx.fillRect(bx + 8, by + 6, 5, 5);
      ctx.fillRect(bx + boss.w - 13, by + 6, 5, 5);
      // Staff
      ctx.fillStyle = '#554433';
      ctx.fillRect(boss.x + 14, by - 10, 4, boss.h + 10);
      ctx.fillStyle = '#cc00ff';
      ctx.beginPath();
      ctx.arc(boss.x + 16, by - 14, 7, 0, Math.PI * 2);
      ctx.fill();
      // Orbs
      for (const o of boss.orbs) {
        const ox = boss.x + Math.cos(o.angle) * o.r;
        const oy = (boss.y - boss.h / 2 + boss.floatOffset) + Math.sin(o.angle) * o.r * 0.5;
        ctx.fillStyle = '#8800ff';
        ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ee88ff';
        ctx.beginPath(); ctx.arc(ox, oy, 2, 0, Math.PI * 2); ctx.fill();
      }
      // Projectiles
      ctx.fillStyle = '#9900cc';
      for (const p of boss.projectiles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    };
    return boss;
  }

  // ─── Dark Overlord ────────────────────────────────────────────────────────────
  function darkOverlord() {
    const boss = {
      name: 'DARK OVERLORD',
      x: W2D / 2, y: FLOOR_Y,
      w: 56, h: 80,
      hp: 375, maxHp: 375,
      dead: false,
      phase: 1,
      t: 0,
      projectiles: [],
      beamTimer: 0,
      beamActive: false,
      beamX: 0, beamDur: 0,
      dashTimer: 3,
    };
    boss.takeDamage = (amt) => {
      boss.hp -= amt;
      Audio.playBossHit();
      if (boss.hp <= 0) boss.dead = true;
    };
    boss.update = (dt, player2d) => {
      boss.t += dt;
      const pct = boss.hp / boss.maxHp;
      if (pct < 0.66) boss.phase = 2;
      if (pct < 0.33) boss.phase = 3;

      // Drift toward player menacingly
      const dx = player2d.x2d - boss.x;
      boss.x += (dx > 0 ? 1 : -1) * 15 * boss.phase * dt;
      boss.x = Math.max(40, Math.min(W2D - 40, boss.x));

      // Spread shot
      boss.beamTimer -= dt;
      const interval = boss.phase === 1 ? 2.2 : boss.phase === 2 ? 1.4 : 0.85;
      if (boss.beamTimer <= 0) {
        boss.beamTimer = interval;
        const count = 4 + boss.phase * 2;
        for (let i = 0; i < count; i++) {
          const a = Math.PI + (i / (count - 1) - 0.5) * Math.PI * 1.2;
          boss.projectiles.push({
            x: boss.x, y: boss.y - boss.h * 0.5,
            vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, dead: false,
          });
        }
      }

      // Laser beam (phase 2+)
      if (boss.phase >= 2) {
        boss.dashTimer -= dt;
        if (boss.dashTimer <= 0) {
          boss.dashTimer = 4;
          boss.beamActive = true;
          boss.beamX = player2d.x2d;
          boss.beamDur = 0.8;
        }
        if (boss.beamActive) {
          boss.beamDur -= dt;
          if (boss.beamDur <= 0) boss.beamActive = false;
          if (Math.abs(player2d.x2d - boss.beamX) < 10 && player2d.onGround)
            Player.takeDamage(player2d, 14 * dt);
        }
      }

      for (const p of boss.projectiles) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 100 * dt;
        if (p.x < 0 || p.x > W2D || p.y > FLOOR_Y + 10) { p.dead = true; continue; }
        const dx2 = p.x - player2d.x2d, dy2 = p.y - player2d.y2d;
        if (Math.abs(dx2) < 8 && Math.abs(dy2) < 10 && !p.dead) {
          Player.takeDamage(player2d, 12);
          p.dead = true;
        }
      }
      boss.projectiles = boss.projectiles.filter(p => !p.dead);
    };
    boss.draw = (ctx) => {
      const bx = boss.x - boss.w / 2, by = boss.y - boss.h;
      // Aura
      const auraColor = boss.phase === 1 ? '40,0,60' : boss.phase === 2 ? '80,0,0' : '120,0,0';
      const grad = ctx.createRadialGradient(boss.x, boss.y - boss.h/2, 5, boss.x, boss.y - boss.h/2, 50);
      grad.addColorStop(0, `rgba(${auraColor},0.4)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(boss.x, boss.y - boss.h/2, 50, 0, Math.PI*2); ctx.fill();
      // Armor
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(bx, by + 20, boss.w, boss.h - 20);
      // Chest plate
      ctx.fillStyle = '#440044';
      ctx.fillRect(bx + 6, by + 24, boss.w - 12, 30);
      // Head
      ctx.fillStyle = '#222233';
      ctx.fillRect(bx + 10, by, boss.w - 20, 26);
      // Visor
      ctx.fillStyle = boss.phase === 3 ? '#ff0000' : '#aa00ff';
      ctx.fillRect(bx + 12, by + 8, boss.w - 24, 6);
      // Shoulder plates
      ctx.fillStyle = '#330033';
      ctx.fillRect(bx - 10, by + 20, 14, 20);
      ctx.fillRect(bx + boss.w - 4, by + 20, 14, 20);
      // Laser beam
      if (boss.beamActive) {
        ctx.strokeStyle = `rgba(255,0,0,${0.8 * (boss.beamDur / 0.8)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(boss.beamX, 0); ctx.lineTo(boss.beamX, FLOOR_Y);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      // Projectiles
      ctx.fillStyle = '#9900ff';
      for (const p of boss.projectiles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      }
    };
    return boss;
  }

  const FACTORIES = [slimeQueen, zombieKing, necromancer, darkOverlord];

  return { create: (worldIdx) => FACTORIES[worldIdx]() };
})();
