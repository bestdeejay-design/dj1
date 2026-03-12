#!/usr/bin/env python3
# Фаза 1: Добавление Energy Level + Modern Genres + оптимизация BPM

import json, re
from datetime import datetime

print("=== ФАЗА 1: ДОБАВЛЕНИЕ НОВЫХ КАТЕГОРИЙ ===\n")

# Загружаем backup
with open('data/tags-data-phase1-backup.json') as f:
    data = json.load(f)

print(f"Загружено {data['totalTracks']:,} треков из {len(data['categories'])} категорий\n")

# === 1. ДОБАВЛЯЕМ ENERGY LEVEL ===
print("1. Добавляем Energy Level...")

energy_keywords = {
    'low-energy': {'keywords': ['chill', 'relaxed', 'calm', 'peaceful', 'soft', 'gentle', 'ambient'], 'displayName': 'Low Energy'},
    'mid-energy': {'keywords': ['groovy', 'steady', 'moderate', 'smooth', 'laid back'], 'displayName': 'Mid Energy'},
    'high-energy': {'keywords': ['energetic', 'powerful', 'intense', 'driving', 'pumping'], 'displayName': 'High Energy'},
    'peak-time': {'keywords': ['peak', 'maximum', 'climax', 'banger', 'anthem'], 'displayName': 'Peak Time'},
    'warm-up': {'keywords': ['warm-up', 'opener', 'intro', 'warmup'], 'displayName': 'Warm Up Set'},
    'chill-out': {'keywords': ['chillout', 'downtempo', 'lounge', 'afterparty'], 'displayName': 'Chill Out'}
}

energy_tags = {}
for energy_key, config in energy_keywords.items():
    tracks = set()
    for track_id, track in data['tracks'].items():
        if track.get('sound'):
            sound_lower = track['sound'].lower()
            if any(kw in sound_lower for kw in config['keywords']):
                tracks.add(track_id)
    
    if len(tracks) > 0:
        energy_tags[energy_key] = {
            'count': len(tracks),
            'tracks': list(tracks),
            'displayName': config['displayName']
        }

if energy_tags:
    data['categories']['energy'] = {
        'label': '⚡ Energy Level',
        'tags': energy_tags
    }
    print(f"   ✅ Добавлено {len(energy_tags)} Energy тегов\n")
else:
    print("   ⚠️ Не найдено треков для Energy Level\n")

# === 2. ДОБАВЛЯЕМ СОВРЕМЕННЫЕ ЖАНРЫ ===
print("2. Добавляем современные жанры...")

modern_genres = {
    'afrobeats': 'Afrobeats',
    'amapiano': 'Amapiano',
    'phonk': 'Phonk',
    'hyperpop': 'Hyperpop',
    'wave': 'Wave',
    'pluggnb': 'PluggnB'
}

# Ищем эти жанры в описаниях треков
new_genre_tracks = {key: set() for key in modern_genres.keys()}

for track_id, track in data['tracks'].items():
    if track.get('sound'):
        sound_lower = track['sound'].lower()
        for genre_key in modern_genres.keys():
            if genre_key in sound_lower:
                new_genre_tracks[genre_key].add(track_id)

# Добавляем найденные жанры
added_genres = {}
for genre_key, tracks in new_genre_tracks.items():
    if len(tracks) > 0:
        added_genres[genre_key] = {
            'count': len(tracks),
            'tracks': list(tracks),
            'displayName': modern_genres[genre_key]
        }

if added_genres:
    # Проверяем есть ли уже genres категория
    if 'genres' not in data['categories']:
        data['categories']['genres'] = {'label': '🎵 Genres', 'tags': {}}
    
    # Добавляем новые жанры к существующим
    for genre_key, genre_info in added_genres.items():
        data['categories']['genres']['tags'][genre_key] = genre_info
    
    print(f"   ✅ Добавлено {len(added_genres)} современных жанров\n")
else:
    print("   ⚠️ Не найдено треков для новых жанров\n")

# === 3. ОПТИМИЗИРУЕМ BPM ДИАПАЗОНЫ ===
print("3. Оптимизируем BPM диапазоны...")

# Удаляем старую категорию tempo если есть
if 'tempo' in data['categories']:
    del data['categories']['tempo']

# Новые расширенные диапазоны
new_bpm_ranges = [
    (60, 90, '60-90 BPM'),
    (91, 110, '91-110 BPM'),
    (111, 125, '111-125 BPM'),
    (126, 140, '126-140 BPM'),
    (141, 160, '141-160 BPM'),
    (161, 200, '161+ BPM')
]

bpm_tracks = {}
for track_id, track in data['tracks'].items():
    if track.get('sound'):
        matches = re.findall(r'(\d+)\s*bpm', track['sound'].lower())
        for bpm_str in matches:
            bpm = int(bpm_str)
            for min_bpm, max_bpm, range_name in new_bpm_ranges:
                if min_bpm <= bpm <= max_bpm:
                    if range_name not in bpm_tracks:
                        bpm_tracks[range_name] = set()
                    bpm_tracks[range_name].add(track_id)
                    break

# Добавляем новую категорию tempo
if bpm_tracks:
    data['categories']['tempo'] = {
        'label': '⏱️ Tempo',
        'tags': {}
    }
    for range_name, tracks in sorted(bpm_tracks.items()):
        tag_key = range_name.lower().replace(' ', '-')
        data['categories']['tempo']['tags'][tag_key] = {
            'count': len(tracks),
            'tracks': list(tracks),
            'displayName': range_name
        }
    print(f"   ✅ Создано {len(bpm_tracks)} оптимизированных BPM диапазонов\n")

# === СОХРАНЯЕМ ===
data['generatedAt'] = datetime.now().isoformat()

output_path = 'data/tags-data.json'
with open(output_path, 'w') as f:
    json.dump(data, f, indent=2)

json_size = len(json.dumps(data))
print(f"\n{'='*60}")
print(f"✅ ФАЗА 1 ЗАВЕРШЕНА")
print(f"Сохранено в: {output_path}")
print(f"Размер файла: {json_size:,} bytes ({json_size/1024/1024:.2f} MB)")

# Статистика
print(f"\n📊 ИТОГИ:")
print(f"  Категорий: {len(data['categories'])}")
total_tags = sum(len(cat['tags']) for cat in data['categories'].values())
print(f"  Всего тегов: {total_tags}")
print(f"  Треков: {data['totalTracks']:,}")
