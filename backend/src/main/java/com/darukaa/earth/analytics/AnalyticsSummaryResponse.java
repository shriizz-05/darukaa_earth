package com.darukaa.earth.analytics;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsSummaryResponse {

    private final long totalSites;
    private final BigDecimal averagePerformance;
    private final BigDecimal averageCarbon;
    private final BigDecimal averageBiodiversity;
    private final BigDecimal averageVegetation;

    /** Always true in this phase: series are generated mock values, not sensors. */
    private final boolean demoData;

    private final List<AnalyticsOverviewPoint> monthlyAverages;

    public AnalyticsSummaryResponse(
            long totalSites,
            BigDecimal averagePerformance,
            BigDecimal averageCarbon,
            BigDecimal averageBiodiversity,
            BigDecimal averageVegetation,
            boolean demoData,
            List<AnalyticsOverviewPoint> monthlyAverages) {
        this.totalSites = totalSites;
        this.averagePerformance = averagePerformance;
        this.averageCarbon = averageCarbon;
        this.averageBiodiversity = averageBiodiversity;
        this.averageVegetation = averageVegetation;
        this.demoData = demoData;
        this.monthlyAverages = monthlyAverages;
    }

    public long getTotalSites() {
        return totalSites;
    }

    public BigDecimal getAveragePerformance() {
        return averagePerformance;
    }

    public BigDecimal getAverageCarbon() {
        return averageCarbon;
    }

    public BigDecimal getAverageBiodiversity() {
        return averageBiodiversity;
    }

    public BigDecimal getAverageVegetation() {
        return averageVegetation;
    }

    public boolean isDemoData() {
        return demoData;
    }

    public List<AnalyticsOverviewPoint> getMonthlyAverages() {
        return monthlyAverages;
    }
}
