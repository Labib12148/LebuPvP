// settings.js
// Handles settings menu (volume, controls, graphics)

export class SettingsManager {
    constructor() {
        this.settings = {
            volume: 0.5,
            graphics: 'high',
            controls: 'default',
        };
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.applySettings();
    }

    getSetting(key) {
        return this.settings[key];
    }

    applySettings() {
        // Apply settings to game (e.g., volume, graphics)
        // Expand as needed
    }
}
