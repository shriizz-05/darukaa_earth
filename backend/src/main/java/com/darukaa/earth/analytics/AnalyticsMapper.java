package com.darukaa.earth.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsMapper {

    public List<AnalyticsResponse> toSeries(List<AnalyticsRecord> records) {
        Map<LocalDate, List<AnalyticsRecord>> grouped = groupByDate(records);
        List<AnalyticsResponse> series = new ArrayList<>(grouped.size());
        for (List<AnalyticsRecord> sameDate : grouped.values()) {
            series.add(toResponse(sameDate));
        }
        return series;
    }

    public AnalyticsSummaryResponse toSummary(long totalSites, List<AnalyticsRecord> records) {
        List<BigDecimal> carbon = new ArrayList<>();
        List<BigDecimal> biodiversity = new ArrayList<>();
        List<BigDecimal> vegetation = new ArrayList<>();
        List<BigDecimal> performance = new ArrayList<>();
        Map<LocalDate, List<AnalyticsRecord>> grouped = groupByDate(records);
        List<AnalyticsOverviewPoint> monthly = new ArrayList<>(grouped.size());
        for (Map.Entry<LocalDate, List<AnalyticsRecord>> entry : grouped.entrySet()) {
            List<BigDecimal> monthCarbon = new ArrayList<>();
            List<BigDecimal> monthBiodiversity = new ArrayList<>();
            List<BigDecimal> monthVegetation = new ArrayList<>();
            List<BigDecimal> monthPerformance = new ArrayList<>();
            for (AnalyticsRecord record : entry.getValue()) {
                BigDecimal value = record.getMetricValue();
                if (value == null) {
                    continue;
                }
                switch (AnalyticsMetrics.canonicalize(record.getMetricName())) {
                    case AnalyticsMetrics.CARBON -> {
                        carbon.add(value);
                        monthCarbon.add(value);
                    }
                    case AnalyticsMetrics.BIODIVERSITY -> {
                        biodiversity.add(value);
                        monthBiodiversity.add(value);
                    }
                    case AnalyticsMetrics.VEGETATION -> {
                        vegetation.add(value);
                        monthVegetation.add(value);
                    }
                    case AnalyticsMetrics.PERFORMANCE -> {
                        performance.add(value);
                        monthPerformance.add(value);
                    }
                    default -> {
                        // Unknown metric names are ignored in the pivoted DTO.
                    }
                }
            }
            monthly.add(
                    new AnalyticsOverviewPoint(
                            entry.getKey(),
                            average(monthCarbon, 2),
                            average(monthBiodiversity, 1),
                            average(monthVegetation, 3),
                            average(monthPerformance, 1)));
        }
        return new AnalyticsSummaryResponse(
                totalSites,
                average(performance, 1),
                average(carbon, 2),
                average(biodiversity, 1),
                average(vegetation, 3),
                true,
                List.copyOf(monthly));
    }

    public List<AnalyticsOverviewPoint> toOverview(List<AnalyticsRecord> records) {
        return toSummary(0, records).getMonthlyAverages();
    }

    private AnalyticsResponse toResponse(List<AnalyticsRecord> sameDate) {
        Long id =
                sameDate.stream()
                        .map(AnalyticsRecord::getId)
                        .filter(Objects::nonNull)
                        .min(Long::compareTo)
                        .orElse(null);
        AnalyticsRecord first = sameDate.get(0);
        Long siteId = first.getSite() == null ? null : first.getSite().getId();
        BigDecimal carbon = null;
        BigDecimal biodiversity = null;
        BigDecimal vegetation = null;
        BigDecimal performance = null;
        for (AnalyticsRecord record : sameDate) {
            BigDecimal value = record.getMetricValue();
            switch (AnalyticsMetrics.canonicalize(record.getMetricName())) {
                case AnalyticsMetrics.CARBON -> carbon = value;
                case AnalyticsMetrics.BIODIVERSITY -> biodiversity = value;
                case AnalyticsMetrics.VEGETATION -> vegetation = value;
                case AnalyticsMetrics.PERFORMANCE -> performance = value;
                default -> {}
            }
        }
        return new AnalyticsResponse(
                id, siteId, first.getMetricDate(), carbon, biodiversity, vegetation, performance);
    }

    private static Map<LocalDate, List<AnalyticsRecord>> groupByDate(
            List<AnalyticsRecord> records) {
        Map<LocalDate, List<AnalyticsRecord>> grouped = new LinkedHashMap<>();
        records.stream()
                .sorted(
                        Comparator.comparing(
                                        AnalyticsRecord::getMetricDate,
                                        Comparator.nullsLast(LocalDate::compareTo))
                                .thenComparing(
                                        record ->
                                                record.getId() == null
                                                        ? Long.MAX_VALUE
                                                        : record.getId()))
                .forEach(
                        record ->
                                grouped.computeIfAbsent(
                                                record.getMetricDate(), key -> new ArrayList<>())
                                        .add(record));
        return grouped;
    }

    private static BigDecimal average(List<BigDecimal> values, int scale) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (BigDecimal value : values) {
            sum = sum.add(value);
        }
        return sum.divide(BigDecimal.valueOf(values.size()), scale, RoundingMode.HALF_UP);
    }
}
