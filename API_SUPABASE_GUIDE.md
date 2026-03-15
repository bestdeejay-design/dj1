# 📚 API & Supabase Documentation

## 🎯 Overview

Проект использует **гибридную архитектуру**:
- **JSON файлы** → источник истины для треков и тегов
- **Supabase** → операционный слой для фильтрации, связей и аналитики
- **REST API** → прокси между frontend и базой данных

---

## 📋 Содержание

1. [API Endpoints](#api-endpoints)
2. [Supabase Schema](#supabase-schema)
3. [Как получать данные](#как-получать-данные)
4. [Как обновлять данные](#как-обновлять-данные)
5. [Примеры кода](#примеры-кода)
6. [Best Practices](#best-practices)

---

## 🔗 API Endpoints

### Base URL
```
https://api.dj1.ru/api
```

### Треки

#### Получить все треки (paginated)
```http
GET /tracks?page=1&limit=20
```

**Ответ:**
```json
{
  "data": [
    {
      "id": "e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df",
      "author_id": "28d5e3f7-9c38-4b5f-b875-94a776bcc90a",
      "title": "TÚ Y YO EN EL AFTER (Variation)",
      "sound": "Modern latin urban hit...",
      "tags": ["electronic", "russian", "retro"],
      "duration_s": 158.27,
      "play_count": 13,
      "favorite_count": 2,
      "audio_url": "https://api.dj1.ru/storage/...",
      "image_url": "https://api.dj1.ru/storage/...",
      "created_at": "2026-02-07T08:34:47.556671Z"
    }
  ],
  "meta": {
    "total": 9700,
    "page": 1,
    "limit": 20,
    "pages": 485
  }
}
```

#### Получить трек по ID
```http
GET /tracks/{id}
```

**Пример:**
```bash
curl https://api.dj1.ru/api/tracks/e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df
```

---

## 🗄️ Supabase Schema

### Таблицы

#### 1. `tracks`
```sql
CREATE TABLE tracks (
    id UUID PRIMARY KEY,
    sound TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Поля:**
- `id` - UUID трека
- `sound` - текстовое описание
- `tags` - JSONB массив тегов: `["electronic", "russian"]`
- `created_at` - дата создания

#### 2. `tags`
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category_id INTEGER REFERENCES tag_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Поля:**
- `id` - числовой ID тега
- `name` - название тега (уникальное)
- `category_id` - ссылка на категорию
- `created_at` - дата создания

#### 3. `tag_categories`
```sql
CREATE TABLE tag_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Категории:**
| id | name          | label           | color   |
|----|---------------|-----------------|---------|
| 1  | genre         | 🎵 Genre        | #ef4444 |
| 2  | mood          | 😊 Mood         | #f59e0b |
| 3  | instruments   | 🎸 Instruments  | #10b981 |
| 4  | tempo         | ⚡ Tempo        | #3b82f6 |
| 5  | era           | 📅 Era          | #8b5cf6 |
| 6  | language      | 🌐 Language     | #ec4899 |
| 7  | vibe          | ✨ Vibe         | #14b8a6 |
| 8  | production    | 🎛️ Production  | #f97316 |
| 9  | vocals        | 🎤 Vocals       | #06b6d4 |
| 10 | other         | 📦 Other        | #6b7280 |

#### 4. `track_tags` (many-to-many)
```sql
CREATE TABLE track_tags (
    track_id UUID REFERENCES tracks(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (track_id, tag_id)
);
```

**Поля:**
- `track_id` - ID трека
- `tag_id` - ID тега

---

## 📥 Как Получать Данные

### Вариант 1: Через REST API (Frontend)

```javascript
const API_BASE = 'https://api.dj1.ru/api';

// Получить трек по ID
async function getTrack(id) {
    const response = await fetch(`${API_BASE}/tracks/${id}`);
    const data = await response.json();
    return data;
}

// Получить все треки (pagination)
async function getTracks(page = 1, limit = 20) {
    const response = await fetch(`${API_BASE}/tracks?page=${page}&limit=${limit}`);
    const data = await response.json();
    return {
        tracks: data.data,
        meta: data.meta
    };
}

// Пример использования
const track = await getTrack('e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df');
console.log(track.tags); // ["electronic", "russian"]
```

### Вариант 2: Напрямую из Supabase (Backend/Python)

```python
import urllib.request
import json

SUPABASE_URL = "https://nwdalhrbifkjyyhpstnt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

def make_request(url, method="GET", data=None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))

# Получить все теги
tags = make_request(f"{SUPABASE_URL}/rest/v1/tags?select=*")
print(f"Total tags: {len(tags)}")

# Получить связи трека с тегами
track_id = "e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df"
track_tags = make_request(
    f"{SUPABASE_URL}/rest/v1/track_tags?track_id=eq.{track_id}&select=*,tags(name)"
)
print(f"Track has {len(track_tags)} tags")
```

### Вариант 3: SQL запрос в Supabase Dashboard

```sql
-- Получить все теги с категориями
SELECT 
    t.name as tag_name,
    tc.label as category,
    COUNT(tt.track_id) as usage_count
FROM tags t
LEFT JOIN tag_categories tc ON t.category_id = tc.id
LEFT JOIN track_tags tt ON t.id = tt.tag_id
GROUP BY t.id, tc.id
ORDER BY usage_count DESC;

-- Получить треки с тегами
SELECT 
    tr.id,
    tr.sound,
    tr.tags,
    array_agg(tg.name) as all_tags
FROM tracks tr
LEFT JOIN track_tags tt ON tr.id = tt.track_id
LEFT JOIN tags tg ON tt.tag_id = tg.id
GROUP BY tr.id
LIMIT 10;
```

---

## ✏️ Как Обновлять Данные

### 1. Обновить поле tags у трека (SQL)

```sql
UPDATE tracks
SET tags = '["electronic", "russian", "retro"]'::jsonb
WHERE id = 'e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df';
```

### 2. Добавить связь track-tag (SQL)

```sql
INSERT INTO track_tags (track_id, tag_id)
VALUES (
    'e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df',
    (SELECT id FROM tags WHERE name = 'electronic')
)
ON CONFLICT (track_id, tag_id) DO NOTHING;
```

### 3. Массовое обновление tags из track_tags (SQL)

```sql
UPDATE tracks t
SET tags = (
    SELECT COALESCE(
        (SELECT jsonb_agg(tg.name ORDER BY tg.name)
         FROM track_tags tt
         JOIN tags tg ON tt.tag_id = tg.id
         WHERE tt.track_id = t.id),
        '[]'::jsonb
    )
);
```

### 4. Добавить новый тег (Python)

```python
# Создать тег
new_tag = make_request(
    f"{SUPABASE_URL}/rest/v1/tags",
    method="POST",
    data=[{"name": "psychedelic"}]
)

# Привязать к треку
track_id = "e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df"
tag_id = new_tag[0]['id']

make_request(
    f"{SUPABASE_URL}/rest/v1/track_tags",
    method="POST",
    data=[{"track_id": track_id, "tag_id": tag_id}]
)
```

### 5. Обновить через REST API (если поддерживается)

```javascript
// Обновить tags трека
async function updateTrackTags(trackId, tags) {
    const response = await fetch(`${API_BASE}/tracks/${trackId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags })
    });
    return await response.json();
}

// Использование
await updateTrackTags('e26f7cc5-7e9d-47b0-9c9b-8c3016e8d0df', [
    'electronic',
    'russian',
    'retro'
]);
```

---

## 💻 Примеры Кода

### Frontend: React Component

```jsx
import { useEffect, useState } from 'react';

function TrackList() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTracks() {
            const res = await fetch('https://api.dj1.ru/api/tracks?page=1&limit=10');
            const data = await res.json();
            setTracks(data.data);
            setLoading(false);
        }
        fetchTracks();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            {tracks.map(track => (
                <div key={track.id}>
                    <h3>{track.title}</h3>
                    <p>{track.sound}</p>
                    <div>
                        {track.tags.map(tag => (
                            <span key={tag}>{tag}</span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

### Backend: Python Script для импорта

```python
#!/usr/bin/env python3
"""
Import tracks from JSON to Supabase
"""
import json
import urllib.request

SUPABASE_URL = "https://nwdalhrbifkjyyhpstnt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

def import_tracks(json_file):
    with open(json_file) as f:
        data = json.load(f)
    
    for track in data['tracks']:
        # Insert track
        track_data = {
            'id': track['id'],
            'sound': track['sound'],
            'tags': track.get('tags', [])
        }
        
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/tracks",
            data=json.dumps([track_data]).encode('utf-8'),
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            },
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                print(f"✅ Imported {track['id']}")
        except Exception as e:
            print(f"❌ Failed {track['id']}: {e}")

import_tracks('data/tracks.json')
```

---

## 🎯 Best Practices

### ✅ DO:

1. **Используй pagination** для больших списков
   ```javascript
   GET /tracks?page=1&limit=50
   ```

2. **Кэшируй данные** на клиенте
   ```javascript
   const cached = localStorage.getItem('tracks');
   ```

3. **Обрабатывай ошибки**
   ```javascript
   try {
       const response = await fetch(url);
       if (!response.ok) throw new Error(`HTTP ${response.status}`);
   } catch (error) {
       console.error('API Error:', error);
   }
   ```

4. **Используй Supabase для сложных queries**
   ```sql
   SELECT t.*, array_agg(tg.name) as tags
   FROM tracks t
   LEFT JOIN track_tags tt ON t.id = tt.track_id
   LEFT JOIN tags tg ON tt.tag_id = tg.id
   WHERE tg.name = 'electronic'
   GROUP BY t.id;
   ```

### ❌ DON'T:

1. **Не делай много последовательных запросов**
   ```javascript
   // BAD ❌
   for (const id of ids) {
       await fetch(`/tracks/${id}`); // 100 requests!
   }
   
   // GOOD ✅
   const all = await fetch('/tracks?page=1&limit=100');
   ```

2. **Не храните чувствительные данные на клиенте**
   ```javascript
   // BAD ❌
   const SUPABASE_KEY = "service_role_key"; // Public!
   
   // GOOD ✅
   Используйте anon key только для чтения
   ```

3. **Не обновляй данные без транзакций**
   ```sql
   -- BAD ❌
   UPDATE tracks SET tags = ...;
   DELETE FROM track_tags WHERE ...;
   
   -- GOOD ✅
   BEGIN;
   UPDATE ...;
   DELETE ...;
   COMMIT;
   ```

---

## 📊 Statistics

### Current State (as of 2026-03-15)

| Entity | Count |
|--------|-------|
| Tracks | 9,700 |
| Tags | 1,921 |
| Track-Tag Relationships | 196,779 |
| Tag Categories | 10 |

### Tag Distribution by Category

| Category | Tags | % |
|----------|------|---|
| ⚡ Tempo | 48 | 2.5% |
| 🎵 Genre | 31 | 1.6% |
| 😊 Mood | 26 | 1.4% |
| 🎸 Instruments | 14 | 0.7% |
| 📅 Era | 13 | 0.7% |
| 🎤 Vocals | 5 | 0.3% |
| 📦 Other | 1,784 | 92.9% |

---

## 🔧 Troubleshooting

### Проблема: API возвращает HTML вместо JSON

**Решение:** Проверь путь! Используй `/api/tracks/{id}` а не `/tracks?id=eq.{id}`

```javascript
// BAD ❌
fetch('https://api.dj1.ru/tracks?id=eq.123')

// GOOD ✅
fetch('https://api.dj1.ru/api/tracks/123')
```

### Проблема: Supabase REST API игнорирует фильтры

**Решение:** Supabase proxy может не поддерживать query filters. Используй path parameters или прямой доступ к Supabase REST API.

```python
# BAD ❌ (через proxy)
fetch('https://api.dj1.ru/api/tracks?id=eq.123')

# GOOD ✅ (напрямую)
fetch('https://nwdalhrbifkjyyhpstnt.supabase.co/rest/v1/tracks?id=eq.123', {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    }
})
```

### Проблема: 404 при получении трека

**Решение:** Трек не существует в API (только в Supabase). Проверь базу напрямую:

```sql
SELECT * FROM tracks WHERE id = '...';
```

---

## 📞 Support

- **GitHub Issues**: https://github.com/bestdeejay-design/dj1/issues
- **API Docs**: https://dj1.ru/openapi.yaml
- **Supabase Dashboard**: https://nwdalhrbifkjyyhpstnt.supabase.co

---

**Last Updated:** 2026-03-15  
**Version:** 1.0.0
