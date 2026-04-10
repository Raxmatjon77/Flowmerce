export enum ServiceHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

export enum StockState {
  HEALTHY = 'healthy',
  LOW = 'low',
  CRITICAL = 'critical',
}

export enum ActivityFeedType {
  ORDER = 'order',
  PAYMENT = 'payment',
  SHIPMENT = 'shipment',
  NOTIFICATION = 'notification',
}
