package com.darukaa.earth.site;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("!nodb")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @PostMapping("/api/projects/{projectId}/sites")
    public ResponseEntity<SiteResponse> create(
            @PathVariable Long projectId, @Valid @RequestBody CreateSiteRequest request) {
        SiteResponse body = siteService.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/sites/" + body.getId())).body(body);
    }

    @GetMapping("/api/projects/{projectId}/sites")
    public List<SiteResponse> listByProject(@PathVariable Long projectId) {
        return siteService.listByProject(projectId);
    }

    @GetMapping("/api/sites")
    public GeoJsonFeatureCollection listAll() {
        return siteService.listAllAsFeatureCollection();
    }

    @GetMapping("/api/sites/{id}")
    public SiteResponse getById(@PathVariable Long id) {
        return siteService.getById(id);
    }

    @PutMapping("/api/sites/{id}")
    public SiteResponse update(
            @PathVariable Long id, @Valid @RequestBody UpdateSiteRequest request) {
        return siteService.update(id, request);
    }

    @DeleteMapping("/api/sites/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        siteService.delete(id);
    }
}
