// Initialize Firebase Firestore
let db = firebase.firestore();

// Variables
let app;
let gameStarted = false; // Keep track of whether the game physics should update
let levels = {}; // Store level data
let selectedLevel = null; // Keep track of the selected level
const characterWidth = 55; // Define character width for use throughout the game

let currentUser = null; // Keep track of the current user
let users = {}; // Store user data

// DOM elements
const mainMenu = document.getElementById('main-menu');
const gameMap = document.getElementById('game-map');
const gameContainer = document.getElementById('game-container');
const usernameSelect = document.getElementById('username-select');
const newUsernameInput = document.getElementById('new-username-input');
const confirmButton = document.getElementById('confirm-button');
const countriesConqueredText = document.getElementById('countries-conquered-text');
const countryLabelsContainer = document.getElementById('country-labels');

// Function to populate the username dropdown
function populateUsernames() {
    usernameSelect.innerHTML = ''; // Clear any existing options

    // Add the "New User" option
    const newUserOption = document.createElement('option');
    newUserOption.value = 'new_user';
    newUserOption.textContent = 'New User';
    usernameSelect.appendChild(newUserOption);

    // Set "New User" as the selected option
    usernameSelect.value = 'new_user';
    // Show the new username input box
    newUsernameInput.style.display = 'inline-block';

    // Fetch the 'Users' collection from Firestore
    db.collection('Users').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const username = doc.id; // Use document ID as username
            const option = document.createElement('option');
            option.value = username;
            option.textContent = username;
            usernameSelect.appendChild(option);
            // Store user data for later use
            users[username] = doc.data();
        });
    }).catch((error) => {
        console.error("Error fetching users: ", error);
    });
}

// Call the function to populate the username dropdown
populateUsernames();

// Event listeners for username selection
usernameSelect.addEventListener('change', function() {
    const selectedValue = usernameSelect.value;
    if (selectedValue === 'new_user') {
        // Show input for new username
        newUsernameInput.style.display = 'inline-block';
    } else {
        // Hide new username input
        newUsernameInput.style.display = 'none';
    }
});

confirmButton.addEventListener('click', function() {
    const selectedValue = usernameSelect.value;
    if (selectedValue === 'new_user') {
        const newUsername = newUsernameInput.value.trim();
        if (newUsername) {
            // Check if username already exists
            if (users[newUsername]) {
                alert('Username already exists. Please choose a different username.');
            } else {
                // Create new user in Firebase
                db.collection('Users').doc(newUsername).set({
                    conqueredCountries: []
                }).then(() => {
                    // Add new user to the users object
                    users[newUsername] = { conqueredCountries: [] };
                    // Set current user
                    currentUser = newUsername;
                    // Proceed to game map screen
                    proceedToGameMap();
                }).catch((error) => {
                    console.error("Error creating user: ", error);
                });
            }
        } else {
            alert('Please enter a username.');
        }
    } else {
        // Existing user selected
        currentUser = selectedValue;
        // Load user data
        loadUserData(currentUser).then(() => {
            // Proceed to game map screen
            proceedToGameMap();
        }).catch((error) => {
            console.error("Error loading user data: ", error);
        });
    }
});

// Function to load user data
function loadUserData(username) {
    return db.collection('Users').doc(username).get().then((doc) => {
        if (doc.exists) {
            users[username] = doc.data();
        } else {
            console.error('User data not found for username:', username);
            users[username] = { conqueredCountries: [] };
        }
    }).catch((error) => {
        console.error("Error loading user data: ", error);
    });
}

// Function to proceed to the game map screen
function proceedToGameMap() {
    // Hide the main menu
    mainMenu.style.display = 'none';
    // Show the game map
    gameMap.style.display = 'block';
    // Update the Countries Conquered text
    updateCountriesConqueredText();
    // Update the country labels
    updateCountryLabels();
}

// Function to update the Countries Conquered text
function updateCountriesConqueredText() {
    if (currentUser && users[currentUser]) {
        const conqueredCountries = users[currentUser].conqueredCountries || [];
        countriesConqueredText.textContent = 'Countries Conquered: ' + conqueredCountries.length;
    } else {
        countriesConqueredText.textContent = 'Countries Conquered: 0';
    }
}

// Store labels for each level
let levelLabels = {};

// Function to update country labels
function updateCountryLabels() {
    const conqueredCountries = users[currentUser].conqueredCountries || [];

    for (let countryName in levelLabels) {
        const label = levelLabels[countryName];
        if (conqueredCountries.includes(countryName)) {
            // Mark the country as conquered
            label.style.color = '#CCCCCC'; // Grey color
            label.style.textDecoration = 'line-through';
            label.onclick = function(event) {
                event.preventDefault();
                alert('You have already conquered this country.');
            };
        } else {
            // Ensure the country is clickable
            label.style.color = '#2E8B57'; // Original color
            label.style.textDecoration = 'none';
            label.onclick = function(event) {
                event.preventDefault();
                if (!app && currentUser) {
                    selectedLevel = levels[countryName];
                    selectedLevel.countryName = countryName; // Store the country name in selectedLevel
                    initGame();
                }
            };
        }
    }
}

// Function to populate the country labels
function populateCountryLabels() {
    // Fetch the 'Levels' collection from Firestore
    db.collection('Levels').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const levelData = doc.data();
            const countryName = levelData.Country;
            const levelLength = levelData['Level Length'];
            const kingImage = levelData['King Image'];
            const x = levelData.x;
            const y = levelData.y;

            // Check if x and y positions are present
            if (x === undefined || y === undefined) {
                console.warn(`x and y positions not defined for ${countryName}`);
                return;
            }

            // Store level data for later use
            levels[countryName] = {
                levelLength: levelLength,
                kingImage: kingImage
            };

            // Create a label for the country
            const label = document.createElement('div');
            label.classList.add('country-label');
            label.textContent = countryName;

            // Position the label
            label.style.left = x + '%';
            label.style.top = y + '%';

            // Store the label for later updates
            levelLabels[countryName] = label;

            countryLabelsContainer.appendChild(label);
        });
    }).catch((error) => {
        console.error("Error fetching levels: ", error);
    });
}

// Call the function to populate the country labels
populateCountryLabels();

// Function to initialize the game
function initGame() {
    // Hide the game map
    gameMap.style.display = 'none';
    // Show the game container
    gameContainer.style.display = 'flex';

    // Variables for Movement and Physics
    let velocityY = 0;
    const gravity = 0.5;
    const jumpStrength = -13.5;
    let springBoost = false; // Track if the character has a spring boost

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

    // Springs Array
    let springs = [];

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

    // 1. Create the PixiJS Application inside the game container
    app = new PIXI.Application({
        width: 400,
        height: 600,
        backgroundColor: 0xADD8E6, // Light blue color for the background
        antialias: true,
    });
    gameContainer.appendChild(app.view);

    // Create background container for clouds
    const backgroundContainer = new PIXI.Container();
    app.stage.addChild(backgroundContainer);

    // Clouds array
    let clouds = [];

    // Function to create clouds
    function createClouds() {
        // Number of clouds to create
        const numClouds = 2; // Adjusted to have 1-2 clouds on screen
        for (let i = 0; i < numClouds; i++) {
            // Load cloud texture
            const cloudTexture = PIXI.Texture.from('cloud.png'); // Ensure 'cloud.png' exists in your directory
            const cloud = new PIXI.Sprite(cloudTexture);
            cloud.anchor.set(0.5);

            // Adjust cloud size
            cloud.width = 2.5 * characterWidth; // characterWidth is 55, so cloud.width is about 137.5 pixels
            cloud.height = (cloud.texture.height * (cloud.width / cloud.texture.width)) / 2;

            // Random position
            cloud.x = Math.random() * app.screen.width;
            cloud.y = Math.random() * app.screen.height;

            backgroundContainer.addChild(cloud);
            clouds.push(cloud);
        }
    }

    // Call the function to create clouds after character is initialized
    createClouds();

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

    // Load spring texture
    const springTexture = PIXI.Texture.from('spring.png', textureSettings);

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

        // Add spring to some platforms
        if (score >= 500 && Math.random() < 0.05) { // Approximately 1 in 20 platforms
            createSpring(platform);
        }
    }

    // Function to create a spring on a platform
    function createSpring(platform) {
        const spring = new PIXI.Sprite(springTexture);
        spring.anchor.set(0.5, 1); // Anchor at bottom center
        spring.width = platform.width / 3; // Cover middle third of the platform
        spring.height = spring.texture.height * (spring.width / spring.texture.width);

        spring.x = platform.x + platform.width / 2;
        spring.y = platform.y;

        // Add reference to the platform
        spring.platform = platform;

        app.stage.addChild(spring);
        springs.push(spring);
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
        kingSprite = PIXI.Sprite.from(kingImageName, kingTextureSettings);
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
        // Do not spawn monsters if the character has a spring boost
        if (springBoost) {
            return;
        }

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
        const buttonText = new PIXI.Text('Return to Map', {
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

        // Return to the game map instead of the main menu
        returnToGameMap();
    }

    // Function to show the victory modal dialog
    function showVictoryModal() {
        // Update user's conquered countries
        if (currentUser && selectedLevel.countryName) {
            const conqueredCountries = users[currentUser].conqueredCountries || [];
            if (!conqueredCountries.includes(selectedLevel.countryName)) {
                conqueredCountries.push(selectedLevel.countryName);
                // Update Firebase
                db.collection('Users').doc(currentUser).update({
                    conqueredCountries: conqueredCountries
                }).then(() => {
                    // Update local data
                    users[currentUser].conqueredCountries = conqueredCountries;
                    // Update the countries conquered text
                    updateCountriesConqueredText();
                    // Update country labels
                    updateCountryLabels();
                }).catch((error) => {
                    console.error("Error updating user's conquered countries: ", error);
                });
            }
        }

        showModal('Congratulations! You Conquered This Country! Return to Map:');
    }

    // Function to show the game over modal dialog
    function showGameOverModal() {
        showModal('Game Over! Click to Return to Map:');
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

        // Calculate characterFeetY
        const characterFeetY = character.y + character.height / 3; // Adjusted feet position

        // Collision Detection with Springs
        let onPlatform = false;

        for (let i = springs.length - 1; i >= 0; i--) {
            let spring = springs[i];
            if (
                character.x + character.width / 3 > spring.x - spring.width / 2 &&
                character.x - character.width / 3 < spring.x + spring.width / 2 &&
                characterFeetY > spring.y - spring.height &&
                characterFeetY - velocityY <= spring.y - spring.height &&
                velocityY > 0
            ) {
                velocityY = -25; // Spring jump strength adjusted to -25
                springBoost = true; // Activate spring boost
                onPlatform = true;
                break;
            }
        }

        // Collision Detection with One-Way Platforms
        if (!onPlatform) {
            for (let platform of platforms) {
                if (
                    character.x + character.width / 3 > platform.x &&
                    character.x - character.width / 3 < platform.x + platform.width &&
                    characterFeetY > platform.y &&
                    characterFeetY - velocityY <= platform.y &&
                    velocityY > 0
                ) {
                    velocityY = jumpStrength;
                    onPlatform = true;

                    // Reset springBoost when landing on a platform
                    if (springBoost) {
                        springBoost = false;
                    }

                    break;
                }
            }
        } else {
            // Reset springBoost if the character is on a platform after spring jump
            if (springBoost) {
                springBoost = false;
            }
        }

        // Move and update monsters
        if (!springBoost) {
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

            // Move springs down
            for (let i = springs.length - 1; i >= 0; i--) {
                let spring = springs[i];
                spring.y += offset;

                if (spring.y > app.screen.height) {
                    app.stage.removeChild(spring);
                    springs.splice(i, 1);
                }
            }

            // Move king sprite down if it exists
            if (kingSprite) {
                kingSprite.y += offset;
            }

            // Move clouds down at a faster rate
            for (let cloud of clouds) {
                cloud.y += offset * 0.15; // Adjusted movement speed
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
            if (!kingSpawned && score >= 1000 && score >= nextMonsterSpawnScore && !springBoost) {
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

    // Function to return to the game map
    function returnToGameMap() {
        // Remove event listeners
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);

        // Destroy the game application and free resources
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        app = null; // Reset the app variable
        gameContainer.innerHTML = '';
        // Hide the game container
        gameContainer.style.display = 'none';
        // Show the game map
        gameMap.style.display = 'block';
        gameStarted = false; // Reset the gameStarted variable
        selectedLevel = null; // Reset the selected level
    }
}
