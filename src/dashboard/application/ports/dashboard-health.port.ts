import { ServiceHealthStatus } from '../enums/dashboard.enums';

export const DASHBOARD_HEALTH_PORT = Symbol('DASHBOARD_HEALTH_PORT');

export interface DashboardDependencyHealth {
  name: string;
  status: ServiceHealthStatus;
  responseTimeMs: number | null;
  details: string;
  checkedAt: Date;
}

export interface IDashboardHealthPort {
  checkDependencies(): Promise<DashboardDependencyHealth[]>;
}
