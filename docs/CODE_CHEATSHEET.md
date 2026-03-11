# 📖 ШПАРГАЛКА ПО КОДУ (CODE CHEATSHEET)

> **💡 ДЛЯ РАЗРАБОТЧИКА:** Этот документ обновляется при каждом изменении архитектуры. Перед добавлением новой функции — проверь этот файл на наличие существующих реализаций.

## ⚠️ КРИТИЧНЫЕ ЗАВИСИМОСТИ И ОГРАНИЧЕНИЯ

### 🚫 НЕ НАРУШАТЬ! Важные зависимости

**1. Infinite Scroll инициализация:**
- ❌ НЕ вызывать `setupTagTracksInfiniteScroll()` внутри `renderTagTracksPage()`
- ✅ Вызывать ОДИН раз в `selectTag()` при выборе тега
- Причина: Пересоздание observer приводит к дублированию вызовов

**2. Восстановление состояния плеера:**
- ❌ НЕ использовать `setTimeout` для async операций
- ✅ Использовать callback после загрузки данных
- Причина: Таймаут не гарантирует готовность данных

**3. Переключение видов:**
- ❌ НЕ менять `currentView` напрямую без `switchView()`
- ✅ Всегда использовать `switchView('view-name')`
- Причина: `switchView` очищает таймеры и observer

**4. Пагинация API:**
- ❌ НЕ сбрасывать `topTracksPage` без смены сортировки
- ✅ Сбрасывать только в `resetAndReloadTopTracks()`
- Причина: Потеря прогресса пагинации

**5. Работа с тегами:**
- ❌ НЕ модифицировать `window.tagsData.tracks` напрямую
- ✅ Использовать slice/mapping для извлечения
- Причина: Данные используются в нескольких местах

---

### 🔒 БЛОКИРОВКИ (Flags)

| Флаг | Когда true | Что блокирует | Где проверять |
|------|------------|---------------|---------------|
| `isLoadingTagTracks` | Загрузка страницы треков | Повторный вызов `loadMoreTagTracks()` | Observer, click handlers |
| `isLoadingTopTracks` | Загрузка топа | Повторный fetch API | Скролл, retry logic |
| `tagTracksHasMore` | Достигнут конец списка | Бесконечный скролл | Observer, UI sentinel |
| `isLoading` | Загрузка альбомов | Параллельные запросы | Infinite scroll |

---

### ⛓️ ЦЕПОЧКИ ВЫЗОВОВ

**Запуск трека из Tags:**
```
click track → playTagTrack() → selectTrack() → renderPlaylist()
                                      ↓
                              restoreTagTrackPlayer() ← ВОССТАНОВЛЕНИЕ
```

**Переключение вида:**
```
click tab → switchView() → cleanup observers → load data → setup new view
                                ↓
                        savePlayerState() ← СОХРАНЕНИЕ
```

**Пагинация Tags:**
```
scroll → sentinel visible → IntersectionObserver → loadMoreTagTracks()
                                                      ↓
                                              renderTagTracksPage()
                                                      ↓
                                          updateSentinel text ONLY!
```

---

## 🎯 БЫСТРЫЙ ПОИСК ФУНКЦИЙ В script.js
```javascript
switchView('albums')      // строка ~1240
switchView('top-tracks')  // строка ~1240
switchView('tags')        // строка ~1240
```

### Загрузка данных
```javascript
loadMoreAlbums()          // строка ~547   - API альбомов
loadAlbumTracks(album)    // строка ~600   - API треков альбома
loadTopTracks()           // строка ~1326  - API топа
loadAllTags()             // строка ~1850  - JSON тегов
loadMoreTagTracks()       // строка ~1948  - JSON пагинация
```

### Рендеринг
```javascript
renderAlbums()            // строка ~700   - карточки альбомов
renderTopTracks()         // строка ~1389  - список топа
renderTagTracksFull()     // строка ~2118  - все треки тега
renderTagTracksPage()     // строка ~2138  - страница треков
```

### Плеер
```javascript
selectTrack(album, idx)   // строка ~850   - выбор трека
playCurrent()             // строка ~900   - старт
pauseCurrent()            // строка ~920   - пауза
nextTrack()               // строка ~940   - следующий
prevTrack()               // строка ~960   - предыдущий
toggleShuffle()           // строка ~1000  - перемешать
toggleRepeat()            // строка ~1020  - повтор
renderPlaylist()          // строка ~1100  - плейлист UI
```

### Infinite Scroll
```javascript
setupInfiniteScroll()     // строка ~547   - Albums observer
setupTagTracksInfiniteScroll() // строка ~2077 - Tags observer
```

### Утилиты
```javascript
escapeHtml(str)           // строка ~2300  - экранирование
formatNumber(num)         // строка ~2310  - 1K, 1M формат
getApiSortParam(sort)     // строка ~450   - маппинг для API
```

---

## 🔑 ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ

### Состояние view
```javascript
currentView        // 'albums' | 'top-tracks' | 'tags'
currentAlbum       // текущий альбом/плейлист
currentTrackIndex  // индекс трека в плейлисте
```

### Коллекции данных
```javascript
albums[]           // загруженные альбомы
topTracks[]        // загруженные топы
tagTracks[]        // загруженные треки тега
```

### Пагинация
```javascript
albumsPage         // текущая страница альбомов
albumsHasMore      // есть ли ещё страницы
topTracksPage      // текущая страница топа
topTracksHasMore   // есть ли ещё страницы
tagTracksPage      // текущая страница тега
tagTracksHasMore   // есть ли ещё страницы
```

### Флаги загрузки
```javascript
isLoading          // загрузка альбомов
isLoadingTopTracks // загрузка топа
isLoadingTagTracks // загрузка тега
```

### Сортировка и фильтры
```javascript
currentSort        // 'created_at' | 'plays' | 'favorites'
currentOrder       // 'desc' | 'asc'
privacyFilter      // 'all' | 'public'
bestUserId         // ID автора BEST
```

---

## 📦 ИСТОЧНИКИ ДАННЫХ

### API Endpoints
```
GET https://api.dj1.ru/api/playlists
  ?page={num}&limit=20
  &sort={created_at|plays|favorites}
  &order={desc|asc}
  &author_id={bestUserId}
  &privacy={public}

GET https://api.dj1.ru/api/tracks
  ?page={num}&limit=20
  &sort={created_at|plays|favorites}
  &order={desc|asc}
  &author_id={bestUserId}
```

### Локальные JSON
```javascript
window.tagsData.categories   // категории тегов
window.tagsData.popularTags  // популярные теги
window.tagsData.tracks       // вся база треков (8202 шт)
library.json                  // локальные альбомы
```

---

## 🐛 ТИПИЧНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема: Observer срабатывает многократно
**Решение:** Проверять `isLoadingTagTracks` перед вызовом
```javascript
if (entries[0].isIntersecting && !isLoadingTagTracks) {
    loadMoreTagTracks();
}
```

### Проблема: Трек не играет после переключения view
**Решение:** Использовать `restoreTagTrackPlayer()` или `restoreTopTrackPlayer()`

### Проблема: Не сбрасывается пагинация при смене сортировки
**Решение:** Вызывать `resetAndReload()` или `resetAndReloadTopTracks()`

---

## 📱 МОБИЛЬНАЯ ОПТИМИЗАЦИЯ

### Тяжёлые операции
- ❌ Рендер >100 элементов подряд
- ❌ Частые DOM манипуляции
- ❌ Большие изображения без lazy loading

### Рекомендации
- ✅ Использовать `requestAnimationFrame` для анимаций
- ✅ Debounce для скролла
- ✅ Lazy loading для изображений

---

## 🔧 ОТЛАДКА

### Полезные console.log точки
```javascript
// В начале loadMoreTagTracks()
console.log('loadMoreTagTracks called:', { tagTracksPage, tagTracksHasMore });

// В IntersectionObserver
console.log('Observer triggered:', entries[0].isIntersecting);

// После рендера
console.log('Rendered tracks:', tagTracks.length, 'Page:', tagTracksPage);
```

### Проверка состояния в консоли
```javascript
// Текущее состояние
console.log({ currentView, currentAlbum, currentTrackIndex });

// Пагинация
console.log({ tagTracksPage, tagTracksHasMore, tagTracks.length });

// Данные
console.log('Total tags:', Object.keys(window.tagsData.categories).length);
console.log('Total tracks in DB:', Object.keys(window.tagsData.tracks).length);
```

---

## 🎨 CSS КЛАССЫ (style.css)

### Основные контейнеры
```css
.gallery          // Albums view
.top-tracks-view  // Top Tracks view
.tags-view        // By Tags view
.tags-cloud       // Облако тегов
.tag-tracks-list  // Список треков тега
```

### Элементы управления
```css
.view-tabs        // Табы переключения видов
.sort-controls    // Сортировка и фильтры
.loading          // Индикатор загрузки
.error            // Сообщение об ошибке
```

### Плеер
```css
.player-bar       // Основная панель
.playlist-panel   // Выпадающий плейлист
.track-details-modal // Модалка деталей трека
```

### Карточки и элементы
```css
.album-card       // Карточка альбома
.top-track-item   // Элемент топа
.playing          // Активный трек (подсветка)
```

---

## 🚀 ПРОИЗВОДИТЕЛЬНОСТЬ

### Узкие места
1. **Рендер больших списков** >100 элементов
2. **IntersectionObserver** при частом создании
3. **DOM манипуляции** без оптимизации

### Оптимизации
1. ✅ Рендерить только новые элементы (не весь список)
2. ✅ Создавать observer один раз, не пересоздавать
3. ✅ Использовать `documentFragment` для группировки
4. ✅ Debounce для частых событий

---

## 📝 ЧЕКЛИСТ ПЕРЕД КОММИТОМ

- [ ] Проверить что infinite scroll работает во всех view
- [ ] Протестировать переключение между видами
- [ ] Убедиться что плеер сохраняет состояние
- [ ] Проверить консоль на наличие ошибок
- [ ] Протестировать на мобильном (если возможно)
- [ ] Обновить документацию если менялась архитектура

---

**Последнее обновление:** 2026-02-20  
**Версия:** v1.0 (после исправления пагинации Tags)
