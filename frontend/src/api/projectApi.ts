import type { Project, ProjectStatus, ProjectType, ProjectWriteRequest } from "../types/project";
import { apiClient } from "./client";

export type ProjectListFilters = {
  status?: ProjectStatus;
  projectType?: ProjectType;
  name?: string;
};

export async function listProjects(filters: ProjectListFilters = {}): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>("/api/projects", { params: filters });
  return data;
}

export async function getProject(id: number): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/api/projects/${id}`);
  return data;
}

export async function createProject(body: ProjectWriteRequest): Promise<Project> {
  const { data } = await apiClient.post<Project>("/api/projects", body);
  return data;
}

export async function updateProject(id: number, body: ProjectWriteRequest): Promise<Project> {
  const { data } = await apiClient.put<Project>(`/api/projects/${id}`, body);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/api/projects/${id}`);
}
