export class HealthSystem {
    constructor(maxHealth = 10) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;

        // Create HUD container if it doesn't exist
        this.hud = document.getElementById('hud');
        if (!this.hud) {
            this.hud = document.createElement('div');
            this.hud.id = 'hud';
            this.hud.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                display: flex;
                gap: 4px;
                z-index: 10001;
            `;
            document.body.appendChild(this.hud);
        }

        this.healthContainer = document.createElement('div');
        this.healthContainer.id = 'health-container';
        this.healthContainer.style.display = 'flex';
        this.hud.appendChild(this.healthContainer);

        this.heartElements = [];
        this.initHearts();
        this.render();
    }

    initHearts() {
        for (let i = 0; i < this.maxHealth; i++) {
            const heart = document.createElement('img');
            heart.src = 'assets/heart.png';
            heart.style.width = '24px';
            heart.style.height = '24px';
            heart.style.filter = 'drop-shadow(0 0 4px #f00)';
            this.healthContainer.appendChild(heart);
            this.heartElements.push(heart);
        }
    }

    setHealth(newHealth) {
        this.currentHealth = Math.max(0, Math.min(newHealth, this.maxHealth));
        this.render();
    }

    render() {
        for (let i = 0; i < this.heartElements.length; i++) {
            this.heartElements[i].style.visibility = (i < this.currentHealth) ? 'visible' : 'hidden';
        }
    }
}