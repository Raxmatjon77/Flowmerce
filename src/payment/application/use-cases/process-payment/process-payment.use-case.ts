import { v4 as uuidv4 } from 'uuid';
import { IUseCase } from '@shared/application';
import { IEventPublisher } from '@shared/application';
import {
  Payment,
  Money,
  PaymentMethod,
  PaymentMethodType,
  IPaymentRepository,
} from '@payment/domain';
import { ProcessPaymentDto } from '../../dtos/process-payment.dto';
import { PaymentResponseDto } from '../../dtos/payment-response.dto';
import { IPaymentGateway } from '../../ports/payment-gateway.port';
import { toPaymentResponseDto } from '../payment-response.mapper';

export class ProcessPaymentUseCase
  implements IUseCase<ProcessPaymentDto, PaymentResponseDto>
{
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: ProcessPaymentDto): Promise<PaymentResponseDto> {
    const paymentId = uuidv4();
    const amount = Money.create(input.amount, input.currency);
    const method = PaymentMethod.create(
      input.method.type as PaymentMethodType,
      input.method.last4Digits,
      input.method.expiryMonth,
      input.method.expiryYear,
    );

    const payment = Payment.create(paymentId, input.orderId, amount, method);

    payment.process();

    const gatewayResult = await this.paymentGateway.charge(
      input.amount,
      input.currency,
      {
        type: input.method.type,
        last4Digits: input.method.last4Digits,
        expiryMonth: input.method.expiryMonth,
        expiryYear: input.method.expiryYear,
      },
    );

    if (gatewayResult.success) {
      payment.complete(gatewayResult.transactionId);
    } else {
      payment.fail(gatewayResult.failureReason ?? 'Payment declined');
    }

    await this.paymentRepository.save(payment);

    const domainEvents = payment.clearDomainEvents();
    await this.eventPublisher.publishAll(domainEvents);

    return toPaymentResponseDto(payment);
  }
}
