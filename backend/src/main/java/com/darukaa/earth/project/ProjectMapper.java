package com.darukaa.earth.project;

import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    public Project toEntity(CreateProjectRequest request) {
        Project project =
                new Project(
                        request.getName().trim(),
                        trimToNull(request.getDescription()),
                        request.getProjectType(),
                        request.getStatus());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        return project;
    }

    public void updateEntity(Project project, UpdateProjectRequest request) {
        project.setName(request.getName().trim());
        project.setDescription(trimToNull(request.getDescription()));
        project.setType(request.getProjectType());
        project.setStatus(request.getStatus());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
    }

    public ProjectResponse toResponse(Project project, long siteCount) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getType(),
                project.getStatus(),
                project.getStartDate(),
                project.getEndDate(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                siteCount);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
