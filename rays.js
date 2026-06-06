// rays.js — эффекты, переключаемые темой

const RAYS_CONFIG = {
    // Для лучей (тёмная тема)
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
    // Для красных шаров (светлая тема)
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
    // Для пузырьков (частиц) — общие для обеих тем
    particles: {
        count: 40,                 // количество пузырьков
        minSize: 5,                // минимальный размер (px)
        maxSize: 23,                // максимальный размер (px)
        minSpeed: 8,               // минимальная длительность анимации (сек)
        maxSpeed: 20,              // максимальная длительность
        minDelay: 0,               // минимальная задержка старта (сек)
        maxDelay: 10,              // максимальная задержка
        baseOpacity: 0.2,          // базовая прозрачность (0-1)
        varyOpacity: true,         // варьировать прозрачность
        color: 'rgba(255, 255, 255', // цветовая основа (без прозрачности)
    }
};

// Создание лучей (тёмная тема)
function createBeams(config) {
    // Debug: console.log('💡 Создание лучей (тонкие)');
    const container = document.querySelector('.background-effects');
    if (!container) return;

    // Удаляем только лучи и шары (частицы не трогаем)
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
    // Debug: console.log(`✨ Создано лучей: ${container.querySelectorAll('.ray-beam').length}`);
}

// Создание красных шаров (светлая тема)
function createSphere(config) {
    // Debug: console.log('🔴 Создание красных шаров');
    const container = document.querySelector('.background-effects');
    if (!container) return;

    // Удаляем только лучи и шары (частицы не трогаем)
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
    // Debug: console.log(`✨ Создано шаров: ${container.querySelectorAll('.sphere').length}`);
}

// Создание пузырьков (частиц) с настройками
function createParticles(config) {
    const container = document.querySelector('.background-effects');
    if (!container) return;

    // Удаляем старые частицы, если нужно пересоздать
    container.querySelectorAll('.particle').forEach(p => p.remove());

    const count = config.count || 40;
    const minSize = config.minSize || 1;
    const maxSize = config.maxSize || 4;
    const minSpeed = config.minSpeed || 8;
    const maxSpeed = config.maxSpeed || 20;
    const minDelay = config.minDelay || 0;
    const maxDelay = config.maxDelay || 10;
    const baseOpacity = config.baseOpacity || 0.2;
    const varyOpacity = config.varyOpacity !== false;
    const colorBase = config.color || 'rgba(255, 255, 255';

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Случайный размер
        const size = minSize + Math.random() * (maxSize - minSize);
        // Случайная длительность анимации
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        // Случайная задержка
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        // Случайная прозрачность
        let opacity = baseOpacity;
        if (varyOpacity) {
            opacity = baseOpacity * (0.5 + Math.random());
        }

        // Позиция по горизонтали случайная
        const left = Math.random() * 100;

        particle.style.cssText = `
            left: ${left}%;
            bottom: -10px; /* старт чуть ниже экрана */
            width: ${size}px;
            height: ${size}px;
            background: ${colorBase}, ${opacity});
            border-radius: 50%;
            box-shadow: 0 0 10px ${colorBase}, ${opacity * 2});
            animation: float ${speed}s linear infinite;
            animation-delay: -${delay}s; /* отрицательная задержка для случайного старта */
            will-change: transform, opacity;
            z-index: 2;
        `;
        container.appendChild(particle);
    }
    // Debug: console.log(`✨ Создано частиц: ${container.querySelectorAll('.particle').length}`);
}

// Функция применения эффектов в зависимости от темы
function applyEffects(theme) {
    if (theme === 'dark') {
        createBeams(RAYS_CONFIG.beams);
    } else {
        createSphere(RAYS_CONFIG.sphere);
    }
    // Частицы не пересоздаём при смене темы (они уже есть и общие)
    // Если нужно принудительно обновить частицы с новыми настройками, можно вызвать createParticles(RAYS_CONFIG.particles);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Debug: console.log('🚀 Запуск эффектов');
    // Создаём частицы с настройками из конфига
    createParticles(RAYS_CONFIG.particles);

    // Определяем текущую тему из localStorage или по умолчанию 'dark'
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyEffects(savedTheme);
});

// Слушаем изменения темы (событие из script.js)
window.addEventListener('themeChanged', (e) => {
    // Debug: console.log('🎨 Тема изменена, обновляем эффекты');
    applyEffects(e.detail.theme);
});
