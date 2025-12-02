// Game constants
const TILE_SIZE = 40;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;
const PLAYER_MOVE_DELAY = 8;
const GHOST_MOVE_DELAY = 20; // Slower than player (was 12)
const MOVE_SPEED = 0.25; // Interpolation speed (0-1, higher = faster)

// Tile types
const TILES = {
    EMPTY: 0,
    WALL: 1,
    ITEM: 2,
    PLAYER_START: 3,
    GHOST_START: 4
};

// Speed configuration
const SPEED_CONFIGS = {
    slow: {
        label: 'Slow',
        multiplier: 0.5,
        ghostDelay: PLAYER_MOVE_DELAY * 2  // 50% of player speed
    },
    normal: {
        label: 'Normal',
        multiplier: 0.7,
        ghostDelay: Math.floor(PLAYER_MOVE_DELAY / 0.7)  // 70% of player speed
    },
    fast: {
        label: 'Fast',
        multiplier: 1.0,
        ghostDelay: PLAYER_MOVE_DELAY  // 100% of player speed (matches player)
    }
};

// Game state
let gameState = 'start';
let selectedSpeed = 'normal';
let canvas, ctx;
let player, ghosts, items;
let keys = {};
let frameCount = 0;
let kiroImage;
let awsLogoImage;

// Projectile system
let projectiles = [];
const PROJECTILE_SPEED = 0.5; // Moves 0.5 tiles per frame
const FREEZE_DURATION = 120; // 2 seconds at 60 FPS

// Particle System
const ParticleSystem = {
    particles: [],
    maxParticles: 500,
    
    // Kiro brand colors for trail particles
    trailColors: ['#790ECB', '#9D4EDD', '#C77DFF'],
    
    // Danger colors for explosion particles
    explosionColors: ['#e94560', '#FF6B6B', '#FF9900'],
    
    // Bright colors for sparkle particles
    sparkleColors: ['#FFD700', '#FFFF00', '#FFFFFF'],
    
    // Confetti colors - multiple bright colors
    confettiColors: ['#790ECB', '#FF6B6B', '#FFD700', '#00D9FF', '#7FFF00'],
    
    // Confetti state
    confettiActive: false,
    confettiFrameCount: 0,
    confettiDuration: 60, // 60 frames = 1 second at 60 FPS
    
    update() {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Apply gravity to confetti particles
            if (p.type === 'confetti') {
                p.vy += 0.3; // Gravity acceleration
            }
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Update rotation for confetti
            if (p.type === 'confetti' && p.rotation !== undefined) {
                p.rotation += p.rotationSpeed || 0.1;
            }
            
            // Decrease life
            p.life--;
            
            // Remove dead particles or confetti that fell below screen
            if (p.life <= 0 || (p.type === 'confetti' && p.y > canvas.height)) {
                this.particles.splice(i, 1);
            }
        }
        
        // Generate confetti particles if active
        if (this.confettiActive) {
            this.confettiFrameCount++;
            
            // Generate 5 new confetti particles per frame
            for (let i = 0; i < 5; i++) {
                this.createConfettiParticle();
            }
            
            // Stop after duration
            if (this.confettiFrameCount >= this.confettiDuration) {
                this.confettiActive = false;
                this.confettiFrameCount = 0;
            }
        }
        
        // Enforce max particle limit
        while (this.particles.length > this.maxParticles) {
            this.particles.shift(); // Remove oldest particles first
        }
    },
    
    draw(ctx) {
        this.particles.forEach(p => {
            // Calculate opacity based on remaining life
            const opacity = p.life / p.maxLife;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = p.color;
            
            // Draw confetti as rotated rectangles
            if (p.type === 'confetti' && p.rotation !== undefined) {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
            } else {
                // Draw other particles as circles
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    },
    
    createTrail(x, y) {
        // Only create trails during playing state
        if (gameState !== 'playing') return;
        
        // Create 2-3 trail particles
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const color = this.trailColors[Math.floor(Math.random() * this.trailColors.length)];
            this.particles.push({
                x: x + (Math.random() - 0.5) * TILE_SIZE * 0.5,
                y: y + (Math.random() - 0.5) * TILE_SIZE * 0.5,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 20 + Math.floor(Math.random() * 10), // 20-30 frames
                maxLife: 30,
                size: 3 + Math.random() * 2,
                color: color,
                type: 'trail'
            });
        }
    },
    
    createExplosion(x, y) {
        // Generate 12-16 particles radiating outward
        const count = 12 + Math.floor(Math.random() * 5); // 12-16 particles
        
        for (let i = 0; i < count; i++) {
            // Random angle for radial distribution
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            
            // Random speed between 2-4 pixels/frame
            const speed = 2 + Math.random() * 2;
            
            // Calculate velocity components
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Random danger color
            const color = this.explosionColors[Math.floor(Math.random() * this.explosionColors.length)];
            
            this.particles.push({
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                life: 20 + Math.floor(Math.random() * 11), // 20-30 frames
                maxLife: 30,
                size: 3 + Math.random() * 2,
                color: color,
                type: 'explosion'
            });
        }
    },
    
    createSparkle(x, y) {
        // Generate 3-5 sparkle particles
        const count = 3 + Math.floor(Math.random() * 3); // 3-5 particles
        
        for (let i = 0; i < count; i++) {
            // Random bright color
            const color = this.sparkleColors[Math.floor(Math.random() * this.sparkleColors.length)];
            
            // Random size between 2-6 pixels for shimmer effect
            const size = 2 + Math.random() * 4;
            
            // Slight upward drift velocity
            const vx = (Math.random() - 0.5) * 0.5; // Small horizontal drift
            const vy = -0.5 - Math.random() * 0.5; // Upward drift (-0.5 to -1.0)
            
            this.particles.push({
                x: x + (Math.random() - 0.5) * 15, // Spread around position
                y: y + (Math.random() - 0.5) * 15,
                vx: vx,
                vy: vy,
                life: 15 + Math.floor(Math.random() * 11), // 15-25 frames
                maxLife: 25,
                size: size,
                color: color,
                type: 'sparkle'
            });
        }
    },
    
    createConfetti() {
        // Trigger confetti effect
        this.confettiActive = true;
        this.confettiFrameCount = 0;
    },
    
    createConfettiParticle() {
        // Random bright color
        const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
        
        // Random x position at top of screen
        const x = Math.random() * canvas.width;
        
        // Start at top of screen
        const y = 0;
        
        // Random horizontal drift (-2 to 2)
        const vx = (Math.random() - 0.5) * 4; // -2 to 2
        
        // Initial downward velocity
        const vy = Math.random() * 2; // 0 to 2
        
        // Random size
        const size = 4 + Math.random() * 4; // 4-8 pixels
        
        // Random rotation and rotation speed
        const rotation = Math.random() * Math.PI * 2;
        const rotationSpeed = (Math.random() - 0.5) * 0.2; // -0.1 to 0.1
        
        this.particles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            life: 200, // Long lifetime so gravity can take effect
            maxLife: 200,
            size: size,
            color: color,
            type: 'confetti',
            rotation: rotation,
            rotationSpeed: rotationSpeed
        });
    },
    
    cleanup() {
        // Remove all dead particles
        this.particles = this.particles.filter(p => p.life > 0);
    }
};

// Score Manager
const ScoreManager = {
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
            const wasNewHighScore = this.currentScore > this.highScore;
            this.highScore = this.currentScore;
            this.saveHighScore();
            
            // Trigger confetti effect on new high score
            if (wasNewHighScore) {
                ParticleSystem.createConfetti();
            }
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
        const scoreElement = document.getElementById('score');
        const highScoreElement = document.getElementById('highScore');
        if (scoreElement) {
            scoreElement.textContent = this.currentScore;
        }
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
    }
};

// Original map template - never modified
// Legend of Zelda style dungeon with rooms and open spaces
const originalMapTemplate = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,3,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,4,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Working map copy
let gameMap = [];

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize score manager
    ScoreManager.init();
    
    // Load Kiro image
    kiroImage = new Image();
    kiroImage.src = 'kiro-logo.png';
    
    // Load AWS cube logo image
    awsLogoImage = new Image();
    awsLogoImage.src = 'aws-cube.svg';
    
    // Setup keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Speed selection on start screen
        if (gameState === 'start') {
            // Arrow keys to navigate speed selection
            if (e.key === 'ArrowLeft') {
                if (selectedSpeed === 'normal') {
                    selectedSpeed = 'slow';
                } else if (selectedSpeed === 'fast') {
                    selectedSpeed = 'normal';
                }
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                if (selectedSpeed === 'slow') {
                    selectedSpeed = 'normal';
                } else if (selectedSpeed === 'normal') {
                    selectedSpeed = 'fast';
                }
                e.preventDefault();
            } else if (e.key === 'Enter') {
                // Enter to start game
                startGame();
                e.preventDefault();
            } else if (e.key === '1') {
                selectedSpeed = 'slow';
            } else if (e.key === '2') {
                selectedSpeed = 'normal';
            } else if (e.key === '3') {
                selectedSpeed = 'fast';
            }
        }
        
        // ESC exits gameplay and returns to start screen
        if (gameState === 'playing' && e.key === 'Escape') {
            gameState = 'start';
            e.preventDefault();
        }
        
        // Fire projectile with spacebar during gameplay
        if (gameState === 'playing' && e.key === ' ') {
            fireProjectile();
            e.preventDefault(); // Prevent page scroll
        }
        
        if (gameState === 'gameOver' || gameState === 'levelComplete') {
            if (e.key === ' ') {
                restartGame();
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    drawStartScreen();
    gameLoop();
}

function startGame() {
    gameState = 'playing';
    frameCount = 0;
    
    // Reset score
    ScoreManager.reset();
    
    // Reset projectiles
    projectiles = [];
    
    // Copy original map template to working map
    gameMap = originalMapTemplate.map(row => [...row]);
    
    // Initialize player
    player = {
        x: 1,
        y: 1,
        visualX: 1, // For smooth rendering
        visualY: 1, // For smooth rendering
        health: 3,
        inventory: 0,
        moveTimer: 0,
        direction: { x: 0, y: -1 } // Default facing up
    };
    
    // Find player start position
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameMap[y][x] === TILES.PLAYER_START) {
                player.x = x;
                player.y = y;
                player.visualX = x;
                player.visualY = y;
                gameMap[y][x] = TILES.EMPTY;
            }
        }
    }
    
    // Get the configured ghost delay based on selected speed
    const configuredGhostDelay = SPEED_CONFIGS[selectedSpeed].ghostDelay;
    
    // Initialize ghosts with configured speed
    ghosts = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameMap[y][x] === TILES.GHOST_START) {
                ghosts.push({
                    x: x,
                    y: y,
                    visualX: x, // For smooth rendering
                    visualY: y, // For smooth rendering
                    moveTimer: 0,
                    moveDelay: configuredGhostDelay, // Apply configured delay
                    frozen: false, // Freeze state
                    freezeTimer: 0 // Frames remaining frozen
                });
                gameMap[y][x] = TILES.EMPTY;
            }
        }
    }
    
    // Count items
    items = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameMap[y][x] === TILES.ITEM) {
                items++;
            }
        }
    }
}

function restartGame() {
    startGame();
}

function fireProjectile() {
    // Create a new projectile at player position with player direction
    const projectile = {
        x: player.x,
        y: player.y,
        visualX: player.visualX,
        visualY: player.visualY,
        dirX: player.direction.x,
        dirY: player.direction.y,
        speed: PROJECTILE_SPEED,
        active: true
    };
    
    projectiles.push(projectile);
}

function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Update player movement
    if (player.moveTimer === 0) {
        let newX = player.x;
        let newY = player.y;
        
        // Update player direction based on key presses
        if (keys['ArrowUp']) {
            newY--;
            player.direction = { x: 0, y: -1 };
        }
        if (keys['ArrowDown']) {
            newY++;
            player.direction = { x: 0, y: 1 };
        }
        if (keys['ArrowLeft']) {
            newX--;
            player.direction = { x: -1, y: 0 };
        }
        if (keys['ArrowRight']) {
            newX++;
            player.direction = { x: 1, y: 0 };
        }
        
        if (newX !== player.x || newY !== player.y) {
            if (canMove(newX, newY)) {
                // Generate trail particles at old visual position
                ParticleSystem.createTrail(
                    player.visualX * TILE_SIZE + TILE_SIZE / 2,
                    player.visualY * TILE_SIZE + TILE_SIZE / 2
                );
                
                player.x = newX;
                player.y = newY;
                player.moveTimer = PLAYER_MOVE_DELAY;
                
                // Check for item collection
                if (gameMap[player.y][player.x] === TILES.ITEM) {
                    gameMap[player.y][player.x] = TILES.EMPTY;
                    player.inventory++;
                    ScoreManager.addPoints(100); // +100 points per item
                    
                    if (player.inventory === items) {
                        ScoreManager.applyTimeBonus(); // Apply time bonus on level completion
                        gameState = 'levelComplete';
                    }
                }
                
                // Check ghost collision
                checkGhostCollision();
            }
        }
    } else {
        player.moveTimer--;
    }
    
    // Smoothly interpolate player visual position toward grid position
    player.visualX += (player.x - player.visualX) * MOVE_SPEED;
    player.visualY += (player.y - player.visualY) * MOVE_SPEED;
    
    // Update ghosts
    ghosts.forEach(ghost => {
        // Handle freeze timer
        if (ghost.frozen) {
            ghost.freezeTimer--;
            if (ghost.freezeTimer <= 0) {
                ghost.frozen = false;
                ghost.freezeTimer = 0;
            }
            // Skip movement when frozen
            return;
        }
        
        if (ghost.moveTimer === 0) {
            const directions = [
                {x: 0, y: -1},
                {x: 0, y: 1},
                {x: -1, y: 0},
                {x: 1, y: 0}
            ];
            
            const validMoves = directions.filter(dir => 
                canMove(ghost.x + dir.x, ghost.y + dir.y)
            );
            
            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                ghost.x += move.x;
                ghost.y += move.y;
                ghost.moveTimer = ghost.moveDelay; // Use configured delay
            }
        } else {
            ghost.moveTimer--;
        }
        
        // Smoothly interpolate ghost visual position toward grid position
        ghost.visualX += (ghost.x - ghost.visualX) * MOVE_SPEED;
        ghost.visualY += (ghost.y - ghost.visualY) * MOVE_SPEED;
    });
    
    checkGhostCollision();
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        if (!proj.active) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Move projectile based on direction and speed
        proj.x += proj.dirX * proj.speed;
        proj.y += proj.dirY * proj.speed;
        proj.visualX += proj.dirX * proj.speed;
        proj.visualY += proj.dirY * proj.speed;
        
        // Check wall collision
        const gridX = Math.floor(proj.x);
        const gridY = Math.floor(proj.y);
        
        if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT || 
            gameMap[gridY][gridX] === TILES.WALL) {
            proj.active = false;
            continue;
        }
        
        // Check enemy collision
        for (let j = 0; j < ghosts.length; j++) {
            const ghost = ghosts[j];
            const dx = Math.abs(proj.x - ghost.x);
            const dy = Math.abs(proj.y - ghost.y);
            
            // Collision if projectile is within 0.5 tiles of ghost center
            if (dx < 0.5 && dy < 0.5) {
                proj.active = false;
                // Freeze the ghost
                ghost.frozen = true;
                ghost.freezeTimer = FREEZE_DURATION;
                break;
            }
        }
    }
    
    // Remove inactive projectiles
    projectiles = projectiles.filter(proj => proj.active);
    
    // Generate sparkles when player is adjacent to walls
    if (isAdjacentToWall(player.x, player.y)) {
        ParticleSystem.createSparkle(
            player.visualX * TILE_SIZE + TILE_SIZE / 2,
            player.visualY * TILE_SIZE + TILE_SIZE / 2
        );
    }
    
    // Update particle system
    ParticleSystem.update();
    
    updateUI();
}

function canMove(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
    return gameMap[y][x] !== TILES.WALL;
}

function isAdjacentToWall(x, y) {
    // Check all 4 adjacent tiles (up, down, left, right)
    const adjacentPositions = [
        { x: x, y: y - 1 },     // up
        { x: x, y: y + 1 },     // down
        { x: x - 1, y: y },     // left
        { x: x + 1, y: y }      // right
    ];
    
    for (const pos of adjacentPositions) {
        // Check if position is within bounds
        if (pos.x >= 0 && pos.x < GRID_WIDTH && pos.y >= 0 && pos.y < GRID_HEIGHT) {
            // Check if it's a wall
            if (gameMap[pos.y][pos.x] === TILES.WALL) {
                return true;
            }
        }
    }
    
    return false;
}

function checkGhostCollision() {
    ghosts.forEach(ghost => {
        // Skip frozen enemies - they can't damage player
        if (ghost.frozen) {
            return;
        }
        
        if (ghost.x === player.x && ghost.y === player.y) {
            // Create explosion effect at collision point
            ParticleSystem.createExplosion(
                player.x * TILE_SIZE + TILE_SIZE / 2,
                player.y * TILE_SIZE + TILE_SIZE / 2
            );
            
            player.health--;
            ScoreManager.addPoints(-50); // -50 points per hit
            if (player.health <= 0) {
                gameState = 'gameOver';
            } else {
                // Respawn player at start
                player.x = 1;
                player.y = 1;
                player.visualX = 1;
                player.visualY = 1;
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'start') {
        drawStartScreen();
        return;
    }
    
    if (gameState === 'playing' || gameState === 'gameOver' || gameState === 'levelComplete') {
        drawGame();
    }
    
    if (gameState === 'gameOver') {
        drawGameOver();
    }
    
    if (gameState === 'levelComplete') {
        drawLevelComplete();
    }
}

function drawStartScreen() {
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#790ECB';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('KIRO DASH', canvas.width / 2, canvas.height / 2 - 120);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Courier New';
    ctx.fillText('Use arrow keys to move!', canvas.width / 2, canvas.height / 2 - 50);
    
    // Speed selection UI
    ctx.font = '20px Courier New';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('SELECT DIFFICULTY:', canvas.width / 2, canvas.height / 2);
    
    // Draw speed options
    const speedOptions = [
        { key: '1', speed: 'slow', x: canvas.width / 2 - 200 },
        { key: '2', speed: 'normal', x: canvas.width / 2 },
        { key: '3', speed: 'fast', x: canvas.width / 2 + 200 }
    ];
    
    speedOptions.forEach(option => {
        const isSelected = selectedSpeed === option.speed;
        
        // Highlight selected option
        if (isSelected) {
            ctx.fillStyle = '#790ECB';
            ctx.fillRect(option.x - 70, canvas.height / 2 + 20, 140, 50);
        }
        
        // Draw option text
        ctx.fillStyle = isSelected ? '#ffffff' : '#9D4EDD';
        ctx.font = isSelected ? 'bold 22px Courier New' : '20px Courier New';
        ctx.fillText(`[${option.key}] ${SPEED_CONFIGS[option.speed].label}`, option.x, canvas.height / 2 + 50);
    });
    
    // Show current selection
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Courier New';
    ctx.fillText(`Current: ${SPEED_CONFIGS[selectedSpeed].label}`, canvas.width / 2, canvas.height / 2 + 90);
    
    ctx.fillText('Use ← → arrows to select, ENTER to start', canvas.width / 2, canvas.height / 2 + 130);
    
    ctx.font = '16px Courier New';
    ctx.fillStyle = '#e94560';
    ctx.fillText('Collect all 3 AWS items!', canvas.width / 2, canvas.height / 2 + 160);
    ctx.fillText('Avoid the ghosts!', canvas.width / 2, canvas.height / 2 + 185);
}

function drawGame() {
    // Draw map
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = gameMap[y][x];
            
            if (tile === TILES.WALL) {
                ctx.fillStyle = '#16213e';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#0f3460';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile === TILES.ITEM) {
                // Draw AWS cube logo image
                if (awsLogoImage.complete) {
                    ctx.drawImage(
                        awsLogoImage,
                        x * TILE_SIZE + 6,
                        y * TILE_SIZE + 6,
                        TILE_SIZE - 12,
                        TILE_SIZE - 12
                    );
                } else {
                    // Fallback to text if image not loaded
                    ctx.fillStyle = '#FF9900';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('AWS', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }
    }
    
    // Draw particles (behind player and ghosts)
    ParticleSystem.draw(ctx);
    
    // Draw projectiles
    projectiles.forEach(proj => {
        ctx.fillStyle = '#FFD700'; // Yellow/gold color
        ctx.beginPath();
        ctx.arc(
            proj.visualX * TILE_SIZE + TILE_SIZE / 2,
            proj.visualY * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 6, // Small circle
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Add white glow
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Draw ghosts
    ghosts.forEach(ghost => {
        // Use cyan/blue color for frozen enemies
        ctx.fillStyle = ghost.frozen ? '#00D9FF' : '#e94560';
        ctx.beginPath();
        ctx.arc(
            ghost.visualX * TILE_SIZE + TILE_SIZE / 2,
            ghost.visualY * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Ghost eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ghost.visualX * TILE_SIZE + TILE_SIZE / 2 - 5, ghost.visualY * TILE_SIZE + TILE_SIZE / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ghost.visualX * TILE_SIZE + TILE_SIZE / 2 + 5, ghost.visualY * TILE_SIZE + TILE_SIZE / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw player (Kiro logo)
    if (kiroImage.complete) {
        ctx.drawImage(
            kiroImage,
            player.visualX * TILE_SIZE + 2,
            player.visualY * TILE_SIZE + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4
        );
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#790ECB';
        ctx.fillRect(
            player.visualX * TILE_SIZE + 5,
            player.visualY * TILE_SIZE + 5,
            TILE_SIZE - 10,
            TILE_SIZE - 10
        );
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Courier New';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 40);
}

function drawLevelComplete() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#790ECB';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Courier New';
    ctx.fillText('You collected all items!', canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 60);
}

function updateUI() {
    document.getElementById('health').textContent = player.health;
    document.getElementById('items').textContent = player.inventory;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
init();
