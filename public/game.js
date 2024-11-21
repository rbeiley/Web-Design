// Declare variables at the top
let app;
let gameStarted = false; // Keep track of whether the game physics should update
let db = firebase.firestore(); // Initialize Firestore
let levels = {}; // Store level data
let selectedLevel = null; // Keep track of the selected level
const characterWidth = 55; // Define character width for use in cloud sizing

// Function to populate the main menu with countries from Firebase
function populateCountryList() {
    const countryListElement = document.getElementById('countries');

    // Fetch the 'Levels' collection from Firestore
    db.collection('Levels').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const levelData = doc.data();
            const countryName = levelData.Country;
            const levelLength = levelData['Level Length'];
            const kingImage = levelData['King Image'];

            // Store level data for later use
            levels[countryName] = {
                levelLength: levelLength,
                kingImage: kingImage
            };

            // Create a list item for the country
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = countryName;
            a.addEventListener('click', function(event) {
                event.preventDefault();
                if (!app) { // Check if the game is not already initialized
                    selectedLevel = levels[countryName];
                    initGame();
                }
            });
            li.appendChild(a);
            countryListElement.appendChild(li);
        });
    }).catch((error) => {
        console.error("Error fetching levels: ", error);
    });
}

// Call the function to populate the country list
populateCountryList();

// Function to initialize the game
function initGame() {
    // Hide the main menu
    document.getElementById('main-menu').style.display = 'none';
    // Show the game container
    document.getElementById('game-container').style.display = 'flex';

    // 1. Create the PixiJS Application inside the game container
    app = new PIXI.Application({
        width: 400,
        height: 600,
        backgroundColor: 0xADD8E6, // Light blue color for the background
        antialias: true,
    });
    document.getElementById('game-container').appendChild(app.view);

    // Create background container for clouds
    const backgroundContainer = new PIXI.Container();
    app.stage.addChild(backgroundContainer);

    // Clouds array
    let clouds = [];

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
    character.width = characterWidth;
    character.height = characterWidth;

    character.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
    character.texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON;

    character.anchor.set(0.5, 0.5);
    character.x = app.screen.width / 2;
    // Position character exactly on top of the floor
    character.y = app.screen.height - 45; // Adjusted to match floor position
    character.lastDirection = 'right';

    app.stage.addChild(character);

    // Call the function to create clouds after character is initialized
    createClouds();

    // Function to create clouds
function createClouds() {
    // Number of clouds to create (reduced to 2)
    const numClouds = 2; // Adjusted from 3 to 2

    for (let i = 0; i < numClouds; i++) {
        // Load cloud texture
        const cloudTexture = PIXI.Texture.from('cloud.png'); // Ensure 'cloud.png' exists in your directory
        const cloud = new PIXI.Sprite(cloudTexture);
        cloud.anchor.set(0.5);

        // Adjust cloud size
        // Set the cloud's width to 2.5 times the character's width (smaller clouds)
        cloud.width = 2.5 * characterWidth; // characterWidth is 55, so cloud.width is about 137.5 pixels
        // Cut the height of clouds in half compared to original proportion
        cloud.height = (cloud.texture.height * (cloud.width / cloud.texture.width)) / 1.8;

        // Random position
        cloud.x = Math.random() * app.screen.width;
        cloud.y = Math.random() * app.screen.height;

        backgroundContainer.addChild(cloud);
        clouds.push(cloud);
    }
}

    // Variables for Movement and Physics
    let velocityY = 0;
    const gravity = 0.5;
    const jumpStrength = -13.5;

    // Platforms Array
    let platforms = [];

    // Monster variables
    let monsters = [];
    let nextMonsterSpawnScore = 1000 + Math.random() * 500; // Between 1000 and 1500

    // King variables
    let kingSpawned = false;
    let kingCollected = false;
    let kingPlatform = null;
    let kingSprite = null;

    // Modal dialog variables
    let modalContainer;
    let modalText;
    let modalButton;

    // Declare 'score' before any functions use it
    let score = 0;

    // Text flash timer
    let textFlashTimer = 0;
    const TEXT_VISIBLE_DURATION = 30; // 0.5 seconds at 60fps
    const TEXT_HIDDEN_DURATION = 15;  // 0.25 seconds at 60fps

    // Get level parameters from selectedLevel
    const levelLength = selectedLevel.levelLength || 3000; // Default to 3000 if not specified
    const kingImageName = selectedLevel.kingImage || 'king.png'; // Default to 'king.png' if not specified

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
    function createPlatform(y) {
        const platform = new PIXI.Sprite(platformTexture);
        const baseWidth = 60;
        const minWidth = 30; // minimum platform width
        const maxScoreForDifficulty = 2000; // score at which platforms reach minimum width
        const currentScore = Math.min(score, maxScoreForDifficulty);
        const proportion = currentScore / maxScoreForDifficulty; // value between 0 and 1
        const maxWidthReduction = baseWidth - minWidth; // total possible reduction
        const widthReduction = proportion * maxWidthReduction;
        const randomAdjustment = Math.random() * 5; // random number between 0 and 5
        let platformWidth = baseWidth - widthReduction - randomAdjustment;
        platformWidth = Math.max(platformWidth, minWidth); // ensure width is at least minWidth

        platform.width = platformWidth;
        platform.height = 15;
        // Adjust x so that platform stays within the screen
        platform.x = Math.random() * (app.screen.width - platform.width);
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

        // Create the king sprite
        kingSprite = new PIXI.Sprite.from(kingImageName, kingTextureSettings);
        kingSprite.anchor.set(0.5, 1); // Anchor at bottom center

        // Wait until texture is loaded before setting size
        if (kingSprite.texture.baseTexture.valid) {
            // Texture is already loaded
            adjustKingSpriteSize();
        } else {
            // Wait for texture to load
            kingSprite.texture.baseTexture.on('loaded', adjustKingSpriteSize);
        }

        function adjustKingSpriteSize() {
            // Set the desired width
            const desiredWidth = app.screen.width / 3; // Approximately 133 pixels
            // Calculate scale factor
            const scaleFactor = desiredWidth / kingSprite.texture.width;
            // Set scale to maintain aspect ratio
            kingSprite.scale.set(scaleFactor);

            // Position the king sprite
            kingSprite.x = app.screen.width / 2;
            kingSprite.y = kingPlatform.y; // Place on top of the platform

            // Add the king sprite to the stage
            app.stage.addChild(kingSprite);
        }
    }

    // Function to create a monster
    function createMonster(y) {
        const monsterTextureSettings = {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            mipmap: PIXI.MIPMAP_MODES.ON,
            anisotropicLevel: 16,
            quality: 1
        };
        const monsterTexture = PIXI.Texture.from('monster.png', monsterTextureSettings);

        const monster = new PIXI.Sprite(monsterTexture);
        monster.anchor.set(0.5, 0.5);

        // Set the monster's size to be the same as the character
        monster.width = character.width;
        monster.height = character.height;

        // Position the monster at a random x position at the specified y
        // Adjusted to ensure the monster is fully on-screen
        monster.x = monster.width / 2 + Math.random() * (app.screen.width - monster.width);
        monster.y = y;

        // Set movement properties
        monster.vx = 1 + Math.random(); // Speed between 1 and 2 pixels per frame
        monster.direction = Math.random() < 0.5 ? -1 : 1; // Random initial direction

        app.stage.addChild(monster);
        monsters.push(monster);
    }

    // Function to show a modal dialog (used for both victory and game over)
    function showModal(message) {
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
        modalText = new PIXI.Text(message, textStyle);
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
        const buttonText = new PIXI.Text('Main Menu', { // Changed from 'Play Again' to 'Main Menu'
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

        // Return to the main menu instead of resetting the game
        returnToMainMenu();
    }

    // Function to show the victory modal dialog
    function showVictoryModal() {
        showModal('Congratulations You Conquered This Country! Return to Main Menu:');
    }

    // Function to show the game over modal dialog
    function showGameOverModal() {
        showModal('Game Over! Click to Return to Main Menu:');
    }

    // Initial Platform Generation
    for (let i = 0; i < 10; i++) {
        let y = app.screen.height - 100 - i * 100;
        createPlatform(y);
    }

    // 7. Keyboard Input for Left and Right Movement
    const keys = {};

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function onKeyDown(e) {
        keys[e.code] = true;
        if (!gameStarted && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
            gameStarted = true; // Start the game physics
            startText.visible = false;
            startTextLine2.visible = false;
            velocityY = jumpStrength;  // Initial jump when game starts
        }
    }

    function onKeyUp(e) {
        keys[e.code] = false;
    }

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

        // Move and update monsters
        for (let i = monsters.length - 1; i >= 0; i--) {
            let monster = monsters[i];
            // Move monster
            monster.x += monster.vx * monster.direction;

            // Reverse direction if monster hits the edge of the screen
            if (monster.x <= monster.width / 2) {
                monster.x = monster.width / 2;
                monster.direction *= -1;
            } else if (monster.x >= app.screen.width - monster.width / 2) {
                monster.x = app.screen.width - monster.width / 2;
                monster.direction *= -1;
            }

            // Move monster down with the platforms when the screen scrolls
            if (character.y < app.screen.height / 2) {
                monster.y += app.screen.height / 2 - character.y;
            }

            // Remove monster if it goes off-screen at the bottom
            if (monster.y > app.screen.height) {
                app.stage.removeChild(monster);
                monsters.splice(i, 1);
                continue; // Skip collision detection if monster is removed
            }

            // Collision detection between character and monster
            let monsterBounds = monster.getBounds();
            let characterBounds = character.getBounds();

            if (monsterBounds.x + monsterBounds.width > characterBounds.x &&
                monsterBounds.x < characterBounds.x + characterBounds.width &&
                monsterBounds.y + monsterBounds.height > characterBounds.y &&
                monsterBounds.y < characterBounds.y + characterBounds.height) {
                // Collision detected
                showGameOverModal();
                return; // Exit the game loop
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
                return; // Exit the game loop
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

            // Move clouds down at a slower rate
            for (let cloud of clouds) {
                cloud.y += offset * 0.2; // Move clouds at 15% of the offset
                // If cloud goes off the bottom, reset it to the top
                if (cloud.y > app.screen.height + cloud.height) {
                    cloud.y = -cloud.height;
                    cloud.x = Math.random() * app.screen.width;
                }
            }

            // Update score
            score += offset;
            scoreText.text = 'Score: ' + Math.floor(score);

            // Check if score >= levelLength and king not spawned yet
            if (score >= levelLength && !kingSpawned) {
                createKingPlatform();
                kingSpawned = true;
            }

            // Generate monsters
            if (score >= 1000 && score >= nextMonsterSpawnScore) {
                // Generate a monster above the highest platform
                let highestPlatformY = platforms.length > 0 ? Math.min(...platforms.map(p => p.y)) : 0;
                createMonster(highestPlatformY - 200); // Place monster above the highest platform

                // Set next monster spawn score
                nextMonsterSpawnScore = score + 500 + Math.random() * 500; // Next spawn between 500 and 1000 score units later
            }

            // Generate new platforms only if king not spawned
            if (!kingSpawned) {
                // Generate new platforms
                let highestPlatformY = platforms.length > 0 ? Math.min(...platforms.map(p => p.y)) : app.screen.height - 100;

                while (highestPlatformY > 0) {
                    let y = highestPlatformY - 100;
                    createPlatform(y);
                    highestPlatformY = y;
                }
            }
        }

        // Game Over Condition
        if (character.y - character.height / 2 > app.screen.height) {
            showGameOverModal();
        }
    });

    // Function to return to the main menu
    function returnToMainMenu() {
        // Remove event listeners
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);

        // Destroy the game application and free resources
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        app = null; // Reset the app variable
        document.getElementById('game-container').innerHTML = '';
        // Hide the game container
        document.getElementById('game-container').style.display = 'none';
        // Show the main menu
        document.getElementById('main-menu').style.display = 'flex';
        gameStarted = false; // Reset the gameStarted variable
        selectedLevel = null; // Reset the selected level
    }
}
