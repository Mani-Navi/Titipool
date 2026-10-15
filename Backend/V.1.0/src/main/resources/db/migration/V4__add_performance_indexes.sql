-- V4: Add performance foreign-key indexes and active room partial index

-- Index on room_members(room_id) for join performance
CREATE INDEX IF NOT EXISTS idx_room_members_room_id
    ON room_members(room_id);

-- Index on template journals
CREATE INDEX IF NOT EXISTS idx_template_journals_template_id
    ON template_journals(template_id);

-- Index on room journals
CREATE INDEX IF NOT EXISTS idx_journals_room_id
    ON journals(room_id);

-- Index on player_permissions
CREATE INDEX IF NOT EXISTS idx_player_permissions_room_id
    ON player_permissions(room_id);

CREATE INDEX IF NOT EXISTS idx_player_permissions_member_id
    ON player_permissions(member_id);

-- Partial index for active room lookup by owner
CREATE INDEX IF NOT EXISTS idx_rooms_active_owner
    ON rooms(owner_id, last_active DESC) WHERE is_active = TRUE;