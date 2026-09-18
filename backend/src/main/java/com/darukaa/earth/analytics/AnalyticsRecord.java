package com.darukaa.earth.analytics;

import com.darukaa.earth.common.AuditedEntity;
import com.darukaa.earth.site.Site;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "analytics")
public class AnalyticsRecord extends AuditedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "metric_name", nullable = false, length = 64)
    private String metricName;

    @Column(name = "metric_value", nullable = false, precision = 16, scale = 6)
    private BigDecimal metricValue;

    @Column(length = 32)
    private String unit;

    protected AnalyticsRecord() {}

    public AnalyticsRecord(
            Site site,
            LocalDate metricDate,
            String metricName,
            BigDecimal metricValue,
            String unit) {
        this.site = site;
        this.metricDate = metricDate;
        this.metricName = metricName;
        this.metricValue = metricValue;
        this.unit = unit;
    }

    public Site getSite() {
        return site;
    }

    public void setSite(Site site) {
        this.site = site;
    }

    public LocalDate getMetricDate() {
        return metricDate;
    }

    public void setMetricDate(LocalDate metricDate) {
        this.metricDate = metricDate;
    }

    public String getMetricName() {
        return metricName;
    }

    public void setMetricName(String metricName) {
        this.metricName = metricName;
    }

    public BigDecimal getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(BigDecimal metricValue) {
        this.metricValue = metricValue;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof AnalyticsRecord other)) {
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
        return "AnalyticsRecord{id="
                + getId()
                + ", metricName='"
                + metricName
                + "', metricDate="
                + metricDate
                + "}";
    }
}
