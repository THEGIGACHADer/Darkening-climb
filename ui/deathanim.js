const DeathAnim = (() => {
  const DUR = 2.8;
  const W = 320, H = 200;

  function draw(ctx, cause, t) {
    switch (cause) {
      case 'slime':        drawSlimeStomp(ctx, t);       break;
      case 'zombie':       drawZombieEat(ctx, t);        break;
      case 'darkness':     drawDarkness(ctx, t);         break;
      case 'slimeQueen':   drawQueenImpale(ctx, t);      break;
      case 'zombieKing':   drawKingFlick(ctx, t);        break;
      case 'necromancer':  drawNecroSummon(ctx, t);      break;
      case 'darkOverlord': drawOverlordBlackout(ctx, t); break;
      case 'figure':       drawFigureDeath(ctx, t);      break;
      default:             drawDarkness(ctx, t);         break;
    }

    // Universal fade to black at the end
    if (t > 0.80) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (t - 0.80) / 0.20)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Player arrow helper (screen-space)
  function arrow(ctx, x, y, scale, angle, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    const s = 8;
    ctx.fillStyle = '#44aaff';
    ctx.strokeStyle = '#aaddff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.65, s * 0.72);
    ctx.lineTo(0,  s * 0.28);
    ctx.lineTo( s * 0.65, s * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // ── 1. Slime Stomp ──────────────────────────────────────────────────────────
  function drawSlimeStomp(ctx, t) {
    const cx = W / 2, cy = H / 2;
    const IMPACT = 0.32;

    if (t < IMPACT) {
      arrow(ctx, cx, cy, 1.0, 0, 1.0);
      const blobY = -30 + (cy - 24) * (t / IMPACT);
      const wobble = Math.sin(t * 28) * 3;
      ctx.fillStyle = '#22cc44';
      ctx.beginPath();
      ctx.ellipse(cx + wobble, blobY, 24, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#55ff88';
      ctx.beginPath();
      ctx.ellipse(cx - 7 + wobble, blobY - 6, 9, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const sq = Math.min(1, (t - IMPACT) / 0.12);
      ctx.save();
      ctx.translate(cx, cy + 5);
      ctx.scale(1 + sq * 1.5, Math.max(0.05, 1 - sq * 0.93));
      ctx.translate(-cx, -(cy + 5));
      arrow(ctx, cx, cy + 5, 1.0, 0, 1.0);
      ctx.restore();

      const blobY = cy - 19 + sq * 3;
      ctx.fillStyle = '#22cc44';
      ctx.beginPath();
      ctx.ellipse(cx, blobY, 26 + sq * 4, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#55ff88';
      ctx.beginPath();
      ctx.ellipse(cx - 7, blobY - 5, 9, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();

      if (sq > 0.5) {
        const ray = (sq - 0.5) / 0.5;
        ctx.strokeStyle = '#22cc44';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r1 = 28 + ray * 32;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * 27, cy + Math.sin(a) * 8);
          ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * (8 + (r1 - 27) * 0.35));
          ctx.stroke();
        }
      }
    }
  }

  // ── 2. Zombie Eat ───────────────────────────────────────────────────────────
  function drawZombieEat(ctx, t) {
    const cx = W / 2, cy = H / 2;

    const wiggle = t < 0.55 ? Math.sin(t * 45) * 5 * (1 - t / 0.55) : 0;
    const pAlpha = t < 0.62 ? 1.0 : Math.max(0, 1 - (t - 0.62) / 0.18);
    arrow(ctx, cx + wiggle, cy, 1.0, 0, pAlpha);

    const armT = Math.min(1, t / 0.45);
    const armTip = W + 20 - armT * (W / 2 + 35);

    ctx.fillStyle = '#556677';
    ctx.fillRect(armTip + 12, cy - 9, W, 18);
    ctx.fillStyle = '#7a8898';
    ctx.beginPath();
    ctx.ellipse(armTip, cy, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#6a7888';
      ctx.fillRect(armTip - 14, cy - 7 + i * 5, 13, 4);
    }

    if (armT > 0.60 && t < 0.78) {
      const bites = Math.floor((t - 0.27) * 7);
      ctx.fillStyle = '#ee3333';
      for (let i = 0; i < Math.min(bites, 4); i++) {
        ctx.beginPath();
        ctx.arc(cx - 6 + i * 6, cy - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── 3. Darkness ─────────────────────────────────────────────────────────────
  function drawDarkness(ctx, t) {
    const cx = W / 2, cy = H / 2;

    // Pitch black — the vignette already closed, ensure solid cover
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    const sec = t * DUR;
    if (sec < 1.0) return; // 1 second of pure silence

    const eyeW = 30, eyeH = 20;
    let openAmount;
    if      (sec < 1.20) openAmount = (sec - 1.0) / 0.20;        // opens over 0.2s
    else if (sec < 2.20) openAmount = 1.0;                        // stares for 1.0s
    else if (sec < 2.50) openAmount = 1 - (sec - 2.20) / 0.30;   // closes over 0.3s
    else                 openAmount = 0;
    openAmount = Math.max(0, openAmount);
    if (openAmount <= 0) return;

    // Red glow behind the eye
    const glowR = 52;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    glow.addColorStop(0, `rgba(160,0,0,${openAmount * 0.6})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

    // Clip to the open eyelid gap
    ctx.save();
    const openH = eyeH * openAmount;
    ctx.beginPath();
    ctx.rect(cx - eyeW - 2, cy - openH, (eyeW + 2) * 2, openH * 2);
    ctx.clip();

    // Entirely red eye — no pupil
    ctx.fillStyle = '#bb0000';
    ctx.beginPath();
    ctx.ellipse(cx, cy, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff1100';
    ctx.beginPath();
    ctx.ellipse(cx, cy, eyeW * 0.58, eyeH * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Black eyelids that part as the eye opens
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx - eyeW - 4, cy - eyeH - 2, (eyeW + 4) * 2, eyeH - openH + 2); // top lid
    ctx.fillRect(cx - eyeW - 4, cy + openH,    (eyeW + 4) * 2, eyeH - openH + 2); // bottom lid
  }

  // ── 4. Queen Impale ─────────────────────────────────────────────────────────
  function drawQueenImpale(ctx, t) {
    const cx = W / 2, cy = H / 2;
    const spikeT = Math.min(1, t / 0.38);
    const tipY = -90 + spikeT * spikeT * (cy + 100);
    const impaled = spikeT > 0.87;

    if (!impaled) {
      arrow(ctx, cx, cy, 1.0, 0, 1.0);
    } else {
      const squirm = Math.sin(t * 32) * 2.5 * Math.max(0, 1 - (t - 0.38) * 2.8);
      arrow(ctx, cx + squirm, cy + 10, 0.82, Math.sin(t * 18) * 0.2, Math.max(0, 1 - (t - 0.60) / 0.22));
    }

    ctx.fillStyle = '#ddaa22';
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - 9, tipY + 62);
    ctx.lineTo(cx + 9, tipY + 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffdd66';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (tipY + 50 < H) {
      const baseY = tipY + 52;
      ctx.fillStyle = '#ffcc44';
      ctx.fillRect(cx - 22, baseY, 44, 22);
      for (let i = 0; i < 3; i++) {
        const tx = cx - 15 + i * 15;
        ctx.fillStyle = '#ddaa22';
        ctx.beginPath();
        ctx.moveTo(tx, baseY);
        ctx.lineTo(tx + 6, baseY - 14);
        ctx.lineTo(tx + 12, baseY);
        ctx.closePath();
        ctx.fill();
      }
      const gems = ['#cc3333', '#33cc33', '#3333cc'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = gems[i];
        ctx.beginPath();
        ctx.arc(cx - 12 + i * 12, baseY + 11, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (impaled && t > 0.40) {
      const dripT = (t - 0.40) * 2.2;
      ctx.fillStyle = '#22cc44';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(cx - 8 + i * 8, cy + 15 + dripT * 10, 3, 3 + dripT * 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── 5. King Flick ───────────────────────────────────────────────────────────
  function drawKingFlick(ctx, t) {
    const cx = W / 2, cy = H / 2;
    const fingerT = Math.min(1, t / 0.26);
    const fingerX = -30 + fingerT * (cx - 16);

    ctx.fillStyle = '#556677';
    ctx.fillRect(0, cy - 10, fingerX + 24, 20);
    ctx.fillStyle = '#7a8898';
    ctx.beginPath();
    ctx.ellipse(fingerX, cy, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aab8a8';
    ctx.beginPath();
    ctx.ellipse(fingerX + 6, cy - 4, 6, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    if (t < 0.26) {
      arrow(ctx, cx, cy, 1.0, 0, 1.0);
    } else {
      const flyT = (t - 0.26) / 0.74;
      const px = cx + flyT * flyT * (W + 80);
      const py = cy - Math.sin(flyT * Math.PI) * 38;
      const rot = flyT * Math.PI * 5;
      if (px < W + 20) {
        arrow(ctx, px, py, Math.max(0.1, 1 - flyT * 0.5), rot, 1.0);
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const lx = px - 18 - i * 14;
          ctx.beginPath();
          ctx.moveTo(lx, py - 2 + i * 1.2);
          ctx.lineTo(lx + 10, py - 2 + i * 1.2);
          ctx.stroke();
        }
        ctx.restore();
      }
      // Finger slowly retracts
      const retract = Math.min(fingerX, flyT * (cx - 16));
      ctx.fillStyle = '#556677';
      ctx.fillRect(0, cy - 10, fingerX - retract, 20);
      ctx.fillStyle = '#7a8898';
      ctx.beginPath();
      ctx.ellipse(fingerX - retract, cy, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── 6. Necro Summon ─────────────────────────────────────────────────────────
  function drawNecroSummon(ctx, t) {
    const cx = W / 2, cy = H / 2;
    const COUNT = 6, R = 72;

    ctx.fillStyle = `rgba(55,0,90,${Math.min(0.55, t * 0.85)})`;
    ctx.fillRect(0, 0, W, H);

    arrow(ctx, cx, cy, 1.0, 0, Math.max(0, 1 - t * 2.8));

    const copyAlpha = Math.min(1.0, t * 2.8);
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      arrow(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0.85, a + Math.PI / 2, copyAlpha);
    }

    if (t > 0.33) {
      const bt = Math.min(1, (t - 0.33) / 0.57);
      ctx.fillStyle = '#ffee44';
      for (let i = 0; i < COUNT; i++) {
        const a = (i / COUNT) * Math.PI * 2;
        const sx = cx + Math.cos(a) * R, sy = cy + Math.sin(a) * R;
        if (bt < 1) {
          ctx.beginPath();
          ctx.arc(sx + (cx - sx) * bt, sy + (cy - sy) * bt, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (bt > 0.88) {
        const burst = (bt - 0.88) / 0.12;
        ctx.fillStyle = `rgba(255,220,60,${burst * 0.85})`;
        ctx.beginPath();
        ctx.arc(cx, cy, burst * 30, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── 7. Dark Overlord Blackout ────────────────────────────────────────────────
  function drawOverlordBlackout(ctx, t) {
    const cx = W / 2, cy = H / 2;

    if (t < 0.18) {
      ctx.fillStyle = `rgba(180,0,0,${(t / 0.18) * 0.7})`;
      ctx.fillRect(0, 0, W, H);
    }
    const black = t < 0.18 ? 0 : Math.min(1, (t - 0.18) / 0.28);
    ctx.fillStyle = `rgba(0,0,0,${black})`;
    ctx.fillRect(0, 0, W, H);

    if (t > 0.42 && t < 0.80) {
      const et = (t - 0.42) / 0.38;
      const eyeAlpha = et < 0.5 ? et * 2 : (1 - et) * 2;
      const eyeGlow = (ex, ey) => {
        const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14);
        g.addColorStop(0, `rgba(255,70,0,${eyeAlpha})`);
        g.addColorStop(0.5, `rgba(180,0,0,${eyeAlpha * 0.7})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(ex - 14, ey - 14, 28, 28);
      };
      eyeGlow(cx - 22, cy);
      eyeGlow(cx + 22, cy);
    }
  }

  // ── 8. Figure Death ─────────────────────────────────────────────────────────
  function drawFigureDeath(ctx, t) {
    const cx = W / 2, cy = H / 2;

    // Instant darkness
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.97, t * 6)})`;
    ctx.fillRect(0, 0, W, H);

    // Phase 1 (t 0→0.28): figure streaks in from left, ease-in
    const ARRIVE = 0.28;
    const sp = Math.min(1, t / ARRIVE);
    const figX = sp * sp * cx;

    if (t < ARRIVE) {
      // Speed blur trail
      ctx.fillStyle = 'rgba(80,100,200,0.10)';
      ctx.fillRect(0, 0, figX, H);
    }

    // Figure streak
    const fx = t < ARRIVE ? figX : cx;
    ctx.fillStyle = 'rgba(215,228,255,0.92)';
    ctx.fillRect(fx,     0, 1, H);
    ctx.fillStyle = 'rgba(120,150,255,0.55)';
    ctx.fillRect(fx - 1, 0, 1, H);
    ctx.fillRect(fx + 1, 0, 1, H);

    // Phase 2 (t 0.28→0.72): figure at center, tendrils reach for player
    if (t >= ARRIVE && t < 0.72) {
      const grabT = (t - ARRIVE) / 0.44;

      // Player shakes
      const shake = Math.sin(grabT * 90) * (1 - grabT) * 7;
      arrow(ctx, cx + shake, cy, 1.0, 0, 1.0);

      // Tendril grows from figure toward player
      const reach = grabT * cx * 0.85;
      ctx.strokeStyle = `rgba(180,205,255,${0.55 * (1 - grabT * 0.5)})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - reach, cy); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Phase 3 (t 0.72→0.80): player wrenched into figure
    if (t >= 0.72 && t < 0.80) {
      const pullT = (t - 0.72) / 0.08;
      const px = cx - pullT * pullT * cx * 0.95;
      const sc = Math.max(0.04, 1 - pullT * 0.97);
      arrow(ctx, px, cy, sc, 0, Math.max(0, 1 - pullT * 2));
      // Figure brightens as it absorbs the player
      ctx.fillStyle = `rgba(255,255,255,${pullT * 0.35})`;
      ctx.fillRect(cx - 2, 0, 4, H);
    }
  }

  return { draw, DUR };
})();
