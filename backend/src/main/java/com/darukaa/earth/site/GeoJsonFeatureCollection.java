package com.darukaa.earth.site;

import java.util.List;

public class GeoJsonFeatureCollection {

    private final String type = "FeatureCollection";
    private final List<GeoJsonFeature> features;

    public GeoJsonFeatureCollection(List<GeoJsonFeature> features) {
        this.features = features;
    }

    public String getType() {
        return type;
    }

    public List<GeoJsonFeature> getFeatures() {
        return features;
    }
}
