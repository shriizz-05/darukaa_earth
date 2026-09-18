import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSiteAnalytics } from "../api/analyticsApi";
import { getApiErrorMessage } from "../api/errors";
import { getById } from "../api/siteApi";
import { AnalyticsChart } from "../components/AnalyticsChart";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageShell } from "../components/PageShell";
import { SiteDetails } from "../components/SiteDetails";
import { formatMonthLabel, formatScore } from "../lib/format";
import type { AnalyticsPoint } from "../types/analytics";
import type { SiteView } from "../types/site";

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; site: SiteView; series: AnalyticsPoint[]; analyticsError: string | null };

export function SiteDetailPage() {
  const { id } = useParams();
  const siteId = Number(id);
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(siteId) || siteId <= 0) {
      setState({ kind: "error", message: "This site id is not valid." });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    async function load() {
      try {
        const data = await getById(siteId);
        let series: AnalyticsPoint[] = [];
        let analyticsError: string | null = null;
        try {
          series = await getSiteAnalytics(siteId);
        } catch (cause) {
          analyticsError = getApiErrorMessage(cause, "Unable to load analytics for this site.");
        }
        if (!cancelled) {
          setState({
            kind: "ready",
            site: {
              id: data.id,
              name: data.name,
              description: data.description,
              projectId: data.projectId,
              areaSqKm: data.areaSqKm,
              centroidLatitude: data.centroidLatitude,
              centroidLongitude: data.centroidLongitude,
            },
            series,
            analyticsError,
          });
        }
      } catch (cause) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: getApiErrorMessage(cause, "Unable to load this site."),
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [siteId, reloadToken]);

  if (state.kind === "loading") {
    return (
      <PageShell eyebrow="Site" title="Site">
        <LoadingSpinner label="Loading site" />
      </PageShell>
    );
  }

  if (state.kind === "error") {
    return (
      <PageShell eyebrow="Site" title="Site">
        <ErrorMessage>{state.message}</ErrorMessage>
        <button type="button" className="btn-quiet" onClick={() => setReloadToken((n) => n + 1)}>
          Try again
        </button>
        <Link to="/projects" className="text-link">
          Back to projects
        </Link>
      </PageShell>
    );
  }

  const { site, series, analyticsError } = state;
  const labels = series.map((point) => formatMonthLabel(point.metricDate));
  const latest = series.length > 0 ? series[series.length - 1] : null;

  return (
    <PageShell
      eyebrow="Site"
      title={site.name}
      description={site.description || "Saved polygon from the map."}
    >
      <SiteDetails site={site} latestPerformance={latest?.performanceScore ?? null} />

      <section id="analytics" className="site-analytics">
        <h2 className="section-title">Site analytics</h2>
        <p className="demo-caption" role="note">
          Chart points come from GET /api/sites/{site.id}/analytics. Seeded values are generated
          demo data, not field measurements.
        </p>
        {analyticsError ? (
          <>
            <ErrorMessage>{analyticsError}</ErrorMessage>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => setReloadToken((n) => n + 1)}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            {latest ? (
              <p className="muted">
                Latest performance {formatScore(latest.performanceScore, 1)} on{" "}
                {formatMonthLabel(latest.metricDate)}.
              </p>
            ) : null}
            <div className="chart-grid">
              <AnalyticsChart
                title="Carbon"
                datasetLabel="Carbon (tCO2e)"
                labels={labels}
                values={series.map((point) => point.carbonValue)}
                type="line"
              />
              <AnalyticsChart
                title="Biodiversity"
                datasetLabel="Biodiversity score"
                labels={labels}
                values={series.map((point) => point.biodiversityScore)}
                type="bar"
              />
              <AnalyticsChart
                title="Vegetation index"
                datasetLabel="NDVI"
                labels={labels}
                values={series.map((point) => point.vegetationIndex)}
                type="line"
                color="#8aa392"
              />
              <AnalyticsChart
                title="Performance"
                datasetLabel="Performance score"
                labels={labels}
                values={series.map((point) => point.performanceScore)}
                type="line"
                color="#c4b07a"
              />
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
