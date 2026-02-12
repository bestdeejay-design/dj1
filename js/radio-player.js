// js/radio-player.js
class RadioPlayer {
    constructor() {
        this.audio = document.getElementById('radioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.trackTitle = document.getElementById('trackTitle');
        this.stationSelector = document.getElementById('stationSelector');
        
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
        this.stationSelector.addEventListener('change', () => this.onStationChange());
        
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
    
    onStationChange() {
        // When station changes, update the source but don't automatically play
        const selectedOption = this.stationSelector.options[this.stationSelector.selectedIndex];
        this.currentStationUrl = this.stationSelector.value;
        this.currentStationName = selectedOption.text;
        this.audio.src = this.currentStationUrl;
        this.trackTitle.textContent = `Selected: ${this.currentStationName}`;
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        // Make sure we have a valid station URL
        if (!this.currentStationUrl) {
            this.currentStationUrl = this.stationSelector.value;
            const selectedOption = this.stationSelector.options[this.stationSelector.selectedIndex];
            this.currentStationName = selectedOption.text;
            this.audio.src = this.currentStationUrl;
        }
        
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.playPauseBtn.textContent = '⏸';
                this.trackTitle.textContent = `Now Playing: ${this.currentStationName}`;
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
        this.trackTitle.textContent = `Paused: ${this.currentStationName}`;
    }
    
    setVolume() {
        this.audio.volume = this.volumeSlider.value;
    }
    
    loadRadioStream() {
        // Set initial station and volume
        this.currentStationUrl = this.stationSelector.value;
        const initialOption = this.stationSelector.options[this.stationSelector.selectedIndex];
        this.currentStationName = initialOption.text;
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
        this.trackTitle.textContent = `Now Playing: ${this.currentStationName}`;
    }
    
    onPaused() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.trackTitle.textContent = `Paused: ${this.currentStationName}`;
    }
    
    onError(e) {
        console.error('Audio error:', e);
        this.trackTitle.textContent = 'Error loading stream. Select a station and click Play.';
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