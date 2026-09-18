-- Optional site description for REST payloads (Phase 5).
-- centroid_* and area_sq_km already exist from V3.

ALTER TABLE sites
    ADD COLUMN description TEXT NULL AFTER name;
