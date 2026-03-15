# Как редактировать теги у трека

## 📝 Структура данных

Теги хранятся в файле `data/tags-data.json` и организованы по категориям:

```json
{
  "categories": {
    "context": {
      "label": "🎧 Context",
      "tags": {
        "deep": {
          "count": 1780,
          "tracks": ["track-id-1", "track-id-2", ...]
        }
      }
    },
    "mood": {...},
    "energy": {...},
    "genres": {...}
  }
}
```

**ВАЖНО:** Теги НЕ хранятся явно у каждого трека. Вместо этого:
- Каждый тег содержит список ID треков, которые к нему относятся
- Чтобы добавить тег треку → нужно добавить track_id в список тега
- Чтобы удалить тег → удалить track_id из списка

---

## 🔍 Способ 1: Python утилита (рекомендуется)

### Поиск трека по названию

```bash
cd utils
python edit_track_tags.py "Rain don't fall"
```

**Вывод:**
```
🔍 Поиск трека: Rain don't fall
============================================================
✅ Найдено треков: 1

1. Rain don't fall (Acoustic Variation) - Album Name
   ID: abc12345-...
   Теги: context.deep, mood.melancholic, energy.calm
```

### Добавить тег

```bash
python edit_track_tags.py --add <TRACK_ID> <category>.<tag>

# Пример:
python edit_track_tags.py --add abc12345 context.atmospheric
```

### Удалить тег

```bash
python edit_track_tags.py --remove <TRACK_ID> <category>.<tag>

# Пример:
python edit_track_tags.py --remove abc12345 context.deep
```

### Показать все теги трека

```bash
python edit_track_tags.py --show <TRACK_ID>
```

### Показать все категории и теги

```bash
python edit_track_tags.py --list
```

---

## ✏️ Способ 2: Ручное редактирование JSON

### Шаг 1: Найти ID трека

1. Открой модалку с информацией о треке (клик по названию)
2. Скопируй ID из консоли браузера (добавь логирование в script.js):
   ```javascript
   console.log('Track ID:', track.id);
   ```

Или найди в `library.json` по названию.

### Шаг 2: Открыть tags-data.json

```bash
# Открой файл в редакторе
code data/tags-data.json
```

### Шаг 3: Найти нужную категорию и тег

Пример структуры:
```json
{
  "categories": {
    "context": {
      "tags": {
        "deep": {
          "count": 1780,
          "tracks": [
            "fa832bde-a011-4c69-9783-adc93f41c3d6",
            "abc12345-...."  // ← Добавь ID сюда
          ]
        }
      }
    }
  }
}
```

### Шаг 4: Добавить track_id в массив

```json
"tracks": [
  "...существующие ID...",
  "abc12345-новый-ID"  // ← Добавить запятую и новый ID
]
```

### Шаг 5: Обновить count

```json
"count": 1781  // ← Увеличить на 1
```

### Шаг 6: Сохранить файл

---

## 🎛️ Доступные категории

| Категория | Описание | Примеры тегов |
|-----------|----------|---------------|
| **context** | Контекст/атмосфера | deep, atmospheric, dark, bright |
| **instruments** | Инструменты | synth, guitar, piano, drums |
| **character** | Характер | melodic, rhythmic, harmonic |
| **mood** | Настроение | sad, happy, romantic, nostalgic |
| **energy** | Энергетика | energetic, calm, aggressive, chill |
| **genres** | Жанры | electronic, rock, pop, jazz |
| **tempo** | Темп | slow, medium, fast, uptempo |
| **vocals** | Вокал | female, male, instrumental, vocal |
| **era** | Эпоха | 70s, 80s, 90s, 2000s |

---

## ⚠️ Важные заметки

1. **Backup!** Перед редактированием сделай копию:
   ```bash
   cp data/tags-data.json data/tags-data.backup.json
   ```

2. **Валидация JSON** после редактирования:
   ```bash
   python -m json.tool data/tags-data.json > /dev/null && echo "OK"
   ```

3. **Перезагрузка** - после изменений обнови страницу в браузере

4. **Кэширование** - если изменения не видны, очистите кэш браузера

---

## 💡 Автоматическое извлечение тегов

Теги в модалке **извлекаются автоматически** из промпта (`track.sound`) через функцию `extractTagsFromSound()`.

Она ищет ключевые слова в тексте промпта:
- `deep`, `atmospheric`, `electronic`, `synth`...
- Жанры: `pop`, `rock`, `jazz`, `techno`...
- Декадии: `90s`, `80s`, `2000s`...

**Но!** Это не связано с `tags-data.json`. Модалка показывает теги из промпта, а страница "By Tags" использует `tags-data.json`.

---

## 🔄 Синхронизация

Если хочешь чтобы теги в модалке совпадали с тегами на странице "By Tags":

1. Найди трек в `tags-data.json` в нескольких категориях
2. Эти же теги должны быть в `track.sound` (промте)
3. Тогда `extractTagsFromSound()` найдёт их и покажет в модалке

Или наоборот - сначала напиши промпт с тегами, потом добавь трек в соответствующие категории.
