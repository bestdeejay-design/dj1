# 📋 CHECKLIST: Что делать после завершения анализа API

## ✅ КОГДА СКРИПТ ЗАВЕРШИТСЯ

### 1. Проверить результаты

```bash
# Посмотреть вывод скрипта
tail -100 phase1-analysis-output.txt

# Проверить размеры файлов
ls -lh data/api-all-tracks-raw.json data/api-analysis-results.json
```

**Ожидаемые размеры:**
- `api-all-tracks-raw.json`: ~25-30 MB
- `api-analysis-results.json`: ~50-100 KB

---

### 2. Изучить найденные теги

```bash
# Открыть результаты в удобном формате
python3 -c "
import json
with open('data/api-analysis-results.json') as f:
    data = json.load(f)
    
print('Категории:', list(data['categories'].keys()))
print('Всего тегов:', sum(len(tags) for tags in data['categories'].values()))
"
```

---

### 3. Сравнить с текущими тегами

```bash
# Посмотреть что есть сейчас
python3 -c "
import json
with open('data/tags-data.json') as f:
    current = json.load(f)
    
print('Текущие категории:')
for cat, info in current['categories'].items():
    print(f'  {cat}: {len(info[\"tags\"])} тегов')
"
```

---

### 4. Выявить пробелы

**Создать скрипт сравнения:**

```python
# compare_tags.py
import json

# Загрузить API анализ
with open('data/api-analysis-results.json') as f:
    api_data = json.load(f)

# Загрузить текущие теги
with open('data/tags-data.json') as f:
    current_data = json.load(f)

# Собрать все текущие теги (ключи)
current_tags = set()
for cat_key, cat_data in current_data['categories'].items():
    for tag_key in cat_data['tags'].keys():
        current_tags.add(tag_key.lower())

# Собрать все найденные в API теги
api_tags = {}  # category -> {tag: count}
for category, tags in api_data['categories'].items():
    api_tags[category] = tags

# Найти недостающие
print("=== НЕДОСТАЮЩИЕ ТЕГИ (найдены в API но нет в current) ===\n")

for category, tags in api_tags.items():
    missing = []
    for tag, count in sorted(tags.items(), key=lambda x: x[1], reverse=True):
        tag_key = tag.lower().replace(' ', '-')
        if tag_key not in current_tags:
            missing.append((tag, count))
    
    if missing:
        print(f"{category.upper()}:")
        for tag, count in missing[:10]:  # топ-10
            print(f"  ✅ {tag}: {count} треков ← НЕТ В CURRENT")
        print()
```

**Запустить:**
```bash
python3 compare_tags.py > missing_tags_report.txt
cat missing_tags_report.txt
```

---

### 5. Принять решения

**Формат таблицы:**

| Тег | Категория | Найдено в API | Есть сейчас | Решение |
|-----|-----------|---------------|-------------|---------|
| Hard Techno | Genres | 234 | ❌ Нет | ✅ ДОБАВИТЬ |
| Afro House | Genres | 89 | ❌ Нет | ✅ ДОБАВИТЬ |
| Amapiano | Genres | 2 | ❌ Нет | ❌ ПРОПУСТИТЬ (<30) |
| Phonk | Genres | 0 | ❌ Нет | ❌ НЕ ДОБАВЛЯТЬ |

**Критерии:**
- ✅ **ДОБАВИТЬ**: ≥30 треков и нет в current
- ❌ **ПРОПУСТИТЬ**: <30 треков
- ⚠️ **ОБЪЕДИНИТЬ**: Дубли по смыслу

---

### 6. Обновить tags-data.json

**Сценарий A: Автоматически (рекомендуется)**

```python
# update_tags_from_api.py
import json

# Загрузить API анализ
with open('data/api-analysis-results.json') as f:
    api_data = json.load(f)

# Загрузить текущие данные
with open('data/tags-data.json') as f:
    current_data = json.load(f)

# Загрузить полный дамп треков
with open('data/api-all-tracks-raw.json') as f:
    all_tracks = json.load(f)['tracks']

# Добавить новые теги
for category, tags in api_data['categories'].items():
    if category not in current_data['categories']:
        current_data['categories'][category] = {
            'label': get_category_label(category),
            'tags': {}
        }
    
    for tag, count in tags.items():
        tag_key = tag.lower().replace(' ', '-')
        
        # Пропускаем если <30 треков
        if count < 30:
            continue
        
        # Ищем треки для этого тега
        matching_tracks = find_tracks_with_tag(all_tracks, tag)
        
        if len(matching_tracks) >= 30:
            current_data['categories'][category]['tags'][tag_key] = {
                'count': len(matching_tracks),
                'tracks': matching_tracks,
                'displayName': tag.title()
            }

# Сохранить
with open('data/tags-data-new.json', 'w') as f:
    json.dump(current_data, f, indent=2)

print("✅ Новый tags-data.json создан!")
```

---

**Сценарий B: Ручное добавление**

1. Открыть `data/api-analysis-results.json`
2. Скопировать теги которые хотим добавить
3. Вставить в `data/tags-data.json` в нужную категорию
4. Для каждого тега найти треки через API поиск

---

### 7. Удалить мусорные теги

**Найти теги с <30 треков:**

```python
# find_small_tags.py
import json

with open('data/tags-data.json') as f:
    data = json.load(f)

print("=== МАЛЕНЬКИЕ ТЕГИ (<30 треков) ===\n")

small_tags = []
for cat_key, cat_data in data['categories'].items():
    for tag_key, tag_info in cat_data['tags'].items():
        if tag_info['count'] < 30:
            small_tags.append({
                'category': cat_key,
                'tag': tag_key,
                'displayName': tag_info['displayName'],
                'count': tag_info['count']
            })

for tag in sorted(small_tags, key=lambda x: x['count']):
    print(f"❌ {tag['category']}/{tag['tag']}: {tag['displayName']} ({tag['count']} треков)")

print(f"\nВсего маленьких тегов: {len(small_tags)}")
```

**Запустить:**
```bash
python3 find_small_tags.py > small_tags_report.txt
cat small_tags_report.txt
```

**Решить что делать:**
- Удалить эти теги из tags-data.json?
- Объединить с другими?
- Оставить как есть?

---

### 8. Протестировать локально

```bash
# Заменить tags-data.json на новый
cp data/tags-data.json data/tags-data-old.json
cp data/tags-data-new.json data/tags-data.json

# Открыть index.html в браузере
open index.html

# Проверить:
# • Новые таги видны
# • Клик работают
# • Треки загружаются
# • Пагинация работает
```

---

### 9. Закоммитить изменения

```bash
git add data/tags-data.json
git commit -m "feat: Data-driven tag expansion based on API analysis of 9,634 tracks"
git push origin main
```

---

## 🎯 КРИТЕРИИ УСПЕХА

**Фаза 1 считается завершённой если:**

- ✅ Все теги основаны на реальных промтах из API
- ✅ Нет тегов с <30 треков
- ✅ Нет тегов с 0 треков
- ✅ Добавлены только действительно популярные термины
- ✅ Все 9,600+ треков из API доступны
- ✅ Сайт работает без ошибок

---

## 📊 МЕТРИКИ ДЛЯ ПРОВЕРКИ

**До изменений:**
- Категорий: 9
- Тегов: 82
- Треков: 8,202

**После (ожидается):**
- Категорий: 9-10
- Тегов: 70-90 (уберём мусор, добавим найденное)
- Треков: 9,600+ (все из API!)

---

## ✍️ ЧЕКЛИСТ ОДНОЙ СТРОКОЙ

```
□ Проверить файлы анализа
□ Изучить найденные теги
□ Сравнить с текущими
□ Выявить пробелы
□ Принять решения (добавить/удалить)
□ Обновить tags-data.json
□ Удалить маленькие теги
□ Протестировать локально
□ Закоммитить
□ Запушить
□ Проверить на проде
```

---

**Готов к работе! Жду завершения анализа API... ⏳**
