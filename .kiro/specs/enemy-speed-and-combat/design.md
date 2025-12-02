# Design Document

## Overview

This design adds two complementary gameplay features to Legend of Kiro: configurable enemy speed selection and player combat via a stun gun. The enemy speed selector allows players to adjust difficulty at game start, while the stun gun provides a defensive mechanic that adds strategic depth to gameplay. Both features integrate seamlessly with the existing tile-based grid system and game loop architecture.

## Architecture

### Enemy Speed System

The enemy speed system modifies the existing `GHOST_MOVE_DELAY` constant based on player selection. The architecture follows these principles:

- **Configuration at Start**: Speed selection occurs during the start screen phase before gameplay begins
- **Persistent Setting**: The selected speed persists throughout the game session until restart
- **Relative Scaling**: Enemy speeds are defined relative to player speed for consistent difficulty scaling

### Combat System

The stun gun combat system introduces projectiles and enemy state management:

- **Projectile System**: New projectile entities that move independently on the grid
- **Enemy State Extension**: Ghosts gain a "frozen" state with duration tracking
- **Collision Detection**: Projectile-to-enemy collision detection separate from player-ghost collision
- **Visual Feedback**: Frozen enemies display distinct visual indicators

## Components and Interfaces

### Speed Selection UI Component

```javascript
// Speed configuration object
const SPEED_CONFIGS = {
    slow: {
        label: 'Slow',
        multiplier: 0.5,
        ghostDelay: PLAYER_MOVE_DELAY * 2  // 50% of player speed
    },
    normal: {
        label: 'Normal', 
        multiplier: 1.0,
        ghostDelay: PLAYER_MOVE_DELAY  // Equal to player speed
    },
    fast: {
        label: 'Fast',
        multiplier: 1.5,
        ghostDelay: Math.floor(PLAYER_MOVE_DELAY * 0.67)  // 150% of player speed
    }
};

// Game state extension
let selectedSpeed = 'normal';
```

### Projectile System

```javascript
// Projectile entity structure
const projectiles = [];

const Projectile = {
    x: number,           // Grid x position
    y: number,           // Grid y position
    visualX: number,     // Smooth rendering x
    visualY: number,     // Smooth rendering y
    dirX: number,        // Direction vector x (-1, 0, 1)
    dirY: number,        // Direction vector y (-1, 0, 1)
    speed: number,       // Movement speed (tiles per frame)
    active: boolean      // Whether projectile is still active
};
```

### Enemy State Extension

```javascript
// Ghost entity extension
const Ghost = {
    x: number,
    y: number,
    visualX: number,
    visualY: number,
    moveTimer: number,
    frozen: boolean,         // NEW: Is ghost frozen?
    freezeTimer: number      // NEW: Frames remaining frozen
};

const FREEZE_DURATION = 120;  // 2 seconds at 60 FPS
```

## Data Models

### Speed Selection State

- `selectedSpeed`: String enum ('slow', 'normal', 'fast')
- `SPEED_CONFIGS`: Configuration object mapping speed names to multipliers and delays

### Projectile Model

- Position: Grid coordinates (x, y) with smooth visual coordinates
- Direction: Unit vector (dirX, dirY) indicating travel direction
- Speed: Movement rate in tiles per frame
- Active state: Boolean indicating if projectile should be processed

### Enhanced Ghost Model

- Existing fields: position, visual position, move timer
- New frozen state: Boolean flag
- New freeze timer: Integer countdown in frames

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, I've identified the following consolidations:

- Properties 1.2, 1.3, and 1.4 can be combined into a single comprehensive property that validates speed multipliers for all three settings
- Properties 2.2 and 2.4 together form a complete freeze lifecycle that can be tested as one property
- Property 2.6 is subsumed by property 2.1 if we verify both creation and direction in one test

### Speed Selection Properties

Property 1: Speed setting determines enemy movement delay
*For any* selected speed setting (slow, normal, fast), all enemies should have movement delays that match the configured multiplier relative to player speed
**Validates: Requirements 1.2, 1.3, 1.4**

Property 2: Speed setting persistence
*For any* game session, once a speed is selected, all enemies should maintain that speed configuration until the game restarts
**Validates: Requirements 1.5**

### Combat System Properties

Property 3: Stun gun fires projectile in player direction
*For any* player position and facing direction, pressing spacebar should create a projectile at the player's position moving in the player's facing direction
**Validates: Requirements 2.1, 2.6**

Property 4: Projectile collision freezes enemy
*For any* projectile-enemy collision, the enemy should enter frozen state with a freeze timer of 120 frames (2 seconds)
**Validates: Requirements 2.2**

Property 5: Frozen enemies are immobilized and harmless
*For any* frozen enemy, that enemy should not move and should not damage the player when occupying the same tile
**Validates: Requirements 2.3**

Property 6: Freeze state expires and restores behavior
*For any* frozen enemy, when the freeze timer reaches zero, the enemy should return to normal movement and collision behavior
**Validates: Requirements 2.4**

Property 7: Frozen enemies have distinct visual appearance
*For any* frozen enemy, the rendered output should visually differ from non-frozen enemies (e.g., color change, ice effect)
**Validates: Requirements 2.5**

## Error Handling

### Speed Selection Errors

- **Invalid Speed Selection**: If an invalid speed value is somehow selected, default to 'normal'
- **Missing Speed Configuration**: If speed config is undefined, fall back to original GHOST_MOVE_DELAY constant

### Combat System Errors

- **Projectile Out of Bounds**: Projectiles that leave the grid should be marked inactive and removed
- **Multiple Freeze Attempts**: If a frozen enemy is hit again, reset the freeze timer to maximum duration
- **Invalid Direction**: If player direction cannot be determined, default to facing right

## Testing Strategy

### Unit Testing

We'll use Vitest (already configured in the project) for unit tests:

- Test speed configuration object structure and values
- Test projectile creation with various player directions
- Test freeze timer countdown logic
- Test projectile-wall collision detection
- Test edge cases: projectile at grid boundaries, multiple simultaneous freezes

### Property-Based Testing

We'll use fast-check for property-based testing with a minimum of 100 iterations per property:

**Library**: fast-check (JavaScript property-based testing library)

**Test Configuration**:
```javascript
import fc from 'fast-check';

// Each property test should run at least 100 iterations
fc.assert(fc.property(...), { numRuns: 100 });
```

**Property Test Requirements**:
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: enemy-speed-and-combat, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should generate random game states, positions, and directions to validate properties

**Example Property Test Structure**:
```javascript
// Feature: enemy-speed-and-combat, Property 1: Speed setting determines enemy movement delay
test('enemy speed matches selected multiplier', () => {
    fc.assert(
        fc.property(
            fc.constantFrom('slow', 'normal', 'fast'),
            (speed) => {
                // Test implementation
            }
        ),
        { numRuns: 100 }
    );
});
```

### Integration Testing

- Test complete freeze cycle: fire → hit → freeze → expire → resume
- Test speed selection → game start → enemy movement flow
- Test multiple projectiles and multiple frozen enemies simultaneously
- Test interaction between frozen enemies and particle effects

## Implementation Notes

### Player Direction Tracking

The current game doesn't track player facing direction. We need to add:

```javascript
player.direction = { x: 0, y: -1 };  // Default facing up
```

Update direction whenever player moves successfully.

### Projectile Movement

Projectiles should move faster than player/enemies to feel responsive:

```javascript
const PROJECTILE_SPEED = 0.5;  // Moves 0.5 tiles per frame
```

### Visual Feedback

- Frozen enemies: Render with cyan/blue tint and optional ice particle effects
- Projectiles: Small yellow/white circle or beam effect
- Speed selection UI: Three clickable buttons or keyboard shortcuts (1, 2, 3)

### Performance Considerations

- Limit maximum active projectiles (e.g., 10) to prevent spam
- Remove inactive projectiles from array each frame
- Frozen enemy checks should short-circuit movement logic early

## Future Enhancements

- Cooldown timer for stun gun to prevent spam
- Limited ammo system for stun gun
- Different projectile types (slow, freeze, damage)
- Enemy speed increases as levels progress
- Visual indicator showing player facing direction
