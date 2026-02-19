// script.js — логика плеера, галереи, темы

(function() {
    // ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
    let albums = [];
    let currentAlbum = null;
    let currentTrackIndex = -1;
    let playlistVisible = false;

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
    let currentSort = ''; // '', 'name', 'created', 'tracks', 'plays', 'favorites'
    let currentOrder = 'asc'; // 'asc', 'desc'

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
        const header = document.querySelector('.header');
        const sortContainer = document.createElement('div');
        sortContainer.className = 'sort-controls';
        sortContainer.innerHTML = `
            <label>Sort by:</label>
            <select id="sortSelect">
                <option value="" selected>Default</option>
                <option value="name">Name</option>
                <option value="created">Date Created</option>
                <option value="tracks">Track Count</option>
                <option value="plays">Total Plays</option>
                <option value="favorites">Total Favorites</option>
            </select>
            <button id="sortOrderBtn" title="Toggle sort order">↑</button>
        `;
        header.appendChild(sortContainer);

        // Стили для сортировки
        const style = document.createElement('style');
        style.textContent = `
            .sort-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 10px;
                font-size: 14px;
            }
            .sort-controls label {
                color: var(--text-secondary);
            }
            .sort-controls select {
                background: var(--surface);
                color: var(--text);
                border: 1px solid var(--border);
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
            }
            .sort-controls button {
                background: var(--surface);
                color: var(--text);
                border: 1px solid var(--border);
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            .sort-controls button:hover {
                background: var(--primary);
            }
        `;
        document.head.appendChild(style);

        // Обработчики событий
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            currentSort = e.target.value;
            resetAndReload();
        });

        document.getElementById('sortOrderBtn').addEventListener('click', (e) => {
            currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            e.target.textContent = currentOrder === 'asc' ? '↑' : '↓';
            resetAndReload();
        });
    }

    function resetAndReload() {
        // Сбрасываем состояние и перезагружаем с серверной сортировкой
        currentPage = 1;
        hasMore = true;
        totalPages = 1;
        albums = [];
        gallery.innerHTML = '';
        albumTracksCache.clear();
        loadMoreAlbums();
    }

    // Преобразуем клиентское значение сортировки в параметр API
    function getApiSortParam() {
        const sortMap = {
            'name': 'name',
            'created': 'created_at',
            'plays': 'play_count',
            'favorites': 'favorite_count',
            'tracks': 'tracks_favorite_count'
        };
        return sortMap[currentSort] || 'created_at'; // По умолчанию сортируем по дате создания
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
            let url = `https://api.dj1.ru/api/playlists?page=${currentPage}&limit=${itemsPerPage}&privacy=public`;
            
            // Добавляем параметры сортировки только если выбрана конкретная сортировка
            if (currentSort) {
                const sortParam = getApiSortParam();
                const orderParam = currentOrder.toUpperCase();
                url += `&sort=${sortParam}&order=${orderParam}`;
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
            
            const coverHtml = album.cover 
                ? `<img class="album-cover" src="${album.cover}" alt="${album.title}" loading="lazy">`
                : `<div class="album-cover" style="background:#2a2a2a; display:flex; align-items:center; justify-content:center; color:#666;">📀</div>`;
            
            card.innerHTML = `
                ${coverHtml}
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-meta">${album.tracksCount} tracks</div>
                </div>
            `;
            
            card.addEventListener('click', async () => {
                if (!playerBar.classList.contains('active')) {
                    playerBar.classList.add('active');
                }

                // Ленивая загрузка треков при первом открытии
                if (album.tracks.length === 0) {
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
        repeatBtn.classList.remove('active');
        if (repeatMode === REPEAT_ONE) {
            repeatBtn.classList.add('active');
        } else if (repeatMode === REPEAT_ALL) {
            repeatBtn.classList.add('active');
        } else {
            repeatBtn.classList.remove('active');
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
                    <div class="playlist-item-title">${track.name}</div>
                    <div class="playlist-item-album">${currentAlbum.title}</div>
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

    // ==================== СТАРТ ====================
    loadLibrary();
})();
