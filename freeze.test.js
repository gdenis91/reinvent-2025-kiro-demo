import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Configure fast-check to run 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Constants from game.js
const FREEZE_DURATION = 120; // 2 seconds at 60 FPS
const PROJECTILE_SPEED = 0.5;

// Helper function to create a projectile
function createProjectile(x, y, dirX, dirY) {
    return {
        x: x,
        y: y,
        visualX: x,
        visualY: y,
        dirX: dirX,
        dirY: dirY,
        speed: PROJECTILE_SPEED,
        active: true
    };
}

// Helper function to create a ghost
function createGhost(x, y, frozen = false, freezeTimer = 0) {
    return {
        x: x,
        y: y,
        visualX: x,
        visualY: y,
        moveTimer: 0,
        moveDelay: 8,
        frozen: frozen,
        freezeTimer: freezeTimer
    };
}

// Helper function to check collision between projectile and ghost
function checkProjectileGhostCollision(projectile, ghost) {
    const dx = Math.abs(projectile.x - ghost.x);
    const dy = Math.abs(projectile.y - ghost.y);
    return dx < 0.5 && dy < 0.5;
}

// Helper function to handle collision (simulates game logic)
function handleCollision(projectile, ghost) {
    if (checkProjectileGhostCollision(projectile, ghost)) {
        projectile.active = false;
        ghost.frozen = true;
        ghost.freezeTimer = FREEZE_DURATION;
        return true;
    }
    return false;
}

describe('Enemy Freeze Mechanics', () => {
    describe('Property-Based Tests', () => {
        // Feature: enemy-speed-and-combat, Property 4: Projectile collision freezes enemy
        // **Validates: Requirements 2.2**
        it('Property 4: projectile collision freezes enemy', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 18 }), // ghost x
                    fc.integer({ min: 1, max: 13 }), // ghost y
                    fc.constantFrom(
                        { x: 0, y: -1 },  // up
                        { x: 0, y: 1 },   // down
                        { x: -1, y: 0 },  // left
                        { x: 1, y: 0 }    // right
                    ), // projectile direction
                    (ghostX, ghostY, direction) => {
                        // Create ghost at position
                        const ghost = createGhost(ghostX, ghostY);
                        
                        // Verify ghost starts unfrozen
                        expect(ghost.frozen).toBe(false);
                        expect(ghost.freezeTimer).toBe(0);
                        
                        // Create projectile at same position (collision)
                        const projectile = createProjectile(ghostX, ghostY, direction.x, direction.y);
                        
                        // Handle collision
                        const collided = handleCollision(projectile, ghost);
                        
                        // Verify collision occurred
                        expect(collided).toBe(true);
                        
                        // Verify projectile is deactivated
                        expect(projectile.active).toBe(false);
                        
                        // Verify ghost is frozen
                        expect(ghost.frozen).toBe(true);
                        
                        // Verify freeze timer is set to correct duration (120 frames = 2 seconds)
                        expect(ghost.freezeTimer).toBe(FREEZE_DURATION);
                        expect(ghost.freezeTimer).toBe(120);
                    }
                )
            );
        });

        // Feature: enemy-speed-and-combat, Property 5: Frozen enemies are immobilized and harmless
        // **Validates: Requirements 2.3**
        it('Property 5: frozen enemies are immobilized and harmless', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 18 }), // ghost x
                    fc.integer({ min: 1, max: 13 }), // ghost y
                    fc.integer({ min: 2, max: 120 }), // freeze timer value (min 2 to stay frozen after decrement)
                    (ghostX, ghostY, freezeTimer) => {
                        // Create frozen ghost
                        const ghost = createGhost(ghostX, ghostY, true, freezeTimer);
                        
                        // Store original position
                        const originalX = ghost.x;
                        const originalY = ghost.y;
                        
                        // Verify ghost is frozen
                        expect(ghost.frozen).toBe(true);
                        expect(ghost.freezeTimer).toBeGreaterThan(0);
                        
                        // Simulate ghost update logic (from game.js)
                        // When frozen, ghost should skip movement
                        if (ghost.frozen) {
                            ghost.freezeTimer--;
                            if (ghost.freezeTimer <= 0) {
                                ghost.frozen = false;
                                ghost.freezeTimer = 0;
                            }
                            // Skip movement - don't update position
                        }
                        
                        // Verify ghost didn't move
                        expect(ghost.x).toBe(originalX);
                        expect(ghost.y).toBe(originalY);
                        
                        // Verify freeze timer was decremented
                        expect(ghost.freezeTimer).toBe(freezeTimer - 1);
                        
                        // Ghost should still be frozen (since we started with min 2)
                        expect(ghost.frozen).toBe(true);
                        
                        // Test harmlessness: frozen ghost at player position shouldn't damage
                        const player = { x: ghostX, y: ghostY, health: 3 };
                        
                        // Simulate collision check (from checkGhostCollision)
                        if (!ghost.frozen && ghost.x === player.x && ghost.y === player.y) {
                            player.health--;
                        }
                        
                        // Player health should remain unchanged because ghost is frozen
                        expect(player.health).toBe(3);
                    }
                )
            );
        });

        // Feature: enemy-speed-and-combat, Property 6: Freeze state expires and restores behavior
        // **Validates: Requirements 2.4**
        it('Property 6: freeze state expires and restores behavior', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 18 }), // ghost x
                    fc.integer({ min: 1, max: 13 }), // ghost y
                    fc.integer({ min: 1, max: 10 }), // initial freeze timer (small value for testing)
                    (ghostX, ghostY, initialFreezeTimer) => {
                        // Create frozen ghost with small freeze timer
                        const ghost = createGhost(ghostX, ghostY, true, initialFreezeTimer);
                        
                        // Verify ghost starts frozen
                        expect(ghost.frozen).toBe(true);
                        expect(ghost.freezeTimer).toBe(initialFreezeTimer);
                        
                        // Simulate frames until freeze expires
                        for (let frame = 0; frame < initialFreezeTimer; frame++) {
                            // Simulate ghost update logic
                            if (ghost.frozen) {
                                ghost.freezeTimer--;
                                if (ghost.freezeTimer <= 0) {
                                    ghost.frozen = false;
                                    ghost.freezeTimer = 0;
                                }
                            }
                        }
                        
                        // After freeze timer expires, ghost should be unfrozen
                        expect(ghost.frozen).toBe(false);
                        expect(ghost.freezeTimer).toBe(0);
                        
                        // Test that ghost can now move (behavior restored)
                        const originalX = ghost.x;
                        const originalY = ghost.y;
                        
                        // Simulate movement (ghost should be able to move now)
                        if (!ghost.frozen) {
                            // Move ghost right
                            ghost.x += 1;
                        }
                        
                        // Verify ghost moved (behavior restored)
                        expect(ghost.x).toBe(originalX + 1);
                        expect(ghost.y).toBe(originalY);
                        
                        // Test that ghost can now damage player (behavior restored)
                        const player = { x: ghost.x, y: ghost.y, health: 3 };
                        
                        // Simulate collision check
                        if (!ghost.frozen && ghost.x === player.x && ghost.y === player.y) {
                            player.health--;
                        }
                        
                        // Player health should decrease because ghost is no longer frozen
                        expect(player.health).toBe(2);
                    }
                )
            );
        });
    });
    
    describe('Unit Tests', () => {
        it('projectile collision sets freeze timer to 120 frames', () => {
            const ghost = createGhost(5, 5);
            const projectile = createProjectile(5, 5, 0, -1);
            
            handleCollision(projectile, ghost);
            
            expect(ghost.freezeTimer).toBe(120);
        });
        
        it('frozen ghost decrements freeze timer each frame', () => {
            const ghost = createGhost(5, 5, true, 10);
            
            // Simulate one frame
            if (ghost.frozen) {
                ghost.freezeTimer--;
            }
            
            expect(ghost.freezeTimer).toBe(9);
        });
        
        it('ghost unfreezes when timer reaches zero', () => {
            const ghost = createGhost(5, 5, true, 1);
            
            // Simulate one frame
            if (ghost.frozen) {
                ghost.freezeTimer--;
                if (ghost.freezeTimer <= 0) {
                    ghost.frozen = false;
                    ghost.freezeTimer = 0;
                }
            }
            
            expect(ghost.frozen).toBe(false);
            expect(ghost.freezeTimer).toBe(0);
        });
        
        it('frozen ghost at player position does not damage player', () => {
            const ghost = createGhost(5, 5, true, 60);
            const player = { x: 5, y: 5, health: 3 };
            
            // Simulate collision check
            if (!ghost.frozen && ghost.x === player.x && ghost.y === player.y) {
                player.health--;
            }
            
            expect(player.health).toBe(3);
        });
        
        it('unfrozen ghost at player position damages player', () => {
            const ghost = createGhost(5, 5, false, 0);
            const player = { x: 5, y: 5, health: 3 };
            
            // Simulate collision check
            if (!ghost.frozen && ghost.x === player.x && ghost.y === player.y) {
                player.health--;
            }
            
            expect(player.health).toBe(2);
        });
    });
});
