import { NotFoundException } from '@nestjs/common';
import { IUseCase } from '@shared/application';
import { DashboardOrderDetailDto } from '../../dtos/dashboard-response.dto';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import { formatAddress, formatPaymentMethod } from '../dashboard-view.mapper';

export interface GetDashboardOrderDetailInput {
  orderId: string;
}

export class GetDashboardOrderDetailUseCase
  implements IUseCase<GetDashboardOrderDetailInput, DashboardOrderDetailDto>
{
  constructor(private readonly dashboardReadPort: IDashboardReadPort) {}

  async execute(
    input: GetDashboardOrderDetailInput,
  ): Promise<DashboardOrderDetailDto> {
    const order = await this.dashboardReadPort.findOrderById(input.orderId);

    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} not found`);
    }

    const [items, payment, shipment] = await Promise.all([
      this.dashboardReadPort.findOrderItemsByOrderId(input.orderId),
      this.dashboardReadPort.findPaymentByOrderId(input.orderId),
      this.dashboardReadPort.findShipmentByOrderId(input.orderId),
    ]);

    return {
      id: order.id,
      customerId: order.customer_id,
      status: order.status,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      shippingAddress: formatAddress({
        street: order.shipping_street,
        city: order.shipping_city,
        state: order.shipping_state,
        zipCode: order.shipping_zip_code,
        country: order.shipping_country,
      }),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        currency: item.currency,
        totalPrice: Number(item.unit_price) * item.quantity,
      })),
      payment: payment
        ? {
            id: payment.id,
            orderId: payment.order_id,
            amount: Number(payment.amount),
            currency: payment.currency,
            status: payment.status,
            method: formatPaymentMethod(payment.method_type, payment.method_last4),
            transactionId: payment.transaction_id,
            failureReason: payment.failure_reason,
            createdAt: payment.created_at,
          }
        : null,
      shipment: shipment
        ? {
            id: shipment.id,
            orderId: shipment.order_id,
            status: shipment.status,
            trackingNumber: shipment.tracking_number,
            carrierName: shipment.carrier_name,
            estimatedDelivery: shipment.estimated_delivery,
            createdAt: shipment.created_at,
          }
        : null,
    };
  }
}
