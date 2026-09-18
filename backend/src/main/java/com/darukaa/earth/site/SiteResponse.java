package com.darukaa.earth.site;

import java.math.BigDecimal;
import java.time.Instant;

public class SiteResponse {

    private final Long id;
    private final Long projectId;
    private final String name;
    private final String description;
    private final GeoJsonPolygon geometry;
    private final BigDecimal centroidLatitude;
    private final BigDecimal centroidLongitude;
    private final BigDecimal areaSqKm;
    private final Instant createdAt;
    private final Instant updatedAt;

    public SiteResponse(
            Long id,
            Long projectId,
            String name,
            String description,
            GeoJsonPolygon geometry,
            BigDecimal centroidLatitude,
            BigDecimal centroidLongitude,
            BigDecimal areaSqKm,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.projectId = projectId;
        this.name = name;
        this.description = description;
        this.geometry = geometry;
        this.centroidLatitude = centroidLatitude;
        this.centroidLongitude = centroidLongitude;
        this.areaSqKm = areaSqKm;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public GeoJsonPolygon getGeometry() {
        return geometry;
    }

    public BigDecimal getCentroidLatitude() {
        return centroidLatitude;
    }

    public BigDecimal getCentroidLongitude() {
        return centroidLongitude;
    }

    public BigDecimal getAreaSqKm() {
        return areaSqKm;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
