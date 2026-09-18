package com.darukaa.earth.site;

import com.darukaa.earth.exception.InvalidPolygonException;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Component;

@Component
public class GeometryConverter {

    public Polygon toPolygon(JsonNode geometryNode) {
        if (geometryNode == null || geometryNode.isNull()) {
            throw new InvalidPolygonException("geometry is required");
        }
        JsonNode polygonNode = unwrapFeature(geometryNode);
        String type = text(polygonNode, "type");
        if (!"Polygon".equals(type)) {
            throw new InvalidPolygonException("Only GeoJSON Polygon is supported, not " + type);
        }
        JsonNode coordinates = polygonNode.get("coordinates");
        if (coordinates == null || !coordinates.isArray() || coordinates.isEmpty()) {
            throw new InvalidPolygonException("Polygon coordinates are required");
        }
        try {
            List<List<Coordinate>> rings = new ArrayList<>();
            for (JsonNode ringNode : coordinates) {
                rings.add(parseRing(ringNode));
            }
            return GeometryUtils.polygonFromRings(rings);
        } catch (IllegalArgumentException ex) {
            throw new InvalidPolygonException(ex.getMessage());
        }
    }

    public GeoJsonPolygon toGeoJson(Polygon polygon) {
        List<List<List<Double>>> coordinates = new ArrayList<>();
        coordinates.add(
                GeometryUtils.coordinatesToLonLat(polygon.getExteriorRing().getCoordinates()));
        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            coordinates.add(
                    GeometryUtils.coordinatesToLonLat(
                            polygon.getInteriorRingN(i).getCoordinates()));
        }
        return new GeoJsonPolygon(coordinates);
    }

    public void fillDerivedMetrics(Site site, Polygon polygon) {
        Point centroid = GeometryUtils.centroid(polygon);
        site.setCentroidLongitude(decimal(centroid.getX(), 7));
        site.setCentroidLatitude(decimal(centroid.getY(), 7));
        site.setAreaSqKm(decimal(GeometryUtils.sphericalAreaSqKm(polygon), 6));
    }

    private static JsonNode unwrapFeature(JsonNode node) {
        String type = text(node, "type");
        if ("Feature".equals(type)) {
            JsonNode nested = node.get("geometry");
            if (nested == null || nested.isNull()) {
                throw new InvalidPolygonException("Feature.geometry is required");
            }
            return nested;
        }
        return node;
    }

    private static List<Coordinate> parseRing(JsonNode ringNode) {
        if (ringNode == null || !ringNode.isArray()) {
            throw new InvalidPolygonException("Each polygon ring must be an array of positions");
        }
        List<Coordinate> ring = new ArrayList<>();
        for (JsonNode position : ringNode) {
            if (!position.isArray() || position.size() < 2) {
                throw new InvalidPolygonException("Each position must be [longitude, latitude]");
            }
            double lon = position.get(0).asDouble();
            double lat = position.get(1).asDouble();
            if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
                throw new InvalidPolygonException(
                        "Coordinates must be valid WGS84 longitude/latitude");
            }
            ring.add(new Coordinate(lon, lat));
        }
        return ring;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? "" : value.asText();
    }

    private static BigDecimal decimal(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }
}
