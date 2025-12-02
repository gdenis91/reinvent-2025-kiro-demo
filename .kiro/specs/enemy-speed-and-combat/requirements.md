# Requirements Document

## Introduction

This feature adds two key gameplay enhancements to the Legend of Kiro dungeon crawler: configurable enemy speed selection and player combat capabilities. Players will be able to choose their preferred difficulty level through enemy speed settings (slow, normal, fast) at game start, and will gain the ability to defend themselves using a stun gun that temporarily freezes enemies.

## Glossary

- **Player**: The player-controlled character navigating the dungeon
- **Enemy**: Ghost entities that patrol the dungeon and can damage the player
- **Stun Gun**: A weapon that temporarily freezes enemies when fired
- **Game System**: The Legend of Kiro browser-based game application
- **Speed Setting**: A configuration option that determines enemy movement speed
- **Frozen State**: A temporary state where an enemy cannot move or cause damage

## Requirements

### Requirement 1

**User Story:** As a player, I want to select the enemy speed difficulty when starting the game, so that I can adjust the challenge level to match my skill level.

#### Acceptance Criteria

1. WHEN the game starts, THE Game System SHALL display a speed selection interface with three options: slow, normal, and fast
2. WHEN a player selects "slow", THE Game System SHALL set enemy movement speed to 50% of player movement speed
3. WHEN a player selects "normal", THE Game System SHALL set enemy movement speed equal to player movement speed
4. WHEN a player selects "fast", THE Game System SHALL set enemy movement speed to 150% of player movement speed
5. WHEN a speed setting is selected, THE Game System SHALL persist this setting throughout the current game session

### Requirement 2

**User Story:** As a player, I want to fire a stun gun at enemies, so that I can temporarily freeze them and create safe paths through the dungeon.

#### Acceptance Criteria

1. WHEN a player presses the spacebar key, THE Game System SHALL fire the stun gun in the direction the player is facing
2. WHEN the stun gun projectile collides with an enemy, THE Game System SHALL freeze that enemy for 2 seconds
3. WHILE an enemy is frozen, THE Game System SHALL prevent that enemy from moving or causing damage to the player
4. WHEN the freeze duration expires, THE Game System SHALL restore the enemy to normal behavior
5. WHEN a frozen enemy is displayed, THE Game System SHALL provide visual feedback indicating the frozen state
6. WHEN the stun gun is fired, THE Game System SHALL display a projectile moving from the player position in the firing direction
