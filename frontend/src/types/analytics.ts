export type AnalyticsPoint = {
  id: number;
  siteId: number;
  metricDate: string;
  carbonValue: number | null;
  biodiversityScore: number | null;
  vegetationIndex: number | null;
  performanceScore: number | null;
};

export type AnalyticsOverviewPoint = {
  metricDate: string;
  carbonValue: number | null;
  biodiversityScore: number | null;
  vegetationIndex: number | null;
  performanceScore: number | null;
};

export type AnalyticsSummary = {
  totalSites: number;
  averagePerformance: number | null;
  averageCarbon: number | null;
  averageBiodiversity: number | null;
  averageVegetation: number | null;
  demoData: boolean;
  monthlyAverages: AnalyticsOverviewPoint[];
};
