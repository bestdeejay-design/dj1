# 📊 API TRACK FIELDS ANALYSIS

## 🔍 ПОЛНАЯ СТРУКТУРА ТРЕКА

**Endpoint:** `GET https://api.dj1.ru/api/tracks/{track_id}`

---

## ✅ ОСНОВНЫЕ ПОЛЯ

```json
{
  "id": "2047c233-79a4-4da8-82a0-5a51369f2db5",           // UUID трека
  "title": "Digital Memory",                               // Название
  "author_id": "28d5e3f7-9c38-4b5f-b875-94a776bcc90a",    // ID автора
  "author_name": "BEST",                                   // Имя исполнителя
  "group_id": "",                                          // ID группы (пусто если нет)
  
  // 📅 ДАТЫ
  "created_at": "2025-02-17T21:48:42.095526Z",            // ⭐ Дата создания ISO 8601
  
  // 🎵 МЕТАДАННЫЕ
  "duration_s": 167.28,                                    // Длительность в секундах
  "play_count": 37,                                        // Количество прослушиваний
  "favorite_count": 1,                                     // Количество лайков
  "privacy": "public",                                     // Приватность: public/private
  "is_favorite": 1,                                        // Лайкнут ли текущим пользователем
  
  // 📝 КОНТЕНТ
  "sound": "Dark electronic R&B, ethereal female vocals...", // Prompt/Sound описание
  "lyrics": "[Intro]\nScrolling back to twenty-twenty...",   // Текст песни
  
  // 🎨 МЕДИА
  "audio_url": "https://api.dj1.ru/storage/.../track.m4a",      // Аудио файл
  "image_url": "https://api.dj1.ru/storage/.../cover.jpg"       // Обложка
}
```

---

## 📅 ДОСТУПНЫЕ ДАТЫ

### 1. **created_at** - Дата создания трека
```javascript
"created_at": "2025-02-17T21:48:42.095526Z"
```
- **Формат:** ISO 8601 (UTC)
- **Пример:** `2025-02-17T21:48:42.095526Z`
- **Можно использовать для:**
  - Сортировки по дате добавления
  - Фильтрации "Новые треки"
  - Отображения в модалке
  - Группировки по периодам (месяц/год)

---

### 2. **pivot.created_at** - Дата добавления в плейлист
```javascript
"in_playlists": [
  {
    "id": "...",
    "name": "Noir Dark bass",
    "pivot": {
      "track_id": "...",
      "playlist_id": "...",
      "created_at": "2025-02-17T21:51:14.000000Z"  // ⭐ Дата добавления в плейлист
    }
  }
]
```
- **Формат:** ISO 8601
- **Контекст:** Когда трек добавлен в конкретный плейлист

---

### 3. **favorited_at** - Дата лайка плейлиста
```javascript
"playlists": [
  {
    "id": "...",
    "favorited_at": "2026-02-18T05:02:39+00:00"  // ⭐ Когда лайкнули плейлист
  }
]
```

---

### 4. **downloaded_at** - Дата скачивания файла
```javascript
"attachments": [
  {
    "kind": "track_audio",
    "downloaded_at": "2026-02-18T06:31:04+00:00"  // ⭐ Когда скачали файл
  }
]
```

---

## 🎯 КАК ИСПОЛЬЗОВАТЬ В МОДАЛКЕ

### Добавить отображение даты создания:

```javascript
async function showTrackInfo(trackId) {
    const trackResp = await fetch(`${API_BASE}/tracks/${trackId}`);
    const track = await trackResp.json();
    
    // Парсим дату
    const createdDate = new Date(track.created_at);
    const formattedDate = createdDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Добавляем в модалку
    document.getElementById('modalTrackTitle').textContent = track.title;
    document.getElementById('modalTrackSound').textContent = track.sound;
    
    // 🔥 НОВОЕ: Дата создания
    const dateEl = document.createElement('div');
    dateEl.innerHTML = `
        <div style="margin-bottom: 1rem; color: #aaa; font-size: 0.85rem;">
            📅 Добавлен: ${formattedDate}
        </div>
    `;
    // Вставить перед Sound section
}
```

---

## 📋 ВСЕ ПОЛЯ (ПОЛНЫЙ СПИСОК)

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `id` | UUID | Уникальный ID трека | `"2047c233-..."` |
| `author_id` | UUID | ID автора | `"28d5e3f7-..."` |
| `group_id` | String | ID группы | `""` (пусто) |
| **`created_at`** | **ISO Date** | **Дата создания** | `"2025-02-17T21:48:42Z"` |
| `title` | String | Название трека | `"Digital Memory"` |
| `duration_s` | Float | Длительность (сек) | `167.28` |
| `play_count` | Integer | Прослушивания | `37` |
| `favorite_count` | Integer | Лайки | `1` |
| `privacy` | String | Приватность | `"public"` |
| `model_display_name` | Null | DisplayName модели | `null` |
| `sound` | String | Prompt/Sound описание | `"Dark electronic R&B..."` |
| `lyrics` | String | Текст песни | `"[Intro]\nScrolling..."` |
| `audio_url` | URL | Ссылка на аудио | `"https://api.dj1.ru/..."` |
| `image_url` | URL | Ссылка на обложку | `"https://api.dj1.ru/..."` |
| `is_favorite` | Integer | Лайк (0/1) | `1` |
| `author_name` | String | Имя исполнителя | `"BEST"` |

---

## 🎨 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### 1. Сортировка по дате (новые сверху):
```javascript
const sortedTracks = tracks.sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
});
```

### 2. Фильтрация "За последний месяц":
```javascript
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const recentTracks = tracks.filter(track => {
    return new Date(track.created_at) > oneMonthAgo;
});
```

### 3. Группировка по годам:
```javascript
const tracksByYear = {};
tracks.forEach(track => {
    const year = new Date(track.created_at).getFullYear();
    if (!tracksByYear[year]) tracksByYear[year] = [];
    tracksByYear[year].push(track);
});
// {2025: [...], 2024: [...], 2023: [...]}
```

### 4. Красивое отображение:
```javascript
function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    if (days < 30) return `${Math.floor(days/7)} нед. назад`;
    if (days < 365) return `${Math.floor(days/30)} мес. назад`;
    
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long'
    });
}

// "2025-02-17T21:48:42Z" → "3 мес. назад"
```

---

## 💡 РЕКОМЕНДАЦИИ

### Что добавить в модалку:

```html
<div class="track-details-section">
    <h3>📅 Release Info</h3>
    <div style="color: #aaa; font-size: 0.85rem;">
        <div>🕓 Added: ${formatDate(track.created_at)}</div>
        <div>⏱️ Duration: ${formatDuration(track.duration_s)}</div>
        <div>▶️ Plays: ${track.play_count}</div>
        <div>❤️ Favorites: ${track.favorite_count}</div>
    </div>
</div>
```

---

## 🔗 СВЯЗАННЫЕ ДАННЫЕ

### Playlists:
```javascript
"in_playlists": [
  {
    "id": "uuid",
    "name": "Playlist Name",
    "user_id": "uuid",
    "user_name": "Username",
    "pivot": {
      "created_at": "2025-02-17T21:51:14Z"  // Когда добавлен в плейлист
    }
  }
]
```

### Attachments (файлы):
```javascript
"attachments": [
  {
    "kind": "track_image" | "track_audio",
    "original_url": "Google Storage URL",
    "local_path": "storage/xx/xx/file.ext",
    "full_url": "https://api.dj1.ru/storage/...",
    "mime_type": "image/jpeg" | "audio/mp4",
    "size_bytes": 4828,
    "downloaded_at": "2026-02-18T06:31:04Z"
  }
]
```

---

**Дата анализа:** 2026-02-20  
**API Version:** Current  
**Статус:** ✅ Актуально
