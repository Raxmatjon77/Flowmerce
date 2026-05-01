import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, WorkflowNotFoundError } from '@temporalio/client';
import { TEMPORAL_CLIENT } from '@shared/infrastructure/temporal/temporal.module';
import { TEMPORAL_TASK_QUEUES, TEMPORAL_WORKFLOW_ID_PREFIX } from '@shared/infrastructure/temporal';
import {
  IOrderWorkflowOrchestrator,
  StartOrderWorkflowInput,
} from '@order/application/ports/workflow-orchestrator.port';
import { OrderWorkflowNotFoundError } from '@order/domain';
import {
  orderProcessingWorkflow,
  confirmOrderSignal,
} from '../workflows/order-processing.workflow';

@Injectable()
export class OrderWorkflowOrchestrator implements IOrderWorkflowOrchestrator {
  private readonly logger = new Logger(OrderWorkflowOrchestrator.name);
  private readonly taskQueue: string;

  constructor(
    @Inject(TEMPORAL_CLIENT)
    private readonly temporalClient: Client,
    config: ConfigService,
  ) {
    this.taskQueue = config.get<string>('temporal.taskQueue') ?? TEMPORAL_TASK_QUEUES.ORDER_PROCESSING;
  }

  async startOrderProcessing(input: StartOrderWorkflowInput): Promise<void> {
    const workflowId = this.getWorkflowId(input.orderId);

    this.logger.log(`Starting order processing workflow: ${workflowId}`);

    try {
      await this.temporalClient.workflow.start(orderProcessingWorkflow, {
        workflowId,
        taskQueue: this.taskQueue,
        args: [input],
      });

      this.logger.log(`Workflow started successfully: ${workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to start workflow ${workflowId}: ${error}`);
      throw error;
    }
  }

  async confirmOrder(orderId: string): Promise<void> {
    const workflowId = this.getWorkflowId(orderId);

    this.logger.log(`Sending confirmation signal to workflow: ${workflowId}`);

    try {
      const handle = this.temporalClient.workflow.getHandle(workflowId);
      await handle.signal(confirmOrderSignal);

      this.logger.log(`Confirmation signal sent: ${workflowId}`);
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        this.logger.warn(`Workflow not found: ${workflowId}`);
        throw new OrderWorkflowNotFoundError(orderId);
      }
      throw error;
    }
  }

  async cancelOrderWorkflow(orderId: string): Promise<void> {
    const workflowId = this.getWorkflowId(orderId);

    this.logger.log(`Cancelling workflow: ${workflowId}`);

    try {
      const handle = this.temporalClient.workflow.getHandle(workflowId);
      await handle.cancel();

      this.logger.log(`Workflow cancelled: ${workflowId}`);
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        this.logger.warn(`Workflow not found for cancellation: ${workflowId}`);
        return;
      }
      throw error;
    }
  }

  async getWorkflowStatus(orderId: string): Promise<string | null> {
    const workflowId = this.getWorkflowId(orderId);

    try {
      const handle = this.temporalClient.workflow.getHandle(workflowId);
      const description = await handle.describe();
      return description.status.name;
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  private getWorkflowId(orderId: string): string {
    return `${TEMPORAL_WORKFLOW_ID_PREFIX.ORDER}${orderId}`;
  }
}
