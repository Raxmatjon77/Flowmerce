import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '@order/domain';
import { IInventoryRepository, INVENTORY_REPOSITORY } from '@inventory/domain';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@payment/domain';
import { IShipmentRepository, SHIPMENT_REPOSITORY } from '@shipping/domain';
import { INotificationRepository, NOTIFICATION_REPOSITORY } from '@notification/domain';
import { Order } from '@order/domain';
import { InventoryItem } from '@inventory/domain';
import { Payment } from '@payment/domain';
import { Shipment } from '@shipping/domain';
import { Notification } from '@notification/domain';
import {
  DashboardInventoryRecord,
  DashboardNotificationRecord,
  DashboardOrderItemRecord,
  DashboardOrderRecord,
  DashboardPaymentRecord,
  DashboardShipmentRecord,
  IDashboardReadPort,
} from '../../application/ports/dashboard-read.port';

@Injectable()
export class KyselyDashboardReadAdapter implements IDashboardReadPort {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(SHIPMENT_REPOSITORY)
    private readonly shipmentRepository: IShipmentRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async getOrders(): Promise<DashboardOrderRecord[]> {
    const orders = await this.orderRepository.findAll();
    return orders.map(this.toOrderRecord);
  }

  async getOrderItems(): Promise<DashboardOrderItemRecord[]> {
    const orders = await this.orderRepository.findAll();
    return orders.flatMap((order) =>
      [...order.items].map((item) => ({
        id: item.id,
        order_id: item.orderId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice.amount,
        currency: item.unitPrice.currency,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    );
  }

  async findOrderById(orderId: string): Promise<DashboardOrderRecord | null> {
    const order = await this.orderRepository.findById(orderId);
    return order ? this.toOrderRecord(order) : null;
  }

  async findOrderItemsByOrderId(orderId: string): Promise<DashboardOrderItemRecord[]> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return [];
    return [...order.items].map((item) => ({
      id: item.id,
      order_id: item.orderId,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice.amount,
      currency: item.unitPrice.currency,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));
  }

  async getInventoryItems(): Promise<DashboardInventoryRecord[]> {
    const items = await this.inventoryRepository.findAll();
    return items.map(this.toInventoryRecord);
  }

  async getPayments(): Promise<DashboardPaymentRecord[]> {
    const payments = await this.paymentRepository.findAll();
    return payments.map(this.toPaymentRecord);
  }

  async findPaymentByOrderId(orderId: string): Promise<DashboardPaymentRecord | null> {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    return payment ? this.toPaymentRecord(payment) : null;
  }

  async getShipments(): Promise<DashboardShipmentRecord[]> {
    const shipments = await this.shipmentRepository.findAll();
    return shipments.map(this.toShipmentRecord);
  }

  async findShipmentByOrderId(orderId: string): Promise<DashboardShipmentRecord | null> {
    const shipment = await this.shipmentRepository.findByOrderId(orderId);
    return shipment ? this.toShipmentRecord(shipment) : null;
  }

  async getNotifications(): Promise<DashboardNotificationRecord[]> {
    const notifications = await this.notificationRepository.findAll();
    return notifications.map(this.toNotificationRecord);
  }

  private toOrderRecord(order: Order): DashboardOrderRecord {
    return {
      id: order.id,
      customer_id: order.customerId,
      status: order.status.value,
      total_amount: order.totalAmount.amount,
      currency: order.totalAmount.currency,
      shipping_street: order.shippingAddress.street,
      shipping_city: order.shippingAddress.city,
      shipping_state: order.shippingAddress.state,
      shipping_zip_code: order.shippingAddress.zipCode,
      shipping_country: order.shippingAddress.country,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  private toInventoryRecord(item: InventoryItem): DashboardInventoryRecord {
    return {
      id: item.id,
      sku: item.sku.value,
      product_name: item.productName,
      total_quantity: item.totalQuantity.value,
      reserved_quantity: item.reservedQuantity.value,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private toPaymentRecord(payment: Payment): DashboardPaymentRecord {
    return {
      id: payment.id,
      order_id: payment.orderId,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status.value,
      method_type: payment.method.type,
      method_last4: payment.method.last4Digits,
      transaction_id: payment.transactionId,
      failure_reason: payment.failureReason,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
    };
  }

  private toShipmentRecord(shipment: Shipment): DashboardShipmentRecord {
    return {
      id: shipment.id,
      order_id: shipment.orderId,
      tracking_number: shipment.trackingNumber?.value ?? null,
      carrier_name: shipment.carrier?.name ?? null,
      status: shipment.status.value,
      shipping_street: shipment.shippingAddress.street,
      shipping_city: shipment.shippingAddress.city,
      shipping_state: shipment.shippingAddress.state,
      shipping_zip: shipment.shippingAddress.zip,
      shipping_country: shipment.shippingAddress.country,
      estimated_delivery: shipment.estimatedDelivery,
      created_at: shipment.createdAt,
      updated_at: shipment.updatedAt,
    };
  }

  private toNotificationRecord(notification: Notification): DashboardNotificationRecord {
    return {
      id: notification.id,
      recipient_id: notification.recipientId,
      channel: notification.channel,
      type: notification.type,
      status: notification.status,
      subject: notification.subject,
      body: notification.body,
      failure_reason: notification.failureReason ?? null,
      created_at: notification.createdAt,
      updated_at: notification.updatedAt,
    };
  }
}
