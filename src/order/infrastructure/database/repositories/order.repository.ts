import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { Order, IOrderRepository, OrderStatus } from '@order/domain';
import { OrderDatabase } from '../tables/order.table';
import { OrderMapper, OrderRow, OrderItemRow } from '../mappers/order.mapper';

export const KYSELY_ORDER_DB = Symbol('KYSELY_ORDER_DB');

@Injectable()
export class KyselyOrderRepository implements IOrderRepository {
  constructor(
    @Inject(KYSELY_ORDER_DB)
    private readonly db: Kysely<OrderDatabase>,
  ) {}

  async save(order: Order): Promise<void> {
    const { orderRow, itemRows } = OrderMapper.toPersistence(order);
    const domainEvents = order.clearDomainEvents();

    await this.db.transaction().execute(async (trx) => {
      // Upsert order
      await trx
        .insertInto('orders')
        .values(orderRow)
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            status: orderRow.status,
            total_amount: orderRow.total_amount,
            currency: orderRow.currency,
            shipping_street: orderRow.shipping_street,
            shipping_city: orderRow.shipping_city,
            shipping_state: orderRow.shipping_state,
            shipping_zip_code: orderRow.shipping_zip_code,
            shipping_country: orderRow.shipping_country,
            updated_at: orderRow.updated_at,
          }),
        )
        .execute();

      // Delete existing items and re-insert
      await trx
        .deleteFrom('order_items')
        .where('order_id', '=', order.id)
        .execute();

      if (itemRows.length > 0) {
        await trx.insertInto('order_items').values(itemRows).execute();
      }

      // Insert outbox events for domain events
      if (domainEvents.length > 0) {
        const outboxRows = domainEvents.map((event) => ({
          id: uuidv4(),
          aggregate_id: event.aggregateId,
          event_type: event.eventType,
          topic: this.resolveTopicForEvent(event.eventType),
          payload: JSON.stringify(event.toPrimitives()),
          created_at: new Date(),
        }));

        await trx.insertInto('outbox_events').values(outboxRows).execute();
      }
    });
  }

  async findById(id: string): Promise<Order | null> {
    const orderRow = await this.db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!orderRow) {
      return null;
    }

    const itemRows = await this.db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', id)
      .execute();

    return OrderMapper.toDomain(
      orderRow as OrderRow,
      itemRows as OrderItemRow[],
    );
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orderRows = await this.db
      .selectFrom('orders')
      .selectAll()
      .where('customer_id', '=', customerId)
      .orderBy('created_at', 'desc')
      .execute();

    const orders: Order[] = [];

    for (const orderRow of orderRows) {
      const itemRows = await this.db
        .selectFrom('order_items')
        .selectAll()
        .where('order_id', '=', orderRow.id)
        .execute();

      orders.push(
        OrderMapper.toDomain(orderRow as OrderRow, itemRows as OrderItemRow[]),
      );
    }

    return orders;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.db
      .updateTable('orders')
      .set({
        status: status.value,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }

  private resolveTopicForEvent(eventType: string): string {
    const topicMap: Record<string, string> = {
      OrderCreated: 'order.events',
      OrderInventoryReserved: 'order.events',
      OrderPaymentProcessed: 'order.events',
      OrderConfirmed: 'order.events',
      OrderCancelled: 'order.events',
      OrderShipped: 'order.events',
    };

    return topicMap[eventType] ?? 'order.events';
  }
}
