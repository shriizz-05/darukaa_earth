package com.darukaa.earth.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository
        extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    boolean existsByName(String name);

    @Query("select count(s) from Site s where s.project.id = :projectId")
    long countSitesByProjectId(@Param("projectId") Long projectId);
}
