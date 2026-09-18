package com.darukaa.earth.analytics;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;

public class AnalyticsResponse {

    private final Long id;
    private final Long siteId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private final LocalDate metricDate;

    private final BigDecimal carbonValue;
    private final BigDecimal biodiversityScore;
    private final BigDecimal vegetationIndex;
    private final BigDecimal performanceScore;

    public AnalyticsResponse(
            Long id,
            Long siteId,
            LocalDate metricDate,
            BigDecimal carbonValue,
            BigDecimal biodiversityScore,
            BigDecimal vegetationIndex,
            BigDecimal performanceScore) {
        this.id = id;
        this.siteId = siteId;
        this.metricDate = metricDate;
        this.carbonValue = carbonValue;
        this.biodiversityScore = biodiversityScore;
        this.vegetationIndex = vegetationIndex;
        this.performanceScore = performanceScore;
    }

    public Long getId() {
        return id;
    }

    public Long getSiteId() {
        return siteId;
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
