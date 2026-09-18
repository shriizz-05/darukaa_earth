import { apiClient } from "./client";
import type { AnalyticsOverviewPoint, AnalyticsPoint, AnalyticsSummary } from "../types/analytics";

export async function getSiteAnalytics(
  siteId: number,
  range?: { from?: string; to?: string },
): Promise<AnalyticsPoint[]> {
  const { data } = await apiClient.get<AnalyticsPoint[]>(`/api/sites/${siteId}/analytics`, {
    params: {
      from: range?.from,
      to: range?.to,
    },
  });
  return data;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await apiClient.get<AnalyticsSummary>("/api/analytics/summary");
  return data;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverviewPoint[]> {
  const { data } = await apiClient.get<AnalyticsOverviewPoint[]>("/api/analytics/overview");
  return data;
}
