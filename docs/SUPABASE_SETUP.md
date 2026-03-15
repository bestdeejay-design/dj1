# Настройка Supabase для DJ1

## 📋 Шаг 1: Создание проекта

1. Зайди на https://supabase.com
2. **New Project**
3. Название: `DJ1 Music`
4. Database Password: **запомни или сохрани в менеджере паролей!**
5. Region: Europe (Frankfurt) - ближайшая к тебе
6. **Create Project** (ждём 2-3 минуты)

---

## 🔑 Шаг 2: Получение API ключей

После создания проекта:

1. **Settings** (шестерёнка внизу слева)
2. **API**
3. Скопируй:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (длинная строка)

---

## 💾 Шаг 3: Установка переменных окружения

Создай файл `.env` в корне проекта:

```bash
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Или установи в терминале:

```bash
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_KEY="eyJhbG..."
```

---

## 🗄️ Шаг 4: Создание таблиц БД

В Supabase Dashboard:

1. **SQL Editor** (в левом меню)
2. **New Query**
3. Вставь SQL код из файла `setup_supabase.sql`
4. **Run** (или Cmd+Enter)

Проверь что появились таблицы:
- albums
- tracks
- tags
- track_tags

---

## 📦 Шаг 5: Установка зависимостей

```bash
cd utils
pip3 install -r requirements.txt
```

---

## 🚀 Шаг 6: Запуск миграции

### Тестовый запуск (10 треков):

Сначала протестируем на малых данных:

```bash
# Открой migrate_to_supabase.py
# Найди строку ~108 и раскомментируй тестовый режим
python3 migrate_to_supabase.py
```

### Полная миграция:

```bash
python3 migrate_to_supabase.py
```

**Ожидаемый результат:**
```
🏷️  Миграция тегов...
✅ Мигрировано 103 тегов

💿 Миграция альбомов и треков...
✅ Мигрировано 100 альбомов и 9705 треков

🔗 Создание связей track-tag...
✅ Создано 25000 связей

✅ Проверка миграции...
   Альбомов: 100
   Треков: 9705
   Тегов: 103
   Связей: 25000
```

---

## 🔍 Шаг 7: Проверка данных

В Supabase Dashboard:

1. **Table Editor** (иконка таблицы слева)
2. Выбери таблицу (например, `tracks`)
3. Посмотри данные

Или сделай SQL запрос:

```sql
-- Посмотреть первые 10 треков
SELECT id, name, album_id FROM tracks LIMIT 10;

-- Посмотреть теги конкретного трека
SELECT t.name, tg.category, tg.name as tag_name
FROM tracks t
JOIN track_tags tt ON t.id = tt.track_id
JOIN tags tg ON tt.tag_id = tg.id
WHERE t.id = 'track-id-here';
```

---

## 🎨 Шаг 8: Supabase Studio UI

Для удобного редактирования:

1. В Supabase Dashboard нажми **Table Editor**
2. Выбирай любую таблицу
3. Редактируй данные как в Excel

**Преимущества:**
- ✅ Визуальный редактор
- ✅ Поиск и фильтрация
- ✅ История изменений
- ✅ Экспорт в CSV/JSON

---

## 🔄 Синхронизация с JSON

### Экспорт из Supabase обратно в JSON:

```bash
python3 export_from_supabase.py
```

Это создаст резервные копии JSON файлов.

---

## ⚙️ Интеграция с сайтом

### Вариант 1: Прямые запросы к Supabase

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xxxxx.supabase.co',
  'your-anon-key'
)

// Получить все треки
const { data: tracks } = await supabase
  .from('tracks')
  .select('*, albums(title)')

// Получить треки по тегу
const { data: tracks } = await supabase
  .from('track_tags')
  .select(`
    track_id,
    tracks (*),
    tags (name, category)
  `)
  .eq('tags.name', 'deep')
```

### Вариант 2: Гибридный (кэш + Supabase)

- JSON файлы для чтения (быстро)
- Supabase для редактирования (удобно)
- Синхронизация по расписанию

---

## 🛡️ Безопасность

### RLS (Row Level Security):

По умолчанию включено только чтение для всех.

Для добавления/редактирования нужен **service_role key**:

```bash
# В .env добавь:
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIn0..."
```

**ВАЖНО:** Никогда не публикуй service_role key на фронтенде!

---

## 📊 Мониторинг

В Supabase Dashboard:

1. **Database** → **Tables** - размер БД
2. **Settings** → **Usage** - использование квот
3. **Logs** - логи запросов

**Бесплатный тариф:**
- ✅ 500 MB база
- ✅ 50,000 строк
- ✅ 2GB bandwidth в месяц

Для 9705 треков хватит надолго!

---

## 🆘 Troubleshooting

### Ошибка: "Invalid API key"
- Проверь что используешь **anon/public key**, не service_role
- Убедись что ключ без лишних пробелов/символов

### Ошибка: "relation already exists"
- Таблицы уже созданы, пропусти шаг 4
- Или удали: `DROP TABLE track_tags, tags, tracks, albums CASCADE;`

### Миграция зависла
- Проверь интернет соединение
- Посмотри логи в консоли
- Попробуй меньше данных (тестовый режим)

---

## 📚 Следующие шаги

1. ✅ Миграция данных
2. ⏳ Интеграция с сайтом (читай `INTEGRATION_GUIDE.md`)
3. ⏳ Настройка редактирования
4. ⏳ Автоматическая синхронизация

---

**Готово!** Теперь у тебя профессиональная БД для треков! 🎉
