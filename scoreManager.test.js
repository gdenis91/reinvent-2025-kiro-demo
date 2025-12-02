import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { createScoreManager } from './scoreManager.js';

// Configure fast-check to run 100 iterations
fc.configureGlobal({ numRuns: 100 });

describe('ScoreManager', () => {
    let scoreManager;
    
    beforeEach(() => {
        scoreManager = createScoreManager();
        localStorage.clear();
        // Mock DOM elements
        document.body.innerHTML = `
            <span id="score">0</span>
            <span id="highScore">0</span>
        `;
    });
    
    describe('Property-Based Tests', () => {
        // Feature: score-and-effects, Property 1: Item collection increases score
        // **Validates: Requirements 1.2**
        it('Property 1: adding positive points increases score', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 10000 }), // initial score
                    fc.integer({ min: 1, max: 1000 }),  // points to add (positive)
                    (initialScore, pointsToAdd) => {
                        scoreManager.currentScore = initialScore;
                        const scoreBefore = scoreManager.currentScore;
                        
                        scoreManager.addPoints(pointsToAdd);
                        
                        const scoreAfter = scoreManager.currentScore;
                        expect(scoreAfter).toBeGreaterThan(scoreBefore);
                        expect(scoreAfter).toBe(scoreBefore + pointsToAdd);
                    }
                )
            );
        });
        
        // Feature: score-and-effects, Property 6: High score persistence round-trip
        // **Validates: Requirements 2.3**
        it('Property 6: saving and loading high score returns same value', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000000 }), // high score value
                    (highScoreValue) => {
                        scoreManager.highScore = highScoreValue;
                        scoreManager.saveHighScore();
                        
                        const newManager = createScoreManager();
                        const loadedScore = newManager.loadHighScore();
                        
                        expect(loadedScore).toBe(highScoreValue);
                    }
                )
            );
        });
    });
    
    describe('Unit Tests', () => {
        // **Validates: Requirements 2.5**
        it('initializes high score to zero when localStorage is empty', () => {
            localStorage.clear();
            
            const manager = createScoreManager();
            const highScore = manager.loadHighScore();
            
            expect(highScore).toBe(0);
            expect(manager.highScore).toBe(0);
        });
        
        it('handles corrupted localStorage data gracefully', () => {
            localStorage.setItem('kiroHighScore', 'invalid json');
            
            const manager = createScoreManager();
            const highScore = manager.loadHighScore();
            
            expect(highScore).toBe(0);
        });
        
        it('clamps negative scores to zero', () => {
            scoreManager.currentScore = 50;
            scoreManager.addPoints(-100);
            
            expect(scoreManager.currentScore).toBe(0);
        });
    });
});
