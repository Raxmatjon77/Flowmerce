import { registerAs } from '@nestjs/config';

export const temporalConfig = registerAs('temporal', () => ({
  address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
  taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'order-processing',
  enableTracing: process.env.TEMPORAL_ENABLE_TRACING === 'true',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'super-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRATION ?? '24h',
}));

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (
    process.env.CORS_ORIGINS ??
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
}));

export const outboxConfig = registerAs('outbox', () => ({
  pollingEnabled: process.env.OUTBOX_POLLING_ENABLED !== 'false',
  pollIntervalMs: parseInt(process.env.OUTBOX_POLL_INTERVAL_MS ?? '1000', 10),
}));

export const idempotencyConfig = registerAs('idempotency', () => ({
  ttlMs: parseInt(process.env.IDEMPOTENCY_TTL_MS ?? '86400000', 10),
}));

export const workerConfig = registerAs('worker', () => ({
  maxConcurrentActivities: parseInt(process.env.WORKER_MAX_CONCURRENT_ACTIVITIES ?? '100', 10),
  maxConcurrentWorkflows: parseInt(process.env.WORKER_MAX_CONCURRENT_WORKFLOWS ?? '100', 10),
  maxCachedWorkflows: parseInt(process.env.WORKER_MAX_CACHED_WORKFLOWS ?? '1000', 10),
  shutdownGraceTime: process.env.WORKER_SHUTDOWN_GRACE_TIME ?? '30s',
}));
