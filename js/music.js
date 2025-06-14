export class MusicPlayer {
    constructor(audioUrl) {
        this.audio = new Audio(audioUrl);
        this.audio.loop = true;
        this.audio.volume = 0.5;
        this.isMuted = false;

        this.audio.addEventListener('error', (e) => {
            console.error('Audio load error:', e);
        });

        // REMOVE autoplay here, to avoid browser blocking:
        // this.audio.play().catch(() => {
        //     console.log('Audio play prevented by browser. User interaction needed.');
        // });
    }

    play() {
        this.audio.play().catch(() => {
            console.log('Audio play prevented by browser. User interaction needed.');
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
    }

    setVolume(value) {
        this.audio.volume = value;
        if (value === 0) {
            this.isMuted = true;
            this.audio.muted = true;
        } else {
            this.isMuted = false;
            this.audio.muted = false;
        }
    }
}
