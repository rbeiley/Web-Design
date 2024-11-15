
---

## 1. **GameController**
- **Purpose**: Central game management, overseeing game flow, including navigation between the world map, minigames, and animations.
- **Key Methods**:
  - `startGame()`: Initializes the game, sets up the globe, and prompts the player to select a native country.
  - `selectCountry(country)`: Handles player selection of a country as a native or to conquer.
  - `startMinigame(targetCountry)`: Transitions to the minigame for the selected country.
  - `completeConquest()`: Called upon minigame victory to handle post-victory animations and update conquered countries.
  - `endGame()`: Checks for global conquest and ends the game if all countries are conquered.

---

## 2. **Globe**
- **Purpose**: Represents the 3D model of the Earth and manages the rotation and display of countries.
- **Key Methods**:
  - `rotate(direction)`: Rotates the globe in a specified direction (left or right).
  - `highlightCountry(country)`: Highlights a country when hovered or selected.
  - `updateCountryColor(country, color)`: Changes the color of a country based on its status (e.g., native, conquered, conquerable).
  - `getNeighboringCountries(country)`: Identifies and returns a list of adjacent, conquerable countries.

---

## 3. **Country**
- **Purpose**: Represents an individual country, storing its attributes and conquest status.
- **Attributes**:
  - `name`: Country name.
  - `flag`: Visual representation of the country’s flag.
  - `status`: Current status (`gray`, `green`, `red`).
  - `neighbors`: List of adjacent, conquerable countries.
- **Key Methods**:
  - `setConquerable()`: Updates the status to red, indicating it can be conquered.
  - `setConquered()`: Updates the status to green, indicating it is under player control.
  - `resetStatus()`: Resets the country to its initial state if needed.

---

## 4. **Minigame**
- **Purpose**: Controls the platforming minigame where the player attempts to reach the king of a country.
- **Key Methods**:
  - `startMinigame()`: Initializes the minigame environment with platforms and player character.
  - `updatePosition(player)`: Updates the player’s position based on controls.
  - `generatePlatform()`: Generates platforms dynamically as the player moves up.
  - `checkVictory()`: Checks if the player has reached the top and conquered the king.
  - `resetMinigame()`: Resets the minigame if the player falls, allowing them to retry.

---

## 5. **Player**
- **Purpose**: Represents the player’s character in the minigame.
- **Attributes**:
  - `position`: Current position on the minigame screen.
  - `velocity`: Current velocity (used for bounce mechanics).
  - `status`: Indicates the player’s progress in the minigame (e.g., bouncing, falling).
- **Key Methods**:
  - `move(direction)`: Moves the player left or right.
  - `bounce()`: Makes the player jump up when hitting a platform.
  - `fall()`: Activates when the player misses a platform, returning them to the world map.
  - `resetPosition()`: Resets the player to the starting position in the minigame.

---

## 6. **King**
- **Purpose**: Represents the “king” or final target in each minigame level.
- **Attributes**:
  - `country`: Country associated with the king.
  - `position`: Final position at the top of the minigame level.
- **Key Methods**:
  - `confrontPlayer()`: Executes the final confrontation with the player upon reaching the king.
  - `defeat()`: Initiates the post-victory animations and removes the king from the minigame.

---

## 7. **UIManager**
- **Purpose**: Manages all user interface components, prompts, and notifications.
- **Key Methods**:
  - `showCountrySelectionPrompt(country)`: Displays prompt asking if the player wants to select a country.
  - `showVictoryAnimation(country)`: Displays victory animations and messages after a successful conquest.
  - `showDefeatMessage()`: Shows a message when the player fails in the minigame.
  - `updateMinigameInstructions()`: Displays and updates instructions for the minigame.

---

## 8. **AnimationManager**
- **Purpose**: Handles animations, including confetti, plane animations, and king defeat scenes.
- **Key Methods**:
  - `playConfetti()`: Plays confetti animation upon victory.
  - `animatePlane()`: Executes the plane animation returning the defeated king.
  - `displayKingDefeatNarrative()`: Displays a humorous message upon the king’s defeat.

---

## 9. **SoundManager**
- **Purpose**: Manages all sound effects and background music throughout the game.
- **Key Methods**:
  - `playBackgroundMusic()`: Loops background music on the world map.
  - `playBounceSound()`: Plays a sound when the player lands on a platform.
  - `playVictorySound()`: Plays victory sound upon minigame completion.
  - `playDefeatSound()`: Plays sound when the player falls or fails the minigame.

---

## 10. **GameState**
- **Purpose**: Tracks and manages game state, including conquered countries, available territories, and overall progress.
- **Key Methods**:
  - `saveProgress()`: Saves the player’s progress, including conquered countries and minigame checkpoints.
  - `loadProgress()`: Loads saved game progress.
  - `checkGameCompletion()`: Checks if all countries have been conquered.
  - `updateAccessibleCountries()`: Updates red countries based on current conquered territories.

---

## 10. **Figma**
https://www.figma.com/board/zb1ApgVhdYZpavmOBbKkDJ/world-conquer?node-id=0-1&t=XIElfRkrlmhXfgkv-1

---