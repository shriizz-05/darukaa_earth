package com.darukaa.earth.project;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.darukaa.earth.exception.InvalidRequestException;
import com.darukaa.earth.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock private ProjectRepository projectRepository;

    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(projectRepository, new ProjectMapper());
    }

    @Test
    void createMapsFieldsAndDefaultsSiteCount() {
        when(projectRepository.save(any(Project.class)))
                .thenAnswer(
                        invocation -> {
                            Project project = invocation.getArgument(0);
                            project.setId(10L);
                            return project;
                        });

        CreateProjectRequest request = new CreateProjectRequest();
        request.setName(" Western Ghats Reforestation ");
        request.setDescription("Forest restoration");
        request.setProjectType(ProjectType.BIODIVERSITY);
        request.setStatus(ProjectStatus.ACTIVE);
        request.setStartDate(LocalDate.of(2026, 1, 1));
        request.setEndDate(LocalDate.of(2030, 1, 1));

        ProjectResponse response = projectService.create(request);

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        Project saved = captor.getValue();
        assertEquals("Western Ghats Reforestation", saved.getName());
        assertEquals(ProjectType.BIODIVERSITY, saved.getType());
        assertEquals(ProjectStatus.ACTIVE, saved.getStatus());
        assertEquals(LocalDate.of(2026, 1, 1), saved.getStartDate());
        assertEquals(10L, response.getId());
        assertEquals(0L, response.getSiteCount());
        assertEquals("BIODIVERSITY", response.getProjectType().name());
    }

    @Test
    void createRejectsEndDateBeforeStartDate() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("Bad dates");
        request.setProjectType(ProjectType.CARBON);
        request.setStatus(ProjectStatus.PLANNING);
        request.setStartDate(LocalDate.of(2030, 1, 1));
        request.setEndDate(LocalDate.of(2026, 1, 1));

        assertThrows(InvalidRequestException.class, () -> projectService.create(request));
    }

    @Test
    void getByIdThrowsWhenMissing() {
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> projectService.getById(99L));
    }

    @Test
    void deleteExistingProject() {
        Project project = new Project("Plot", "desc", ProjectType.WATERSHED, ProjectStatus.ACTIVE);
        project.setId(4L);
        when(projectRepository.findById(4L)).thenReturn(Optional.of(project));

        projectService.delete(4L);

        verify(projectRepository).delete(project);
    }

    @Test
    void listFiltersByStatus() {
        Project project =
                new Project("Active plot", null, ProjectType.COASTAL, ProjectStatus.ACTIVE);
        project.setId(2L);
        when(projectRepository.findAll(any(Specification.class))).thenReturn(List.of(project));
        when(projectRepository.countSitesByProjectId(2L)).thenReturn(0L);

        List<ProjectResponse> results = projectService.list(ProjectStatus.ACTIVE, null, null);

        assertEquals(1, results.size());
        assertEquals(ProjectStatus.ACTIVE, results.get(0).getStatus());
        assertEquals("Active plot", results.get(0).getName());
        verify(projectRepository).findAll(any(Specification.class));
    }
}
