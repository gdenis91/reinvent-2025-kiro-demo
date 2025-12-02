// Score Manager Module
export const createScoreManager = () => ({
    currentScore: 0,
    highScore: 0,
    startTime: 0,
    
    init() {
        this.loadHighScore();
        this.updateUI();
    },
    
    reset() {
        this.currentScore = 0;
        this.startTime = Date.now();
        this.updateUI();
    },
    
    addPoints(points) {
        this.currentScore += points;
        if (this.currentScore < 0) {
            this.currentScore = 0;
        }
        this.checkHighScore();
        this.updateUI();
    },
    
    calculateTimeBonus() {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const bonus = Math.max(0, 1000 - elapsedSeconds * 10);
        return bonus;
    },
    
    applyTimeBonus() {
        const bonus = this.calculateTimeBonus();
        this.addPoints(bonus);
        return bonus;
    },
    
    checkHighScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
        }
    },
    
    saveHighScore() {
        try {
            const data = {
                score: this.highScore,
                date: new Date().toISOString()
            };
            localStorage.setItem('kiroHighScore', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save high score:', e);
        }
    },
    
    loadHighScore() {
        try {
            const data = localStorage.getItem('kiroHighScore');
            if (data) {
                const parsed = JSON.parse(data);
                this.highScore = parsed.score || 0;
            } else {
                this.highScore = 0;
            }
        } catch (e) {
            console.error('Failed to load high score:', e);
            this.highScore = 0;
        }
        return this.highScore;
    },
    
    updateUI() {
        if (typeof document !== 'undefined') {
            const scoreElement = document.getElementById('score');
            const highScoreElement = document.getElementById('highScore');
            if (scoreElement) {
                scoreElement.textContent = this.currentScore;
            }
            if (highScoreElement) {
                highScoreElement.textContent = this.highScore;
            }
        }
    }
});
