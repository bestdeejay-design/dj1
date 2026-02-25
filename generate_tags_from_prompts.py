#!/usr/bin/env python3
# Извлекаем теги из промптов, разбивая по запятым

import json
import re
from datetime import datetime

# Читаем исходные данные треков
with open('/Users/admin/Documents/dj1/dj1/data/tags-data.json', 'r') as f:
    data = json.load(f)

print(f"Total tracks: {len(data['tracks'])}")

# Профессиональные категории с ключевыми словами для поиска
TAG_PATTERNS = {
    'genres': {
        'house': r'\bhouse\b',
        'techno': r'\btechno\b',
        'trance': r'\btrance\b',
        'ambient': r'\bambient\b',
        'dubstep': r'\bdubstep\b',
        'drum and bass': r'\bdrum\s+(?:and|&|n)\s+bass\b|\bdnb\b|\bd\s*&\s*b\b',
        'hip-hop': r'\bhip[-\s]?hop\b',
        'rap': r'\brap\b',
        'trap': r'\btrap\b',
        'drill': r'\bdrill\b',
        'r&b': r'\br\s*&\s*b\b|\\brnb\\b',
        'soul': r'\bsoul\b',
        'funk': r'\bfunk\b',
        'disco': r'\bdisco\b',
        'pop': r'\bpop\b',
        'rock': r'\brock\b',
        'indie': r'\bindie\b',
        'alternative': r'\balternative\b',
        'punk': r'\bpunk\b',
        'metal': r'\bmetal\b',
        'grunge': r'\bgrunge\b',
        'jazz': r'\bjazz\b',
        'blues': r'\bblues\b',
        'classical': r'\bclassical\b',
        'folk': r'\bfolk\b',
        'country': r'\bcountry\b',
        'reggae': r'\breggae\b',
        'latin': r'\blatin\b',
        'electronic': r'\belectronic\b',
        'synthwave': r'\bsynthwave\b',
        'lo-fi': r'\blo[-\s]?fi\b',
        'electro': r'\belectro\b',
        'edm': r'\bedm\b',
        'minimal': r'\bminimal\b',
        'deep house': r'\bdeep\s+house\b',
        'tech house': r'\btech\s+house\b',
        'progressive': r'\bprogressive\b',
        'garage': r'\bgarage\b',
        'dub': r'\bdub\b',
        'dancehall': r'\bdancehall\b',
        'afrobeat': r'\bafrobeat\b',
        'world': r'\bworld\s+music\b',
        'experimental': r'\bexperimental\b',
        'industrial': r'\bindustrial\b',
        'new wave': r'\bnew\s+wave\b',
        'psychedelic': r'\bpsychedelic\b',
    },
    
    'mood': {
        'dark': r'\bdark\b',
        'bright': r'\bbright\b',
        'melancholic': r'\bmelancholic\b',
        'uplifting': r'\buplifting\b',
        'energetic': r'\benergetic\b',
        'calm': r'\bcalm\b',
        'aggressive': r'\baggressive\b',
        'peaceful': r'\bpeaceful\b',
        'dreamy': r'\bdreamy\b',
        'nostalgic': r'\bnostalgic\b',
        'romantic': r'\bromantic\b',
        'sad': r'\bsad\b',
        'happy': r'\bhappy\b',
        'euphoric': r'\beuphoric\b',
        'hypnotic': r'\bhypnotic\b',
        'mysterious': r'\bmysterious\b',
        'ethereal': r'\bethereal\b',
        'intense': r'\bintense\b',
        'relaxed': r'\brelaxed\b',
        'tense': r'\btense\b',
        'playful': r'\bplayful\b',
        'serious': r'\bserious\b',
        'warm': r'\bwarm\b',
        'cold': r'\bcold\b',
        'cinematic': r'\bcinematic\b',
    },
    
    'vocals': {
        'male vocal': r'\bmale\s+(?:vocal|voice|singer)',
        'female vocal': r'\bfemale\s+(?:vocal|voice|singer)',
        'vocal': r'\bvocal\b',
        'instrumental': r'\binstrumental\b',
        'choir': r'\bchoir\b',
        'harmonies': r'\bharmon(?:y|ies)\b',
    },
    
    'instruments': {
        'synthesizer': r'\bsynth(?:esizer)?\b',
        'bass': r'\bbass\b',
        'guitar': r'\bguitar\b',
        'piano': r'\bpiano\b',
        'strings': r'\bstrings\b',
        'drums': r'\bdrums\b',
        'percussion': r'\bpercussion\b',
        'brass': r'\bbrass\b',
        'organ': r'\borgan\b',
        'keyboard': r'\bkeyboard\b',
        '808': r'\b808\b',
    },
    
    'context': {
        'night club': r'\bnight\s+club\b|\bclub\s+vibe\b',
        'festival': r'\bfestival\b',
        'radio': r'\bradio\b',
        'bedroom': r'\bbedroom\b',
        'studio': r'\bstudio\b',
        'live': r'\blive\b',
        'chill': r'\bchill\b',
        'party': r'\bparty\b',
        'dance': r'\bdance\b',
        'night': r'\bnight\s+(?!club)\w+',  # night vibes, night drive и т.д.
        'deep': r'\bdeep\s+(?!house)\w+',  # deep vibes и т.д.
    },
    
    'character': {
        'melodic': r'\bmelodic\b',
        'rhythmic': r'\brhythmic\b',
        'upbeat': r'\bupbeat\b',
        'downtempo': r'\bdowntempo\b',
        'groovy': r'\bgroovy\b',
        'funky': r'\bfunky\b',
        'raw': r'\braw\b',
        'polished': r'\bpolished\b',
        'clean': r'\bclean\b',
        'distorted': r'\bdistorted\b',
        'layered': r'\blayered\b',
        'sparse': r'\bsparse\b',
    },
    
    'era': {
        '90s': r'\b90s\b|\b1990s\b',
        '80s': r'\b80s\b|\b1980s\b',
        '70s': r'\b70s\b|\b1970s\b',
        '60s': r'\b60s\b|\b1960s\b',
        '2000s': r'\b2000s\b',
        'vintage': r'\bvintage\b',
        'retro': r'\bretro\b',
        'modern': r'\bmodern\b',
        'futuristic': r'\bfuturistic\b',
        'classic': r'\bclassic\b',
    },
}

# BPM диапазоны
BPM_RANGES = [
    (60, 75, '60-75 BPM'),
    (76, 90, '76-90 BPM'),
    (91, 105, '91-105 BPM'),
    (106, 120, '106-120 BPM'),
    (121, 135, '121-135 BPM'),
    (136, 150, '136-150 BPM'),
    (151, 175, '151-175 BPM'),
    (176, 200, '176-200 BPM')
]

# Собираем теги
professional_tags = {cat: {} for cat in TAG_PATTERNS.keys()}
professional_tags['tempo'] = {}

print("\nExtracting tags from track descriptions...")

for track_id, track in data['tracks'].items():
    if not track.get('sound'):
        continue
    
    sound_lower = track['sound'].lower()
    
    # Извлекаем теги по паттернам
    for category, patterns in TAG_PATTERNS.items():
        for tag_name, pattern in patterns.items():
            if re.search(pattern, sound_lower):
                tag_key = tag_name.lower().replace(' ', '-')
                if tag_key not in professional_tags[category]:
                    professional_tags[category][tag_key] = {
                        'count': 0,
                        'tracks': [],
                        'displayName': tag_name.title()
                    }
                if track_id not in professional_tags[category][tag_key]['tracks']:
                    professional_tags[category][tag_key]['tracks'].append(track_id)
                    professional_tags[category][tag_key]['count'] += 1
    
    # Извлекаем BPM
    bpm_matches = re.findall(r'(\d+)\s*bpm', sound_lower)
    for bpm_str in bpm_matches:
        bpm = int(bpm_str)
        for min_bpm, max_bpm, range_name in BPM_RANGES:
            if min_bpm <= bpm <= max_bpm:
                tag_key = range_name.lower().replace(' ', '-')
                if tag_key not in professional_tags['tempo']:
                    professional_tags['tempo'][tag_key] = {
                        'count': 0,
                        'tracks': [],
                        'displayName': range_name
                    }
                if track_id not in professional_tags['tempo'][tag_key]['tracks']:
                    professional_tags['tempo'][tag_key]['tracks'].append(track_id)
                    professional_tags['tempo'][tag_key]['count'] += 1
                break

# Фильтруем теги с < 20 треков
MIN_TRACKS = 20
for category in professional_tags:
    professional_tags[category] = {
        k: v for k, v in professional_tags[category].items() 
        if v['count'] >= MIN_TRACKS
    }

# Сортируем теги в каждой категории
for category in professional_tags:
    professional_tags[category] = dict(sorted(
        professional_tags[category].items(),
        key=lambda x: x[1]['count'],
        reverse=True
    ))

# Подсчитываем
print("\n=== CATEGORIES ===")
total_tags = 0
CATEGORY_LABELS = {
    'genres': '🎵 Genres',
    'mood': '✨ Mood', 
    'vocals': '🎤 Vocals',
    'instruments': '🎹 Instruments',
    'character': '🎨 Style',
    'era': '📅 Era',
    'context': '🎧 Context',
    'tempo': '⏱️ Tempo'
}

for cat_key, cat_data in professional_tags.items():
    if cat_data:
        print(f"\n{CATEGORY_LABELS.get(cat_key, cat_key)} ({len(cat_data)} tags):")
        for tag_key, tag_info in list(cat_data.items())[:5]:
            print(f"  - {tag_info['displayName']}: {tag_info['count']} tracks")
        total_tags += len(cat_data)

# Собираем результат
result = {
    'generatedAt': datetime.now().isoformat(),
    'totalTracks': len(data['tracks']),
    'categories': {},
    'popularTags': {},
    'tracks': data['tracks']
}

for cat_key, cat_data in professional_tags.items():
    if cat_data:
        result['categories'][cat_key] = {
            'label': CATEGORY_LABELS.get(cat_key, cat_key.title()),
            'tags': cat_data
        }

# Сохраняем
output_path = '/Users/admin/Documents/dj1/dj1/data/tags-data.json'
with open(output_path, 'w') as f:
    json.dump(result, f, indent=2)

json_size = len(json.dumps(result))
print(f"\n{'='*60}")
print(f"Total professional tags: {total_tags}")
print(f"Saved to: {output_path}")
print(f"File size: {json_size:,} bytes ({json_size/1024/1024:.2f} MB)")
