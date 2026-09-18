-- Time-series metrics captured per site. Not a PostGIS raster table.

CREATE TABLE analytics (
    id BIGINT NOT NULL AUTO_INCREMENT,
    site_id BIGINT NOT NULL,
    metric_date DATE NOT NULL,
    metric_name VARCHAR(64) NOT NULL,
    metric_value DECIMAL(16, 6) NOT NULL,
    unit VARCHAR(32) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_analytics_site_id (site_id),
    KEY idx_analytics_metric_date (metric_date),
    UNIQUE KEY uk_analytics_site_date_name (site_id, metric_date, metric_name),
    CONSTRAINT fk_analytics_site
        FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
