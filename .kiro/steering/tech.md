# Technology Stack

## Core Technologies
- **Vanilla JavaScript (ES6+)** - No frameworks or build tools required
- **HTML5 Canvas API** - For 2D rendering and graphics
- **CSS3** - Minimal styling for layout and UI

## Architecture
- Single-page application with no dependencies
- Client-side only (no backend required)
- Game loop using `requestAnimationFrame` for smooth 60 FPS rendering
- Event-driven input handling with keyboard controls

## Key Libraries & APIs
- Native Canvas 2D Context for drawing
- Image API for sprite loading (kiro-logo.png)
- Keyboard Events API for player controls

## Running the Game
No build process required. Simply open `index.html` in a modern web browser:

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a local server (recommended)
python3 -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Use Node.js http-server
npx http-server
```

## Development Workflow
- Edit `game.js` for game logic
- Edit `index.html` for structure and inline styles
- Refresh browser to see changes (no compilation needed)
- Use browser DevTools console for debugging
