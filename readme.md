# Railway Runner

A vibrant 3D endless runner inspired by Subway Surfers. Sprint along railway tracks, dodge oncoming trains and barriers, collect coins, grab power-ups, and chase high scores — all in your browser.

## Gameplay

- **Lane Switch** — Swipe or press `← →` to dodge obstacles across three lanes
- **Jump** — Press `↑` or swipe up to leap over barriers
- **Roll** — Press `↓` or swipe down to slide under overhead obstacles
- **Collect Coins** — Gather gold coins to spend in the shop
- **Power-Ups** — Magnet, multiplier, and invincibility spawn on the track
- **Speed Up** — The game accelerates over time — stay sharp!

## Features

- 3D endless runner with lane switching, jumping, and rolling
- Subway Surfers–inspired color palette with red/blue/yellow trains, European stone & urban buildings
- Dynamic obstacles, trains, coins, and power-ups
- Score, distance, and coin tracking with polished HUD
- Shop system with power-ups, characters, and boosters
- Missions and leaderboard tracking
- Web Audio API synth sound effects and background music
- Light / Dark theme support
- Fully responsive — works on desktop and mobile

## Controls

| Input             | Action      |
| ----------------- | ----------- |
| `← →` / Swipe L/R | Switch lane |
| `↑` / Swipe Up    | Jump        |
| `↓` / Swipe Down  | Roll / Duck |
| `P`               | Pause       |

## Tech Stack

- **Three.js** (r128) — 3D rendering
- **Vanilla JavaScript** — game engine, UI, audio
- **CSS3** — HUD, overlays, panels with custom properties
- **HTML5 Canvas** — procedural textures

## Project Structure

```
index.html              — Entry point & UI structure
css/style.css           — Complete UI stylesheet with palette tokens
js/
  config/
    colors.js           — Game-wide color definitions
    constants.js        — Game tuning constants
  core/                 — DOM, renderer, state, helpers
  audio/                — Web Audio synth + BGM
  graphics/             — Textures, materials, geometry, particles
  world/                — Ground, buildings, scenery, spawner
  entities/             — Player, obstacles, collectibles
  ui/                   — HUD, input handling
  game.js               — Main game loop & logic
  home.js               — Home screen controller
```

## Credits

- Game design and implementation: **Thirumurugan**
- 3D rendering: [Three.js](https://threejs.org/)

## License

MIT License
