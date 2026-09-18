package com.darukaa.earth.site;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;

class GeometryUtilsTest {

    private static final String SQUARE_WKT = "POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))";

    @Test
    void polygonFromWktParsesSquare() {
        Polygon polygon = GeometryUtils.polygonFromWkt(SQUARE_WKT);

        assertEquals(4326, polygon.getSRID());
        assertEquals("Polygon", polygon.getGeometryType());
        assertEquals(5, polygon.getExteriorRing().getNumPoints());
        assertTrue(polygon.isValid());
    }

    @Test
    void toWktRoundTripsSquare() {
        Polygon polygon = GeometryUtils.polygonFromWkt(SQUARE_WKT);
        String wkt = GeometryUtils.toWkt(polygon);
        Polygon again = GeometryUtils.polygonFromWkt(wkt);

        assertTrue(polygon.equalsExact(again, 0.000001));
    }

    @Test
    void rejectsNonPolygonWkt() {
        assertThrows(
                IllegalArgumentException.class, () -> GeometryUtils.polygonFromWkt("POINT (0 0)"));
    }

    @Test
    void rejectsBlankWkt() {
        assertThrows(IllegalArgumentException.class, () -> GeometryUtils.polygonFromWkt("  "));
    }

    @Test
    void centroidOfWktSquareIsCenter() {
        Polygon polygon =
                GeometryUtils.polygonFromWkt("POLYGON ((10 20, 12 20, 12 22, 10 22, 10 20))");
        assertEquals(11.0, GeometryUtils.centroid(polygon).getX(), 1.0e-6);
        assertEquals(21.0, GeometryUtils.centroid(polygon).getY(), 1.0e-6);
    }
}
