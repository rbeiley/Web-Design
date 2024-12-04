// Country.js

class Country {
    constructor(data, gameManager) {
        this.gameManager = gameManager;
        this.name = data.Country;
        this.levelLength = data['Level Length'];
        this.kingImage = data['King Image'];
        this.x = data.x;
        this.y = data.y;
        this.isConquered = false; // Will be updated based on player data
        this.isConquerable = true; // Logic for conquerability can be added
        this.label = null; // DOM element for the country label
    }

    createLabel(container) {
        // Create a label for the country
        this.label = document.createElement('div');
        this.label.classList.add('country-label');
        this.label.textContent = this.name;

        // Position the label
        this.label.style.left = this.x + '%';
        this.label.style.top = this.y + '%';

        // Set up the click event
        this.label.onclick = (event) => {
            event.preventDefault();
            if (this.isConquered) {
                alert('You have already conquered this country.');
            } else if (this.isConquerable) {
                this.gameManager.selectCountry(this);
            } else {
                alert('This country is not conquerable yet.');
            }
        };

        container.appendChild(this.label);
        this.updateLabel();
    }

    updateLabel() {
        if (this.label) {
            if (this.isConquered) {
                // Mark the country as conquered
                this.label.style.color = '#CCCCCC'; // Grey color
                this.label.style.textDecoration = 'line-through';
                this.label.onclick = (event) => {
                    event.preventDefault();
                    alert('You have already conquered this country.');
                };
            } else {
                // Ensure the country is clickable
                this.label.style.color = '#2E8B57'; // Original color
                this.label.style.textDecoration = 'none';
                this.label.onclick = (event) => {
                    event.preventDefault();
                    if (!this.gameManager.game && this.gameManager.currentUser) {
                        this.gameManager.selectCountry(this);
                    }
                };
            }
        }
    }

    conquer() {
        this.isConquered = true;
        this.updateLabel();
    }

    // Additional setters and getters can be added as needed
}
