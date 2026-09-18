package com.darukaa.earth.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.darukaa.earth.project.Project;
import com.darukaa.earth.project.ProjectRepository;
import com.darukaa.earth.project.ProjectStatus;
import com.darukaa.earth.project.ProjectType;
import com.darukaa.earth.site.GeometryUtils;
import com.darukaa.earth.site.Site;
import com.darukaa.earth.site.SiteRepository;
import com.darukaa.earth.user.User;
import com.darukaa.earth.user.UserRepository;
import com.darukaa.earth.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.locationtech.jts.geom.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@EnabledIf("com.darukaa.earth.persistence.DockerChecks#available")
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
class MysqlPersistenceTest {

    @Container @ServiceConnection
    static final MySQLContainer<?> MYSQL =
            new MySQLContainer<>("mysql:8.0")
                    .withDatabaseName("darukaa_earth")
                    .withUsername("darukaa")
                    .withPassword("darukaa_dev");

    @Autowired private UserRepository userRepository;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private SiteRepository siteRepository;

    @Test
    @Transactional
    void userRepositorySavesAndFindsByEmail() {
        User user =
                new User("ada@darukaa.earth", "not-a-real-hash", "Ada Lovelace", UserRole.ADMIN);

        userRepository.saveAndFlush(user);

        assertTrue(userRepository.findByEmail("ada@darukaa.earth").isPresent());
        assertTrue(userRepository.existsByEmail("ada@darukaa.earth"));
        assertFalse(
                userRepository
                        .findByEmail("ada@darukaa.earth")
                        .orElseThrow()
                        .toString()
                        .contains("not-a-real-hash"));
    }

    @Test
    @Transactional
    void siteRepositoryPersistsMysqlPolygon() {
        Project project =
                new Project(
                        "Western Ghats plot",
                        "Phase 2 spatial smoke test",
                        ProjectType.BIODIVERSITY,
                        ProjectStatus.PLANNING);
        Polygon square =
                GeometryUtils.polygonFromWkt(
                        "POLYGON ((77.5 12.9, 77.6 12.9, 77.6 13.0, 77.5 13.0, 77.5 12.9))");
        Site site = new Site(project, "Plot A", square);
        project.addSite(site);

        projectRepository.saveAndFlush(project);

        Site reloaded = siteRepository.findByProjectId(project.getId()).get(0);
        assertEquals("Plot A", reloaded.getName());
        assertEquals(4326, reloaded.getGeometry().getSRID());
        assertEquals("Polygon", reloaded.getGeometry().getGeometryType());
    }
}
