// Player.js

class Player {
    constructor(username, data) {
        this.username = username;
        this.conqueredCountries = data.conqueredCountries || [];
        this.ownedCountries = []; // Array of Country instances
        this.conquerableCountries = []; // Array of Country instances (can be populated based on game logic)
    }

    addCountry(country) {
        if (!this.conqueredCountries.includes(country.name)) {
            this.conqueredCountries.push(country.name);
            this.ownedCountries.push(country);
            country.conquer();
            // Update Firebase
            db.collection('Users').doc(this.username).update({
                conqueredCountries: this.conqueredCountries
            }).catch((error) => {
                console.error("Error updating user's conquered countries: ", error);
            });
        }
    }

    // Additional methods to manage conquerable countries can be added
}
