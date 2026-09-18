package com.darukaa.earth.site;

import java.util.ArrayList;
import java.util.List;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.WKTWriter;

/**
 * JTS helpers for SRID 4326 (WGS84).
 *
 * <p>Coordinate convention (GeoJSON / JTS): {@code x = longitude}, {@code y = latitude}. Hibernate
 * Spatial persists WKB, so we do not use MySQL {@code ST_GeomFromText} (which uses lat/lon axis
 * order for SRID 4326).
 *
 * <p>Area uses a spherical trapezoidal approximation on the mean Earth radius {@code R = 6371.0088
 * km}:
 *
 * <pre>
 * area = |Σ (λᵢ₊₁ − λᵢ) · (sin φᵢ + sin φᵢ₊₁)| · R² / 2
 * </pre>
 *
 * with λ, φ in radians. Interior rings (holes) are subtracted. This is not a geodesic equal-area
 * projection; it is accurate enough for small restoration plots.
 */
public final class GeometryUtils {

    public static final int WGS84_SRID = 4326;

    /** IUGG mean Earth radius in kilometres. */
    public static final double EARTH_RADIUS_KM = 6371.0088;

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), WGS84_SRID);

    private GeometryUtils() {}

    public static GeometryFactory factory() {
        return GEOMETRY_FACTORY;
    }

    public static Polygon polygonFromWkt(String wkt) {
        if (wkt == null || wkt.isBlank()) {
            throw new IllegalArgumentException("WKT must not be blank");
        }
        try {
            Geometry geometry = new WKTReader(GEOMETRY_FACTORY).read(wkt);
            if (!(geometry instanceof Polygon polygon)) {
                throw new IllegalArgumentException(
                        "WKT does not represent a polygon: " + geometry.getGeometryType());
            }
            return requireValidPolygon(polygon);
        } catch (ParseException ex) {
            throw new IllegalArgumentException("Invalid WKT: " + wkt, ex);
        }
    }

    public static String toWkt(Geometry geometry) {
        if (geometry == null) {
            throw new IllegalArgumentException("geometry must not be null");
        }
        return new WKTWriter().write(geometry);
    }

    public static Polygon polygonFromRings(List<List<Coordinate>> rings) {
        if (rings == null || rings.isEmpty()) {
            throw new IllegalArgumentException("Polygon must have an exterior ring");
        }
        LinearRing shell = ring(rings.get(0));
        LinearRing[] holes = new LinearRing[Math.max(0, rings.size() - 1)];
        for (int i = 1; i < rings.size(); i++) {
            holes[i - 1] = ring(rings.get(i));
        }
        Polygon polygon = GEOMETRY_FACTORY.createPolygon(shell, holes);
        return requireValidPolygon(polygon);
    }

    public static Point centroid(Polygon polygon) {
        Point centroid = polygon.getCentroid();
        centroid.setSRID(WGS84_SRID);
        return centroid;
    }

    /** Spherical trapezoidal area in km². Absolute value so winding order does not matter. */
    public static double sphericalAreaSqKm(Polygon polygon) {
        double area = Math.abs(ringAreaSqKm(polygon.getExteriorRing().getCoordinates()));
        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            area -= Math.abs(ringAreaSqKm(polygon.getInteriorRingN(i).getCoordinates()));
        }
        return Math.max(0.0, area);
    }

    private static LinearRing ring(List<Coordinate> positions) {
        if (positions == null || positions.size() < 4) {
            throw new IllegalArgumentException(
                    "Polygon ring must have at least 4 positions including the closing vertex");
        }
        Coordinate first = positions.get(0);
        Coordinate last = positions.get(positions.size() - 1);
        if (!samePosition(first, last)) {
            throw new IllegalArgumentException(
                    "Polygon ring must be closed (first position equals last)");
        }
        return GEOMETRY_FACTORY.createLinearRing(positions.toArray(Coordinate[]::new));
    }

    private static boolean samePosition(Coordinate a, Coordinate b) {
        return Math.abs(a.x - b.x) < 1.0e-9 && Math.abs(a.y - b.y) < 1.0e-9;
    }

    private static Polygon requireValidPolygon(Polygon polygon) {
        if (polygon.isEmpty() || !polygon.isValid()) {
            throw new IllegalArgumentException("Polygon is empty or self-intersecting");
        }
        polygon.setSRID(WGS84_SRID);
        return polygon;
    }

    private static double ringAreaSqKm(Coordinate[] coords) {
        double total = 0.0;
        for (int i = 0; i < coords.length - 1; i++) {
            double lon1 = Math.toRadians(coords[i].x);
            double lat1 = Math.toRadians(coords[i].y);
            double lon2 = Math.toRadians(coords[i + 1].x);
            double lat2 = Math.toRadians(coords[i + 1].y);
            total += (lon2 - lon1) * (Math.sin(lat1) + Math.sin(lat2));
        }
        return total * EARTH_RADIUS_KM * EARTH_RADIUS_KM / 2.0;
    }

    static List<List<Double>> coordinatesToLonLat(Coordinate[] coords) {
        List<List<Double>> ring = new ArrayList<>(coords.length);
        for (Coordinate coord : coords) {
            ring.add(List.of(coord.x, coord.y));
        }
        return ring;
    }
}
