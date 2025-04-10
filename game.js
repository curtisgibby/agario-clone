const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load panda face SVG
const pandaFace = new Image();
pandaFace.src = 'panda_face.svg';

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 16,
    color: '#599D15', // Keep color for fallback
    speed: 2,
    dx: 0,
    dy: 0
};

let dots = [];

function createDots(num) {
    const colors = ['#599D15', '#6AB929', '#78D42E', '#4A8412', '#3B6A0E']; // Original, 20% lighter, 30% lighter, 20% darker, 30% darker
    for (let i = 0; i < num; i++) {
        let x, y, distance;
        do {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
            const dx = x - player.x;
            const dy = y - player.y;
            distance = Math.sqrt(dx * dx + dy * dy);
        } while (distance < player.radius + 10); // Ensure dots are not created within player's radius

        const speed = Math.random() * 0.5 + 0.5; // Random speed between 0.5 and 1
        const angle = Math.random() * Math.PI * 2; // Random angle
        dots.push({
            x: x,
            y: y,
            radius: Math.random() * 7 + 6, // Smaller minimum size
            color: colors[Math.floor(Math.random() * colors.length)],
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed
        });
    }
}

function drawPlayer() {
    // Draw the player
    drawEntity(player.x, player.y, player.radius, drawPlayerAt);
}

function drawPlayerAt(x, y, radius) {
    if (pandaFace.complete) {
        // Draw panda face SVG
        const size = radius * 2;
        ctx.drawImage(pandaFace, x - radius, y - radius, size, size);
    } else {
        // Fallback to circle if SVG is not loaded
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();
    }
}

function drawDots() {
    dots.forEach(dot => {
        drawEntity(dot.x, dot.y, dot.radius, (x, y, radius) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = dot.color;
            ctx.fill();
            ctx.closePath();
        });
    });
}

// Helper function to draw an entity with edge wrapping
function drawEntity(x, y, radius, drawFunction) {
    // Original position
    drawFunction(x, y, radius);
    
    // Check if the entity is near the edges and should be drawn on the opposite side
    const edgeThreshold = radius;
    
    // Near left edge - draw on right side too
    if (x < edgeThreshold) {
        drawFunction(x + canvas.width, y, radius);
    }
    // Near right edge - draw on left side too
    else if (x > canvas.width - edgeThreshold) {
        drawFunction(x - canvas.width, y, radius);
    }
    
    // Near top edge - draw on bottom side too
    if (y < edgeThreshold) {
        drawFunction(x, y + canvas.height, radius);
    }
    // Near bottom edge - draw on top side too
    else if (y > canvas.height - edgeThreshold) {
        drawFunction(x, y - canvas.height, radius);
    }
    
    // Handle corner cases - draw in diagonal corners
    if (x < edgeThreshold && y < edgeThreshold) {
        // Top-left corner - draw in bottom-right corner
        drawFunction(x + canvas.width, y + canvas.height, radius);
    }
    else if (x < edgeThreshold && y > canvas.height - edgeThreshold) {
        // Bottom-left corner - draw in top-right corner
        drawFunction(x + canvas.width, y - canvas.height, radius);
    }
    else if (x > canvas.width - edgeThreshold && y < edgeThreshold) {
        // Top-right corner - draw in bottom-left corner
        drawFunction(x - canvas.width, y + canvas.height, radius);
    }
    else if (x > canvas.width - edgeThreshold && y > canvas.height - edgeThreshold) {
        // Bottom-right corner - draw in top-left corner
        drawFunction(x - canvas.width, y - canvas.height, radius);
    }
}

let keysPressed = {};

function movePlayer() {
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        
        // Check for Enter key to restart the game
        if (e.key === 'Enter' && gameOver) {
            resetGame();
            gameOver = false;
            update(); // Restart the game loop
        }
    });

    window.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    function updatePlayerDirection() {
        let dx = 0;
        let dy = 0;

        // Arrow keys
        if (keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) dy -= player.speed;
        if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) dy += player.speed;
        if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) dx -= player.speed;
        if (keysPressed['ArrowRight'] || keysPressed['d'] || keysPressed['D']) dx += player.speed;

        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude > 0) {
            player.dx = (dx / magnitude) * player.speed;
            player.dy = (dy / magnitude) * player.speed;
        }
    }

    setInterval(updatePlayerDirection, 16); // Update direction every 16ms (~60fps)
}

function checkCollision(a, b) {
    // Check collision in all possible positions (original and wrapped)
    // This handles the case where entities are on opposite sides of the screen
    
    // Get the shortest distance considering wrapping
    const dx = getShortestDistance(a.x, b.x, canvas.width);
    const dy = getShortestDistance(a.y, b.y, canvas.height);
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < a.radius + b.radius;
}

// Helper function to get the shortest distance between two points considering wrapping
function getShortestDistance(pos1, pos2, maxDimension) {
    // Direct distance
    let direct = Math.abs(pos1 - pos2);
    
    // Wrapped distance (going around the edge)
    let wrapped = maxDimension - direct;
    
    // Return the shorter of the two distances
    return Math.min(direct, wrapped);
}

function replenishDots() {
    const targetDotCount = Math.min(50 + Math.floor(player.radius / 5), 200); // Increase target count as player grows
    if (dots.length < targetDotCount) {
        createDots(targetDotCount - dots.length);
    }
}

function resetGame() {
    player.radius = 18; // Increased from 10
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.dx = 0;
    player.dy = 0;
    dots = [];
    createDots(50);
}

function updateDots() {
    // Track dots that have been consumed this frame
    let consumedDots = new Set();
    
    dots.forEach((dot, index) => {
        // Skip if this dot has already been consumed
        if (consumedDots.has(index)) return;
        
        // Apply gravity from larger dots only
        for (let i = 0; i < dots.length; i++) {
            if (i !== index && dots[i].radius > dot.radius && !consumedDots.has(i)) {
                // Calculate direction vector
                const dx = dots[i].x - dot.x;
                const dy = dots[i].y - dot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Apply gravity if within range (larger dots have greater range)
                const gravityRange = dots[i].radius * 5;
                if (distance < gravityRange) {
                    // Gravity strength based on size difference and distance, reduced by a fudge factor
                    const gravityStrength = (dots[i].radius - dot.radius) / (distance * 40);
                    // Normalize direction vector and apply gravity
                    dot.dx += (dx / distance) * gravityStrength;
                    dot.dy += (dy / distance) * gravityStrength;
                }
            }
        }
        
        // Apply speed limit to prevent dots from moving too fast
        const speed = Math.sqrt(dot.dx * dot.dx + dot.dy * dot.dy);
        const maxSpeed = 2;
        if (speed > maxSpeed) {
            dot.dx = (dot.dx / speed) * maxSpeed;
            dot.dy = (dot.dy / speed) * maxSpeed;
        }

        // Update position
        dot.x += dot.dx;
        dot.y += dot.dy;

        // Wrap around logic for dots
        if (dot.x < 0) dot.x = canvas.width;
        if (dot.x > canvas.width) dot.x = 0;
        if (dot.y < 0) dot.y = canvas.height;
        if (dot.y > canvas.height) dot.y = 0;

        // Check for collisions with other dots - only if they're actively moving toward each other
        for (let i = 0; i < dots.length; i++) {
            if (i !== index && !consumedDots.has(i) && !consumedDots.has(index) && checkCollision(dot, dots[i])) {
                // Check if dots are moving toward each other (active collision)
                const dx = dots[i].x - dot.x;
                const dy = dots[i].y - dot.y;
                const dotProduct = dot.dx * dx + dot.dy * dy; // Positive if moving toward each other
                
                if (dotProduct > 0 || dots[i].dx * (-dx) + dots[i].dy * (-dy) > 0) {
                    if (dot.radius > dots[i].radius) {
                        // Balanced growth reduction for enemy dots
                        const growthReduction = Math.max(0.55, 1 - (dot.radius / 90)); // Reduce base growth more aggressively
                        dot.radius += dots[i].radius / 2.5 * growthReduction; // Split the difference between /2 and /3
                        consumedDots.add(i);
                    } else if (dot.radius < dots[i].radius) {
                        // Balanced growth reduction for enemy dots
                        const growthReduction = Math.max(0.55, 1 - (dots[i].radius / 90)); // Reduce base growth more aggressively
                        dots[i].radius += dot.radius / 2.5 * growthReduction; // Split the difference between /2 and /3
                        consumedDots.add(index);
                        break;
                    }
                }
            }
        }
    });
    
    // Remove consumed dots (in reverse order to avoid index issues)
    const consumedIndices = Array.from(consumedDots).sort((a, b) => b - a);
    for (const index of consumedIndices) {
        dots.splice(index, 1);
    }
}

let gameOver = false;

function drawWinMessage() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.font = '24px Roboto';
    ctx.fillText('Press Enter to play again', canvas.width / 2, canvas.height / 2 + 24);
}

function drawLoseMessage() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('You Lose!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.font = '24px Roboto';
    ctx.fillText('Press Enter to try again', canvas.width / 2, canvas.height / 2 + 24);
}

function update() {
    if (gameOver) {
        if (player.radius >= Math.min(canvas.width, canvas.height) / 2) { 
            drawWinMessage();
        } else {
            drawLoseMessage();
        }
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.x += player.dx;
    player.y += player.dy;

    // Wrap around logic for player
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;
    if (player.y < 0) player.y = canvas.height;
    if (player.y > canvas.height) player.y = 0;

    drawPlayer();
    drawDots();

    updateDots();

    // Track if we're going to lose this frame
    let playerLoses = false;
    let finalCollisionDot = null;

    dots = dots.filter(dot => {
        if (checkCollision(player, dot)) {
            if (player.radius > dot.radius) {
                // More restrictive growth for player (reduced by 5%)
                const baseGrowthFactor = 1 / (1 + player.radius / 47.5); // Less aggressive reduction (was 45)
                const playerGrowthReduction = Math.max(0.38, 1 - (player.radius / 57.5)); // Increased minimum from 0.36 to 0.38
                player.radius += dot.radius * baseGrowthFactor * playerGrowthReduction * 0.95; // 5% reduction instead of 10%
                return false; // Remove the dot
            } else {
                // Instead of setting gameOver immediately, track that we'll lose after rendering
                playerLoses = true;
                finalCollisionDot = dot;
                return true; // Keep the dot for one more frame
            }
        }
        return true;
    });

    replenishDots();

    // Check if player radius is as big as the canvas
    if (player.radius >= Math.min(canvas.width, canvas.height) / 2) { 
        gameOver = true;
    }

    // Set gameOver after rendering if player loses
    if (playerLoses) {
        // Schedule game over for after this frame completes
        setTimeout(() => {
            gameOver = true;
            // Force one more render to show the game over screen
            requestAnimationFrame(update);
        }, 0);
    } else {
        requestAnimationFrame(update);
    }
}

createDots(50);
movePlayer();
update();
