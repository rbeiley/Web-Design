// 1. Create the PixiJS Application
const app = new PIXI.Application({
    width: 400,
    height: 600,
    backgroundColor: 0xFFFFFF,
    antialias: true,
});
document.body.appendChild(app.view);

// 2. Create the Character using Sprites with maximum quality settings
let character;
const textureSettings = {
    scaleMode: PIXI.SCALE_MODES.LINEAR,
    mipmap: PIXI.MIPMAP_MODES.ON,
    anisotropicLevel: 16,
    quality: 1
};

let characterTextures = {
    right: PIXI.Texture.from('doodle_right.png', textureSettings),
    left: PIXI.Texture.from('doodle_left.png', textureSettings)
};

// Load platform texture
const platformTexture = PIXI.Texture.from('platform.png', textureSettings);

// Initialize character sprite with right-facing texture
character = new PIXI.Sprite(characterTextures.right);
character.width = 55;
character.height = 55;

character.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
character.texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON;

character.anchor.set(0.5, 0.5);
character.x = app.screen.width / 2;
// Position character exactly on top of the floor
character.y = app.screen.height - 45; // Adjusted to match floor position (600 - 30 - 27.5)
character.lastDirection = 'right';

app.stage.addChild(character);

// 3. Variables for Movement and Physics
let velocityY = 0;
const gravity = 0.5;
const jumpStrength = -13.5;
let gameStarted = false;

// 4. Platforms Array
let platforms = [];

// King variables
let kingSpawned = false;
let kingCollected = false;
let kingPlatform = null;
let kingSprite = null;

// Modal dialog variables
let modalContainer;
let modalText;
let modalButton;

// 5. Create the Floor
function createFloor() {
    const floor = new PIXI.Graphics();
    floor.beginFill(0x8B4513);  // Brown color for soil
    floor.drawRect(0, 0, app.screen.width, 30);
    floor.endFill();
    floor.y = app.screen.height - 30;

    // Add properties needed for collision detection
    floor.width = app.screen.width;
    floor.height = 30;
    floor.x = 0;

    app.stage.addChild(floor);
    platforms.push(floor);  // Include floor in platforms array
    return floor;  // Return the floor for reference
}

let floor = createFloor();  // Store floor reference

// 6. Generate Random Platforms
function createPlatform(x, y) {
    const platform = new PIXI.Sprite(platformTexture);
    platform.width = 60;
    platform.height = 15;
    platform.x = x;
    platform.y = y;
    app.stage.addChild(platform);
    platforms.push(platform);
}

// Function to create the king platform and sprite
function createKingPlatform() {
    // Create the large platform
    kingPlatform = new PIXI.Sprite(platformTexture);
    kingPlatform.width = app.screen.width - 20; // Almost entire width
    kingPlatform.height = 15;
    kingPlatform.x = 10; // Centered
    kingPlatform.y = platforms.length > 0 ? Math.min(...platforms.map(p => p.y)) - 100 : 0;

    app.stage.addChild(kingPlatform);
    platforms.push(kingPlatform);

    // Create the king sprite with high-quality texture settings
    const kingTextureSettings = {
        scaleMode: PIXI.SCALE_MODES.LINEAR,
        mipmap: PIXI.MIPMAP_MODES.ON,
        anisotropicLevel: 16,
        quality: 1
    };
    const kingTexture = PIXI.Texture.from('king.png', kingTextureSettings);

    kingSprite = new PIXI.Sprite(kingTexture);
    kingSprite.anchor.set(0.5, 1); // Anchor at bottom center

    // Set the king's width to one-third of the game's width
    kingSprite.width = app.screen.width / 3; // Approximately 133 pixels
    // Adjust the height to maintain aspect ratio
    kingSprite.scale.y = kingSprite.scale.x;

    kingSprite.x = app.screen.width / 2;
    kingSprite.y = kingPlatform.y; // Place on top of the platform

    app.stage.addChild(kingSprite);
}

// Function to show the victory modal dialog
function showVictoryModal() {
    // Create a container for the modal
    modalContainer = new PIXI.Container();
    
    // Create a semi-transparent background
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.5); // Black with 50% opacity
    background.drawRect(0, 0, app.screen.width, app.screen.height);
    background.endFill();
    modalContainer.addChild(background);
    
    // Create the modal box
    const modalBox = new PIXI.Graphics();
    modalBox.beginFill(0xFFFFFF); // White background
    modalBox.lineStyle(2, 0x000000); // Black border
    modalBox.drawRoundedRect(0, 0, app.screen.width - 100, 200, 15);
    modalBox.endFill();
    modalBox.x = 50; // Centered horizontally
    modalBox.y = (app.screen.height - 200) / 2; // Centered vertically
    modalContainer.addChild(modalBox);
    
    // Create the text
    const textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#000000',
        wordWrap: true,
        wordWrapWidth: app.screen.width - 120,
        align: 'center'
    });
    modalText = new PIXI.Text('Congrats! You Conquered This Country!', textStyle);
    modalText.anchor.set(0.5);
    modalText.x = app.screen.width / 2;
    modalText.y = modalBox.y + 60;
    modalContainer.addChild(modalText);
    
    // Create the button
    modalButton = new PIXI.Graphics();
    modalButton.beginFill(0x00AAFF); // Blue color
    modalButton.drawRoundedRect(0, 0, 150, 50, 10);
    modalButton.endFill();
    modalButton.x = (app.screen.width - 150) / 2;
    modalButton.y = modalBox.y + 120;
    modalButton.interactive = true;
    modalButton.buttonMode = true;
    modalButton.on('pointerdown', onModalButtonClick);
    modalContainer.addChild(modalButton);
    
    // Button text
    const buttonText = new PIXI.Text('Play Again', {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#FFFFFF'
    });
    buttonText.anchor.set(0.5);
    buttonText.x = modalButton.x + 75; // Half of button width
    buttonText.y = modalButton.y + 25; // Half of button height
    modalContainer.addChild(buttonText);
    
    app.stage.addChild(modalContainer);
    
    // Pause the game loop
    app.ticker.stop();
}

function onModalButtonClick() {
    // Remove the modal from the stage
    app.stage.removeChild(modalContainer);
    modalContainer = null;
    
    // Reset the game
    resetGame();
    
    // Restart the game loop
    app.ticker.start();
}

// Initial Platform Generation
for (let i = 0; i < 10; i++) {
    createPlatform(
        Math.random() * (app.screen.width - 60),
        app.screen.height - 100 - i * 100
    );
}

// 7. Keyboard Input for Left and Right Movement
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (!gameStarted && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        gameStarted = true;
        startText.visible = false;
        startTextLine2.visible = false;
        velocityY = jumpStrength;  // Initial jump when game starts
    }
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
scoreText.anchor.set(0.5, 0);
scoreText.x = app.screen.width / 2;
scoreText.y = 10;
app.stage.addChild(scoreText);

// Start Game Text (Split into two lines)
const startStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 32,
    fill: 'grey',
    fontWeight: 'bold',
});
const startText = new PIXI.Text('CLICK AN ARROW', startStyle);
startText.anchor.set(0.5);
startText.x = app.screen.width / 2;
startText.y = app.screen.height / 2 - 20;
app.stage.addChild(startText);

const startTextLine2 = new PIXI.Text('TO BEGIN!', startStyle);
startTextLine2.anchor.set(0.5);
startTextLine2.x = app.screen.width / 2;
startTextLine2.y = app.screen.height / 2 + 20;
app.stage.addChild(startTextLine2);

let score = 0;
let textFlashTimer = 0;
const TEXT_VISIBLE_DURATION = 30; // 0.5 seconds at 60fps
const TEXT_HIDDEN_DURATION = 15;  // 0.25 seconds at 60fps

// 9. Game Loop
app.ticker.add(() => {
    // Handle text flashing when game hasn't started
    if (!gameStarted) {
        textFlashTimer = (textFlashTimer + 1) % (TEXT_VISIBLE_DURATION + TEXT_HIDDEN_DURATION);
        const isVisible = textFlashTimer < TEXT_VISIBLE_DURATION;
        startText.visible = isVisible;
        startTextLine2.visible = isVisible;
        return;  // Don't update game state until game starts
    }

    // Apply gravity
    velocityY += gravity;
    character.y += velocityY;

    // Move left and right with sprite changes
    if (keys['ArrowLeft']) {
        character.x -= 5;
        character.texture = characterTextures.left;
        character.lastDirection = 'left';
    } else if (keys['ArrowRight']) {
        character.x += 5;
        character.texture = characterTextures.right;
        character.lastDirection = 'right';
    } else {
        character.texture = characterTextures[character.lastDirection];
    }

    // Wrap around the screen horizontally
    if (character.x > app.screen.width + character.width / 2) {
        character.x = -character.width / 2;
    } else if (character.x < -character.width / 2) {
        character.x = app.screen.width + character.width / 2;
    }

    // Collision Detection with One-Way Platforms - Updated for feet-only detection
    const characterFeetY = character.y + character.height / 3; // Adjusted feet position

    for (let platform of platforms) {
        if (
            character.x + character.width / 3 > platform.x &&
            character.x - character.width / 3 < platform.x + platform.width &&
            characterFeetY > platform.y &&
            characterFeetY - velocityY <= platform.y &&
            velocityY > 0
        ) {
            velocityY = jumpStrength;
            break;
        }
    }

    // Collision with king
    if (kingSprite && !kingCollected) {
        let kingBounds = kingSprite.getBounds();
        let characterBounds = character.getBounds();

        if (characterBounds.x + characterBounds.width > kingBounds.x &&
            characterBounds.x < kingBounds.x + kingBounds.width &&
            characterBounds.y + characterBounds.height > kingBounds.y &&
            characterBounds.y < kingBounds.y + kingBounds.height) {
            // Collision detected
            kingCollected = true;
            showVictoryModal();
        }
    }

    // Scroll the map when the character reaches the middle
    if (character.y < app.screen.height / 2) {
        const offset = app.screen.height / 2 - character.y;
        character.y = app.screen.height / 2;

        // Move platforms down
        for (let i = platforms.length - 1; i >= 0; i--) { // Iterate backwards to safely remove
            let platform = platforms[i];
            platform.y += offset;

            if (platform.y > app.screen.height) {
                app.stage.removeChild(platform);
                platforms.splice(i, 1);

                // If the platform is the kingPlatform, remove the kingSprite as well
                if (platform === kingPlatform) {
                    if (kingSprite) {
                        app.stage.removeChild(kingSprite);
                        kingSprite = null;
                    }
                    kingPlatform = null;
                }
            }
        }

        // Move king sprite down if it exists
        if (kingSprite) {
            kingSprite.y += offset;
        }

        // Update score
        score += offset;
        scoreText.text = 'Score: ' + Math.floor(score);

        // Check if score >= 1000 and king not spawned yet
        if (score >= 1000 && !kingSpawned) {
            createKingPlatform();
            kingSpawned = true;
        }

        // Generate new platforms only if king not spawned
        if (!kingSpawned) {
            // Generate new platforms
            let highestPlatformY = platforms.length > 0 ? Math.min(...platforms.map(p => p.y)) : app.screen.height - 100;

            while (highestPlatformY > 0) {
                let x = Math.random() * (app.screen.width - 60);
                let y = highestPlatformY - 100;
                createPlatform(x, y);
                highestPlatformY = y;
            }
        }
    }

    // Game Over Condition
    if (character.y - character.height / 2 > app.screen.height) {
        alert('Game Over!');
        resetGame();
    }
});

// 10. Reset Game Function
function resetGame() {
    // Reset character position and texture
    character.x = app.screen.width / 2;
    character.y = app.screen.height - 45; // Adjusted to match floor position
    character.texture = characterTextures.right;
    character.lastDirection = 'right';
    velocityY = 0;
    gameStarted = false;

    // Reset text flash timer
    textFlashTimer = 0;
    startText.visible = true;
    startTextLine2.visible = true;

    // Reset score
    score = 0;
    scoreText.text = 'Score: ' + score;

    // Remove existing platforms
    for (let platform of platforms) {
        app.stage.removeChild(platform);
    }
    platforms = [];

    // Remove existing king platform and king sprite
    if (kingPlatform) {
        app.stage.removeChild(kingPlatform);
        kingPlatform = null;
    }
    if (kingSprite) {
        app.stage.removeChild(kingSprite);
        kingSprite = null;
    }

    // Reset king variables
    kingSpawned = false;
    kingCollected = false;

    // Recreate floor and initial platforms
    floor = createFloor();  // Update floor reference

    for (let i = 0; i < 10; i++) {
        createPlatform(
            Math.random() * (app.screen.width - 60),
            app.screen.height - 100 - i * 100
        );
    }
}
