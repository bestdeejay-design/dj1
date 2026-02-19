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
            // Загружаем данные через API
            const tracksResponse = await fetch('https://api.dj1.ru/api/tracks?page=1&limit=100');
            if (!tracksResponse.ok) throw new Error('Не удалось загрузить треки');
            const tracksData = await tracksResponse.json();

            const playlistsResponse = await fetch('https://api.dj1.ru/api/playlists?page=1&limit=50');
            if (!playlistsResponse.ok) throw new Error('Не удалось загрузить плейлисты');
            const playlistsData = await playlistsResponse.json();

            const usersResponse = await fetch('https://api.dj1.ru/api/users?page=1&limit=50');
            if (!usersResponse.ok) throw new Error('Не удалось загрузить пользователей');
            const usersData = await usersResponse.json();

            // Загружаем детали каждого плейлиста для получения треков
            const playlistsWithTracks = await Promise.all(
                playlistsData.data.map(async (playlist) => {
                    try {
                        const detailResponse = await fetch(`https://api.dj1.ru/api/playlists/${playlist.id}`);
                        if (detailResponse.ok) {
                            const detailData = await detailResponse.json();
                            return { ...playlist, tracks: detailData.tracks || [] };
                        }
                        return { ...playlist, tracks: [] };
                    } catch (err) {
                        console.warn(`Failed to load tracks for playlist ${playlist.id}:`, err);
                        return { ...playlist, tracks: [] };
                    }
                })
            );

            // Преобразуем данные в формат, подходящий для отображения
            albums = transformApiData(tracksData.data, playlistsWithTracks, usersData.data);
            loadingEl.style.display = 'none';
            renderGallery();
            
            // Анимация GSAP
            if (typeof gsap !== 'undefined') {
                gsap.fromTo('.album-card', 
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power2.out' }
                );
            }
        } catch (err) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            errorEl.textContent = 'Ошибка: ' + err.message;
        }
    }

    // Функция преобразования данных из API в формат, подходящий для отображения
    function transformApiData(tracks, playlists, users) {
        // Создаем альбомы на основе плейлистов из API
        const albumsList = [];
        
        if (playlists && playlists.length > 0) {
            playlists.forEach(playlist => {
                const albumTracks = [];
                
                // Если у плейлиста есть треки, собираем их
                if (playlist.tracks && Array.isArray(playlist.tracks)) {
                    playlist.tracks.forEach(track => {
                        albumTracks.push({
                            name: track.title,
                            file: track.audio_url || track.full_url || null,
                            cover: track.image_url || null,
                            duration: track.duration_s || null
                        });
                    });
                }
                
                // Добавляем альбом (даже если треков нет)
                albumsList.push({
                    title: playlist.name || playlist.title || 'Untitled Playlist',
                    cover: playlist.image_url || playlist.cover_url || null,
                    tracks: albumTracks,
                    tracksCount: playlist.tracks_count || albumTracks.length
                });
            });
        }

        // Возвращаем массив альбомов
        return albumsList;
    }

    // ==================== ОТРИСОВКА ГАЛЕРЕИ ====================
    function renderGallery() {
        gallery.innerHTML = '';
        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = 'album-card';
            
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
            
            card.addEventListener('click', () => {
                // Активируем плеер
                if (!playerBar.classList.contains('active')) {
                    playerBar.classList.add('active');
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
