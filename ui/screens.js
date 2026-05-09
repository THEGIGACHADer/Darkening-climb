const Screens = (() => {
  const W = 320, H = 200;
  const WORLD_NAMES = ['SLIME CAVES', 'ZOMBIE GRAVEYARD', 'HAUNTED DUNGEON', 'FINAL FORTRESS'];

  function centeredText(ctx, text, y, size, color) {
    ctx.font = `${size}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, (W - ctx.measureText(text).width) / 2, y);
  }

  function vineCluster(ctx, x, len) {
    // Stone block anchored to top edge
    ctx.fillStyle = '#4a5a44';
    ctx.fillRect(x, 0, 11, 6);
    ctx.fillStyle = '#333d30';
    ctx.fillRect(x + 1, 1, 9, 4);
    // Vine stem
    ctx.fillStyle = '#2a5018';
    ctx.fillRect(x + 4, 6, 2, len);
    // Alternating leaves along stem
    for (let ly = 10; ly < 6 + len - 2; ly += 6) {
      const left = (Math.floor(ly / 6) % 2 === 0);
      ctx.fillStyle = '#3a7020';
      ctx.fillRect(x + (left ? 0 : 7), ly, 4, 2);
      ctx.fillStyle = '#4a8a28';
      ctx.fillRect(x + (left ? 1 : 8), ly, 2, 1);
    }
  }

  function drawMenu(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Vine clusters hanging from top
    vineCluster(ctx, 5,  30);
    vineCluster(ctx, 88, 20);
    vineCluster(ctx, 213, 24);
    vineCluster(ctx, 292, 28);

    // Title
    centeredText(ctx, 'DARKENING CLIMB', 55, 14, '#cc2200');
    centeredText(ctx, 'DARKENING CLIMB', 54, 14, '#ff4422');
    // Subtitle
    centeredText(ctx, 'A RETRO PIXEL FPS', 75, 6, '#886655');

    // Controls header
    centeredText(ctx, 'CONTROLS', 93, 7, '#557755');

    // Controls rows
    const controls = [
      'WASD  —  Move & Strafe',
      '← →  —  Rotate',
      'W  —  Jump  (boss fights)',
      'Space  —  Shoot',
      'Enter  —  Pause',
    ];
    controls.forEach((line, i) => {
      centeredText(ctx, line, 108 + i * 13, 7, '#bbaa88');
    });

    // Prompt (blinks via caller)
    centeredText(ctx, 'PRESS SPACE TO START', 168, 7, '#ffcc00');
    // Decorative skulls
    ctx.fillStyle = '#441111';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('☠', 20, H - 20);
    ctx.fillText('☠', W - 32, H - 20);
  }

  function drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);
    centeredText(ctx, 'YOU DIED', 90, 16, '#cc0000');
    centeredText(ctx, 'YOU DIED', 89, 16, '#ff2200');
    centeredText(ctx, 'PRESS SPACE TO RETRY', 130, 7, '#ffcc00');
  }

  function drawWorldClear(ctx, worldIndex) {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);
    centeredText(ctx, 'WORLD CLEAR', 70, 12, '#22cc44');
    centeredText(ctx, WORLD_NAMES[worldIndex], 95, 8, '#aaffcc');
    centeredText(ctx, 'BOSS DEFEATED', 120, 7, '#ffcc00');
    if (worldIndex < 3) {
      centeredText(ctx, 'NEXT: ' + WORLD_NAMES[worldIndex + 1], 145, 6, '#aaaaff');
    }
    centeredText(ctx, 'PRESS SPACE TO CONTINUE', 170, 6, '#fff');
  }

  function drawWin(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    centeredText(ctx, 'YOU WIN!', 65, 16, '#ffdd00');
    centeredText(ctx, 'DARK OVERLORD DEFEATED', 95, 7, '#22cc44');
    centeredText(ctx, 'THE DUNGEON IS FREE', 115, 6, '#aaffcc');
    centeredText(ctx, 'PRESS SPACE TO PLAY AGAIN', 155, 6, '#ffffff');
  }

  function drawBossIntro(ctx, worldIndex, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.9})`;
    ctx.fillRect(0, 0, W, H);
    if (alpha > 0.2) {
      centeredText(ctx, 'BOSS FIGHT', 80, 14, `rgba(200,0,0,${(alpha - 0.2) / 0.8})`);
      const names = ['SLIME QUEEN', 'ZOMBIE KING', 'NECROMANCER', 'DARK OVERLORD'];
      centeredText(ctx, names[worldIndex], 108, 9, `rgba(255,200,0,${(alpha - 0.2) / 0.8})`);
    }
  }

  const DEATH_NAMES = ['slime', 'zombie', 'darkness', 'slimeQueen', 'zombieKing', 'necromancer', 'darkOverlord', 'kinetic'];

  function drawPaused(ctx, devInfo) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    centeredText(ctx, 'PAUSED', 88, 16, '#cccccc');
    centeredText(ctx, 'ENTER to resume', 110, 7, '#888877');
    centeredText(ctx, 'D  —  See all things important  (DEVS ONLY)', 126, 5, '#445544');

    if (devInfo) {
      const BOSS_NAMES = ['SLIME QUEEN', 'ZOMBIE KING', 'NECROMANCER', 'DARK OVERLORD'];

      // Dev panel background
      ctx.fillStyle = 'rgba(0,20,0,0.92)';
      ctx.fillRect(10, 100, W - 20, 98);
      ctx.strokeStyle = '#224422';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 100, W - 20, 98);

      // Stats
      ctx.font = '8px Arial, sans-serif';
      ctx.fillStyle = '#44ff44';
      ctx.fillText(`HP ${devInfo.hp}/${devInfo.maxHp}   W${devInfo.world + 1}-L${devInfo.level + 1}   Enemies: ${devInfo.enemies}`, 16, 112);
      ctx.fillText(`Pos (${devInfo.px}, ${devInfo.py})   Vig: ${devInfo.vig}   Boss: ${devInfo.bossHp}`, 16, 122);

      // Cheat toggles
      ctx.font = '7px Arial, sans-serif';
      const on = '#44ff44', off = '#335533';
      ctx.fillStyle = devInfo.invincible  ? on : off; ctx.fillText('[I] Invincible',  16,  133);
      ctx.fillStyle = devInfo.noclip      ? on : off; ctx.fillText('[N] Noclip',      112, 133);
      ctx.fillStyle = devInfo.noDarkness  ? on : off; ctx.fillText('[F] No Darkness', 190, 133);

      // Speed multiplier
      ctx.fillStyle = devInfo.speedMult !== 1.0 ? '#ffdd44' : '#446644';
      ctx.fillText(`[ ] Speed: ${devInfo.speedMult.toFixed(2)}x`, 16, 143);

      // Divider
      ctx.strokeStyle = '#224422';
      ctx.beginPath(); ctx.moveTo(14, 149); ctx.lineTo(W - 14, 149); ctx.stroke();

      // Death selector
      ctx.font = '8px Arial, sans-serif';
      ctx.fillStyle = '#886600';
      ctx.fillText('Trigger death:', 16, 159);
      centeredText(ctx, `< ${DEATH_NAMES[devInfo.deathIndex]} >`, 168, 9, '#ffcc00');
      centeredText(ctx, '← → pick   T trigger', 176, 7, '#664400');

      // Divider
      ctx.strokeStyle = '#224422';
      ctx.beginPath(); ctx.moveTo(14, 182); ctx.lineTo(W - 14, 182); ctx.stroke();

      // Boss warp selector
      centeredText(ctx, `< ${BOSS_NAMES[devInfo.bossIndex]} >`, 191, 9, '#00eeff');
      centeredText(ctx, '↑ ↓ pick   B warp to boss', 198, 7, '#005566');
    }
  }

  return { drawMenu, drawGameOver, drawWorldClear, drawWin, drawBossIntro, drawPaused, DEATH_NAMES };
})();
