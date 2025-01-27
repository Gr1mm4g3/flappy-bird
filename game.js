class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 288;
        this.canvas.height = 512;
        
        // Game states
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
        
        // Bird properties
        this.birdX = 50;
        this.birdY = this.canvas.height / 2;
        this.birdVelocity = 0;
        this.birdGravity = 0.25;
        this.birdFlap = -4.6;
        this.birdRotation = 0;
        
        // Pipe properties
        this.pipeWidth = 52;
        this.pipeGap = 120;
        this.pipes = [];
        this.pipeSpawnTimer = 0;
        this.pipeSpawnInterval = 90;
        
        // Load images
        this.images = {
            bird: this.loadImage('assets/flappybird.png'),
            background: this.loadImage('assets/flappybirdbg.png'),
            topPipe: this.loadImage('assets/toppipe.png'),
            bottomPipe: this.loadImage('assets/bottompipe.png')
        };
        
        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.handleInput();
        });
        document.addEventListener('touchstart', () => this.handleInput());
        document.addEventListener('mousedown', () => this.handleInput());
        
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('restart-button').addEventListener('click', () => this.restartGame());
        
        // Start animation loop
        this.lastTime = 0;
        this.animate(0);
    }
    
    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }
    
    handleInput() {
        if (!this.gameStarted) {
            this.startGame();
        }
        if (!this.gameOver) {
            this.birdVelocity = this.birdFlap;
        }
    }
    
    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        this.gameStarted = true;
        this.gameOver = false;
        this.score = 0;
        this.birdY = this.canvas.height / 2;
        this.birdVelocity = 0;
        this.pipes = [];
    }
    
    restartGame() {
        document.getElementById('game-over').classList.add('hidden');
        this.startGame();
    }
    
    spawnPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: height,
            passed: false
        });
    }
    
    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameStarted && !this.gameOver) {
            // Update bird
            this.birdVelocity += this.birdGravity;
            this.birdY += this.birdVelocity;
            
            // Calculate bird rotation
            this.birdRotation = Math.min(Math.PI/4, Math.max(-Math.PI/4, this.birdVelocity * 0.2));
            
            // Spawn pipes
            this.pipeSpawnTimer++;
            if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
                this.spawnPipe();
                this.pipeSpawnTimer = 0;
            }
            
            // Update pipes
            this.pipes.forEach(pipe => {
                pipe.x -= 2;
                
                // Check for score
                if (!pipe.passed && pipe.x + this.pipeWidth < this.birdX) {
                    pipe.passed = true;
                    this.score++;
                }
                
                // Check for collisions
                if (this.checkCollision(pipe)) {
                    this.gameOver = true;
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('flappyHighScore', this.highScore);
                    }
                    document.getElementById('final-score').textContent = this.score;
                    document.getElementById('high-score').textContent = this.highScore;
                    document.getElementById('game-over').classList.remove('hidden');
                }
            });
            
            // Remove off-screen pipes
            this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > 0);
            
            // Check bounds
            if (this.birdY < 0 || this.birdY + 24 > this.canvas.height) {
                this.gameOver = true;
            }
        }
        
        // Draw pipes
        this.pipes.forEach(pipe => {
            // Draw top pipe
            this.ctx.drawImage(
                this.images.topPipe,
                pipe.x,
                0,
                this.pipeWidth,
                pipe.topHeight
            );
            
            // Draw bottom pipe
            this.ctx.drawImage(
                this.images.bottomPipe,
                pipe.x,
                pipe.topHeight + this.pipeGap,
                this.pipeWidth,
                this.canvas.height - pipe.topHeight - this.pipeGap
            );
        });
        
        // Draw bird
        this.ctx.save();
        this.ctx.translate(this.birdX + 17, this.birdY + 12);
        this.ctx.rotate(this.birdRotation);
        this.ctx.drawImage(
            this.images.bird,
            -17,
            -12,
            34,
            24
        );
        this.ctx.restore();
        
        // Draw score
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        if (this.gameStarted) {
            this.ctx.strokeText(this.score, this.canvas.width / 2, 50);
            this.ctx.fillText(this.score, this.canvas.width / 2, 50);
        }
        
        requestAnimationFrame((time) => this.animate(time));
    }
    
    checkCollision(pipe) {
        const birdBox = {
            x: this.birdX,
            y: this.birdY,
            width: 34,
            height: 24
        };
        
        const topPipeBox = {
            x: pipe.x,
            y: 0,
            width: this.pipeWidth,
            height: pipe.topHeight
        };
        
        const bottomPipeBox = {
            x: pipe.x,
            y: pipe.topHeight + this.pipeGap,
            width: this.pipeWidth,
            height: this.canvas.height - pipe.topHeight - this.pipeGap
        };
        
        return this.checkBoxCollision(birdBox, topPipeBox) || 
               this.checkBoxCollision(birdBox, bottomPipeBox);
    }
    
    checkBoxCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }
}

// Start the game when all assets are loaded
window.onload = () => {
    new FlappyBird();
};
