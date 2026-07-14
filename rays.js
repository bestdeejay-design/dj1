const RAYS_CONFIG = {
    beams: {
        count: 12,
        speedMin: 6,
        speedMax: 14,
        minWidth: 20,
        maxWidth: 80,
        intensity: 0.3,
        varyIntensity: true,
        colorHue: 200,
    },
    sphere: {
        minCount: 2,
        maxCount: 5,
        minSize: 400,
        maxSize: 800,
        minIntensity: 0.4,
        maxIntensity: 0.8,
        minPulseSpeed: 3,
        maxPulseSpeed: 10,
        colorHue: 0,
    },
    particles: {
        count: 40,
        minSize: 5,
        maxSize: 23,
        minSpeed: 8,
        maxSpeed: 20,
        minDelay: 0,
        maxDelay: 10,
        baseOpacity: 0.2,
        varyOpacity: true,
        color: '255, 255, 255',
    }
};

function createBeams(config) {
    const container = document.querySelector('.background-effects');
    if (!container) return;

    container.querySelectorAll('.ray-beam, .sphere').forEach(el => el.remove());

    const count = config.count || 12;
    const speedMin = config.speedMin || 6;
    const speedMax = config.speedMax || 14;
    const minWidth = config.minWidth || 20;
    const maxWidth = config.maxWidth || 80;
    const baseIntensity = config.intensity || 0.3;
    const varyIntensity = config.varyIntensity !== false;
    const colorHue = config.colorHue || 200;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const diag = Math.sqrt(w * w + h * h);
    const length = diag * 1.5;

    for (let i = 0; i < count; i++) {
        const edge = Math.random() < 0.5 ? 'top' : 'bottom';
        const fixedX = Math.random() * w;
        const fixedY = edge === 'bottom' ? h + 20 : -20;

        let angleStart, angleEnd;
        if (edge === 'bottom') {
            angleStart = -30 + Math.random() * 20 - 10;
            angleEnd = 30 + Math.random() * 20 - 10;
        } else {
            angleStart = 150 + Math.random() * 20 - 10;
            angleEnd = 210 + Math.random() * 20 - 10;
        }

        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        let intensity = baseIntensity;
        if (varyIntensity) intensity = baseIntensity * (0.6 + Math.random() * 0.8);

        const hue = colorHue + (Math.random() * 60 - 30);
        const color = `hsla(${hue}, 80%, 70%, ${intensity})`;

        const ray = document.createElement('div');
        ray.className = 'ray-beam';
        ray.style.setProperty('--fixed-x', fixedX + 'px');
        ray.style.setProperty('--fixed-y', fixedY + 'px');
        ray.style.setProperty('--angle-start', angleStart + 'deg');
        ray.style.setProperty('--angle-end', angleEnd + 'deg');
        ray.style.setProperty('--speed', speed + 's');
        ray.style.transformOrigin = edge === 'bottom' ? 'left bottom' : 'left top';

        ray.style.cssText += `
            left: 0;
            top: 0;
            width: ${length}px;
            height: ${width}px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                ${color} 15%, 
                ${color} 85%, 
                transparent 100%);
            filter: blur(20px);
            mix-blend-mode: screen;
            animation: swing var(--speed) ease-in-out infinite alternate;
            transform: translate(${fixedX}px, ${fixedY}px) rotate(${angleStart}deg);
            opacity: 0.8;
        `;

        container.appendChild(ray);
    }
}

function createSphere(config) {
    const container = document.querySelector('.background-effects');
    if (!container) return;

    container.querySelectorAll('.ray-beam, .sphere').forEach(el => el.remove());

    const minCount = config.minCount || 2;
    const maxCount = config.maxCount || 5;
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

    const minSize = config.minSize || 300;
    const maxSize = config.maxSize || 700;
    const minIntensity = config.minIntensity || 0.1;
    const maxIntensity = config.maxIntensity || 0.3;
    const minPulseSpeed = config.minPulseSpeed || 4;
    const maxPulseSpeed = config.maxPulseSpeed || 10;
    const baseHue = config.colorHue || 0;

    for (let i = 0; i < count; i++) {
        const posX = 30 + Math.random() * 40;
        const posY = 30 + Math.random() * 40;
        const size = minSize + Math.random() * (maxSize - minSize);
        const intensity = minIntensity + Math.random() * (maxIntensity - minIntensity);
        const hue = baseHue + (Math.random() * 30 - 15);
        const pulseSpeed = minPulseSpeed + Math.random() * (maxPulseSpeed - minPulseSpeed);
        const scaleMin = 0.7 + Math.random() * 0.2;
        const scaleMax = 1.2 + Math.random() * 0.3;

        const sphere = document.createElement('div');
        sphere.className = 'sphere';
        sphere.style.setProperty('--scale-min', scaleMin);
        sphere.style.setProperty('--scale-max', scaleMax);
        sphere.style.setProperty('--pulse-speed', pulseSpeed + 's');

        sphere.style.cssText += `
            left: ${posX}%;
            top: ${posY}%;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle at 30% 30%, 
                hsla(${hue}, 100%, 70%, ${intensity}) 0%, 
                hsla(${hue}, 100%, 50%, ${intensity * 0.7}) 40%, 
                transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(${scaleMin});
            filter: blur(40px);
            mix-blend-mode: screen;
            animation: pulseCustom var(--pulse-speed) ease-in-out infinite alternate;
        `;

        container.appendChild(sphere);
    }
}

function createParticles(config) {
    const container = document.querySelector('.background-effects');
    if (!container) return;

    container.querySelectorAll('.particle').forEach(p => p.remove());

    const count = config.count || 40;
    const minSize = config.minSize || 5;
    const maxSize = config.maxSize || 23;
    const minSpeed = config.minSpeed || 8;
    const maxSpeed = config.maxSpeed || 20;
    const minDelay = config.minDelay || 0;
    const maxDelay = config.maxDelay || 10;
    const baseOpacity = config.baseOpacity || 0.2;
    const varyOpacity = config.varyOpacity !== false;
    const colorRgb = config.color || '255, 255, 255';

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = minSize + Math.random() * (maxSize - minSize);
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        let opacity = baseOpacity;
        if (varyOpacity) {
            opacity = baseOpacity * (0.5 + Math.random());
        }

        const left = Math.random() * 100;

        particle.style.cssText = `
            left: ${left}%;
            bottom: -10px;
            width: ${size}px;
            height: ${size}px;
            background: rgba(${colorRgb}, ${opacity});
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(${colorRgb}, ${opacity * 2});
            animation: particleFloat ${speed}s linear infinite;
            animation-delay: -${delay}s;
            will-change: transform, opacity;
            z-index: 2;
        `;
        container.appendChild(particle);
    }
}

function applyEffects(theme) {
    if (theme === 'dark') {
        createBeams(RAYS_CONFIG.beams);
    } else {
        createSphere(RAYS_CONFIG.sphere);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createParticles(RAYS_CONFIG.particles);

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyEffects(savedTheme);
});

window.addEventListener('themeChanged', (e) => {
    applyEffects(e.detail.theme);
});
