export function setupInput(toggleEscMenuCallback) {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleEscMenuCallback();
        }
    });
}

export function toggleEscMenu(forceState) {
    const escMenu = document.getElementById('esc-menu');
    if (!escMenu) return;

    // Show/hide menu with neon style
    if (typeof forceState === 'boolean') {
        escMenu.classList.toggle('show', forceState);
        escMenu.classList.toggle('hidden', !forceState);
    } else {
        const isOpen = escMenu.classList.contains('show');
        escMenu.classList.toggle('show', !isOpen);
        escMenu.classList.toggle('hidden', isOpen);
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
