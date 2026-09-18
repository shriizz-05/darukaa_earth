import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "../api/analyticsApi";
import { getApiErrorMessage } from "../api/errors";
import { AnalyticsChart } from "../components/AnalyticsChart";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageShell } from "../components/PageShell";
import { StatCard } from "../components/StatCard";
import { formatMonthLabel, formatScore } from "../lib/format";
import type { AnalyticsSummary } from "../types/analytics";

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; summary: AnalyticsSummary };

export function AnalyticsPage() {
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ kind: "loading" });
      try {
        const summary = await getAnalyticsSummary();
        if (!cancelled) {
          setState({ kind: "ready", summary });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: getApiErrorMessage(
              error,
              "Unable to load analytics. Is the API running with MySQL?",
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

  const labels =
    state.kind === "ready"
      ? state.summary.monthlyAverages.map((point) => formatMonthLabel(point.metricDate))
      : [];
  const summary = state.kind === "ready" ? state.summary : null;
  const demoHint = summary?.demoData
    ? "Demo data — generated mock series, not field measurements."
    : "GET /api/analytics/summary";

  return (
    <PageShell
      eyebrow="Insights"
      title="Analytics"
      description="Monthly averages across restoration sites. Chart points come from the analytics API."
    >
      {state.kind === "loading" ? <LoadingSpinner label="Loading analytics" /> : null}
      {state.kind === "error" ? (
        <>
          <ErrorMessage>{state.message}</ErrorMessage>
          <button type="button" className="btn-quiet" onClick={() => setReloadToken((n) => n + 1)}>
            Try again
          </button>
        </>
      ) : null}

      {summary ? (
        <>
          <p className="demo-caption" role="note">
            {demoHint}
          </p>
          <div className="stat-grid">
            <StatCard label="Sites in summary" value={summary.totalSites} hint={demoHint} />
            <StatCard
              label="Average carbon"
              value={formatScore(summary.averageCarbon, 1)}
              hint="tCO2e, demo series"
            />
            <StatCard
              label="Average biodiversity"
              value={formatScore(summary.averageBiodiversity, 1)}
              hint="Index, demo series"
            />
            <StatCard
              label="Average performance"
              value={formatScore(summary.averagePerformance, 1)}
              hint="Demo data"
            />
          </div>
          <div className="chart-grid">
            <AnalyticsChart
              title="Overall carbon trend"
              datasetLabel="Carbon (tCO2e)"
              labels={labels}
              values={summary.monthlyAverages.map((point) => point.carbonValue)}
              type="line"
              color="#6db58a"
            />
            <AnalyticsChart
              title="Biodiversity"
              datasetLabel="Biodiversity score"
              labels={labels}
              values={summary.monthlyAverages.map((point) => point.biodiversityScore)}
              type="bar"
              color="#4f8f72"
            />
            <AnalyticsChart
              title="Vegetation index"
              datasetLabel="NDVI"
              labels={labels}
              values={summary.monthlyAverages.map((point) => point.vegetationIndex)}
              type="line"
              color="#8aa392"
            />
            <AnalyticsChart
              title="Performance"
              datasetLabel="Performance score"
              labels={labels}
              values={summary.monthlyAverages.map((point) => point.performanceScore)}
              type="line"
              color="#c4b07a"
            />
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
