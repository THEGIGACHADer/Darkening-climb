const Screens = (() => {
  const W = 320, H = 200;
  const WORLD_NAMES = ['SLIME CAVES', 'ZOMBIE GRAVEYARD', 'HAUNTED DUNGEON', 'FINAL FORTRESS'];

  function centeredText(ctx, text, y, size, color) {
    ctx.font = `${size}px monospace`;
    ctx.fillStyle = color;
    ctx.fillText(text, (W - ctx.measureText(text).width) / 2, y);
  }

  function drawMenu(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Title
    centeredText(ctx, 'DARK  DUNGEON', 55, 14, '#cc2200');
    centeredText(ctx, 'DARK  DUNGEON', 54, 14, '#ff4422');
    // Subtitle
    centeredText(ctx, 'A RETRO PIXEL FPS', 75, 6, '#886655');
    // Controls
    ctx.fillStyle = '#777';
    ctx.font = '5px monospace';
    const controls = [
      'WASD - MOVE / STRAFE',
      'ARROWS LEFT/RIGHT - ROTATE',
      'W - JUMP  (boss fights)',
      'SPACE - SHOOT',
    ];
    controls.forEach((line, i) => {
      centeredText(ctx, line, 105 + i * 12, 5, '#777');
    });
    // Prompt (blinks via caller)
    centeredText(ctx, 'PRESS SPACE TO START', 165, 7, '#ffcc00');
    // Decorative skulls
    ctx.fillStyle = '#441111';
    ctx.font = '12px monospace';
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

  return { drawMenu, drawGameOver, drawWorldClear, drawWin, drawBossIntro };
})();
