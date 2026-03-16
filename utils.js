/**
 * ============================================
 * 🛠️ UTILITY FUNCTIONS
 * ============================================
 */

// Format time in seconds to MM:SS
export function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Chunk array into smaller arrays
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// LocalStorage wrapper with error handling
export const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`LocalStorage get error: ${key}`, error);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`LocalStorage set error: ${key}`, error);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`LocalStorage remove error: ${key}`, error);
            return false;
        }
    }
};

// Simple event emitter for state management
export class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return () => this.off(event, listener);
    }
    
    off(event, listener) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
    }
    
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
    }
}

// Create error notification element
export function showErrorNotification(message, duration = 5000) {
    console.error('❌ Error:', message);
    
    const errorEl = document.createElement('div');
    errorEl.className = 'error-notification';
    errorEl.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    errorEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.95);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(errorEl);
    
    setTimeout(() => {
        errorEl.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => errorEl.remove(), 300);
    }, duration);
}

// Fetch with timeout and retry
export async function fetchWithRetry(url, options = {}, maxRetries = 3, timeout = 10000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            lastError = error;
            console.warn(`Fetch attempt ${attempt}/${maxRetries} failed:`, error.message);
            
            if (attempt < maxRetries) {
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

// Cache implementation with TTL
export class Cache {
    constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }
    
    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
        console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
    }
    
    get(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            console.log(`🗑️ Cache expired: ${key}`);
            return null;
        }
        
        console.log(`✅ Cache hit: ${key}`);
        return cached.value;
    }
    
    delete(key) {
        return this.cache.delete(key);
    }
    
    clear() {
        console.log('🗑️ Clearing cache');
        this.cache.clear();
    }
    
    size() {
        return this.cache.size;
    }
}
