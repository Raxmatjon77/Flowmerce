import { Injectable, Inject } from '@nestjs/common';
import {
  INVENTORY_SERVICE_PORT,
  IInventoryServicePort,
  InventoryReservationItem,
} from '@order/application/ports/inventory-service.port';
import {
  PAYMENT_SERVICE_PORT,
  IPaymentServicePort,
} from '@order/application/ports/payment-service.port';
import {
  SHIPPING_SERVICE_PORT,
  IShippingServicePort,
  ShippingAddress,
} from '@order/application/ports/shipping-service.port';
import {
  NOTIFICATION_SERVICE_PORT,
  INotificationServicePort,
  NotificationType,
} from '@order/application/ports/notification-service.port';
import { IOrderRepository, ORDER_REPOSITORY } from '@order/domain';

export interface OrderActivities {
  reserveInventory(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<void>;

  releaseInventory(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<void>;

  processPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: {
      type: string;
      last4Digits: string;
      expiryMonth: number;
      expiryYear: number;
    },
  ): Promise<string>;

  refundPayment(paymentId: string): Promise<void>;

  confirmOrder(orderId: string): Promise<void>;

  cancelOrder(orderId: string): Promise<void>;

  updateOrderStatus(orderId: string, status: string): Promise<void>;

  createShipment(
    orderId: string,
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    },
  ): Promise<void>;

  notifyUser(
    recipientId: string,
    type: string,
    data: Record<string, unknown>,
  ): Promise<void>;
}

@Injectable()
export class OrderActivitiesImpl implements OrderActivities {
  constructor(
    @Inject(INVENTORY_SERVICE_PORT)
    private readonly inventoryService: IInventoryServicePort,
    @Inject(PAYMENT_SERVICE_PORT)
    private readonly paymentService: IPaymentServicePort,
    @Inject(SHIPPING_SERVICE_PORT)
    private readonly shippingService: IShippingServicePort,
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notificationService: INotificationServicePort,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async reserveInventory(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<void> {
    const reservationItems: InventoryReservationItem[] = items.map((item) => ({
      productId: item.sku,
      quantity: item.quantity,
    }));
    await this.inventoryService.reserveInventory(orderId, reservationItems);
  }

  async releaseInventory(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<void> {
    const reservationItems: InventoryReservationItem[] = items.map((item) => ({
      productId: item.sku,
      quantity: item.quantity,
    }));
    await this.inventoryService.releaseInventory(orderId, reservationItems);
  }

  async processPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: {
      type: string;
      last4Digits: string;
      expiryMonth: number;
      expiryYear: number;
    },
  ): Promise<string> {
    const result = await this.paymentService.processPayment(
      orderId,
      amount,
      currency,
      method,
    );

    if (!result.success) {
      throw new Error(
        result.failureReason ?? 'Payment processing failed',
      );
    }

    return result.paymentId;
  }

  async refundPayment(paymentId: string): Promise<void> {
    await this.paymentService.refundPayment(paymentId);
  }

  async confirmOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    order.confirm();
    await this.orderRepository.save(order);
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    order.cancel();
    await this.orderRepository.save(order);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    switch (status) {
      case 'INVENTORY_RESERVED':
        order.reserveInventory();
        break;
      case 'PAYMENT_PROCESSED':
        order.processPayment();
        break;
      case 'CONFIRMED':
        order.confirm();
        break;
      case 'SHIPPED':
        order.ship();
        break;
      case 'DELIVERED':
        order.deliver();
        break;
      default:
        throw new Error(`Unknown status transition: ${status}`);
    }

    await this.orderRepository.save(order);
  }

  async createShipment(
    orderId: string,
    address: ShippingAddress,
  ): Promise<void> {
    await this.shippingService.createShipment(orderId, address);
  }

  async notifyUser(
    recipientId: string,
    type: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.notificationService.sendNotification(
      recipientId,
      type as NotificationType,
      data,
    );
  }
}
