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

  function _drawVent(ctx, ventAnim) {
    const { phase, t } = ventAnim;
    let a = 0;
    if      (phase === 'enter')  a = Math.min(1, t / 0.35);
    else if (phase === 'inside') a = 1;
    else if (phase === 'exit')   a = Math.max(0, 1 - t / 0.35);
    if (a <= 0) return;

    ctx.save();
    ctx.globalAlpha = a;

    // Dark vignette — cramped vent feel
    const vig = ctx.createRadialGradient(W/2, H/2, H * 0.18, W/2, H/2, H * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.82)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Horizontal metal slats — world visible through the gaps
    const slatH = 18, gap = 24;
    ctx.fillStyle = '#111118';
    for (let y = 0; y < H; y += slatH + gap) {
      ctx.fillRect(0, y, W, slatH);
      // Top highlight strip on each bar
      ctx.fillStyle = 'rgba(80,80,100,0.35)';
      ctx.fillRect(0, y, W, 2);
      ctx.fillStyle = '#111118';
    }

    ctx.restore();
  }

  function render(level, player, enemies, bullets, flashAlpha, fadeTiles = 12, flickerEvent = null, ventAnim = null, teleSpot = null) {
    _world = level.worldIndex || 0;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    // Rotate view so player's facing direction points up on screen
    // angle=0 → facing right → rotate -90° so "right" becomes "up"
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-player.angle - Math.PI / 2);
    ctx.translate(-player.x * TS, -player.y * TS);

    // Draw only tiles near the player (culling for large maps)
    const rows = level.grid.length;
    const cols = level.grid[0] ? level.grid[0].length : 0;
    const VIS = 26;
    const r0 = Math.max(0, Math.floor(player.y) - VIS);
    const r1 = Math.min(rows, Math.ceil(player.y) + VIS);
    const c0 = Math.max(0, Math.floor(player.x) - VIS);
    const c1 = Math.min(cols, Math.ceil(player.x) + VIS);
    for (let row = r0; row < r1; row++) {
      for (let col = c0; col < c1; col++) {
        drawTile(level.grid[row][col], col * TS, row * TS);
      }
    }

    // Hideout holes — dark alcove recesses in walls
    for (const h of (level.holes || [])) {
      const hx = (h.x - 0.5) * TS, hy = (h.y - 0.5) * TS;
      ctx.fillStyle = '#060608';
      ctx.fillRect(hx, hy, TS, TS);
      ctx.fillStyle = '#111118';
      ctx.fillRect(hx + 2, hy + 2, TS - 4, TS - 4);
      ctx.strokeStyle = 'rgba(90,100,160,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(hx + 1.5, hy + 1.5, TS - 3, TS - 3);
      ctx.fillStyle = 'rgba(120,140,220,0.30)';
      ctx.beginPath(); ctx.arc(h.x * TS, h.y * TS, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    const now = Date.now();

    // Hole pulse glow during flicker warning
    if (flickerEvent && flickerEvent.t < 5) {
      const fp = flickerEvent.t / 5;
      const hglow = 0.35 + 0.35 * Math.sin(now / 140);
      for (const h of (level.holes || [])) {
        ctx.fillStyle = `rgba(100,120,255,${(0.2 + fp * 0.45) * hglow})`;
        ctx.beginPath(); ctx.arc(h.x * TS, h.y * TS, TS * 0.7, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Moving crusher walls — near-identical to regular walls, barely-warm tint
    for (const c of (level.crushers || [])) {
      const cx = (c.x - 0.5) * TS, cy = (c.y - 0.5) * TS;
      ctx.fillStyle = '#08080f';
      ctx.fillRect(cx + 2, cy + 2, TS, TS);
      ctx.fillStyle = '#7a8898';
      ctx.fillRect(cx, cy, TS, TS);
      ctx.fillStyle = '#b0c0d0';
      ctx.fillRect(cx, cy, TS, 2);
      ctx.fillRect(cx, cy, 2, TS);
      ctx.fillStyle = '#3a4858';
      ctx.fillRect(cx, cy + TS - 2, TS, 2);
      ctx.fillRect(cx + TS - 2, cy, 2, TS);
      ctx.fillStyle = 'rgba(200,30,0,0.03)';
      ctx.fillRect(cx, cy, TS, TS);
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

    // Teleport spot marker
    if (teleSpot) {
      const tx = teleSpot.x * TS, ty = teleSpot.y * TS;
      const tp = 0.5 + 0.5 * Math.sin(now / 220);
      ctx.strokeStyle = `rgba(180,100,255,${0.55 + tp * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(tx, ty, TS * 0.44, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(220,160,255,${0.3 + tp * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, ty - TS * 0.6); ctx.lineTo(tx, ty + TS * 0.6);
      ctx.moveTo(tx - TS * 0.6, ty); ctx.lineTo(tx + TS * 0.6, ty);
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

    // Flicker event overlays
    if (flickerEvent) {
      const fe = flickerEvent;
      if (fe.t < 5) {
        // Warning phase — sudden blackout blinks, lights-on otherwise
        const prog = fe.t / 5;
        const block = Math.floor(now / 75);
        const h = (Math.imul(block, 2654435761) ^ (block >>> 16)) >>> 0;
        const p = 0.04 + prog * 0.24;
        if (h / 0xFFFFFFFF < p) {
          ctx.fillStyle = 'rgba(0,0,0,0.93)';
          ctx.fillRect(0, 0, W, H);
        }
      } else if (fe.t < 6.5) {
        // Storm phase — partial blackout so room is faintly visible
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(0, 0, W, H);
        const sp = Math.min(1, (fe.t - 5));
        if (sp < 1) {
          const sx = sp * sp * (W + 12); // ease-in sweep
          // Travelling light — wide soft glow around the figure
          const glow = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0);
          glow.addColorStop(0,   'rgba(160,185,255,0)');
          glow.addColorStop(0.4, 'rgba(160,185,255,0.10)');
          glow.addColorStop(0.5, 'rgba(200,220,255,0.22)');
          glow.addColorStop(0.6, 'rgba(160,185,255,0.10)');
          glow.addColorStop(1,   'rgba(160,185,255,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(sx - 80, 0, 160, H);
          // Shadow trail
          ctx.fillStyle = 'rgba(18,22,48,0.75)';
          ctx.fillRect(sx - 14, 0, 12, H);
          // Core — the figure
          ctx.fillStyle = 'rgba(210,225,255,0.92)';
          ctx.fillRect(sx,     0, 1, H);
          ctx.fillStyle = 'rgba(140,170,255,0.50)';
          ctx.fillRect(sx - 1, 0, 1, H);
          ctx.fillRect(sx + 1, 0, 1, H);
        }
        if (fe.hiding) {
          ctx.save();
          ctx.fillStyle = 'rgba(50,200,80,0.88)';
          ctx.font = 'bold 7px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HIDDEN', W / 2, 22);
          ctx.textAlign = 'left';
          ctx.restore();
        }
      }
    }

    // Vent enter/exit animation
    if (ventAnim) _drawVent(ctx, ventAnim);

    // Hit flash overlay
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(200,0,0,${flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Exit direction arrow
    if (level.exitPos) {
      const dx = level.exitPos.x - player.x;
      const dy = level.exitPos.y - player.y;
      const screenAngle = Math.atan2(dy, dx) - player.angle - Math.PI / 2;
      const R = 28;
      const ax = W / 2 + Math.cos(screenAngle) * R;
      const ay = H / 2 + Math.sin(screenAngle) * R;
      const pulse = 0.65 + 0.35 * Math.sin(now / 500);
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(screenAngle + Math.PI / 2);
      ctx.fillStyle = `rgba(0,220,110,${pulse})`;
      ctx.strokeStyle = `rgba(0,80,40,${pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(-4, 4);
      ctx.lineTo(0, 1);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    return offscreen;
  }

  return { init, render };
})();
