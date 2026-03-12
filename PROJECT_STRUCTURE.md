# DJ1 Music Platform - Структура проекта

## 📁 Основные файлы (корень)

| Файл | Описание |
|------|----------|
| `index.html` | Главная страница сайта |
| `script.js` | Основной JavaScript (плеер, навигация, API) |
| `style.css` | Основные стили сайта |
| `rays.js` | Анимация лучей на фоне |
| `rays.css` | Стили для анимации лучей |
| `favicon.svg` | Иконка сайта |
| `CNAME` | Доменное имя для GitHub Pages |
| `.gitignore` | Игнорируемые файлы Git |

---

## 📂 Папки проекта

### `/scripts` - Генерация данных
- `generate-tags-data.js` - Скрипт генерации tags-data.json
- Другие скрипты генерации

### `/utils` - Python утилиты
- `generate_tags_data.py` - Генерация данных тегов
- `generate_phase1.py` - Phase 1 анализ
- `update_tags_carefully.py` - Обновление тегов
- `run_analysis.sh` - Bash скрипт запуска анализа

### `/tests` - Тесты и логи
- `analyze_api_phase1.py` - Анализ API для Phase 1
- `phase1-analysis-output.txt` - Результаты анализа
- `phase1-status.txt` - Статус Phase 1

### `/backups` - Резервные копии
- `*.md` - Старые документы и статусы
- Резервные копии важных файлов

### `/configs` - Конфигурация
- Конфигурационные файлы (если понадобятся)

### `/data` - Данные (актуальные)
- `albums/` - Обложки альбомов
- `albums.js` - Данные альбомов
- `tags-data.json` - Актуальные теги
- `api-all-tracks-raw.json` - Сырые данные из API

### `/docs` - Документация
- `README.md` - Общая документация
- `STRUCTURE.md` - Структура проекта
- `AUDIT.md` - Аудит кода
- `CODE_CHEATSHEET.md` - Шпаргалка по коду
- `QUICKSTART.md` - Быстрый старт
- `METKI.md` - Информация о тегах
- `PHASE1_*.md` - Документация Phase 1
- `SCRIPT_AUDIT_CRITICAL.md` - Аудит script.js
- `TAG_EXPANSION_ANALYSIS.md` - Анализ расширения тегов

---

## 🚀 Использование

### Запуск локально
```bash
# Просто открой index.html в браузере
open index.html
```

### Генерация данных тегов
```bash
cd utils
python generate_tags_data.py
```

### Анализ API
```bash
cd tests
python analyze_api_phase1.py
```

---

## 📝 Важные заметки

1. **Не модифицируй файлы в `/backups`** - это история изменений
2. **Актуальные данные только в `/data`** - используйте JSON файлы отсюда
3. **Документация в `/docs`** - вся актуальная информация там
4. **Скрипты в `/scripts` и `/utils`** - Python для бэкенда, JS для фронтенда

---

## 🔧 Разработка

### Основные компоненты:
- ** Плеер**: `script.js` (функции playCurrent, pauseCurrent, nextTrack, prevTrack)
- ** Навигация**: `script.js` (switchView, loadTopTracks, loadTagTracks)
- ** Стили**: `style.css` + `rays.css`
- ** Данные**: `/data/tags-data.json`, `/data/albums.js`

### Тестирование:
- Проверка работы плеера
- Переключение между Albums/Top Tracks/By Tags
- Бесконечный скролл
- Сохранение состояния (localStorage)
- Media Session API (lock screen controls)

---

**Статус**: ✅ Структурировано и организовано
