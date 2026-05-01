import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NativeConnection, Worker, Runtime } from '@temporalio/worker';
import { WorkerModule } from './worker.module';
import { OrderActivitiesImpl } from '@order/infrastructure/temporal/activities/order-activities.impl';
import { TEMPORAL_TASK_QUEUES } from '@shared/infrastructure/temporal';

/**
 * Temporal Worker Configuration
 */
interface WorkerConfig {
  temporalAddress: string;
  namespace: string;
  taskQueue: string;
  maxConcurrentActivityTaskExecutions: number;
  maxConcurrentWorkflowTaskExecutions: number;
  maxCachedWorkflows: number;
  enableSDKTracing: boolean;
  shutdownGraceTime: string;
}

function getConfig(): WorkerConfig {
  return {
    temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || TEMPORAL_TASK_QUEUES.ORDER_PROCESSING,
    maxConcurrentActivityTaskExecutions: parseInt(
      process.env.WORKER_MAX_CONCURRENT_ACTIVITIES || '100',
      10,
    ),
    maxConcurrentWorkflowTaskExecutions: parseInt(
      process.env.WORKER_MAX_CONCURRENT_WORKFLOWS || '100',
      10,
    ),
    maxCachedWorkflows: parseInt(
      process.env.WORKER_MAX_CACHED_WORKFLOWS || '1000',
      10,
    ),
    enableSDKTracing: process.env.TEMPORAL_ENABLE_TRACING === 'true',
    shutdownGraceTime: process.env.WORKER_SHUTDOWN_GRACE_TIME || '30s',
  };
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(ms|s|m|h)$/);
  if (!match) return 30000; // default 30s

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'ms': return value;
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    default: return 30000;
  }
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('TemporalWorker');
  // getConfig() reads process.env directly — acceptable here because worker.ts runs
  // before the NestJS context is created (ConfigService isn't available yet).
  const config = getConfig();

  logger.log('Starting Temporal Worker...');
  logger.log(`Task Queue: ${config.taskQueue}`);
  logger.log(`Temporal Address: ${config.temporalAddress}`);
  logger.log(`Namespace: ${config.namespace}`);

  // Configure Temporal Runtime (singleton)
  Runtime.install({
    logger: {
      log: (level, message) => {
        switch (level) {
          case 'TRACE':
          case 'DEBUG':
            logger.debug(message);
            break;
          case 'INFO':
            logger.log(message);
            break;
          case 'WARN':
            logger.warn(message);
            break;
          case 'ERROR':
            logger.error(message);
            break;
        }
      },
      trace: (message) => logger.debug(message),
      debug: (message) => logger.debug(message),
      info: (message) => logger.log(message),
      warn: (message) => logger.warn(message),
      error: (message) => logger.error(message),
    },
    telemetryOptions: {
      tracingFilter: config.enableSDKTracing 
        ? 'temporal_sdk_core=DEBUG' 
        : 'temporal_sdk_core=WARN',
    },
  });

  // Bootstrap NestJS application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Get activities instance with all dependencies injected
  const activitiesImpl = app.get(OrderActivitiesImpl);

  // Create activity functions bound to the implementation
  const activities = {
    reserveInventory: activitiesImpl.reserveInventory.bind(activitiesImpl),
    releaseInventory: activitiesImpl.releaseInventory.bind(activitiesImpl),
    processPayment: activitiesImpl.processPayment.bind(activitiesImpl),
    refundPayment: activitiesImpl.refundPayment.bind(activitiesImpl),
    confirmOrder: activitiesImpl.confirmOrder.bind(activitiesImpl),
    cancelOrder: activitiesImpl.cancelOrder.bind(activitiesImpl),
    updateOrderStatus: activitiesImpl.updateOrderStatus.bind(activitiesImpl),
    createShipment: activitiesImpl.createShipment.bind(activitiesImpl),
    notifyUser: activitiesImpl.notifyUser.bind(activitiesImpl),
  };

  // Connect to Temporal server
  const connection = await NativeConnection.connect({
    address: config.temporalAddress,
  });

  logger.log('Connected to Temporal server');

  // Create worker
  const worker = await Worker.create({
    connection,
    namespace: config.namespace,
    taskQueue: config.taskQueue,
    workflowsPath: require.resolve(
      '@order/infrastructure/temporal/workflows/order-processing.workflow',
    ),
    activities,
    maxConcurrentActivityTaskExecutions: config.maxConcurrentActivityTaskExecutions,
    maxConcurrentWorkflowTaskExecutions: config.maxConcurrentWorkflowTaskExecutions,
    maxCachedWorkflows: config.maxCachedWorkflows,
    shutdownGraceTime: parseDuration(config.shutdownGraceTime),
  });

  logger.log('Worker created successfully');
  logger.log(`Max concurrent activities: ${config.maxConcurrentActivityTaskExecutions}`);
  logger.log(`Max concurrent workflows: ${config.maxConcurrentWorkflowTaskExecutions}`);

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, initiating graceful shutdown...`);
    
    // Worker shutdown (waits for in-flight tasks)
    worker.shutdown();
    
    // Close NestJS application context
    await app.close();
    
    logger.log('Worker shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`, error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
    process.exit(1);
  });

  // Start polling for tasks
  logger.log('Worker starting to poll for tasks...');
  
  try {
    await worker.run();
  } catch (error) {
    logger.error(`Worker failed: ${error}`);
    await app.close();
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});
