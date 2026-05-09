const Audio = (() => {
  let actx = null;
  let master = null;
  let musicNodes = [];

  function getCtx() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain();
      master.gain.value = 0.45;
      master.connect(actx.destination);
    }
    return actx;
  }

  function resume() {
    getCtx();
    if (actx.state === 'suspended') actx.resume();
  }

  function isRunning() { return actx && actx.state === 'running'; }

  // ── Music ──────────────────────────────────────────────────────────────────

  function stopMusic() {
    for (const n of musicNodes) {
      try { n.stop(); } catch(e) {}
      try { n.disconnect(); } catch(e) {}
    }
    musicNodes = [];
  }

  function mk(n) { musicNodes.push(n); return n; }

  function drone(freq, vol, type = 'sine') {
    const osc = mk(actx.createOscillator());
    const g   = mk(actx.createGain());
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = vol;
    osc.connect(g); g.connect(master);
    osc.start();
    return { osc, g };
  }

  function lfo(target, freq, depth) {
    const osc = mk(actx.createOscillator());
    const g   = mk(actx.createGain());
    osc.frequency.value = freq;
    g.gain.value = depth;
    osc.connect(g); g.connect(target);
    osc.start();
  }

  function playMenuMusic() {
    getCtx(); stopMusic();
    // Eerie low drone with slow beating and tremolo
    const d1 = drone(55,   0.10);
    const d2 = drone(55.5, 0.07);
    const d3 = drone(82,   0.05, 'triangle');
    const d4 = drone(220,  0.02);
    lfo(d1.osc.frequency, 0.05, 1.0);
    lfo(d4.g.gain, 0.28, 0.018);
  }

  function playGameMusic(worldIndex) {
    getCtx(); stopMusic();
    // Tension rises with each world
    const base = 55 + worldIndex * 8;
    const d1 = drone(base,          0.09);
    const d2 = drone(base * 1.006,  0.06);
    const d3 = drone(base * 1.498,  0.04, 'triangle');
    lfo(d1.osc.frequency, 0.07 + worldIndex * 0.015, 1.0);
    lfo(d3.g.gain,        0.35 + worldIndex * 0.10,  0.03);
  }

  function playBossMusic(worldIndex) {
    getCtx(); stopMusic();
    // Dissonant and heavy
    const d1 = drone(40,   0.12, 'sawtooth');
    const d2 = drone(40.9, 0.08, 'sawtooth');
    const d3 = drone(60,   0.06, 'square');
    const d4 = drone(880 + worldIndex * 110, 0.015);
    lfo(d1.osc.frequency, 0.10, 2.0);
    lfo(d3.g.gain, 1.2 + worldIndex * 0.4, 0.05);
    lfo(d4.g.gain, 3.5, 0.012);
  }

  function playWorldClear() {
    if (!isRunning()) return;
    [262, 330, 392, 524].forEach((freq, i) => {
      const now = actx.currentTime + i * 0.14;
      const osc = actx.createOscillator();
      const g   = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.18, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(g); g.connect(master);
      osc.start(now); osc.stop(now + 0.44);
    });
  }

  // ── SFX ────────────────────────────────────────────────────────────────────

  function sfx(type, f0, f1, dur, vol) {
    if (!isRunning()) return;
    const now = actx.currentTime;
    const osc = actx.createOscillator();
    const g   = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(f1, now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + dur + 0.02);
  }

  function playShoot()      { sfx('square',   380,  75, 0.10, 0.20); }
  function playHit()        { sfx('sine',     110,  28, 0.20, 0.30); }
  function playEnemyDeath() { sfx('sawtooth', 280,  45, 0.14, 0.15); }
  function playBossHit()    { sfx('sawtooth', 180,  35, 0.25, 0.26); }

  return {
    resume,
    stopMusic,
    playMenuMusic, playGameMusic, playBossMusic, playWorldClear,
    playShoot, playHit, playEnemyDeath, playBossHit,
  };
})();
