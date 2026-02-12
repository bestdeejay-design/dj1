// js/radio-player.js
class RadioPlayer {
    constructor() {
        this.audio = document.getElementById('radioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.trackTitle = document.getElementById('trackTitle');
        
        this.isPlaying = false;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadRadioStream();
    }
    
    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        
        // Audio events
        this.audio.addEventListener('playing', () => this.onPlaying());
        this.audio.addEventListener('pause', () => this.onPaused());
        this.audio.addEventListener('error', (e) => this.onError(e));
        this.audio.addEventListener('loadstart', () => this.onLoadStart());
        this.audio.addEventListener('waiting', () => this.onWaiting());
        
        // Try to detect track info from stream (limited browser support)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
        }
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.playPauseBtn.textContent = '⏸';
                this.trackTitle.textContent = 'Now Playing: Radio Paradise Electronic';
            })
            .catch((error) => {
                console.error('Error playing audio:', error);
                this.trackTitle.textContent = 'Playback failed: ' + error.message;
            });
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.trackTitle.textContent = 'Paused';
    }
    
    setVolume() {
        this.audio.volume = this.volumeSlider.value;
    }
    
    loadRadioStream() {
        // Set initial volume
        this.audio.volume = this.volumeSlider.value;
        
        // Update track info periodically
        setInterval(() => {
            if (this.isPlaying) {
                // This would normally come from the radio station API
                // Since we're using a simple stream, we'll keep a static message
                // unless we implement metadata fetching
            }
        }, 30000); // Update every 30 seconds
    }
    
    // Event handlers
    onPlaying() {
        this.isPlaying = true;
        this.playPauseBtn.textContent = '⏸';
        this.trackTitle.textContent = 'Now Playing: Radio Paradise Electronic';
    }
    
    onPaused() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.trackTitle.textContent = 'Paused';
    }
    
    onError(e) {
        console.error('Audio error:', e);
        this.trackTitle.textContent = 'Error loading stream. Click Play to retry.';
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
    }
    
    onLoadStart() {
        this.trackTitle.textContent = 'Connecting to stream...';
    }
    
    onWaiting() {
        this.trackTitle.textContent = 'Buffering...';
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RadioPlayer();
});