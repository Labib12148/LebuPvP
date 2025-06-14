export function setupInput(toggleEscMenuCallback) {
    let escMenuOpen = false;

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            escMenuOpen = !escMenuOpen;
            toggleEscMenuCallback(escMenuOpen);
        }
    });
}

let escMenuOpen = false;

// Exported function to toggle ESC menu visibility
export function toggleEscMenu(forceState) {
    const escMenu = document.getElementById('esc-menu');
    if (!escMenu) return;

    if (typeof forceState === 'boolean') {
        escMenuOpen = forceState;
    } else {
        escMenuOpen = !escMenuOpen;
    }

    if (escMenuOpen) {
        escMenu.classList.add('visible');
        escMenu.classList.remove('hidden');
    } else {
        escMenu.classList.add('hidden');
        escMenu.classList.remove('visible');
    }
}

export function setupEscMenuEvents(musicPlayer) {
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const volumeRange = document.getElementById('volume-range');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    if (!musicToggleBtn || !volumeRange || !closeMenuBtn || !musicPlayer) return;

    // Toggle mute
    musicToggleBtn.onclick = () => {
        musicPlayer.isMuted = !musicPlayer.isMuted;
        musicPlayer.audio.muted = musicPlayer.isMuted;
        musicToggleBtn.textContent = musicPlayer.isMuted ? 'Unmute Music' : 'Mute Music';
    };

    // Change volume
    volumeRange.oninput = () => {
        const volume = parseFloat(volumeRange.value);
        musicPlayer.audio.volume = volume;
    };

    // Resume game (hide menu)
    closeMenuBtn.onclick = () => {
        toggleEscMenu(false);
    };
}
