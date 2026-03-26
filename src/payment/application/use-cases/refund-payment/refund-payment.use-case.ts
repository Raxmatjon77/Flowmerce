import { IUseCase } from '@shared/application';
import { IEventPublisher } from '@shared/application';
import { IPaymentRepository, PaymentNotFoundError } from '@payment/domain';

export interface RefundPaymentInput {
  paymentId: string;
}

export class RefundPaymentUseCase
  implements IUseCase<RefundPaymentInput, void>
{
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: RefundPaymentInput): Promise<void> {
    const payment = await this.paymentRepository.findById(input.paymentId);

    if (!payment) {
      throw new PaymentNotFoundError(input.paymentId);
    }

    payment.refund();

    await this.paymentRepository.save(payment);

    const domainEvents = payment.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);
  }
}
