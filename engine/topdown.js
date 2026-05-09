const TopDown = (() => {
  const W = 640, H = 400;
  const TS = 16; // tile size in pixels

  let offscreen, ctx;

  function init() {
    offscreen = document.createElement('canvas');
    offscreen.width = W; offscreen.height = H;
    ctx = offscreen.getContext('2d');
  }

  function drawTile(cell, x, y) {
    if (cell === 0) {
      // Floor — dark stone with subtle grid
      ctx.fillStyle = '#363644';
      ctx.fillRect(x, y, TS, TS);
      ctx.strokeStyle = '#2a2a38';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);

      // Sparse vine details on floor tiles
      const hash = ((x / TS | 0) * 3 + (y / TS | 0) * 7) % 13;
      if (hash < 2) {
        ctx.strokeStyle = 'rgba(22, 58, 12, 0.72)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (hash === 0) {
          ctx.moveTo(x + 2, y + 9);
          ctx.quadraticCurveTo(x + 7, y + 4, x + 14, y + 11);
        } else {
          ctx.moveTo(x + 3, y + 2);
          ctx.quadraticCurveTo(x + 11, y + 7, x + 12, y + 14);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(30, 74, 16, 0.65)';
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (cell === 1) {
      // Wall — 3D raised block: drop shadow + face + highlights
      ctx.fillStyle = '#08080f';
      ctx.fillRect(x + 2, y + 2, TS, TS); // shadow

      ctx.fillStyle = '#7a8898';
      ctx.fillRect(x, y, TS, TS);          // main face

      ctx.fillStyle = '#b0c0d0';            // top-left highlights
      ctx.fillRect(x, y, TS, 2);
      ctx.fillRect(x, y, 2, TS);

      ctx.fillStyle = '#3a4858';            // bottom-right shadow edge
      ctx.fillRect(x, y + TS - 2, TS, 2);
      ctx.fillRect(x + TS - 2, y, 2, TS);

    } else if (cell === 8) {
      // Exit — glowing green portal
      ctx.fillStyle = '#004422';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#00cc55';
      ctx.fillRect(x + 1, y + 1, TS - 2, TS - 2);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x + 3, y + 3, TS - 6, TS - 6);
    }
  }

  function render(level, player, enemies, bullets, flashAlpha, fadeTiles = 12) {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    // Rotate view so player's facing direction points up on screen
    // angle=0 → facing right → rotate -90° so "right" becomes "up"
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-player.angle - Math.PI / 2);
    ctx.translate(-player.x * TS, -player.y * TS);

    // Draw all map tiles
    const rows = level.grid.length;
    const cols = level.grid[0] ? level.grid[0].length : 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        drawTile(level.grid[row][col], col * TS, row * TS);
      }
    }

    // Bullets
    ctx.fillStyle = '#ffee44';
    for (const b of bullets) {
      ctx.beginPath();
      ctx.arc(b.x * TS, b.y * TS, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.type === 'slime') {
        ctx.fillStyle = '#22cc44';
        ctx.strokeStyle = '#119933';
      } else {
        ctx.fillStyle = '#889999';
        ctx.strokeStyle = '#556677';
      }
      ctx.lineWidth = 1;
      const r = TS * 0.36 * (e.size || 1) * 0.7 + TS * 0.15;
      ctx.beginPath();
      ctx.arc(e.x * TS, e.y * TS, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Player — drawn in screen space so it never rotates with the camera
    const cx = W / 2, cy = H / 2;
    const s = TS * 0.46;
    ctx.fillStyle = '#44aaff';
    ctx.strokeStyle = '#aaddff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx,             cy - s);
    ctx.lineTo(cx - s * 0.65, cy + s * 0.72);
    ctx.lineTo(cx,             cy + s * 0.28);
    ctx.lineTo(cx + s * 0.65, cy + s * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lens vignette — gradient IS the vision; shrinks 0.05 tiles/sec
    const fadePx = Math.max(1, fadeTiles * TS);
    const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, fadePx);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Hit flash overlay
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(200,0,0,${flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }

    return offscreen;
  }

  return { init, render };
})();
