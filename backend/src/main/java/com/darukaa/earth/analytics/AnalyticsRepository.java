package com.darukaa.earth.analytics;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalyticsRepository extends JpaRepository<AnalyticsRecord, Long> {

    List<AnalyticsRecord> findBySiteIdOrderByMetricDateAsc(Long siteId);

    List<AnalyticsRecord> findBySiteIdAndMetricDateBetweenOrderByMetricDateAsc(
            Long siteId, LocalDate from, LocalDate to);

    List<AnalyticsRecord> findBySiteIdAndMetricDateGreaterThanEqualOrderByMetricDateAsc(
            Long siteId, LocalDate from);

    List<AnalyticsRecord> findBySiteIdAndMetricDateLessThanEqualOrderByMetricDateAsc(
            Long siteId, LocalDate to);

    List<AnalyticsRecord> findAllByOrderByMetricDateAsc();
}
