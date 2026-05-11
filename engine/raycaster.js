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

  // Per-world wall palette: [mortarR,mortarG,mortarB, stoneR,stoneG,stoneB]
  const WALL_PAL = [
    [90, 118, 80,   78, 100, 68],   // W0 Slime Caves — mossy green stone
    [118, 108, 90,  102,  92, 72],  // W1 Zombie Graveyard — warm grey-brown
    [100,  80, 128,  80,  68, 108], // W2 Haunted Dungeon — purple stone
    [138,  72,  52,  110,  56, 36], // W3 Final Fortress — dark red-orange
  ];

  function wallTexColor(side, hitX, dist, world) {
    const tx = Math.floor(hitX * 8) & 7;
    const isMortar = tx === 0 || tx === 4;
    const pal = WALL_PAL[world] || WALL_PAL[0];
    let r, g, b;
    if (isMortar) {
      r = pal[0]; g = pal[1]; b = pal[2];
    } else {
      const v = (tx * 7) % 28;
      r = pal[3] + v; g = pal[4] + v; b = pal[5] + v;
    }
    if (side === 1) { r = r * 0.72 | 0; g = g * 0.72 | 0; b = b * 0.72 | 0; }
    const shade = Math.min(1, 6.0 / dist);
    return [r * shade | 0, g * shade | 0, b * shade | 0];
  }

  // Per-world ceiling/floor tints: [cR,cG,cB, fR,fG,fB] as floats
  const ENV_TINTS = [
    [0.22, 0.40, 0.22,  0.38, 0.52, 0.28], // W0 Slime Caves
    [0.28, 0.30, 0.42,  0.48, 0.42, 0.32], // W1 Zombie Graveyard
    [0.36, 0.24, 0.52,  0.38, 0.32, 0.48], // W2 Haunted Dungeon
    [0.52, 0.20, 0.12,  0.55, 0.30, 0.18], // W3 Final Fortress
  ];

  // horizon = H/2 + pitch  (pitch>0 = look up = horizon shifts down = more ceiling visible)
  function render(level, player, enemies, bullets, flashAlpha) {
    const data = imageData.data;
    const pitch = player.pitch || 0;
    const horizonY = H / 2 + pitch;
    const world = level.worldIndex || 0;
    const tint = ENV_TINTS[world];

    const dirX = Math.cos(player.angle), dirY = Math.sin(player.angle);
    const planeX = -dirY * PLANE_LEN, planeY = dirX * PLANE_LEN;

    // Ceiling (y < horizonY)
    const hSafe = horizonY > 0 ? horizonY : 1;
    for (let y = 0; y < Math.min(H, horizonY | 0); y++) {
      const shade = (40 + y * 45 / hSafe) | 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i]   = shade * tint[0] | 0;
        data[i+1] = shade * tint[1] | 0;
        data[i+2] = shade * tint[2] | 0;
        data[i+3] = 255;
      }
    }

    // Floor (y >= horizonY)
    const fSafe = H - horizonY > 0 ? H - horizonY : 1;
    for (let y = Math.max(0, horizonY | 0); y < H; y++) {
      const shade = (40 + (H - y) * 45 / fSafe) | 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i]   = shade * tint[3] | 0;
        data[i+1] = shade * tint[4] | 0;
        data[i+2] = shade * tint[5] | 0;
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
        [r, g, b] = wallTexColor(side, hitFrac, perpDist, world);
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
      spriteList.push({ x: e.x, y: e.y, dist: dx*dx + dy*dy, key: e.type, scale: e.jumpScale || 1 });
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
      const sprH = Math.min(H * 2, (H / ty * (s.scale || 1)) | 0);
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

    // World-specific ceiling overlay
    if      (world === 0) drawCeilingVines(ctx);
    else if (world === 1) drawCeilingBones(ctx);
    else if (world === 2) drawCeilingWebs(ctx);
    else if (world === 3) drawCeilingSoot(ctx);

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

  function drawLeaf(ctx, x, y, side) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + side * 9, y - 1, x + side * 7, y + 6);
    ctx.quadraticCurveTo(x + side * 2, y + 5, x, y);
    ctx.fill();
  }

  function drawCeilingVines(ctx) {
    const strands = [
      { x: 38,  cp1x: 44,  cp2x: 32,  len: 52 },
      { x: 112, cp1x: 105, cp2x: 118, len: 34 },
      { x: 197, cp1x: 205, cp2x: 191, len: 60 },
      { x: 274, cp1x: 268, cp2x: 280, len: 38 },
    ];

    for (const s of strands) {
      const endX = s.x + (s.cp2x - s.x) * 0.6;

      ctx.strokeStyle = 'rgba(28, 72, 16, 0.88)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.bezierCurveTo(s.cp1x, s.len * 0.35, s.cp2x, s.len * 0.7, endX, s.len);
      ctx.stroke();

      ctx.fillStyle = 'rgba(40, 100, 22, 0.82)';
      for (let t = 0.18; t <= 0.88; t += 0.28) {
        const lx = (1-t)*(1-t)*s.x + 2*(1-t)*t*s.cp1x + t*t*endX;
        const ly = s.len * t;
        drawLeaf(ctx, lx, ly, Math.sin(t * 9) > 0 ? 1 : -1);
      }
    }
  }

  function drawCeilingBones(ctx) {
    // Zombie Graveyard — hanging chains + bone clumps
    const chains = [{ x: 42, len: 28 }, { x: 120, len: 18 }, { x: 198, len: 32 }, { x: 270, len: 22 }];
    for (const c of chains) {
      ctx.strokeStyle = 'rgba(140,120,90,0.70)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(c.x, 0); ctx.lineTo(c.x, c.len); ctx.stroke();
      ctx.setLineDash([]);
      // Bone end
      ctx.fillStyle = 'rgba(190,170,140,0.80)';
      ctx.beginPath(); ctx.arc(c.x, c.len, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x - 3, c.len + 4, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x + 3, c.len + 4, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawCeilingWebs(ctx) {
    // Haunted Dungeon — spider webs at upper corners + center
    const spots = [{ x: 12, r: 18 }, { x: W - 12, r: 16 }, { x: W / 2, r: 14 }];
    ctx.strokeStyle = 'rgba(210,200,230,0.38)';
    ctx.lineWidth = 0.5;
    for (const s of spots) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(s.x, 0);
        ctx.lineTo(s.x + Math.cos(a) * s.r, Math.sin(a < Math.PI ? a : Math.PI - a) * s.r);
        ctx.stroke();
      }
      for (let ring = 1; ring <= 3; ring++) {
        const fr = ring / 3;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const px = s.x + Math.cos(a) * s.r * fr;
          const py = Math.sin(a < Math.PI ? a : Math.PI - a) * s.r * fr;
          a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
      }
    }
  }

  function drawCeilingSoot(ctx) {
    // Final Fortress — scorch marks + ember drips
    const marks = [{ x: 55, w: 30 }, { x: 145, w: 22 }, { x: 230, w: 28 }, { x: 290, w: 18 }];
    for (const m of marks) {
      const g = ctx.createRadialGradient(m.x, 0, 0, m.x, 0, m.w);
      g.addColorStop(0, 'rgba(255,80,0,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(m.x - m.w, 0, m.w * 2, m.w);
    }
    // Ember drips
    ctx.fillStyle = 'rgba(255,120,0,0.55)';
    [[60,8],[152,5],[235,9],[285,6]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.ellipse(x, y, 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    });
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
