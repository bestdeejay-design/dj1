#!/usr/bin/env python3
# Полный дамп API + анализ для Фазы 1

import requests, json, time, re
from datetime import datetime
from collections import Counter

BASE_URL = 'https://api.dj1.ru/api'

print("="*60)
print("🔄 ПОЛНЫЙ ДАМП API + АНАЛИЗ ДЛЯ ФАЗЫ 1")
print("="*60)

# ==================== ЧАСТЬ 1: ВЫГРУЗКА ВСЕХ ТРЕКОВ ====================
print("\n📥 ЧАСТЬ 1: Выгрузка всех треков из API...")

all_tracks = []
page = 1
MAX_PAGES = None  # None = без лимита, поставить число для теста
RETRY_ATTEMPTS = 3
RETRY_DELAY = 5  # секунд

while True:
    if MAX_PAGES and page > MAX_PAGES:
        break
    
    tracks_loaded = False
    no_more_tracks = False  # Флаг что треки закончились
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
            response = requests.get(
                f'{BASE_URL}/tracks',
                params={'page': page, 'limit': 50},  # 50 - баланс скорости и нагрузки
                timeout=30
            )
            
            if response.status_code == 429:  # Rate limit
                print(f"  ⚠️ Rate limit на странице {page}, ждём 10 сек...")
                time.sleep(10)
                continue
            
            response.raise_for_status()
            data = response.json()
            tracks = data.get('data', [])
            
            if not tracks:
                tracks_loaded = True
                no_more_tracks = True  # Устанавливаем флаг
                break  # выходим из for attempt
                
            all_tracks.extend(tracks)
            print(f"  Страница {page}: {len(tracks)} треков (всего: {len(all_tracks):,})")
            page += 1
            tracks_loaded = True
            break  # успех, выходим из for attempt
            
        except requests.exceptions.RequestException as e:
            if attempt < RETRY_ATTEMPTS - 1:
                print(f"  ⚠️ Ошибка: {e}, ждём {RETRY_DELAY} сек... (попытка {attempt+1}/{RETRY_ATTEMPTS})")
                time.sleep(RETRY_DELAY)
            else:
                print(f"  ❌ Критическая ошибка на странице {page}: {e}")
                raise
    
    # Если треки закончились или была критическая ошибка - выходим из while
    if no_more_tracks or not tracks_loaded:
        break

# Выходим из цикла загрузки
if no_more_tracks:
    print(f"\n✅ Загрузка завершена на странице {page-1}")
else:
    print(f"\n⚠️ Загрузка прервана на странице {page}")

print(f"\n✅ ВСЕГО ЗАГРУЖЕНО: {len(all_tracks):,} треков")

# Сохраняем raw дамп
raw_dump = {
    'fetchedAt': datetime.now().isoformat(),
    'totalTracks': len(all_tracks),
    'tracks': all_tracks
}

with open('data/api-all-tracks-raw.json', 'w') as f:
    json.dump(raw_dump, f, indent=2)

json_size = len(json.dumps(all_tracks))
print(f"💾 Сохранено в data/api-all-tracks-raw.json ({json_size/1024/1024:.2f} MB)")

# ==================== ЧАСТЬ 2: АНАЛИЗ СТРУКТУРЫ ====================
print("\n📊 ЧАСТЬ 2: Анализ структуры данных...")

if all_tracks:
    sample = all_tracks[0]
    print("\nСтруктура трека:")
    for key in sorted(sample.keys()):
        value = sample[key]
        val_str = str(value)[:60] + "..." if len(str(value)) > 60 else str(value)
        print(f"  {key:20s}: {type(value).__name__:10s} = {val_str}")

# Проверяем наличие critical полей
critical_fields = ['sound', 'title', 'audio_url', 'image_url']
print(f"\nНаличие critical полей:")
for field in critical_fields:
    has_field = sum(1 for t in all_tracks if t.get(field))
    pct = (has_field / len(all_tracks)) * 100
    print(f"  {field:15s}: {has_field:>6,} треков ({pct:5.1f}%)")

# ==================== ЧАСТЬ 3: КАТЕГОРИИ ДЛЯ АНАЛИЗА ====================
print("\n📋 ЧАСТЬ 3: Список категорий и тегов для анализа")

# Категории которые будем искать
CATEGORIES_TO_ANALYZE = {
    'genres': [
        'techno', 'house', 'trance', 'ambient', 'dubstep',
        'drum and bass', 'hip-hop', 'rap', 'trap', 'drill',
        'r&b', 'soul', 'funk', 'disco', 'pop', 'rock',
        'indie', 'alternative', 'punk', 'metal', 'jazz',
        'blues', 'classical', 'folk', 'country', 'reggae',
        'latin', 'electronic', 'synthwave', 'lo-fi', 'electro',
        'edm', 'minimal', 'deep', 'tech', 'progressive',
        'garage', 'dub', 'dancehall', 'afrobeats', 'amapiano',
        'phonk', 'hyperpop', 'wave', 'pluggnb', 'hard techno',
        'melodic techno', 'afro house', 'organic house'
    ],
    
    'energy': [
        'energetic', 'powerful', 'intense', 'driving', 'pumping',
        'chill', 'relaxed', 'calm', 'peaceful', 'soft', 'gentle',
        'groovy', 'steady', 'moderate', 'smooth', 'laid back',
        'peak', 'maximum', 'climax', 'banger', 'anthem',
        'warm-up', 'opener', 'intro', 'warmup',
        'downtempo', 'lounge', 'afterparty'
    ],
    
    'mood': [
        'dark', 'bright', 'melancholic', 'uplifting',
        'aggressive', 'dreamy', 'nostalgic', 'romantic',
        'sad', 'happy', 'euphoric', 'hypnotic', 'mysterious',
        'ethereal', 'cinematic', 'relaxed', 'tense', 'playful',
        'serious', 'warm', 'cold'
    ],
    
    'instruments': [
        'bass', 'guitar', 'piano', 'strings', 'drums',
        'percussion', 'brass', 'organ', 'keyboard', 'synth',
        '808', 'vocal', 'choir', 'flute', 'violin', 'cello',
        'acoustic', 'electric', 'synthesizer'
    ]
}

print(f"\nБудем анализировать {sum(len(v) for v in CATEGORIES_TO_ANALYZE.values())} потенциальных тегов")

# ==================== ЧАСТЬ 4: ПОИСК ТЕГОВ В ПРОМТАХ ====================
print("\n🔍 ЧАСТЬ 4: Поиск тегов в промтах...")

# Извлекаем все промты
prompts = [t['sound'].lower() for t in all_tracks if t.get('sound')]
print(f"Найдено промтов: {len(prompts):,} из {len(all_tracks):,} треков")

results = {}

for category, tags in CATEGORIES_TO_ANALYZE.items():
    print(f"\n{category.upper()}:")
    results[category] = {}
    
    for tag in tags:
        tag_lower = tag.lower()
        count = sum(1 for p in prompts if tag_lower in p)
        
        if count >= 30:  # порог 30 треков
            results[category][tag] = count
            print(f"  ✅ {tag:25s}: {count:>5,} треков")
        # else:
        #     print(f"  ❌ {tag:25s}: {count:>3} треков (< 30, пропускаем)")

# ==================== ЧАСТЬ 5: BPM АНАЛИЗ ====================
print("\n⏱️ ЧАСТЬ 5: BPM анализ...")

bpm_pattern = r'(\d+)\s*bpm'
bpm_values = []

for prompt in prompts:
    matches = re.findall(bpm_pattern, prompt)
    bpm_values.extend([int(bpm) for bpm in matches])

if bpm_values:
    print(f"Треков с BPM: {len(bpm_values):,}")
    print(f"Диапазон: {min(bpm_values)} - {max(bpm_values)} BPM")
    print(f"Средний: {sum(bpm_values)/len(bpm_values):.0f} BPM")
    
    # Группируем по диапазонам
    bpm_ranges = Counter()
    for bpm in bpm_values:
        if bpm < 90:
            bpm_ranges['60-90 BPM'] += 1
        elif bpm < 110:
            bpm_ranges['91-110 BPM'] += 1
        elif bpm < 125:
            bpm_ranges['111-125 BPM'] += 1
        elif bpm < 140:
            bpm_ranges['126-140 BPM'] += 1
        elif bpm < 160:
            bpm_ranges['141-160 BPM'] += 1
        else:
            bpm_ranges['161+ BPM'] += 1
    
    print("\nРаспределение:")
    for range_name, count in sorted(bpm_ranges.items(), key=lambda x: x[1], reverse=True):
        bar = '█' * (count // 50)  # визуализация
        print(f"  {range_name:15s}: {count:>5,} {bar}")

# ==================== ЧАСТЬ 6: ФИНАЛЬНЫЙ ОТЧЁТ ====================
print("\n" + "="*60)
print("📊 ИТОГОВЫЙ ОТЧЁТ ФАЗА 1")
print("="*60)

print(f"\nВсего треков: {len(all_tracks):,}")
print(f"Промтов найдено: {len(prompts):,} ({len(prompts)/len(all_tracks)*100:.1f}%)")

total_tags_found = sum(len(tags) for tags in results.values())
print(f"\nНайдено подходящих тегов (≥30 треков): {total_tags_found}")

print("\nПо категориям:")
for category, tags in results.items():
    if tags:
        print(f"  {category.capitalize()}: {len(tags)} тегов")
        top_3 = sorted(tags.items(), key=lambda x: x[1], reverse=True)[:3]
        for tag, count in top_3:
            print(f"    • {tag}: {count:,} треков")

print("\n💾 Результаты сохранены:")
print(f"  • data/api-all-tracks-raw.json — полный дамп")
print(f"  • data/api-analysis-results.json — анализ тегов")

# Сохраняем результаты анализа
analysis_results = {
    'analyzedAt': datetime.now().isoformat(),
    'totalTracks': len(all_tracks),
    'promptsFound': len(prompts),
    'categories': results,
    'bpmAnalysis': {
        'tracksWithBpm': len(bpm_values),
        'minBpm': min(bpm_values) if bpm_values else 0,
        'maxBpm': max(bpm_values) if bpm_values else 0,
        'avgBpm': sum(bpm_values)/len(bpm_values) if bpm_values else 0,
        'distribution': dict(bpm_ranges)
    }
}

with open('data/api-analysis-results.json', 'w') as f:
    json.dump(analysis_results, f, indent=2, ensure_ascii=False)

print("\n✅ АНАЛИЗ ЗАВЕРШЁН!")
print("="*60)
