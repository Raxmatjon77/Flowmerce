import { IUseCase } from '@shared/application';
import { IPaymentRepository, PaymentNotFoundError } from '@payment/domain';
import { PaymentResponseDto } from '../../dtos/payment-response.dto';
import { toPaymentResponseDto } from '../payment-response.mapper';

export interface GetPaymentInput {
  orderId: string;
}

export class GetPaymentUseCase
  implements IUseCase<GetPaymentInput, PaymentResponseDto>
{
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: GetPaymentInput): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findByOrderId(input.orderId);

    if (!payment) {
      throw new PaymentNotFoundError(input.orderId);
    }

    return toPaymentResponseDto(payment);
  }
}
