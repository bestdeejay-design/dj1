#!/usr/bin/env python3
# Скрипт для генерации статичного JSON со ВСЕМИ тегами и треками (с пагинацией)

import json
import re
import urllib.request
import urllib.error
from datetime import datetime

AUTHOR_ID = "28d5e3f7-9c38-4b5f-b875-94a776bcc90a"
BASE_URL = "https://api.dj1.ru/api/tracks"

def fetch_tracks_page(page, limit=1000):
    """Загружает одну страницу треков"""
    url = f"{BASE_URL}?author_id={AUTHOR_ID}&limit={limit}&page={page}&sort=play_count&order=DESC"
    
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get('data', [])
    except Exception as e:
        print(f"Error fetching page {page}: {e}")
        return []

def fetch_all_tracks():
    """Загружает все треки с пагинацией"""
    all_tracks = []
    page = 1
    
    while True:
        print(f"Fetching page {page}...")
        tracks = fetch_tracks_page(page)
        
        if not tracks:
            print("No more tracks.")
            break
        
        all_tracks.extend(tracks)
        print(f"  Got {len(tracks)} tracks, total: {len(all_tracks)}")
        
        # Если получили меньше 1000 — значит это последняя страница
        if len(tracks) < 1000:
            break
        
        page += 1
        
        # Защита от бесконечного цикла
        if page > 20:
            print("Reached max pages (20), stopping.")
            break
    
    return all_tracks

# Расширенный список тегов
COMMON_TAGS = [
    '90s', '80s', '70s', '2000s', 'retro', 'vintage', 'modern', 'futuristic',
    'electronic', 'synth', 'bass', 'hip-hop', 'rap', 'pop', 'rock', 'jazz',
    'ambient', 'chill', 'upbeat', 'energetic', 'melodic', 'rhythmic',
    'female', 'male', 'vocal', 'instrumental', 'acoustic', 'digital',
    'night', 'club', 'party', 'romantic', 'sad', 'happy', 'dark', 'bright',
    'lo-fi', 'hi-fi', 'crisp', 'warm', 'cold', 'fuzzy', 'clean',
    'psychedelic', 'soul', 'funk', 'disco', 'house', 'techno', 'trance',
    'reggae', 'latin', 'reggaeton', 'blues', 'country', 'folk', 'classical',
    'trap', 'drill', 'grime', 'dubstep', 'garage', 'r&b',
    'indie', 'alternative', 'punk', 'metal', 'grunge', 'new wave',
    'minimal', 'progressive', 'deep', 'tech', 'tribal', 'tropical',
    'summer', 'winter', 'spring', 'autumn', 'morning', 'evening',
    'dreamy', 'nostalgic', 'aggressive', 'calm', 'intense', 'mellow',
    'groovy', 'funky', 'jazzy', 'bluesy', 'rocky', 'poppy',
    'spacious', 'intimate', 'epic', 'cinematic', 'organic', 'synthetic'
]

def extract_tags_from_sound(sound):
    """Извлекает теги из описания звука"""
    if not sound:
        return []
    
    found_tags = set()
    lower_sound = sound.lower()
    
    for tag in COMMON_TAGS:
        if tag.lower() in lower_sound:
            found_tags.add(tag.lower())
    
    # Жанры через regex
    genre_pattern = r'(\w+\s+)?(pop|rock|hip-hop|rap|jazz|blues|electronic|house|techno|trance|ambient|lo-fi|synthwave|disco|funk|soul|r&b|reggae|latin|reggaeton|edm|trap|drill|grime|psychedelic|indie|alternative|punk|metal|grunge|new wave|minimal|progressive|deep|tech|tribal|tropical|country|folk|classical|dubstep|garage)(\s+\w+)?'
    matches = re.findall(genre_pattern, lower_sound, re.IGNORECASE)
    for match in matches:
        for group in match:
            if group and group.strip():
                found_tags.add(group.strip().lower())
    
    return list(found_tags)[:15]

# Загружаем все треки
print("Starting to fetch all tracks...")
tracks = fetch_all_tracks()
print(f"\nTotal tracks fetched: {len(tracks)}")

# Собираем данные
tags_data = {
    'generatedAt': datetime.now().isoformat(),
    'totalTracks': len(tracks),
    'tags': {},
    'tracks': {}
}

# Обрабатываем треки
for track in tracks:
    if not track.get('sound'):
        continue
    
    tags = extract_tags_from_sound(track['sound'])
    
    track_info = {
        'id': track['id'],
        'name': track['title'],
        'file': track.get('audio_url') or track.get('full_url'),
        'cover': track.get('image_url'),
        'duration': track.get('duration_s'),
        'plays': track.get('play_count', 0),
        'favorites': track.get('favorite_count', 0),
        'sound': track['sound'],
        'lyrics': track.get('lyrics'),
        'model': track.get('model_display_name')
    }
    
    tags_data['tracks'][track['id']] = track_info
    
    for tag in tags:
        if tag not in tags_data['tags']:
            tags_data['tags'][tag] = {
                'count': 0,
                'tracks': []
            }
        tags_data['tags'][tag]['count'] += 1
        tags_data['tags'][tag]['tracks'].append(track['id'])

# Сортируем теги
sorted_tags = dict(sorted(tags_data['tags'].items(), key=lambda x: x[1]['count'], reverse=True))
tags_data['tags'] = sorted_tags
tags_data['totalTags'] = len(sorted_tags)

# Сохраняем
output_path = '/Users/admin/Documents/dj1/dj1/data/tags-data.json'
with open(output_path, 'w') as f:
    json.dump(tags_data, f, indent=2)

print(f"\n{'='*50}")
print(f"Generated {tags_data['totalTags']} tags from {len(tracks)} tracks")
print(f"Top 10 tags:")
for tag, data in list(sorted_tags.items())[:10]:
    print(f"  {tag}: {data['count']} tracks")

json_size = len(json.dumps(tags_data))
print(f"\nSaved to: {output_path}")
print(f"File size: {json_size:,} bytes ({json_size/1024/1024:.2f} MB)")
