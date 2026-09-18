package com.darukaa.earth.site;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class SiteMapper {

    private final GeometryConverter geometryConverter;

    public SiteMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    public SiteResponse toResponse(Site site) {
        Long projectId = site.getProject() == null ? null : site.getProject().getId();
        return new SiteResponse(
                site.getId(),
                projectId,
                site.getName(),
                site.getDescription(),
                geometryConverter.toGeoJson(site.getGeometry()),
                site.getCentroidLatitude(),
                site.getCentroidLongitude(),
                site.getAreaSqKm(),
                site.getCreatedAt(),
                site.getUpdatedAt());
    }

    public GeoJsonFeature toFeature(Site site) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("name", site.getName());
        properties.put("description", site.getDescription());
        properties.put("projectId", site.getProject() == null ? null : site.getProject().getId());
        properties.put("areaSqKm", site.getAreaSqKm());
        properties.put("centroidLatitude", site.getCentroidLatitude());
        properties.put("centroidLongitude", site.getCentroidLongitude());
        return new GeoJsonFeature(
                site.getId(), geometryConverter.toGeoJson(site.getGeometry()), properties);
    }
}
