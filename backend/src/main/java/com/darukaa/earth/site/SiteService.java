package com.darukaa.earth.site;

import com.darukaa.earth.exception.ResourceNotFoundException;
import com.darukaa.earth.project.Project;
import com.darukaa.earth.project.ProjectRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import org.locationtech.jts.geom.Polygon;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!nodb")
@ConditionalOnBean(SiteRepository.class)
public class SiteService {

    private final SiteRepository siteRepository;
    private final ProjectRepository projectRepository;
    private final GeometryConverter geometryConverter;
    private final SiteMapper siteMapper;

    public SiteService(
            SiteRepository siteRepository,
            ProjectRepository projectRepository,
            GeometryConverter geometryConverter,
            SiteMapper siteMapper) {
        this.siteRepository = siteRepository;
        this.projectRepository = projectRepository;
        this.geometryConverter = geometryConverter;
        this.siteMapper = siteMapper;
    }

    @Transactional
    public SiteResponse create(Long projectId, CreateSiteRequest request) {
        Project project =
                projectRepository
                        .findById(projectId)
                        .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        Site site = new Site(project, request.getName().trim(), polygon(request.getGeometry()));
        site.setDescription(trimToNull(request.getDescription()));
        geometryConverter.fillDerivedMetrics(site, site.getGeometry());
        return siteMapper.toResponse(siteRepository.save(site));
    }

    @Transactional(readOnly = true)
    public List<SiteResponse> listByProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }
        return siteRepository.findByProjectId(projectId).stream()
                .map(siteMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SiteResponse getById(Long id) {
        return siteMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public SiteResponse update(Long id, UpdateSiteRequest request) {
        Site site = findOrThrow(id);
        Polygon polygon = polygon(request.getGeometry());
        site.setName(request.getName().trim());
        site.setDescription(trimToNull(request.getDescription()));
        site.setGeometry(polygon);
        geometryConverter.fillDerivedMetrics(site, polygon);
        return siteMapper.toResponse(siteRepository.save(site));
    }

    @Transactional
    public void delete(Long id) {
        Site site = findOrThrow(id);
        siteRepository.delete(site);
    }

    @Transactional(readOnly = true)
    public GeoJsonFeatureCollection listAllAsFeatureCollection() {
        List<GeoJsonFeature> features =
                siteRepository.findAll().stream().map(siteMapper::toFeature).toList();
        return new GeoJsonFeatureCollection(features);
    }

    private Site findOrThrow(Long id) {
        return siteRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site", id));
    }

    private Polygon polygon(JsonNode geometry) {
        return geometryConverter.toPolygon(geometry);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
