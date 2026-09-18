import type { CreateSiteRequest, GeoJsonFeatureCollection, SiteSummary } from "../types/site";
import { apiClient } from "./client";

export async function listByProject(projectId: number): Promise<SiteSummary[]> {
  const { data } = await apiClient.get<SiteSummary[]>(`/api/projects/${projectId}/sites`);
  return data;
}

export async function getAll(): Promise<GeoJsonFeatureCollection> {
  const { data } = await apiClient.get<GeoJsonFeatureCollection>("/api/sites");
  return data;
}

export async function getById(id: number): Promise<SiteSummary> {
  const { data } = await apiClient.get<SiteSummary>(`/api/sites/${id}`);
  return data;
}

export async function create(projectId: number, body: CreateSiteRequest): Promise<SiteSummary> {
  const { data } = await apiClient.post<SiteSummary>(`/api/projects/${projectId}/sites`, body);
  return data;
}
