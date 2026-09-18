package com.darukaa.earth.site;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.darukaa.earth.exception.ResourceNotFoundException;
import com.darukaa.earth.project.Project;
import com.darukaa.earth.project.ProjectRepository;
import com.darukaa.earth.project.ProjectStatus;
import com.darukaa.earth.project.ProjectType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SiteServiceTest {

    private static final String POLYGON =
            """
            {"type":"Polygon","coordinates":[[[77.0,11.0],[77.2,11.0],[77.2,11.2],[77.0,11.2],[77.0,11.0]]]}
            """;

    @Mock private SiteRepository siteRepository;

    @Mock private ProjectRepository projectRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SiteService siteService;

    @BeforeEach
    void setUp() {
        GeometryConverter converter = new GeometryConverter();
        siteService =
                new SiteService(
                        siteRepository, projectRepository, converter, new SiteMapper(converter));
    }

    @Test
    void createThrowsWhenProjectMissing() throws Exception {
        when(projectRepository.findById(3L)).thenReturn(Optional.empty());
        assertThrows(
                ResourceNotFoundException.class, () -> siteService.create(3L, request("Plot")));
    }

    @Test
    void createMapsNameAndGeometry() throws Exception {
        Project project =
                new Project("Western Ghats", null, ProjectType.BIODIVERSITY, ProjectStatus.ACTIVE);
        project.setId(1L);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(siteRepository.save(any(Site.class)))
                .thenAnswer(
                        invocation -> {
                            Site site = invocation.getArgument(0);
                            site.setId(9L);
                            return site;
                        });

        SiteResponse response = siteService.create(1L, request(" Nilgiri plot A "));

        ArgumentCaptor<Site> captor = ArgumentCaptor.forClass(Site.class);
        verify(siteRepository).save(captor.capture());
        Site saved = captor.getValue();
        assertEquals("Nilgiri plot A", saved.getName());
        assertEquals("Montane shola fragment", saved.getDescription());
        assertEquals(1L, saved.getProject().getId());
        assertEquals("Polygon", saved.getGeometry().getGeometryType());
        assertEquals(9L, response.getId());
        assertEquals("Polygon", response.getGeometry().getType());
        assertTrue(saved.getAreaSqKm().doubleValue() > 0);
        assertEquals(77.1, saved.getCentroidLongitude().doubleValue(), 1.0e-4);
        assertEquals(11.1, saved.getCentroidLatitude().doubleValue(), 1.0e-4);
    }

    @Test
    void deleteExistingSite() throws Exception {
        Project project = new Project("P", null, ProjectType.CARBON, ProjectStatus.ACTIVE);
        project.setId(1L);
        GeometryConverter converter = new GeometryConverter();
        Site site = new Site(project, "Plot", converter.toPolygon(objectMapper.readTree(POLYGON)));
        site.setId(9L);
        when(siteRepository.findById(9L)).thenReturn(Optional.of(site));

        siteService.delete(9L);

        verify(siteRepository).delete(site);
    }

    private CreateSiteRequest request(String name) throws JsonProcessingException {
        CreateSiteRequest request = new CreateSiteRequest();
        request.setName(name);
        request.setDescription("Montane shola fragment");
        request.setGeometry(objectMapper.readTree(POLYGON));
        return request;
    }
}
