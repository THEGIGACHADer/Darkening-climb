const Renderer2D = (() => {
  const W = 320, H = 200;
  const FLOOR_Y = H * 0.55;
  const VP = { x: W / 2, y: FLOOR_Y };  // vanishing point

  let offscreen, ctx;

  function init() {
    offscreen = document.createElement('canvas');
    offscreen.width = W; offscreen.height = H;
    ctx = offscreen.getContext('2d');
  }

  function drawBackWall() {
    // Stone tile wall texture on the far back wall
    const grad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    grad.addColorStop(0, '#151520');
    grad.addColorStop(1, '#252535');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, FLOOR_Y);

    // Mortar grid (brick rows)
    ctx.strokeStyle = 'rgba(20,20,35,0.8)';
    ctx.lineWidth = 1;
    const tileH = 18, tileW = 28;
    for (let row = 0; row * tileH < FLOOR_Y; row++) {
      const y = row * tileH;
      const offset = (row % 2) * (tileW / 2);
      for (let col = -1; col * tileW < W + tileW; col++) {
        ctx.strokeRect(col * tileW + offset, y, tileW, tileH);
        // Slight stone fill variation
        const v = 30 + ((row * 7 + col * 13) % 14) | 0;
        ctx.fillStyle = `rgb(${v+10},${v+12},${v+20})`;
        ctx.fillRect(col * tileW + offset + 1, y + 1, tileW - 2, tileH - 2);
      }
    }
  }

  function drawPerspectiveFloor() {
    // Floor with gradient (near = lighter, far = darker)
    for (let y = FLOOR_Y | 0; y < H; y++) {
      const t = (y - FLOOR_Y) / (H - FLOOR_Y);
      const r = (30 + t * 35) | 0;
      const g = (28 + t * 30) | 0;
      const b = (25 + t * 28) | 0;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, W, 1);
    }

    // Converging grid lines (vanishing perspective)
    ctx.strokeStyle = 'rgba(80,65,55,0.5)';
    ctx.lineWidth = 1;
    // Radial lines to vanishing point
    const numRad = 12;
    for (let i = 0; i <= numRad; i++) {
      const bx = (i / numRad) * W;
      ctx.beginPath();
      ctx.moveTo(VP.x, VP.y);
      ctx.lineTo(bx, H);
      ctx.stroke();
    }
    // Horizontal lines with perspective spacing
    for (let i = 1; i <= 5; i++) {
      const t = Math.pow(i / 5, 1.6);
      const y = FLOOR_Y + t * (H - FLOOR_Y);
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function drawSideWalls() {
    // Left side wall receding toward vanishing point — gives depth
    ctx.fillStyle = '#0e0e1e';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W * 0.22, FLOOR_Y);
    ctx.lineTo(0, H);
    ctx.fill();
    // Left edge highlight
    ctx.fillStyle = '#181828';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W * 0.05, FLOOR_Y);
    ctx.lineTo(0, H);
    ctx.fill();

    // Right side wall
    ctx.fillStyle = '#0c0c1c';
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W * 0.78, FLOOR_Y);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.fillStyle = '#161626';
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W * 0.95, FLOOR_Y);
    ctx.lineTo(W, H);
    ctx.fill();
  }

  function drawTorches() {
    // Atmospheric torches on the back wall
    const positions = [W * 0.28, W * 0.72];
    for (const tx of positions) {
      const ty = FLOOR_Y * 0.55;
      // Wall bracket
      ctx.fillStyle = '#443322';
      ctx.fillRect(tx - 3, ty - 4, 6, 14);
      // Flame glow
      ctx.fillStyle = 'rgba(255,160,0,0.15)';
      ctx.beginPath();
      ctx.arc(tx, ty - 8, 12, 0, Math.PI * 2);
      ctx.fill();
      // Flame
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.arc(tx, ty - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffee44';
      ctx.beginPath();
      ctx.arc(tx, ty - 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer2D(p) {
    const x = p.x2d | 0, y = p.y2d | 0;
    const dir = p.facing;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#334455';
    ctx.fillRect(x - 5, y - 16, 4, 16);
    ctx.fillRect(x + 1, y - 16, 4, 16);

    // Body
    ctx.fillStyle = '#445566';
    ctx.fillRect(x - 7, y - 32, 14, 18);
    ctx.fillStyle = '#556677';
    ctx.fillRect(x - 6, y - 30, 12, 3);

    // Shoulder
    ctx.fillStyle = '#4a5f70';
    ctx.fillRect(x - 10, y - 30, 5, 8);
    ctx.fillRect(x + 5, y - 30, 5, 8);

    // Head
    ctx.fillStyle = '#3a4a5a';
    ctx.fillRect(x - 5, y - 42, 10, 12);
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(x - 4, y - 38, 8, 3);

    // Gun (points in facing direction)
    ctx.fillStyle = '#222';
    ctx.fillRect(x + dir * 6, y - 26, dir * 12, 4);
  }

  function render(boss, player2d, bullets, flashAlpha) {
    // 1. Back wall with stone texture
    drawBackWall();

    // 2. Perspective floor
    drawPerspectiveFloor();

    // 3. Side depth walls
    drawSideWalls();

    // 4. Atmosphere (torches)
    drawTorches();

    // 5. Boss
    if (boss) boss.draw(ctx, W, H);

    // 6. Player bullets
    ctx.fillStyle = '#ffcc00';
    for (const b of bullets) {
      ctx.fillRect(b.x | 0, b.y | 0, 4, 3);
    }

    // 7. Player
    drawPlayer2D(player2d);

    // 8. Hit flash
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(180,0,0,${flashAlpha * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 9. Boss HP bar
    if (boss) {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(20, 8, W - 40, 10);
      const pct = Math.max(0, boss.hp / boss.maxHp);
      const barColor = pct > 0.5 ? '#33dd55' : pct > 0.25 ? '#ffcc00' : '#dd2200';
      ctx.fillStyle = barColor;
      ctx.fillRect(20, 8, ((W - 40) * pct) | 0, 10);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 8, W - 40, 10);
      ctx.fillStyle = '#fff';
      ctx.font = '6px monospace';
      ctx.fillText(boss.name, 22, 16);
    }

    return offscreen;
  }

  return { init, render };
})();
