-- ============================================
-- SUPABASE SCHEMA FOR API-BASED TRACK DATABASE
-- ============================================

-- Удаляем старые таблицы если есть
DROP TABLE IF EXISTS track_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;

-- Таблица треков (данные из API)
CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT,
    file_url TEXT,
    cover_url TEXT,
    duration_s INTEGER,
    prompt TEXT,
    lyrics TEXT,
    play_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица тегов (мастер-словарь)
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, name)
);

-- Связь треков и тегов (многие-ко-многим)
CREATE TABLE IF NOT EXISTS track_tags (
    track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    confidence REAL DEFAULT 1.0,  -- Уверенность соответствия (0-1)
    source TEXT DEFAULT 'auto',   -- 'auto' или 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (track_id, tag_id)
);

-- Индексы для скорости
CREATE INDEX idx_tracks_author ON tracks(author_id);
CREATE INDEX idx_tracks_title ON tracks(title);
CREATE INDEX idx_tracks_created ON tracks(created_at);
CREATE INDEX idx_track_tags_track ON track_tags(track_id);
CREATE INDEX idx_track_tags_tag ON track_tags(tag_id);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_name ON tags(name);

-- RLS (Row Level Security) - публичный доступ на чтение
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on tracks" 
    ON tracks FOR SELECT USING (true);

CREATE POLICY "Allow public read access on tags" 
    ON tags FOR SELECT USING (true);

CREATE POLICY "Allow public read access on track_tags" 
    ON track_tags FOR SELECT USING (true);

-- Триггеры для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ПРИМЕРЫ ЗАПРОСОВ
-- ============================================

-- Получить все треки с тегами
-- SELECT t.*, array_agg(tg.name) as tags
-- FROM tracks t
-- LEFT JOIN track_tags tt ON t.id = tt.track_id
-- LEFT JOIN tags tg ON tt.tag_id = tg.id
-- GROUP BY t.id;

-- Получить треки по тегу
-- SELECT t.*
-- FROM tracks t
-- JOIN track_tags tt ON t.id = tt.track_id
-- JOIN tags tg ON tt.tag_id = tg.id
-- WHERE tg.name = 'deep' AND tg.category = 'context';

-- Получить теги трека
-- SELECT tg.*
-- FROM tags tg
-- JOIN track_tags tt ON tg.id = tt.tag_id
-- WHERE tt.track_id = 'track-id-here';
