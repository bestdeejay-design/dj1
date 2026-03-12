#!/usr/bin/env python3
# Сравнение текущих тегов с найденными в API и обновление tags-data.json

import json
from datetime import datetime

print("="*60)
print("📊 СРАВНЕНИЕ ТЕГОВ: current vs API analysis")
print("="*60)

# Загружаем текущие данные
with open('data/tags-data.json') as f:
    current_data = json.load(f)

# Загружаем анализ из API
with open('data/api-analysis-results.json') as f:
    api_analysis = json.load(f)

print(f"\nТекущая база: {current_data['totalTracks']:,} треков")
print(f"API анализ: {api_analysis['totalTracks']:,} треков")
print(f"Разница: {api_analysis['totalTracks'] - current_data['totalTracks']:+,} треков")

# Собираем все текущие теги
current_tags = {}
for cat_key, cat_data in current_data['categories'].items():
    for tag_key, tag_info in cat_data['tags'].items():
        display_name = tag_info.get('displayName', tag_key).lower()
        current_tags[display_name] = {
            'category': cat_key,
            'count': tag_info['count'],
            'tracks': len(tag_info.get('tracks', []))
        }

print(f"\nТекущих тегов (≥30): {len(current_tags)}")

# Собираем теги из API
api_tags = {}
for category, tags in api_analysis['categories'].items():
    for tag, count in tags.items():
        tag_lower = tag.lower()
        if tag_lower not in api_tags:
            api_tags[tag_lower] = {
                'category': category,
                'count': count
            }

print(f"Тегов найдено в API (≥30): {len(api_tags)}")

# === АНАЛИЗ ====
print("\n" + "="*60)
print("🔍 АНАЛИЗ РАСХОЖДЕНИЙ")
print("="*60)

# 1. Теги которые есть в API но нет в current (к добавлению)
missing_tags = []
for tag, info in api_tags.items():
    if tag not in current_tags:
        missing_tags.append({
            'tag': tag,
            'category': info['category'],
            'count': info['count']
        })

print(f"\n✅ НОВЫЕ ТЕГИ (найдены в API, нет в current): {len(missing_tags)}")
if missing_tags:
    print("\nПо категориям:")
    by_category = {}
    for t in missing_tags:
        cat = t['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(t)
    
    for cat, tags in sorted(by_category.items()):
        print(f"\n  {cat.upper()}: {len(tags)} тегов")
        for t in sorted(tags, key=lambda x: x['count'], reverse=True)[:10]:
            print(f"    • {t['tag']}: {t['count']} треков")

# 2. Теги которые есть в current но нет в API (< 30 повторений)
obsolete_tags = []
for tag, info in current_tags.items():
    if tag not in api_tags:
        obsolete_tags.append({
            'tag': tag,
            'category': info['category'],
            'count': info['count']
        })

print(f"\n⚠️ УСТАРЕВШИЕ ТЕГИ (есть в current, нет в API): {len(obsolete_tags)}")
if obsolete_tags:
    print("\n(теги где <30 повторений в промтах)")
    for t in sorted(obsolete_tags, key=lambda x: x['count'])[:20]:
        print(f"  ❌ {t['tag']} ({t['category']}): {t['count']} треков в базе")

# 3. Общие теги (пересечение)
common_tags = set(current_tags.keys()) & set(api_tags.keys())
print(f"\n📌 ОБЩИЕ ТЕГИ: {len(common_tags)}")

# === РЕКОМЕНДАЦИИ ====
print("\n" + "="*60)
print("💡 РЕКОМЕНДАЦИИ")
print("="*60)

print(f"\n1. ДОБАВИТЬ: {len(missing_tags)} новых тегов")
print(f"2. УДАЛИТЬ: {len(obsolete_tags)} устаревших тегов (<30 в промтах)")
print(f"3. ОСТАВИТЬ: {len(common_tags)} существующих тегов")

# Проверяем есть ли теги <30 в current
small_current_tags = [t for t in current_tags.values() if t['count'] < 30]
print(f"\n⚠️ ВНИМАНИЕ: В текущей базе {len(small_current_tags)} тегов с count<30")

# === СОЗДАНИЕ НОВОГО ФАЙЛА ====
print("\n" + "="*60)
print("🔄 ОБНОВЛЕНИЕ tags-data.json")
print("="*60)

# Создаём новую структуру
new_data = {
    'generatedAt': datetime.now().isoformat(),
    'totalTracks': api_analysis['totalTracks'],
    'categories': {},
    'popularTags': {},
    'tracks': current_data.get('tracks', {})
}

# Копируем категории из current_data
for cat_key, cat_data in current_data['categories'].items():
    new_data['categories'][cat_key] = {
        'label': cat_data['label'],
        'tags': {}
    }

# Добавляем недостающие теги
added_count = 0
for tag_info in missing_tags:
    cat = tag_info['category']
    tag = tag_info['tag']
    count = tag_info['count']
    
    # Пропускаем если <30 (фильтр уже применён в api_analysis)
    if count < 30:
        continue
    
    # Создаём категорию если нет
    if cat not in new_data['categories']:
        # Маппинг названий категорий
        category_labels = {
            'genres': '🎵 Genres',
            'energy': '⚡ Energy Level',
            'mood': '✨ Mood',
            'instruments': '🎹 Instruments'
        }
        new_data['categories'][cat] = {
            'label': category_labels.get(cat, f'🏷️ {cat.title()}'),
            'tags': {}
        }
    
    # Находим треки для этого тега в api-all-tracks-raw.json
    print(f"\n🔍 Поиск треков для тега '{tag}'...")
    
# Для быстрого примера - создадим заглушки без tracks массивов
print("\n⚡ БЫСТРЫЙ РЕЖИМ: Создание структуры без массивов tracks...")

for tag_info in missing_tags:
    cat = tag_info['category']
    tag = tag_info['tag']
    count = tag_info['count']
    
    if count < 30:
        continue
    
    tag_key = tag.lower().replace(' ', '-')
    new_data['categories'][cat]['tags'][tag_key] = {
        'count': count,
        'tracks': [],  # Пока пусто - нужно искать в API
        'displayName': tag.title(),
        'source': 'api_analysis'
    }
    added_count += 1

# Удаляем устаревшие теги (где count < 30 в API)
removed_count = 0
for tag_info in obsolete_tags:
    cat = tag_info['category']
    tag = tag_info['tag']
    
    # Проверяем есть ли такой тег
    if cat in new_data['categories']:
        tag_key = tag.lower().replace(' ', '-')
        if tag_key in new_data['categories'][cat]['tags']:
            # Проверяем есть ли в API
            if tag not in api_tags or api_tags[tag]['count'] < 30:
                del new_data['categories'][cat]['tags'][tag_key]
                removed_count += 1

print(f"\n✅ ДОБАВЛЕНО: {added_count} тегов")
print(f"❌ УДАЛЕНО: {removed_count} тегов")

# Считаем итоговую статистику
total_new_tags = sum(len(cat['tags']) for cat in new_data['categories'].values())
print(f"\n📊 ИТОГО:")
print(f"  Категорий: {len(new_data['categories'])}")
print(f"  Тегов: {total_new_tags}")
print(f"  Треков: {new_data['totalTracks']:,}")

# Сохраняем
output_file = 'data/tags-data-new.json'
with open(output_file, 'w') as f:
    json.dump(new_data, f, indent=2)

import os
file_size = os.path.getsize(output_file)
print(f"\n💾 Сохранено в {output_file} ({file_size/1024/1024:.2f} MB)")

print("\n" + "="*60)
print("✅ ГОТОВО!")
print("="*60)
print("\n⚠️ ВАЖНО: Массивы tracks пустые!")
print("   Нужно запустить поиск треков для новых тегов через API")
print("\nСледующий шаг:")
print("1. Проверить новый файл data/tags-data-new.json")
print("2. Запустить find_tracks_for_new_tags.py для заполнения tracks")
print("3. Заменить data/tags-data.json на новый")
