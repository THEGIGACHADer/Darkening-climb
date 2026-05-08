const Input = (() => {
  const keys = {};
  const justPressed = {};

  window.addEventListener('keydown', e => {
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  });

  window.addEventListener('keyup', e => { keys[e.code] = false; });

  return {
    isDown(code) { return !!keys[code]; },
    wasPressed(code) {
      const v = !!justPressed[code];
      if (v) delete justPressed[code];
      return v;
    },
    clearJustPressed() { for (const k in justPressed) delete justPressed[k]; }
  };
})();
