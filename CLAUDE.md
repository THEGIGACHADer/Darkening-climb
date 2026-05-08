# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

Open `index.html` directly in a browser — no build step, no server required. All assets are JS arrays; no external files are fetched.

## Architecture

Script load order in `index.html` matters (no modules, globals only):
`sprites → input → raycaster → renderer2d → player → bullet → slime → zombie → bosses → level → worlds → hud → screens → game`

**Internal resolution:** 320×200 rendered to an offscreen canvas, then scaled up to fill the window with `imageSmoothingEnabled = false` for the pixelated look.

### Rendering
- `engine/raycaster.js` — DDA raycaster for first-person 3D view. Writes directly to `ImageData`, puts once per frame. Handles wall texture (procedural brick), sprite z-buffer for enemies/bullets, crosshair, and hit flash.
- `engine/renderer2d.js` — 2D side-scrolling renderer for boss fights. Uses canvas 2D API. Boss draw logic lives in `entities/bosses.js`.

### Game states (game.js)
`MENU → PLAYING → BOSS_INTRO → BOSS_FIGHT → WORLD_CLEAR → (next world) → WIN`
`GAME_OVER` branches off PLAYING or BOSS_FIGHT when `player.hp <= 0`.

### Coordinate system
- Map indexed `grid[row][col]` = `grid[y][x]`, y increases downward
- Player position is float tile coords `(x, y)`
- Angle 0 = facing right (+x); `cos(angle)=dirX`, `sin(angle)=dirY`
- Arrow Left = `angle -= rotSpeed` (turn counterclockwise), Arrow Right = `angle +=`

### Level format
Level maps are string arrays. Parse chars: `#`=wall, `.`=floor, `s`=slime spawn, `z`=zombie spawn, `e`=exit tile (value 8). `levelInWorld === 4` means boss level — stepping on exit triggers `BOSS_INTRO` instead of advancing.

### Worlds
4 worlds × 5 levels. `WORLD_SPEEDS[worldIndex]` scales enemy speed (1.0 → 1.8). Boss created by `Bosses.create(worldIndex)` — index maps to: 0=Slime Queen, 1=Zombie King, 2=Necromancer, 3=Dark Overlord.

### Enemy behaviour
- **Slime** (`entities/slime.js`): hops on a timer toward player; on death, `Slime.splitSpawns()` returns 2 smaller slimes (stops at size 1). Size 2 is default spawn.
- **Zombie** (`entities/zombie.js`): continuous walk toward player, melee on contact.

### Player mechanics
- 3D mode: WASD move/strafe, ←/→ rotate, Space shoot. Recoil applies an impulse opposite to shot direction; velocity decays with friction each frame.
- 2D boss mode: A/D move, W jump, Space shoot horizontally. Gravity + floor collision handled in `Player.update2D`.
- Shoot cooldown: 0.45 s ("banana speed"). Recoil impulse: 0.5 (small-medium).

### Sprites
`assets/sprites.js` defines `SPRITES.slime`, `.zombie`, `.bullet`, `.player2d` as flat 256-element arrays (16×16) of `0xRRGGBB` integers (null = transparent). Boss art is drawn procedurally in `bosses.js`.
