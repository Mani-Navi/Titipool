-- V5: High-scalability indexes for 1M+ users, eliminating Full Table Scans on JSONB and client IDs

-- 1. Index on drawings(client_drawing_id) for O(log N) drawing updates and deletions
CREATE INDEX IF NOT EXISTS idx_drawings_client_drawing_id
    ON drawings(client_drawing_id)
    WHERE client_drawing_id IS NOT NULL;

-- 2. Composite index on tokens(scene_id, controlled_by) for instant player token ownership checks
CREATE INDEX IF NOT EXISTS idx_tokens_scene_controlled_by
    ON tokens(scene_id, controlled_by);

-- 3. Partial index on rooms(expires_at) for sub-millisecond hourly expiration cleanup
CREATE INDEX IF NOT EXISTS idx_rooms_active_expires_at
    ON rooms(expires_at)
    WHERE is_active = TRUE;

-- 4. Functional B-Tree index on fog_regions JSONB 'id' attribute for zero-memory fog lookups/deletes
CREATE INDEX IF NOT EXISTS idx_fog_regions_points_client_id
    ON fog_regions((points->>'id'))
    WHERE points IS NOT NULL;