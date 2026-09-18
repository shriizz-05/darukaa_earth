package com.darukaa.earth.analytics;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Monthly averages across sites. Generated demo data, not field measurements. */
public class AnalyticsOverviewPoint {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private final LocalDate metricDate;

    private final BigDecimal carbonValue;
    private final BigDecimal biodiversityScore;
    private final BigDecimal vegetationIndex;
    private final BigDecimal performanceScore;

    public AnalyticsOverviewPoint(
            LocalDate metricDate,
            BigDecimal carbonValue,
            BigDecimal biodiversityScore,
            BigDecimal vegetationIndex,
            BigDecimal performanceScore) {
        this.metricDate = metricDate;
        this.carbonValue = carbonValue;
        this.biodiversityScore = biodiversityScore;
        this.vegetationIndex = vegetationIndex;
        this.performanceScore = performanceScore;
    }

    public LocalDate getMetricDate() {
        return metricDate;
    }

    public BigDecimal getCarbonValue() {
        return carbonValue;
    }

    public BigDecimal getBiodiversityScore() {
        return biodiversityScore;
    }

    public BigDecimal getVegetationIndex() {
        return vegetationIndex;
    }

    public BigDecimal getPerformanceScore() {
        return performanceScore;
    }
}
