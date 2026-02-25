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
    }
}

# Создаём плоский маппинг: тег -> (категория, отображаемое имя)
TAG_TO_CATEGORY = {}
for category, tags in PROFESSIONAL_CATEGORIES.items():
    for tag_key, display_name in tags.items():
        TAG_TO_CATEGORY[tag_key.lower()] = (category, display_name)

# Читаем текущие данные
with open('/Users/admin/Documents/dj1/dj1/data/tags-data.json', 'r') as f:
    data = json.load(f)

print(f"Original tags: {len(data['tags'])}")

# Фильтруем и категоризуем теги с объединением по display_name
professional_tags = {}
other_tags = {}

# Временное хранилище для объединения
merged_tags = {}  # (category, display_name) -> {count, tracks, original_tags}

for tag, info in data['tags'].items():
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
    'context': '🎧 Context'
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
