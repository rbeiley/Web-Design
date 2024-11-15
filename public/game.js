// 1. Create the PixiJS Application
const app = new PIXI.Application({
    width: 400,
    height: 600,
    backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);

// 2. Create the Character
const character = new PIXI.Graphics();
character.beginFill(0xff0000); // Red color
character.drawRect(0, 0, 30, 30); // 30x30 square
character.endFill();
character.x = app.screen.width / 2 - 15; // Center horizontally
character.y = app.screen.height - 90; // Start above the floor

app.stage.addChild(character);

// 3. Variables for Movement and Physics
let velocityY = 0;
const gravity = 0.5;
const jumpStrength = -13.5; // Updated jump strength

// 4. Platforms Array
let platforms = []; // Changed to 'let' to allow resetting

// 5. Create the Floor
function createFloor() {
    const floor = new PIXI.Graphics();
    floor.beginFill(0x654321); // Brown color for the floor
    floor.drawRect(0, 0, app.screen.width, 30); // Floor size
    floor.endFill();
    floor.x = 0;
    floor.y = app.screen.height - 30; // Positioned at the bottom
    app.stage.addChild(floor);
    platforms.push(floor);
}

createFloor(); // Call the function to create the floor

// 6. Generate Random Platforms
function createPlatform(x, y) {
    const platform = new PIXI.Graphics();
    platform.beginFill(0x00ff00); // Green color
    platform.drawRect(0, 0, 60, 10); // Platform size
    platform.endFill();
    platform.x = x;
    platform.y = y;
    app.stage.addChild(platform);
    platforms.push(platform);
}

// Initial Platform Generation
for (let i = 0; i < 10; i++) {
    createPlatform(
        Math.random() * (app.screen.width - 60), // Random x position
        app.screen.height - 100 - i * 100 // Stack platforms 100 pixels apart
    );
}

// 7. Keyboard Input for Left and Right Movement
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// 8. Score Display
const style = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 'grey',
    fontWeight: 'bold',
});
const scoreText = new PIXI.Text('Score: 0', style);
scoreText.anchor.set(0.5, 0); // Center horizontally
scoreText.x = app.screen.width / 2;
scoreText.y = 10; // Position at the top with padding
app.stage.addChild(scoreText);

let score = 0;

// 9. Game Loop
app.ticker.add(() => {
    // Apply gravity
    velocityY += gravity;
    character.y += velocityY;

    // Move left and right
    if (keys['ArrowLeft']) {
        character.x -= 5;
    }
    if (keys['ArrowRight']) {
        character.x += 5;
    }

    // Wrap around the screen horizontally
    if (character.x > app.screen.width) {
        character.x = -character.width;
    } else if (character.x + character.width < 0) {
        character.x = app.screen.width;
    }

    // Collision Detection with One-Way Platforms
    for (let platform of platforms) {
        if (
            character.x + character.width > platform.x && // Collision on x-axis
            character.x < platform.x + platform.width &&
            character.y + character.height > platform.y && // Collision on y-axis
            character.y + character.height - velocityY <= platform.y && // Was above platform last frame
            velocityY > 0 // Moving downwards
        ) {
            velocityY = jumpStrength; // Jump back up
        }
    }

    // Scroll the map when the character reaches the middle
    if (character.y < app.screen.height / 2) {
        const offset = app.screen.height / 2 - character.y;
        character.y = app.screen.height / 2;

        // Move platforms down
        for (let platform of platforms) {
            platform.y += offset;

            // Remove platforms that are off-screen
            if (platform.y > app.screen.height) {
                app.stage.removeChild(platform);
                platforms.splice(platforms.indexOf(platform), 1);
            }
        }

        // Generate new platforms above if necessary
        let highestPlatformY = Math.min(...platforms.map(p => p.y));

        while (highestPlatformY > 0) {
            let x = Math.random() * (app.screen.width - 60);
            let y = highestPlatformY - 100; // Space platforms 100 pixels apart
            createPlatform(x, y);
            highestPlatformY = y;
        }

        // Update score based on character's cumulative ascent
        score += offset;
        scoreText.text = 'Score: ' + Math.floor(score);
    }

    // Game Over Condition
    if (character.y > app.screen.height) {
        alert('Game Over!');
        // Reset the game
        resetGame();
    }
});

// 10. Reset Game Function
function resetGame() {
    // Reset character position
    character.x = app.screen.width / 2 - 15;
    character.y = app.screen.height - 90;
    velocityY = 0;

    // Reset score
    score = 0;
    scoreText.text = 'Score: ' + score;

    // Remove existing platforms
    for (let platform of platforms) {
        app.stage.removeChild(platform);
    }
    platforms = [];

    // Recreate floor and initial platforms
    createFloor();

    for (let i = 0; i < 10; i++) {
        createPlatform(
            Math.random() * (app.screen.width - 60),
            app.screen.height - 100 - i * 100 // Stack platforms 100 pixels apart
        );
    }
}
