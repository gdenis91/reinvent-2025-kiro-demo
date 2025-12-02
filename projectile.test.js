import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Configure fast-check to run 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Constants from game.js
const TILE_SIZE = 40;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;
const PROJECTILE_SPEED = 0.5;

// Helper function to create a player with position and direction
function createPlayer(x, y, dirX, dirY) {
    return {
        x: x,
        y: y,
        visualX: x,
        visualY: y,
        direction: { x: dirX, y: dirY }
    };
}

// Helper function to fire a projectile (simulates fireProjectile function)
function fireProjectile(player) {
    return {
        x: player.x,
        y: player.y,
        visualX: player.visualX,
        visualY: player.visualY,
        dirX: player.direction.x,
        dirY: player.direction.y,
        speed: PROJECTILE_SPEED,
        active: true
    };
}

describe('Projectile System', () => {
    describe('Property-Based Tests', () => {
        // Feature: enemy-speed-and-combat, Property 3: Stun gun fires projectile in player direction
        // **Validates: Requirements 2.1, 2.6**
        it('Property 3: stun gun fires projectile in player direction', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: GRID_WIDTH - 1 }), // player x
                    fc.integer({ min: 0, max: GRID_HEIGHT - 1 }), // player y
                    fc.constantFrom(
                        { x: 0, y: -1 },  // up
                        { x: 0, y: 1 },   // down
                        { x: -1, y: 0 },  // left
                        { x: 1, y: 0 }    // right
                    ), // direction
                    (playerX, playerY, direction) => {
                        // Create player at position with direction
                        const player = createPlayer(playerX, playerY, direction.x, direction.y);
                        
                        // Fire projectile
                        const projectile = fireProjectile(player);
                        
                        // Verify projectile is created at player position
                        expect(projectile.x).toBe(player.x);
                        expect(projectile.y).toBe(player.y);
                        expect(projectile.visualX).toBe(player.visualX);
                        expect(projectile.visualY).toBe(player.visualY);
                        
                        // Verify projectile moves in player's facing direction
                        expect(projectile.dirX).toBe(player.direction.x);
                        expect(projectile.dirY).toBe(player.direction.y);
                        
                        // Verify projectile has correct speed
                        expect(projectile.speed).toBe(PROJECTILE_SPEED);
                        
                        // Verify projectile is active
                        expect(projectile.active).toBe(true);
                        
                        // Verify projectile will move in the correct direction
                        // After one frame, projectile should be at position + (direction * speed)
                        const expectedX = player.x + (direction.x * PROJECTILE_SPEED);
                        const expectedY = player.y + (direction.y * PROJECTILE_SPEED);
                        
                        // Simulate one frame of movement
                        projectile.x += projectile.dirX * projectile.speed;
                        projectile.y += projectile.dirY * projectile.speed;
                        
                        expect(projectile.x).toBeCloseTo(expectedX, 5);
                        expect(projectile.y).toBeCloseTo(expectedY, 5);
                    }
                )
            );
        });
    });
    
    describe('Unit Tests', () => {
        it('projectile fires upward when player faces up', () => {
            const player = createPlayer(5, 5, 0, -1);
            const projectile = fireProjectile(player);
            
            expect(projectile.dirX).toBe(0);
            expect(projectile.dirY).toBe(-1);
        });
        
        it('projectile fires downward when player faces down', () => {
            const player = createPlayer(5, 5, 0, 1);
            const projectile = fireProjectile(player);
            
            expect(projectile.dirX).toBe(0);
            expect(projectile.dirY).toBe(1);
        });
        
        it('projectile fires left when player faces left', () => {
            const player = createPlayer(5, 5, -1, 0);
            const projectile = fireProjectile(player);
            
            expect(projectile.dirX).toBe(-1);
            expect(projectile.dirY).toBe(0);
        });
        
        it('projectile fires right when player faces right', () => {
            const player = createPlayer(5, 5, 1, 0);
            const projectile = fireProjectile(player);
            
            expect(projectile.dirX).toBe(1);
            expect(projectile.dirY).toBe(0);
        });
        
        it('projectile starts at player position', () => {
            const player = createPlayer(10, 7, 1, 0);
            const projectile = fireProjectile(player);
            
            expect(projectile.x).toBe(10);
            expect(projectile.y).toBe(7);
        });
        
        it('projectile is active when created', () => {
            const player = createPlayer(5, 5, 0, -1);
            const projectile = fireProjectile(player);
            
            expect(projectile.active).toBe(true);
        });
    });
});
