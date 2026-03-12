#!/usr/bin/env python3
# Профессиональная категоризация тегов

import json
import re
from datetime import datetime

# Профессиональные музыкальные категории с маппингом
PROFESSIONAL_CATEGORIES = {
    # Жанры (Genres)
    'genres': {
        'house': 'House', 'techno': 'Techno', 'trance': 'Trance', 
        'ambient': 'Ambient', 'dubstep': 'Dubstep', 'drum and bass': 'Drum & Bass',
        'hip-hop': 'Hip-Hop', 'rap': 'Rap', 'trap': 'Trap', 'drill': 'Drill',
        'r&b': 'R&B', 'soul': 'Soul', 'funk': 'Funk', 'disco': 'Disco',
        'pop': 'Pop', 'rock': 'Rock', 'indie': 'Indie', 'alternative': 'Alternative',
        'punk': 'Punk', 'metal': 'Metal', 'grunge': 'Grunge',
        'jazz': 'Jazz', 'blues': 'Blues', 'classical': 'Classical',
        'folk': 'Folk', 'country': 'Country', 'reggae': 'Reggae', 'latin': 'Latin',
        'electronic': 'Electronic', 'synthwave': 'Synthwave', 'lo-fi': 'Lo-Fi',
        'electro': 'Electro', 'edm': 'EDM', 'minimal': 'Minimal',
        'deep': 'Deep House', 'tech': 'Tech House', 'progressive': 'Progressive',
        'garage': 'Garage', 'dub': 'Dub', 'dancehall': 'Dancehall',
        'afrobeat': 'Afrobeat', 'world': 'World', 'experimental': 'Experimental',
        'industrial': 'Industrial', 'new wave': 'New Wave', 'psychedelic': 'Psychedelic'
    },
    
    # Настроение (Mood)
    'mood': {
        'dark': 'Dark', 'bright': 'Bright', 'melancholic': 'Melancholic',
        'uplifting': 'Uplifting', 'energetic': 'Energetic', 'calm': 'Calm',
        'aggressive': 'Aggressive', 'peaceful': 'Peaceful', 'dreamy': 'Dreamy',
        'nostalgic': 'Nostalgic', 'romantic': 'Romantic', 'sad': 'Sad',
        'happy': 'Happy', 'euphoric': 'Euphoric', 'hypnotic': 'Hypnotic',
        'mysterious': 'Mysterious', 'ethereal': 'Ethereal', 'intense': 'Intense',
        'relaxed': 'Relaxed', 'tense': 'Tense', 'playful': 'Playful',
        'serious': 'Serious', 'warm': 'Warm', 'cold': 'Cold', 'cinematic': 'Cinematic'
    },
    
    # Вокал (Vocals)
    'vocals': {
        'male': 'Male Vocal', 'female': 'Female Vocal', 'vocal': 'Vocal',
        'rap': 'Rap Vocal', 'choir': 'Choir', 'harmonies': 'Harmonies',
        'spoken': 'Spoken Word', 'instrumental': 'Instrumental'
    },
    
    # Инструменты (Instruments)
    'instruments': {
        'synth': 'Synthesizer', 'bass': 'Bass', 'guitar': 'Guitar',
        'piano': 'Piano', 'strings': 'Strings', 'drums': 'Drums',
        'percussion': 'Percussion', 'brass': 'Brass', 'organ': 'Organ',
        'keyboard': 'Keyboard', '808': '808'
    },
    
    # Стиль/Характер (Character)
    'character': {
        'melodic': 'Melodic', 'rhythmic': 'Rhythmic', 'upbeat': 'Upbeat',
        'downtempo': 'Downtempo', 'groovy': 'Groovy', 'funky': 'Funky',
        'raw': 'Raw', 'polished': 'Polished', 'clean': 'Clean',
        'distorted': 'Distorted', 'layered': 'Layered', 'sparse': 'Sparse'
    },
    
    # Эпоха (Era)
    'era': {
        '90s': '90s', '80s': '80s', '70s': '70s', '60s': '60s',
        '2000s': '2000s', 'vintage': 'Vintage', 'retro': 'Retro',
        'modern': 'Modern', 'futuristic': 'Futuristic', 'classic': 'Classic'
    },
    
    # Контекст (Context)
    'context': {
        'club': 'Night Club', 'festival': 'Festival', 'radio': 'Radio',
        'bedroom': 'Bedroom', 'studio': 'Studio', 'live': 'Live',
        'chill': 'Chill', 'party': 'Party', 'dance': 'Dance',
        'night': 'Night Club', 'deep': 'Deep'
    },
    
    # === ФАЗА 1: НОВЫЕ КАТЕГОРИИ ===
    
    # Уровень энергии (Energy Level) - ФАЗА 1
    'energy': {
        'low energy': 'Low Energy',
        'mid energy': 'Mid Energy',
        'high energy': 'High Energy',
        'peak time': 'Peak Time',
        'warm up': 'Warm Up Set',
        'chill out': 'Chill Out'
    },
    
    # Современные жанры - ФАЗА 1
    'genres': {
        # Уже существующие + новые
        'afrobeats': 'Afrobeats',
        'amapiano': 'Amapiano',
        'phonk': 'Phonk',
        'hyperpop': 'Hyperpop',
        'wave': 'Wave',
        'pluggnb': 'PluggnB'
    }
}

# BPM диапазоны для категоризации - ФАЗА 1: ОПТИМИЗИРОВАНО
BPM_RANGES = [
    (60, 90, '60-90 BPM'),       # Расширено с 60-75
    (91, 110, '91-110 BPM'),     # Новый диапазон
    (111, 125, '111-125 BPM'),   # Более плавный переход
    (126, 140, '126-140 BPM'),   # Расширено
    (141, 160, '141-160 BPM'),   # Расширено с 136-150
    (161, 200, '161+ BPM')       # Объединено 151-175 + 176-200
]

# Создаём плоский маппинг: тег -> (категория, отображаемое имя)
TAG_TO_CATEGORY = {}
for category, tags in PROFESSIONAL_CATEGORIES.items():
    for tag_key, display_name in tags.items():
        TAG_TO_CATEGORY[tag_key.lower()] = (category, display_name)

# Читаем текущие данные
with open('/Users/admin/Documents/dj1/dj1/data/tags-data.json', 'r') as f:
    data = json.load(f)

print(f"Loaded {data['totalTracks']:,} tracks from {len(data['categories'])} categories")

# Извлекаем все треки из текущей структуры
current_tags = {}
for cat_key, cat_data in data['categories'].items():
    for tag_key, tag_info in cat_data['tags'].items():
        current_tags[tag_key] = tag_info

print(f"Original tags: {len(current_tags)}")

# Фильтруем и категоризуем теги с объединением по display_name
professional_tags = {}
other_tags = {}

# Временное хранилище для объединения
merged_tags = {}  # (category, display_name) -> {count, tracks, original_tags}

for tag, info in current_tags.items():
    tag_lower = tag.lower()
    
    # Проверяем, есть ли тег в профессиональных категориях
    mapping = TAG_TO_CATEGORY.get(tag_lower)
    
    if mapping:
        category, display_name = mapping
        key = (category, display_name)
        
        if key not in merged_tags:
            merged_tags[key] = {
                'count': 0,
                'tracks': set(),
                'original_tags': []
            }
        
        merged_tags[key]['count'] += info['count']
        merged_tags[key]['tracks'].update(info['tracks'])
        merged_tags[key]['original_tags'].append(tag)
        
    elif info['count'] >= 100:  # Теги с 100+ треками тоже сохраняем
        other_tags[tag] = info

# Преобразуем merged_tags в professional_tags
for (category, display_name), merged in merged_tags.items():
    if category not in professional_tags:
        professional_tags[category] = {}
    
    # Используем display_name как ключ (нижний регистр для поиска)
    tag_key = display_name.lower().replace(' ', '-')
    professional_tags[category][tag_key] = {
        'count': merged['count'],
        'tracks': list(merged['tracks']),
        'displayName': display_name,
        'merged_from': merged['original_tags']
    }

# === ИЗВЛЕКАЕМ BPM И СОЗДАЁМ КАТЕГОРИЮ TEMPO ===
print("\nExtracting BPM from track descriptions...")

# === ФАЗА 1: ИЗВЛЕКАЕМ ENERGY LEVEL ===
print("Extracting Energy Level from track descriptions...")

energy_keywords = {
    'low energy': ['chill', 'relaxed', 'calm', 'peaceful', 'soft', 'gentle', 'ambient'],
    'mid energy': ['groovy', 'steady', 'moderate', 'smooth', 'laid back'],
    'high energy': ['energetic', 'powerful', 'intense', 'driving', 'pumping'],
    'peak time': ['peak', 'maximum', 'climax', 'banger', 'anthem'],
    'warm up': ['warm-up', 'opener', 'intro', 'warmup'],
    'chill out': ['chillout', 'downtempo', 'lounge', 'afterparty']
}

energy_tracks = {key: set() for key in energy_keywords.keys()}

for track_id, track in data['tracks'].items():
    if not track.get('sound'):
        continue
    
    sound_lower = track['sound'].lower()
    
    # Проверяем ключевые слова энергии
    for energy_level, keywords in energy_keywords.items():
        if any(keyword in sound_lower for keyword in keywords):
            energy_tracks[energy_level].add(track_id)

# Добавляем Energy Level как категорию
if any(len(tracks) > 0 for tracks in energy_tracks.values()):
    professional_tags['energy'] = {}
    for energy_level, tracks in energy_tracks.items():
        if len(tracks) > 0:
            tag_key = energy_level.lower().replace(' ', '-')
            professional_tags['energy'][tag_key] = {
                'count': len(tracks),
                'tracks': list(tracks),
                'displayName': energy_keywords[energy_level][0].title() + ' Energy' if 'energy' in energy_level else energy_level.title()
            }
    print(f"Created {len([t for t in energy_tracks.values() if len(t) > 0])} Energy Level tags")

bpm_tracks = {}  # bpm_range -> set(track_ids)

for track_id, track in data['tracks'].items():
    if not track.get('sound'):
        continue
    
    # Ищем BPM в описании
    matches = re.findall(r'(\d+)\s*bpm', track['sound'].lower())
    for bpm_str in matches:
        bpm = int(bpm_str)
        # Находим диапазон
        for min_bpm, max_bpm, range_name in BPM_RANGES:
            if min_bpm <= bpm <= max_bpm:
                if range_name not in bpm_tracks:
                    bpm_tracks[range_name] = set()
                bpm_tracks[range_name].add(track_id)
                break

# Добавляем BPM как категорию
if bpm_tracks:
    professional_tags['tempo'] = {}
    for range_name, tracks in sorted(bpm_tracks.items()):
        tag_key = range_name.lower().replace(' ', '-')
        professional_tags['tempo'][tag_key] = {
            'count': len(tracks),
            'tracks': list(tracks),
            'displayName': range_name
        }
    print(f"Created {len(bpm_tracks)} BPM ranges")

# Собираем итоговую структуру
result = {
    'generatedAt': datetime.now().isoformat(),
    'totalTracks': data['totalTracks'],
    'categories': {},
    'popularTags': {},  # Теги без категории но популярные
    'tracks': data['tracks']
}

# Добавляем категории
CATEGORY_LABELS = {
    'genres': '🎵 Genres',
    'mood': '✨ Mood', 
    'vocals': '🎤 Vocals',
    'instruments': '🎹 Instruments',
    'character': '🎨 Style',
    'era': '📅 Era',
    'context': '🎧 Context',
    'tempo': '⏱️ Tempo',
    'energy': '⚡ Energy Level'  # ФАЗА 1
}

for category, tags in professional_tags.items():
    # Сортируем по популярности
    sorted_tags = dict(sorted(tags.items(), key=lambda x: x[1]['count'], reverse=True))
    result['categories'][category] = {
        'label': CATEGORY_LABELS.get(category, category.title()),
        'tags': sorted_tags
    }

# Добавляем популярные теги без категории
sorted_other = dict(sorted(other_tags.items(), key=lambda x: x[1]['count'], reverse=True)[:30])
result['popularTags'] = sorted_other

# Считаем статистику
total_categorized = sum(len(cat['tags']) for cat in result['categories'].values())
print(f"\nCategorized tags: {total_categorized}")
print(f"Popular uncategorized: {len(result['popularTags'])}")

print("\n=== CATEGORIES ===")
for cat_name, cat_data in result['categories'].items():
    print(f"\n{cat_data['label']} ({len(cat_data['tags'])} tags):")
    for tag, info in list(cat_data['tags'].items())[:5]:
        display = info.get('displayName', tag)
        print(f"  - {display}: {info['count']} tracks")

# Сохраняем
output_path = '/Users/admin/Documents/dj1/dj1/data/tags-data.json'
with open(output_path, 'w') as f:
    json.dump(result, f, indent=2)

json_size = len(json.dumps(result))
print(f"\n{'='*60}")
print(f"Saved to: {output_path}")
print(f"File size: {json_size:,} bytes ({json_size/1024/1024:.2f} MB)")
