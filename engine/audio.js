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

  // ── Death SFX ──────────────────────────────────────────────────────────────

  function sched(type, f0, f1, dur, vol, delay = 0) {
    if (!isRunning()) return;
    const t = actx.currentTime + delay;
    const osc = actx.createOscillator();
    const g   = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  function playDeathSfx(cause) {
    if (!isRunning()) return;
    switch (cause) {

      case 'slime':
        // Wet squelch — two detuned descending sawtooth layers
        sched('sawtooth', 220, 35, 0.22, 0.28);
        sched('sawtooth', 160, 28, 0.18, 0.20, 0.05);
        break;

      case 'zombie':
        // Rhythmic chomping — four square bursts
        [0, 0.09, 0.18, 0.27].forEach(d => sched('square', 200, 55, 0.07, 0.16, d));
        break;

      case 'darkness':
        // Deep ominous drone that breathes in and fades — plus eerie high harmonic
        { const t = actx.currentTime;
          const osc = actx.createOscillator(), g = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(38, t);
          osc.frequency.linearRampToValueAtTime(24, t + 2.4);
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.22, t + 0.9);
          g.gain.setValueAtTime(0.22, t + 1.8);
          g.gain.linearRampToValueAtTime(0.001, t + 2.8);
          osc.connect(g); g.connect(master);
          osc.start(t); osc.stop(t + 3.0); }
        sched('sine', 310, 280, 2.0, 0.04, 0.5);
        break;

      case 'slimeQueen':
        // Spike whooshing up then a heavy wet thud
        sched('sawtooth', 80,  900, 0.14, 0.22);
        sched('sine',     100,  18, 0.45, 0.35, 0.15);
        sched('sawtooth', 300,  60, 0.20, 0.15, 0.15);
        break;

      case 'zombieKing':
        // Sharp finger-snap then a tumbling descent
        sched('square',   700,  90, 0.08, 0.28);
        sched('sawtooth', 380,  45, 0.55, 0.18, 0.10);
        break;

      case 'necromancer':
        // Mystical ascending chord — three triangle harmonics
        [[220, 210], [330, 320], [440, 425]].forEach(([f0, f1], i) =>
          sched('triangle', f0, f1, 1.8, 0.10, i * 0.12));
        sched('sine', 110, 95, 2.0, 0.08, 0.3);
        break;

      case 'darkOverlord':
        // Full-spectrum crash — low rumble + mid crunch + high sting + sub wave
        sched('sawtooth', 65,   8, 0.60, 0.35);
        sched('sawtooth', 320, 28, 0.45, 0.22);
        sched('square',   900, 180, 0.30, 0.18);
        sched('sine',      45,  12, 1.20, 0.28, 0.15);
        break;

      default:
        sched('sine', 80, 20, 0.6, 0.20);
        break;
    }
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
    playShoot, playHit, playEnemyDeath, playBossHit, playDeathSfx,
  };
})();
