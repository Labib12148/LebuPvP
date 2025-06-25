// health.js
// Handles player health, damage, healing, and health bar UI
export class HealthSystem {
    constructor(maxHealth = 100) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.onHealthChange = null;
    }
    setHealthChangeCallback(cb) {
        this.onHealthChange = cb;
    }
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        if (this.onHealthChange) this.onHealthChange(this.currentHealth, this.maxHealth);
    }
    isAlive() {
        return this.currentHealth > 0;
    }
    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        if (this.onHealthChange) this.onHealthChange(this.currentHealth, this.maxHealth);
    }
}
export function updateHealthBar(current, max) {
    const bar = document.getElementById('health-bar');
    if (!bar) return;
    const percent = Math.max(0, Math.min(1, current / max));
    bar.style.width = (percent * 100) + '%';
    if (percent > 0.7) {
        bar.style.background = 'linear-gradient(90deg, #00ff00, #0ff)';
    } else if (percent > 0.3) {
        bar.style.background = 'linear-gradient(90deg, #ffa500, #ff0)';
    } else {
        bar.style.background = 'linear-gradient(90deg, #ff0000, #f00)';
    }
    let text = document.getElementById('health-bar-text');
    if (!text) {
        text = document.createElement('div');
        text.id = 'health-bar-text';
        text.style.position = 'absolute';
        text.style.left = '50%';
        text.style.top = '50%';
        text.style.transform = 'translate(-50%, -50%)';
        text.style.color = '#fff';
        text.style.fontWeight = 'bold';
        text.style.textShadow = '0 0 8px #000, 0 0 16px #0ff';
        text.style.pointerEvents = 'none';
        text.style.fontSize = '1.1rem';
        bar.parentElement.appendChild(text);
    }
    text.textContent = `${current} / ${max}`;
}
