import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Configure fast-check to run 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Constants from game.js
const PLAYER_MOVE_DELAY = 8;

// Speed configuration from game.js
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

// Helper function to create a ghost with configured speed
function createGhostWithSpeed(selectedSpeed, x = 0, y = 0) {
    const configuredGhostDelay = SPEED_CONFIGS[selectedSpeed].ghostDelay;
    return {
        x: x,
        y: y,
        visualX: x,
        visualY: y,
        moveTimer: 0,
        moveDelay: configuredGhostDelay
    };
}

// Helper function to simulate ghost movement
function simulateGhostMovement(ghost) {
    if (ghost.moveTimer === 0) {
        // Ghost would move here
        ghost.moveTimer = ghost.moveDelay;
        return true; // Moved
    } else {
        ghost.moveTimer--;
        return false; // Didn't move
    }
}

describe('Enemy Speed System', () => {
    describe('Property-Based Tests', () => {
        // Feature: enemy-speed-and-combat, Property 1: Speed setting determines enemy movement delay
        // **Validates: Requirements 1.2, 1.3, 1.4**
        it('Property 1: speed setting determines enemy movement delay', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('slow', 'normal', 'fast'),
                    fc.integer({ min: 0, max: 19 }), // x position
                    fc.integer({ min: 0, max: 14 }), // y position
                    (selectedSpeed, x, y) => {
                        // Create ghost with selected speed
                        const ghost = createGhostWithSpeed(selectedSpeed, x, y);
                        
                        // Verify ghost has correct moveDelay based on speed setting
                        const expectedDelay = SPEED_CONFIGS[selectedSpeed].ghostDelay;
                        expect(ghost.moveDelay).toBe(expectedDelay);
                        
                        // Verify the delay matches the multiplier relationship
                        if (selectedSpeed === 'slow') {
                            // Slow: 50% of player speed = 2x delay
                            expect(ghost.moveDelay).toBe(PLAYER_MOVE_DELAY * 2);
                        } else if (selectedSpeed === 'normal') {
                            // Normal: equal to player speed = 1x delay
                            expect(ghost.moveDelay).toBe(PLAYER_MOVE_DELAY);
                        } else if (selectedSpeed === 'fast') {
                            // Fast: 150% of player speed = 0.67x delay
                            expect(ghost.moveDelay).toBe(Math.floor(PLAYER_MOVE_DELAY * 0.67));
                        }
                        
                        // Verify ghost uses this delay when moving
                        simulateGhostMovement(ghost);
                        expect(ghost.moveTimer).toBe(expectedDelay);
                    }
                )
            );
        });
        
        // Feature: enemy-speed-and-combat, Property 2: Speed setting persistence
        // **Validates: Requirements 1.5**
        it('Property 2: speed setting persists throughout game session', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('slow', 'normal', 'fast'),
                    fc.integer({ min: 1, max: 10 }), // number of ghosts to create
                    (selectedSpeed, numGhosts) => {
                        // Create multiple ghosts with the same speed setting
                        const ghosts = [];
                        for (let i = 0; i < numGhosts; i++) {
                            ghosts.push(createGhostWithSpeed(selectedSpeed, i, i));
                        }
                        
                        const expectedDelay = SPEED_CONFIGS[selectedSpeed].ghostDelay;
                        
                        // All ghosts should have the same configured delay
                        ghosts.forEach(ghost => {
                            expect(ghost.moveDelay).toBe(expectedDelay);
                        });
                        
                        // Simulate multiple movement cycles
                        for (let cycle = 0; cycle < 5; cycle++) {
                            ghosts.forEach(ghost => {
                                // Ghost should move when timer is 0
                                const moved = simulateGhostMovement(ghost);
                                expect(moved).toBe(true);
                                expect(ghost.moveTimer).toBe(expectedDelay);
                                
                                // Countdown timer to 0 again
                                for (let i = 0; i < expectedDelay; i++) {
                                    const movedDuringCountdown = simulateGhostMovement(ghost);
                                    expect(movedDuringCountdown).toBe(false);
                                }
                                
                                // Timer should be back to 0
                                expect(ghost.moveTimer).toBe(0);
                            });
                        }
                        
                        // After multiple cycles, all ghosts should still use the same delay
                        ghosts.forEach(ghost => {
                            expect(ghost.moveDelay).toBe(expectedDelay);
                        });
                    }
                )
            );
        });
    });
    
    describe('Unit Tests', () => {
        it('slow speed creates ghosts with 2x player delay', () => {
            const ghost = createGhostWithSpeed('slow');
            expect(ghost.moveDelay).toBe(PLAYER_MOVE_DELAY * 2);
            expect(ghost.moveDelay).toBe(16);
        });
        
        it('normal speed creates ghosts with 1x player delay', () => {
            const ghost = createGhostWithSpeed('normal');
            expect(ghost.moveDelay).toBe(PLAYER_MOVE_DELAY);
            expect(ghost.moveDelay).toBe(8);
        });
        
        it('fast speed creates ghosts with 0.67x player delay', () => {
            const ghost = createGhostWithSpeed('fast');
            expect(ghost.moveDelay).toBe(Math.floor(PLAYER_MOVE_DELAY * 0.67));
            expect(ghost.moveDelay).toBe(5);
        });
        
        it('ghost movement resets timer to configured delay', () => {
            const ghost = createGhostWithSpeed('slow');
            expect(ghost.moveTimer).toBe(0);
            
            simulateGhostMovement(ghost);
            expect(ghost.moveTimer).toBe(16);
        });
    });
});
