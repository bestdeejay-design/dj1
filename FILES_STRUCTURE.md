# 📁 Структура Файлов Проекта

## 🎯 Чистая Структура (Production)

```
dj1/
├── index.html                    # Главная страница
├── index-broken-tracks.html      # Debug: битые треки
├── index-complex-test.html       # Тестовая страница
├── index-tags-test.html          # Тест тегов
├── test-db.html                  # Тест базы данных
│
├── script.js                     # Основной JavaScript
├── style.css                     # Основные стили
├── rays.js                       # Raycast эффекты JS
├── rays.css                      # Raycast эффекты CSS
├── favicon.svg                   # Фавиконка
├── CNAME                         # GitHub Pages domain
│
├── data/                         # Данные (источник истины)
│   ├── tags-data.json            # Теги треков
│   ├── all_tracks_tags.json     # Все связи треков и тегов
│   └── ...                       # Другие JSON файлы
│
├── archive/                      # Архив (не нужно для работы)
│   ├── scripts/                  # Python/Bash скрипты импорта
│   ├── sql-dumps/               # SQL файлы, дампы базы
│   ├── logs/                    # Логи импорта
│   ├── tests/                   # Старые тесты
│   ├── docs-old/                # Старая документация
│   └── imports-old/             # Старые импорты и бэкапы
│
├── .gitignore                    # Git ignore правила
├── API_SUPABASE_GUIDE.md         # Документация API & Supabase
└── PROJECT_STRUCTURE.md          # Этот файл
```

---

## ✅ Файлы Нужные для Работы Сайта

### **Обязательные:**
- `index.html` - главная страница
- `script.js` - логика приложения
- `style.css` - стили
- `data/tags-data.json` - теги треков

### **Опциональные (Debug/Test):**
- `index-broken-tracks.html` - проверка битых треков
- `index-complex-test.html` - тесты
- `index-tags-test.html` - тест тегов
- `test-db.html` - тест БД

### **Вспомогательные:**
- `rays.js`, `rays.css` - визуальные эффекты
- `favicon.svg` - иконка
- `CNAME` - домен для GitHub Pages

---

## ❌ Файлы Не Нужные для Работы (в Archive)

### **archive/scripts/**
- Все Python скрипты для импорта
- Bash скрипты
- Dockerfile
- requirements.txt

**Примеры:**
- `migrate_to_supabase.py`
- `import_all_tracks.py`
- `normalize_tags_v24.py`
- `auto_import_bash_final.sh`

### **archive/sql-dumps/**
- SQL файлы для импорта
- Дампы базы
- Части SQL файлов

**Примеры:**
- `all_tracks.sql` (11.5 MB)
- `full_migration.sql`
- `import_tracks_part_*.sql` (18 файлов)
- `auto_relations.sql`

### **archive/logs/**
- Логи процессов импорта
- Отчёты об ошибках

**Примеры:**
- `auto_import.log` (354 KB)
- `docker_import.log` (97 KB)
- `sql_gen_v2.log` (2.2 GB!)
- `import.log` (357 KB)

### **archive/tests/**
- Старые тестовые файлы
- Результаты анализа

**Примеры:**
- `phase1-analysis-output.txt` (1.4 MB)
- `phase1-status.txt`

### **archive/docs-old/**
- Старая документация
- Технические заметки

**Примеры:**
- `HOW_TO_EDIT_TRACK_TAGS.md`
- `SUPABASE_SETUP.md`
- `MIGRATION_STEPS.md`

### **archive/imports-old/**
- Старые бэкапы
- Резервные копии JSON

**Примеры:**
- `library.json` (33.8 KB)
- `CURRENT_STATUS.md`
- `STATUS_UPDATE.md`

---

## 📊 Статистика

| Категория | Файлов | Размер |
|-----------|--------|--------|
| **Production** | ~10 | ~200 KB |
| **Data** | ~10 | ~5 MB |
| **Archive** | ~200+ | ~5 GB+ |
| **Total** | ~220 | ~5.2 GB |

---

## 🔄 Как Использовать Archive

### **Достать скрипт:**
```bash
cp archive/scripts/import_all_tracks.py utils/
python3 utils/import_all_tracks.py
```

### **Посмотреть логи:**
```bash
cat archive/logs/auto_import.log | grep "ERROR"
```

### **Найти SQL дамп:**
```bash
ls -lh archive/sql-dumps/*.sql | sort -k5 -h
```

---

## 🗑️ Что Можно Удалить Навсегда

### **Безопасно удалить:**
- ✅ Все `.log` файлы (логи старых импортов)
- ✅ `sql_gen_v2.log` (2.2 GB мусора!)
- ✅ Старые части SQL (`import_tracks_part_*.sql`)
- ✅ Все бэкапы из `archive/imports-old/`

### **Оставить:**
- ⚠️ `full_migration.sql` - полная схема БД
- ⚠️ `edit_track_tags.py` - полезный скрипт редактирования
- ⚠️ `API_SUPABASE_GUIDE.md` - актуальная документация

---

## 📝 Примечания

1. **Все импорты завершены** - можно удалить 90% скриптов
2. **Supabase заполнена** - SQL дампы больше не нужны
3. **Документация обновлена** - старые MD файлы не нужны
4. **Логи не читаются** - можно удалить все `.log`

---

**Last Updated:** 2026-03-15  
**Status:** ✅ Production Ready
