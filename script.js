// script.js — логика плеера, галереи, темы

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
    let currentView = localStorage.getItem('currentView') || 'albums'; // 'albums' | 'top-tracks'
    let topTracksSort = 'plays';
    let topTracksOrder = 'desc'; // 'asc' | 'desc'
    let topTracksPage = 1;
    let topTracksHasMore = true;
    let isLoadingTopTracks = false;
    
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
            
            /* Мобильная адаптация - свайп/тап по правому краю */
            @media (max-width: 600px) {
                .sort-controls {
                    position: fixed;
                    top: 50%;
                    right: -140px; /* Скрыт за краем */
                    transform: translateY(-50%);
                    padding: 16px;
                    gap: 10px;
                    flex-direction: column;
                    border-radius: 16px 0 0 16px;
                    transition: right 0.3s ease;
                    min-width: 120px;
                }
                
                .sort-controls::before {
                    content: '☰';
                    position: absolute;
                    left: -40px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 60px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-right: none;
                    border-radius: 12px 0 0 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                }
                
                .sort-controls:hover,
                .sort-controls.active {
                    right: 0;
                }
                
                .sort-controls label {
                    font-size: 10px;
                    text-align: center;
                }
                
                .sort-controls select,
                .sort-controls button {
                    width: 100%;
                }
            }
            
            /* Светлая тема для мобильной кнопки */
            [data-theme="light"] .sort-controls::before {
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
            } else {
                // Для топа треков используем тот же набор сортировок
                topTracksSort = sortValue;
                resetAndReloadTopTracks();
            }
        });

        sortOrderBtn.addEventListener('click', (e) => {
            if (currentView === 'albums') {
                currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
                e.target.textContent = currentOrder === 'asc' ? '↑' : '↓';
                resetAndReload();
            } else {
                // Для топа треков
                topTracksOrder = topTracksOrder === 'asc' ? 'desc' : 'asc';
                e.target.textContent = topTracksOrder === 'asc' ? '↑' : '↓';
                resetAndReloadTopTracks();
            }
        });
        
        // Мобильное поведение - тап по язычку открывает/закрывает панель
        if (window.innerWidth <= 600) {
            sortContainer.addEventListener('click', (e) => {
                // Если клик по селекту или кнопке - не тогглим панель
                if (e.target === sortSelect || e.target === sortOrderBtn) {
                    return;
                }
                
                // Тоггл панели по клику внутри контейнера (включая язычок)
                sortContainer.classList.toggle('active');
            });
            
            // Закрыть при клике вне панели
            document.addEventListener('click', (e) => {
                if (!sortContainer.contains(e.target)) {
                    sortContainer.classList.remove('active');
                }
            });
        }
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

    function updateSortControlsForView(view) {
        const sortSelect = document.getElementById('sortSelect');
        const privacySelect = document.getElementById('privacySelect');
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        if (!sortSelect || !privacySelect || !sortOrderBtn) return;
        
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

    async function loadMoreAlbums() {
        if (isLoading || !hasMore) return;
        
        isLoading = true;
        loadingEl.style.display = 'block';

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

            // Добавляем новые альбомы
            if (newAlbums.length > 0) {
                albums = albums.concat(newAlbums);
                renderAlbums(newAlbums);
            }

            currentPage++;
            
        } catch (err) {
            console.error('Error loading albums:', err);
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
                duration: track.duration_s || null
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
        albumsToRender.forEach(album => {
            const card = document.createElement('div');
            card.className = 'album-card';
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
            
            gallery.appendChild(card);
        });

        // Анимация для новых элементов
        if (typeof gsap !== 'undefined') {
            gsap.fromTo('.album-card', 
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
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

        if (currentAlbum !== album) {
            currentAlbum = album;
            renderPlaylist();
            playlistAlbumTitle.textContent = album.title;
        }
        
        const track = album.tracks[trackIndex];
        if (!track) return;
        
        currentTrackIndex = trackIndex;
        audioPlayer.src = track.file;
        audioPlayer.load();
        audioPlayer.play();
        
        currentTrackName.textContent = track.name;
        currentAlbumName.textContent = album.title;
        // textContent автоматически экранирует HTML
        
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
                    nextShuffleIndex = 0;
                } else if (repeatMode === REPEAT_ONE) {
                    audioPlayer.currentTime = 0;
                    audioPlayer.play();
                    return;
                } else {
                    return;
                }
            }
            shuffleCurrentIndex = nextShuffleIndex;
            const newTrackIndex = shuffleIndices[shuffleCurrentIndex];
            selectTrack(currentAlbum, newTrackIndex);
        } else {
            let nextIndex = currentTrackIndex + 1;
            if (nextIndex >= currentAlbum.tracks.length) {
                if (repeatMode === REPEAT_ALL) {
                    nextIndex = 0;
                } else if (repeatMode === REPEAT_ONE) {
                    audioPlayer.currentTime = 0;
                    audioPlayer.play();
                    return;
                } else {
                    return;
                }
            }
            selectTrack(currentAlbum, nextIndex);
        }
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
        } else {
            updateSortControlsForView('albums');
        }
        
        viewTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.view-tab');
            if (!tab) return;
            
            const view = tab.dataset.view;
            if (view === currentView) return;
            
            // Обновляем активный таб
            viewTabs.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Сохраняем выбор
            currentView = view;
            localStorage.setItem('currentView', view);
            
            // Переключаем вид
            updateSortControlsForView(view);
            
            if (view === 'albums') {
                gallery.style.display = 'grid';
                topTracksView.style.display = 'none';
                loadingEl.style.display = hasMore ? 'block' : 'none';
            } else {
                gallery.style.display = 'none';
                topTracksView.style.display = 'block';
                loadingEl.style.display = topTracksHasMore ? 'block' : 'none';
                if (topTracks.length === 0) {
                    loadTopTracks();
                }
            }
        });
    }

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
                rank: (topTracksPage - 1) * 20 + index + 1
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
        
        tracksToRender.forEach(track => {
            const item = document.createElement('div');
            item.className = 'top-track-item';
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
            
            item.addEventListener('click', (e) => {
                if (e.target.closest('.top-track-play')) {
                    playTopTrack(track);
                }
            });
            
            list.appendChild(item);
        });
    }

    function playTopTrack(track) {
        if (!playerBar.classList.contains('active')) {
            playerBar.classList.add('active');
        }
        
        // Создаем виртуальный альбом для трека
        currentAlbum = {
            id: 'top-tracks',
            title: '🔥 Top Tracks',
            cover: track.cover,
            tracks: topTracks.map(t => ({
                name: t.name,
                file: t.file,
                cover: t.cover,
                duration: t.duration
            }))
        };
        
        const trackIndex = topTracks.findIndex(t => t.id === track.id);
        selectTrack(currentAlbum, trackIndex);
        
        playlistAlbumTitle.textContent = '🔥 Top Tracks';
        renderPlaylist();
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // Бесконечный скролл для топа треков
    function setupTopTracksInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && currentView === 'top-tracks' && !isLoadingTopTracks && topTracksHasMore) {
                loadTopTracks();
            }
        }, { rootMargin: '100px' });
        
        observer.observe(loadingEl);
    }

    // ==================== СТАРТ ====================
    initViewTabs();
    setupTopTracksInfiniteScroll();
    loadLibrary();
})();
