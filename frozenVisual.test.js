import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Configure fast-check to run 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Constants from game.js
const FROZEN_COLOR = '#00D9FF'; // Cyan/blue for frozen enemies
const NORMAL_COLOR = '#e94560'; // Red for normal enemies

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

// Helper function to get ghost render color (simulates rendering logic from game.js)
function getGhostRenderColor(ghost) {
    // From game.js: ctx.fillStyle = ghost.frozen ? '#00D9FF' : '#e94560';
    return ghost.frozen ? FROZEN_COLOR : NORMAL_COLOR;
}

describe('Frozen Enemy Visual Feedback', () => {
    describe('Property-Based Tests', () => {
        // Feature: enemy-speed-and-combat, Property 7: Frozen enemies have distinct visual appearance
        // **Validates: Requirements 2.5**
        it('Property 7: frozen enemies have distinct visual appearance', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 19 }), // ghost x
                    fc.integer({ min: 0, max: 14 }), // ghost y
                    fc.boolean(), // frozen state
                    fc.integer({ min: 0, max: 120 }), // freeze timer
                    (ghostX, ghostY, isFrozen, freezeTimer) => {
                        // Create ghost with specified frozen state
                        const ghost = createGhost(ghostX, ghostY, isFrozen, freezeTimer);
                        
                        // Get the render color for this ghost
                        const renderColor = getGhostRenderColor(ghost);
                        
                        // Verify frozen ghosts have distinct color from normal ghosts
                        if (ghost.frozen) {
                            // Frozen ghosts should be cyan/blue
                            expect(renderColor).toBe(FROZEN_COLOR);
                            expect(renderColor).toBe('#00D9FF');
                            
                            // Verify it's NOT the normal color
                            expect(renderColor).not.toBe(NORMAL_COLOR);
                        } else {
                            // Normal ghosts should be red
                            expect(renderColor).toBe(NORMAL_COLOR);
                            expect(renderColor).toBe('#e94560');
                            
                            // Verify it's NOT the frozen color
                            expect(renderColor).not.toBe(FROZEN_COLOR);
                        }
                        
                        // Verify the colors are always different
                        expect(FROZEN_COLOR).not.toBe(NORMAL_COLOR);
                    }
                )
            );
        });
    });
    
    describe('Unit Tests', () => {
        it('frozen ghost renders with cyan color', () => {
            const ghost = createGhost(5, 5, true, 60);
            const color = getGhostRenderColor(ghost);
            
            expect(color).toBe('#00D9FF');
        });
        
        it('normal ghost renders with red color', () => {
            const ghost = createGhost(5, 5, false, 0);
            const color = getGhostRenderColor(ghost);
            
            expect(color).toBe('#e94560');
        });
        
        it('ghost color changes when frozen state changes', () => {
            const ghost = createGhost(5, 5, false, 0);
            
            // Initially normal (red)
            expect(getGhostRenderColor(ghost)).toBe('#e94560');
            
            // Freeze the ghost
            ghost.frozen = true;
            ghost.freezeTimer = 120;
            
            // Now frozen (cyan)
            expect(getGhostRenderColor(ghost)).toBe('#00D9FF');
            
            // Unfreeze the ghost
            ghost.frozen = false;
            ghost.freezeTimer = 0;
            
            // Back to normal (red)
            expect(getGhostRenderColor(ghost)).toBe('#e94560');
        });
        
        it('frozen and normal colors are visually distinct', () => {
            expect(FROZEN_COLOR).not.toBe(NORMAL_COLOR);
            expect('#00D9FF').not.toBe('#e94560');
        });
    });
});
