import { IUseCase } from '@shared/application';
import { IEventPublisher } from '@shared/application';
import { IOrderRepository, OrderNotFoundError } from '@order/domain';
import { IOrderWorkflowOrchestrator } from '../../ports/workflow-orchestrator.port';

export interface ConfirmOrderInput {
  orderId: string;
}

export interface ConfirmOrderOutput {
  message: string;
}

export class ConfirmOrderUseCase
  implements IUseCase<ConfirmOrderInput, ConfirmOrderOutput>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly workflowOrchestrator: IOrderWorkflowOrchestrator,
  ) {}

  async execute(input: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
    // Verify order exists
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // Send confirmation signal to workflow
    // The workflow will handle the actual state transition
    await this.workflowOrchestrator.confirmOrder(input.orderId);

    return { message: `Order ${input.orderId} confirmation signal sent` };
  }
}
