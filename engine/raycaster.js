const Raycaster = (() => {
  const W = 320, H = 200;
  const PLANE_LEN = 0.66;

  let offscreen, ctx, imageData, zbuffer;

  function init() {
    offscreen = document.createElement('canvas');
    offscreen.width = W; offscreen.height = H;
    ctx = offscreen.getContext('2d');
    imageData = ctx.createImageData(W, H);
    zbuffer = new Float32Array(W);
  }

  function setPixel(data, x, y, r, g, b) {
    const i = (y * W + x) * 4;
    data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
  }

  function wallTexColor(side, hitX, dist) {
    const tx = Math.floor(hitX * 8) & 7;
    const isMortar = tx === 0 || tx === 4;
    let r, g, b;
    if (isMortar) { r = 120; g = 128; b = 142; }   // brighter mortar
    else {
      const v = 95 + (tx * 7) % 28;                 // brighter stone base
      r = v; g = v + 6; b = v + 16;
    }
    if (side === 1) { r = r * 0.72 | 0; g = g * 0.72 | 0; b = b * 0.72 | 0; }
    const shade = Math.min(1, 6.0 / dist);           // brighter falloff
    return [r * shade | 0, g * shade | 0, b * shade | 0];
  }

  // horizon = H/2 + pitch  (pitch>0 = look up = horizon shifts down = more ceiling visible)
  function render(level, player, enemies, bullets, flashAlpha) {
    const data = imageData.data;
    const pitch = player.pitch || 0;
    const horizonY = H / 2 + pitch;

    const dirX = Math.cos(player.angle), dirY = Math.sin(player.angle);
    const planeX = -dirY * PLANE_LEN, planeY = dirX * PLANE_LEN;

    // Ceiling (y < horizonY)
    const hSafe = horizonY > 0 ? horizonY : 1;
    for (let y = 0; y < Math.min(H, horizonY | 0); y++) {
      const shade = (40 + y * 45 / hSafe) | 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i]   = shade * 0.30 | 0;
        data[i+1] = shade * 0.33 | 0;
        data[i+2] = shade * 0.44 | 0;
        data[i+3] = 255;
      }
    }

    // Floor (y >= horizonY)
    const fSafe = H - horizonY > 0 ? H - horizonY : 1;
    for (let y = Math.max(0, horizonY | 0); y < H; y++) {
      const shade = (40 + (H - y) * 45 / fSafe) | 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i]   = shade * 0.52 | 0;
        data[i+1] = shade * 0.50 | 0;
        data[i+2] = shade * 0.46 | 0;
        data[i+3] = 255;
      }
    }

    // Cast rays
    zbuffer.fill(Infinity);
    for (let col = 0; col < W; col++) {
      const cameraX = 2 * col / W - 1;
      const rdx = dirX + planeX * cameraX;
      const rdy = dirY + planeY * cameraX;

      let mapX = player.x | 0, mapY = player.y | 0;
      const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
      let stepX, stepY, sdx, sdy;

      if (rdx < 0) { stepX = -1; sdx = (player.x - mapX) * ddx; }
      else          { stepX =  1; sdx = (mapX + 1 - player.x) * ddx; }
      if (rdy < 0) { stepY = -1; sdy = (player.y - mapY) * ddy; }
      else          { stepY =  1; sdy = (mapY + 1 - player.y) * ddy; }

      let hit = false, side = 0;
      for (let i = 0; i < 24 && !hit; i++) {
        if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; }
        else            { sdy += ddy; mapY += stepY; side = 1; }
        if (level.isRenderWall(mapX, mapY)) hit = true;
      }

      if (!hit) continue;

      const perpDist = side === 0
        ? (mapX - player.x + (1 - stepX) / 2) / rdx
        : (mapY - player.y + (1 - stepY) / 2) / rdy;

      zbuffer[col] = perpDist;
      const wallH = Math.min(H * 2, (H / perpDist) | 0);
      const wallTop = (horizonY - wallH / 2) | 0;

      const isExit = level.cellAt(mapX, mapY) === 8;
      let r, g, b;
      if (isExit) {
        // Glowing green exit door — bright and distance-independent so it's always visible
        const glow = Math.min(1, 3.5 / Math.max(0.4, perpDist));
        r = 0; g = (210 * glow) | 0; b = (120 * glow) | 0;
        // Add subtle horizontal stripe pattern
        // (applied per-row below)
      } else {
        const wallHit = side === 0
          ? player.y + perpDist * rdy
          : player.x + perpDist * rdx;
        const hitFrac = wallHit - Math.floor(wallHit);
        [r, g, b] = wallTexColor(side, hitFrac, perpDist);
      }

      const drawTop = Math.max(0, wallTop);
      const drawBot = Math.min(H, wallTop + wallH);
      for (let row = drawTop; row < drawBot; row++) {
        if (isExit) {
          // Stripe pattern on exit door for extra visibility
          const stripe = ((row - wallTop) / wallH * 6 | 0) % 2;
          setPixel(data, col, row, r, stripe ? g : g * 0.6 | 0, stripe ? b : b * 0.6 | 0);
        } else {
          setPixel(data, col, row, r, g, b);
        }
      }
    }

    // Sprites (enemies + bullets)
    const spriteList = [];
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = e.x - player.x, dy = e.y - player.y;
      spriteList.push({ x: e.x, y: e.y, dist: dx*dx + dy*dy, key: e.type });
    }
    for (const b of bullets) {
      const dx = b.x - player.x, dy = b.y - player.y;
      spriteList.push({ x: b.x, y: b.y, dist: dx*dx + dy*dy, key: 'bullet' });
    }
    spriteList.sort((a, b) => b.dist - a.dist);

    const invDet = 1.0 / (planeX * dirY - dirX * planeY);

    for (const s of spriteList) {
      const sx = s.x - player.x, sy = s.y - player.y;
      const tx = invDet * (dirY * sx - dirX * sy);
      const ty = invDet * (-planeY * sx + planeX * sy);
      if (ty <= 0.1) continue;

      const screenX = ((W / 2) * (1 + tx / ty)) | 0;
      const sprH = Math.min(H * 2, (H / ty) | 0);
      const sprW = sprH;
      // Sprites center at horizonY (pitch-aware)
      const cY = horizonY;
      const startY = Math.max(0, (cY - sprH / 2) | 0);
      const endY   = Math.min(H, (cY + sprH / 2) | 0);
      const startX = Math.max(0, (screenX - sprW / 2) | 0);
      const endX   = Math.min(W, (screenX + sprW / 2) | 0);
      const pixels = SPRITES[s.key];
      if (!pixels) continue;

      const shade = Math.min(1, 6.0 / ty);

      for (let sx2 = startX; sx2 < endX; sx2++) {
        if (ty >= zbuffer[sx2]) continue;
        const texX = Math.floor((sx2 - (screenX - sprW / 2)) / sprW * 16);
        for (let sy2 = startY; sy2 < endY; sy2++) {
          const texY = Math.floor((sy2 - (cY - sprH / 2)) / sprH * 16);
          const col = pixels[texY * 16 + texX];
          if (!col) continue;
          setPixel(data, sx2, sy2,
            ((col >> 16) & 0xff) * shade | 0,
            ((col >> 8)  & 0xff) * shade | 0,
            ( col        & 0xff) * shade | 0);
        }
      }
    }

    // Hit flash (screen-edge red glow, less intrusive in 3rd-person)
    if (flashAlpha > 0) {
      const a = flashAlpha * 0.6;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 160 * a | 0);
        data[i+1] = data[i+1] * (1 - a * 0.7) | 0;
        data[i+2] = data[i+2] * (1 - a * 0.7) | 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Third-person player model at bottom-center
    drawPlayerModel(ctx, W, H, pitch);

    // Crosshair (above player model, near center)
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1;
    const chY = H / 2 - 20; // slightly above center to clear player model
    ctx.beginPath();
    ctx.moveTo(W/2 - 5, chY); ctx.lineTo(W/2 + 5, chY);
    ctx.moveTo(W/2, chY - 5); ctx.lineTo(W/2, chY + 5);
    ctx.stroke();

    return offscreen;
  }

  function drawPlayerModel(ctx, W, H, pitch) {
    const cx = W / 2;
    const base = H - 2 + (pitch * 0.12) | 0;

    // Legs
    ctx.fillStyle = '#334455';
    ctx.fillRect(cx - 8, base - 18, 7, 18);
    ctx.fillRect(cx + 1, base - 18, 7, 18);
    // Boots
    ctx.fillStyle = '#223344';
    ctx.fillRect(cx - 9, base - 5, 8, 5);
    ctx.fillRect(cx + 1, base - 5, 9, 5);
    // Body armor
    ctx.fillStyle = '#445566';
    ctx.fillRect(cx - 11, base - 40, 22, 24);
    // Armor highlight strip
    ctx.fillStyle = '#556677';
    ctx.fillRect(cx - 9, base - 38, 18, 3);
    // Shoulders
    ctx.fillStyle = '#4a5f70';
    ctx.fillRect(cx - 17, base - 38, 8, 12);
    ctx.fillRect(cx + 9, base - 38, 8, 12);
    // Arms
    ctx.fillStyle = '#445566';
    ctx.fillRect(cx - 16, base - 29, 6, 13);
    ctx.fillRect(cx + 10, base - 29, 6, 13);
    // Helmet
    ctx.fillStyle = '#3a4a5a';
    ctx.fillRect(cx - 8, base - 54, 16, 16);
    // Helmet top rim
    ctx.fillStyle = '#2a3a4a';
    ctx.fillRect(cx - 9, base - 55, 18, 3);
    // Visor slit
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(cx - 6, base - 47, 12, 4);
    // Gun (right hand extending forward-right)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cx + 12, base - 23, 22, 5);
    ctx.fillStyle = '#111';
    ctx.fillRect(cx + 14, base - 19, 10, 7);
  }

  return { init, render };
})();
