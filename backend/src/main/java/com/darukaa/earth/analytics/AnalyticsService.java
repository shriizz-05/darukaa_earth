package com.darukaa.earth.analytics;

import com.darukaa.earth.exception.InvalidRequestException;
import com.darukaa.earth.exception.ResourceNotFoundException;
import com.darukaa.earth.site.SiteRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!nodb")
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final SiteRepository siteRepository;
    private final AnalyticsMapper analyticsMapper;

    public AnalyticsService(
            AnalyticsRepository analyticsRepository,
            SiteRepository siteRepository,
            AnalyticsMapper analyticsMapper) {
        this.analyticsRepository = analyticsRepository;
        this.siteRepository = siteRepository;
        this.analyticsMapper = analyticsMapper;
    }

    @Transactional(readOnly = true)
    public List<AnalyticsResponse> listBySite(Long siteId, LocalDate from, LocalDate to) {
        if (!siteRepository.existsById(siteId)) {
            throw new ResourceNotFoundException("Site", siteId);
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidRequestException("from must be on or before to");
        }
        return analyticsMapper.toSeries(loadSiteRecords(siteId, from, to));
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse summary() {
        return analyticsMapper.toSummary(
                siteRepository.count(), analyticsRepository.findAllByOrderByMetricDateAsc());
    }

    @Transactional(readOnly = true)
    public List<AnalyticsOverviewPoint> overview() {
        return analyticsMapper.toOverview(analyticsRepository.findAllByOrderByMetricDateAsc());
    }

    private List<AnalyticsRecord> loadSiteRecords(Long siteId, LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            return analyticsRepository.findBySiteIdAndMetricDateBetweenOrderByMetricDateAsc(
                    siteId, from, to);
        }
        if (from != null) {
            return analyticsRepository
                    .findBySiteIdAndMetricDateGreaterThanEqualOrderByMetricDateAsc(siteId, from);
        }
        if (to != null) {
            return analyticsRepository.findBySiteIdAndMetricDateLessThanEqualOrderByMetricDateAsc(
                    siteId, to);
        }
        return analyticsRepository.findBySiteIdOrderByMetricDateAsc(siteId);
    }
}
