package com.darukaa.earth.site;

import com.darukaa.earth.analytics.AnalyticsRecord;
import com.darukaa.earth.common.AuditedEntity;
import com.darukaa.earth.project.Project;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Polygon;

@Entity
@Table(name = "sites")
public class Site extends AuditedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** MySQL 8 GEOMETRY SRID 4326, mapped with Hibernate Spatial (not PostGIS). */
    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "geometry", nullable = false, columnDefinition = "GEOMETRY NOT NULL SRID 4326")
    private Polygon geometry;

    @Column(name = "centroid_latitude", precision = 10, scale = 7)
    private BigDecimal centroidLatitude;

    @Column(name = "centroid_longitude", precision = 10, scale = 7)
    private BigDecimal centroidLongitude;

    @Column(name = "area_sq_km", precision = 14, scale = 6)
    private BigDecimal areaSqKm;

    @OneToMany(
            mappedBy = "site",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    private List<AnalyticsRecord> analytics = new ArrayList<>();

    protected Site() {}

    public Site(Project project, String name, Polygon geometry) {
        this.project = project;
        this.name = name;
        this.geometry = geometry;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Polygon getGeometry() {
        return geometry;
    }

    public void setGeometry(Polygon geometry) {
        this.geometry = geometry;
    }

    public BigDecimal getCentroidLatitude() {
        return centroidLatitude;
    }

    public void setCentroidLatitude(BigDecimal centroidLatitude) {
        this.centroidLatitude = centroidLatitude;
    }

    public BigDecimal getCentroidLongitude() {
        return centroidLongitude;
    }

    public void setCentroidLongitude(BigDecimal centroidLongitude) {
        this.centroidLongitude = centroidLongitude;
    }

    public BigDecimal getAreaSqKm() {
        return areaSqKm;
    }

    public void setAreaSqKm(BigDecimal areaSqKm) {
        this.areaSqKm = areaSqKm;
    }

    public List<AnalyticsRecord> getAnalytics() {
        return analytics;
    }

    public void addAnalytics(AnalyticsRecord record) {
        analytics.add(record);
        record.setSite(this);
    }

    public void removeAnalytics(AnalyticsRecord record) {
        analytics.remove(record);
        record.setSite(null);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Site other)) {
            return false;
        }
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Site{id=" + getId() + ", name='" + name + "'}";
    }
}
