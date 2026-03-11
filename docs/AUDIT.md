# АУДИТ ПРОЕКТА DJ1.RU
## Структура файлов

### Основные файлы сайта
1. **index.html** (158 строк) - HTML-каркас
2. **script.js** (~2400 строк) - Основная логика
3. **style.css** (~1400 строк) - Стили
4. **rays.js** (~300 строк) - Фоновые эффекты
5. **rays.css** (~100 строк) - Стили эффектов

### Вспомогательные файлы
6. **library.json** - Локальные данные альбомов
7. **tags-data.json** - Профессиональные теги и треки
8. **openapi.yaml** - API документация
9. **generate_tags_*.py** - Скрипты генерации тегов

---

## ФУНКЦИОНАЛЬНЫЕ БЛОКИ script.js

### 1. Инициализация и состояние (строки 1-100)
```javascript
// Глобальные переменные состояния
- albums, topTracks, tagTracks - коллекции данных
- currentView, currentAlbum, currentTrackIndex - текущее состояние
- privacyFilter, currentSort, currentOrder - фильтры и сортировка
- bestUserId - ID автора BEST
```

### 2. Создание UI элементов (строки 100-400)
```javascript
createSortControls()        // Панель сортировки/фильтров
setupInfiniteScroll()       // Observer для бесконечного скролла
createSkeletonCards()       // Скелетон-заглушки загрузки
removeSkeletonCards()       // Удаление скелетонов
```

### 3. Сортировка и фильтрация (строки 400-500)
```javascript
updateSortControlsForView() // Обновление UI контролов
getApiSortParam()           // Маппинг параметров для API
resetAndReload()            // Сброс и перезагрузка альбомов
resetAndReloadTopTracks()   // Сброс и перезагрузка топа
sortTagTracks()             // Сортировка треков по тегу
```

### 4. Загрузка данных (строки 500-700)
```javascript
loadMoreAlbums()            // Постраничная загрузка альбомов
loadAlbumTracks()           // Ленивая загрузка треков альбома
loadTopTracks()             // Загрузка топа треков (API)
loadAllTags()               // Загрузка всех тегов
loadMoreTagTracks()         // Подгрузка треков тега
```

### 5. Рендеринг (строки 700-900)
```javascript
renderAlbums()              // Рендер карточек альбомов
renderTopTracks()           // Рендер списка топа
renderTagTracksFull()       // Полный рендер треков тега
renderTagTracksPage()       // Постраничный рендер
createTagTrackHtml()        // HTML для трека
attachTagTrackListeners()   // Обработчики кликов
```

### 6. Плеер (строки 850-1050)
```javascript
selectTrack()               // Выбор и воспроизведение трека
playCurrent()               // Старт воспроизведения
pauseCurrent()              // Пауза
nextTrack()                 // Следующий трек
prevTrack()                 // Предыдущий трек
generateShuffleIndices()    // Генерация shuffle
toggleShuffle()             // Перемешивание
toggleRepeat()              // Повтор
renderPlaylist()            // Рендер плейлиста
highlightPlaylistItem()     // Подсветка активного
```

### 7. Восстановление состояния (строки 1430-1800)
```javascript
restoreTopTrackPlayer()     // Восстановление топа
restoreTagTrackPlayer()     // Восстановление тега
savePlayerState()           // Сохранение в localStorage
restorePlayerState()        // Восстановление из localStorage
restoreTrackState()         // Восстановление альбома
```

### 8. Переключение видов (строки 1240-1320)
```javascript
switchView()                // Переключение Albums/Top/Tags
initViewTabs()              // Инициализация табов
setupTagTracksInfiniteScroll() // Observer для тегов
```

### 9. Детали трека (строки 2080-2250)
```javascript
playTagTrack()              // Запуск трека из тега
playTopTrack()              // Запуск трека из топа
openTrackDetailsModal()     // Открытие модалки
extractTagsFromSound()      // Парсинг тегов из промпта
```

### 10. Утилиты (разбросаны)
```javascript
escapeHtml()                // Экранирование HTML
formatNumber()              // Форматирование чисел (1K, 1M)
updateTagTracksCount()      // Счётчик треков
scrollToCurrentTopTrack()   // Скролл к текущему в топе
scrollToCurrentTagTrack()   // Скролл к текущему в теге
updateTopTrackHighlight()   // Подсветка в топе
updateTagTrackHighlight()   // Подсветка в теге
```

---

## АРХИТЕКТУРА ДАННЫХ

### Источник данных
```
API: https://api.dj1.ru/api/
├── /playlists - Альбомы (плейлисты)
├── /tracks - Треки (топ)
└── Параметры: page, limit, sort, order, author_id, privacy
```

### Локальные данные
```
tags-data.json
├── categories - Категории тегов
│   ├── genres (House, Trap, etc.)
│   ├── mood (Hypnotic, Dark, etc.)
│   ├── vocals (Female Vocal, etc.)
│   └── tempo (BPM ranges)
├── popularTags - Популярные теги
└── tracks - Полная база треков (8202 шт)
```

---

## ПОТОК ДАННЫХ

### Albums View
```
switchView('albums')
  → loadMoreAlbums() [API + infinite scroll]
    → renderAlbums()
      → click album
        → loadAlbumTracks() [API]
          → selectTrack()
            → renderPlaylist()
```

### Top Tracks View
```
switchView('top-tracks')
  → loadTopTracks() [API + infinite scroll]
    → renderTopTracks()
      → click track
        → playTopTrack()
          → selectTrack()
```

### By Tags View
```
switchView('tags')
  → loadAllTags() [JSON]
    → renderTagsCloud()
      → click tag
        → selectTag()
          → loadMoreTagTracks() [JSON pagination]
            → renderTagTracksPage()
              → click track
                → playTagTrack()
                  → selectTrack()
```

---

## КЛЮЧЕВЫЕ ПРОБЛЕМЫ

1. **Дублирование логики** - 3 разных реализации infinite scroll
2. **Перемешанные ответственности** - renderTagTracksPage вызывает setupObserver
3. **Отсутствие дедупликации** - observer может сработать многократно
4. **Сложное состояние** - много глобальных переменных
5. **Нет обработки ошибок** - кроме console.error

---

## ДЕТАЛЬНЫЙ АНАЛИЗ ПАГИНАЦИИ

### Top Tracks (эталонная реализация)

**Архитектура:**
- Источник: API `https://api.dj1.ru/api/tracks`
- Загрузка: `loadTopTracks()` → fetch → parse → render
- Infinite Scroll: ❌ Нет явного Observer, браузер сам скроллит
- Страница: 20 треков, API limit=20
- Состояние: `topTracksPage`, `topTracksHasMore`, `isLoadingTopTracks`

**Код работы:**
```javascript
// Проверка условий
if (isLoadingTopTracks || !topTracksHasMore) return;

// Запрос к API
const url = `https://api.dj1.ru/api/tracks?page=${topTracksPage}&limit=20`;
const response = await fetch(url);
const data = await response.json();

// Добавление в массив
topTracks = topTracks.concat(newTracks);

// Рендер ТОЛЬКО новых
renderTopTracks(newTracks);

// Инкремент страницы
topTracksPage++;
```

**Преимущества:**
- ✅ Простота: запрос → рендер → повтор
- ✅ Надёжность: нет Observer = нет утечек
- ✅ Контроль API: сервер отдаёт точное число страниц
- ✅ Мобильные: стабильно работает на слабых устройствах

**Недостатки:**
- ⚠️ Сеть: каждый запрос = HTTP сессия
- ⚠️ Задержка: latency сети влияет на UX

---

### By Tags (исправляемая реализация)

**Архитектура:**
- Источник: `tags-data.json` (локально, 8202 трека)
- Загрузка: `loadMoreTagTracks()` → slice из JSON
- Infinite Scroll: ✅ IntersectionObserver с sentinel
- Страница: 20 треков, TAG_TRACKS_PER_PAGE=20
- Состояние: `tagTracksPage`, `tagTracksHasMore`, `isLoadingTagTracks`

**Проблемы предыдущей реализации:**
- ❌ Observer пересоздавался при КАЖДОЙ подгрузке
- ❌ `renderTagTracksPage()` вызывал `setupTagTracksInfiniteScroll()`
- ❌ Старый observer не успевал "отвязаться"
- ❌ Срабатывало 2-3 раза одновременно → дубликаты

**Текущее исправление (коммит b27791d):**
- ✅ Явное удаление старого sentinel: `oldSentinel.remove()`
- ✅ Обнуление observer: `tagTracksObserver = null`
- ✅ Флаг защиты: `isLoadingTagTracks` блокирует повторные вызовы
- ✅ Логирование для отладки

**Код работы:**
```javascript
// IntersectionObserver срабатывает на sentinel
if (entries[0].isIntersecting && !isLoadingTagTracks && tagTracksHasMore) {
    loadMoreTagTracks();
}

// Вычисление среза из JSON
const startIndex = (tagTracksPage - 1) * 20;
const pageTrackIds = allTagTrackIds.slice(startIndex, endIndex);

// Сборка полных данных
const pageTracks = pageTrackIds.map(id => allTracks[id]);

// Рендер только новых
renderTagTracksPage(pageTracks);

// Инкремент
tagTracksPage++;
```

**Преимущества:**
- ✅ Мгновенная загрузка: данные в памяти
- ✅ Автоматический UX: пользователь просто скроллит
- ✅ Офлайн: работает без сети
- ✅ Нет HTTP запросов

**Недостатки:**
- ⚠️ RAM: вся база треков в памяти (~5MB JSON)
- ⚠️ DOM: много элементов при долгом скролле

---

### Albums View (промежуточная реализация)

**Архитектура:**
- Источник: API `https://api.dj1.ru/api/playlists`
- Загрузка: `loadMoreAlbums()` → fetch
- Infinite Scroll: ✅ Observer в `document.body`
- Sentinel: Один при старте в body

**Особенности:**
- Работает стабильно
- Sentinel в body (не в контейнере)
- Меньше проблем чем у Tags

---

## СРАВНЕНИЕ ПОДХОДОВ

| Параметр | Top Tracks | By Tags | Albums |
|----------|-----------|---------|--------|
| **Источник** | API | JSON | API |
| **Observer** | ❌ Нет | ✅ Есть | ✅ Есть |
| **HTTP запросы** | Много | Нет | Много |
| **RAM** | Низкая | Средняя | Низкая |
| **CPU** | Низкий | Средний | Средний |
| **Mobile UX** | ✅ Отлично | ✅ Отлично | ✅ Хорошо |
| **Надёжность** | 🔥🔥🔥 | 🔥🔥 | 🔥🔥🔥 |

---

## РЕКОМЕНДАЦИИ

### Немедленные (критично)

1. **✅ Уже исправлено в последнем коммите:**
   - Не пересоздавать observer в Tags
   - Добавить явное удаление sentinel
   - Использовать флаги защиты

2. **⚠️ Требует тестирования:**
   - Проверить на мобильных (iOS Safari, Android Chrome)
   - Протестировать долгий скролл (100+ треков)
   - Проверить переключение между видами

### Долгосрочные (рефакторинг)

1. **Выделить InfiniteScrollController:**
   ```javascript
   class InfiniteScrollController {
       constructor(container, onLoad, options) { ... }
       setup() { ... }
       destroy() { ... }
       updateSentinel(text) { ... }
   }
   ```

2. **Унифицировать API:**
   - Единый интерфейс для всех видов
   - Разные стратегии: API vs JSON

3. **Виртуализация списка:**
   - Удалять старые элементы из DOM
   - Рендерить только видимые + буфер

4. **Обработка ошибок:**
   - Retry logic для API
   - Graceful degradation

---
