-- ============================================
-- 1. MATERIALIZED VIEW FOR POPULAR TAGS
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS popular_tags_cache CASCADE;

CREATE MATERIALIZED VIEW popular_tags_cache AS
SELECT 
    t.id,
    t.name,
    t.category_id,
    COUNT(tt.track_id) as track_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(tt.track_id) DESC) as popularity_rank
FROM tags t
LEFT JOIN track_tags tt ON t.id = tt.tag_id
GROUP BY t.id, t.name, t.category_id
ORDER BY track_count DESC;

-- UNIQUE index is REQUIRED for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_popular_tags_pk ON popular_tags_cache(id);
CREATE INDEX IF NOT EXISTS idx_popular_tags_rank ON popular_tags_cache(popularity_rank);
CREATE INDEX IF NOT EXISTS idx_popular_tags_category ON popular_tags_cache(category_id);

CREATE OR REPLACE FUNCTION refresh_popular_tags_cache()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'popular_tags_cache') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY popular_tags_cache;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_tags_change ON track_tags;
CREATE TRIGGER track_tags_change
    AFTER INSERT OR UPDATE OR DELETE ON track_tags
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_popular_tags_cache();

-- ============================================
-- 2. COMPOSITE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_track_tags_tag_track ON track_tags(tag_id, track_id);
CREATE INDEX IF NOT EXISTS idx_tags_category_name ON tags(category_id, name);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING gin (name gin_trgm_ops);

-- ============================================
-- 3. VACUUM
-- ============================================

ALTER TABLE track_tags SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.02
);

VACUUM ANALYZE track_tags;
VACUUM ANALYZE tags;
VACUUM ANALYZE popular_tags_cache;

-- ============================================
-- 4. MONITORING
-- ============================================

SELECT 
    matviewname,
    pg_size_pretty(pg_total_relation_size(matviewname::regclass)) as size
FROM pg_matviews
WHERE matviewname = 'popular_tags_cache';

SELECT * FROM popular_tags_cache LIMIT 10;
