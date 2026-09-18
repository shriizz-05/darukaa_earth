package com.darukaa.earth.site;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SiteRepository extends JpaRepository<Site, Long> {

    @Query("select s from Site s join fetch s.project p where p.id = :projectId")
    List<Site> findByProjectId(@Param("projectId") Long projectId);

    @Query("select s from Site s join fetch s.project")
    List<Site> findAllWithProject();
}
