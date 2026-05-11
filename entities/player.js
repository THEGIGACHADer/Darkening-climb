const Player = (() => {
  const SPEED       = 3.0;
  const ROT_SPEED   = 2.2;
  const PITCH_SPEED = 120;  // pixels/sec
  const MAX_PITCH   = 70;
  const RADIUS      = 0.25;
  const SHOOT_CD    = 0.225;
  const RECOIL      = 0.5;
  const FRICTION    = 0.88;
  const MAX_HP      = 100;

  const JUMP_VEL = -220;
  const GRAVITY  = 500;
  const SPD_2D   = 80;

  function create(x, y, angle) {
    return {
      x, y, angle,
      vx: 0, vy: 0,
      pitch: 0,          // vertical look offset in pixels (+= look up)
      hp: MAX_HP,
      shootCooldown: 0,
      flashTimer: 0,
      facing: 1,
      lastHitBy: null,
      boostTimer: 0,
      y2d: 0, vy2d: 0, onGround: false, x2d: 0,
    };
  }

  function canMove(level, nx, ny) {
    const r = RADIUS;
    return !level.isWall(nx - r, ny - r) && !level.isWall(nx + r, ny - r) &&
           !level.isWall(nx - r, ny + r) && !level.isWall(nx + r, ny + r);
  }

  function update3D(p, level, dt, bullets) {
    // Horizontal rotation
    if (Input.isDown('ArrowLeft'))  p.angle -= ROT_SPEED * dt;
    if (Input.isDown('ArrowRight')) p.angle += ROT_SPEED * dt;

    // Vertical look (pitch): up arrow = look up = horizon shifts down = more ceiling visible
    if (Input.isDown('ArrowUp'))   p.pitch = Math.min( MAX_PITCH, p.pitch + PITCH_SPEED * dt);
    if (Input.isDown('ArrowDown')) p.pitch = Math.max(-MAX_PITCH, p.pitch - PITCH_SPEED * dt);

    const cos = Math.cos(p.angle), sin = Math.sin(p.angle);

    let mx = 0, my = 0;
    if (Input.isDown('KeyW')) { mx += cos; my += sin; }
    if (Input.isDown('KeyS')) { mx -= cos; my -= sin; }
    if (Input.isDown('KeyA')) { mx += sin; my -= cos; }
    if (Input.isDown('KeyD')) { mx -= sin; my += cos; }

    const mlen = Math.sqrt(mx*mx + my*my);
    if (mlen > 0) { mx /= mlen; my /= mlen; }

    const boosted = p.boostTimer > 0;
    const spd = (boosted ? SPEED * 2.5 : SPEED) * (p.devSpeedMult || 1);
    const dx = (mx * spd + p.vx) * dt;
    const dy = (my * spd + p.vy) * dt;
    const nx = p.x + dx, ny = p.y + dy;

    if (canMove(level, nx, p.y)) {
      p.x = nx;
    } else {
      p.vx = 0;
    }
    if (canMove(level, p.x, ny)) {
      p.y = ny;
    } else {
      p.vy = 0;
    }

    p.vx *= FRICTION;
    p.vy *= FRICTION;
    if (Math.abs(p.vx) < 0.01) p.vx = 0;
    if (Math.abs(p.vy) < 0.01) p.vy = 0;

    if (p.boostTimer > 0) p.boostTimer = Math.max(0, p.boostTimer - dt);

    p.shootCooldown = Math.max(0, p.shootCooldown - dt);
    if ((Input.wasPressed('Space') || Input.wasPressed('ArrowUp')) && p.shootCooldown === 0) shoot3D(p, bullets);

    p.flashTimer = Math.max(0, p.flashTimer - dt);
  }

  function shoot3D(p, bullets) {
    p.shootCooldown = SHOOT_CD;
    const dirX = Math.cos(p.angle), dirY = Math.sin(p.angle);
    bullets.push(Bullet.create3D(p.x + dirX * 0.4, p.y + dirY * 0.4, dirX, dirY));
    p.vx -= dirX * RECOIL;
    p.vy -= dirY * RECOIL;
    Audio.playShoot();
  }

  function update2D(p, dt, bullets, floorY, screenW) {
    const spd2d = SPD_2D * (p.devSpeedMult || 1);
    if (Input.isDown('KeyA')) { p.x2d -= spd2d * dt; p.facing = -1; }
    if (Input.isDown('KeyD')) { p.x2d += spd2d * dt; p.facing =  1; }

    if (Input.wasPressed('KeyW') && p.onGround) {
      p.vy2d = JUMP_VEL;
      p.onGround = false;
    }

    p.vy2d += GRAVITY * dt;
    p.y2d += p.vy2d * dt;

    if (p.y2d >= floorY) {
      p.y2d = floorY;
      p.vy2d = 0;
      p.onGround = true;
    } else {
      p.onGround = false;
    }

    p.x2d = Math.max(8, Math.min(screenW - 8, p.x2d));

    p.shootCooldown = Math.max(0, p.shootCooldown - dt);
    if (Input.wasPressed('Space') && p.shootCooldown === 0) shoot2D(p, bullets);

    p.flashTimer = Math.max(0, p.flashTimer - dt);
  }

  function shoot2D(p, bullets) {
    p.shootCooldown = SHOOT_CD;
    bullets.push(Bullet.create2D(p.x2d + p.facing * 12, p.y2d - 8, p.facing));
    p.x2d -= p.facing * 8;
    Audio.playShoot();
  }

  function takeDamage(p, amount, source) {
    p.hp = Math.max(0, p.hp - amount);
    p.flashTimer = 0.25;
    if (source) p.lastHitBy = source;
    Audio.playHit();
  }

  return { create, update3D, update2D, takeDamage, MAX_HP };
})();
