import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsSummary } from "../api/analyticsApi";
import { getApiErrorMessage } from "../api/errors";
import { listProjects } from "../api/projectApi";
import { getAll } from "../api/siteApi";
import { AnalyticsChart } from "../components/AnalyticsChart";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageShell } from "../components/PageShell";
import { ProjectCard } from "../components/ProjectCard";
import { StatCard } from "../components/StatCard";
import { formatMonthLabel, formatScore } from "../lib/format";
import type { AnalyticsSummary } from "../types/analytics";
import type { Project } from "../types/project";

type DashState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; projects: Project[]; siteCount: number; summary: AnalyticsSummary | null };

function recentProjects(projects: Project[]): Project[] {
  return [...projects]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);
}

export function DashboardPage() {
  const [state, setState] = useState<DashState>({ kind: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ kind: "loading" });
      try {
        const [projects, summary] = await Promise.all([
          listProjects(),
          getAnalyticsSummary().catch(() => null),
        ]);
        let siteCount =
          summary?.totalSites ??
          projects.reduce((sum, project) => sum + (project.siteCount ?? 0), 0);
        try {
          const collection = await getAll();
          siteCount = collection.features?.length ?? siteCount;
        } catch {
          // FeatureCollection is optional for the count; summary or siteCount on projects still works.
        }
        if (!cancelled) {
          setState({ kind: "ready", projects, siteCount, summary });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: getApiErrorMessage(
              error,
              "Unable to load dashboard data. Is the API running with MySQL?",
            ),
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const recent = state.kind === "ready" ? recentProjects(state.projects) : [];
  const activeCount =
    state.kind === "ready"
      ? state.projects.filter((project) => project.status === "ACTIVE").length
      : 0;
  const summary = state.kind === "ready" ? state.summary : null;
  const performanceValue =
    summary?.averagePerformance != null ? formatScore(summary.averagePerformance, 1) : "—";
  const chartLabels =
    summary?.monthlyAverages.map((point) => formatMonthLabel(point.metricDate)) ?? [];

  return (
    <PageShell
      eyebrow="Overview"
      title="Dashboard"
      description="Live counts from restoration projects and sites, plus Chart.js trends from the analytics API."
    >
      {state.kind === "loading" ? <LoadingSpinner label="Loading dashboard" /> : null}
      {state.kind === "error" ? (
        <>
          <ErrorMessage>{state.message}</ErrorMessage>
          <button type="button" className="btn-quiet" onClick={() => setReloadToken((n) => n + 1)}>
            Try again
          </button>
        </>
      ) : null}

      {state.kind === "ready" ? (
        <>
          <div className="stat-grid">
            <StatCard
              label="Total Projects"
              value={state.projects.length}
              hint="GET /api/projects"
            />
            <StatCard label="Active Projects" value={activeCount} hint="Status = ACTIVE" />
            <StatCard
              label="Total Sites"
              value={state.siteCount}
              hint="GET /api/sites features, or summary.totalSites"
            />
            <StatCard
              label="Average Performance"
              value={performanceValue}
              hint={summary?.averagePerformance != null ? "Demo data" : "No analytics rows yet"}
            />
          </div>
          {summary?.demoData ? (
            <p className="demo-caption" role="note">
              Performance and charts use generated demo series, not field measurements.
            </p>
          ) : null}

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>Recent projects</h2>
                <Link to="/projects" className="text-link table-link">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  description="Create a project to populate this dashboard from the API."
                  action={
                    <Link to="/projects" className="btn-primary btn-compact">
                      Go to projects
                    </Link>
                  }
                />
              ) : (
                <div className="card-grid">
                  {recent.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </section>

            <section className="panel map-preview">
              <h2>Map preview</h2>
              <p className="muted">
                Draw site polygons on the live Mapbox map. Saved GeoJSON loads from the API, not
                from sample data.
              </p>
              <Link to="/map" className="btn-primary btn-compact">
                Open map
              </Link>
            </section>
          </div>

          <div className="chart-grid dashboard-charts">
            <AnalyticsChart
              title="Carbon trend"
              datasetLabel="Carbon (tCO2e)"
              labels={chartLabels}
              values={summary?.monthlyAverages.map((point) => point.carbonValue) ?? []}
              type="line"
            />
            <AnalyticsChart
              title="Performance trend"
              datasetLabel="Performance score"
              labels={chartLabels}
              values={summary?.monthlyAverages.map((point) => point.performanceScore) ?? []}
              type="bar"
              color="#c4b07a"
            />
          </div>
          <p className="demo-caption">
            <Link to="/analytics" className="text-link table-link">
              Open full analytics
            </Link>
          </p>
        </>
      ) : null}
    </PageShell>
  );
}
