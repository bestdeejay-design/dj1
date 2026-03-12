# 🚀 ПОШАГОВАЯ МИГРАЦИЯ НА SUPABASE

## Проблема с Python библиотекой

Есть проблема совместимости Python 3.14 и библиотек Supabase. Предлагаю **альтернативный подход** через SQL Editor.

---

## ✅ ВАРИАНТ 1: Через SQL Editor (рекомендуется)

### Шаг 1: Создай таблицы

1. Открой https://nwdalhrbifkjyyhpstnt.supabase.co
2. **SQL Editor** (левое меню)
3. **New Query**
4. Вставь код из `configs/setup_supabase.sql`
5. **Run** (Cmd+Enter)

**Проверь что появились таблицы:**
- albums
- tracks  
- tags
- track_tags

---

### Шаг 2: Сгенерируй SQL для данных

В терминале:

```bash
cd utils
python3 json_to_sql.py > migration_data.sql
```

Файл будет ~5MB, содержит все INSERT запросы.

---

### Шаг 3: Загрузи данные

**ВАЖНО:** Данные большие, загружай частями!

#### Часть 1: Альбомы и теги

1. Скопируй секцию "-- Albums" из migration_data.sql
2. Вставь в SQL Editor
3. Run

#### Часть 2: Треки (по 500 штук)

1. Скопируй первые 500 INSERT из секции "-- Tracks"
2. Вставь в SQL Editor
3. Run
4. Повтори для следующих партий

#### Часть 3: Теги

1. Скопируй секцию "-- Tags"
2. Вставь в SQL Editor
3. Run

---

### Шаг 4: Свяжи треки и теги

Сначала получи ID тегов:

```sql
SELECT id, category, name FROM tags;
```

Затем создай связи вручную для ключевых тегов или используй скрипт `sync_relations.py` (если напишем).

---

## ⚙️ ВАРИАНТ 2: Исправить Python библиотеку

Попробуй создать виртуальное окружение на старой версии Python:

```bash
# Проверь доступные версии Python
ls /usr/local/bin/python*

# Если есть python3.9 или python3.10:
cd utils
rm -rf venv
python3.10 -m venv venv
source venv/bin/activate
pip install supabase python-dotenv
python migrate_to_supabase.py
```

---

## 📊 МОНИТОРИНГ ПРОЦЕССА

После каждой вставки проверяй:

```sql
-- Сколько записей
SELECT 
    (SELECT COUNT(*) FROM albums) as albums,
    (SELECT COUNT(*) FROM tracks) as tracks,
    (SELECT COUNT(*) FROM tags) as tags;
```

**Ожидаемый результат:**
- Альбомов: ~100
- Треков: 9705
- Тегов: 103

---

## 🎯 БЫСТРЫЙ СТАРТ (минимальная миграция)

Если хочешь быстро протестировать:

```sql
-- 1. Создай таблицы (из setup_supabase.sql)

-- 2. Добавь 1 тестовый альбом
INSERT INTO albums (id, title, track_count) 
VALUES ('test-album', 'Test Album', 1);

-- 3. Добавь 1 тестовый трек
INSERT INTO tracks (id, name, file, album_id) 
VALUES ('test-track', 'Test Track', 'https://example.com/track.mp3', 'test-album');

-- 4. Добавь 1 тег
INSERT INTO tags (category, name, label) 
VALUES ('context', 'deep', '🎧 Context');

-- 5. Свяжи трек и тег
INSERT INTO track_tags (track_id, tag_id) 
VALUES ('test-track', 1);

-- 6. Проверь
SELECT t.name, tg.category, tg.name as tag_name
FROM tracks t
JOIN track_tags tt ON t.id = tt.track_id
JOIN tags tg ON tt.tag_id = tg.id
WHERE t.id = 'test-track';
```

---

## 🔄 СИНХРОНИЗАЦИЯ С JSON

**Важно:** JSON файлы остаются неизменными!

- **Source of Truth**: library.json, tags-data.json
- **Operational DB**: Supabase
- **Sync Direction**: JSON → Supabase (однонаправленная)

Для обратной синхронизации (бэкап):

```bash
# Напишем скрипт если нужно
python export_from_supabase.py
```

---

## 🆘 TROUBLESHOOTING

### Ошибка: "relation already exists"
- Таблицы уже созданы - пропусти шаг 1
- Или удали: `DROP TABLE track_tags, tags, tracks, albums CASCADE;`

### Ошибка: "too many columns"
- Разбивай INSERT на части по 100-500 записей

### Завис вставка
- Проверь интернет
- Используй меньшие пакеты
- Посмотри логи в **Settings** → **Logs**

---

## 📚 СЛЕДУЮЩИЕ ШАГИ

1. ✅ Создать таблицы
2. ✅ Загрузить тестовые данные (1 альбом, 5 треков)
3. ✅ Протестировать запросы
4. ⏳ Загрузить все данные
5. ⏳ Интегрировать с сайтом

---

**ГОТОВ НАЧАТЬ?** 

Скопируй код из `configs/setup_supabase.sql` и вставь в SQL Editor! 🎯
