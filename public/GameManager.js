// GameManager.js

class GameManager {
    constructor() {
        // Initialize Firebase Firestore
        this.db = firebase.firestore();

        // Variables
        this.users = {};
        this.currentUser = null; // Keep track of the current user
        this.player = null; // The Player instance
        this.countries = {}; // Store Country instances
        this.game = null; // Current game instance

        // DOM elements
        this.mainMenu = document.getElementById('main-menu');
        this.gameMap = document.getElementById('game-map');
        this.gameContainer = document.getElementById('game-container');
        this.usernameSelect = document.getElementById('username-select');
        this.newUsernameInput = document.getElementById('new-username-input');
        this.confirmButton = document.getElementById('confirm-button');
        this.countriesConqueredText = document.getElementById('countries-conquered-text');
        this.countryLabelsContainer = document.getElementById('country-labels');

        // Initialize the game manager
        this.populateUsernames();
        this.addEventListeners();
        this.initializeMap();
    }

    initializeMap() {
        // Fetch the 'Levels' collection from Firestore and create Country instances
        this.db.collection('Levels').get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const country = new Country(data, this);
                this.countries[country.name] = country;
            });
            // Once countries are loaded, create labels
            this.renderMap();
        }).catch((error) => {
            console.error("Error fetching levels: ", error);
        });
    }

    renderMap() {
        // Create labels for each country
        for (let countryName in this.countries) {
            const country = this.countries[countryName];
            country.createLabel(this.countryLabelsContainer);
        }
    }

    populateUsernames() {
        this.usernameSelect.innerHTML = ''; // Clear any existing options

        // Add the "New User" option
        const newUserOption = document.createElement('option');
        newUserOption.value = 'new_user';
        newUserOption.textContent = 'New User';
        this.usernameSelect.appendChild(newUserOption);

        // Set "New User" as the selected option
        this.usernameSelect.value = 'new_user';
        // Show the new username input box
        this.newUsernameInput.style.display = 'inline-block';

        // Fetch the 'Users' collection from Firestore
        this.db.collection('Users').get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const username = doc.id; // Use document ID as username
                const option = document.createElement('option');
                option.value = username;
                option.textContent = username;
                this.usernameSelect.appendChild(option);
                // Store user data for later use
                this.users[username] = doc.data();
            });
        }).catch((error) => {
            console.error("Error fetching users: ", error);
        });
    }

    addEventListeners() {
        // Event listeners for username selection
        this.usernameSelect.addEventListener('change', () => {
            const selectedValue = this.usernameSelect.value;
            if (selectedValue === 'new_user') {
                // Show input for new username
                this.newUsernameInput.style.display = 'inline-block';
            } else {
                // Hide new username input
                this.newUsernameInput.style.display = 'none';
            }
        });

        this.confirmButton.addEventListener('click', () => {
            const selectedValue = this.usernameSelect.value;
            if (selectedValue === 'new_user') {
                const newUsername = this.newUsernameInput.value.trim();
                if (newUsername) {
                    // Check if username already exists
                    if (this.users[newUsername]) {
                        alert('Username already exists. Please choose a different username.');
                    } else {
                        // Create new user in Firebase
                        this.db.collection('Users').doc(newUsername).set({
                            conqueredCountries: []
                        }).then(() => {
                            // Add new user to the users object
                            this.users[newUsername] = { conqueredCountries: [] };
                            // Set current user
                            this.currentUser = newUsername;
                            // Initialize player
                            this.player = new Player(newUsername, this.users[newUsername]);
                            // Proceed to game map screen
                            this.proceedToGameMap();
                        }).catch((error) => {
                            console.error("Error creating user: ", error);
                        });
                    }
                } else {
                    alert('Please enter a username.');
                }
            } else {
                // Existing user selected
                this.currentUser = selectedValue;
                // Load user data
                this.loadUserData(this.currentUser).then(() => {
                    // Initialize player
                    this.player = new Player(this.currentUser, this.users[this.currentUser]);
                    // Proceed to game map screen
                    this.proceedToGameMap();
                }).catch((error) => {
                    console.error("Error loading user data: ", error);
                });
            }
        });
    }

    loadUserData(username) {
        return this.db.collection('Users').doc(username).get().then((doc) => {
            if (doc.exists) {
                this.users[username] = doc.data();
            } else {
                console.error('User data not found for username:', username);
                this.users[username] = { conqueredCountries: [] };
            }
        }).catch((error) => {
            console.error("Error loading user data: ", error);
        });
    }

    proceedToGameMap() {
        if (this.player.conqueredCountries.length === 0) {
            alert('Choose your starting country.');
        }        
        // Hide the main menu
        this.mainMenu.style.display = 'none';
        // Show the game map
        this.gameMap.style.display = 'block';
        // Update the map and conquered countries text
        this.updateMap();
        this.updateCountriesConqueredText();
        this.player.updateConquerableCountries(this.countries);

    }

    updateCountriesConqueredText() {
        if (this.player) {
            const conqueredCountries = this.player.conqueredCountries || [];
            this.countriesConqueredText.textContent = 'Countries Conquered: ' + conqueredCountries.length;
        } else {
            this.countriesConqueredText.textContent = 'Countries Conquered: 0';
        }
    }

    updateMap() {
        // Update the labels of the countries based on the player's conquered countries
        for (let countryName in this.countries) {
            const country = this.countries[countryName];
            if (this.player.conqueredCountries.includes(country.name)) {
                country.isConquered = true;
            } else {
                country.isConquered = false;
            }
            country.updateLabel();
        }
    }

    selectCountry(country) {
        if (!this.player.conqueredCountries.length) {
            // Starting country: Allow any country
            this.player.addCountry(country);
            this.updateMap();
        } else if (this.player.conquerableCountries.includes(country.name)) {
            this.game = new Game(this, country);
        } else {
            alert('You can only conquer neighboring countries.');
        }
    }
    

    onGameEnd(isWon, country) {
        // Handle the end of the game
        if (isWon) {
            this.player.addCountry(country);
        }
        // Destroy the game instance
        this.game = null;
        // Return to the game map
        this.gameContainer.style.display = 'none';
        this.gameMap.style.display = 'block';
        // Update the map
        this.updateMap();
        this.player.updateConquerableCountries(this.countries);
        this.updateCountriesConqueredText();
    }
}
