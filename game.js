// ─── Constants ────────────────────────────────────────────────────────────────
const INTERNAL_W = 320, INTERNAL_H = 200;
const FLOOR_Y_2D = INTERNAL_H * 0.55;

const STATE = {
  MENU:        'MENU',
  PLAYING:     'PLAYING',
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
let state;
let player, level, bullets, boss;
let levelIndex, worldIndex, levelInWorld;
let bossIntroTimer;
let worldClearTimer;
let vigFade;
let deathCause, deathTimer, lastGameOffscreen;

function startGame() {
  levelIndex    = 0;
  worldIndex    = 0;
  levelInWorld  = 0;
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
  vigFade      = 12;

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
  }
  if (s === STATE.WORLD_CLEAR) {
    worldClearTimer = 0;
  }
  if (s === STATE.DEATH_ANIM) {
    deathTimer = 0;
  }
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
  switch (state) {

    case STATE.MENU:
      if (Input.wasPressed('Space')) startGame();
      break;

    case STATE.PLAYING: {
      Player.update3D(player, level, dt, bullets);

      // Update enemies (slimes split on death)
      const newEnemies = [];
      for (const e of level.enemies) {
        if (e.type === 'slime') {
          Slime.update(e, dt, player, level);
          if (e.dead) {
            const splits = Slime.splitSpawns(e);
            if (splits.length === 0) vigFade = Math.min(10, vigFade + 0.5);
            newEnemies.push(...splits);
          }
        } else if (e.type === 'zombie') {
          Zombie.update(e, dt, player, level);
          if (e.dead) vigFade = Math.min(10, vigFade + 2);
        }
      }
      level.enemies = level.enemies.filter(e => !e.dead).concat(newEnemies);

      // Update bullets
      for (const b of bullets) Bullet.update3D(b, dt, level, level.enemies);
      bullets = bullets.filter(b => !b.dead);

      // Check exit tile
      if (level.isExit(player.x, player.y)) {
        if (level.isBossLevel) {
          setState(STATE.BOSS_INTRO);
        } else {
          advanceLevel();
        }
      }

      vigFade = Math.max(0, vigFade - Math.sqrt(vigFade) * 0.17 * dt);

      // Game over
      if (player.hp <= 0) {
        deathCause = player.lastHitBy || 'darkness';
        setState(STATE.DEATH_ANIM);
      } else if (vigFade <= 0.5) {
        deathCause = 'darkness';
        setState(STATE.DEATH_ANIM);
      }
      break;
    }

    case STATE.BOSS_INTRO:
      bossIntroTimer -= dt;
      if (bossIntroTimer <= 0) setState(STATE.BOSS_FIGHT);
      break;

    case STATE.BOSS_FIGHT: {
      Player.update2D(player, dt, bullets, FLOOR_Y_2D, INTERNAL_W);

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
      if (player.hp <= 0) {
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
      offscreen = TopDown.render(level, player, level.enemies, bullets, flash, vigFade);
      lastGameOffscreen = offscreen;
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
      if (player) {
        // HUD drawn on main canvas at scaled coords
        const scaleX = canvas.width  / INTERNAL_W;
        const scaleY = canvas.height / INTERNAL_H;
        ctx.save();
        ctx.scale(scaleX, scaleY);
        HUD.draw(ctx, player, worldIndex, levelInWorld, '3D');
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
      offscreen = Renderer2D.render(boss, player, bullets, player.flashTimer);
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
      offscreen = Renderer2D.render(boss, player, [], 0);
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
      Screens.drawGameOver(tc);
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
