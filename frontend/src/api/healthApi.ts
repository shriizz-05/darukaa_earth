import { apiClient } from "./client";
import type { HealthStatus } from "../types/health";

export async function fetchHealth(): Promise<HealthStatus> {
  const { data } = await apiClient.get<HealthStatus>("/api/health");
  return data;
}
