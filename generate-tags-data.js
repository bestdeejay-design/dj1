// Скрипт для генерации статичного JSON с тегами и треками
// Запуск: node generate-tags-data.js

const fs = require('fs');

// Читаем скачанные данные
const rawData = fs.readFileSync('/tmp/all_tracks.json', 'utf8');
const data = JSON.parse(rawData);
const tracks = data.data || [];

console.log(`Total tracks: ${tracks.length}`);

// Функция извлечения тегов (как в frontend)
function extractTagsFromSound(sound) {
    const commonTags = [
        '90s', '80s', '70s', '2000s', 'retro', 'vintage', 'modern', 'futuristic',
        'electronic', 'synth', 'bass', 'hip-hop', 'rap', 'pop', 'rock', 'jazz',
        'ambient', 'chill', 'upbeat', 'energetic', 'melodic', 'rhythmic',
        'female', 'male', 'vocal', 'instrumental', 'acoustic', 'digital',
        'night', 'club', 'party', 'romantic', 'sad', 'happy', 'dark', 'bright',
        'lo-fi', 'hi-fi', 'crisp', 'warm', 'cold', 'fuzzy', 'clean',
        'psychedelic', 'soul', 'funk', 'disco', 'house', 'techno', 'trance',
        'reggae', 'latin', 'reggaeton', 'blues', 'country', 'folk', 'classical',
        'trap', 'drill', 'grime', 'dubstep', 'garage', 'r&b', 'soul',
        'indie', 'alternative', 'punk', 'metal', 'grunge', 'new wave',
        'minimal', 'progressive', 'deep', 'tech', 'tribal', 'tropical',
        'summer', 'winter', 'spring', 'autumn', 'morning', 'evening',
        'dreamy', 'nostalgic', 'aggressive', 'calm', 'intense', 'mellow',
        'groovy', 'funky', 'jazzy', 'bluesy', 'rocky', 'poppy',
        'spacious', 'intimate', 'epic', 'cinematic', 'organic', 'synthetic'
    ];
    
    const foundTags = new Set();
    const lowerSound = sound.toLowerCase();
    
    commonTags.forEach(tag => {
        if (lowerSound.includes(tag.toLowerCase())) {
            foundTags.add(tag.toLowerCase());
        }
    });
    
    // Жанры через regex
    const genreMatches = sound.match(/(\w+\s+)?(pop|rock|hip-hop|rap|jazz|blues|electronic|house|techno|trance|ambient|lo-fi|synthwave|disco|funk|soul|r&b|reggae|latin|reggaeton|edm|trap|drill|grime|psychedelic|indie|alternative|punk|metal|grunge|new wave|minimal|progressive|deep|tech|tribal|tropical|country|folk|classical|dubstep|garage)(\s+\w+)?/gi);
    if (genreMatches) {
        genreMatches.forEach(match => {
            foundTags.add(match.trim().toLowerCase());
        });
    }
    
    return Array.from(foundTags).slice(0, 15);
}

// Собираем теги и треки
const tagsData = {
    generatedAt: new Date().toISOString(),
    totalTracks: tracks.length,
    tags: {}
};

// Для каждого трека извлекаем теги
const trackTagsMap = new Map();

tracks.forEach(track => {
    if (!track.sound) return;
    
    const tags = extractTagsFromSound(track.sound);
    const trackInfo = {
        id: track.id,
        name: track.title,
        file: track.audio_url || track.full_url || null,
        cover: track.image_url || null,
        duration: track.duration_s || null,
        plays: track.play_count || 0,
        favorites: track.favorite_count || 0,
        sound: track.sound,
        lyrics: track.lyrics || null,
        model: track.model_display_name || null
    };
    
    trackTagsMap.set(track.id, { track: trackInfo, tags });
    
    // Добавляем трек к каждому тегу
    tags.forEach(tag => {
        if (!tagsData.tags[tag]) {
            tagsData.tags[tag] = {
                count: 0,
                tracks: []
            };
        }
        tagsData.tags[tag].count++;
        tagsData.tags[tag].tracks.push(track.id);
    });
});

// Сортируем теги по популярности
const sortedTags = Object.entries(tagsData.tags)
    .sort((a, b) => b[1].count - a[1].count)
    .reduce((acc, [tag, data]) => {
        acc[tag] = data;
        return acc;
    }, {});

tagsData.tags = sortedTags;
tagsData.totalTags = Object.keys(sortedTags).length;

// Добавляем полные данные треков для быстрого доступа
tagsData.tracks = {};
trackTagsMap.forEach((data, trackId) => {
    tagsData.tracks[trackId] = data.track;
});

// Сохраняем в файл
fs.writeFileSync('/Users/admin/Documents/dj1/dj1/data/tags-data.json', JSON.stringify(tagsData, null, 2));

console.log(`Generated ${tagsData.totalTags} tags`);
console.log('Top 10 tags:');
Object.entries(sortedTags).slice(0, 10).forEach(([tag, data]) => {
    console.log(`  ${tag}: ${data.count} tracks`);
});
console.log('\nSaved to: data/tags-data.json');
