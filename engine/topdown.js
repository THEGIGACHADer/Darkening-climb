const TopDown = (() => {
  const W = 640, H = 400;
  const TS = 16; // tile size in pixels

  let offscreen, ctx;
  let _world = 0;

  function init() {
    offscreen = document.createElement('canvas');
    offscreen.width = W; offscreen.height = H;
    ctx = offscreen.getContext('2d');
  }

  function drawTile(cell, x, y) {
    if (cell === 0) {
      const col = x / TS | 0, row = y / TS | 0;
      const hash  = (col * 3  + row * 7)  % 13;
      const hash2 = (col * 5  + row * 11) % 17;
      const hash3 = (col * 11 + row * 3)  % 19;

      // World-tinted floor base
      const floorBase = ['#363644','#2b2218','#1c1c2c','#231414'];
      const gridLine  = ['#2a2a38','#201a10','#161622','#1a0e0e'];
      ctx.fillStyle = floorBase[_world];
      ctx.fillRect(x, y, TS, TS);
      ctx.strokeStyle = gridLine[_world];
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);

      if (_world === 0) {
        // Slime Caves — vines + slime puddles
        if (hash < 2) {
          ctx.strokeStyle = 'rgba(22,58,12,0.72)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (hash === 0) { ctx.moveTo(x+2,y+9);  ctx.quadraticCurveTo(x+7,y+4,x+14,y+11); }
          else             { ctx.moveTo(x+3,y+2);  ctx.quadraticCurveTo(x+11,y+7,x+12,y+14); }
          ctx.stroke();
          ctx.fillStyle = 'rgba(30,74,16,0.65)';
          ctx.beginPath(); ctx.arc(x+8,y+8,1.5,0,Math.PI*2); ctx.fill();
        }
        if (hash2 < 2) {
          ctx.fillStyle = 'rgba(28,130,38,0.30)';
          ctx.beginPath(); ctx.ellipse(x+8,y+9,5,3,0.3,0,Math.PI*2); ctx.fill();
        }

      } else if (_world === 1) {
        // Zombie Graveyard — grave crosses + bone fragments
        if (hash < 2) {
          ctx.strokeStyle = 'rgba(90,65,40,0.65)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x+8, y+3); ctx.lineTo(x+8, y+13);
          ctx.moveTo(x+5, y+6); ctx.lineTo(x+11,y+6);
          ctx.stroke();
        }
        if (hash2 < 3) {
          const bx = x + 2 + (hash3 * 3) % 7, by = y + 3 + (hash3 * 5) % 7;
          ctx.fillStyle = 'rgba(175,158,130,0.50)';
          ctx.beginPath(); ctx.arc(bx,     by,   1.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(bx + 6, by+1, 1.5, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = 'rgba(175,158,130,0.40)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(bx+1,by); ctx.lineTo(bx+5,by+1); ctx.stroke();
        }

      } else if (_world === 2) {
        // Haunted Dungeon — cobwebs + torch glow patches
        if (hash < 2) {
          ctx.strokeStyle = 'rgba(200,200,215,0.32)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          const cx2 = hash === 0 ? x : x + TS, cy2 = y;
          const d = hash === 0 ? 1 : -1;
          for (let i = 1; i <= 3; i++) { ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + d*i*3, cy2 + i*3); }
          ctx.moveTo(cx2+d*3,cy2); ctx.lineTo(cx2+d*2,cy2+3);
          ctx.moveTo(cx2+d*6,cy2); ctx.lineTo(cx2+d*4,cy2+4);
          ctx.stroke();
        }
        if (hash2 < 2) {
          ctx.fillStyle = 'rgba(210,90,15,0.12)';
          ctx.beginPath(); ctx.arc(x+8,y+8,6,0,Math.PI*2); ctx.fill();
        }

      } else if (_world === 3) {
        // Final Fortress — lava cracks + ember dots
        if (hash < 3) {
          ctx.beginPath();
          if      (hash === 0) { ctx.moveTo(x+1,y+8);  ctx.lineTo(x+6,y+5);  ctx.lineTo(x+10,y+11); ctx.lineTo(x+15,y+9); }
          else if (hash === 1) { ctx.moveTo(x+3,y+2);  ctx.lineTo(x+7,y+7);  ctx.lineTo(x+5,y+13); }
          else                 { ctx.moveTo(x+8,y+1);  ctx.lineTo(x+12,y+6); ctx.lineTo(x+9,y+12);  ctx.lineTo(x+14,y+15); }
          ctx.strokeStyle = 'rgba(255,110,0,0.22)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(200,45,0,0.65)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        if (hash2 < 2) {
          ctx.fillStyle = `rgba(255,${80+hash3*8},0,0.75)`;
          ctx.beginPath(); ctx.arc(x+3+(hash3*7)%9, y+3+(hash3*5)%9, 1, 0, Math.PI*2); ctx.fill();
        }
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
    _world = level.worldIndex || 0;
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

    // Moving crusher walls
    const now = Date.now();
    const cpulse = 0.5 + 0.5 * Math.sin(now / 280);
    for (const c of (level.crushers || [])) {
      for (let i = 0; i < c.length; i++) {
        const col = c.axis === 'v' ? c.fixed : Math.floor(c.pos) + i;
        const row = c.axis === 'v' ? Math.floor(c.pos) + i : c.fixed;
        const cx = col * TS, cy = row * TS;
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(cx + 2, cy + 2, TS, TS);
        ctx.fillStyle = '#7a2828';
        ctx.fillRect(cx, cy, TS, TS);
        ctx.fillStyle = `rgba(255,50,0,${0.22 + cpulse * 0.22})`;
        ctx.fillRect(cx + 2, cy + 2, TS - 4, TS - 4);
        ctx.fillStyle = '#b05050';
        ctx.fillRect(cx, cy, TS, 2);
        ctx.fillRect(cx, cy, 2, TS);
        ctx.fillStyle = '#4a1010';
        ctx.fillRect(cx, cy + TS - 2, TS, 2);
        ctx.fillRect(cx + TS - 2, cy, 2, TS);
      }
    }

    // Speed boost pickups (lightning bolt)
    const pulse = 0.7 + 0.3 * Math.sin(now / 200);
    for (const b of (level.boosts || [])) {
      const bx = b.x * TS, by = b.y * TS;
      ctx.save();
      ctx.translate(bx, by);
      // Glow
      ctx.fillStyle = `rgba(160,210,255,${pulse * 0.25})`;
      ctx.beginPath(); ctx.arc(0, 0, TS * 0.46, 0, Math.PI * 2); ctx.fill();
      // Bolt shape
      ctx.fillStyle = `rgba(255,255,100,${pulse})`;
      ctx.strokeStyle = `rgba(160,220,255,${pulse * 0.9})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(2, -7);
      ctx.lineTo(-2, -1);
      ctx.lineTo(0, -1);
      ctx.lineTo(-2, 7);
      ctx.lineTo(2, 1);
      ctx.lineTo(0, 1);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
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
      const r = (TS * 0.36 * (e.size || 1) * 0.7 + TS * 0.15) * (e.jumpScale || 1);
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

    // Speed boost indicator
    if (player.boostTimer > 0) {
      const a = Math.min(1, player.boostTimer * 2);
      ctx.save();
      ctx.fillStyle = `rgba(255,220,30,${a})`;
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('>> SPEED BOOST <<', W / 2, 18);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    // Hit flash overlay
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(200,0,0,${flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }

    return offscreen;
  }

  return { init, render };
})();
