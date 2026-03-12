#!/usr/bin/env python3
# Аккуратное обновление tags-data.json: сохраняем хорошие, добавляем новые, удаляем мусор

import json
from datetime import datetime

print("="*60)
print("🔄 АККУРАТНОЕ ОБНОВЛЕНИЕ ТЕГОВ")
print("="*60)

# Загружаем данные
with open('data/tags-data.json') as f:
    current_data = json.load(f)

with open('data/api-analysis-results.json') as f:
    api_analysis = json.load(f)

print(f"\nТекущая база: {current_data['totalTracks']:,} треков")
print(f"API анализ: {api_analysis['totalTracks']:,} треков")

# Собираем API теги (≥30)
api_tags = {}
for category, tags in api_analysis['categories'].items():
    for tag, count in tags.items():
        tag_lower = tag.lower()
        api_tags[tag_lower] = {
            'category': category,
            'count': count,
            'display_name': tag.title()
        }

print(f"\nТегов в API (≥30): {len(api_tags)}")

# Создаём новую структуру
new_data = {
    'generatedAt': datetime.now().isoformat(),
    'totalTracks': api_analysis['totalTracks'],
    'categories': {},
    'popularTags': {},
    'tracks': current_data.get('tracks', {})
}

# Маппинг категорий
category_labels = {
    'genres': '🎵 Genres',
    'energy': '⚡ Energy Level',
    'mood': '✨ Mood',
    'instruments': '🎹 Instruments',
    'character': '🎨 Style',
    'era': '📅 Era',
    'context': '🎧 Context',
    'tempo': '⏱️ Tempo',
    'vocals': '🎤 Vocals'
}

# Инициализируем все категории из API и current
all_categories = set(current_data['categories'].keys())
for api_info in api_tags.values():
    all_categories.add(api_info['category'])

for cat_key in all_categories:
        # Берём label из current_data или генерируем
        if cat_key in current_data['categories']:
            label = current_data['categories'][cat_key]['label']
        else:
            label = category_labels.get(cat_key, f'🏷️ {cat_key.title()}')
        
        new_data['categories'][cat_key] = {
            'label': label,
            'tags': {}
        }

# === ШАГ 1: Копируем текущие теги которые ≥30 в API ===
print("\n📌 Сохраняем существующие теги (≥30 в API)...")

kept_count = 0
for cat_key, cat_data in current_data['categories'].items():
    for tag_key, tag_info in cat_data['tags'].items():
        display_name = tag_info.get('displayName', tag_key).lower()
        
        # Проверяем есть ли этот тег в API с count≥30
        if display_name in api_tags and api_tags[display_name]['count'] >= 30:
            # Копируем тег
            new_data['categories'][cat_key]['tags'][tag_key] = tag_info
            kept_count += 1

print(f"✅ Сохранено: {kept_count} тегов")

# === ШАГ 2: Добавляем новые теги из API ===
print("\n➕ Добавляем новые теги из API...")

added_count = 0
for tag_lower, api_info in api_tags.items():
    category = api_info['category']
    count = api_info['count']
    display_name = api_info['display_name']
    
    # Пропускаем если уже есть
    if category in new_data['categories']:
        if any(t.lower() == tag_lower for t in new_data['categories'][category]['tags'].keys()):
            continue
    
    # Создаём ключ тега
    tag_key = tag_lower.replace(' ', '-')
    
    # Находим треки для этого тега
    matching_tracks = []
    for track_id, track in new_data['tracks'].items():
        if track.get('sound') and tag_lower in track['sound'].lower():
            matching_tracks.append(track_id)
    
    if len(matching_tracks) >= 30:
        # Добавляем тег
        new_data['categories'][category]['tags'][tag_key] = {
            'count': len(matching_tracks),
            'tracks': matching_tracks,
            'displayName': display_name,
            'source': 'api_expansion'
        }
        added_count += 1
        
        if added_count <= 10:  # Показываем первые 10
            print(f"  ✅ {display_name} ({category}): {len(matching_tracks)} треков")

print(f"\n✅ Добавлено: {added_count} тегов")

# === ШАГ 3: Удаляем теги где <30 в API ===
print("\n🗑️ Удаляем теги где <30 повторений в промтах...")

removed_count = 0
tags_to_remove = []

for cat_key, cat_data in new_data['categories'].items():
    for tag_key in list(cat_data['tags'].keys()):
        display_name = cat_data['tags'][tag_key].get('displayName', tag_key).lower()
        
        # Проверяем есть ли в API и сколько
        if display_name in api_tags:
            if api_tags[display_name]['count'] < 30:
                tags_to_remove.append((cat_key, tag_key, display_name))
        else:
            # Тега нет в API вообще — удаляем
            tags_to_remove.append((cat_key, tag_key, display_name))

# Удаляем
for cat_key, tag_key, display_name in tags_to_remove:
    if tag_key in new_data['categories'][cat_key]['tags']:
        del new_data['categories'][cat_key]['tags'][tag_key]
        removed_count += 1

print(f"❌ Удалено: {removed_count} тегов")

# === ФИНАЛЬНАЯ СТАТИСТИКА ===
print("\n" + "="*60)
print("📊 ИТОГИ")
print("="*60)

total_tags = sum(len(cat['tags']) for cat in new_data['categories'].values())

print(f"\nКатегорий: {len(new_data['categories'])}")
print(f"Всего тегов: {total_tags}")
print(f"Треков: {new_data['totalTracks']:,}")

print("\nПо категориям:")
for cat_key, cat_data in sorted(new_data['categories'].items()):
    tag_count = len(cat_data['tags'])
    if tag_count > 0:
        print(f"  {cat_data['label']}: {tag_count} тегов")

# === СОХРАНЕНИЕ ====
output_file = 'data/tags-data-updated.json'
with open(output_file, 'w') as f:
    json.dump(new_data, f, indent=2)

import os
file_size = os.path.getsize(output_file)
print(f"\n💾 Сохранено в {output_file} ({file_size/1024/1024:.2f} MB)")

print("\n" + "="*60)
print("✅ ГОТОВО!")
print("="*60)
print(f"\nИзменения:")
print(f"  • Сохранено: {kept_count} старых тегов")
print(f"  • Добавлено: {added_count} новых тегов")
print(f"  • Удалено: {removed_count} устаревших тегов")
print(f"\nЧистое изменение: {added_count - removed_count:++} тегов")
print(f"\nСледующий шаг:")
print(f"  1. Проверить {output_file}")
print(f"  2. Заменить data/tags-data.json на новый")
print(f"  3. Закоммитить изменения")
