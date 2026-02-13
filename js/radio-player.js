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
        
        // Stop current playback and set new source
        this.audio.pause();
        this.audio.src = this.currentStationUrl;
        this.trackTitle.textContent = `Selected: ${this.currentStationName}`;
        
        // Reset play button state
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶';
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    async play() {
        // Make sure we have a valid station URL
        if (!this.currentStationUrl) {
            this.currentStationUrl = this.stationSelector.value;
            const selectedOption = this.stationSelector.options[this.stationSelector.selectedIndex];
            this.currentStationName = selectedOption.text;
            this.audio.src = this.currentStationUrl;
        }
        
        try {
            // Pause any current playback first
            this.audio.pause();
            
            // Wait a moment for the pause to register
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Set the source again to ensure it's fresh
            this.audio.src = this.currentStationUrl;
            
            // Load the new source
            this.audio.load();
            
            // Update UI
            this.trackTitle.textContent = `Connecting to: ${this.currentStationName}`;
            
            // Wait a bit before attempting to play to allow for loading
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Attempt to play
            await this.audio.play();
            
            // Update UI after successful play
            this.isPlaying = true;
            this.playPauseBtn.textContent = '⏸';
            this.trackTitle.textContent = `Now Playing: ${this.currentStationName}`;
        } catch (error) {
            console.error('Error playing audio:', error);
            this.trackTitle.textContent = `Playback failed: ${error.message}. Try another station.`;
            
            // Retry with a fallback station after a delay
            setTimeout(() => {
                this.tryFallbackStation();
            }, 2000);
        }
    }

    tryFallbackStation() {
        // Get the currently selected option index
        const currentIndex = this.stationSelector.selectedIndex;
        const totalOptions = this.stationSelector.options.length;
        
        // Try the next station in the list
        let nextIndex = (currentIndex + 1) % totalOptions;
        
        // Skip the first option if we're back to it (to avoid infinite loop)
        if (nextIndex === 0 && currentIndex !== totalOptions - 1) {
            nextIndex = 1;
        }
        
        if (nextIndex !== currentIndex) {
            this.stationSelector.selectedIndex = nextIndex;
            this.onStationChange();
            
            // Attempt to play the new station
            setTimeout(() => {
                this.play();
            }, 500);
        }
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