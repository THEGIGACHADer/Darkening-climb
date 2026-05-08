const HUD = (() => {
  const W = 320, H = 200;
  const WORLD_NAMES = ['SLIME CAVES', 'ZOMBIE GRAVEYARD', 'HAUNTED DUNGEON', 'FINAL FORTRESS'];

  function draw(ctx, player, worldIndex, levelInWorld, mode) {
    // Health bar
    const hpPct = Math.max(0, player.hp / Player.MAX_HP);
    ctx.fillStyle = '#111';
    ctx.fillRect(4, H - 14, 80, 8);
    const barColor = hpPct > 0.5 ? '#22cc44' : hpPct > 0.25 ? '#ffcc00' : '#cc2200';
    ctx.fillStyle = barColor;
    ctx.fillRect(4, H - 14, (80 * hpPct) | 0, 8);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, H - 14, 80, 8);

    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.fillText(`HP ${player.hp}`, 6, H - 7);

    // World / level label
    const label = WORLD_NAMES[worldIndex] + '  ' + (levelInWorld + 1) + '/5';
    ctx.fillStyle = '#aaa';
    ctx.font = '5px monospace';
    ctx.fillText(label, W / 2 - label.length * 1.5, H - 6);

    // Mode indicator (debug, can remove)
    // ctx.fillText(mode, W - 40, H - 6);
  }

  return { draw };
})();
