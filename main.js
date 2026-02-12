// js/main.js
class AfterDarkWebsite {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.setupNavigation();
        this.createFloatingParticles();
        this.loadDJs();
        this.setupMusicPlatforms();
    }

    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        const savedTheme = localStorage.getItem('djTheme') || 'dark';
        
        this.currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        themeToggle.textContent = this.currentTheme === 'party' ? 'PARTY 🎉' : 'LOUNGE 🍸';

        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'party' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('djTheme', this.currentTheme);
        
        const themeToggle = document.querySelector('.theme-toggle');
        themeToggle.textContent = this.currentTheme === 'party' ? 'PARTY 🎉' : 'LOUNGE 🍸';

        if (this.currentTheme === 'party') {
            this.createConfettiExplosion();
            this.triggerBeatDropAnimation();
            this.toggleStrobeEffect(true);
            this.createFloatingParticles();
        } else {
            this.toggleStrobeEffect(false);
            this.removeFloatingParticles();
        }
    }

    createConfettiExplosion() {
        const colors = ['#FF00FF', '#00FFFF', '#FF0000', '#FFFF00', '#00FF00'];
        const confettiCount = 150;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.position = 'fixed';
            confetti.style.zIndex = '9999';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }

        // Add CSS animation
        if (!document.querySelector('#confetti-animation')) {
            const style = document.createElement('style');
            style.id = 'confetti-animation';
            style.textContent = `
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    triggerBeatDropAnimation() {
        const beatDrop = document.createElement('div');
        beatDrop.className = 'beat-drop';
        beatDrop.textContent = 'BEAT DROP 💥';
        beatDrop.style.position = 'fixed';
        beatDrop.style.top = '50%';
        beatDrop.style.left = '50%';
        beatDrop.style.transform = 'translate(-50%, -50%) scale(0)';
        beatDrop.style.fontSize = 'clamp(3rem, 10vw, 6rem)';
        beatDrop.style.fontWeight = '900';
        beatDrop.style.color = '#FF00FF';
        beatDrop.style.textShadow = '0 0 50px #FF00FF, 0 0 100px #FF00FF';
        beatDrop.style.zIndex = '9998';
        beatDrop.style.pointerEvents = 'none';
        beatDrop.style.textAlign = 'center';
        beatDrop.style.fontFamily = "'Orbitron', sans-serif";
        document.body.appendChild(beatDrop);
        
        requestAnimationFrame(() => {
            beatDrop.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
            beatDrop.style.transform = 'translate(-50%, -50%) scale(1.2)';
            beatDrop.style.opacity = '1';
        });
        
        setTimeout(() => {
            beatDrop.style.transform = 'translate(-50%, -50%) scale(2)';
            beatDrop.style.opacity = '0';
        }, 1200);
        
        setTimeout(() => beatDrop.remove(), 2000);
    }

    toggleStrobeEffect(active) {
        if (active) {
            document.body.classList.add('strobe-active');
        } else {
            document.body.classList.remove('strobe-active');
        }
    }

    createFloatingParticles() {
        if (this.currentTheme !== 'party') return;
        
        const particles = document.querySelectorAll('.floating-particle');
        particles.forEach(p => p.remove());
        
        const particleCount = 30;
        const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00', '#FF0000'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.width = Math.random() * 15 + 5 + 'px';
            particle.style.height = particle.style.width;
            particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            particle.style.position = 'fixed';
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.top = Math.random() * 100 + 'vh';
            particle.style.opacity = Math.random() * 0.5 + 0.2;
            particle.style.zIndex = '-1';
            particle.style.animation = `floatParticle ${Math.random() * 10 + 5}s linear infinite`;
            particle.style.animationDelay = Math.random() * 5 + 's';
            document.body.appendChild(particle);
        }

        // Add particle animation CSS
        if (!document.querySelector('#particle-animation')) {
            const style = document.createElement('style');
            style.id = 'particle-animation';
            style.textContent = `
                @keyframes floatParticle {
                    0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.2; }
                    50% { transform: translate(100px, -100px) rotate(180deg) scale(1.2); opacity: 0.8; }
                    100% { transform: translate(0, 0) rotate(360deg) scale(1); opacity: 0.2; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    removeFloatingParticles() {
        const particles = document.querySelectorAll('.floating-particle');
        particles.forEach(p => p.remove());
    }

    setupNavigation() {
        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Mobile menu
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        
        mobileBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });
    }

    loadDJs() {
        const djs = [
            { name: "David Guetta", genre: "House", followers: "12M" },
            { name: "Martin Garrix", genre: "Progressive House", followers: "8.5M" },
            { name: "Calvin Harris", genre: "Electro House", followers: "9.2M" },
            { name: "Tiësto", genre: "Trance", followers: "7.8M" },
            { name: "Armin van Buuren", genre: "Trance", followers: "6.3M" },
            { name: "Charlotte de Witte", genre: "Techno", followers: "3.1M" }
        ];

        const djGrid = document.querySelector('.dj-grid');
        djGrid.innerHTML = djs.map(dj => `
            <div class="dj-card">
                <div class="dj-image"></div>
                <div class="dj-info">
                    <h3>${dj.name}</h3>
                    <p class="dj-genre">${dj.genre}</p>
                    <p class="dj-followers">${dj.followers} followers</p>
                </div>
                <div class="dj-social">
                    <span>🔊</span>
                    <span>📷</span>
                    <span>🎵</span>
                </div>
            </div>
        `).join('');
    }

    setupMusicPlatforms() {
        const platforms = [
            { name: "Spotify", icon: "🔊", url: "https://spotify.com" },
            { name: "Apple Music", icon: "🎵", url: "https://music.apple.com" },
            { name: "SoundCloud", icon: "☁️", url: "https://soundcloud.com" },
            { name: "Beatport", icon: "⚡", url: "https://beatport.com" },
            { name: "YouTube Music", icon: "▶️", url: "https://music.youtube.com" },
            { name: "Tidal", icon: "🌊", url: "https://tidal.com" }
        ];

        const platformGrid = document.querySelector('.platform-grid');
        platformGrid.innerHTML = platforms.map(platform => `
            <a href="${platform.url}" target="_blank" class="platform-link">
                <span class="platform-icon">${platform.icon}</span>
                <span class="platform-name">${platform.name}</span>
            </a>
        `).join('');
    }
}

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AfterDarkWebsite();
});
