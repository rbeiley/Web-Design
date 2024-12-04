##game engine
I think the most difficult thing about this game is the 3d interactive globe menu. the engine that I found best fits this application is three.js. it has short tutorials on how to get started and is well suited for 3d rendering, quoting their site: "Three.js is a 3D library that tries to make it as easy as possible to get 3D content on a webpage."
it works with listeners and keyboard inputs.

three.js resources for generating/rendering an interactive 3d globe map with clickable countries that displays information:
three.js basic tutorial: https://www.youtube.com/watch?v=XPhAR1YdD6o
three.js earth projection: https://www.youtube.com/watch?v=FntV9iEJ0tU
github interactable map: https://github.com/Melonman0/InteractiveMap?tab=readme-ov-file (click live demo to see how it works)

classes:
Game class:
the core doodle-jump style minigame the player must win to conquer a country.

    Variables:
    isWon -boolean

    Methods:
    StartGame()
    CheckWinCondition()
    EndGame()

Country class:
should represent a conquerable/conquered country, controlling/managing things such as onwership and countries bordering it to check for ability to be conquered.

    Variables:
    Name - String
    LeaderName - String
    isConquered - Boolean
    borderingCountries - array of countries that border it
    isConquerable - boolean

    Methods:
    setters and getters
    conquer() - set isconquered to true and adds it to player conquered countries, updates appropraite data

Player class:
should control the single player, tracking their progress throughout the game. it should handle things like a list of the countries owned and using those countries, take a list of the countries they border, minus the countries they already own, to find the conquerable countries. this should set the conquerability of those countries allowing the player to do that.

    variables:
    ownedCountries - array of Country(s)
    conquerableCountries - array of Country(s)

    Methods
    addCountry(country)

Game manager class:
oversees each game, managing flow, turns, map generation, menus, and checking for progress/win conditions. should manage all other classes, controlling the interactions, transitions, etc.

    variables
    map - three.js scene
    player
    countries - list of all countries

    methods
    initializeMap() - initializes all countries and loads json files
    renderMap() - nitializes and renders the 3D map using Three.js and displays conquerable countries visually
    selectCountry(country) - handles player interactions with the map, triggering game class
    checkWin()
    updateMap()

for the rest of the classes that deal with the map generation, you can literally completley rip the github interactable map, changing the projection to be 3d on a globe:

country.js
index.html
world_map.json
world_map_web_merc.json

the game manager class would then run the index.html class to render the map
