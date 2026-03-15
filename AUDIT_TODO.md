# 🔍 ПОЛНЫЙ АУДИТ index-tags-v2.html

## 📊 ТЕКУЩЕЕ СОСТОЯНИЕ

**Файл:** `/dj1/index-tags-v2.html`  
**Размер:** 1733 строки  
**Проблемы:** Конфликты, дублирование, медленная загрузка

---

## 🎯 ФУНКЦИОНАЛ (ДЕТАЛЬНО)

### 1. **Загрузка тегов с категориями** (5 сек)
- GET Supabase: `/tags_with_track_counts`
- Получает: id, name, category_id, track_count, tag_categories(name,label,color)
- Группирует по категориям
- Рендерит: свёрнутые категории (≤10 тегов), развёрнутые (>10)

### 2. **Клик по тегу → Загрузка треков** (7-8 сек)
- GET Supabase: `/track_tags?tag_id=eq.{id}&select=track_id`
- Получает массив track_ids (например, 101 ID)
- Для каждого ID: GET API: `/tracks/{id}` (Promise.all × 10)
- Пагинация: загружает по 10 треков
- Infinite scroll: sentinel подгружает ещё 10

### 3. **Плеер**
- Play/Pause/Next/Prev/Repeat
- Прогресс бар
- Боковая панель плейлиста
- Сохранение состояния: localStorage (trackId, currentTime, isPlaying, tagId)

### 4. **Модалка информации о треке** (кнопка "i")
- GET API: `/tracks/{id}` → sound, lyrics, image_url
- GET Supabase: `/track_tags?track_id=eq.{id}&select=tag_id`
- GET Supabase: `/tags_with_track_counts?id=in.({ids})` → name, track_count
- Копирование: Sound, Lyrics, Tags (через запятую)
- Клик по тегу → переход на страницу с этим тегом

### 5. **Восстановление после F5**
- Читает localStorage
- Открывает сохранённый тег
- Восстанавливает трек и время

---

## ⚠️ ПРОБЛЕМЫ

### Критические:
1. ❌ **Дублирование кода** - selectTag вызывается 2 раза
2. ❌ **Гонка состояний** - window.currentTagId меняется до и после
3. ❌ **Медленная загрузка** - Promise.all × 44 запроса = 7-8 секунд
4. ❌ **Скролл не работает** - тайминги 100ms, 300ms, 500ms конфликтуют
5. ❌ **Модалка не открывается** - возможно DOM element null

### Оптимизация:
1. ⚡ **44 отдельных запроса к Supabase** → можно 1 запрос с OR
2. ⚡ **Нет кэширования** тегов
3. ⚡ **Нет debounce** на клики

---

## 📡 ВСЕ ЗАПРОСЫ (API + SUPABASE)

### Supabase REST API:

```javascript
// 1. Загрузка тегов с категориями
GET /rest/v1/tags_with_track_counts?
    select=id,name,category_id,track_count,tag_categories(name,label,color)&
    order=category_id.asc,name.asc

Headers: apikey, Authorization Bearer

// 2. Получение track_ids для тега
GET /rest/v1/track_tags?tag_id=eq.{tagId}&select=track_id

// 3. Получение track_ids для модалки
GET /rest/v1/track_tags?track_id=eq.{trackId}&select=tag_id

// 4. Получение данных тегов для модалки (44 запроса!)
GET /rest/v1/tags_with_track_counts?id=eq.{tagId}&select=id,name,track_count

// 5. Получение имени тега для восстановления
GET /rest/v1/tags_with_track_counts?id=eq.{tagId}&select=name
```

### Track API:

```javascript
// 1. Получение трека по ID
GET https://api.dj1.ru/api/tracks/{trackId}

Ответ: {id, title, author_name, sound, lyrics, image_url, audio_url, duration_s}

// 2. (Не используется) POST /tracks - 405 ошибка
```

---

## 🎯 ОПТИМАЛЬНЫЕ РЕШЕНИЯ

### 1. **Оптимизация запроса тегов для модалки**

**БЫЛО (44 запроса):**
```javascript
const promises = tagIds.map(id => 
    fetch(`/tags_with_track_counts?id=eq.${id}`)
);
await Promise.all(promises); // 7-8 секунд
```

**СТАЛО (1 запрос):**
```javascript
// Используем OR вместо множества запросов
const orCondition = tagIds.map(id => `id.eq.${id}`).join(',');
GET /rest/v1/tags_with_track_counts?or=(${orCondition})&select=id,name,track_count

// Или через IN (если поддерживает)
GET /rest/v1/tags_with_track_counts?id=in.(${tagIds.join(',')})&select=id,name,track_count
```

**Результат:** 44 запроса → 1 запрос, 7-8сек → ~200ms

---

### 2. **Кэширование тегов**

```javascript
const tagsCache = new Map();

async function getTagData(tagId) {
    if (tagsCache.has(tagId)) return tagsCache.get(tagId);
    
    const response = await fetch(...);
    const data = await response.json();
    tagsCache.set(tagId, data);
    return data;
}
```

---

### 3. **Исправление гонки состояний**

```javascript
// Убрать дублирование selectTag
// Вызывать только один раз при клике
// Не вызывать при восстановлении из localStorage
```

---

### 4. **Правильные тайминги скролла**

```javascript
// Скроллить ПОСЛЕ загрузки первых треков
await loadNextBatch(trackIds, 10);
setTimeout(() => {
    tracksSection.scrollIntoView({ behavior: 'smooth' });
}, 100); // Не 500!
```

---

## 📋 TODO СПИСОК (ПОШАГОВО)

### Фаза 1: Анализ (СЕЙЧАС)
- [x] Прочитать весь файл
- [x] Выписать все API вызовы
- [x] Найти конфликты
- [x] Составить план

### Фаза 2: Оптимизация запросов
- [ ] Исправить 44 запроса → 1 запрос
- [ ] Добавить кэширование
- [ ] Проверить работу

### Фаза 3: Рефакторинг кода
- [ ] Убрать дублирование selectTag
- [ ] Исправить window.currentTagId
- [ ] Починить скролл
- [ ] Починить модалку

### Фаза 4: Тестирование
- [ ] Клик по тегу → быстро (<1с)
- [ ] Модалка → теги с числами
- [ ] Копирование → работает
- [ ] F5 → восстановление

---

## 💻 ПЛАН КОДА (НОВАЯ СТРУКТУРА)

```javascript
// 1. КОНСТАНТЫ
const SUPABASE_URL = '...';
const SUPABASE_KEY = '...';
const API_BASE = 'https://api.dj1.ru/api';

// 2. КЭШИ
const tagsCache = new Map();
const tracksCache = new Map();

// 3. УТИЛИТЫ
async function fetchWithCache(url, cache, key) {...}
function optimizeTagQuery(tagIds) {...}

// 4. ЗАГРУЗКА ТАГОВ
async function loadTagsWithCategories() {...}

// 5. ВЫБОР ТАГА
async function selectTag(tagId, tagName) {
    // Один раз!
    // Получить track_ids
    // Загрузить треки
    // Скроллить
}

// 6. ЗАГРУЗКА ТРЕКОВ
async function loadTracksBatch(trackIds, count) {
    // Promise.all с кэшем
}

// 7. МОДАЛКА
async function showTrackInfo(trackId) {
    // 1 запрос для тегов вместо 44
}

// 8. ВОССТАНОВЛЕНИЕ
async function restorePlayer() {
    // Проверка window.currentTagId
}
```

---

## 🚀 ЦЕЛЕВЫЕ ПОКАЗАТЕЛИ

| Метрика | Сейчас | Цель |
|---------|--------|------|
| Загрузка тегов | 555ms | <300ms |
| Загрузка треков (10) | 7-8с | <1с |
| Открытие модалки | ? | <500ms |
| Скролл | Не работает | Работает |
| Размер файла | 1733 строк | <1200 строк |

---

**Дата аудита:** 2026-02-20  
**Аудитор:** AI Lead Developer  
**Статус:** Готов к рефакторингу
