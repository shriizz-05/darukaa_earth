-- Field sites belonging to a project.
-- Spatial column is MySQL 8 GEOMETRY (NOT PostGIS). SRID 4326 = WGS84.
-- JPA maps this to org.locationtech.jts.geom.Polygon via Hibernate Spatial.
-- centroid_* and area_sq_km are nullable now; Phase 5 fills them from the polygon.

CREATE TABLE sites (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    geometry GEOMETRY NOT NULL SRID 4326,
    centroid_latitude DECIMAL(10, 7) NULL,
    centroid_longitude DECIMAL(10, 7) NULL,
    area_sq_km DECIMAL(14, 6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_sites_project_id (project_id),
    SPATIAL INDEX idx_sites_geometry (geometry),
    CONSTRAINT fk_sites_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
