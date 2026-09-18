package com.darukaa.earth.project;

import java.time.Instant;
import java.time.LocalDate;

public class ProjectResponse {

    private final Long id;
    private final String name;
    private final String description;
    private final ProjectType projectType;
    private final ProjectStatus status;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final long siteCount;

    public ProjectResponse(
            Long id,
            String name,
            String description,
            ProjectType projectType,
            ProjectStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Instant createdAt,
            Instant updatedAt,
            long siteCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.projectType = projectType;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.siteCount = siteCount;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public ProjectType getProjectType() {
        return projectType;
    }

    public ProjectStatus getStatus() {
        return status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getSiteCount() {
        return siteCount;
    }
}
