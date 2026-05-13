// ─── Constants ────────────────────────────────────────────────────────────────
const INTERNAL_W = 320, INTERNAL_H = 200;
const FLOOR_Y_2D = INTERNAL_H * 0.55;

const STATE = {
  MENU:        'MENU',
  PLAYING:     'PLAYING',
  PAUSED:      'PAUSED',
  BOSS_INTRO:  'BOSS_INTRO',
  BOSS_FIGHT:  'BOSS_FIGHT',
  WORLD_CLEAR: 'WORLD_CLEAR',
  DEATH_ANIM:  'DEATH_ANIM',
  GAME_OVER:   'GAME_OVER',
  WIN:         'WIN',
};

// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function resize() {
  const aspect    = INTERNAL_W / INTERNAL_H;
  const winAspect = window.innerWidth / window.innerHeight;
  if (winAspect > aspect) {
    canvas.height = window.innerHeight;
    canvas.width  = (window.innerHeight * aspect) | 0;
  } else {
    canvas.width  = window.innerWidth;
    canvas.height = (window.innerWidth / aspect) | 0;
  }
}
window.addEventListener('resize', resize);
resize();

// ─── Game state ───────────────────────────────────────────────────────────────
let state, prevState;
let devPanelOpen = false;
let devDeathIndex = 0;
let devBossIndex  = 0;
let devInvincible = false;
let devNoclip     = false;
let devNoDarkness = false;
let devSpeedMult  = 1.0;
let player, level, bullets, boss;
let levelIndex, worldIndex, levelInWorld;
let bossIntroTimer;
let worldClearTimer;
let vigFade;
let deathCause, deathTimer, lastGameOffscreen;
let flickerEvent = null;
let flickerCooldown = 8;
let ventAnim = null;
let teleSpot = null;
let teleCooldown = 0;
let grabState = null;

function startGame() {
  newRun();
  levelIndex    = 0;
  worldIndex    = 0;
  levelInWorld  = 0;
  flickerCooldown = 45;
  loadLevel(levelIndex);
  // Full HP is preserved across levels (no reset per-level)
  player.hp = Player.MAX_HP;
  setState(STATE.PLAYING);
}

function loadLevel(idx) {
  const def    = getLevelDef(idx);
  const speed  = WORLD_SPEEDS[def.worldIndex];
  level        = Level.build(def, speed);
  worldIndex   = def.worldIndex;
  levelInWorld = def.levelInWorld;
  bullets      = [];
  boss         = null;
  vigFade      = 20;
  flickerEvent = null;
  ventAnim = null;
  teleSpot = null;
  grabState = null;

  const sp = level.playerStart;
  if (!player) {
    player = Player.create(sp.x, sp.y, sp.angle);
  } else {
    // Keep HP, reset position only
    player.x     = sp.x;
    player.y     = sp.y;
    player.angle = sp.angle;
    player.vx = player.vy = 0;
    player.shootCooldown = 0;
    Input.clearJustPressed();
  }
}

function startBossFight() {
  boss    = Bosses.create(worldIndex);
  bullets = [];
  // Set up 2D player position
  player.x2d  = 40;
  player.y2d  = FLOOR_Y_2D;
  player.vy2d = 0;
  player.onGround = true;
  player.facing   = 1;
  player.shootCooldown = 0;
  Input.clearJustPressed();
}

function advanceLevel() {
  levelIndex++;
  if (levelIndex >= getTotalLevels()) {
    setState(STATE.WIN);
    return;
  }
  loadLevel(levelIndex);
  setState(STATE.PLAYING);
}

function setState(s) {
  state = s;
  if (s === STATE.BOSS_INTRO) {
    bossIntroTimer = 2.2;
    startBossFight();
    Audio.playBossMusic(worldIndex);
  }
  if (s === STATE.WORLD_CLEAR) {
    worldClearTimer = 0;
    if (player) player.hp = Player.MAX_HP;
    Audio.stopMusic();
    Audio.playWorldClear();
  }
  if (s === STATE.PLAYING)   Audio.playGameMusic(worldIndex);
  if (s === STATE.DEATH_ANIM) { deathTimer = 0; Audio.stopMusic(); Audio.playDeathSfx(deathCause); }
  if (s === STATE.GAME_OVER || s === STATE.WIN) Audio.stopMusic();
  if (s === STATE.MENU)      Audio.playMenuMusic();
  Input.clearJustPressed();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
TopDown.init();
Renderer2D.init();
Input.clearJustPressed();
state = STATE.MENU;
player = null;

// ─── Update ───────────────────────────────────────────────────────────────────
function update(dt) {
  Audio.resume();
  // Pause toggle
  if ((state === STATE.PLAYING || state === STATE.BOSS_FIGHT) && Input.wasPressed('Enter')) {
    prevState = state;
    state = STATE.PAUSED;
    return;
  }
  if (state === STATE.PAUSED && Input.wasPressed('Enter')) {
    devPanelOpen = false;
    state = prevState;
    return;
  }
  if (state === STATE.PAUSED && Input.wasPressed('KeyD')) {
    devPanelOpen = !devPanelOpen;
    return;
  }
  if (state === STATE.PAUSED && devPanelOpen) {
    const n = Screens.DEATH_NAMES.length;
    if (Input.wasPressed('ArrowLeft'))  { devDeathIndex = (devDeathIndex - 1 + n) % n; return; }
    if (Input.wasPressed('ArrowRight')) { devDeathIndex = (devDeathIndex + 1) % n;      return; }
    if (Input.wasPressed('KeyT')) {
      deathCause = Screens.DEATH_NAMES[devDeathIndex];
      devPanelOpen = false;
      setState(STATE.DEATH_ANIM);
      return;
    }
    if (Input.wasPressed('ArrowUp'))   { devBossIndex = (devBossIndex - 1 + 4) % 4; return; }
    if (Input.wasPressed('ArrowDown')) { devBossIndex = (devBossIndex + 1) % 4;      return; }
    if (Input.wasPressed('KeyB')) {
      worldIndex   = devBossIndex;
      levelInWorld = 4;
      levelIndex   = devBossIndex * 5 + 4;
      devPanelOpen = false;
      setState(STATE.BOSS_INTRO);
      return;
    }
    if (Input.wasPressed('KeyG')) {
      const allOn = devInvincible && devNoclip && devNoDarkness;
      devInvincible = devNoclip = devNoDarkness = !allOn;
      if (!allOn) devSpeedMult = 3.0; else devSpeedMult = 1.0;
      return;
    }
    if (Input.wasPressed('KeyK')) {
      if (prevState === STATE.PLAYING && level) level.enemies.forEach(e => { e.dead = true; });
      if (prevState === STATE.BOSS_FIGHT && boss) { boss.hp = 0; boss.dead = true; }
      return;
    }
    if (Input.wasPressed('KeyI')) { devInvincible = !devInvincible; return; }
    if (Input.wasPressed('KeyN')) { devNoclip     = !devNoclip;     return; }
    if (Input.wasPressed('KeyF')) { devNoDarkness = !devNoDarkness; return; }
    if (Input.wasPressed('BracketLeft'))  { devSpeedMult = Math.max(0.25, +(devSpeedMult - 0.25).toFixed(2)); return; }
    if (Input.wasPressed('BracketRight')) { devSpeedMult = Math.min(5.0,  +(devSpeedMult + 0.25).toFixed(2)); return; }
  }

  switch (state) {

    case STATE.MENU:
      if (Input.wasPressed('Space')) startGame();
      break;

    case STATE.PLAYING: {
      // Freeze player movement while inside vent animation or grabbed
      if (!ventAnim && !grabState) {
        player.devSpeedMult = devSpeedMult;
        if (devNoclip) {
          const origIsWall = level.isWall;
          level.isWall = () => false;
          Player.update3D(player, level, dt, bullets);
          level.isWall = origIsWall;
        } else {
          Player.update3D(player, level, dt, bullets);
        }
      }
      if (devInvincible) player.hp = Player.MAX_HP;

      // Update enemies (slimes split on death)
      const newEnemies = [];
      for (const e of level.enemies) {
        if (e.type === 'slime') {
          Slime.update(e, dt, player, level);
          if (e.dead) {
            const splits = Slime.splitSpawns(e);
            if (splits.length === 0) { vigFade = Math.min(20, vigFade + 0.5); Audio.playEnemyDeath(); }
            newEnemies.push(...splits);
          }
        } else if (e.type === 'zombie') {
          Zombie.update(e, dt, player, level);
          if (e.dead) { vigFade = Math.min(20, vigFade + 2); Audio.playEnemyDeath(); }
        }
      }
      level.enemies = level.enemies.filter(e => !e.dead).concat(newEnemies);

      // Update bullets
      for (const b of bullets) Bullet.update3D(b, dt, level, level.enemies);
      bullets = bullets.filter(b => !b.dead);

      // Moving crusher walls
      if (!grabState) level.updateCrushers(dt, player.x, player.y);

      // Grab detection and Space-spam escape
      if (!grabState) {
        const grabbed = !devInvincible && level.crusherNear(player.x, player.y);
        if (grabbed) grabState = { crusher: grabbed, presses: 0 };
      } else {
        if (Input.wasPressed('Space')) {
          grabState.presses++;
          if (grabState.presses >= 6) {
            const dx = player.x - grabState.crusher.x;
            const dy = player.y - grabState.crusher.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            player.vx = (dx / d) * 8;
            player.vy = (dy / d) * 8;
            grabState = null;
          }
        }
      }

      // Vent animation phases
      player.hiding = false;
      player.hideHole = null;
      if (ventAnim) {
        ventAnim.t += dt;
        player.hiding = true;
        player.hideHole = ventAnim.hole;
        if (ventAnim.phase === 'enter' && ventAnim.t >= 0.35) {
          ventAnim.phase = 'inside'; ventAnim.t = 0;
        }
        if (ventAnim.phase === 'inside') {
          // R — travel to nearest other vent
          if (Input.wasPressed('KeyR')) {
            const holes = level.holes || [];
            let nearest = null, nearestDist = Infinity;
            for (const h of holes) {
              if (h === ventAnim.hole) continue;
              const dx = h.x - ventAnim.hole.x, dy = h.y - ventAnim.hole.y;
              const d = dx * dx + dy * dy;
              if (d < nearestDist) { nearestDist = d; nearest = h; }
            }
            if (nearest) {
              ventAnim.hole = nearest;
              player.x = nearest.x;
              player.y = nearest.y;
            }
          }
          const figSweepDone = flickerEvent && flickerEvent.t >= 11.0;
          const manualExit = !flickerEvent && Input.wasPressed('KeyG');
          if (ventAnim.t >= 0.3 && (figSweepDone || manualExit)) {
            ventAnim.phase = 'exit'; ventAnim.t = 0;
          }
        }
        if (ventAnim.phase === 'exit' && ventAnim.t >= 0.35) {
          ventAnim = null;
        }
      }

      // Repel enemies from active vent
      if (player.hiding && player.hideHole) {
        for (const e of level.enemies) {
          if (e.dead) continue;
          const rdx = e.x - player.hideHole.x, rdy = e.y - player.hideHole.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
          if (rdist > 0 && rdist < 5) {
            const str = (5 - rdist) / 5 * 2.5;
            const rnx = e.x + (rdx / rdist) * str * dt;
            const rny = e.y + (rdy / rdist) * str * dt;
            if (!level.isWall(rnx, e.y)) e.x = rnx;
            if (!level.isWall(e.x, rny)) e.y = rny;
          }
        }
      }

      teleCooldown = Math.max(0, teleCooldown - dt);

      // Teleport spot — E sets it (free), E again teleports (20s cooldown after)
      if (Input.wasPressed('KeyE')) {
        if (!teleSpot && teleCooldown <= 0) {
          teleSpot = { x: player.x, y: player.y, angle: player.angle };
        } else if (teleSpot) {
          player.x = teleSpot.x; player.y = teleSpot.y; player.angle = teleSpot.angle;
          player.vx = player.vy = 0;
          teleSpot = null;
          teleCooldown = 20;
        }
      }

      // Figure event
      if (!level.isBossLevel && (level.holes || []).length > 0) {
        flickerCooldown = Math.max(0, flickerCooldown - dt);
        if (!flickerEvent && flickerCooldown <= 0) {
          const base = [27, 23, 18, 14][worldIndex] || 22;
          const jit  = [ 8,  5,  4,  3][worldIndex] ||  5;
          flickerCooldown = base + Math.random() * jit;
          flickerEvent = { t: 0, swept: false };
        }
      // G to enter nearest vent (any time)
      if (!ventAnim) {
        const nearHole = (level.holes || []).find(h => {
          const dx = h.x - player.x, dy = h.y - player.y;
          return dx*dx + dy*dy < 0.9*0.9;
        });
        if (Input.wasPressed('KeyG') && nearHole) {
          ventAnim = { phase: 'enter', t: 0, hole: nearHole };
        }
      }

        if (flickerEvent) {
          flickerEvent.t += dt;
          flickerEvent.hiding = player.hiding;
          if (flickerEvent.t >= 10 && !flickerEvent.swept) {
            flickerEvent.swept = true;
            vigFade = Math.min(20, vigFade + 5);
            if (!flickerEvent.hiding && !devInvincible) {
              deathCause = 'figure';
              flickerEvent = null;
              ventAnim = null;
              setState(STATE.DEATH_ANIM);
            }
          }
          if (flickerEvent && flickerEvent.t >= 11.5) flickerEvent = null;
        }
      }

      // Speed boost pickup
      if (level.collectBoost(player.x, player.y)) player.boostTimer = 4;

      if (devNoDarkness) vigFade = 20;
      else {
        const drainMult = (flickerEvent && flickerEvent.t < 10) ? 1.5 : 1;
        vigFade = Math.max(0, vigFade - Math.sqrt(vigFade) * 0.10 * drainMult * dt);
      }

      // Game over — check before exit so death can't be skipped by standing on exit
      if (!devInvincible) {
        if (player.hp <= 0) {
          deathCause = player.lastHitBy || 'darkness';
          setState(STATE.DEATH_ANIM);
        } else if (vigFade <= 0.5) {
          deathCause = 'darkness';
          setState(STATE.DEATH_ANIM);
        }
      }

      // Check exit tile (only if still alive)
      if (state === STATE.PLAYING && level.isExit(player.x, player.y)) {
        if (level.isBossLevel) {
          setState(STATE.BOSS_INTRO);
        } else {
          advanceLevel();
        }
      }
      break;
    }

    case STATE.BOSS_INTRO:
      bossIntroTimer -= dt;
      if (bossIntroTimer <= 0) setState(STATE.BOSS_FIGHT);
      break;

    case STATE.BOSS_FIGHT: {
      player.devSpeedMult = devSpeedMult;
      Player.update2D(player, dt, bullets, FLOOR_Y_2D, INTERNAL_W);
      if (devInvincible) player.hp = Player.MAX_HP;

      // Update boss
      if (boss && !boss.dead) {
        boss.update(dt, player);
      }

      // Update player bullets (2D)
      for (const b of bullets) Bullet.update2D(b, dt, boss, INTERNAL_W);
      bullets = bullets.filter(b => !b.dead);

      // Boss defeated
      if (boss && boss.dead) {
        setState(STATE.WORLD_CLEAR);
      }

      // Game over
      if (!devInvincible && player.hp <= 0) {
        const bossDeathCauses = ['slimeQueen', 'zombieKing', 'necromancer', 'darkOverlord'];
        deathCause = bossDeathCauses[worldIndex] || 'darkness';
        setState(STATE.DEATH_ANIM);
      }
      break;
    }

    case STATE.WORLD_CLEAR:
      worldClearTimer += dt;
      if (Input.wasPressed('Space') && worldClearTimer > 0.5) {
        advanceLevel();
      }
      break;

    case STATE.DEATH_ANIM:
      deathTimer += dt;
      if (deathTimer >= DeathAnim.DUR || (deathTimer > 0.5 && Input.wasPressed('Space'))) {
        setState(STATE.GAME_OVER);
      }
      break;

    case STATE.GAME_OVER:
      if (Input.wasPressed('Space')) {
        player = null;
        startGame();
      }
      break;

    case STATE.WIN:
      if (Input.wasPressed('Space')) {
        player = null;
        setState(STATE.MENU);
      }
      break;
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  ctx.imageSmoothingEnabled = false;
  let offscreen;

  switch (state) {

    case STATE.MENU: {
      const tmp = document.createElement('canvas');
      tmp.width = INTERNAL_W; tmp.height = INTERNAL_H;
      const tc = tmp.getContext('2d');
      Screens.drawMenu(tc);
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      return;
    }

    case STATE.PLAYING:
    case STATE.BOSS_INTRO: {
      const flash = state === STATE.PLAYING ? player.flashTimer : 0;
      offscreen = TopDown.render(level, player, level.enemies, bullets, flash, vigFade, flickerEvent, ventAnim, teleSpot);
      lastGameOffscreen = offscreen;
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
      if (player) {
        // HUD drawn on main canvas at scaled coords
        const scaleX = canvas.width  / INTERNAL_W;
        const scaleY = canvas.height / INTERNAL_H;
        ctx.save();
        ctx.scale(scaleX, scaleY);
        HUD.draw(ctx, player, worldIndex, levelInWorld, '3D', teleCooldown, level);
        if (grabState) {
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 80);
          const gvig = ctx.createRadialGradient(INTERNAL_W/2, INTERNAL_H/2, 0, INTERNAL_W/2, INTERNAL_H/2, INTERNAL_H * 0.7);
          gvig.addColorStop(0, 'rgba(200,0,0,0)');
          gvig.addColorStop(1, `rgba(200,0,0,${0.4 + pulse * 0.2})`);
          ctx.fillStyle = gvig;
          ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
          const bW = 80, bH = 6, bX = (INTERNAL_W - 80) / 2, bY = INTERNAL_H / 2 - 3;
          ctx.fillStyle = '#330000';
          ctx.fillRect(bX, bY, bW, bH);
          ctx.fillStyle = `rgba(255,60,60,${0.8 + pulse * 0.2})`;
          ctx.fillRect(bX, bY, (bW * grabState.presses / 6) | 0, bH);
          ctx.strokeStyle = '#ff4444';
          ctx.lineWidth = 1;
          ctx.strokeRect(bX - 0.5, bY - 0.5, bW + 1, bH + 1);
          ctx.fillStyle = `rgba(255,160,160,${0.7 + pulse * 0.3})`;
          ctx.font = 'bold 7px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${grabState.presses} / 6`, INTERNAL_W / 2, bY - 3);
          ctx.textAlign = 'left';
        }
        ctx.restore();
      }
      if (state === STATE.BOSS_INTRO) {
        const alpha = Math.max(0, Math.min(1, bossIntroTimer / 2.2));
        const tmp = document.createElement('canvas');
        tmp.width = INTERNAL_W; tmp.height = INTERNAL_H;
        Screens.drawBossIntro(tmp.getContext('2d'), worldIndex, alpha);
        ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      }
      return;
    }

    case STATE.BOSS_FIGHT: {
      offscreen = Renderer2D.render(boss, player, bullets, player.flashTimer, worldIndex);
      lastGameOffscreen = offscreen;
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
      // HUD
      const scaleX = canvas.width  / INTERNAL_W;
      const scaleY = canvas.height / INTERNAL_H;
      ctx.save();
      ctx.scale(scaleX, scaleY);
      HUD.draw(ctx, player, worldIndex, levelInWorld, '2D');
      ctx.restore();
      return;
    }

    case STATE.WORLD_CLEAR: {
      offscreen = Renderer2D.render(boss, player, [], 0, worldIndex);
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
      const tmp = document.createElement('canvas');
      tmp.width = INTERNAL_W; tmp.height = INTERNAL_H;
      Screens.drawWorldClear(tmp.getContext('2d'), worldIndex);
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      return;
    }

    case STATE.DEATH_ANIM: {
      const tmp = document.createElement('canvas');
      tmp.width = INTERNAL_W; tmp.height = INTERNAL_H;
      const tc = tmp.getContext('2d');
      if (lastGameOffscreen) tc.drawImage(lastGameOffscreen, 0, 0, INTERNAL_W, INTERNAL_H);
      DeathAnim.draw(tc, deathCause, deathTimer / DeathAnim.DUR);
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      return;
    }

    case STATE.GAME_OVER: {
      const tmp = document.createElement('canvas');
      tmp.width = INTERNAL_W; tmp.height = INTERNAL_H;
      const tc = tmp.getContext('2d');
      // Draw last seen view behind the overlay
      if (level) {
        const bg = TopDown.render(level, player, [], [], 0.6, vigFade);
        tc.drawImage(bg, 0, 0, INTERNAL_W, INTERNAL_H);
      }
      Screens.drawGameOver(tc, deathCause);
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      return;
    }

    case STATE.PAUSED: {
      if (lastGameOffscreen) ctx.drawImage(lastGameOffscreen, 0, 0, canvas.width, canvas.height);
      const tmp = document.createElement('canvas');
      tmp.width = INTERNAL_W; tmp.height = INTERNAL_H;
      const devInfo = devPanelOpen ? {
        hp:         player ? player.hp | 0 : 0,
        maxHp:      Player.MAX_HP,
        world:      worldIndex,
        level:      levelInWorld,
        enemies:    level ? level.enemies.filter(e => !e.dead).length : 0,
        px:         player ? player.x.toFixed(1) : 0,
        py:         player ? player.y.toFixed(1) : 0,
        vig:        vigFade ? vigFade.toFixed(2) : '—',
        bossHp:     boss ? `${boss.hp | 0}/${boss.maxHp}` : '—',
        deathIndex:  devDeathIndex,
        bossIndex:   devBossIndex,
        invincible:  devInvincible,
        noclip:      devNoclip,
        noDarkness:  devNoDarkness,
        speedMult:   devSpeedMult,
      } : null;
      Screens.drawPaused(tmp.getContext('2d'), devInfo);
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      return;
    }

    case STATE.WIN: {
      const tmp = document.createElement('canvas');
      tmp.width = INTERNAL_W; tmp.height = INTERNAL_H;
      Screens.drawWin(tmp.getContext('2d'));
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      return;
    }
  }
}

// ─── Loop ─────────────────────────────────────────────────────────────────────
let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = timestamp;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
