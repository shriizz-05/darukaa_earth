import type { ChartData, ChartOptions } from "chart.js";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { EmptyState } from "./EmptyState";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const FOREST_LINE = "#6db58a";
const FOREST_FILL = "rgba(109, 181, 138, 0.18)";
const SLATE_BAR = "#4f8f72";
const SLATE_BAR_FILL = "rgba(79, 143, 114, 0.42)";
const TICK = "#8a9a90";
const GRID = "#24302a";
const TEXT = "#e7eee9";

type AnalyticsChartProps = {
  title: string;
  labels: string[];
  values: Array<number | null>;
  datasetLabel: string;
  type?: "line" | "bar";
  color?: string;
};

function chartOptions(title: string): ChartOptions<"line" | "bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: TEXT,
        font: { size: 14, weight: 600 },
      },
      tooltip: {
        backgroundColor: "#141c18",
        borderColor: GRID,
        borderWidth: 1,
        titleColor: TEXT,
        bodyColor: TEXT,
      },
    },
    scales: {
      x: {
        ticks: { color: TICK, maxRotation: 45, minRotation: 0 },
        grid: { color: GRID },
      },
      y: {
        beginAtZero: true,
        ticks: { color: TICK },
        grid: { color: GRID },
      },
    },
  };
}

export function AnalyticsChart({
  title,
  labels,
  values,
  datasetLabel,
  type = "line",
  color,
}: AnalyticsChartProps) {
  const hasPoints =
    labels.length > 0 && values.some((value) => value != null && !Number.isNaN(Number(value)));

  if (!hasPoints) {
    return (
      <section className="panel chart-panel" aria-label={title}>
        <h2>{title}</h2>
        <EmptyState
          title="No analytics yet"
          description="Charts fill in when the API returns time-series points. Seeded mock data appears after APP_SEED_DEMO."
        />
      </section>
    );
  }

  const stroke = color ?? (type === "bar" ? SLATE_BAR : FOREST_LINE);
  const fill = type === "bar" ? SLATE_BAR_FILL : FOREST_FILL;
  const dataset = {
    label: datasetLabel,
    data: values,
    borderColor: stroke,
    backgroundColor: fill,
    tension: 0.3,
    fill: type === "line",
    pointRadius: 3,
    pointHoverRadius: 5,
    borderWidth: type === "bar" ? 0 : 2,
  };
  const options = chartOptions(title);

  return (
    <section className="panel chart-panel">
      <h2>{title}</h2>
      <figure className="chart-figure">
        <div className="chart-canvas-wrap">
          {type === "bar" ? (
            <Bar
              data={{ labels, datasets: [dataset] } satisfies ChartData<"bar">}
              options={options as ChartOptions<"bar">}
              aria-label={title}
              role="img"
            />
          ) : (
            <Line
              data={{ labels, datasets: [dataset] } satisfies ChartData<"line">}
              options={options as ChartOptions<"line">}
              aria-label={title}
              role="img"
            />
          )}
        </div>
        <figcaption className="sr-only">{title} time-series chart</figcaption>
      </figure>
    </section>
  );
}
