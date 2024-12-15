// Game.js

class Game {
    constructor(gameManager, selectedCountry) {
        this.gameManager = gameManager;
        this.selectedCountry = selectedCountry;
        this.isWon = false;
        this.app = null;
        this.gameStarted = false;
        this.initGame();
    }

    initGame() {
        // Variables specific to the game instance

        // Hide the game map
        this.gameManager.gameMap.style.display = 'none';
        // Show the game container
        this.gameManager.gameContainer.style.display = 'flex';

        // Variables for Movement and Physics
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpStrength = -13.5;
        this.springBoost = false; // Track if the character has a spring boost

        // Platforms Array
        this.platforms = [];

        // Monster variables
        this.monsters = [];
        this.nextMonsterSpawnScore = 1000 + Math.random() * 500; // Between 1000 and 1500

        // King variables
        this.kingSpawned = false;
        this.kingCollected = false;
        this.kingPlatform = null;
        this.kingSprite = null;

        // Springs Array
        this.springs = [];

        // Modal dialog variables
        this.modalContainer = null;
        this.modalText = null;
        this.modalButton = null;

        // Declare 'score' before any functions use it
        this.score = 0;

        // Text flash timer
        this.textFlashTimer = 0;
        this.TEXT_VISIBLE_DURATION = 30; // 0.5 seconds at 60fps
        this.TEXT_HIDDEN_DURATION = 15;  // 0.25 seconds at 60fps

        // Get level parameters from selectedCountry
        this.levelLength = this.selectedCountry.levelLength || 3000; // Default to 3000 if not specified
        this.kingImageName = this.selectedCountry.kingImage || 'pictures/king.png'; // Default to 'king.png' if not specified

        // 1. Create the PixiJS Application inside the game container
        this.app = new PIXI.Application({
            width: 400,
            height: 600,
            backgroundColor: 0xADD8E6, // Light blue color for the background
            antialias: true,
        });
        this.gameManager.gameContainer.appendChild(this.app.view);

        // Continue initializing game components...
        this.initializeBackground();
        this.initializeCharacter();
        this.createFloor();
        this.createInitialPlatforms();
        this.initializeKeyboardInput();
        this.initializeScoreDisplay();
        this.initializeStartText();

        // Start the game loop
        this.app.ticker.add(() => this.gameLoop());
    }

    initializeBackground() {
        // Create background container for clouds
        this.backgroundContainer = new PIXI.Container();
        this.app.stage.addChild(this.backgroundContainer);

        // Clouds array
        this.clouds = [];

        // Function to create clouds
        this.createClouds();
    }

    createClouds() {
        // Number of clouds to create
        const numClouds = 2; // Adjusted to have 1-2 clouds on screen
        for (let i = 0; i < numClouds; i++) {
            // Load cloud texture
            const cloudTexture = PIXI.Texture.from('pictures/cloud.png'); // Ensure 'cloud.png' exists in your directory
            const cloud = new PIXI.Sprite(cloudTexture);
            cloud.anchor.set(0.5);

            // Adjust cloud size
            cloud.width = 2.5 * 55; // characterWidth is 55, so cloud.width is about 137.5 pixels
            cloud.height = (cloud.texture.height * (cloud.width / cloud.texture.width)) / 2;

            // Random position
            cloud.x = Math.random() * this.app.screen.width;
            cloud.y = Math.random() * this.app.screen.height;

            this.backgroundContainer.addChild(cloud);
            this.clouds.push(cloud);
        }
    }

    initializeCharacter() {
        // Variables
        this.characterWidth = 55; // Define character width for use throughout the game

        // Texture settings
        const textureSettings = {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            mipmap: PIXI.MIPMAP_MODES.ON,
            anisotropicLevel: 16,
            quality: 1
        };

        this.characterTextures = {
            right: PIXI.Texture.from('pictures/doodle_right.png', textureSettings),
            left: PIXI.Texture.from('pictures/doodle_left.png', textureSettings)
        };

        // Load platform texture
        this.platformTexture = PIXI.Texture.from('pictures/platform.png', textureSettings);

        // Load spring texture
        this.springTexture = PIXI.Texture.from('spring.png', textureSettings);

        // Load broken platform texture
        this.brokenPlatformTexture = PIXI.Texture.from('pictures/brokenplatform.png', textureSettings);

        // Initialize character sprite with right-facing texture
        this.character = new PIXI.Sprite(this.characterTextures.right);
        this.character.width = this.characterWidth;
        this.character.height = this.characterWidth;

        this.character.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
        this.character.texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON;

        this.character.anchor.set(0.5, 0.5);
        this.character.x = this.app.screen.width / 2;
        // Position character exactly on top of the floor
        this.character.y = this.app.screen.height - 45; // Adjusted to match floor position
        this.character.lastDirection = 'right';

        this.app.stage.addChild(this.character);
    }

    createFloor() {
        const floor = new PIXI.Graphics();
        floor.beginFill(0x8B4513);  // Brown color for soil
        floor.drawRect(0, 0, this.app.screen.width, 30);
        floor.endFill();
        floor.y = this.app.screen.height - 30;

        // Add properties needed for collision detection
        floor.width = this.app.screen.width;
        floor.height = 30;
        floor.x = 0;

        this.app.stage.addChild(floor);
        this.platforms.push(floor);  // Include floor in platforms array
        this.floor = floor;  // Store floor reference
    }

    createInitialPlatforms() {
    // Position the first platform closer to the floor so it's always reachable
    let initialPlatformY = this.app.screen.height - 60; // Was previously this.app.screen.height - 100
    this.createPlatform(initialPlatformY);

    // Now create the remaining platforms above it
    for (let i = 1; i < 15; i++) {
        let gap = 70 + Math.random() * 50; // Random gap between 70 and 120 pixels
        initialPlatformY -= gap;
        this.createPlatform(initialPlatformY);
    }
}


    createPlatform(y) {
        // Adjust the probability of spawning a broken platform based on the score
        const maxBrokenProbability = 0.25;  // Maximum probability (1 in 4)
        const minBrokenProbability = 0.125; // Starting probability (1 in 8)
        const maxScoreForBrokenPlatforms = 2000; // Score at which probability reaches maximum
        const currentScoreForBrokenPlatforms = Math.min(this.score, maxScoreForBrokenPlatforms);
        const brokenPlatformProbability = minBrokenProbability +
            ((currentScoreForBrokenPlatforms / maxScoreForBrokenPlatforms) * (maxBrokenProbability - minBrokenProbability));

        // Adjust platform width based on score (difficulty)
        const baseWidth = 60;
        const minWidth = 30; // minimum platform width
        const maxScoreForDifficulty = 2000; // score at which platforms reach minimum width
        const currentScore = Math.min(this.score, maxScoreForDifficulty);
        const proportion = currentScore / maxScoreForDifficulty; // value between 0 and 1
        const maxWidthReduction = baseWidth - minWidth; // total possible reduction
        const widthReduction = proportion * maxWidthReduction;
        const randomAdjustment = Math.random() * 5; // random number between 0 and 5
        let platformWidth = baseWidth - widthReduction - randomAdjustment;
        platformWidth = Math.max(platformWidth, minWidth); // ensure width is at least minWidth

        // Decide whether to create a broken platform
        if (Math.random() < brokenPlatformProbability) {
            this.createBrokenPlatform(y, platformWidth);
        } else {
            // Create a normal platform
            const platform = new PIXI.Sprite(this.platformTexture);
            platform.width = platformWidth;
            platform.height = 15;
            // Adjust x so that platform stays within the screen
            platform.x = Math.random() * (this.app.screen.width - platform.width);
            platform.y = y;
            platform.isBroken = false; // Normal platform
            platform.isBrokenActivated = false; // For consistency
            platform.falling = false; // For consistency
            platform.vx = 0; // For consistency
            platform.direction = 0;

            this.app.stage.addChild(platform);
            this.platforms.push(platform);

            // Add spring to some platforms
            if (this.score >= 500 && Math.random() < 0.0667) { // Approximately 1 in 15 platforms
                this.createSpring(platform);
            }
        }
    }

    createBrokenPlatform(y, platformWidth) {
        const brokenPlatform = new PIXI.Sprite(this.brokenPlatformTexture);
        brokenPlatform.width = platformWidth;
        brokenPlatform.height = 15;
        brokenPlatform.x = Math.random() * (this.app.screen.width - brokenPlatform.width);
        brokenPlatform.y = y;
        brokenPlatform.isBroken = true; // Flag to identify broken platforms
        brokenPlatform.isBrokenActivated = false; // Flag to check if it has been stepped on
        brokenPlatform.falling = false;

        this.app.stage.addChild(brokenPlatform);
        this.platforms.push(brokenPlatform);
    }

    createSpring(platform) {
        const spring = new PIXI.Sprite(this.springTexture);
        spring.anchor.set(0.5, 1); // Anchor at bottom center
        spring.width = platform.width / 3; // Cover middle third of the platform
        spring.height = spring.texture.height * (spring.width / spring.texture.width);

        spring.x = platform.x + platform.width / 2;
        spring.y = platform.y;

        // Add reference to the platform
        spring.platform = platform;

        this.app.stage.addChild(spring);
        this.springs.push(spring);
    }

    createKingPlatform() {
        // Create the large platform
        this.kingPlatform = new PIXI.Sprite(this.platformTexture);
        this.kingPlatform.width = this.app.screen.width - 20; // Almost entire width
        this.kingPlatform.height = 15;
        this.kingPlatform.x = 10; // Centered
        this.kingPlatform.y = this.platforms.length > 0 ? Math.min(...this.platforms.map(p => p.y)) - 100 : 0;

        this.app.stage.addChild(this.kingPlatform);
        this.platforms.push(this.kingPlatform);

        // Create the king sprite with high-quality texture settings
        const kingTextureSettings = {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            mipmap: PIXI.MIPMAP_MODES.ON,
            anisotropicLevel: 16,
            quality: 1
        };

        // Create the king sprite
        this.kingSprite = PIXI.Sprite.from(this.kingImageName, kingTextureSettings);
        this.kingSprite.anchor.set(0.5, 1); // Anchor at bottom center

        // Wait until texture is loaded before setting size
        if (this.kingSprite.texture.baseTexture.valid) {
            // Texture is already loaded
            this.adjustKingSpriteSize();
        } else {
            // Wait for texture to load
            this.kingSprite.texture.baseTexture.on('loaded', () => this.adjustKingSpriteSize());
        }
    }

    adjustKingSpriteSize() {
        // Set the desired width
        const desiredWidth = this.app.screen.width / 3; // Approximately 133 pixels
        // Calculate scale factor
        const scaleFactor = desiredWidth / this.kingSprite.texture.width;
        // Set scale to maintain aspect ratio
        this.kingSprite.scale.set(scaleFactor);

        // Position the king sprite
        this.kingSprite.x = this.app.screen.width / 2;
        this.kingSprite.y = this.kingPlatform.y; // Place on top of the platform

        // Add the king sprite to the stage
        this.app.stage.addChild(this.kingSprite);
    }

    createMonster(y) {
        // Do not spawn monsters if the character has a spring boost
        if (this.springBoost) {
            return;
        }

        const monsterTextureSettings = {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            mipmap: PIXI.MIPMAP_MODES.ON,
            anisotropicLevel: 16,
            quality: 1
        };
        const monsterTexture = PIXI.Texture.from('pictures/monster.png', monsterTextureSettings);

        const monster = new PIXI.Sprite(monsterTexture);
        monster.anchor.set(0.5, 0.5);

        // Set the monster's size to be the same as the character
        monster.width = this.character.width;
        monster.height = this.character.height;

        // Position the monster at a random x position at the specified y
        monster.x = monster.width / 2 + Math.random() * (this.app.screen.width - monster.width);
        monster.y = y;

        // Set movement properties
        monster.vx = 1 + Math.random(); // Speed between 1 and 2 pixels per frame
        monster.direction = Math.random() < 0.5 ? -1 : 1; // Random initial direction

        this.app.stage.addChild(monster);
        this.monsters.push(monster);
    }

    initializeKeyboardInput() {
        this.keys = {};

        this.onKeyDown = (e) => {
            this.keys[e.code] = true;
            if (!this.gameStarted && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
                this.gameStarted = true; // Start the game physics
                this.startText.visible = false;
                this.startTextLine2.visible = false;
                this.velocityY = this.jumpStrength;  // Initial jump when game starts
            }
        };

        this.onKeyUp = (e) => {
            this.keys[e.code] = false;
        };

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    initializeScoreDisplay() {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 'grey',
            fontWeight: 'bold',
        });
        this.scoreText = new PIXI.Text('Score: 0', style);
        this.scoreText.anchor.set(0.5, 0);
        this.scoreText.x = this.app.screen.width / 2;
        this.scoreText.y = 10;
        this.app.stage.addChild(this.scoreText);
    }

    initializeStartText() {
        const startStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 'grey',
            fontWeight: 'bold',
        });
        this.startText = new PIXI.Text('CLICK AN ARROW', startStyle);
        this.startText.anchor.set(0.5);
        this.startText.x = this.app.screen.width / 2;
        this.startText.y = this.app.screen.height / 2 - 20;
        this.app.stage.addChild(this.startText);

        this.startTextLine2 = new PIXI.Text('TO BEGIN!', startStyle);
        this.startTextLine2.anchor.set(0.5);
        this.startTextLine2.x = this.app.screen.width / 2;
        this.startTextLine2.y = this.app.screen.height / 2 + 20;
        this.app.stage.addChild(this.startTextLine2);
    }

    gameLoop() {
        // Handle text flashing when game hasn't started
        if (!this.gameStarted) {
            this.textFlashTimer = (this.textFlashTimer + 1) % (this.TEXT_VISIBLE_DURATION + this.TEXT_HIDDEN_DURATION);
            const isVisible = this.textFlashTimer < this.TEXT_VISIBLE_DURATION;
            this.startText.visible = isVisible;
            this.startTextLine2.visible = isVisible;
            return;  // Don't update game state until game starts
        }

        // Apply gravity
        this.velocityY += this.gravity;
        this.character.y += this.velocityY;

        // Move left and right with sprite changes
        if (this.keys['ArrowLeft']) {
            this.character.x -= 5;
            this.character.texture = this.characterTextures.left;
            this.character.lastDirection = 'left';
        } else if (this.keys['ArrowRight']) {
            this.character.x += 5;
            this.character.texture = this.characterTextures.right;
            this.character.lastDirection = 'right';
        } else {
            this.character.texture = this.characterTextures[this.character.lastDirection];
        }

        // Wrap around the screen horizontally
        if (this.character.x > this.app.screen.width + this.character.width / 2) {
            this.character.x = -this.character.width / 2;
        } else if (this.character.x < -this.character.width / 2) {
            this.character.x = this.app.screen.width + this.character.width / 2;
        }

        // Calculate characterFeetY
        const characterFeetY = this.character.y + this.character.height / 3; // Adjusted feet position

        // Collision Detection with Springs
        let onPlatform = false;

        for (let i = this.springs.length - 1; i >= 0; i--) {
            let spring = this.springs[i];
            if (
                this.character.x + this.character.width / 3 > spring.x - spring.width / 2 &&
                this.character.x - this.character.width / 3 < spring.x + spring.width / 2 &&
                characterFeetY > spring.y - spring.height &&
                characterFeetY - this.velocityY <= spring.y - spring.height &&
                this.velocityY > 0
            ) {
                this.velocityY = -28; // Spring jump strength adjusted to -28
                this.springBoost = true; // Activate spring boost
                onPlatform = true;
                break;
            }
        }

        // Collision Detection with One-Way Platforms
        if (!onPlatform) {
            for (let i = this.platforms.length - 1; i >= 0; i--) {
                let platform = this.platforms[i];
                if (
                    this.character.x + this.character.width / 3 > platform.x &&
                    this.character.x - this.character.width / 3 < platform.x + platform.width &&
                    characterFeetY > platform.y &&
                    characterFeetY - this.velocityY <= platform.y &&
                    this.velocityY > 0
                ) {
                    if (platform.isBroken) {
                        if (!platform.isBrokenActivated) {
                            // First time landing on it
                            this.velocityY = this.jumpStrength;
                            onPlatform = true;

                            platform.isBrokenActivated = true; // Mark as activated

                            // Start the falling animation
                            this.initiateBrokenPlatformFall(platform, i);
                        }
                    } else {
                        // Normal platform behavior
                        this.velocityY = this.jumpStrength;
                        onPlatform = true;
                    }

                    // Reset springBoost when landing on a platform
                    if (this.springBoost) {
                        this.springBoost = false;
                    }

                    break;
                }
            }
        } else {
            // Reset springBoost if the character is on a platform after spring jump
            if (this.springBoost) {
                this.springBoost = false;
            }
        }

        // Update broken platforms that are falling
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            let platform = this.platforms[i];
            if (platform.isBroken && platform.falling) {
                platform.y += 10; // Adjust the speed of falling as desired

                if (platform.y > this.app.screen.height) {
                    // Remove the platform once it's off-screen
                    this.app.stage.removeChild(platform);
                    this.platforms.splice(i, 1);
                }
            }
        }

        // Move and update monsters
        if (!this.springBoost) {
            for (let i = this.monsters.length - 1; i >= 0; i--) {
                let monster = this.monsters[i];
                // Move monster
                monster.x += monster.vx * monster.direction;

                // Reverse direction if monster hits the edge of the screen
                if (monster.x <= monster.width / 2) {
                    monster.x = monster.width / 2;
                    monster.direction *= -1;
                } else if (monster.x >= this.app.screen.width - monster.width / 2) {
                    monster.x = this.app.screen.width - monster.width / 2;
                    monster.direction *= -1;
                }

                // Move monster down with the platforms when the screen scrolls
                if (this.character.y < this.app.screen.height / 2) {
                    monster.y += this.app.screen.height / 2 - this.character.y;
                }

                // Remove monster if it goes off-screen at the bottom
                if (monster.y > this.app.screen.height) {
                    this.app.stage.removeChild(monster);
                    this.monsters.splice(i, 1);
                    continue; // Skip collision detection if monster is removed
                }

                // Collision detection between character and monster
                let monsterBounds = monster.getBounds();
                let characterBounds = this.character.getBounds();

                if (monsterBounds.x + monsterBounds.width > characterBounds.x &&
                    monsterBounds.x < characterBounds.x + characterBounds.width &&
                    monsterBounds.y + monsterBounds.height > characterBounds.y &&
                    monsterBounds.y < characterBounds.y + characterBounds.height) {
                    // Collision detected
                    this.showGameOverModal();
                    return; // Exit the game loop
                }
            }
        }

        // Collision with king
        if (this.kingSprite && !this.kingCollected) {
            let kingBounds = this.kingSprite.getBounds();
            let characterBounds = this.character.getBounds();

            if (characterBounds.x + characterBounds.width > kingBounds.x &&
                characterBounds.x < kingBounds.x + kingBounds.width &&
                characterBounds.y + characterBounds.height > kingBounds.y &&
                characterBounds.y < kingBounds.y + kingBounds.height) {
                // Collision detected
                this.kingCollected = true;
                this.showVictoryModal();
                return; // Exit the game loop
            }
        }

        // Scroll the map when the character reaches the middle
        if (this.character.y < this.app.screen.height / 2) {
            const offset = this.app.screen.height / 2 - this.character.y;
            this.character.y = this.app.screen.height / 2;

            // Move platforms down
            for (let i = this.platforms.length - 1; i >= 0; i--) { // Iterate backwards to safely remove
                let platform = this.platforms[i];
                platform.y += offset;

                if (platform.y > this.app.screen.height) {
                    this.app.stage.removeChild(platform);
                    this.platforms.splice(i, 1);

                    // If the platform is the kingPlatform, remove the kingSprite as well
                    if (platform === this.kingPlatform) {
                        if (this.kingSprite) {
                            this.app.stage.removeChild(this.kingSprite);
                            this.kingSprite = null;
                        }
                        this.kingPlatform = null;
                    }
                }
            }

            // Move springs down
            for (let i = this.springs.length - 1; i >= 0; i--) {
                let spring = this.springs[i];
                spring.y += offset;

                if (spring.y > this.app.screen.height) {
                    this.app.stage.removeChild(spring);
                    this.springs.splice(i, 1);
                }
            }

            // Move king sprite down if it exists
            if (this.kingSprite) {
                this.kingSprite.y += offset;
            }

            // Move clouds down at a faster rate
            for (let cloud of this.clouds) {
                cloud.y += offset * 0.15; // Adjusted movement speed
                // If cloud goes off the bottom, reset it to the top
                if (cloud.y > this.app.screen.height + cloud.height) {
                    cloud.y = -cloud.height;
                    cloud.x = Math.random() * this.app.screen.width;
                }
            }

            // Update score
            this.score += offset;
            this.scoreText.text = 'Score: ' + Math.floor(this.score);

            // Check if score >= levelLength and king not spawned yet
            if (this.score >= this.levelLength && !this.kingSpawned) {
                this.createKingPlatform();
                this.kingSpawned = true;
            }

            // Generate monsters
            if (!this.kingSpawned && this.score >= 1000 && this.score >= this.nextMonsterSpawnScore && !this.springBoost) {
                // Generate a monster above the highest platform
                let highestPlatformY = this.platforms.length > 0 ? Math.min(...this.platforms.map(p => p.y)) : 0;
                this.createMonster(highestPlatformY - 200); // Place monster above the highest platform

                // Set next monster spawn score
                this.nextMonsterSpawnScore = this.score + 500 + Math.random() * 500; // Next spawn between 500 and 1000 score units later
            }

            // Generate new platforms only if king not spawned
            if (!this.kingSpawned) {
                // Generate new platforms
                let highestPlatformY = this.platforms.length > 0 ? Math.min(...this.platforms.map(p => p.y)) : this.app.screen.height - 100;

                while (highestPlatformY > -100) { // Generate platforms above the visible screen
                    let gap = 70 + Math.random() * 50; // Random gap between 70 and 120 pixels
                    let y = highestPlatformY - gap;
                    this.createPlatform(y);
                    highestPlatformY = y;
                }
            }
        }

        // Game Over Condition
        if (this.character.y - this.character.height / 2 > this.app.screen.height) {
            this.showGameOverModal();
        }
    }

    initiateBrokenPlatformFall(platform, index) {
        // Start the falling animation
        platform.falling = true;

        // Remove any springs on this platform
        for (let i = this.springs.length - 1; i >= 0; i--) {
            if (this.springs[i].platform === platform) {
                this.app.stage.removeChild(this.springs[i]);
                this.springs.splice(i, 1);
            }
        }
    }

    showVictoryModal() {
        this.isWon = true;
        this.showModal('Congratulations! You Conquered This Country! Return to Map:');
    }

    showGameOverModal() {
        this.isWon = false;
        this.showModal('Game Over! Click to Return to Map:');
    }

    showModal(message) {
        // Create a container for the modal
        this.modalContainer = new PIXI.Container();

        // Create a semi-transparent background
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.5); // Black with 50% opacity
        background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        background.endFill();
        this.modalContainer.addChild(background);

        // Create the modal box
        const modalBox = new PIXI.Graphics();
        modalBox.beginFill(0xFFFFFF); // White background
        modalBox.lineStyle(2, 0x000000); // Black border
        modalBox.drawRoundedRect(0, 0, this.app.screen.width - 100, 200, 15);
        modalBox.endFill();
        modalBox.x = 50; // Centered horizontally
        modalBox.y = (this.app.screen.height - 200) / 2; // Centered vertically
        this.modalContainer.addChild(modalBox);

        // Create the text
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: '#000000',
            wordWrap: true,
            wordWrapWidth: this.app.screen.width - 120,
            align: 'center'
        });
        this.modalText = new PIXI.Text(message, textStyle);
        this.modalText.anchor.set(0.5);
        this.modalText.x = this.app.screen.width / 2;
        this.modalText.y = modalBox.y + 60;
        this.modalContainer.addChild(this.modalText);

        // Create the button
        this.modalButton = new PIXI.Graphics();
        this.modalButton.beginFill(0x00AAFF); // Blue color
        this.modalButton.drawRoundedRect(0, 0, 150, 50, 10);
        this.modalButton.endFill();
        this.modalButton.x = (this.app.screen.width - 150) / 2;
        this.modalButton.y = modalBox.y + 120;
        this.modalButton.interactive = true;
        this.modalButton.buttonMode = true;
        this.modalButton.on('pointerdown', () => this.onModalButtonClick());
        this.modalContainer.addChild(this.modalButton);

        // Button text
        const buttonText = new PIXI.Text('Return to Map', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: '#FFFFFF'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = this.modalButton.x + 75; // Half of button width
        buttonText.y = this.modalButton.y + 25; // Half of button height
        this.modalContainer.addChild(buttonText);

        this.app.stage.addChild(this.modalContainer);

        // Pause the game loop
        this.app.ticker.stop();
    }

    onModalButtonClick() {
        // Remove event listeners
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);

        // Remove the modal from the stage
        this.app.stage.removeChild(this.modalContainer);
        this.modalContainer = null;

        // Destroy the game application and free resources
        this.app.destroy(true, { children: true, texture: true, baseTexture: true });
        this.app = null; // Reset the app variable
        this.gameManager.gameContainer.innerHTML = '';
        // Hide the game container
        this.gameManager.gameContainer.style.display = 'none';
        // Show the game map
        this.gameManager.gameMap.style.display = 'block';
        this.gameStarted = false; // Reset the gameStarted variable

        // Notify GameManager of the game's end
        this.gameManager.onGameEnd(this.isWon, this.selectedCountry);
    }
}
