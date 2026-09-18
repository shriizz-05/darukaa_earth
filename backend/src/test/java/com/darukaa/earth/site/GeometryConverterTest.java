package com.darukaa.earth.site;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.darukaa.earth.exception.InvalidPolygonException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;

class GeometryConverterTest {

    private final GeometryConverter converter = new GeometryConverter();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void geoJsonRoundTripsCoordinates() throws Exception {
        JsonNode input =
                objectMapper.readTree(
                        """
                {"type":"Polygon","coordinates":[[[10.0,20.0],[12.0,20.0],[12.0,22.0],[10.0,22.0],[10.0,20.0]]]}
                """);
        Polygon polygon = converter.toPolygon(input);
        GeoJsonPolygon geoJson = converter.toGeoJson(polygon);
        Polygon again = converter.toPolygon(objectMapper.valueToTree(geoJson));

        Coordinate[] first = polygon.getExteriorRing().getCoordinates();
        Coordinate[] second = again.getExteriorRing().getCoordinates();
        assertEquals(first.length, second.length);
        for (int i = 0; i < first.length; i++) {
            assertEquals(first[i].x, second[i].x, 1.0e-9);
            assertEquals(first[i].y, second[i].y, 1.0e-9);
        }
    }

    @Test
    void acceptsFeatureWrappingPolygon() throws Exception {
        JsonNode feature =
                objectMapper.readTree(
                        """
                {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[10,20],[12,20],[12,22],[10,22],[10,20]]]},"properties":{}}
                """);
        Polygon polygon = converter.toPolygon(feature);
        assertEquals("Polygon", polygon.getGeometryType());
        assertEquals(4326, polygon.getSRID());
    }

    @Test
    void rejectsPoint() throws Exception {
        JsonNode point = objectMapper.readTree("{\"type\":\"Point\",\"coordinates\":[77.0,11.0]}");
        InvalidPolygonException ex =
                assertThrows(InvalidPolygonException.class, () -> converter.toPolygon(point));
        assertTrue(ex.getMessage().contains("Point"));
    }

    @Test
    void rejectsTwoPointRing() throws Exception {
        JsonNode node =
                objectMapper.readTree("{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,1]]]}");
        assertThrows(InvalidPolygonException.class, () -> converter.toPolygon(node));
    }

    @Test
    void rejectsUnclosedRing() throws Exception {
        JsonNode node =
                objectMapper.readTree(
                        "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0],[1,1],[0,1]]]}");
        assertThrows(InvalidPolygonException.class, () -> converter.toPolygon(node));
    }

    @Test
    void centroidOfSquareIsCenter() throws Exception {
        JsonNode node =
                objectMapper.readTree(
                        """
                {"type":"Polygon","coordinates":[[[10.0,20.0],[12.0,20.0],[12.0,22.0],[10.0,22.0],[10.0,20.0]]]}
                """);
        Point centroid = GeometryUtils.centroid(converter.toPolygon(node));
        assertEquals(11.0, centroid.getX(), 1.0e-6);
        assertEquals(21.0, centroid.getY(), 1.0e-6);
    }

    @Test
    void areaOfOneDegreeEquatorSquareIsAbout12360Km2() throws Exception {
        JsonNode node =
                objectMapper.readTree(
                        """
                {"type":"Polygon","coordinates":[[[0.0,0.0],[1.0,0.0],[1.0,1.0],[0.0,1.0],[0.0,0.0]]]}
                """);
        double area = GeometryUtils.sphericalAreaSqKm(converter.toPolygon(node));
        assertEquals(12360.0, area, 250.0);
    }
}
