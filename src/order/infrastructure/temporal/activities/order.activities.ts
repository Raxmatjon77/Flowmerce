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
import { IOrderRepository, ORDER_REPOSITORY, Order, OrderStatusEnum } from '@order/domain';

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
    await this.mutateOrder(orderId, (order) => order.confirm());
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.mutateOrder(orderId, (order) => order.cancel());
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const statusActions: Record<string, (order: Order) => void> = {
      [OrderStatusEnum.INVENTORY_RESERVED]: (order) => order.reserveInventory(),
      [OrderStatusEnum.PAYMENT_PROCESSED]: (order) => order.processPayment(),
      [OrderStatusEnum.CONFIRMED]: (order) => order.confirm(),
      [OrderStatusEnum.SHIPPED]: (order) => order.ship(),
      [OrderStatusEnum.DELIVERED]: (order) => order.deliver(),
    };

    const action = statusActions[status];
    if (!action) {
      throw new Error(`Unknown status transition: ${status}`);
    }

    await this.mutateOrder(orderId, action);
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

  /**
   * Fetch an order, apply a mutation, and persist.
   * Eliminates repeated fetch-check-mutate-save boilerplate.
   */
  private async mutateOrder(
    orderId: string,
    action: (order: Order) => void,
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    action(order);
    await this.orderRepository.save(order);
  }
}
