##game engine
I think the most difficult thing about this game is the 3d interactive globe menu. the engine that I found best fits this application is three.js. it has short tutorials on how to get started and is well suited for 3d rendering, quoting their site: "Three.js is a 3D library that tries to make it as easy as possible to get 3D content on a webpage."
it works with listeners and keyboard inputs.

three.js resources for generating/rendering an interactive 3d globe map with clickable countries that displays information:
three.js basic tutorial: https://www.youtube.com/watch?v=XPhAR1YdD6o
three.js earth projection: https://www.youtube.com/watch?v=FntV9iEJ0tU
github interactable map: https://github.com/Melonman0/InteractiveMap?tab=readme-ov-file (click live demo to see how it works)

Classes:

1. GameManager

The GameManager class oversees each game, managing flow, turns, map generation, menus, and checking for progress/win conditions. It manages all other classes, controlling interactions and transitions.

# Variables:

db: Reference to Firebase Firestore database.
users: Object storing user data fetched from Firestore.
currentUser: The username of the current player.
player: Instance of the Player class representing the current player.
countries: Object storing all Country instances, keyed by country name.
game: Instance of the Game class representing the current game session.
DOM Elements:
mainMenu
gameMap
gameContainer
usernameSelect
newUsernameInput
confirmButton
countriesConqueredText
countryLabelsContainer

# Methods:

constructor(): Initializes the GameManager, sets up event listeners, and initializes the map.
initializeMap(): Fetches country data from Firestore and creates Country instances.
renderMap(): Renders country labels on the game map.
populateUsernames(): Fetches user data from Firestore and populates the username selection dropdown.
addEventListeners(): Adds event listeners for user interactions in the main menu.
loadUserData(username): Loads user data for the given username.
proceedToGameMap(): Transitions from the main menu to the game map.
updateCountriesConqueredText(): Updates the display of the number of conquered countries.
updateMap(): Updates the map based on the player's conquered countries.
selectCountry(country): Handles player interactions with the map, triggering the Game class.
onGameEnd(isWon, country): Handles the end of a game, updating the player's data and returning to the map.

2. Player
   The Player class controls the single player, tracking their progress throughout the game. It handles the list of countries owned and manages conquerable countries based on bordering logic.

# Variables:

username: The player's username.
conqueredCountries: Array of country names the player has conquered.
ownedCountries: Array of Country instances the player owns.
conquerableCountries: Array of Country instances that are conquerable (for future expansion).

# Methods:

constructor(username, data): Initializes the player with the given username and data from Firestore.
addCountry(country): Adds a country to the player's conquered countries and updates Firebase.

3. Country
   The Country class represents a conquerable/conquered country, managing ownership and other properties.

# Variables:

gameManager: Reference to the GameManager instance.
name: Name of the country.
levelLength: Numeric value representing the length of the level.
kingImage: Filename of the king's image.
x: X-coordinate for positioning the country label on the map.
y: Y-coordinate for positioning the country label on the map.
isConquered: Boolean indicating if the country has been conquered.
isConquerable: Boolean indicating if the country is conquerable (can be extended with logic).
label: DOM element representing the country's label on the map.

# Methods:

constructor(data, gameManager): Initializes the country with data from Firestore and a reference to the GameManager.
createLabel(container): Creates the country's label on the map and sets up click events.
updateLabel(): Updates the appearance of the label based on the country's status.
conquer(): Sets isConquered to true, updates the label, and handles any additional conquest logic.

4. Game
   The Game class represents the core Doodle Jump-style minigame the player must win to conquer a country.

# Variables:

gameManager: Reference to the GameManager instance.
selectedCountry: The Country instance the player is attempting to conquer.
isWon: Boolean indicating if the player has won the game.
app: The PixiJS Application instance.
gameStarted: Boolean tracking if the game physics should update.
Movement and Physics Variables:

velocityY: Vertical velocity of the character.
gravity: Gravity applied to the character.
jumpStrength: Initial jump strength when the character jumps.
springBoost: Boolean tracking if the character has a spring boost.
Game Elements:

platforms: Array of platform sprites.
monsters: Array of monster sprites.
nextMonsterSpawnScore: Score threshold for spawning the next monster.
kingSpawned: Boolean indicating if the king has been spawned.
kingCollected: Boolean indicating if the king has been collected.
kingPlatform: Reference to the king's platform sprite.
kingSprite: Reference to the king's sprite.
springs: Array of spring sprites.
score: Current score of the player.
textFlashTimer: Timer for flashing text before the game starts.
TEXT_VISIBLE_DURATION: Duration the start text is visible.
TEXT_HIDDEN_DURATION: Duration the start text is hidden.
Level Parameters:

levelLength: Length of the level, determines when the king appears.
kingImageName: Image filename for the king.
Sprites and Textures:

backgroundContainer: Container for background elements like clouds.
clouds: Array of cloud sprites.
characterWidth: Width of the character sprite.
characterTextures: Object containing character textures for left and right directions.
platformTexture: Texture for the platforms.
springTexture: Texture for the springs.
brokenPlatformTexture: Texture for the broken platforms.
character: The main character sprite.
Input Variables:

keys: Object tracking pressed keys.
onKeyDown: Event handler for keydown events.
onKeyUp: Event handler for keyup events.
UI Elements:

scoreText: Text displaying the current score.
startText: Text prompting the player to start the game.
startTextLine2: Second line of the start prompt text.
modalContainer: Container for modals (victory/game over screens).
modalText: Text displayed in modals.
modalButton: Button in modals to return to the map.

# Methods:

constructor(gameManager, selectedCountry): Initializes the game with references to the GameManager and the selected country.
initGame(): Sets up the game environment, initializes variables, and starts the game loop.
createClouds(): Creates cloud sprites for the background.
initializeCharacter(): Initializes the main character sprite and its textures.
createFloor(): Creates the floor platform at the bottom of the screen.
createInitialPlatforms(): Generates the initial set of platforms for the game.
createPlatform(y): Creates a platform at a specified y position, possibly adding springs or making it broken based on probability.
createBrokenPlatform(y, platformWidth): Creates a broken platform that will fall when stepped on.
createSpring(platform): Adds a spring to a given platform.
createKingPlatform(): Creates the king's platform and the king sprite when the player reaches the required score.
adjustKingSpriteSize(): Adjusts the king sprite's size after it's loaded.
createMonster(y): Creates a monster at a specified y position to challenge the player.
initializeKeyboardInput(): Sets up event listeners for keyboard input.
initializeScoreDisplay(): Initializes the score display text on the screen.
initializeStartText(): Displays the start prompt text before the game begins.
gameLoop(): The main game loop, updating character movement, handling collisions, spawning elements, and checking win/lose conditions.
initiateBrokenPlatformFall(platform, index): Initiates the falling animation for a broken platform when the character steps on it.
showVictoryModal(): Displays the victory modal when the player wins.
showGameOverModal(): Displays the game over modal when the player loses.
showModal(message): Displays a modal with a given message.
onModalButtonClick(): Handles the modal button click, cleans up the game, and returns to the map.

for the rest of the classes that deal with the map generation, you can literally completley rip the github interactable map, changing the projection to be 3d on a globe:

country.js
index.html
world_map.json
world_map_web_merc.json

the game manager class would then run the index.html class to render the map
