// script.js — логика плеера, галереи, темы
//
// 💡 ПОДСКАЗКА ДЛЯ РАЗРАБОТЧИКА:
// - Перед изменением проверь docs/CODE_CHEATSHEET.md на наличие зависимостей
// - Критичные функции помечены комментариями "⚠️ CRITICAL" и "🔒 LOCKED"
// - Не нарушать порядок инициализации: loadLibrary → setupInfiniteScroll → switchView

(function() {
    // ==================== УТИЛИТЫ ====================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
    let albums = [];
    let currentAlbum = null;
    let currentTrackIndex = -1;
    let playlistVisible = false;
    
    // Топ треков
    let topTracks = [];
    let currentView = localStorage.getItem('currentView') || 'albums'; // 'albums' | 'top-tracks' | 'tags'
    let topTracksSort = 'plays';
    let topTracksOrder = 'desc'; // 'asc' | 'desc'
    let topTracksPage = 1;
    let topTracksHasMore = true;
    let isLoadingTopTracks = false;
    
    // By Tags view
    let allTags = [];
    let allTagsLoaded = false;
    let currentTag = null;
    let tagTracks = [];
    
    // Фильтр публичности (общий для альбомов и треков)
    let privacyFilter = localStorage.getItem('privacyFilter') || 'public'; // 'public' | 'all'

    const REPEAT_NONE = 0;
    const REPEAT_ONE = 1;
    const REPEAT_ALL = 2;
    let repeatMode = REPEAT_ALL;

    let shuffleOn = false;
    let shuffleIndices = [];
    let shuffleCurrentIndex = 0;

    // Пагинация API
    let currentPage = 1;
    const itemsPerPage = 12;
    let isLoading = false;
    let hasMore = true;
    let totalPages = 1;

    // Сортировка
    let currentSort = 'created'; // 'created', 'name', 'tracks', 'plays', 'favorites'
    let currentOrder = 'desc'; // 'desc', 'asc' - по умолчанию новые сначала

    // ID автора BEST (будет загружен при инициализации)
    let bestUserId = null;

    // Кэш загруженных треков альбомов
    const albumTracksCache = new Map();

    // Элементы DOM
    const gallery = document.getElementById('gallery');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const playerBar = document.getElementById('playerBar');
    const audioPlayer = document.getElementById('audioPlayer');
    const currentTrackCover = document.getElementById('currentTrackCover');
    const currentTrackName = document.getElementById('currentTrackName');
    const currentAlbumName = document.getElementById('currentAlbumName');
    const togglePlaylist = document.getElementById('togglePlaylist');
    const playlistPanel = document.getElementById('playlistPanel');
    const closePlaylist = document.getElementById('closePlaylist');
    const overlay = document.getElementById('overlay');
    const playlistContainer = document.getElementById('playlist');
    const playlistAlbumTitle = document.getElementById('playlistAlbumTitle');
    
    const prevBtn = document.getElementById('prevBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');

    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');

    // Прогресс бар элементы
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');

    // Топ треков элементы
    const viewTabs = document.getElementById('viewTabs');
    const topTracksView = document.getElementById('topTracksView');
    
    // By Tags элементы
    const tagsView = document.getElementById('tagsView');
    const tagsCloud = document.getElementById('tagsCloud');
    const tagTracksList = document.getElementById('tagTracksList');

    // ==================== ЗАГРУЗКА ДАННЫХ ====================
    async function loadLibrary() {
        try {
            // Находим пользователя BEST
            const userResponse = await fetch('https://api.dj1.ru/api/users?username=BEST&limit=1');
            if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.data && userData.data.length > 0) {
                    bestUserId = userData.data[0].user_id;
                }
            }
            
            // Создаем элементы управления сортировкой
            createSortControls();
            
            // Загружаем первую страницу
            await loadMoreAlbums();
            
            // Настраиваем бесконечный скролл
            setupInfiniteScroll();
            
        } catch (err) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            errorEl.textContent = 'Ошибка: ' + err.message;
        }
    }

    // ==================== СОРТИРОВКА ====================
    function createSortControls() {
        const sortContainer = document.createElement('div');
        sortContainer.className = 'sort-controls';
        sortContainer.innerHTML = `
            <label>Privacy:</label>
            <select id="privacySelect">
                <option value="public" ${privacyFilter === 'public' ? 'selected' : ''}>Published</option>
                <option value="all" ${privacyFilter === 'all' ? 'selected' : ''}>All</option>
            </select>
            <label>Sort by:</label>
            <select id="sortSelect">
                <option value="created" selected>Date Created</option>
                <option value="name">Name</option>
                <option value="tracks">Track Count</option>
                <option value="plays">Total Plays</option>
                <option value="favorites">Total Favorites</option>
            </select>
            <button id="sortOrderBtn" title="Toggle sort order">↓</button>
            <button id="clearStateBtn" class="clear-state-btn" title="Clear all state & reload">
                ×
            </button>
        `;
        document.body.appendChild(sortContainer);

        // Стили для сортировки (глассморфизм, правый верхний угол)
        const style = document.createElement('style');
        style.textContent = `
            .sort-controls {
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                font-size: 13px;
                z-index: 100;
                
                /* Глассморфизм */
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            
            .sort-controls label {
                color: rgba(255, 255, 255, 0.7);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 11px;
            }
            
            .sort-controls select {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 6px 10px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 13px;
                outline: none;
                transition: all 0.2s ease;
            }
            
            .sort-controls select:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .sort-controls select:focus {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.4);
            }
            
            .sort-controls button {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 6px 12px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                min-width: 36px;
            }
            
            .sort-controls button:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.4);
                transform: translateY(-1px);
            }
            
            /* Кнопка очистки состояния (крестик) */
            .clear-state-btn {
                background: rgba(239, 68, 68, 0.3) !important;
                border-color: rgba(239, 68, 68, 0.5) !important;
                color: #fca5a5 !important;
                font-weight: bold;
                font-size: 18px !important;
                padding: 8px 12px !important;
                margin-left: 8px;
                transition: all 0.2s ease;
                min-width: auto !important;
                line-height: 1;
            }
            
            .clear-state-btn:hover {
                background: rgba(239, 68, 68, 0.5) !important;
                border-color: rgba(239, 68, 68, 0.7) !important;
                color: #fff !important;
                transform: scale(1.15) rotate(90deg);
            }
            
            [data-theme="light"] .clear-state-btn {
                background: rgba(239, 68, 68, 0.2) !important;
                color: #dc2626 !important;
            }
            
            /* Адаптация для светлой темы */
            [data-theme="light"] .sort-controls {
                background: rgba(255, 255, 255, 0.7);
                border: 1px solid rgba(0, 0, 0, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            [data-theme="light"] .sort-controls label {
                color: rgba(0, 0, 0, 0.6);
            }
            
            [data-theme="light"] .sort-controls select,
            [data-theme="light"] .sort-controls button {
                background: rgba(0, 0, 0, 0.05);
                color: #333;
                border: 1px solid rgba(0, 0, 0, 0.15);
            }
            
            [data-theme="light"] .sort-controls select:hover,
            [data-theme="light"] .sort-controls button:hover {
                background: rgba(0, 0, 0, 0.1);
                border-color: rgba(0, 0, 0, 0.25);
            }
            
            /* Мобильная адаптация - Control Panel сверху */
            @media (max-width: 600px) {
                .sort-controls {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    transform: none;
                    padding: 8px 12px;
                    gap: 8px;
                    flex-direction: row;
                    justify-content: center;
                    border-radius: 0 0 16px 16px;
                    min-width: auto;
                    z-index: 50;
                }
                
                /* Язычок Control Panel - сдвинут вправо для iPhone Dynamic Island */
                .sort-controls::after {
                    content: '⚙️ Filters';
                    position: absolute;
                    bottom: -28px;
                    right: 20px;
                    left: auto;
                    transform: none;
                    padding: 4px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-top: none;
                    border-radius: 0 0 12px 12px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    white-space: nowrap;
                    letter-spacing: 0.5px;
                }
                
                /* Скрытая панель */
                .sort-controls.collapsed {
                    top: -60px;
                }
                
                .sort-controls.collapsed::after {
                    content: '⚙️ Filters';
                }
                
                .sort-controls label {
                    font-size: 9px;
                    text-align: center;
                }
                
                .sort-controls select,
                .sort-controls button {
                    padding: 4px 8px;
                    font-size: 12px;
                }
                
                /* Кнопка очистки на мобильном */
                .sort-controls .clear-state-btn {
                    padding: 6px 10px !important;
                    font-size: 16px !important;
                    margin-left: 6px;
                }
            }
            
            /* Светлая тема для мобильной панели */
            [data-theme="light"] .sort-controls::after {
                background: rgba(0, 0, 0, 0.05);
                border-color: rgba(0, 0, 0, 0.15);
                color: rgba(0, 0, 0, 0.6);
            }
        `;
        document.head.appendChild(style);

        // Обработчики событий
        const sortSelect = document.getElementById('sortSelect');
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        const privacySelect = document.getElementById('privacySelect');
        
        privacySelect.addEventListener('change', (e) => {
            privacyFilter = e.target.value;
            localStorage.setItem('privacyFilter', privacyFilter);
            if (currentView === 'albums') {
                resetAndReload();
            } else {
                resetAndReloadTopTracks();
            }
        });
        
        sortSelect.addEventListener('change', (e) => {
            const sortValue = e.target.value;
            if (currentView === 'albums') {
                currentSort = sortValue;
                resetAndReload();
            } else if (currentView === 'top-tracks') {
                // Для топа треков используем тот же набор сортировок
                topTracksSort = sortValue;
                resetAndReloadTopTracks();
            } else if (currentView === 'tags') {
                // Для треков по тегу — клиентская сортировка
                tagTracksSort = sortValue;
                sortTagTracks();
            }
        });

        sortOrderBtn.addEventListener('click', (e) => {
            if (currentView === 'albums') {
                currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
                e.target.textContent = currentOrder === 'asc' ? '↑' : '↓';
                resetAndReload();
            } else if (currentView === 'top-tracks') {
                // Для топа треков
                topTracksOrder = topTracksOrder === 'asc' ? 'desc' : 'asc';
                e.target.textContent = topTracksOrder === 'asc' ? '↑' : '↓';
                resetAndReloadTopTracks();
            } else if (currentView === 'tags') {
                // Для треков по тегу — клиентская сортировка
                tagTracksOrder = tagTracksOrder === 'asc' ? 'desc' : 'asc';
                e.target.textContent = tagTracksOrder === 'asc' ? '↑' : '↓';
                sortTagTracks();
            }
        });
        
        // Мобильное поведение - Control Panel сверху
        if (window.innerWidth <= 600) {
            // По умолчанию свёрнута
            sortContainer.classList.add('collapsed');
            
            // Клик по язычку (псевдоэлемент) - тоггл панели
            // Используем делегирование событий
            sortContainer.addEventListener('click', (e) => {
                const rect = sortContainer.getBoundingClientRect();
                const isClickOnTab = e.clientY > rect.bottom;
                
                // Если клик по самому язычку (ниже панели) - тогглим
                if (isClickOnTab) {
                    e.preventDefault();
                    e.stopPropagation();
                    sortContainer.classList.toggle('collapsed');
                    return;
                }
                
                // Если клик по селекту или кнопке - не тогглим
                if (e.target === sortSelect || e.target === sortOrderBtn || e.target === privacySelect) {
                    return;
                }
            });
            
            // Закрыть при клике вне панели
            document.addEventListener('click', (e) => {
                if (!sortContainer.contains(e.target)) {
                    sortContainer.classList.add('collapsed');
                }
            });
        }
        
        // 🔥 FIX: Обработчик кнопки очистки состояния
        const clearStateBtn = document.getElementById('clearStateBtn');
        if (clearStateBtn) {
            clearStateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                clearAllStateAndReload();
            });
        }
    }

    // 🔥 FIX: Полная очистка DOM и localStorage (как при первом заходе)
    function clearAllStateAndReload() {
        console.log('🧹 Clearing all state...');
        
        // 1. Очищаем localStorage
        localStorage.removeItem('playerState');
        localStorage.removeItem('currentView');
        localStorage.removeItem('theme');
        
        // 2. Останавливаем плеер
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.src = '';
        
        // 3. Сбрасываем переменные состояния
        currentAlbum = null;
        currentTrackIndex = -1;
        currentView = 'albums';
        currentPage = 1;
        hasMore = true;
        albums = [];
        topTracks = [];
        tagTracks = [];
        currentTag = null;
        
        // 4. Очищаем DOM
        gallery.innerHTML = '';
        topTracksView.innerHTML = '';
        tagsView.innerHTML = '<div class="tags-cloud" id="tagsCloud"></div><div class="tag-tracks-list" id="tagTracksList"></div>';
        playlist.innerHTML = '';
        
        // 5. Скрываем плеер
        playerBar.classList.remove('active');
        document.title = 'DJ1.RU — Music Library';
        
        // 6. Очищаем название трека
        currentTrackName.textContent = 'Выберите трек';
        currentAlbumName.textContent = '';
        currentTrackCover.src = '';
        
        // 7. Перезагружаем страницу
        setTimeout(() => {
            location.reload();
        }, 300);
    }

    function resetAndReload() {
        // Сбрасываем состояние и перезагружаем с серверной сортировкой
        currentPage = 1;
        hasMore = true;
        totalPages = 1;
        albums = [];
        gallery.innerHTML = '';
        albumTracksCache.clear();
        // Прокручиваем к началу галереи
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadMoreAlbums();
    }

    function resetAndReloadTopTracks() {
        topTracksPage = 1;
        topTracksHasMore = true;
        topTracks = [];
        topTracksView.innerHTML = '';
        // Прокручиваем к началу
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadTopTracks();
    }
    
    // Сортировка треков по тегу (клиентская)
    function sortTagTracks(shouldRender = true) {
        if (!tagTracks || tagTracks.length === 0) return;
        
        // Сортируем по выбранному полю
        tagTracks.sort((a, b) => {
            let valA, valB;
            
            switch (tagTracksSort) {
                case 'plays':
                    valA = a.plays || 0;
                    valB = b.plays || 0;
                    break;
                case 'favorites':
                    valA = a.favorites || 0;
                    valB = b.favorites || 0;
                    break;
                case 'name':
                    valA = a.name || '';
                    valB = b.name || '';
                    break;
                default:
                    valA = a.plays || 0;
                    valB = b.plays || 0;
            }
            
            // Сравнение с учётом направления
            if (tagTracksOrder === 'asc') {
                return valA > valB ? 1 : valA < valB ? -1 : 0;
            } else {
                return valA < valB ? 1 : valA > valB ? -1 : 0;
            }
        });
        
        if (shouldRender) {
            // Перерендериваем все треки
            renderTagTracksFull();
        }
        
        // Обновляем подсветку если трек играет
        if (currentAlbum && currentAlbum.id === 'tag-tracks') {
            updateTagTrackHighlight();
        }
    }

    // Переменные для сортировки и пагинации треков по тегу
    let tagTracksSort = 'plays';
    let tagTracksOrder = 'desc';
    let tagTracksPage = 1;
    let tagTracksHasMore = true;
    let isLoadingTagTracks = false;
    const TAG_TRACKS_PER_PAGE = 20;
    
    function updateSortControlsForView(view) {
        const sortSelect = document.getElementById('sortSelect');
        const privacySelect = document.getElementById('privacySelect');
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        const sortControls = document.querySelector('.sort-controls');
        if (!sortSelect || !privacySelect || !sortOrderBtn) return;
        
        // Для tags view показываем только сортировку (без privacy)
        if (view === 'tags') {
            if (sortControls) {
                sortControls.style.display = 'flex';
                // Скрываем privacy select для тегов
                if (privacySelect.parentElement) {
                    privacySelect.parentElement.style.display = 'none';
                }
            }
            
            // Набор сортировок для треков по тегу
            sortSelect.innerHTML = `
                <option value="plays" ${tagTracksSort === 'plays' ? 'selected' : ''}>Total Plays</option>
                <option value="favorites" ${tagTracksSort === 'favorites' ? 'selected' : ''}>Total Favorites</option>
                <option value="name" ${tagTracksSort === 'name' ? 'selected' : ''}>Name</option>
            `;
            
            sortOrderBtn.textContent = tagTracksOrder === 'asc' ? '↑' : '↓';
            return;
        }
        
        // Для других views показываем полный контрол
        if (sortControls) {
            sortControls.style.display = 'flex';
            if (privacySelect.parentElement) {
                privacySelect.parentElement.style.display = 'flex';
            }
        }
        
        // Обновляем privacy select
        privacySelect.value = privacyFilter;
        
        // Единый набор сортировок для обоих разделов
        sortSelect.innerHTML = `
            <option value="created" ${(view === 'albums' ? currentSort : topTracksSort) === 'created' ? 'selected' : ''}>Date Created</option>
            <option value="name" ${(view === 'albums' ? currentSort : topTracksSort) === 'name' ? 'selected' : ''}>Name</option>
            <option value="plays" ${(view === 'albums' ? currentSort : topTracksSort) === 'plays' ? 'selected' : ''}>Total Plays</option>
            <option value="favorites" ${(view === 'albums' ? currentSort : topTracksSort) === 'favorites' ? 'selected' : ''}>Total Favorites</option>
        `;
        
        // Обновляем кнопку направления сортировки
        const currentOrderValue = view === 'albums' ? currentOrder : topTracksOrder;
        sortOrderBtn.textContent = currentOrderValue === 'asc' ? '↑' : '↓';
    }

    // Преобразуем клиентское значение сортировки в параметр API
    function getApiSortParam(sortValue, isTracks = false) {
        const sortMap = isTracks ? {
            // Для треков API использует title, а не name
            'name': 'title',
            'created': 'created_at',
            'plays': 'play_count',
            'favorites': 'favorite_count'
        } : {
            // Для плейлистов
            'name': 'name',
            'created': 'created_at',
            'plays': 'play_count',
            'favorites': 'favorite_count',
            'tracks': 'tracks_count'
        };
        return sortMap[sortValue] || 'created_at'; // По умолчанию сортируем по дате создания
    }

    // ==================== ПАГИНАЦИЯ (БЕСКОНЕЧНЫЙ СКРОЛЛ) ====================
    function setupInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading && hasMore) {
                loadMoreAlbums();
            }
        }, { rootMargin: '100px' });

        // Создаем элемент-якорь для отслеживания
        const sentinel = document.createElement('div');
        sentinel.id = 'scroll-sentinel';
        sentinel.style.height = '20px';
        document.body.appendChild(sentinel);

        observer.observe(sentinel);
    }

    // Создаем скелетон-заглушки
    function createSkeletonCards(count) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const card = document.createElement('div');
            card.className = 'album-card skeleton';
            card.innerHTML = `
                <div class="album-cover"></div>
                <div class="album-info">
                    <div class="album-title"></div>
                    <div class="album-meta"></div>
                </div>
            `;
            fragment.appendChild(card);
        }
        gallery.appendChild(fragment);
    }
    
    // Удаляем скелетоны
    function removeSkeletonCards() {
        document.querySelectorAll('.album-card.skeleton').forEach(el => el.remove());
    }

    async function loadMoreAlbums() {
        if (isLoading || !hasMore) return;
        
        isLoading = true;
        // Создаем скелетоны заранее, чтобы сетка не прыгала
        createSkeletonCards(itemsPerPage);

        try {
            // Формируем URL с параметрами серверной сортировки и фильтрации
            const sortParam = getApiSortParam(currentSort, false);
            const orderParam = currentOrder.toUpperCase();
            let url = `https://api.dj1.ru/api/playlists?page=${currentPage}&limit=${itemsPerPage}&sort=${sortParam}&order=${orderParam}`;
            
            // Фильтр публичности
            if (privacyFilter === 'public') {
                url += `&privacy=public`;
            }
            
            // Добавляем фильтр по автору BEST, если ID найден
            if (bestUserId) {
                url += `&user_id=${bestUserId}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load playlists');
            
            const data = await response.json();
            const playlists = data.data || [];
            const meta = data.meta || {};
            
            // Обновляем информацию о пагинации
            totalPages = meta.pages || 1;
            hasMore = currentPage < totalPages;
            
            if (playlists.length === 0 && !hasMore) {
                loadingEl.style.display = 'none';
                isLoading = false;
                return;
            }

            // Преобразуем плейлисты в альбомы (без загрузки треков)
            // Фильтруем только те, где больше 1 трека
            const newAlbums = playlists
                .filter(playlist => (playlist.tracks_count || 0) > 1)
                .map(playlist => ({
                    id: playlist.id,
                    title: playlist.name || 'Untitled Playlist',
                    cover: playlist.image_url || null,
                    tracksCount: playlist.tracks_count || 0,
                    totalPlays: playlist.total_play_count || 0,
                    totalFavorites: playlist.total_favorite_count || 0,
                    tracks: [] // Треки загрузим позже при необходимости
                }));

            // Удаляем скелетоны перед добавлением реальных данных
            removeSkeletonCards();
            
            // Добавляем новые альбомы
            if (newAlbums.length > 0) {
                albums = albums.concat(newAlbums);
                renderAlbums(newAlbums);
            }

            currentPage++;
            
        } catch (err) {
            console.error('Error loading albums:', err);
            removeSkeletonCards();
            errorEl.style.display = 'block';
            errorEl.textContent = 'Ошибка загрузки: ' + err.message;
        } finally {
            isLoading = false;
            loadingEl.style.display = hasMore ? 'block' : 'none';
        }
    }

    // Ленивая загрузка треков альбома
    async function loadAlbumTracks(albumId) {
        // Проверяем кэш
        if (albumTracksCache.has(albumId)) {
            return albumTracksCache.get(albumId);
        }

        try {
            const response = await fetch(`https://api.dj1.ru/api/playlists/${albumId}`);
            if (!response.ok) throw new Error('Failed to load playlist details');
            
            const data = await response.json();
            const tracks = data.tracks || [];
            
            // Преобразуем треки
            const albumTracks = tracks.map(track => ({
                name: track.title,
                file: track.audio_url || track.full_url || null,
                cover: track.image_url || null,
                duration: track.duration_s || null,
                sound: track.sound || null,
                lyrics: track.lyrics || null,
                model: track.model_display_name || null
            }));

            // Сохраняем в кэш
            albumTracksCache.set(albumId, albumTracks);
            
            return albumTracks;
        } catch (err) {
            console.warn(`Failed to load tracks for album ${albumId}:`, err);
            return [];
        }
    }

    function renderAlbums(albumsToRender) {
        // Ищем скелетоны для замены
        const skeletons = document.querySelectorAll('.album-card.skeleton');
        
        albumsToRender.forEach((album, index) => {
            let card;
            // Если есть скелетон — заменяем его, иначе создаем новый
            if (skeletons[index]) {
                card = skeletons[index];
                card.className = 'album-card';
                card.innerHTML = '';
            } else {
                card = document.createElement('div');
                card.className = 'album-card';
                gallery.appendChild(card);
            }
            card.dataset.albumId = album.id;
            
            const safeTitle = escapeHtml(album.title);
            const coverHtml = album.cover 
                ? `<img class="album-cover" src="${album.cover}" alt="${safeTitle}" loading="lazy">`
                : `<div class="album-cover" style="background:#2a2a2a; display:flex; align-items:center; justify-content:center; color:#666;">📀</div>`;
            
            card.innerHTML = `
                ${coverHtml}
                <div class="album-info">
                    <div class="album-title">${safeTitle}</div>
                    <div class="album-meta">${album.tracksCount} tracks</div>
                </div>
            `;
            
            card.addEventListener('click', async () => {
                if (!playerBar.classList.contains('active')) {
                    playerBar.classList.add('active');
                }

                // Ленивая загрузка треков при первом открытии
                if (album.tracks.length === 0) {
                    // Показываем индикатор загрузки в плейлисте
                    playlistAlbumTitle.textContent = album.title;
                    playlistContainer.innerHTML = `
                        <div class="playlist-loading">
                            <div class="loading-spinner"></div>
                            <span>Загрузка треков...</span>
                        </div>
                    `;
                    if (!playlistVisible) {
                        togglePlaylistPanel();
                    }
                    
                    loadingEl.style.display = 'block';
                    album.tracks = await loadAlbumTracks(album.id);
                    loadingEl.style.display = 'none';
                    
                    // Обновляем обложку альбома из первого трека, если её не было
                    if (!album.cover && album.tracks.length > 0 && album.tracks[0].cover) {
                        album.cover = album.tracks[0].cover;
                        // Обновляем отображение обложки в карточке
                        const coverImg = card.querySelector('.album-cover');
                        if (coverImg) {
                            coverImg.outerHTML = `<img class="album-cover" src="${album.cover}" alt="${album.title}" loading="lazy">`;
                        }
                    }
                }

                if (currentAlbum !== album) {
                    currentAlbum = album;
                    renderPlaylist();
                    playlistAlbumTitle.textContent = album.title;
                    if (!playlistVisible) {
                        togglePlaylistPanel();
                    }
                    if (currentTrackIndex === -1) {
                        currentAlbumName.textContent = album.title;
                        currentTrackCover.src = album.cover || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23333\'/%3E%3C/svg%3E';
                    }
                } else {
                    togglePlaylistPanel();
                }
            });
        });

        // Плавное появление новых элементов без смещения
        if (typeof gsap !== 'undefined') {
            gsap.fromTo('.album-card:not(.animated)', 
                { opacity: 0, scale: 0.95 },
                { opacity: 1, scale: 1, duration: 0.3, stagger: 0.03, ease: 'power2.out', onComplete: function() {
                    document.querySelectorAll('.album-card').forEach(card => card.classList.add('animated'));
                }}
            );
        }
        
        // Фоновая загрузка обложек для альбомов без обложек
        albumsToRender.forEach(album => {
            if (!album.cover) {
                loadCoverForAlbum(album);
            }
        });
    }
    
    // Фоновая загрузка обложки альбома из первого трека
    async function loadCoverForAlbum(album) {
        try {
            // Загружаем треки альбома
            const tracks = await loadAlbumTracks(album.id);
            
            // Если есть треки с обложками, берем первую
            if (tracks.length > 0) {
                const firstTrackWithCover = tracks.find(t => t.cover);
                if (firstTrackWithCover) {
                    album.cover = firstTrackWithCover.cover;
                    
                    // Обновляем отображение в карточке
                    const card = document.querySelector(`.album-card[data-album-id="${album.id}"]`);
                    if (card) {
                        const coverImg = card.querySelector('.album-cover');
                        if (coverImg) {
                            coverImg.outerHTML = `<img class="album-cover" src="${album.cover}" alt="${album.title}" loading="lazy">`;
                        }
                    }
                }
            }
        } catch (err) {
            console.warn(`Failed to load cover for album ${album.id}:`, err);
        }
    }

    // ==================== ЛОГИКА ПЛЕЕРА ====================
    function selectTrack(album, trackIndex) {
        if (!playerBar.classList.contains('active')) {
            playerBar.classList.add('active');
        }

        // Убираем класс playing со всех карточек
        document.querySelectorAll('.album-card.playing, .top-track-item.playing').forEach(el => {
            el.classList.remove('playing');
        });

        if (currentAlbum !== album) {
            currentAlbum = album;
            renderPlaylist();
            playlistAlbumTitle.textContent = album.title;
        }
        
        // Добавляем класс playing на текущий альбом
        const albumCard = document.querySelector(`.album-card[data-album-id="${album.id}"]`);
        if (albumCard) {
            albumCard.classList.add('playing');
        }
        
        // Сохраняем состояние плеера
        savePlayerState(album, trackIndex);
        
        const track = album.tracks[trackIndex];
        if (!track) return;
        
        currentTrackIndex = trackIndex;
        
        // 🔥 FIX: Обновляем выделение ПОСЛЕ установки currentTrackIndex
        if (album.id === 'top-tracks') {
            updateTopTrackHighlight();
        } else if (album.id === 'tag-tracks') {
            updateTagTrackHighlight();
        }
        
        // Останавливаем текущее воспроизведение перед сменой источника
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        }
        
        audioPlayer.src = track.file;
        
        // Используем Promise для избежания конфликтов
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                if (err.name !== 'AbortError') {
                    console.warn('Play error:', err);
                }
            });
        }
        
        currentTrackName.textContent = track.name;
        currentAlbumName.textContent = album.title;
        // textContent автоматически экранирует HTML
        
        // Обновляем title страницы для отображения на экране блокировки
        document.title = `${track.name} — ${album.title}`;
        
        let coverSrc = track.cover || album.cover;
        currentTrackCover.src = coverSrc || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23333\'/%3E%3C/svg%3E';
        
        highlightPlaylistItem(trackIndex);
        
        if (shuffleOn) {
            generateShuffleIndices();
            shuffleCurrentIndex = shuffleIndices.indexOf(trackIndex);
        }
    }

    function playCurrent() {
        if (currentTrackIndex === -1) {
            if (currentAlbum && currentAlbum.tracks.length > 0) {
                selectTrack(currentAlbum, 0);
            }
        } else {
            audioPlayer.play();
        }
    }

    function pauseCurrent() {
        audioPlayer.pause();
    }

    function togglePlayPause() {
        if (audioPlayer.paused) {
            playCurrent();
        } else {
            pauseCurrent();
        }
    }

    function nextTrack() {
        if (!currentAlbum || currentTrackIndex === -1) return;
        
        if (shuffleOn) {
            if (shuffleIndices.length === 0) generateShuffleIndices();
            let nextShuffleIndex = shuffleCurrentIndex + 1;
            if (nextShuffleIndex >= shuffleIndices.length) {
                if (repeatMode === REPEAT_ALL) {
                    nextShuffleIndex = 0; // Бесконечное повторение
                } else if (repeatMode === REPEAT_ONE) {
                    audioPlayer.currentTime = 0;
                    audioPlayer.play();
                    return;
                } else {
                    // По умолчанию — повторяем плейлист с начала
                    nextShuffleIndex = 0;
                }
            }
            shuffleCurrentIndex = nextShuffleIndex;
            const newTrackIndex = shuffleIndices[shuffleCurrentIndex];
            selectTrack(currentAlbum, newTrackIndex);
        } else {
            let nextIndex = currentTrackIndex + 1;
            if (nextIndex >= currentAlbum.tracks.length) {
                if (repeatMode === REPEAT_ALL) {
                    nextIndex = 0; // Бесконечное повторение
                } else if (repeatMode === REPEAT_ONE) {
                    audioPlayer.currentTime = 0;
                    audioPlayer.play();
                    return;
                } else {
                    // По умолчанию — повторяем плейлист с начала
                    nextIndex = 0;
                }
            }
            selectTrack(currentAlbum, nextIndex);
        }
        
        // 🔥 FIX: Прокручиваем к текущему треку с задержкой (DOM должен обновиться)
        setTimeout(() => {
            if (currentView === 'top-tracks') {
                scrollToCurrentTopTrack();
                updateTopTrackHighlight();
            } else if (currentView === 'tags') {
                scrollToCurrentTagTrack();
                updateTagTrackHighlight();
            }
        }, 100);
    }

    function prevTrack() {
        if (!currentAlbum || currentTrackIndex === -1) return;
        
        if (shuffleOn) {
            if (shuffleIndices.length === 0) generateShuffleIndices();
            let prevShuffleIndex = shuffleCurrentIndex - 1;
            if (prevShuffleIndex < 0) {
                if (repeatMode === REPEAT_ALL) {
                    prevShuffleIndex = shuffleIndices.length - 1;
                } else if (repeatMode === REPEAT_ONE) {
                    audioPlayer.currentTime = 0;
                    audioPlayer.play();
                    return;
                } else {
                    return;
                }
            }
            shuffleCurrentIndex = prevShuffleIndex;
            const newTrackIndex = shuffleIndices[shuffleCurrentIndex];
            selectTrack(currentAlbum, newTrackIndex);
        } else {
            let prevIndex = currentTrackIndex - 1;
            if (prevIndex < 0) {
                if (repeatMode === REPEAT_ALL) {
                    prevIndex = currentAlbum.tracks.length - 1;
                } else if (repeatMode === REPEAT_ONE) {
                    audioPlayer.currentTime = 0;
                    audioPlayer.play();
                    return;
                } else {
                    return;
                }
            }
            selectTrack(currentAlbum, prevIndex);
        }
        
        // 🔥 FIX: Прокручиваем к текущему треку с задержкой
        setTimeout(() => {
            if (currentView === 'top-tracks') {
                scrollToCurrentTopTrack();
                updateTopTrackHighlight();
            } else if (currentView === 'tags') {
                scrollToCurrentTagTrack();
                updateTagTrackHighlight();
            }
        }, 100);
    }

    function generateShuffleIndices() {
        if (!currentAlbum) return;
        const n = currentAlbum.tracks.length;
        shuffleIndices = Array.from({length: n}, (_, i) => i);
        for (let i = shuffleIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffleIndices[i], shuffleIndices[j]] = [shuffleIndices[j], shuffleIndices[i]];
        }
        if (currentTrackIndex >= 0) {
            shuffleCurrentIndex = shuffleIndices.indexOf(currentTrackIndex);
            if (shuffleCurrentIndex === -1) {
                shuffleIndices.unshift(currentTrackIndex);
                shuffleCurrentIndex = 0;
            }
        } else {
            shuffleCurrentIndex = 0;
        }
    }

    function toggleShuffle() {
        if (!currentAlbum) return;
        shuffleOn = !shuffleOn;
        if (shuffleOn) {
            generateShuffleIndices();
        } else {
            shuffleIndices = [];
        }
        updateShuffleButton();
    }

    function toggleRepeat() {
        repeatMode = (repeatMode + 1) % 3;
        updateRepeatButton();
    }

    function updateShuffleButton() {
        if (shuffleOn) {
            shuffleBtn.classList.add('active');
        } else {
            shuffleBtn.classList.remove('active');
        }
    }

    function updateRepeatButton() {
        // REPEAT_NONE = 0 (не активен), REPEAT_ONE = 1, REPEAT_ALL = 2 (активны)
        if (repeatMode === REPEAT_NONE) {
            repeatBtn.classList.remove('active');
        } else {
            repeatBtn.classList.add('active');
        }
    }

    function renderPlaylist() {
        if (!currentAlbum) {
            playlistContainer.innerHTML = '<div style="padding: 1rem; color: var(--text-secondary);">Выберите альбом</div>';
            return;
        }
        
        playlistContainer.innerHTML = '';
        currentAlbum.tracks.forEach((track, idx) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (idx === currentTrackIndex) item.classList.add('active');
            
            let coverSrc = track.cover || currentAlbum.cover;
            const coverImg = coverSrc ? coverSrc : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23333\'/%3E%3C/svg%3E';
            
            item.innerHTML = `
                <img class="playlist-item-cover" src="${coverImg}" alt="">
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${escapeHtml(track.name)}</div>
                    <div class="playlist-item-album">${escapeHtml(currentAlbum.title)}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                selectTrack(currentAlbum, idx);
                if (playlistVisible) togglePlaylistPanel();
            });
            
            playlistContainer.appendChild(item);
        });
    }

    function highlightPlaylistItem(index) {
        const items = playlistContainer.querySelectorAll('.playlist-item');
        items.forEach((item, i) => {
            if (i === index) item.classList.add('active');
            else item.classList.remove('active');
        });
    }
    
    // 🔥 NEW: Подсветка элемента плейлиста по ID трека
    function highlightPlaylistItemById(trackId) {
        const items = playlistContainer.querySelectorAll('.playlist-item');
        items.forEach(item => {
            const itemId = item.dataset.trackId;
            if (itemId === trackId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function togglePlaylistPanel() {
        playlistVisible = !playlistVisible;
        if (playlistVisible) {
            playlistPanel.classList.add('open');
            overlay.classList.add('visible');
            if (currentAlbum) {
                playlistAlbumTitle.textContent = currentAlbum.title;
                renderPlaylist();
            } else {
                playlistAlbumTitle.textContent = 'Плейлист';
                renderPlaylist();
            }
        } else {
            playlistPanel.classList.remove('open');
            overlay.classList.remove('visible');
        }
    }

    // ==================== ТЕМА ====================
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = themeToggle?.querySelector('.sun');
    const moonIcon = themeToggle?.querySelector('.moon');

    function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
    // Сообщаем rays.js, что тема изменилась
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    // Устанавливаем сохранённую тему
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // ==================== УСТАНОВКА РЕЖИМА ПОВТОРА ПО УМОЛЧАНИЮ ====================
    updateRepeatButton();

    // ==================== СОБЫТИЯ ПЛЕЕРА ====================
    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        const errorMsg = audioPlayer.error 
            ? `Ошибка загрузки аудио (код: ${audioPlayer.error.code})`
            : 'Ошибка загрузки аудио';
        currentTrackName.textContent = errorMsg;
        currentTrackName.style.color = '#f87171';
        setTimeout(() => {
            currentTrackName.style.color = '';
        }, 3000);
    });

    audioPlayer.addEventListener('loadstart', () => {
        currentTrackName.style.opacity = '0.7';
    });

    audioPlayer.addEventListener('canplay', () => {
        currentTrackName.style.opacity = '1';
    });

    audioPlayer.addEventListener('ended', () => {
        if (repeatMode === REPEAT_ONE) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            nextTrack();
        }
    });

    audioPlayer.addEventListener('play', () => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    });

    audioPlayer.addEventListener('pause', () => {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    });

    // Обновление прогресс бара
    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration && progressFill) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressFill.style.width = progress + '%';
        }
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        }
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        if (durationEl) {
            durationEl.textContent = formatTime(audioPlayer.duration);
        }
    });

    // Клик по прогресс бару для перемотки
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (audioPlayer.duration) {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const progress = clickX / rect.width;
                audioPlayer.currentTime = progress * audioPlayer.duration;
            }
        });
    }

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    playPauseBtn.addEventListener('click', togglePlayPause);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);

    togglePlaylist.addEventListener('click', togglePlaylistPanel);
    closePlaylist.addEventListener('click', togglePlaylistPanel);
    overlay.addEventListener('click', togglePlaylistPanel);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && playlistVisible) {
            togglePlaylistPanel();
        }
    });

    pauseIcon.style.display = 'none';

    // ==================== ТОП ТРЕКОВ ====================
    // Функция переключения вида (albums / top-tracks)
    // ⚠️ CRITICAL: Переключение между видами
    // 🔒 LOCKED: Очищает observer и таймеры ПЕРЕД переключением!
    // Зависимости: currentView, gallery, topTracksView, tagsView
    // Порядок: cleanup → switch → load data → setup new view
    function switchView(view) {
        if (view === currentView) return;
        
        // Обновляем активный таб
        if (viewTabs) {
            viewTabs.querySelectorAll('.view-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.view === view);
            });
        }
        
        // Сохраняем выбор
        currentView = view;
        localStorage.setItem('currentView', view);
        
        // Переключаем вид
        updateSortControlsForView(view);
        
        // Скрываем все виды
        gallery.style.display = 'none';
        topTracksView.style.display = 'none';
        tagsView.style.display = 'none';
        
        if (view === 'albums') {
            gallery.style.display = 'grid';
            loadingEl.style.display = hasMore ? 'block' : 'none';
        } else if (view === 'top-tracks') {
            topTracksView.style.display = 'block';
            loadingEl.style.display = topTracksHasMore ? 'block' : 'none';
            if (topTracks.length === 0) {
                loadTopTracks();
            }
        } else if (view === 'tags') {
            tagsView.style.display = 'block';
            loadingEl.style.display = tagTracksHasMore && currentTag ? 'block' : 'none';
            if (!allTagsLoaded) {
                loadAllTags();
            }
            // Обновляем подсветку если играет трек из тегов
            setTimeout(() => {
                if (currentAlbum && currentAlbum.id === 'tag-tracks') {
                    updateTagTrackHighlight();
                }
            }, 100);
        }
    }

    function initViewTabs() {
        if (!viewTabs) return;
        
        // Восстанавливаем сохраненный вид при загрузке
        const savedView = localStorage.getItem('currentView') || 'albums';
        currentView = savedView;
        
        // Устанавливаем активный таб
        viewTabs.querySelectorAll('.view-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.view === savedView);
        });
        
        // Применяем начальное состояние без прокрутки
        if (savedView === 'top-tracks') {
            gallery.style.display = 'none';
            topTracksView.style.display = 'block';
            updateSortControlsForView('top-tracks');
            loadTopTracks();
        } else if (savedView === 'tags') {
            gallery.style.display = 'none';
            tagsView.style.display = 'block';
            updateSortControlsForView('tags');
            loadAllTags();
        } else {
            updateSortControlsForView('albums');
        }
        
        viewTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.view-tab');
            if (!tab) return;
            
            const view = tab.dataset.view;
            switchView(view);
        });
    }

    // ⚠️ CRITICAL: Загрузка топа треков (API pagination)
    // 🔒 LOCKED: Эталонная реализация пагинации ✅
    // Зависимости: topTracksPage, topTracksHasMore, bestUserId
    // Отличия от Tags: НЕТ IntersectionObserver, браузер скроллит сам
    async function loadTopTracks() {
        if (isLoadingTopTracks || !topTracksHasMore) return;
        
        // Ждем загрузки bestUserId если он еще не загружен
        if (!bestUserId) {
            console.log('Waiting for BEST user ID...');
            setTimeout(() => loadTopTracks(), 100);
            return;
        }
        
        isLoadingTopTracks = true;
        loadingEl.style.display = 'block';
        
        try {
            const sortParam = getApiSortParam(topTracksSort, true);
            const orderParam = topTracksOrder.toUpperCase();
            let url = `https://api.dj1.ru/api/tracks?page=${topTracksPage}&limit=20&sort=${sortParam}&order=${orderParam}`;
            
            // Фильтр публичности
            if (privacyFilter === 'public') {
                url += `&privacy=public`;
            }
            
            // Фильтр по автору BEST (используем author_id для треков)
            url += `&author_id=${bestUserId}`;
            
            console.log('Top Tracks URL:', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load tracks');
            
            const data = await response.json();
            const tracks = data.data || [];
            const meta = data.meta || {};
            
            topTracksHasMore = topTracksPage < (meta.pages || 1);
            
            const newTracks = tracks.map((track, index) => ({
                id: track.id,
                name: track.title,
                file: track.audio_url || track.full_url || null,
                cover: track.image_url || null,
                duration: track.duration_s || null,
                plays: track.play_count || 0,
                favorites: track.favorite_count || 0,
                rank: (topTracksPage - 1) * 20 + index + 1,
                sound: track.sound || null,
                lyrics: track.lyrics || null,
                model: track.model_display_name || null
            }));
            
            if (newTracks.length > 0) {
                topTracks = topTracks.concat(newTracks);
                renderTopTracks(newTracks);
            }
            
            topTracksPage++;
        } catch (err) {
            console.error('Error loading top tracks:', err);
        } finally {
            isLoadingTopTracks = false;
            loadingEl.style.display = topTracksHasMore ? 'block' : 'none';
        }
    }

    function renderTopTracks(tracksToRender) {
        if (topTracksPage === 1) {
            topTracksView.innerHTML = `
                <div class="top-tracks-list" id="topTracksList"></div>
            `;
        }
        
        const list = document.getElementById('topTracksList');
        const isPlayingFromTop = currentAlbum && currentAlbum.id === 'top-tracks';
        
        tracksToRender.forEach((track, index) => {
            const item = document.createElement('div');
            // 🔥 FIX: Ищем текущий трек по ID вместо использования индекса
            const isCurrentTrack = isPlayingFromTop && currentAlbum.tracks[currentTrackIndex]?.id === track.id;
            item.className = 'top-track-item' + (isCurrentTrack ? ' playing' : '');
            item.dataset.trackId = track.id;
            item.innerHTML = `
                <div class="top-track-rank">#${track.rank}</div>
                <img class="top-track-cover" src="${track.cover || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23333\'/%3E%3C/svg%3E'}" alt="">
                <div class="top-track-info">
                    <div class="top-track-name">${escapeHtml(track.name)}</div>
                    <div class="top-track-stats">
                        <span class="top-track-stat">▶ ${formatNumber(track.plays)}</span>
                        <span class="top-track-stat">♥ ${formatNumber(track.favorites)}</span>
                    </div>
                </div>
                <button class="top-track-play" title="Воспроизвести">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            `;
            
            // Клик на всю карточку для play/pause
            item.addEventListener('click', (e) => {
                const isCurrentTrack = currentAlbum && currentAlbum.id === 'top-tracks' && 
                                      currentAlbum.tracks[currentTrackIndex]?.id === track.id;
                
                if (isCurrentTrack && !audioPlayer.paused) {
                    // Если это текущий трек и он играет — ставим на паузу
                    audioPlayer.pause();
                } else {
                    // Иначе запускаем трек
                    playTopTrack(track);
                }
            });
            
            list.appendChild(item);
        });
    }

    // Восстановление плеера для топа треков без автовоспроизведения
    function restoreTopTrackPlayer(track, currentTime) {
        if (!playerBar.classList.contains('active')) {
            playerBar.classList.add('active');
        }
        
        // Убираем класс playing со всех карточек
        document.querySelectorAll('.album-card.playing, .top-track-item.playing').forEach(el => {
            el.classList.remove('playing');
        });
        
        // 🔥 FIX: Ищем трек по data-track-id вместо использования индекса
        const currentTrackElement = document.querySelector(`.top-track-item[data-track-id="${track.id}"]`);
        if (currentTrackElement) {
            currentTrackElement.classList.add('playing');
            // Прокручиваем к элементу
            setTimeout(() => {
                currentTrackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        
        // Создаем виртуальный альбом для трека (сохраняем все поля)
        currentAlbum = {
            id: 'top-tracks',
            title: '🔥 Top Tracks',
            cover: track.cover,
            tracks: topTracks.map(t => ({
                name: t.name,
                file: t.file,
                cover: t.cover,
                duration: t.duration,
                sound: t.sound,
                lyrics: t.lyrics,
                model: t.model
            }))
        };
        
        audioPlayer.src = track.file;
        audioPlayer.currentTime = currentTime;
        
        // Обновляем UI без воспроизведения
        currentTrackName.textContent = track.name;
        currentAlbumName.textContent = '🔥 Top Tracks';
        currentTrackCover.src = track.cover || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23333\'/%3E%3C/svg%3E';
        
        // Обновляем title (без воспроизведения — показываем что на паузе)
        document.title = `⏸ ${track.name} — 🔥 Top Tracks`;
        
        playlistAlbumTitle.textContent = '🔥 Top Tracks';
        renderPlaylist();
        highlightPlaylistItemById(track.id);
    }
    
    // ⚠️ CRITICAL: Восстановление состояния плеера для Tags
    // 🔒 LOCKED: Вызывать ПОСЛЕ selectTrack() для сохранения позиции
    // Зависимости: tagTracks, currentTag
    function restoreTagTrackPlayer(track, currentTime) {
        if (!playerBar.classList.contains('active')) {
            playerBar.classList.add('active');
        }
        
        // Убираем класс playing со всех карточек
        document.querySelectorAll('.album-card.playing, .top-track-item.playing').forEach(el => {
            el.classList.remove('playing');
        });
        
        // 🔥 FIX: Ищем трек по data-track-id вместо использования индекса
        const currentTrackElement = document.querySelector(`.top-track-item[data-track-id="${track.id}"]`);
        if (currentTrackElement) {
            currentTrackElement.classList.add('playing');
        }
        
        // Находим индекс трека для виртуального альбома
        const trackIndex = tagTracks.findIndex(t => t.id === track.id);
        
        // Создаем виртуальный альбом для трека
        currentAlbum = {
            id: 'tag-tracks',
            title: `🏷️ ${currentTag}`,
            cover: track.cover,
            tracks: tagTracks.map(t => ({
                name: t.name,
                file: t.file,
                cover: t.cover,
                duration: t.duration,
                sound: t.sound,
                lyrics: t.lyrics,
                model: t.model
            }))
        };
        
        audioPlayer.src = track.file;
        audioPlayer.currentTime = currentTime;
        
        // Обновляем UI без воспроизведения
        currentTrackName.textContent = track.name;
        currentAlbumName.textContent = `🏷️ ${currentTag}`;
        currentTrackCover.src = track.cover || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23333\'/%3E%3C/svg%3E';
        
        // Обновляем title (без воспроизведения — показываем что на паузе)
        document.title = `⏸ ${track.name} — 🏷️ ${currentTag}`;
        
        playlistAlbumTitle.textContent = `🏷️ ${currentTag}`;
        renderPlaylist();
        highlightPlaylistItemById(track.id);
    }

    function playTopTrack(track) {
        if (!playerBar.classList.contains('active')) {
            playerBar.classList.add('active');
        }
        
        // Убираем класс playing со всех карточек
        document.querySelectorAll('.album-card.playing, .top-track-item.playing').forEach(el => {
            el.classList.remove('playing');
        });
        
        // 🔥 FIX: Ищем трек по data-track-id вместо использования индекса
        const currentTrackElement = document.querySelector(`.top-track-item[data-track-id="${track.id}"]`);
        if (currentTrackElement) {
            currentTrackElement.classList.add('playing');
            // Прокручиваем к текущему треку
            setTimeout(() => {
                currentTrackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        
        // Создаем виртуальный альбом для трека (сохраняем все поля включая sound и lyrics)
        currentAlbum = {
            id: 'top-tracks',
            title: '🔥 Top Tracks',
            cover: track.cover,
            tracks: topTracks.map(t => ({
                name: t.name,
                file: t.file,
                cover: t.cover,
                duration: t.duration,
                sound: t.sound,
                lyrics: t.lyrics,
                model: t.model
            }))
        };
        
        selectTrack(currentAlbum, topTracks.findIndex(t => t.id === track.id));
        
        playlistAlbumTitle.textContent = '🔥 Top Tracks';
        renderPlaylist();
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    // Прокручиваем к текущему треку в топе
    function scrollToCurrentTopTrack() {
        if (currentView !== 'top-tracks' || !currentAlbum || currentAlbum.id !== 'top-tracks') return;
        
        // 🔥 FIX: Ищем активный элемент вместо использования индекса
        const currentItem = document.querySelector('.top-track-item.playing');
        
        if (currentItem) {
            currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Обновляем выделение текущего трека в топе
    function updateTopTrackHighlight() {
        if (currentView !== 'top-tracks' || !currentAlbum || currentAlbum.id !== 'top-tracks') return;
        
        // Убираем выделение со всех
        document.querySelectorAll('.top-track-item.playing').forEach(el => {
            el.classList.remove('playing');
        });
        
        // 🔥 FIX: Ищем трек по ID в currentAlbum
        const trackId = currentAlbum.tracks[currentTrackIndex]?.id;
        if (trackId) {
            const currentTrackElement = document.querySelector(`.top-track-item[data-track-id="${trackId}"]`);
            if (currentTrackElement) {
                currentTrackElement.classList.add('playing');
            }
        }
    }
    
    // Сохраняем состояние плеера в localStorage
    function savePlayerState(album, trackIndex) {
        const state = {
            albumId: album.id,
            albumTitle: album.title,
            albumCover: album.cover,
            trackIndex: trackIndex,
            trackId: album.tracks[trackIndex]?.id, // 🔥 FIX: Сохраняем ID трека
            currentTime: audioPlayer.currentTime || 0,
            isPlaying: !audioPlayer.paused,
            timestamp: Date.now()
        };
        localStorage.setItem('playerState', JSON.stringify(state));
    }
    
    // Восстанавливаем состояние плеера
    async function restorePlayerState(retryCount = 0) {
        const saved = localStorage.getItem('playerState');
        if (!saved) return;
        
        try {
            const state = JSON.parse(saved);
            // Проверяем что состояние не старше 24 часов
            if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('playerState');
                return;
            }
            
            // Если это топ треков — восстанавливаем из сохранённых данных
            if (state.albumId === 'top-tracks') {
                // Переключаемся на топ треков
                switchView('top-tracks');
                
                // Функция для восстановления с повторными попытками
                const restoreTopTrack = (attempt = 0) => {
                    if (attempt > 10) {
                        console.warn('Failed to restore top track after retries');
                        return;
                    }
                    
                    // 🔥 FIX: Проверяем что треки загружены И ищем трек по ID
                    if (topTracks.length > 0) {
                        // Ищем трек по ID вместо индекса (индекс мог измениться)
                        const track = topTracks.find(t => t.id === state.trackId);
                        
                        if (track) {
                            // Восстанавливаем плеер сразу (без автовоспроизведения)
                            restoreTopTrackPlayer(track, state.currentTime || 0);
                            // Прокручиваем к треку
                            setTimeout(() => scrollToCurrentTopTrack(), 500);
                        } else {
                            console.warn('Track not found by ID:', state.trackId);
                        }
                    } else {
                        // Треки ещё не загружены — пробуем ещё раз
                        console.log('Waiting for top tracks to load... attempt', attempt + 1);
                        setTimeout(() => restoreTopTrack(attempt + 1), 1000);
                    }
                };
                
                // Запускаем восстановление
                setTimeout(() => restoreTopTrack(), 1000);
                return;
            }
            
            // Если это треки по тегу — восстанавливаем
            if (state.albumId === 'tag-tracks' && state.albumTitle) {
                // Извлекаем тег из названия (🏷️ Tag Name)
                const tagMatch = state.albumTitle.match(/🏷️\s*(.+)/);
                if (tagMatch) {
                    const savedTag = tagMatch[1];
                    
                    // Переключаемся на теги
                    switchView('tags');
                    
                    // Функция для восстановления
                    const restoreTagTrack = (attempt = 0) => {
                        if (attempt > 10) {
                            console.warn('Failed to restore tag track after retries');
                            return;
                        }
                        
                        // Проверяем что теги загружены
                        if (allTagsLoaded && window.tagsData) {
                            // Выбираем сохранённый тег
                            selectTag(savedTag);
                            
                            // Восстанавливаем плеер после выбора тега
                            setTimeout(() => {
                                if (tagTracks.length > 0) {
                                    // 🔥 FIX: Ищем трек по ID вместо индекса
                                    const track = tagTracks.find(t => t.id === state.trackId);
                                                        
                                    if (track) {
                                        // Восстанавливаем без автовоспроизведения
                                        restoreTagTrackPlayer(track, state.currentTime || 0);
                                        // Подсвечиваем и прокручиваем
                                        setTimeout(() => updateTagTrackHighlight(), 500);
                                    } else {
                                        console.warn('Tag track not found by ID:', state.trackId);
                                    }
                                }
                            }, 500);
                        } else {
                            console.log('Waiting for tags to load... attempt', attempt + 1);
                            setTimeout(() => restoreTagTrack(attempt + 1), 1000);
                        }
                    };
                    
                    setTimeout(() => restoreTagTrack(), 1000);
                    return;
                }
            }
            
            // Ищем альбом в уже загруженных
            const album = albums.find(a => a.id === state.albumId);
            if (album && album.tracks.length > 0) {
                // Альбом найден и треки загружены
                restoreTrackState(album, state);
            } else if (album) {
                // Альбом найден но треки не загружены — загружаем
                album.tracks = await loadAlbumTracks(album.id);
                restoreTrackState(album, state);
            } else if (retryCount < 5) {
                // Альбом не найден — пробуем ещё раз через 2 секунды
                // (возможно, ещё не загрузился через пагинацию)
                console.log(`Album ${state.albumId} not found, retrying... (${retryCount + 1}/5)`);
                setTimeout(() => restorePlayerState(retryCount + 1), 2000);
            } else {
                console.warn('Album not found after retries:', state.albumId);
            }
        } catch (err) {
            console.warn('Failed to restore player state:', err);
        }
    }
    
    function restoreTrackState(album, state) {
        if (state.trackIndex >= 0 && state.trackIndex < album.tracks.length) {
            currentAlbum = album;
            currentTrackIndex = state.trackIndex;
            
            const track = album.tracks[state.trackIndex];
            audioPlayer.src = track.file;
            audioPlayer.currentTime = state.currentTime || 0;
            
            // Обновляем UI
            currentTrackName.textContent = track.name;
            currentAlbumName.textContent = album.title;
            currentTrackCover.src = track.cover || album.cover || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23333\'/%3E%3C/svg%3E';
            
            // Обновляем title (без воспроизведения — показываем что на паузе)
            document.title = `⏸ ${track.name} — ${album.title}`;
            
            playerBar.classList.add('active');
            playlistAlbumTitle.textContent = album.title;
            renderPlaylist();
            highlightPlaylistItem(state.trackIndex);
            
            // Добавляем индикатор playing
            const albumCard = document.querySelector(`.album-card[data-album-id="${album.id}"]`);
            if (albumCard) {
                albumCard.classList.add('playing');
            }
        }
    }
    
    // Сохраняем позицию при паузе/воспроизведении
    audioPlayer.addEventListener('pause', () => {
        if (currentAlbum && currentTrackIndex >= 0) {
            savePlayerState(currentAlbum, currentTrackIndex);
        }
        // Возвращаем оригинальный title
        document.title = 'DJ1.RU — Music Library';
    });
    
    audioPlayer.addEventListener('play', () => {
        if (currentAlbum && currentTrackIndex >= 0) {
            savePlayerState(currentAlbum, currentTrackIndex);
            // Восстанавливаем title с текущим треком
            const track = currentAlbum.tracks[currentTrackIndex];
            if (track) {
                document.title = `${track.name} — ${currentAlbum.title}`;
            }
        }
    });
    
    // Периодически сохраняем позицию во время воспроизведения
    setInterval(() => {
        if (currentAlbum && currentTrackIndex >= 0 && !audioPlayer.paused) {
            savePlayerState(currentAlbum, currentTrackIndex);
        }
    }, 5000); // Каждые 5 секунд

    // Бесконечный скролл для топа треков
    function setupTopTracksInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && currentView === 'top-tracks' && !isLoadingTopTracks && topTracksHasMore) {
                loadTopTracks();
            }
        }, { rootMargin: '100px' });
        
        observer.observe(loadingEl);
    }

    // ==================== BY TAGS VIEW ====================
    
    // Загружаем статичный JSON с тегами (с категориями)
    async function loadAllTags() {
        try {
            const response = await fetch('data/tags-data.json');
            if (!response.ok) throw new Error('Failed to load tags data');
            
            const data = await response.json();
            
            // Сохраняем полные данные
            window.tagsData = data;
            
            // Собираем все теги из категорий
            allTags = [];
            
            // Из категорий
            if (data.categories) {
                Object.entries(data.categories).forEach(([catKey, catData]) => {
                    Object.entries(catData.tags).forEach(([tagKey, tagInfo]) => {
                        allTags.push({
                            tag: tagKey,
                            count: tagInfo.count,
                            displayName: tagInfo.displayName || tagKey,
                            category: catData.label
                        });
                    });
                });
            }
            
            // Из популярных без категории
            if (data.popularTags) {
                Object.entries(data.popularTags).forEach(([tag, info]) => {
                    allTags.push({
                        tag: tag,
                        count: info.count,
                        displayName: tag,
                        category: 'Popular'
                    });
                });
            }
            
            // Сортируем по популярности
            allTags.sort((a, b) => b.count - a.count);
            
            allTagsLoaded = true;
            renderTagsCloud();
            
            console.log(`Loaded ${allTags.length} tags from static file`);
            
        } catch (err) {
            console.error('Error loading tags:', err);
        }
    }
    
    // Рендерим облако тегов с категориями
    function renderTagsCloud() {
        if (!tagsCloud) return;
        
        // Группируем теги по категориям
        const byCategory = {};
        allTags.forEach(({ tag, count, displayName, category }) => {
            if (!byCategory[category]) {
                byCategory[category] = [];
            }
            byCategory[category].push({ tag, count, displayName });
        });
        
        // Порядок категорий
        const categoryOrder = ['🎵 Genres', '🎤 Vocals', '🎹 Instruments', '✨ Mood', '🎨 Style', '📅 Era', '🎧 Context', 'Popular'];
        
        let html = '';
        
        categoryOrder.forEach(category => {
            if (!byCategory[category] || byCategory[category].length === 0) return;
            
            html += `
                <div class="tag-category">
                    <h4 class="tag-category-title">${escapeHtml(category)}</h4>
                    <div class="tag-category-items">
                        ${byCategory[category].map(({ tag, count, displayName }) => `
                            <span class="tag-cloud-item" data-tag="${escapeHtml(tag)}" title="${count} tracks">
                                ${escapeHtml(displayName)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        tagsCloud.innerHTML = html;
        
        // Добавляем обработчики клика
        tagsCloud.querySelectorAll('.tag-cloud-item').forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.dataset.tag;
                selectTag(tag);
            });
        });
    }
    
    // Выбираем тег и показываем треки (с пагинацией как в Top Tracks)
    async function selectTag(tag) {
        currentTag = tag;
        
        // Обновляем активный тег в облаке
        tagsCloud.querySelectorAll('.tag-cloud-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tag === tag);
        });
        
        // Сохраняем выбранный тег
        localStorage.setItem('selectedTag', tag);
        
        // Сбрасываем пагинацию
        tagTracksPage = 1;
        tagTracksHasMore = true;
        tagTracks = [];
        
        // Очищаем список и создаём структуру
        if (tagTracksList) {
            tagTracksList.innerHTML = `
                <div class="tag-tracks-header">
                    <h3>🏷️ ${escapeHtml(currentTag)}</h3>
                    <span class="tag-tracks-count">Loading...</span>
                </div>
                <div class="tag-tracks-list" id="tagTracksListContainer"></div>
            `;
            tagTracksList.style.display = 'block';
        }
        
        // Загружаем первую страницу
        await loadMoreTagTracks();
        
        // Прокручиваем к трекам
        if (tagTracksList) {
            tagTracksList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // ⚠️ CRITICAL: Загрузка треков тега (пагинация)
    // 🔒 LOCKED: Проверять isLoadingTagTracks перед вызовом!
    // Зависимости: tagTracksPage, tagTracksHasMore, currentTag
    // Цепочка: IntersectionObserver → loadMoreTagTracks() → renderTagTracksPage()
    async function loadMoreTagTracks() {
        if (isLoadingTagTracks || !tagTracksHasMore || !currentTag) return;
        
        console.log('loadMoreTagTracks called:', { tagTracksPage, tagTracksHasMore, currentTag });
        
        isLoadingTagTracks = true;
        loadingEl.style.display = 'block';
        
        try {
            // Находим информацию о теге
            let tagInfo = null;
            if (window.tagsData) {
                if (window.tagsData.categories) {
                    for (const catData of Object.values(window.tagsData.categories)) {
                        if (catData.tags && catData.tags[currentTag]) {
                            tagInfo = catData.tags[currentTag];
                            break;
                        }
                    }
                }
                if (!tagInfo && window.tagsData.popularTags && window.tagsData.popularTags[currentTag]) {
                    tagInfo = window.tagsData.popularTags[currentTag];
                }
            }
            
            if (!tagInfo) {
                console.warn('Tag info not found for:', currentTag);
                tagTracksHasMore = false;
                return;
            }
            
            const allTracks = window.tagsData.tracks;
            const allTagTrackIds = tagInfo.tracks;
            
            // Вычисляем срез для текущей страницы
            const startIndex = (tagTracksPage - 1) * TAG_TRACKS_PER_PAGE;
            const endIndex = startIndex + TAG_TRACKS_PER_PAGE;
            const pageTrackIds = allTagTrackIds.slice(startIndex, endIndex);
            
            console.log('Tag tracks pagination:', {
                totalTracks: allTagTrackIds.length,
                startIndex,
                endIndex,
                pageTrackIds: pageTrackIds.length,
                tagTracksPage
            });
            
            // Собираем полные данные треков для страницы
            const pageTracks = pageTrackIds
                .map(trackId => allTracks[trackId])
                .filter(track => track)
                .map((track, index) => ({
                    ...track,
                    rank: startIndex + index + 1
                }));
            
            // Проверяем есть ли ещё треки
            tagTracksHasMore = endIndex < allTagTrackIds.length;
            
            console.log('Page tracks loaded:', pageTracks.length, 'Has more:', tagTracksHasMore);
            
            if (pageTracks.length > 0) {
                tagTracks = tagTracks.concat(pageTracks);
                // Сортируем все загруженные треки
                sortTagTracks(false); // false = не перерендеривать полностью
                // Рендерим только новые
                renderTagTracksPage(pageTracks);
            }
            
            tagTracksPage++;
            
            console.log('tagTracksPage incremented to:', tagTracksPage);
            
            // Обновляем счётчик треков в заголовке
            updateTagTracksCount(allTagTrackIds.length);
            
        } catch (err) {
            console.error('Error loading tag tracks:', err);
        } finally {
            isLoadingTagTracks = false;
            loadingEl.style.display = tagTracksHasMore ? 'block' : 'none';
        }
    }
    
    // Обновляем счётчик треков в заголовке
    function updateTagTracksCount(total) {
        const countEl = tagTracksList.querySelector('.tag-tracks-count');
        if (countEl) {
            countEl.textContent = `${tagTracks.length} of ${total} tracks`;
        }
    }
    
    // Подсвечиваем текущий трек в списке тегов
    function updateTagTrackHighlight() {
        if (currentView !== 'tags' || !currentAlbum || currentAlbum.id !== 'tag-tracks') return;
        
        // Убираем выделение со всех
        document.querySelectorAll('.top-track-item.playing').forEach(el => {
            el.classList.remove('playing');
        });
        
        // 🔥 FIX: Ищем трек по ID вместо использования индекса
        const trackId = currentAlbum.tracks[currentTrackIndex]?.id;
        if (trackId) {
            const currentTrackElement = document.querySelector(`.top-track-item[data-track-id="${trackId}"]`);
            if (currentTrackElement) {
                currentTrackElement.classList.add('playing');
                // Прокручиваем к центру
                setTimeout(() => {
                    currentTrackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }
    
    // Прокручиваем к текущему треку в тегах
    function scrollToCurrentTagTrack() {
        if (currentView !== 'tags' || !currentAlbum || currentAlbum.id !== 'tag-tracks') return;
        
        // 🔥 FIX: Ищем активный элемент
        const currentItem = document.querySelector('.top-track-item.playing');
        
        if (currentItem) {
            currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // ⚠️ CRITICAL: Infinite Scroll для Tags view
    // 🔒 LOCKED: Вызывается ОДИН раз в selectTag(), НЕ пересоздавать!
    // Зависимости: tagTracksObserver, tagTracksHasMore, isLoadingTagTracks
    let tagTracksObserver = null;
    function setupTagTracksInfiniteScroll() {
        // Удаляем старый observer если есть
        if (tagTracksObserver) {
            tagTracksObserver.disconnect();
            tagTracksObserver = null;
        }
        
        // Удаляем старый sentinel если есть
        const oldSentinel = document.getElementById('tag-tracks-sentinel');
        if (oldSentinel) {
            oldSentinel.remove();
        }
        
        // Создаем sentinel для отслеживания - добавляем в конец списка треков
        const container = document.getElementById('tagTracksListContainer') || tagTracksList;
        
        if (container && tagTracksHasMore) {
            const sentinel = document.createElement('div');
            sentinel.id = 'tag-tracks-sentinel';
            sentinel.style.height = '60px';
            sentinel.style.marginTop = '20px';
            sentinel.style.background = 'transparent';
            sentinel.textContent = isLoadingTagTracks ? '⏳ Loading...' : '';
            sentinel.style.color = '#888';
            sentinel.style.textAlign = 'center';
            sentinel.style.paddingTop = '20px';
            sentinel.style.fontSize = '13px';
            container.appendChild(sentinel);
            
            tagTracksObserver = new IntersectionObserver((entries) => {
                console.log('IntersectionObserver triggered:', entries[0].isIntersecting, 'isLoading:', isLoadingTagTracks, 'hasMore:', tagTracksHasMore);
                if (entries[0].isIntersecting && !isLoadingTagTracks && tagTracksHasMore && currentTag) {
                    loadMoreTagTracks();
                }
            }, { rootMargin: '300px' });
            
            tagTracksObserver.observe(sentinel);
        }
    }
    
    // Рендерим все треки выбранного тега (при сортировке)
    function renderTagTracksFull() {
        if (!tagTracksList) return;
        
        // Сохраняем заголовок если есть
        const headerEl = tagTracksList.querySelector('.tag-tracks-header');
        const headerHtml = headerEl ? headerEl.outerHTML : (currentTag ? `
            <div class="tag-tracks-header">
                <h3>🏷️ ${escapeHtml(currentTag)}</h3>
                <span class="tag-tracks-count">${tagTracks.length} tracks</span>
            </div>
        ` : '');
        
        const tracksHtml = tagTracks.map((track, index) => createTagTrackHtml(track, index)).join('');
        
        tagTracksList.innerHTML = headerHtml + tracksHtml;
        
        attachTagTrackListeners();
    }
    
    // ⚠️ CRITICAL: Рендеринг страницы треков
    // 🔒 LOCKED: НЕ вызывать setupTagTracksInfiniteScroll() здесь!
    // Вызывать только updateSentinel text после рендера
    function renderTagTracksPage(pageTracks) {
        if (!tagTracksList) return;
        
        // Находим или создаём контейнер для треков
        let container = document.getElementById('tagTracksListContainer');
        if (!container) {
            container = tagTracksList;
        }
        
        // Добавляем треки страницы
        const startIndex = tagTracks.length - pageTracks.length;
        pageTracks.forEach((track, index) => {
            const trackHtml = createTagTrackHtml(track, startIndex + index);
            container.insertAdjacentHTML('beforeend', trackHtml);
        });
        
        attachTagTrackListeners();
        
        // Пересоздаём sentinel после добавления треков
        setupTagTracksInfiniteScroll(); // ⚠️ WARNING: Пересоздание observer!
    }
    
    // Создаём HTML для трека тега
    function createTagTrackHtml(track, index) {
        const isPlaying = currentAlbum && currentAlbum.id === 'tag-tracks' && currentTrackIndex === index;
        return `
            <div class="top-track-item ${isPlaying ? 'playing' : ''}" data-track-id="${track.id}">
                <div class="top-track-rank">#${track.rank || (index + 1)}</div>
                <img class="top-track-cover" src="${track.cover || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23333\'/%3E%3C/svg%3E'}" alt="">
                <div class="top-track-info">
                    <div class="top-track-name">${escapeHtml(track.name)}</div>
                    <div class="top-track-stats">
                        <span class="top-track-stat">▶ ${formatNumber(track.plays)}</span>
                        <span class="top-track-stat">♥ ${formatNumber(track.favorites)}</span>
                    </div>
                </div>
                <button class="top-track-play" title="Воспроизвести">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            </div>
        `;
    }
    
    // Добавляем обработчики клика на треки
    function attachTagTrackListeners() {
        // Находим контейнер для треков
        const container = document.getElementById('tagTracksListContainer') || tagTracksList;
        
        container.querySelectorAll('.top-track-item').forEach((item) => {
            // Пропускаем если уже обработан
            if (item.dataset.hasListener) return;
            item.dataset.hasListener = 'true';
            
            item.addEventListener('click', (e) => {
                const trackId = item.dataset.trackId;
                const trackIndex = tagTracks.findIndex(t => t.id === trackId);
                
                if (trackIndex === -1) return;
                
                const isCurrentTrack = currentAlbum && currentAlbum.id === 'tag-tracks' && 
                                      currentTrackIndex === trackIndex;
                
                if (isCurrentTrack && !audioPlayer.paused) {
                    // Если это текущий трек и он играет — ставим на паузу
                    audioPlayer.pause();
                } else {
                    // Иначе запускаем трек
                    playTagTrack(tagTracks[trackIndex]);
                }
            });
        });
    }
    
    // Воспроизведение трека из раздела By Tags (как в Top Tracks)
    function playTagTrack(track) {
        if (!playerBar.classList.contains('active')) {
            playerBar.classList.add('active');
        }
        
        // Убираем класс playing со всех карточек
        document.querySelectorAll('.album-card.playing, .top-track-item.playing').forEach(el => {
            el.classList.remove('playing');
        });
        
        // Находим индекс трека
        const trackIndex = tagTracks.findIndex(t => t.id === track.id);
        
        // Создаем виртуальный альбом для трека
        currentAlbum = {
            id: 'tag-tracks',
            title: `🏷️ ${currentTag}`,
            cover: track.cover,
            tracks: tagTracks.map(t => ({
                name: t.name,
                file: t.file,
                cover: t.cover,
                duration: t.duration,
                sound: t.sound,
                lyrics: t.lyrics,
                model: t.model
            }))
        };
        
        currentTrackIndex = trackIndex;
        
        // Добавляем класс playing на текущий трек
        const trackItems = tagTracksList.querySelectorAll('.top-track-item');
        if (trackItems[trackIndex]) {
            trackItems[trackIndex].classList.add('playing');
        }
        
        // Прокручиваем к текущему треку
        setTimeout(() => scrollToCurrentTagTrack(), 100);
        
        selectTrack(currentAlbum, trackIndex);
        
        playlistAlbumTitle.textContent = `🏷️ ${currentTag}`;
        renderPlaylist();
    }

    // ==================== МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ТРЕКА ====================
    const trackInfoBtn = document.getElementById('trackInfoBtn');
    const trackDetailsModal = document.getElementById('trackDetailsModal');
    const closeTrackDetails = document.getElementById('closeTrackDetails');
    const modalTrackTitle = document.getElementById('modalTrackTitle');
    const modalTrackSound = document.getElementById('modalTrackSound');
    const modalTrackLyrics = document.getElementById('modalTrackLyrics');
    const modalTrackTags = document.getElementById('modalTrackTags');
    const modalTagsSection = document.getElementById('modalTagsSection');
    
    // Текущие данные трека для модалки
    let currentTrackDetails = null;
    
    function openTrackDetailsModal() {
        if (!currentAlbum || currentTrackIndex < 0) return;
        
        const track = currentAlbum.tracks[currentTrackIndex];
        if (!track) return;
        
        modalTrackTitle.textContent = track.name || 'Track Details';
        modalTrackSound.textContent = track.sound || 'No sound description available.';
        modalTrackLyrics.textContent = track.lyrics || 'No lyrics available.';
        
        // Извлекаем теги из промта
        if (track.sound) {
            const tags = extractTagsFromSound(track.sound);
            if (tags.length > 0) {
                modalTagsSection.style.display = 'block';
                modalTrackTags.innerHTML = tags.map(tag => 
                    `<span class="track-tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
                ).join('');
                
                // Добавляем обработчики клика на теги
                modalTrackTags.querySelectorAll('.track-tag').forEach(tagEl => {
                    tagEl.addEventListener('click', () => {
                        const tag = tagEl.dataset.tag;
                        filterByTag(tag);
                        closeTrackDetailsModal();
                    });
                });
            } else {
                modalTagsSection.style.display = 'none';
            }
        } else {
            modalTagsSection.style.display = 'none';
        }
        
        trackDetailsModal.classList.add('open');
    }
    
    function closeTrackDetailsModal() {
        trackDetailsModal.classList.remove('open');
    }
    
    // Извлекаем ключевые слова из промта
    function extractTagsFromSound(sound) {
        const commonTags = [
            '90s', '80s', '70s', '2000s', 'retro', 'vintage', 'modern', 'futuristic',
            'electronic', 'synth', 'bass', 'hip-hop', 'rap', 'pop', 'rock', 'jazz',
            'ambient', 'chill', 'upbeat', 'energetic', 'melodic', 'rhythmic',
            'female', 'male', 'vocal', 'instrumental', 'acoustic', 'digital',
            'night', 'club', 'party', 'romantic', 'sad', 'happy', 'dark', 'bright',
            'lo-fi', 'hi-fi', 'crisp', 'warm', 'cold', 'fuzzy', 'clean'
        ];
        
        const foundTags = [];
        const lowerSound = sound.toLowerCase();
        
        commonTags.forEach(tag => {
            if (lowerSound.includes(tag.toLowerCase())) {
                foundTags.push(tag);
            }
        });
        
        // Добавляем жанры и стили из описания
        const genreMatches = sound.match(/(\w+\s+)?(pop|rock|hip-hop|rap|jazz|blues|electronic|house|techno|trance|ambient|lo-fi|synthwave|disco|funk|soul|r&b|reggae|latin|reggaeton|edm|trap|drill|grime)(\s+\w+)?/gi);
        if (genreMatches) {
            genreMatches.forEach(match => {
                const clean = match.trim().toLowerCase();
                if (!foundTags.includes(clean)) {
                    foundTags.push(clean);
                }
            });
        }
        
        return foundTags.slice(0, 12); // Максимум 12 тегов
    }
    
    // Фильтрация по тегу
    function filterByTag(tag) {
        // Переключаемся на раздел By Tags и выбираем тег
        switchView('tags');
        selectTag(tag);
    }
    
    if (trackInfoBtn) {
        trackInfoBtn.addEventListener('click', openTrackDetailsModal);
    }
    
    if (closeTrackDetails) {
        closeTrackDetails.addEventListener('click', closeTrackDetailsModal);
    }
    
    // Закрытие по клику на фон
    if (trackDetailsModal) {
        trackDetailsModal.addEventListener('click', (e) => {
            if (e.target === trackDetailsModal) {
                closeTrackDetailsModal();
            }
        });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && trackDetailsModal.classList.contains('open')) {
            closeTrackDetailsModal();
        }
    });

    // ==================== СТАРТ ====================
    initViewTabs();
    setupTopTracksInfiniteScroll();
    loadLibrary();
    
    // Восстанавливаем состояние плеера после загрузки страницы
    window.addEventListener('load', () => {
        setTimeout(() => restorePlayerState(), 1500);
    });
})();
