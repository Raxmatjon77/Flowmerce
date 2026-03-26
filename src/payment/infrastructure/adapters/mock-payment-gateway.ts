import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentGateway,
  PaymentGatewayMethod,
  PaymentGatewayResult,
} from '@payment/application';

@Injectable()
export class MockPaymentGateway implements IPaymentGateway {
  private readonly logger = new Logger(MockPaymentGateway.name);

  async charge(
    amount: number,
    currency: string,
    method: PaymentGatewayMethod,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(
      `[MOCK] Processing payment: ${amount} ${currency} via ${method.type} ending in ${method.last4Digits}`,
    );

    // Simulate processing delay
    await this.simulateLatency();

    const transactionId = `txn_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    this.logger.log(
      `[MOCK] Payment successful. Transaction ID: ${transactionId}`,
    );

    return {
      transactionId,
      success: true,
    };
  }

  private simulateLatency(): Promise<void> {
    const delayMs = Math.floor(Math.random() * 200) + 50;
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
