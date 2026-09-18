package com.darukaa.earth.site;

import java.util.List;

public class GeoJsonPolygon {

    private final String type = "Polygon";
    private final List<List<List<Double>>> coordinates;

    public GeoJsonPolygon(List<List<List<Double>>> coordinates) {
        this.coordinates = coordinates;
    }

    public String getType() {
        return type;
    }

    public List<List<List<Double>>> getCoordinates() {
        return coordinates;
    }
}
