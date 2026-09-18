export const PROJECT_TYPES = [
  "BIODIVERSITY",
  "CARBON",
  "REFORESTATION",
  "WATERSHED",
  "COASTAL",
] as const;

export const PROJECT_STATUSES = ["ACTIVE", "PLANNING", "COMPLETED", "ON_HOLD"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: number;
  name: string;
  description: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  siteCount: number;
};

export type ProjectWriteRequest = {
  name: string;
  description: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  BIODIVERSITY: "Biodiversity",
  CARBON: "Carbon",
  REFORESTATION: "Reforestation",
  WATERSHED: "Watershed",
  COASTAL: "Coastal",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  PLANNING: "Planning",
  COMPLETED: "Completed",
  ON_HOLD: "On hold",
};
