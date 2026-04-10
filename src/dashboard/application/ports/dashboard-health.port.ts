export const DASHBOARD_HEALTH_PORT = Symbol('DASHBOARD_HEALTH_PORT');

export interface DashboardDependencyHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTimeMs: number | null;
  details: string;
  checkedAt: Date;
}

export interface IDashboardHealthPort {
  checkDependencies(): Promise<DashboardDependencyHealth[]>;
}
