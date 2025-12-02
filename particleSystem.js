// Particle System Module
export const createParticleSystem = (maxParticles = 500, canvasWidth = 800, canvasHeight = 600) => ({
    particles: [],
    maxParticles: maxParticles,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    
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
            if (p.life <= 0 || (p.type === 'confetti' && p.y > this.canvasHeight)) {
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
    
    createTrail(x, y, gameState = 'playing') {
        // Only create trails during playing state
        if (gameState !== 'playing') return;
        
        // Create 2-3 trail particles
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const color = this.trailColors[Math.floor(Math.random() * this.trailColors.length)];
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20, // TILE_SIZE * 0.5 = 20
                y: y + (Math.random() - 0.5) * 20,
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
        const x = Math.random() * this.canvasWidth;
        
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
});
