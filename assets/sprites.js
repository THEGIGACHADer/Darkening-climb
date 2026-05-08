// Each sprite is a 16×16 flat array of 0xRRGGBB colors (null = transparent)
const SPRITES = (() => {
  function make(rows, pal) {
    return rows.flatMap(row => row.split('').map(c => pal[c] ?? null));
  }

  const slime = make([
    '................',
    '.....GGGGGG.....',
    '...GGLLLGGGG....',
    '..GLGGGGGGLLG...',
    '.GGGGGGGGGGGGG..',
    '.GGwwGGGGGwwGG..',
    '.GGwKGGGGGwKGG..',
    '.GGDGGGGGGGGGGG.',
    '.GGDDGGGddGGGG..',
    '.GGGDGGddddGGG..',
    '..GGGGGGddGGG...',
    '..GGGGGGGGG.....',
    '...GGGGGGG......',
    '....GGGGG.......',
    '................',
    '................',
  ], {
    '.': null,
    'G': 0x22cc44, 'L': 0x55ff88, 'D': 0x119933,
    'w': 0xffffff, 'K': 0x000000, 'd': 0x0a7722,
  });

  const zombie = make([
    '................',
    '....ZZZZZZ......',
    '...ZWWWWWWZ.....',
    '..ZWRWWWWRWZ....',
    '..ZWWWWWWWWZ....',
    '..ZWWDDDDWWZ....',
    '...ZZZZZZZZ.....',
    '.BBBZZZZZZZBB...',
    '.B..ZZZZZZZ.B...',
    '.B..ZZZZZZZ.B...',
    '....BZZZZB......',
    '....BZZZZB......',
    '....ZBBBBZ......',
    '....Z....Z......',
    '....B....B......',
    '................',
  ], {
    '.': null,
    'Z': 0x889999, 'W': 0xccdddd, 'R': 0xff2200,
    'D': 0x334455, 'B': 0x445566,
  });

  const bullet = make([
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '......OOO.......',
    '.....OYYYY......',
    '......OOO.......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ], {
    '.': null, 'Y': 0xffee00, 'O': 0xff8800,
  });

  const player2d = make([
    '................',
    '....PPPPPP......',
    '...PAAAAAP......',
    '...PAAAAAP......',
    '....PPPPPP......',
    '...BBBBBBB......',
    '..BBBBBBBBB.....',
    '..BB.BBB.BB.....',
    '...BB.BB.BB.....',
    '....BBBBB.......',
    '....B...B.......',
    '....B...B.......',
    '....S...S.......',
    '....S...S.......',
    '................',
    '................',
  ], {
    '.': null, 'P': 0xccbbaa, 'A': 0x998877,
    'B': 0x334455, 'S': 0x556677,
  });

  return { slime, zombie, bullet, player2d };
})();
