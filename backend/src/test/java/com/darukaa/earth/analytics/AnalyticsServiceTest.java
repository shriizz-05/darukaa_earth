package com.darukaa.earth.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.darukaa.earth.exception.ResourceNotFoundException;
import com.darukaa.earth.project.Project;
import com.darukaa.earth.project.ProjectStatus;
import com.darukaa.earth.project.ProjectType;
import com.darukaa.earth.site.GeometryUtils;
import com.darukaa.earth.site.Site;
import com.darukaa.earth.site.SiteRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Polygon;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private AnalyticsRepository analyticsRepository;

    @Mock private SiteRepository siteRepository;

    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        analyticsService =
                new AnalyticsService(analyticsRepository, siteRepository, new AnalyticsMapper());
    }

    @Test
    void listBySiteThrowsWhenSiteMissing() {
        when(siteRepository.existsById(99L)).thenReturn(false);

        assertThrows(
                ResourceNotFoundException.class,
                () -> analyticsService.listBySite(99L, null, null));
        verifyNoInteractions(analyticsRepository);
    }

    @Test
    void listBySiteReturnsSeriesSortedByMetricDateAscending() {
        Site site = sampleSite(9L);
        when(siteRepository.existsById(9L)).thenReturn(true);
        when(analyticsRepository.findBySiteIdOrderByMetricDateAsc(9L))
                .thenReturn(
                        List.of(
                                record(
                                        site,
                                        30L,
                                        LocalDate.of(2026, 3, 1),
                                        AnalyticsMetrics.CARBON,
                                        "28.00"),
                                record(
                                        site,
                                        10L,
                                        LocalDate.of(2025, 10, 1),
                                        AnalyticsMetrics.CARBON,
                                        "18.00"),
                                record(
                                        site,
                                        11L,
                                        LocalDate.of(2025, 10, 1),
                                        AnalyticsMetrics.BIODIVERSITY,
                                        "55.0"),
                                record(
                                        site,
                                        12L,
                                        LocalDate.of(2025, 10, 1),
                                        AnalyticsMetrics.VEGETATION,
                                        "0.410"),
                                record(
                                        site,
                                        13L,
                                        LocalDate.of(2025, 10, 1),
                                        AnalyticsMetrics.PERFORMANCE,
                                        "60.0"),
                                record(
                                        site,
                                        20L,
                                        LocalDate.of(2026, 1, 1),
                                        AnalyticsMetrics.CARBON,
                                        "22.50"),
                                record(
                                        site,
                                        21L,
                                        LocalDate.of(2026, 1, 1),
                                        AnalyticsMetrics.PERFORMANCE,
                                        "64.0"),
                                record(
                                        site,
                                        31L,
                                        LocalDate.of(2026, 3, 1),
                                        AnalyticsMetrics.PERFORMANCE,
                                        "71.0")));

        List<AnalyticsResponse> series = analyticsService.listBySite(9L, null, null);

        assertEquals(3, series.size());
        assertEquals(LocalDate.of(2025, 10, 1), series.get(0).getMetricDate());
        assertEquals(LocalDate.of(2026, 1, 1), series.get(1).getMetricDate());
        assertEquals(LocalDate.of(2026, 3, 1), series.get(2).getMetricDate());
        assertEquals(9L, series.get(0).getSiteId());
        assertEquals(10L, series.get(0).getId());
        assertEquals(new BigDecimal("18.00"), series.get(0).getCarbonValue());
        assertEquals(new BigDecimal("55.0"), series.get(0).getBiodiversityScore());
        assertEquals(new BigDecimal("0.410"), series.get(0).getVegetationIndex());
        assertEquals(new BigDecimal("60.0"), series.get(0).getPerformanceScore());
        assertEquals(new BigDecimal("22.50"), series.get(1).getCarbonValue());
        assertEquals(new BigDecimal("64.0"), series.get(1).getPerformanceScore());
    }

    private static Site sampleSite(Long id) {
        Project project =
                new Project("Western Ghats", null, ProjectType.BIODIVERSITY, ProjectStatus.ACTIVE);
        project.setId(1L);
        Polygon polygon =
                GeometryUtils.polygonFromWkt(
                        "POLYGON ((77 11, 77.1 11, 77.1 11.1, 77 11.1, 77 11))");
        Site site = new Site(project, "Nilgiri plot A", polygon);
        site.setId(id);
        return site;
    }

    private static AnalyticsRecord record(
            Site site, Long id, LocalDate date, String metricName, String value) {
        AnalyticsRecord record =
                new AnalyticsRecord(site, date, metricName, new BigDecimal(value), "score");
        record.setId(id);
        return record;
    }
}
