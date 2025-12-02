# Project Structure

## Root Files
```
├── index.html          # Main HTML entry point with canvas and UI
├── game.js             # Complete game logic and rendering
├── kiro-logo.png       # Player sprite image
└── .kiro/              # Kiro AI assistant configuration
    └── steering/       # AI guidance documents
```

## Code Organization

### game.js Structure
The game follows a classic game loop architecture:

1. **Constants** - Game configuration (tile size, grid dimensions, speeds)
2. **Game State** - Current state tracking (start, playing, gameOver, levelComplete)
3. **Map Data** - 2D array representing the dungeon layout
4. **Initialization** - `init()` sets up canvas, loads assets, binds controls
5. **Game Loop** - `gameLoop()` calls `update()` and `draw()` each frame
6. **Update Logic** - Player movement, ghost AI, collision detection
7. **Rendering** - Canvas drawing functions for all game elements
8. **UI Updates** - Health and item counter display

### Key Patterns
- **Tile-based grid system** - All positions use grid coordinates (x, y)
- **Frame-based timing** - Movement delays prevent instant sliding
- **State machine** - Game state controls which screens/logic are active
- **Immutable map template** - Original map preserved, working copy modified during play

### Conventions
- Constants use SCREAMING_SNAKE_CASE
- Functions use camelCase
- Grid coordinates: (0,0) is top-left
- Tile types defined in TILES enum object
- All measurements in pixels or grid units
