import { ForbiddenException } from '@nestjs/common';
import { IUseCase } from '@shared/application';
import { IEventPublisher } from '@shared/application';
import { IOrderRepository, OrderNotFoundError } from '@order/domain';
import { IOrderWorkflowOrchestrator } from '../../ports/workflow-orchestrator.port';
import { Role } from '../../../../shared/infrastructure/auth/auth.constants';

export interface CancelOrderInput {
  orderId: string;
  requesterId?: string;
  requesterRole?: Role;
}

export interface CancelOrderOutput {
  message: string;
}

export class CancelOrderUseCase
  implements IUseCase<CancelOrderInput, CancelOrderOutput>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly workflowOrchestrator: IOrderWorkflowOrchestrator,
  ) {}

  async execute(input: CancelOrderInput): Promise<CancelOrderOutput> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    if (
      input.requesterRole === Role.CUSTOMER &&
      input.requesterId !== undefined &&
      order.customerId !== input.requesterId
    ) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Cancel the workflow first (if running)
    await this.workflowOrchestrator.cancelOrderWorkflow(input.orderId);

    // Update domain state
    order.cancel();

    await this.orderRepository.save(order);

    // Publish domain events
    const domainEvents = order.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);

    return { message: `Order ${input.orderId} has been cancelled` };
  }
}
