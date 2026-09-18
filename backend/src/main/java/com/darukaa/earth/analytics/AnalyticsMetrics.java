package com.darukaa.earth.analytics;

/**
 * Canonical metric_name values stored in the EAV {@code analytics} table and pivoted into {@link
 * AnalyticsResponse} columns.
 */
public final class AnalyticsMetrics {

    public static final String CARBON = "carbon";
    public static final String BIODIVERSITY = "biodiversity";
    public static final String VEGETATION = "vegetation";
    public static final String PERFORMANCE = "performance";

    public static final String UNIT_CARBON = "tCO2e";
    public static final String UNIT_BIODIVERSITY = "score";
    public static final String UNIT_VEGETATION = "NDVI";
    public static final String UNIT_PERFORMANCE = "score";

    private AnalyticsMetrics() {}

    public static String canonicalize(String metricName) {
        if (metricName == null) {
            return "";
        }
        String normalized = metricName.trim().toLowerCase().replace('-', '_').replace(' ', '_');
        return switch (normalized) {
            case "carbon", "carbon_value", "carbonvalue" -> CARBON;
            case "biodiversity", "biodiversity_score", "biodiversityscore" -> BIODIVERSITY;
            case "vegetation", "vegetation_index", "ndvi" -> VEGETATION;
            case "performance", "performance_score", "performancescore" -> PERFORMANCE;
            default -> normalized;
        };
    }
}
