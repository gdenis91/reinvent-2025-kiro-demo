# Implementation Plan

- [x] 1. Add speed selection UI to start screen
  - Modify `drawStartScreen()` to display three speed options (slow, normal, fast)
  - Add keyboard event handlers for speed selection (keys 1, 2, 3)
  - Store selected speed in game state variable
  - Update start screen to show currently selected speed
  - _Requirements: 1.1_

- [x] 2. Implement configurable enemy speed system
  - Create `SPEED_CONFIGS` object with multipliers for slow (0.5x), normal (1.0x), and fast (1.5x)
  - Modify `startGame()` to apply selected speed configuration to `GHOST_MOVE_DELAY`
  - Ensure all ghosts use the configured delay value
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Write property test for speed configuration
  - **Property 1: Speed setting determines enemy movement delay**
  - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 2.2 Write property test for speed persistence
  - **Property 2: Speed setting persistence**
  - **Validates: Requirements 1.5**

- [x] 3. Add player direction tracking
  - Add `direction` property to player object with x and y components
  - Update player direction whenever movement keys are pressed
  - Initialize direction to face up by default
  - _Requirements: 2.1_

- [x] 4. Implement projectile system
  - Create `projectiles` array to store active projectiles
  - Define projectile entity structure (position, direction, speed, active state)
  - Add spacebar key handler to fire projectiles
  - Implement projectile creation function that spawns projectile at player position with player direction
  - _Requirements: 2.1, 2.6_

- [x] 5. Implement projectile movement and collision
  - Add projectile update logic to `update()` function
  - Move projectiles based on direction and speed (0.5 tiles per frame)
  - Detect projectile-wall collisions and mark projectiles inactive
  - Detect projectile-enemy collisions
  - Remove inactive projectiles from array
  - _Requirements: 2.1, 2.2, 2.6_

- [x] 5.1 Write property test for projectile firing
  - **Property 3: Stun gun fires projectile in player direction**
  - **Validates: Requirements 2.1, 2.6**

- [x] 6. Implement enemy freeze mechanics
  - Add `frozen` boolean and `freezeTimer` number to ghost objects
  - When projectile hits enemy, set frozen to true and freezeTimer to 120 frames
  - In ghost update logic, skip movement when frozen is true
  - Decrement freezeTimer each frame when frozen
  - Set frozen to false when freezeTimer reaches 0
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 6.1 Write property test for freeze on collision
  - **Property 4: Projectile collision freezes enemy**
  - **Validates: Requirements 2.2**

- [x] 6.2 Write property test for frozen enemy immobilization
  - **Property 5: Frozen enemies are immobilized and harmless**
  - **Validates: Requirements 2.3**

- [x] 6.3 Write property test for freeze expiration
  - **Property 6: Freeze state expires and restores behavior**
  - **Validates: Requirements 2.4**

- [x] 7. Modify ghost collision to respect frozen state
  - Update `checkGhostCollision()` to skip frozen enemies
  - Frozen enemies should not damage player or trigger respawn
  - _Requirements: 2.3_

- [x] 8. Add visual feedback for combat system
  - Render projectiles as small yellow/white circles
  - Render frozen enemies with cyan/blue tint or color change
  - Add smooth interpolation for projectile visual positions
  - Optionally add particle effects for frozen enemies
  - _Requirements: 2.5, 2.6_

- [x] 8.1 Write property test for frozen enemy visual distinction
  - **Property 7: Frozen enemies have distinct visual appearance**
  - **Validates: Requirements 2.5**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
