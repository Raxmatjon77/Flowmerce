import {
  Order,
  OrderItem,
  Money,
  OrderStatus,
  ShippingAddress,
} from '@order/domain';
import { OrderTable, OrderItemTable } from '../tables/order.table';

export interface OrderRow {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  currency: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export class OrderMapper {
  static toDomain(row: OrderRow, itemRows: OrderItemRow[]): Order {
    const items = itemRows.map((itemRow) =>
      OrderItem.reconstitute(
        itemRow.id,
        {
          orderId: itemRow.order_id,
          productId: itemRow.product_id,
          productName: itemRow.product_name,
          quantity: itemRow.quantity,
          unitPrice: Money.create(itemRow.unit_price, itemRow.currency),
        },
        itemRow.created_at,
        itemRow.updated_at,
      ),
    );

    return Order.reconstitute(
      row.id,
      {
        customerId: row.customer_id,
        items,
        status: OrderStatus.fromString(row.status),
        shippingAddress: ShippingAddress.create(
          row.shipping_street,
          row.shipping_city,
          row.shipping_state,
          row.shipping_zip_code,
          row.shipping_country,
        ),
        totalAmount: Money.create(row.total_amount, row.currency),
      },
      row.created_at,
      row.updated_at,
    );
  }

  static toPersistence(order: Order): {
    orderRow: Omit<OrderTable, 'created_at' | 'updated_at'> & {
      created_at: Date;
      updated_at: Date;
    };
    itemRows: Array<
      Omit<OrderItemTable, 'created_at' | 'updated_at'> & {
        created_at: Date;
        updated_at: Date;
      }
    >;
  } {
    const orderRow = {
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

    const itemRows = order.items.map((item) => ({
      id: item.id,
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice.amount,
      currency: item.unitPrice.currency,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    return { orderRow, itemRows };
  }
}
