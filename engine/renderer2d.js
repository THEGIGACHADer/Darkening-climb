const Renderer2D = (() => {
  const W = 320, H = 200;
  const FLOOR_Y = H * 0.55;
  const VP = { x: W / 2, y: FLOOR_Y };

  let offscreen, ctx;

  function init() {
    offscreen = document.createElement('canvas');
    offscreen.width = W; offscreen.height = H;
    ctx = offscreen.getContext('2d');
  }

  // ── World 0: Slime Caves ──────────────────────────────────────────────────
  function drawBackWall0() {
    const grad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    grad.addColorStop(0, '#0a1208');
    grad.addColorStop(1, '#182814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, FLOOR_Y);

    // Rough cave-rock texture
    ctx.strokeStyle = 'rgba(10,28,8,0.9)';
    ctx.lineWidth = 1;
    const tileH = 18, tileW = 28;
    for (let row = 0; row * tileH < FLOOR_Y; row++) {
      const off = (row % 2) * (tileW / 2);
      for (let col = -1; col * tileW < W + tileW; col++) {
        const v = 18 + ((row * 7 + col * 13) % 12) | 0;
        ctx.fillStyle = `rgb(${v},${v + 10},${v})`;
        ctx.fillRect(col * tileW + off + 1, row * tileH + 1, tileW - 2, tileH - 2);
        ctx.strokeRect(col * tileW + off, row * tileH, tileW, tileH);
      }
    }

    // Slime drips from ceiling
    ctx.fillStyle = 'rgba(30,160,40,0.45)';
    [[55, 18], [130, 12], [200, 22], [270, 16]].forEach(([x, h]) => {
      ctx.beginPath();
      ctx.moveTo(x - 3, 0); ctx.lineTo(x + 3, 0);
      ctx.lineTo(x + 2, h); ctx.arc(x, h + 3, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPerspectiveFloor0() {
    for (let y = FLOOR_Y | 0; y < H; y++) {
      const t = (y - FLOOR_Y) / (H - FLOOR_Y);
      ctx.fillStyle = `rgb(${(18 + t*22)|0},${(28+t*30)|0},${(14+t*18)|0})`;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.strokeStyle = 'rgba(40,90,28,0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo(VP.x, VP.y); ctx.lineTo((i/12)*W, H); ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const t = Math.pow(i/5,1.6), yy = FLOOR_Y + t*(H-FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(W,yy); ctx.stroke();
    }
  }

  function drawSideWalls0() {
    ctx.fillStyle = '#080e06';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.22,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#0f1a0c';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.05,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#060c04';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.78,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
    ctx.fillStyle = '#0d180a';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.95,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
  }

  function drawAtmos0() {
    // Green glowing slime pools on floor
    [[80,H-10,18],[W/2,H-8,22],[W-70,H-10,16]].forEach(([x,y,r]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(40,200,60,0.28)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x,y,r,r*0.4,0,0,Math.PI*2); ctx.fill();
    });
    // Vines
    vineStrand(6,0,14,38,10,72); vineStrand(18,0,8,50,20,90);
    vineStrand(W-6,0,W-14,42,W-10,68); vineStrand(W-18,0,W-8,48,W-22,85);
    // Mushroom torches
    [W*0.28, W*0.72].forEach(tx => {
      const ty = FLOOR_Y * 0.55;
      ctx.fillStyle = 'rgba(80,200,60,0.12)';
      ctx.beginPath(); ctx.arc(tx, ty-8, 12, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a8a22'; ctx.beginPath(); ctx.arc(tx,ty,5,Math.PI,0); ctx.fill();
      ctx.fillStyle = '#22cc33'; ctx.beginPath(); ctx.arc(tx,ty-2,3,0,Math.PI*2); ctx.fill();
    });
  }

  // ── World 1: Zombie Graveyard ─────────────────────────────────────────────
  function drawBackWall1() {
    // Night sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    grad.addColorStop(0, '#0a0a18');
    grad.addColorStop(1, '#181828');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, FLOOR_Y);

    // Stars
    ctx.fillStyle = 'rgba(230,230,255,0.7)';
    [[30,8],[70,18],[110,5],[155,14],[195,7],[240,19],[285,10],[305,15],
     [50,28],[140,25],[220,30],[170,35]].forEach(([x,y]) => {
      ctx.fillRect(x,y,1,1);
    });

    // Moon
    ctx.fillStyle = 'rgba(220,220,200,0.88)';
    ctx.beginPath(); ctx.arc(W-38, 20, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(200,195,180,0.50)';
    ctx.beginPath(); ctx.arc(W-34, 17, 9, 0, Math.PI*2); ctx.fill();

    // Silhouette tombstones
    ctx.fillStyle = '#14141e';
    [[50,FLOOR_Y-28,16,28],[110,FLOOR_Y-22,14,22],[190,FLOOR_Y-30,18,30],
     [255,FLOOR_Y-24,15,24]].forEach(([x,y,w,h]) => {
      ctx.fillRect(x,y,w,h);
      // Arch top
      ctx.beginPath(); ctx.arc(x+w/2,y,w/2,Math.PI,0); ctx.fill();
    });
    // Dead tree silhouette
    ctx.fillStyle = '#10101a';
    ctx.fillRect(W*0.5-2, FLOOR_Y-45, 4, 45);
    ctx.fillRect(W*0.5-18, FLOOR_Y-32, 18, 2);
    ctx.fillRect(W*0.5+2, FLOOR_Y-26, 14, 2);
  }

  function drawPerspectiveFloor1() {
    for (let y = FLOOR_Y | 0; y < H; y++) {
      const t = (y - FLOOR_Y) / (H - FLOOR_Y);
      ctx.fillStyle = `rgb(${(22+t*28)|0},${(20+t*22)|0},${(18+t*20)|0})`;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.strokeStyle = 'rgba(80,70,55,0.40)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo(VP.x,VP.y); ctx.lineTo((i/12)*W,H); ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const t = Math.pow(i/5,1.6), yy = FLOOR_Y + t*(H-FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(W,yy); ctx.stroke();
    }
  }

  function drawSideWalls1() {
    ctx.fillStyle = '#0c0c18';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.22,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#141420';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.05,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#0a0a16';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.78,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
    ctx.fillStyle = '#12121e';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.95,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
  }

  function drawAtmos1() {
    // Eerie green fog patches
    [[W*0.2,FLOOR_Y+10],[W*0.8,FLOOR_Y+8]].forEach(([x,y]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,40);
      g.addColorStop(0,'rgba(40,80,30,0.18)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x-40,y-10,80,20);
    });
    // Lantern torches on side walls
    [W*0.28, W*0.72].forEach(tx => {
      const ty = FLOOR_Y * 0.52;
      ctx.fillStyle = 'rgba(180,140,40,0.14)';
      ctx.beginPath(); ctx.arc(tx, ty, 14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#554422';
      ctx.fillRect(tx-2, ty-2, 5, 10);
      ctx.fillStyle = '#cc8800';
      ctx.beginPath(); ctx.arc(tx+1,ty-4,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath(); ctx.arc(tx+1,ty-6,1.5,0,Math.PI*2); ctx.fill();
    });
  }

  // ── World 2: Haunted Dungeon ──────────────────────────────────────────────
  function drawBackWall2() {
    const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y);
    grad.addColorStop(0,'#100820');
    grad.addColorStop(1,'#1e1230');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,FLOOR_Y);

    ctx.strokeStyle = 'rgba(18,10,35,0.85)';
    ctx.lineWidth = 1;
    const tileH = 18, tileW = 28;
    for (let row = 0; row * tileH < FLOOR_Y; row++) {
      const off = (row%2)*(tileW/2);
      for (let col = -1; col*tileW < W+tileW; col++) {
        const v = 22 + ((row*7+col*13)%14)|0;
        ctx.fillStyle = `rgb(${v+8},${v},${v+22})`;
        ctx.fillRect(col*tileW+off+1, row*tileH+1, tileW-2, tileH-2);
        ctx.strokeRect(col*tileW+off, row*tileH, tileW, tileH);
      }
    }

    // Ghost silhouettes
    ctx.fillStyle = 'rgba(200,190,230,0.06)';
    [[80, FLOOR_Y*0.3], [235, FLOOR_Y*0.45]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x,y,10,Math.PI,0); ctx.lineTo(x+10,y+14);
      ctx.quadraticCurveTo(x+7,y+10,x+4,y+14);
      ctx.quadraticCurveTo(x+1,y+10,x-2,y+14);
      ctx.quadraticCurveTo(x-6,y+10,x-10,y+14);
      ctx.fill();
    });
  }

  function drawPerspectiveFloor2() {
    for (let y = FLOOR_Y | 0; y < H; y++) {
      const t = (y - FLOOR_Y) / (H - FLOOR_Y);
      ctx.fillStyle = `rgb(${(18+t*20)|0},${(14+t*16)|0},${(26+t*28)|0})`;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.strokeStyle = 'rgba(100,70,140,0.38)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo(VP.x,VP.y); ctx.lineTo((i/12)*W,H); ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const t = Math.pow(i/5,1.6), yy = FLOOR_Y + t*(H-FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(W,yy); ctx.stroke();
    }
  }

  function drawSideWalls2() {
    ctx.fillStyle = '#0a0614';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.22,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#130a22';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.05,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#080410';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.78,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
    ctx.fillStyle = '#10081e';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.95,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
  }

  function drawAtmos2() {
    // Purple mist
    const g = ctx.createLinearGradient(0,FLOOR_Y,0,H);
    g.addColorStop(0,'rgba(80,40,120,0.18)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0,FLOOR_Y,W,H-FLOOR_Y);

    // Candle sconces
    [W*0.28, W*0.72].forEach(tx => {
      const ty = FLOOR_Y * 0.50;
      ctx.fillStyle = 'rgba(200,100,255,0.10)';
      ctx.beginPath(); ctx.arc(tx,ty-6,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#332244';
      ctx.fillRect(tx-1,ty-2,3,8);
      ctx.fillStyle = '#9933cc';
      ctx.beginPath(); ctx.arc(tx,ty-4,2.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#cc88ff';
      ctx.beginPath(); ctx.arc(tx,ty-6,1.2,0,Math.PI*2); ctx.fill();
    });

    // Cobweb corners
    ctx.strokeStyle = 'rgba(200,180,230,0.30)';
    ctx.lineWidth = 0.5;
    [[10,0],[W-10,0]].forEach(([cx]) => {
      for (let a = 0; a < Math.PI/2; a += Math.PI/8) {
        const side = cx < W/2 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(cx,0);
        ctx.lineTo(cx + side*Math.cos(a)*22, Math.sin(a)*22); ctx.stroke();
      }
    });
  }

  // ── World 3: Final Fortress ───────────────────────────────────────────────
  function drawBackWall3() {
    const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y);
    grad.addColorStop(0,'#120404');
    grad.addColorStop(1,'#2a0a08');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,FLOOR_Y);

    ctx.strokeStyle = 'rgba(20,4,4,0.9)';
    ctx.lineWidth = 1;
    const tileH = 18, tileW = 28;
    for (let row = 0; row*tileH < FLOOR_Y; row++) {
      const off = (row%2)*(tileW/2);
      for (let col = -1; col*tileW < W+tileW; col++) {
        const v = 28 + ((row*7+col*13)%16)|0;
        ctx.fillStyle = `rgb(${v+18},${v+4},${v})`;
        ctx.fillRect(col*tileW+off+1,row*tileH+1,tileW-2,tileH-2);
        ctx.strokeRect(col*tileW+off,row*tileH,tileW,tileH);
      }
    }

    // Lava cracks on wall
    ctx.strokeStyle = 'rgba(255,80,0,0.30)';
    ctx.lineWidth = 1.5;
    [[60,FLOOR_Y*0.2,90,FLOOR_Y*0.6],[170,FLOOR_Y*0.1,150,FLOOR_Y*0.55],
     [240,FLOOR_Y*0.3,260,FLOOR_Y*0.65]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1);
      ctx.lineTo((x1+x2)/2+8,  (y1+y2)/2-6);
      ctx.lineTo(x2, y2); ctx.stroke();
    });
  }

  function drawPerspectiveFloor3() {
    for (let y = FLOOR_Y | 0; y < H; y++) {
      const t = (y - FLOOR_Y) / (H - FLOOR_Y);
      ctx.fillStyle = `rgb(${(30+t*38)|0},${(10+t*14)|0},${(6+t*8)|0})`;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.strokeStyle = 'rgba(200,60,0,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo(VP.x,VP.y); ctx.lineTo((i/12)*W,H); ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const t = Math.pow(i/5,1.6), yy = FLOOR_Y + t*(H-FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(W,yy); ctx.stroke();
    }
    // Lava glow seeping from floor cracks
    [[W*0.3,H],[W*0.7,H]].forEach(([x,y]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,35);
      g.addColorStop(0,'rgba(255,80,0,0.22)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x-35,y-20,70,20);
    });
  }

  function drawSideWalls3() {
    ctx.fillStyle = '#0e0202';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.22,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#1c0604';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.05,FLOOR_Y); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle = '#0c0202';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.78,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
    ctx.fillStyle = '#180504';
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W*0.95,FLOOR_Y); ctx.lineTo(W,H); ctx.fill();
  }

  function drawAtmos3() {
    // Lava glow from below
    const g = ctx.createLinearGradient(0,FLOOR_Y,0,H);
    g.addColorStop(0,'rgba(200,50,0,0.22)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0,FLOOR_Y,W,H-FLOOR_Y);

    // Fire sconces
    [W*0.28, W*0.72].forEach(tx => {
      const ty = FLOOR_Y * 0.48;
      ctx.fillStyle = 'rgba(255,100,0,0.18)';
      ctx.beginPath(); ctx.arc(tx,ty-8,14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#662200';
      ctx.fillRect(tx-3,ty-2,6,12);
      ctx.fillStyle = '#ff5500';
      ctx.beginPath(); ctx.arc(tx,ty-6,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffaa22';
      ctx.beginPath(); ctx.arc(tx,ty-9,2.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffee88';
      ctx.beginPath(); ctx.arc(tx,ty-11,1.2,0,Math.PI*2); ctx.fill();
    });
  }

  // ── Shared helpers ────────────────────────────────────────────────────────
  function vineStrand(x0, y0, cpx, cpy, x1, y1) {
    ctx.strokeStyle = 'rgba(30, 80, 18, 0.82)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo(cpx,cpy,x1,y1); ctx.stroke();
    ctx.fillStyle = 'rgba(44, 104, 24, 0.78)';
    for (let i = 0; i < 3; i++) {
      const t = (i+0.5)/3;
      const lx = (1-t)*(1-t)*x0+2*(1-t)*t*cpx+t*t*x1;
      const ly = (1-t)*(1-t)*y0+2*(1-t)*t*cpy+t*t*y1;
      const side = i%2===0 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(lx,ly);
      ctx.quadraticCurveTo(lx+side*8,ly-1,lx+side*6,ly+7);
      ctx.quadraticCurveTo(lx+side*1,ly+6,lx,ly); ctx.fill();
    }
  }

  function drawPlayer2D(p) {
    const x = p.x2d | 0, y = p.y2d | 0;
    const dir = p.facing;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(x,y+1,8,3,0,0,Math.PI*2); ctx.fill();

    ctx.fillStyle = '#334455';
    ctx.fillRect(x-5,y-16,4,16); ctx.fillRect(x+1,y-16,4,16);

    ctx.fillStyle = '#445566';
    ctx.fillRect(x-7,y-32,14,18);
    ctx.fillStyle = '#556677';
    ctx.fillRect(x-6,y-30,12,3);

    ctx.fillStyle = '#4a5f70';
    ctx.fillRect(x-10,y-30,5,8); ctx.fillRect(x+5,y-30,5,8);

    ctx.fillStyle = '#3a4a5a';
    ctx.fillRect(x-5,y-42,10,12);
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(x-4,y-38,8,3);

    ctx.fillStyle = '#222';
    ctx.fillRect(x+dir*6,y-26,dir*12,4);
  }

  const DRAW_BW   = [drawBackWall0,    drawBackWall1,    drawBackWall2,    drawBackWall3];
  const DRAW_FL   = [drawPerspectiveFloor0, drawPerspectiveFloor1, drawPerspectiveFloor2, drawPerspectiveFloor3];
  const DRAW_SW   = [drawSideWalls0,   drawSideWalls1,   drawSideWalls2,   drawSideWalls3];
  const DRAW_ATM  = [drawAtmos0,       drawAtmos1,        drawAtmos2,        drawAtmos3];

  function render(boss, player2d, bullets, flashAlpha, worldIndex) {
    const w = worldIndex || 0;

    DRAW_BW[w]();
    DRAW_FL[w]();
    DRAW_SW[w]();
    DRAW_ATM[w]();

    if (boss) boss.draw(ctx, W, H);

    ctx.fillStyle = '#ffcc00';
    for (const b of bullets) ctx.fillRect(b.x|0, b.y|0, 4, 3);

    drawPlayer2D(player2d);

    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(180,0,0,${flashAlpha * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (boss) {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(20, 8, W - 40, 10);
      const pct = Math.max(0, boss.hp / boss.maxHp);
      const barColor = pct > 0.5 ? '#33dd55' : pct > 0.25 ? '#ffcc00' : '#dd2200';
      ctx.fillStyle = barColor;
      ctx.fillRect(20, 8, ((W - 40) * pct) | 0, 10);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 8, W - 40, 10);
      ctx.fillStyle = '#fff';
      ctx.font = '6px Arial, sans-serif';
      ctx.fillText(boss.name, 22, 16);
    }

    return offscreen;
  }

  return { init, render };
})();
