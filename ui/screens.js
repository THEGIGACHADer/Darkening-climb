const Screens = (() => {
  const W = 320, H = 200;
  const WORLD_NAMES   = ['SLIME CAVES', 'ZOMBIE GRAVEYARD', 'HAUNTED DUNGEON', 'FINAL FORTRESS'];
  const WORLD_ACCENTS = ['#22cc44',     '#aaaaff',           '#cc66ff',          '#ff5500'];

  function centeredText(ctx, text, y, size, color) {
    ctx.font = `${size}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, (W - ctx.measureText(text).width) / 2, y);
  }

  function vineCluster(ctx, x, len) {
    ctx.fillStyle = '#4a5a44';
    ctx.fillRect(x, 0, 11, 6);
    ctx.fillStyle = '#333d30';
    ctx.fillRect(x + 1, 1, 9, 4);
    ctx.fillStyle = '#2a5018';
    ctx.fillRect(x + 4, 6, 2, len);
    for (let ly = 10; ly < 6 + len - 2; ly += 6) {
      const left = (Math.floor(ly / 6) % 2 === 0);
      ctx.fillStyle = '#3a7020';
      ctx.fillRect(x + (left ? 0 : 7), ly, 4, 2);
      ctx.fillStyle = '#4a8a28';
      ctx.fillRect(x + (left ? 1 : 8), ly, 2, 1);
    }
  }

  function drawMenu(ctx) {
    // Background — deep cave gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04080a');
    bg.addColorStop(1, '#0a1408');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(30,50,24,0.28)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 16) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Vine clusters
    vineCluster(ctx, 5,  34);
    vineCluster(ctx, 88, 22);
    vineCluster(ctx, 213, 26);
    vineCluster(ctx, 292, 30);

    // Corner grunge blobs
    ctx.fillStyle = 'rgba(16,40,10,0.60)';
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI/2); ctx.fill();
    ctx.beginPath(); ctx.arc(W, 0, 22, Math.PI/2, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(0, H, 22, 0, -Math.PI/2, true); ctx.fill();
    ctx.beginPath(); ctx.arc(W, H, 28, Math.PI, 3*Math.PI/2); ctx.fill();

    // Title drop shadow + main
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText('DARKENING CLIMB', (W - ctx.measureText('DARKENING CLIMB').width)/2 + 2, 57);
    centeredText(ctx, 'DARKENING CLIMB', 55, 14, '#881400');
    centeredText(ctx, 'DARKENING CLIMB', 54, 14, '#ff4422');

    // Decorative underline
    ctx.strokeStyle = '#662200';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W*0.2, 60); ctx.lineTo(W*0.8, 60); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,80,30,0.30)';
    ctx.beginPath(); ctx.moveTo(W*0.25, 62); ctx.lineTo(W*0.75, 62); ctx.stroke();

    centeredText(ctx, 'A RETRO PIXEL FPS', 74, 6, '#886655');

    centeredText(ctx, 'CONTROLS', 90, 7, '#557755');
    ctx.strokeStyle = '#334433';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(W*0.3,93); ctx.lineTo(W*0.7,93); ctx.stroke();

    const controls = [
      'WASD  —  Move & Strafe',
      '← →  —  Rotate',
      'W  —  Jump  (boss fights)',
      'Space  —  Shoot',
      'Enter  —  Pause',
    ];
    controls.forEach((line, i) => centeredText(ctx, line, 105 + i*12, 6, '#bbaa88'));

    // Prompt
    centeredText(ctx, 'PRESS SPACE TO START', 168, 7, '#ffcc00');

    // Bottom skulls
    ctx.fillStyle = '#551111';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('☠', 20, H - 18);
    ctx.fillText('☠', W - 30, H - 18);

    // World previews — small colored dots
    const colors = ['#22cc44','#aaaaff','#cc66ff','#ff5500'];
    const names  = ['W1','W2','W3','W4'];
    const startX = (W - (colors.length * 28 - 4)) / 2;
    colors.forEach((c, i) => {
      const px = startX + i * 28;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(px - 1, H - 13, 23, 10);
      ctx.fillStyle = c;
      ctx.fillRect(px, H - 12, 5, 8);
      ctx.font = '5px Arial, sans-serif';
      ctx.fillStyle = '#888877';
      ctx.fillText(names[i], px + 8, H - 6);
    });
  }

  function drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    // Red vignette border
    const vig = ctx.createRadialGradient(W/2,H/2,30,W/2,H/2,W*0.7);
    vig.addColorStop(0,'rgba(0,0,0,0)');
    vig.addColorStop(1,'rgba(160,0,0,0.55)');
    ctx.fillStyle = vig; ctx.fillRect(0,0,W,H);

    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('YOU DIED', (W - ctx.measureText('YOU DIED').width)/2 + 2, 92);
    centeredText(ctx, 'YOU DIED', 90, 16, '#881800');
    centeredText(ctx, 'YOU DIED', 89, 16, '#ff2200');

    ctx.strokeStyle = '#440000';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W*0.2,96); ctx.lineTo(W*0.8,96); ctx.stroke();

    centeredText(ctx, 'PRESS SPACE TO RETRY', 130, 7, '#ffcc00');
  }

  function drawWorldClear(ctx, worldIndex) {
    const accent = WORLD_ACCENTS[worldIndex] || '#22cc44';

    ctx.fillStyle = 'rgba(0,0,0,0.90)';
    ctx.fillRect(0, 0, W, H);

    // Accent glow strip at top
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(0, 0, W, 35);
    ctx.globalAlpha = 1;

    centeredText(ctx, 'WORLD CLEAR!', 52, 13, accent);
    centeredText(ctx, WORLD_NAMES[worldIndex], 72, 8, '#ffffff');

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(W*0.2,78); ctx.lineTo(W*0.8,78); ctx.stroke();
    ctx.globalAlpha = 1;

    centeredText(ctx, 'BOSS DEFEATED', 95, 7, '#ffcc00');

    if (worldIndex < 3) {
      centeredText(ctx, 'NEXT: ' + WORLD_NAMES[worldIndex + 1], 118, 6, WORLD_ACCENTS[worldIndex + 1]);
    }

    // Stars decoration
    ['★','★','★'].forEach((s, i) => {
      ctx.font = '10px Arial, sans-serif';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(s, W/2 - 20 + i*18, 140);
    });

    centeredText(ctx, 'PRESS SPACE TO CONTINUE', 170, 6, '#ffffff');
  }

  function drawWin(ctx) {
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#0a0008'); bg.addColorStop(1,'#180408');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Gold shimmer particles (static, determined by position)
    ctx.fillStyle = 'rgba(255,220,60,0.55)';
    [[24,12],[60,30],[100,8],[155,20],[200,14],[248,28],[290,10],[310,35],
     [40,50],[130,42],[210,55],[270,45]].forEach(([x,y]) => ctx.fillRect(x,y,1,1));

    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText('YOU WIN!', (W - ctx.measureText('YOU WIN!').width)/2 + 2, 67);
    centeredText(ctx, 'YOU WIN!', 65, 16, '#cc9900');
    centeredText(ctx, 'YOU WIN!', 64, 16, '#ffdd00');

    ctx.strokeStyle = '#886600';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W*0.2,70); ctx.lineTo(W*0.8,70); ctx.stroke();

    centeredText(ctx, 'DARK OVERLORD DEFEATED', 90, 7, '#ff5500');
    centeredText(ctx, 'THE DUNGEON IS FREE', 108, 6, '#aaffcc');
    centeredText(ctx, 'ALL 4 WORLDS CONQUERED', 122, 6, '#aaaaff');

    ['★','★','★','★','★'].forEach((s, i) => {
      ctx.font = '10px Arial, sans-serif';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(s, W/2 - 36 + i*18, 150);
    });

    centeredText(ctx, 'PRESS SPACE TO PLAY AGAIN', 172, 6, '#ffffff');
  }

  function drawBossIntro(ctx, worldIndex, alpha) {
    const accent = WORLD_ACCENTS[worldIndex] || '#cc0000';
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.92})`;
    ctx.fillRect(0, 0, W, H);
    if (alpha > 0.2) {
      const a = (alpha - 0.2) / 0.8;
      centeredText(ctx, 'BOSS FIGHT', 75, 14, `rgba(200,0,0,${a})`);
      const names = ['SLIME QUEEN', 'ZOMBIE KING', 'NECROMANCER', 'DARK OVERLORD'];
      ctx.globalAlpha = a;
      centeredText(ctx, names[worldIndex], 100, 9, accent);
      ctx.globalAlpha = 1;
      // Warning bar
      ctx.fillStyle = `rgba(200,0,0,${a * 0.18})`;
      ctx.fillRect(W*0.15, 108, W*0.7, 6);
      ctx.strokeStyle = `rgba(200,0,0,${a * 0.5})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(W*0.15, 108, W*0.7, 6);
    }
  }

  const DEATH_NAMES = ['slime', 'zombie', 'darkness', 'slimeQueen', 'zombieKing', 'necromancer', 'darkOverlord'];

  function drawPaused(ctx, devInfo) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);

    // Pause panel backdrop
    ctx.fillStyle = 'rgba(10,14,10,0.80)';
    ctx.fillRect(W*0.25, 72, W*0.5, 46);
    ctx.strokeStyle = '#334433';
    ctx.lineWidth = 1;
    ctx.strokeRect(W*0.25, 72, W*0.5, 46);

    centeredText(ctx, 'PAUSED', 90, 14, '#cccccc');
    centeredText(ctx, 'ENTER to resume', 108, 7, '#888877');
    centeredText(ctx, 'D  —  Dev panel', 120, 5, '#445544');

    if (devInfo) {
      const BOSS_NAMES = ['SLIME QUEEN', 'ZOMBIE KING', 'NECROMANCER', 'DARK OVERLORD'];

      ctx.fillStyle = 'rgba(0,20,0,0.92)';
      ctx.fillRect(10, 100, W - 20, 98);
      ctx.strokeStyle = '#224422';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 100, W - 20, 98);

      ctx.font = '8px Arial, sans-serif';
      ctx.fillStyle = '#44ff44';
      ctx.fillText(`HP ${devInfo.hp}/${devInfo.maxHp}   W${devInfo.world + 1}-L${devInfo.level + 1}   Enemies: ${devInfo.enemies}`, 16, 112);
      ctx.fillText(`Pos (${devInfo.px}, ${devInfo.py})   Vig: ${devInfo.vig}   Boss: ${devInfo.bossHp}`, 16, 122);

      ctx.font = '7px Arial, sans-serif';
      const on = '#44ff44', off = '#335533';
      ctx.fillStyle = devInfo.invincible  ? on : off; ctx.fillText('[I] Invincible',  16,  133);
      ctx.fillStyle = devInfo.noclip      ? on : off; ctx.fillText('[N] Noclip',      112, 133);
      ctx.fillStyle = devInfo.noDarkness  ? on : off; ctx.fillText('[F] No Darkness', 190, 133);

      ctx.fillStyle = devInfo.speedMult !== 1.0 ? '#ffdd44' : '#446644';
      ctx.fillText(`[ ] Speed: ${devInfo.speedMult.toFixed(2)}x`, 16, 143);
      const godOn = devInfo.invincible && devInfo.noclip && devInfo.noDarkness;
      ctx.fillStyle = godOn ? '#ffaa00' : '#446644';
      ctx.fillText('[G] GOD', 190, 143);
      ctx.fillStyle = '#ff4444';
      ctx.fillText('[K] INSTAKILL', 240, 143);

      ctx.strokeStyle = '#224422';
      ctx.beginPath(); ctx.moveTo(14, 149); ctx.lineTo(W - 14, 149); ctx.stroke();

      ctx.font = '8px Arial, sans-serif';
      ctx.fillStyle = '#886600';
      ctx.fillText('Trigger death:', 16, 159);
      centeredText(ctx, `< ${DEATH_NAMES[devInfo.deathIndex]} >`, 168, 9, '#ffcc00');
      centeredText(ctx, '← → pick   T trigger', 176, 7, '#664400');

      ctx.strokeStyle = '#224422';
      ctx.beginPath(); ctx.moveTo(14, 182); ctx.lineTo(W - 14, 182); ctx.stroke();

      centeredText(ctx, `< ${BOSS_NAMES[devInfo.bossIndex]} >`, 191, 9, '#00eeff');
      centeredText(ctx, '↑ ↓ pick   B warp to boss', 198, 7, '#005566');
    }
  }

  return { drawMenu, drawGameOver, drawWorldClear, drawWin, drawBossIntro, drawPaused, DEATH_NAMES };
})();
