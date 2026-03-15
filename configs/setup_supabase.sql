-- ============================================
-- НАСТРОЙКА SUPABASE ДЛЯ DJ1 MUSIC
-- ============================================

-- Таблица альбомов
CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover TEXT,
    user_id TEXT,
    playlist_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    track_count INTEGER DEFAULT 0
);

-- Таблица треков
CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    file TEXT NOT NULL,
    cover TEXT,
    duration INTEGER,
    sound TEXT,
    lyrics TEXT,
    model TEXT,
    album_id TEXT REFERENCES albums(id) ON DELETE CASCADE,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    plays INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0
);

-- Таблица тегов
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, name)
);

-- Связь треков и тегов (многие-ко-многим)
CREATE TABLE IF NOT EXISTS track_tags (
    track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (track_id, tag_id)
);

-- Индексы для скорости поиска
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_name ON tracks(name);
CREATE INDEX IF NOT EXISTS idx_tracks_user ON tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_track_tags_track ON track_tags(track_id);
CREATE INDEX IF NOT EXISTS idx_track_tags_tag ON track_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Триггеры для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_tags ENABLE ROW LEVEL SECURITY;

-- Разрешить чтение всем (публичный доступ)
CREATE POLICY "Allow public read access on albums" 
    ON albums FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access on tracks" 
    ON tracks FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access on tags" 
    ON tags FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access on track_tags" 
    ON track_tags FOR SELECT 
    USING (true);

-- ============================================
-- ПРИМЕРЫ ЗАПРОСОВ
-- ============================================

-- Получить все треки с альбомами
-- SELECT t.*, a.title as album_title 
-- FROM tracks t
-- LEFT JOIN albums a ON t.album_id = a.id
-- LIMIT 10;

-- Получить треки по тегу
-- SELECT t.*
-- FROM tracks t
-- JOIN track_tags tt ON t.id = tt.track_id
-- JOIN tags tg ON tt.tag_id = tg.id
-- WHERE tg.name = 'deep' AND tg.category = 'context';

-- Получить все теги трека
-- SELECT tg.*
-- FROM tags tg
-- JOIN track_tags tt ON tg.id = tt.tag_id
-- WHERE tt.track_id = 'track-id-here';

-- Посчитать количество треков в каждом теге
-- SELECT tg.name, tg.category, COUNT(tt.track_id) as track_count
-- FROM tags tg
-- LEFT JOIN track_tags tt ON tg.id = tt.tag_id
-- GROUP BY tg.id, tg.name, tg.category
-- ORDER BY track_count DESC;
