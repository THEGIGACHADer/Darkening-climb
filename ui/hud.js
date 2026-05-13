const HUD = (() => {
  const W = 320, H = 200;
  const WORLD_NAMES   = ['SLIME CAVES', 'ZOMBIE GRAVEYARD', 'HAUNTED DUNGEON', 'FINAL FORTRESS'];
  const WORLD_ACCENTS = ['#22cc44',     '#aaaaff',          '#cc66ff',          '#ff5500'];
  const HP_SEGS = 10;
  const BAR_W = 88, BAR_H = 9;
  const BAR_X = 4, BAR_Y = H - 14;

  function draw(ctx, player, worldIndex, levelInWorld, mode, teleCooldown = 0, level = null) {
    const accent = WORLD_ACCENTS[worldIndex] || '#22cc44';
    const hpPct  = Math.max(0, player.hp / Player.MAX_HP);

    // ── HP bar ──────────────────────────────────────────────────────────────
    // Dark backing
    ctx.fillStyle = '#080808';
    ctx.fillRect(BAR_X - 1, BAR_Y - 1, BAR_W + 2, BAR_H + 2);

    // Segment fill
    const segW = (BAR_W - HP_SEGS + 1) / HP_SEGS;
    const filledSegs = Math.ceil(hpPct * HP_SEGS);
    const segColor = hpPct > 0.5 ? accent : hpPct > 0.25 ? '#ffcc00' : '#cc2200';

    for (let i = 0; i < HP_SEGS; i++) {
      const sx = BAR_X + i * (segW + 1);
      if (i < filledSegs) {
        // filled segment — gradient shimmer
        const bright = i === filledSegs - 1 && hpPct * HP_SEGS % 1 !== 0
          ? hpPct * HP_SEGS % 1   // partial last segment
          : 1;
        ctx.globalAlpha = bright * 0.9 + 0.1;
        ctx.fillStyle = segColor;
        ctx.fillRect(sx | 0, BAR_Y, segW | 0, BAR_H);
        // top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(sx | 0, BAR_Y, segW | 0, 2);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(sx | 0, BAR_Y, segW | 0, BAR_H);
      }
    }

    // Border with world-accent glow
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(BAR_X - 0.5, BAR_Y - 0.5, BAR_W + 1, BAR_H + 1);

    // HP label
    ctx.fillStyle = hpPct > 0.25 ? '#ffffff' : '#ff4444';
    ctx.font = 'bold 5px Arial, sans-serif';
    ctx.fillText(`HP ${player.hp | 0}`, BAR_X + 1, BAR_Y - 2);

    // ── Level pips ──────────────────────────────────────────────────────────
    const pipX = BAR_X;
    const pipY = H - 4;
    for (let i = 0; i < 5; i++) {
      const px = pipX + i * 7;
      if (i < levelInWorld) {
        ctx.fillStyle = accent;
        ctx.fillRect(px, pipY - 3, 5, 3);
      } else if (i === levelInWorld) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px, pipY - 3, 5, 3);
      } else {
        ctx.fillStyle = '#333333';
        ctx.fillRect(px, pipY - 3, 5, 3);
      }
    }

    // ── World label ─────────────────────────────────────────────────────────
    const label = WORLD_NAMES[worldIndex];
    ctx.fillStyle = accent;
    ctx.font = '5px Arial, sans-serif';
    const lw = ctx.measureText(label).width;
    ctx.fillText(label, (W - lw) / 2, H - 3);

    // ── Teleport cooldown ───────────────────────────────────────────────────
    if (teleCooldown > 0) {
      const cW = 50, cH = 4, cX = W - cW - 4, cY = 4;
      ctx.fillStyle = '#111';
      ctx.fillRect(cX - 1, cY - 1, cW + 2, cH + 2);
      ctx.fillStyle = 'rgba(180,100,255,0.75)';
      ctx.fillRect(cX, cY, (cW * teleCooldown / 20) | 0, cH);
      ctx.strokeStyle = 'rgba(180,100,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cX - 0.5, cY - 0.5, cW + 1, cH + 1);
      ctx.fillStyle = '#cc88ff';
      ctx.font = 'bold 5px Arial, sans-serif';
      ctx.fillText(`TELE ${Math.ceil(teleCooldown)}s`, cX + 1, cY + cH + 6);
    }

    // ── Minimap ─────────────────────────────────────────────────────────────
    if (level && level.grid && level.grid[0]) {
      const mmH = level.grid.length, mmW = level.grid[0].length;
      const sc = 1;
      const mx = 2, my = 2;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(mx - 1, my - 1, mmW * sc + 2, mmH * sc + 2);
      for (let r = 0; r < mmH; r++) {
        for (let c = 0; c < mmW; c++) {
          const cell = level.grid[r][c];
          if      (cell === 1) ctx.fillStyle = '#7a8898';
          else if (cell === 8) ctx.fillStyle = '#00cc55';
          else                 ctx.fillStyle = '#252530';
          ctx.fillRect(mx + c * sc, my + r * sc, sc, sc);
        }
      }
      // Vents
      ctx.fillStyle = 'rgba(80,100,255,0.9)';
      for (const h of (level.holes || []))
        ctx.fillRect(mx + Math.floor(h.x) * sc, my + Math.floor(h.y) * sc, sc, sc);
      // Player dot
      ctx.fillStyle = '#44aaff';
      ctx.fillRect(mx + Math.floor(player.x) * sc - 0, my + Math.floor(player.y) * sc - 0, sc + 1, sc + 1);
    }

    // ── Controls legend ─────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.font = '4px Arial, sans-serif';
    ctx.fillText('G: vent   R: travel   E: teleport', BAR_X + 1, BAR_Y - 9);

    // ── Speed boost bar ─────────────────────────────────────────────────────
    if (player.boostTimer > 0) {
      const bPct = Math.min(1, player.boostTimer / 4);
      const bW = 50, bH = 4, bX = W - bW - 4, bY = H - 14;
      ctx.fillStyle = '#111';
      ctx.fillRect(bX - 1, bY - 1, bW + 2, bH + 2);
      ctx.fillStyle = `rgba(160,220,255,${0.7 + 0.3 * Math.sin(Date.now() / 120)})`;
      ctx.fillRect(bX, bY, (bW * bPct) | 0, bH);
      ctx.strokeStyle = 'rgba(160,220,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bX - 0.5, bY - 0.5, bW + 1, bH + 1);
      ctx.fillStyle = '#aaddff';
      ctx.font = 'bold 5px Arial, sans-serif';
      ctx.fillText('BOOST', bX + 1, bY - 2);
    }
  }

  return { draw };
})();
