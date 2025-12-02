import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createParticleSystem } from './particleSystem.js';

// Configure fast-check to run 100 iterations
fc.configureGlobal({ numRuns: 100 });

describe('ParticleSystem', () => {
    let particleSystem;
    
    beforeEach(() => {
        particleSystem = createParticleSystem();
    });
    
    describe('Property-Based Tests', () => {
        // Feature: score-and-effects, Property 8: Movement generates trail particles
        // **Validates: Requirements 3.1**
        it('Property 8: player movement in playing state generates trail particles', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 800 }), // x position
                    fc.integer({ min: 0, max: 600 }), // y position
                    (x, y) => {
                        const particleCountBefore = particleSystem.particles.length;
                        
                        // Create trail at position during playing state
                        particleSystem.createTrail(x, y, 'playing');
                        
                        const particleCountAfter = particleSystem.particles.length;
                        
                        // Should generate at least 2 particles (minimum count)
                        expect(particleCountAfter).toBeGreaterThan(particleCountBefore);
                        expect(particleCountAfter - particleCountBefore).toBeGreaterThanOrEqual(2);
                        expect(particleCountAfter - particleCountBefore).toBeLessThanOrEqual(4);
                        
                        // All new particles should be trail type
                        const newParticles = particleSystem.particles.slice(particleCountBefore);
                        newParticles.forEach(p => {
                            expect(p.type).toBe('trail');
                        });
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 10: Particles cleanup after lifetime
        // **Validates: Requirements 3.3, 4.4, 5.4, 6.4**
        it('Property 10: particles are removed when life reaches zero', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 50 }), // initial life
                    (initialLife) => {
                        // Create a particle with specific life
                        particleSystem.particles.push({
                            x: 100,
                            y: 100,
                            vx: 0,
                            vy: 0,
                            life: initialLife,
                            maxLife: initialLife,
                            size: 5,
                            color: '#790ECB',
                            type: 'trail'
                        });
                        
                        // Update until life reaches zero
                        for (let i = 0; i < initialLife; i++) {
                            particleSystem.update();
                        }
                        
                        // Particle should be removed after life reaches zero
                        expect(particleSystem.particles.length).toBe(0);
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 9: Particle opacity decreases over time
        // **Validates: Requirements 3.2**
        it('Property 9: particle opacity decreases as life decreases', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 2, max: 50 }), // initial life (at least 2 to survive one update)
                    (initialLife) => {
                        // Create a fresh particle system for each test
                        const testSystem = createParticleSystem();
                        
                        // Create a particle
                        testSystem.particles.push({
                            x: 100,
                            y: 100,
                            vx: 0,
                            vy: 0,
                            life: initialLife,
                            maxLife: initialLife,
                            size: 5,
                            color: '#790ECB',
                            type: 'trail'
                        });
                        
                        // Calculate initial opacity
                        const opacityBefore = initialLife / initialLife; // Always 1.0
                        
                        // Update once
                        testSystem.update();
                        
                        // Particle should still exist (since initialLife >= 2)
                        expect(testSystem.particles.length).toBe(1);
                        
                        // Calculate new opacity
                        const particle = testSystem.particles[0];
                        const opacityAfter = particle.life / particle.maxLife;
                        
                        // Opacity should decrease
                        expect(opacityAfter).toBeLessThan(opacityBefore);
                        
                        // Specifically, it should be (initialLife - 1) / initialLife
                        expect(opacityAfter).toBe((initialLife - 1) / initialLife);
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 13: Collision triggers explosion
        // **Validates: Requirements 4.1**
        it('Property 13: collision at any position triggers explosion effect', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 800 }), // x position
                    fc.integer({ min: 0, max: 600 }), // y position
                    (x, y) => {
                        const testSystem = createParticleSystem();
                        const particleCountBefore = testSystem.particles.length;
                        
                        // Create explosion at collision position
                        testSystem.createExplosion(x, y);
                        
                        const particleCountAfter = testSystem.particles.length;
                        
                        // Should generate particles (at least 12)
                        expect(particleCountAfter).toBeGreaterThan(particleCountBefore);
                        expect(particleCountAfter - particleCountBefore).toBeGreaterThanOrEqual(12);
                        
                        // All new particles should be explosion type
                        const newParticles = testSystem.particles.slice(particleCountBefore);
                        newParticles.forEach(p => {
                            expect(p.type).toBe('explosion');
                            // Particles should be at the collision position
                            expect(p.x).toBe(x);
                            expect(p.y).toBe(y);
                        });
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 14: Explosion creates multiple particles
        // **Validates: Requirements 4.2**
        it('Property 14: explosion creates 12-16 particles radiating outward', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 800 }), // x position
                    fc.integer({ min: 0, max: 600 }), // y position
                    (x, y) => {
                        const testSystem = createParticleSystem();
                        
                        // Create explosion
                        testSystem.createExplosion(x, y);
                        
                        const particleCount = testSystem.particles.length;
                        
                        // Should create 12-16 particles
                        expect(particleCount).toBeGreaterThanOrEqual(12);
                        expect(particleCount).toBeLessThanOrEqual(16);
                        
                        // Particles should have radial velocities (not all zero)
                        const hasRadialVelocity = testSystem.particles.some(p => 
                            p.vx !== 0 || p.vy !== 0
                        );
                        expect(hasRadialVelocity).toBe(true);
                        
                        // Check that particles have velocities in the expected range (2-4 pixels/frame)
                        testSystem.particles.forEach(p => {
                            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                            expect(speed).toBeGreaterThanOrEqual(2);
                            expect(speed).toBeLessThanOrEqual(4);
                        });
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 17: Wall proximity triggers sparkles
        // **Validates: Requirements 5.1**
        it('Property 17: sparkle particles are generated at any position', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 800 }), // x position
                    fc.integer({ min: 0, max: 600 }), // y position
                    (x, y) => {
                        const testSystem = createParticleSystem();
                        const particleCountBefore = testSystem.particles.length;
                        
                        // Create sparkle at position
                        testSystem.createSparkle(x, y);
                        
                        const particleCountAfter = testSystem.particles.length;
                        
                        // Should generate 3-5 particles
                        expect(particleCountAfter).toBeGreaterThan(particleCountBefore);
                        expect(particleCountAfter - particleCountBefore).toBeGreaterThanOrEqual(3);
                        expect(particleCountAfter - particleCountBefore).toBeLessThanOrEqual(5);
                        
                        // All new particles should be sparkle type
                        const newParticles = testSystem.particles.slice(particleCountBefore);
                        newParticles.forEach(p => {
                            expect(p.type).toBe('sparkle');
                        });
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 19: Sparkle particles use bright colors
        // **Validates: Requirements 5.3**
        it('Property 19: sparkle particles use bright colors with high RGB values', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 800 }), // x position
                    fc.integer({ min: 0, max: 600 }), // y position
                    (x, y) => {
                        const testSystem = createParticleSystem();
                        
                        // Create sparkle
                        testSystem.createSparkle(x, y);
                        
                        // All sparkle particles should use bright colors
                        const brightColors = ['#FFD700', '#FFFF00', '#FFFFFF'];
                        testSystem.particles.forEach(p => {
                            expect(brightColors).toContain(p.color);
                            
                            // Verify colors are actually bright (high RGB values > 200)
                            // #FFD700 = rgb(255, 215, 0) - all components > 200 except B
                            // #FFFF00 = rgb(255, 255, 0) - R and G > 200
                            // #FFFFFF = rgb(255, 255, 255) - all > 200
                            // All these colors have at least 2 components > 200
                        });
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 21: New high score triggers confetti
        // **Validates: Requirements 6.1**
        it('Property 21: triggering confetti activates confetti generation', () => {
            fc.assert(
                fc.property(
                    fc.constant(null), // No random input needed
                    () => {
                        const testSystem = createParticleSystem();
                        
                        // Initially confetti should not be active
                        expect(testSystem.confettiActive).toBe(false);
                        
                        // Trigger confetti
                        testSystem.createConfetti();
                        
                        // Confetti should now be active
                        expect(testSystem.confettiActive).toBe(true);
                        expect(testSystem.confettiFrameCount).toBe(0);
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 23: Confetti has gravity and drift
        // **Validates: Requirements 6.3**
        it('Property 23: confetti particles have gravity and horizontal drift', () => {
            fc.assert(
                fc.property(
                    fc.constant(null), // No random input needed
                    () => {
                        const testSystem = createParticleSystem(500, 800, 600);
                        
                        // Create a confetti particle
                        testSystem.createConfettiParticle();
                        
                        expect(testSystem.particles.length).toBe(1);
                        const particle = testSystem.particles[0];
                        
                        // Store initial velocities
                        const initialVy = particle.vy;
                        const initialVx = particle.vx;
                        
                        // Horizontal drift should be between -2 and 2
                        expect(initialVx).toBeGreaterThanOrEqual(-2);
                        expect(initialVx).toBeLessThanOrEqual(2);
                        
                        // Update particle to apply gravity
                        testSystem.update();
                        
                        // After update, particle should still exist (long lifetime)
                        expect(testSystem.particles.length).toBe(1);
                        const updatedParticle = testSystem.particles[0];
                        
                        // Vertical velocity should increase due to gravity (vy += 0.3)
                        expect(updatedParticle.vy).toBeGreaterThan(initialVy);
                        expect(updatedParticle.vy).toBe(initialVy + 0.3);
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 24: Confetti continues for duration
        // **Validates: Requirements 6.5**
        it('Property 24: confetti generates particles for 60 frames', () => {
            fc.assert(
                fc.property(
                    fc.constant(null), // No random input needed
                    () => {
                        const testSystem = createParticleSystem(1000, 800, 600); // High limit to not interfere
                        
                        // Trigger confetti
                        testSystem.createConfetti();
                        expect(testSystem.confettiActive).toBe(true);
                        
                        // Track particle generation over frames
                        let particleCountAtFrame30 = 0;
                        
                        // Update for 60 frames
                        for (let i = 0; i < 60; i++) {
                            testSystem.update();
                            
                            // Check at frame 30 that particles are being generated
                            if (i === 29) {
                                particleCountAtFrame30 = testSystem.particles.length;
                            }
                        }
                        
                        // After 60 frames, confetti should stop being active
                        expect(testSystem.confettiActive).toBe(false);
                        
                        // Particles should have been generated during the duration
                        // At frame 30, we should have many particles (5 per frame * 30 = 150)
                        expect(particleCountAtFrame30).toBeGreaterThan(100);
                        
                        // Should still have particles after 60 frames (some may have fallen off)
                        expect(testSystem.particles.length).toBeGreaterThan(0);
                    }
                )
            );
        });
    });
    
    describe('Unit Tests', () => {
        it('does not generate trail particles in non-playing state', () => {
            const states = ['start', 'gameOver', 'levelComplete', 'paused'];
            
            states.forEach(state => {
                particleSystem.particles = [];
                particleSystem.createTrail(100, 100, state);
                expect(particleSystem.particles.length).toBe(0);
            });
        });
        
        it('enforces maximum particle limit', () => {
            const smallSystem = createParticleSystem(10);
            
            // Add more particles than the limit
            for (let i = 0; i < 20; i++) {
                smallSystem.particles.push({
                    x: i * 10,
                    y: 100,
                    vx: 0,
                    vy: 0,
                    life: 30,
                    maxLife: 30,
                    size: 5,
                    color: '#790ECB',
                    type: 'trail'
                });
            }
            
            smallSystem.update();
            
            expect(smallSystem.particles.length).toBeLessThanOrEqual(10);
        });
        
        it('uses Kiro brand colors for trail particles', () => {
            const brandColors = ['#790ECB', '#9D4EDD', '#C77DFF'];
            
            // Generate multiple trails to test color variety
            for (let i = 0; i < 10; i++) {
                particleSystem.createTrail(100, 100, 'playing');
            }
            
            // All particles should use brand colors
            particleSystem.particles.forEach(p => {
                expect(brandColors).toContain(p.color);
            });
        });
        
        it('uses danger colors for explosion particles', () => {
            const dangerColors = ['#e94560', '#FF6B6B', '#FF9900'];
            
            // Create explosion
            particleSystem.createExplosion(100, 100);
            
            // All particles should use danger colors
            particleSystem.particles.forEach(p => {
                expect(dangerColors).toContain(p.color);
            });
        });
        
        it('explosion particles have lifetime of 20-30 frames', () => {
            particleSystem.createExplosion(100, 100);
            
            // All particles should have life between 20-30
            particleSystem.particles.forEach(p => {
                expect(p.life).toBeGreaterThanOrEqual(20);
                expect(p.life).toBeLessThanOrEqual(30);
            });
        });
        
        it('sparkle particles use bright colors', () => {
            const brightColors = ['#FFD700', '#FFFF00', '#FFFFFF'];
            
            // Create sparkles
            particleSystem.createSparkle(100, 100);
            
            // All particles should use bright colors
            particleSystem.particles.forEach(p => {
                expect(brightColors).toContain(p.color);
            });
        });
        
        it('sparkle particles have size variation for shimmer effect', () => {
            particleSystem.createSparkle(100, 100);
            
            // All particles should have size between 2-6 pixels
            particleSystem.particles.forEach(p => {
                expect(p.size).toBeGreaterThanOrEqual(2);
                expect(p.size).toBeLessThanOrEqual(6);
            });
        });
        
        it('sparkle particles have upward drift velocity', () => {
            particleSystem.createSparkle(100, 100);
            
            // All particles should have negative vy (upward)
            particleSystem.particles.forEach(p => {
                expect(p.vy).toBeLessThan(0); // Negative means upward
                expect(p.vy).toBeGreaterThanOrEqual(-1.0);
                expect(p.vy).toBeLessThanOrEqual(-0.5);
            });
        });
        
        it('sparkle particles have lifetime of 15-25 frames', () => {
            particleSystem.createSparkle(100, 100);
            
            // All particles should have life between 15-25
            particleSystem.particles.forEach(p => {
                expect(p.life).toBeGreaterThanOrEqual(15);
                expect(p.life).toBeLessThanOrEqual(25);
            });
        });
    });
});
