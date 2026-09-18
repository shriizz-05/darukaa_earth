package com.darukaa.earth.project;

import com.darukaa.earth.exception.InvalidRequestException;
import com.darukaa.earth.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!nodb")
@ConditionalOnBean(ProjectRepository.class)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;

    public ProjectService(ProjectRepository projectRepository, ProjectMapper projectMapper) {
        this.projectRepository = projectRepository;
        this.projectMapper = projectMapper;
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());
        Project saved = projectRepository.save(projectMapper.toEntity(request));
        return projectMapper.toResponse(saved, 0L);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(ProjectStatus status, ProjectType projectType, String name) {
        return projectRepository
                .findAll(ProjectSpecifications.withFilters(status, projectType, name))
                .stream()
                .map(project -> projectMapper.toResponse(project, countSites(project.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getById(Long id) {
        Project project = findOrThrow(id);
        return projectMapper.toResponse(project, countSites(id));
    }

    @Transactional
    public ProjectResponse update(Long id, UpdateProjectRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());
        Project project = findOrThrow(id);
        projectMapper.updateEntity(project, request);
        Project saved = projectRepository.save(project);
        return projectMapper.toResponse(saved, countSites(id));
    }

    @Transactional
    public void delete(Long id) {
        Project project = findOrThrow(id);
        projectRepository.delete(project);
    }

    private Project findOrThrow(Long id) {
        return projectRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private long countSites(Long projectId) {
        return projectRepository.countSitesByProjectId(projectId);
    }

    static void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new InvalidRequestException("endDate must be on or after startDate");
        }
    }
}
