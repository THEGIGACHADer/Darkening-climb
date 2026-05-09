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
      // Ceiling attack
      ceilingState: 'floor',   // 'floor'|'ascending'|'ceiling'|'drilling'|'returnUp'|'returnDn'
      ceilingPhaseT: 0,
      ceilingTimer: 8,
      drillHit: false,
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

      if (boss.ceilingState === 'floor') {
        // Bounce horizontally
        const spd = 40 + boss.phase * 15;
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

        // Trigger ceiling climb
        boss.ceilingTimer -= dt;
        if (boss.ceilingTimer <= 0) {
          boss.ceilingState = 'ascending';
          boss.ceilingPhaseT = 0;
        }

      } else if (boss.ceilingState === 'ascending') {
        boss.ceilingPhaseT += dt;
        const t = Math.min(1, boss.ceilingPhaseT / 0.4);
        const e = 1 - (1 - t) * (1 - t);          // ease-out
        boss.y = FLOOR_Y + (boss.h - FLOOR_Y) * e;
        if (t >= 1) {
          boss.y = boss.h;
          boss.ceilingState = 'ceiling';
          boss.ceilingPhaseT = 0;
        }

      } else if (boss.ceilingState === 'ceiling') {
        boss.ceilingPhaseT += dt;
        const hangDur = boss.phase === 1 ? 1.5 : boss.phase === 2 ? 1.2 : 0.9;
        // Slowly track player X
        const ceilSpd = 50 + boss.phase * 10;
        const tdx = player2d.x2d - boss.x;
        boss.x += Math.sign(tdx) * Math.min(Math.abs(tdx), ceilSpd * dt);
        boss.x = Math.max(boss.w * 0.6, Math.min(W2D - boss.w * 0.6, boss.x));
        if (boss.ceilingPhaseT >= hangDur) {
          boss.ceilingState = 'drilling';
          boss.drillHit = false;
        }

      } else if (boss.ceilingState === 'drilling') {
        boss.y += 280 * dt;
        if (!boss.drillHit) {
          const pdx = Math.abs(boss.x - player2d.x2d);
          const pdy = Math.abs(boss.y - player2d.y2d);
          if (pdx < boss.w * 0.5 + 5 && pdy < 20) {
            Player.takeDamage(player2d, 22);
            boss.drillHit = true;
          }
        }
        if (boss.y >= FLOOR_Y) {
          boss.y = FLOOR_Y;
          boss.squishY = 1;
          boss.ceilingState = 'returnUp';
          boss.ceilingPhaseT = 0;
        }

      } else if (boss.ceilingState === 'returnUp') {
        boss.ceilingPhaseT += dt;
        const t = Math.min(1, boss.ceilingPhaseT / 0.35);
        const e = 1 - (1 - t) * (1 - t);          // ease-out
        boss.y = FLOOR_Y + (boss.h - FLOOR_Y) * e;
        if (t >= 1) {
          boss.y = boss.h;
          boss.ceilingState = 'returnDn';
          boss.ceilingPhaseT = 0;
        }

      } else if (boss.ceilingState === 'returnDn') {
        boss.ceilingPhaseT += dt;
        const t = Math.min(1, boss.ceilingPhaseT / 0.55);
        const e = t * t;                            // ease-in
        boss.y = boss.h + (FLOOR_Y - boss.h) * e;
        if (t >= 1) {
          boss.y = FLOOR_Y;
          boss.ceilingState = 'floor';
          boss.ceilingTimer = boss.phase === 1 ? 9 : boss.phase === 2 ? 6 : 4;
        }
      }

      // Update projectiles (always)
      for (const p of boss.projectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 150 * dt;
        if (p.y > FLOOR_Y + 20) p.dead = true;
        const dx = p.x - player2d.x2d, dy = p.y - player2d.y2d;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 12 && !p.dead) {
          Player.takeDamage(player2d, 8);
          p.dead = true;
        }
      }
      boss.projectiles = boss.projectiles.filter(p => !p.dead);
    };
    boss.draw = (ctx) => {
      const cs = boss.ceilingState;
      const atCeiling = cs === 'ceiling';
      const drilling  = cs === 'drilling' || cs === 'returnUp';
      const inAir     = cs !== 'floor';

      const sy = boss.squishY;
      let w = boss.w + sy * 12, h = boss.h - sy * 7;
      if (atCeiling) { w = (boss.w * 1.25) | 0; h = (boss.h * 0.75) | 0; }
      else if (drilling) { w = (boss.w * 0.55) | 0; h = (boss.h * 1.7) | 0; }

      const bx = boss.x - w / 2, by = boss.y - h;

      // Flip upside-down when hanging at ceiling
      if (atCeiling) {
        ctx.save();
        const midY = boss.y - h / 2;
        ctx.translate(0, midY * 2);
        ctx.scale(1, -1);
      }

      ctx.fillStyle = '#00aa33';
      ctx.fillRect(bx + 2, by + 2, w - 4, h - 4);
      ctx.fillStyle = '#22ee55';
      ctx.fillRect(bx, by, w, h);
      ctx.fillStyle = '#55ff88';
      ctx.fillRect(bx + 4, by + 3, w / 3, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(bx + 7, by + h * 0.3, 6, 6);
      ctx.fillRect(bx + w - 13, by + h * 0.3, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(bx + 9, by + h * 0.3 + 2, 3, 3);
      ctx.fillRect(bx + w - 11, by + h * 0.3 + 2, 3, 3);

      if (atCeiling) ctx.restore();

      // Crown only on floor
      if (!inAir) {
        ctx.fillStyle = '#ffdd00';
        const cx = boss.x;
        ctx.beginPath();
        ctx.moveTo(cx - 12, by); ctx.lineTo(cx - 12, by - 6);
        ctx.lineTo(cx - 6,  by - 3); ctx.lineTo(cx, by - 9);
        ctx.lineTo(cx + 6,  by - 3); ctx.lineTo(cx + 12, by - 6);
        ctx.lineTo(cx + 12, by); ctx.fill();
      }

      // Drill spike when falling/returning up
      if (drilling) {
        ctx.fillStyle = '#55ff88';
        ctx.beginPath();
        ctx.moveTo(boss.x - 5, boss.y);
        ctx.lineTo(boss.x + 5, boss.y);
        ctx.lineTo(boss.x, boss.y + 14);
        ctx.closePath();
        ctx.fill();
      }

      // Dashed targeting line when hanging at ceiling
      if (atCeiling) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,255,100,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(boss.x, boss.y);
        ctx.lineTo(boss.x, FLOOR_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Projectile acid drops
      ctx.fillStyle = '#00ee44';
      for (const p of boss.projectiles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
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
    const HOVER_Y     = 30;                                 // Y balls hover at
    const HOVER_TIME  = 1.5;                                // seconds tracking player X
    const SMASH_SPEED = (FLOOR_Y - HOVER_Y) / 1.0;         // px/s — reaches floor in 1s

    const boss = {
      name: 'DARK OVERLORD',
      x: W2D / 2, y: FLOOR_Y,
      w: 56, h: 80,
      hp: 375, maxHp: 375,
      dead: false,
      phase: 1,
      t: 0,
      projectiles: [],
      shootCooldown: 1.8,   // wait before first volley
      shotsLeft: 0,
      shotGapTimer: 0,
      spikeTimer: 6,        // countdown to first spike attack
      spikes: [],
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

      // Drift toward player
      const bDx = player2d.x2d - boss.x;
      boss.x += (bDx > 0 ? 1 : -1) * 15 * boss.phase * dt;
      boss.x = Math.max(40, Math.min(W2D - 40, boss.x));

      // Firing state machine: fire one ball at a time, 0.1s apart
      if (boss.shotsLeft > 0) {
        boss.shotGapTimer -= dt;
        if (boss.shotGapTimer <= 0) {
          boss.projectiles.push({
            x: boss.x, y: boss.y - boss.h * 0.5,
            vy: -180,
            hoverTimer: HOVER_TIME,
            state: 'rising',   // 'rising' | 'hovering' | 'smashing'
            dead: false,
          });
          boss.shotsLeft--;
          if (boss.shotsLeft > 0) {
            boss.shotGapTimer = 0.1;
          } else {
            const cooldown = boss.phase === 1 ? 3.5 : boss.phase === 2 ? 2.5 : 1.5;
            boss.shootCooldown = cooldown;
          }
        }
      } else {
        boss.shootCooldown -= dt;
        if (boss.shootCooldown <= 0) {
          boss.shotsLeft   = 3 + boss.phase;  // 4 / 5 / 6
          boss.shotGapTimer = 0;
        }
      }

      // Update each ball through its lifecycle
      for (const p of boss.projectiles) {
        if (p.dead) continue;

        if (p.state === 'rising') {
          p.y += p.vy * dt;
          if (p.y <= HOVER_Y) {
            p.y = HOVER_Y;
            p.state = 'hovering';
          }
        } else if (p.state === 'hovering') {
          p.x = player2d.x2d;       // track player X
          p.hoverTimer -= dt;
          if (p.hoverTimer <= 0) p.state = 'smashing';   // lock X, fall
        } else if (p.state === 'smashing') {
          p.y += SMASH_SPEED * dt;
          if (p.y >= FLOOR_Y) { p.dead = true; continue; }
        }

        const pdx = p.x - player2d.x2d, pdy = p.y - player2d.y2d;
        if (Math.abs(pdx) < 10 && Math.abs(pdy) < 14 && !p.dead) {
          Player.takeDamage(player2d, 15);
          p.dead = true;
        }
      }
      boss.projectiles = boss.projectiles.filter(p => !p.dead);

      // Spike attack — warn → up → down, one sequence at a time
      if (boss.spikeTimer > 0) {
        boss.spikeTimer -= dt;
        if (boss.spikeTimer <= 0) {
          const count = 3 + boss.phase;     // 4 / 5 / 6 spikes
          const segW = (W2D - 40) / count;
          for (let i = 0; i < count; i++) {
            boss.spikes.push({
              x: 20 + segW * i + Math.random() * segW,
              state: 'warn',   // 'warn' | 'up' | 'down'
              t: 0,
              hit: false,
            });
          }
        }
      }

      for (const sp of boss.spikes) {
        sp.t += dt;
        if (sp.state === 'warn' && sp.t >= 0.55) { sp.state = 'up'; sp.t = 0; }
        else if (sp.state === 'up') {
          if (!sp.hit) {
            const prog = Math.min(1, sp.t / 0.28);
            const e = 1 - (1 - prog) * (1 - prog);
            const spikeTop = FLOOR_Y - e * 38;
            if (Math.abs(sp.x - player2d.x2d) < 9 && player2d.y2d >= spikeTop - 5) {
              Player.takeDamage(player2d, 18);
              sp.hit = true;
            }
          }
          if (sp.t >= 0.28) { sp.state = 'down'; sp.t = 0; }
        } else if (sp.state === 'down' && sp.t >= 0.22) {
          sp.state = 'done';
        }
      }

      boss.spikes = boss.spikes.filter(sp => sp.state !== 'done');
      if (boss.spikes.length === 0 && boss.spikeTimer <= 0) {
        boss.spikeTimer = boss.phase === 1 ? 8 : boss.phase === 2 ? 6 : 4;
      }
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
      // Armor body
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(bx, by + 20, boss.w, boss.h - 20);
      ctx.fillStyle = '#440044';
      ctx.fillRect(bx + 6, by + 24, boss.w - 12, 30);
      // Head
      ctx.fillStyle = '#222233';
      ctx.fillRect(bx + 10, by, boss.w - 20, 26);
      // Visor
      ctx.fillStyle = boss.phase === 3 ? '#ff0000' : '#aa00ff';
      ctx.fillRect(bx + 12, by + 8, boss.w - 24, 6);
      // Shoulders
      ctx.fillStyle = '#330033';
      ctx.fillRect(bx - 10, by + 20, 14, 20);
      ctx.fillRect(bx + boss.w - 4, by + 20, 14, 20);

      // Floor spikes
      for (const sp of boss.spikes) {
        if (sp.state === 'warn') {
          const alpha = 0.35 + 0.65 * (sp.t / 0.55);
          ctx.save();
          ctx.fillStyle = `rgba(255,30,0,${alpha})`;
          ctx.font = `bold ${7 + (sp.t / 0.55 * 3) | 0}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('!!!!', sp.x, FLOOR_Y - 4);
          ctx.fillStyle = `rgba(255,80,0,${alpha * 0.35})`;
          ctx.fillRect(sp.x - 8, FLOOR_Y - 2, 16, 3);
          ctx.restore();
        } else {
          let prog;
          if (sp.state === 'up') {
            prog = Math.min(1, sp.t / 0.28);
            prog = 1 - (1 - prog) * (1 - prog);   // ease-out rise
          } else {
            const f = Math.min(1, sp.t / 0.22);
            prog = (1 - f) * (1 - f);              // ease-in retract
          }
          const spikeH = prog * 38;
          const spikeTop = FLOOR_Y - spikeH;
          // Shaft
          ctx.fillStyle = '#550022';
          ctx.fillRect(sp.x - 4, spikeTop + 6, 8, spikeH);
          // Tip triangle
          ctx.fillStyle = '#ff1155';
          ctx.beginPath();
          ctx.moveTo(sp.x - 5, spikeTop + 7);
          ctx.lineTo(sp.x + 5, spikeTop + 7);
          ctx.lineTo(sp.x, spikeTop - 6);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Balls + warning lines
      for (const p of boss.projectiles) {
        if (p.state === 'hovering') {
          ctx.save();
          ctx.strokeStyle = `rgba(255,0,80,${0.25 + 0.35 * (1 - p.hoverTimer / HOVER_TIME)})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath(); ctx.moveTo(p.x, p.y + 8); ctx.lineTo(p.x, FLOOR_Y); ctx.stroke();
          ctx.restore();
        }
        const smashing = p.state === 'smashing';
        ctx.fillStyle = smashing ? '#ff4400' : '#9900ff';
        ctx.beginPath(); ctx.arc(p.x, p.y, smashing ? 8 : 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(p.x - 2, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      }
    };
    return boss;
  }

  const FACTORIES = [slimeQueen, zombieKing, necromancer, darkOverlord];

  return { create: (worldIdx) => FACTORIES[worldIdx]() };
})();
