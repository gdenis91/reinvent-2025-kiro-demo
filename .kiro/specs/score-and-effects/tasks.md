# Implementation Plan

- [x] 1. Implement score tracking system with localStorage persistence
  - Create ScoreManager object with score calculation logic
  - Implement localStorage save/load for high scores
  - Add score increase on item collection (+100 points per item)
  - Add score penalty on health loss (-50 points per hit)
  - Calculate time bonus on level completion (bonus = max(0, 1000 - seconds * 10))
  - Update HTML to display current score and high score in UI
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.1 Write property test for score increases
  - **Property 1: Item collection increases score**
  - **Validates: Requirements 1.2**

- [x] 1.2 Write property test for high score persistence
  - **Property 6: High score persistence round-trip**
  - **Validates: Requirements 2.3**

- [x] 1.3 Write unit test for localStorage edge case
  - Test high score initialization when localStorage is empty
  - **Validates: Requirements 2.5**

- [x] 2. Create particle system foundation and trail effects
  - Create ParticleSystem object with particle array and lifecycle management
  - Implement particle update and draw functions
  - Create trail particle generation on player movement
  - Implement particle opacity fade over lifetime
  - Use Kiro brand colors (#790ECB, #9D4EDD, #C77DFF) for trail particles
  - Integrate particle system into game loop (update and draw phases)
  - Add particle cleanup when life reaches zero
  - Limit maximum particles to 500 for performance
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Write property test for trail particle generation
  - **Property 8: Movement generates trail particles**
  - **Validates: Requirements 3.1**

- [x] 2.2 Write property test for particle cleanup
  - **Property 10: Particles cleanup after lifetime**
  - **Validates: Requirements 3.3, 4.4, 5.4, 6.4**

- [x] 2.3 Write property test for opacity decrease
  - **Property 9: Particle opacity decreases over time**
  - **Validates: Requirements 3.2**

- [x] 3. Implement explosion effects on collisions
  - Create explosion particle generation function
  - Trigger explosions on ghost collision events
  - Generate 12-16 particles radiating outward from collision point
  - Use danger colors (#e94560, #FF6B6B, #FF9900) for explosion particles
  - Apply radial velocity to particles (random angles, speed 2-4 pixels/frame)
  - Set explosion particle lifetime to 20-30 frames
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.1 Write property test for collision explosions
  - **Property 13: Collision triggers explosion**
  - **Validates: Requirements 4.1**

- [x] 3.2 Write property test for explosion particle count
  - **Property 14: Explosion creates multiple particles**
  - **Validates: Requirements 4.2**

- [x] 4. Add sparkle effects when navigating near walls
  - Implement wall proximity detection (check adjacent tiles)
  - Create sparkle particle generation function
  - Generate 3-5 sparkle particles when player is adjacent to walls
  - Use bright colors (#FFD700, #FFFF00, #FFFFFF) for sparkles
  - Implement size variation (oscillate between 2-6 pixels) for shimmer effect
  - Set sparkle particle lifetime to 15-25 frames
  - Apply slight upward drift velocity to sparkles
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.1 Write property test for wall proximity sparkles
  - **Property 17: Wall proximity triggers sparkles**
  - **Validates: Requirements 5.1**

- [x] 4.2 Write property test for sparkle brightness
  - **Property 19: Sparkle particles use bright colors**
  - **Validates: Requirements 5.3**

- [x] 5. Create confetti celebration effect for new high scores
  - Implement confetti trigger on high score achievement
  - Create confetti particle generation function
  - Generate 5 new confetti particles per frame for 60 frames (1 second)
  - Use multiple bright colors (#790ECB, #FF6B6B, #FFD700, #00D9FF, #7FFF00)
  - Apply gravity (vy += 0.3 per frame) and random horizontal drift (vx = -2 to 2)
  - Set confetti initial position at top of screen with random x
  - Remove confetti particles when they fall below screen boundary
  - Add confetti particle rotation for visual variety
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.1 Write property test for high score confetti trigger
  - **Property 21: New high score triggers confetti**
  - **Validates: Requirements 6.1**

- [x] 5.2 Write property test for confetti physics
  - **Property 23: Confetti has gravity and drift**
  - **Validates: Requirements 6.3**

- [x] 5.3 Write property test for confetti duration
  - **Property 24: Confetti continues for duration**
  - **Validates: Requirements 6.5**
