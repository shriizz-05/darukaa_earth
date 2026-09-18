package com.darukaa.earth.analytics;

import com.darukaa.earth.project.Project;
import com.darukaa.earth.project.ProjectRepository;
import com.darukaa.earth.project.ProjectStatus;
import com.darukaa.earth.project.ProjectType;
import com.darukaa.earth.site.GeometryConverter;
import com.darukaa.earth.site.GeometryUtils;
import com.darukaa.earth.site.Site;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import org.locationtech.jts.geom.Coordinate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inserts a handful of Indian ecological projects, small polygons, and monthly metric rows so
 * charts have something to plot.
 *
 * <p><strong>This is generated demo data, not field measurements or sensor readings.</strong>
 * Values are plausible mock series for a hackathon UI.
 *
 * <p>Idempotent: skips when {@link #SEED_MARKER_PROJECT} already exists. Disable with {@code
 * APP_SEED_DEMO=false}.
 */
@Component
@Profile("!nodb")
@ConditionalOnBean(ProjectRepository.class)
@ConditionalOnProperty(prefix = "app.seed", name = "demo", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    /** Known name used as the seed marker. Do not reuse for user-created projects in demos. */
    public static final String SEED_MARKER_PROJECT = "Western Ghats Restoration Corridor";

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final LocalDate SERIES_START = LocalDate.of(2025, 10, 1);
    private static final int MONTHS = 12;
    private static final double BOX_HALF_DEG = 0.012;

    private final ProjectRepository projectRepository;
    private final GeometryConverter geometryConverter;

    public DemoDataSeeder(
            ProjectRepository projectRepository, GeometryConverter geometryConverter) {
        this.projectRepository = projectRepository;
        this.geometryConverter = geometryConverter;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (projectRepository.existsByName(SEED_MARKER_PROJECT)) {
            log.info("Demo ecological seed already present ({}). Skipping.", SEED_MARKER_PROJECT);
            return;
        }

        for (SeedProject spec : catalog()) {
            Project project =
                    new Project(spec.name(), spec.description(), spec.type(), spec.status());
            project.setStartDate(spec.startDate());
            project.setEndDate(spec.endDate());
            for (SeedSite siteSpec : spec.sites()) {
                Site site =
                        new Site(
                                project,
                                siteSpec.name(),
                                smallBox(siteSpec.longitude(), siteSpec.latitude()));
                site.setDescription(siteSpec.description());
                geometryConverter.fillDerivedMetrics(site, site.getGeometry());
                addMockMonthlySeries(site, siteSpec.seriesSeed());
                project.addSite(site);
            }
            projectRepository.save(project);
        }

        log.warn(
                "Seeded generated demo projects/sites/analytics (not real sensor data). Disable with APP_SEED_DEMO=false.");
    }

    private void addMockMonthlySeries(Site site, int seriesSeed) {
        for (int month = 0; month < MONTHS; month++) {
            LocalDate metricDate = SERIES_START.plusMonths(month);
            double seasonal = Math.sin((month / 12.0) * 2.0 * Math.PI);
            double carbon = 16.0 + (seriesSeed % 8) * 3.2 + month * 1.55 + seasonal * 2.1;
            double biodiversity = 48.0 + (seriesSeed % 6) * 3.5 + month * 0.7 + seasonal * 7.5;
            double vegetation = 0.38 + (seriesSeed % 5) * 0.025 + month * 0.007 + seasonal * 0.07;
            vegetation = clamp(vegetation, 0.22, 0.88);
            double performance =
                    0.28 * clamp(carbon * 1.15, 35, 92)
                            + 0.40 * clamp(biodiversity, 40, 94)
                            + 0.32 * clamp(vegetation * 100.0, 30, 90);
            site.addAnalytics(
                    new AnalyticsRecord(
                            site,
                            metricDate,
                            AnalyticsMetrics.CARBON,
                            decimal(carbon, 2),
                            AnalyticsMetrics.UNIT_CARBON));
            site.addAnalytics(
                    new AnalyticsRecord(
                            site,
                            metricDate,
                            AnalyticsMetrics.BIODIVERSITY,
                            decimal(biodiversity, 1),
                            AnalyticsMetrics.UNIT_BIODIVERSITY));
            site.addAnalytics(
                    new AnalyticsRecord(
                            site,
                            metricDate,
                            AnalyticsMetrics.VEGETATION,
                            decimal(vegetation, 3),
                            AnalyticsMetrics.UNIT_VEGETATION));
            site.addAnalytics(
                    new AnalyticsRecord(
                            site,
                            metricDate,
                            AnalyticsMetrics.PERFORMANCE,
                            decimal(performance, 1),
                            AnalyticsMetrics.UNIT_PERFORMANCE));
        }
    }

    private static org.locationtech.jts.geom.Polygon smallBox(double longitude, double latitude) {
        double west = longitude - BOX_HALF_DEG;
        double east = longitude + BOX_HALF_DEG;
        double south = latitude - BOX_HALF_DEG;
        double north = latitude + BOX_HALF_DEG;
        return GeometryUtils.polygonFromRings(
                List.of(
                        List.of(
                                new Coordinate(west, south),
                                new Coordinate(east, south),
                                new Coordinate(east, north),
                                new Coordinate(west, north),
                                new Coordinate(west, south))));
    }

    private static List<SeedProject> catalog() {
        LocalDate start = LocalDate.of(2024, 6, 1);
        LocalDate end = LocalDate.of(2028, 12, 31);
        return List.of(
                new SeedProject(
                        SEED_MARKER_PROJECT,
                        "Mock Western Ghats shola and evergreen restoration plots for demo charts.",
                        ProjectType.REFORESTATION,
                        ProjectStatus.ACTIVE,
                        start,
                        end,
                        List.of(
                                site(
                                        "Silent Valley buffer",
                                        "Evergreen buffer near Silent Valley NP.",
                                        76.45,
                                        11.08,
                                        11),
                                site(
                                        "Anamalai foothills",
                                        "Foothill mosaic west of Valparai.",
                                        76.97,
                                        10.37,
                                        17),
                                site(
                                        "Agasthyamalai ridge",
                                        "Southern Ghats ridge fragment.",
                                        77.25,
                                        8.65,
                                        23))),
                new SeedProject(
                        "Sundarbans Mangrove Recovery",
                        "Mock mangrove creek and mudflat polygons in the Indian Sundarbans.",
                        ProjectType.COASTAL,
                        ProjectStatus.ACTIVE,
                        start,
                        end,
                        List.of(
                                site(
                                        "Sajnekhali creek",
                                        "Tidal creek fringe near Sajnekhali.",
                                        88.83,
                                        22.12,
                                        31),
                                site(
                                        "Basanti mudflat",
                                        "Mudflat restoration sketch near Basanti.",
                                        88.72,
                                        22.19,
                                        29))),
                new SeedProject(
                        "Nilgiri Shola Conservation",
                        "Mock montane shola-grassland patches in the Nilgiris.",
                        ProjectType.BIODIVERSITY,
                        ProjectStatus.ACTIVE,
                        start,
                        end,
                        List.of(
                                site(
                                        "Ooty shola patch",
                                        "Short shola stand above Ooty.",
                                        76.70,
                                        11.41,
                                        13),
                                site(
                                        "Coonoor ridge",
                                        "Ridge woodland near Coonoor.",
                                        76.80,
                                        11.35,
                                        19),
                                site(
                                        "Kotagiri grassland",
                                        "Grassland-shola edge near Kotagiri.",
                                        76.86,
                                        11.43,
                                        27))),
                new SeedProject(
                        "Chilika Lake Catchment",
                        "Mock catchment and lagoon-edge plots around Chilika.",
                        ProjectType.WATERSHED,
                        ProjectStatus.ACTIVE,
                        start,
                        end,
                        List.of(
                                site(
                                        "Nalabana island fringe",
                                        "Lagoon-edge polygon near Nalabana.",
                                        85.30,
                                        19.70,
                                        37),
                                site(
                                        "Satpada channel",
                                        "Channel-side restoration sketch.",
                                        85.48,
                                        19.67,
                                        41))),
                new SeedProject(
                        "Kaziranga Floodplain Restoration",
                        "Mock grassland and woodland plots on the Kaziranga floodplain.",
                        ProjectType.CARBON,
                        ProjectStatus.ACTIVE,
                        start,
                        end,
                        List.of(
                                site(
                                        "Kohora grassland",
                                        "Floodplain grassland near Kohora.",
                                        93.17,
                                        26.58,
                                        7),
                                site(
                                        "Bagori woodland",
                                        "Woodland patch near Bagori.",
                                        93.35,
                                        26.62,
                                        14),
                                site(
                                        "Agoratoli wetland",
                                        "Wetland fringe near Agoratoli.",
                                        93.40,
                                        26.67,
                                        21),
                                site(
                                        "Panbari corridor",
                                        "Forest corridor sketch near Panbari.",
                                        93.45,
                                        26.55,
                                        33))));
    }

    private static SeedSite site(
            String name, String description, double longitude, double latitude, int seriesSeed) {
        return new SeedSite(name, description, longitude, latitude, seriesSeed);
    }

    private static BigDecimal decimal(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private record SeedProject(
            String name,
            String description,
            ProjectType type,
            ProjectStatus status,
            LocalDate startDate,
            LocalDate endDate,
            List<SeedSite> sites) {}

    private record SeedSite(
            String name, String description, double longitude, double latitude, int seriesSeed) {}
}
