/**
 * ============================================
 * 📦 STATE MANAGEMENT MODULE
 * ============================================
 */

import { storage, EventEmitter } from './utils.js';

// Initial state
const initialState = {
    // Playlist state
    currentPlaylist: [],
    currentTrackIndex: -1,
    isPlaying: false,
    
    // Tag state
    currentTagId: null,
    currentTagName: null,
    tagTrackPlaylist: [],
    displayedTrackIds: new Set(),
    
    // Loading state
    isLoadingMore: false,
    isLoadingTags: false,
    
    // Player settings (persisted)
    playerSettings: {
        volume: 0.7,
        isMuted: false,
        lastVolume: 0.7,
        isShuffleOn: false,
        repeatMode: 'none', // 'none' | 'all' | 'one'
    },
    
    // UI state
    isPlayerVisible: false,
    error: null,
};

// State class with persistence
export class Store extends EventEmitter {
    constructor() {
        super();
        this.state = this.loadState();
        console.log('📦 Store initialized:', this.state);
    }
    
    loadState() {
        const saved = storage.get('playerState');
        return {
            ...initialState,
            playerSettings: saved?.playerSettings || initialState.playerSettings,
        };
    }
    
    saveState() {
        storage.set('playerState', {
            playerSettings: this.state.playerSettings,
        });
    }
    
    getState() {
        return this.state;
    }
    
    setState(newState) {
        const prevState = this.state;
        this.state = { ...this.state, ...newState };
        
        // Emit change events for each changed property
        Object.keys(newState).forEach(key => {
            if (prevState[key] !== this.state[key]) {
                this.emit(`change:${key}`, this.state[key], prevState[key]);
            }
        });
        
        this.emit('change', this.state, prevState);
        
        // Auto-save persistent settings
        if (newState.playerSettings) {
            this.saveState();
        }
        
        console.log('📦 State updated:', newState);
    }
    
    reset() {
        this.state = { ...initialState };
        this.emit('reset');
        console.log('📦 State reset to initial');
    }
}

// Player-specific state helpers
export const playerState = {
    store: null,
    
    init(store) {
        this.store = store;
    },
    
    // Playlist management
    setPlaylist(playlist) {
        this.store.setState({ 
            currentPlaylist: playlist,
            currentTrackIndex: playlist.length > 0 ? 0 : -1,
        });
    },
    
    getCurrentTrack() {
        const { currentPlaylist, currentTrackIndex } = this.store.getState();
        return currentPlaylist[currentTrackIndex] || null;
    },
    
    setCurrentTrackIndex(index) {
        this.store.setState({ currentTrackIndex: index });
    },
    
    // Playback control
    setIsPlaying(isPlaying) {
        this.store.setState({ isPlaying });
    },
    
    togglePlaying() {
        const { isPlaying } = this.store.getState();
        this.store.setState({ isPlaying: !isPlaying });
        return !isPlaying;
    },
    
    // Settings
    setVolume(volume) {
        this.store.setState({ 
            playerSettings: { 
                ...this.store.getState().playerSettings,
                volume,
            }
        });
    },
    
    setMuted(isMuted) {
        this.store.setState({ 
            playerSettings: { 
                ...this.store.getState().playerSettings,
                isMuted,
            }
        });
    },
    
    toggleShuffle() {
        const { isShuffleOn } = this.store.getState().playerSettings;
        this.store.setState({ 
            playerSettings: { 
                ...this.store.getState().playerSettings,
                isShuffleOn: !isShuffleOn,
            }
        });
        return !isShuffleOn;
    },
    
    cycleRepeatMode() {
        const modes = ['none', 'all', 'one'];
        const current = this.store.getState().playerSettings.repeatMode;
        const nextIndex = (modes.indexOf(current) + 1) % modes.length;
        
        this.store.setState({ 
            playerSettings: { 
                ...this.store.getState().playerSettings,
                repeatMode: modes[nextIndex],
            }
        });
        return modes[nextIndex];
    },
    
    // UI
    setPlayerVisible(visible) {
        this.store.setState({ isPlayerVisible: visible });
    },
    
    setError(error) {
        this.store.setState({ error });
    },
    
    clearError() {
        this.store.setState({ error: null });
    },
};

// Create singleton store instance
export const store = new Store();
playerState.init(store);
