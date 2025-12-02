# Design Document: Score and Visual Effects System

## Overview

This design extends the Legend of Kiro game with a comprehensive scoring system and particle-based visual effects. The system consists of two main components: a score tracking and persistence layer, and a particle effects engine. The scoring system calculates player performance based on items collected, time taken, and health lost, while persisting high scores using browser Local Storage. The particle effects engine provides visual feedback through trail particles, explosions, sparkles, and confetti animations, all rendered on the existing canvas using a frame-based particle system.

## Architecture

The system follows a modular architecture that integrates with the existing game loop:

### Score Management Layer
- **ScoreManager**: Singleton object responsible for score calculation, high score persistence, and UI updates
- Integrates with existing game events (item collection, health loss, level completion)
- Uses localStorage API for persistence

### Particle Effects Engine
- **ParticleSystem**: Manages particle lifecycle (creation, update, rendering, cleanup)
- **Particle Types**: Trail, Explosion, Sparkle, Confetti - each with unique behavior
- Renders on the existing canvas context during the draw phase
- Updates particle positions and properties during the update phase

### Integration Points
- Score updates trigger on existing game events
- Particle effects trigger on player movement and collision events
- Both systems hook into the existing `update()` and `draw()` functions

## Components and Interfaces

### ScoreManager Object

```javascript
const ScoreManager = {
    currentScore: 0,
    highScore: 0,
    startTime: 0,
    
    // Initialize and load high score from storage
    init(): void
    
    // Reset score for new game
    reset(): void
    
    // Add points to current score
    addPoints(points: number): void
    
    // Calculate and add time bonus
    calculateTimeBonus(): number
    
    // Save high score to localStorage
    saveHighScore(): void
    
    // Load high score from localStorage
    loadHighScore(): number
    
    // Update UI elements
    updateUI(): void
}
```

### ParticleSystem Object

```javascript
const ParticleSystem = {
    particles: [],
    
    // Update all particles
    update(): void
    
    // Render all particles
    draw(ctx: CanvasRenderingContext2D): void
    
    // Create trail particles
    createTrail(x: number, y: number): void
    
    // Create explosion particles
    createExplosion(x: number, y: number): void
    
    // Create sparkle particles
    createSparkle(x: number, y: number): void
    
    // Create confetti effect
    createConfetti(): void
    
    // Remove dead particles
    cleanup(): void
}
```

### Particle Interface

```javascript
interface Particle {
    x: number;           // Position X
    y: number;           // Position Y
    vx: number;          // Velocity X
    vy: number;          // Velocity Y
    life: number;        // Remaining lifetime (frames)
    maxLife: number;     // Initial lifetime
    size: number;        // Particle size
    color: string;       // Particle color
    type: string;        // Particle type identifier
}
```

## Data Models

### Score Data Structure

```javascript
{
    currentScore: number,      // Current game session score
    highScore: number,         // All-time high score
    startTime: number,         // Game start timestamp (ms)
    itemsCollected: number,    // Items collected this session
    healthLost: number         // Health points lost this session
}
```

### LocalStorage Schema

```javascript
// Key: 'kiroHighScore'
{
    score: number,             // High score value
    date: string              // ISO timestamp of achievement
}
```

### Particle Array

```javascript
particles: [
    {
        x: number,
        y: number,
        vx: number,
        vy: number,
        life: number,
        maxLife: number,
        size: number,
        color: string,
        type: 'trail' | 'explosion' | 'sparkle' | 'confetti'
    },
    // ... more particles
]
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Score System Properties

**Property 1: Item collection increases score**
*For any* game state with a valid score, collecting an item should increase the score by a positive value.
**Validates: Requirements 1.2**

**Property 2: Health loss decreases score**
*For any* game state with a positive score, losing health should decrease the score (or keep it at zero if already zero).
**Validates: Requirements 1.4**

**Property 3: Time bonus correlates with speed**
*For any* two level completions, the completion with shorter time should receive a higher or equal time bonus.
**Validates: Requirements 1.3**

**Property 4: Score UI reflects current value**
*For any* score change, the UI element displaying the score should contain the updated score value after the change.
**Validates: Requirements 1.5**

**Property 5: High score updates when exceeded**
*For any* game state where current score exceeds high score, the high score value should be updated to match the current score.
**Validates: Requirements 2.2**

**Property 6: High score persistence round-trip**
*For any* high score value, saving it to localStorage and then loading it should return the same value.
**Validates: Requirements 2.3**

**Property 7: UI displays both scores**
*For any* game state, the UI should display both the current score and the high score values.
**Validates: Requirements 2.4**

### Particle System Properties

**Property 8: Movement generates trail particles**
*For any* player movement from position A to position B during playing state, trail particles should be generated at position A.
**Validates: Requirements 3.1**

**Property 9: Particle opacity decreases over time**
*For any* trail particle, its opacity after N frames should be less than its opacity after N-1 frames (until it reaches zero).
**Validates: Requirements 3.2**

**Property 10: Particles cleanup after lifetime**
*For any* particle type (trail, explosion, sparkle, confetti), when its life counter reaches zero, it should be removed from the particle array.
**Validates: Requirements 3.3, 4.4, 5.4, 6.4**

**Property 11: Trail particles use brand colors**
*For any* trail particle created, its color should be one of the Kiro brand palette colors (purple-500, purple-400, purple-300).
**Validates: Requirements 3.4**

**Property 12: No particles in non-playing state**
*For any* game state that is not 'playing', no new trail particles should be generated when the player position changes.
**Validates: Requirements 3.5**

**Property 13: Collision triggers explosion**
*For any* collision between player and ghost, an explosion effect should be created at the collision position.
**Validates: Requirements 4.1**

**Property 14: Explosion creates multiple particles**
*For any* explosion effect, it should generate at least 8 particles with velocities radiating outward from the center.
**Validates: Requirements 4.2**

**Property 15: Explosion particles use danger colors**
*For any* explosion particle created, its color should be a danger/impact color (red, orange, or yellow spectrum).
**Validates: Requirements 4.3**

**Property 16: Multiple explosions render independently**
*For any* set of simultaneous explosions, each explosion's particles should be present in the particle array and rendered independently.
**Validates: Requirements 4.5**

**Property 17: Wall proximity triggers sparkles**
*For any* player position adjacent to a wall tile (within 1 tile distance), sparkle particles should be generated at the player's position.
**Validates: Requirements 5.1**

**Property 18: Sparkle particles have shimmer properties**
*For any* sparkle particle, it should have size variation or color brightness that changes over its lifetime to create a shimmering effect.
**Validates: Requirements 5.2**

**Property 19: Sparkle particles use bright colors**
*For any* sparkle particle created, its color should have high brightness values (RGB components > 200).
**Validates: Requirements 5.3**

**Property 20: No sparkles away from walls**
*For any* player position not adjacent to walls, no sparkle particles should be generated.
**Validates: Requirements 5.5**

**Property 21: New high score triggers confetti**
*For any* game state where the current score becomes greater than the previous high score, a confetti effect should be triggered.
**Validates: Requirements 6.1**

**Property 22: Confetti generates multiple particles**
*For any* confetti effect trigger, it should generate multiple particles (at least 20) with initial positions at the top of the screen.
**Validates: Requirements 6.2**

**Property 23: Confetti has gravity and drift**
*For any* confetti particle, its vertical velocity should increase over time (gravity), and it should have a non-zero horizontal velocity component (drift).
**Validates: Requirements 6.3**

**Property 24: Confetti continues for duration**
*For any* confetti effect, new particles should continue to be generated for at least 60 frames (approximately 1 second at 60 FPS).
**Validates: Requirements 6.5**

## Error Handling

### Score System Errors

**Invalid Score Values**
- Negative scores should be clamped to zero
- NaN or undefined scores should default to zero
- localStorage errors should fail gracefully, defaulting to zero high score

**localStorage Failures**
- Catch and log localStorage quota exceeded errors
- Handle localStorage disabled/unavailable scenarios
- Provide fallback in-memory high score tracking

### Particle System Errors

**Performance Safeguards**
- Limit maximum particle count to prevent performance degradation (max 500 particles)
- Remove oldest particles first when limit is reached
- Skip particle generation if frame rate drops below threshold

**Invalid Particle Data**
- Validate particle positions are within reasonable bounds
- Handle NaN velocities by removing affected particles
- Ensure particle colors are valid CSS color strings

**Canvas Context Errors**
- Verify canvas context exists before rendering
- Catch and log rendering errors without crashing game loop
- Gracefully degrade if particle rendering fails

## Testing Strategy

### Unit Testing

We will use a minimal unit testing approach focused on core functionality:

**Score System Tests**
- Test score initialization to zero on game start
- Test high score loading from empty localStorage (edge case)
- Test localStorage save/load with specific values
- Test score UI update with specific score values

**Particle System Tests**
- Test particle creation with specific parameters
- Test particle array cleanup after lifetime expires
- Test maximum particle limit enforcement
- Test particle generation in different game states

### Property-Based Testing

We will use **fast-check** (a JavaScript property-based testing library) to verify universal properties across many randomly generated inputs. Each property test will run a minimum of 100 iterations.

**Configuration**
```javascript
// fast-check configuration
fc.configureGlobal({ numRuns: 100 });
```

**Score System Property Tests**
- **Property 1**: Generate random game states and items, verify score increases
- **Property 2**: Generate random game states, verify health loss decreases score
- **Property 3**: Generate random completion times, verify time bonus ordering
- **Property 4**: Generate random score changes, verify UI updates
- **Property 5**: Generate random scores above/below high score, verify updates
- **Property 6**: Generate random high score values, verify localStorage round-trip
- **Property 7**: Generate random game states, verify both scores in UI

**Particle System Property Tests**
- **Property 8**: Generate random player movements, verify trail generation
- **Property 9**: Generate random trail particles, verify opacity decrease
- **Property 10**: Generate random particles of all types, verify cleanup
- **Property 11**: Generate random trail particles, verify brand colors
- **Property 12**: Generate random non-playing states, verify no trails
- **Property 13**: Generate random collisions, verify explosions
- **Property 14**: Generate random explosions, verify particle count
- **Property 15**: Generate random explosion particles, verify danger colors
- **Property 16**: Generate multiple simultaneous explosions, verify independence
- **Property 17**: Generate random positions near walls, verify sparkles
- **Property 18**: Generate random sparkle particles, verify shimmer properties
- **Property 19**: Generate random sparkle particles, verify brightness
- **Property 20**: Generate random positions away from walls, verify no sparkles
- **Property 21**: Generate random high score achievements, verify confetti
- **Property 22**: Generate random confetti triggers, verify particle count
- **Property 23**: Generate random confetti particles, verify physics
- **Property 24**: Generate random confetti effects, verify duration

**Test Tagging Format**
Each property-based test will include a comment tag:
```javascript
// Feature: score-and-effects, Property 1: Item collection increases score
```

### Integration Testing

**End-to-End Scenarios**
- Complete game playthrough with score tracking
- High score persistence across page reloads
- Visual effects during full gameplay session
- Performance testing with maximum particle counts

### Performance Testing

**Benchmarks**
- Measure frame rate with 500 active particles
- Measure localStorage read/write times
- Verify 60 FPS maintained during heavy particle effects
- Test memory usage over extended gameplay sessions
