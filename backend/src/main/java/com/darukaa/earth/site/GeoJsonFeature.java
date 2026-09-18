package com.darukaa.earth.site;

import java.util.Map;

public class GeoJsonFeature {

    private final String type = "Feature";
    private final Long id;
    private final GeoJsonPolygon geometry;
    private final Map<String, Object> properties;

    public GeoJsonFeature(Long id, GeoJsonPolygon geometry, Map<String, Object> properties) {
        this.id = id;
        this.geometry = geometry;
        this.properties = properties;
    }

    public String getType() {
        return type;
    }

    public Long getId() {
        return id;
    }

    public GeoJsonPolygon getGeometry() {
        return geometry;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }
}
