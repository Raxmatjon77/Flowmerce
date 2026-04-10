import { ActivityFeedType, ServiceHealthStatus, StockState } from '../enums/dashboard.enums';

export class DashboardSummaryDto {
  totalOrders: number;
  ordersToday: number;
  activeOrders: number;
  totalRevenue: number;
  totalInventoryUnits: number;
  lowStockItems: number;
  pendingNotifications: number;
  unhealthyServices: number;
}

export class DashboardStatusCountDto {
  status: string;
  count: number;
}

export class DashboardTrendPointDto {
  date: string;
  orders: number;
  revenue: number;
}

export class DashboardInventoryAlertDto {
  id: string;
  sku: string;
  productName: string;
  availableQuantity: number;
  totalQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
}

export class DashboardRecentOrderDto {
  id: string;
  customerId: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
}

export class DashboardActivityDto {
  type: ActivityFeedType;
  entityId: string;
  title: string;
  description: string;
  status: string;
  timestamp: Date;
}

export class DashboardHealthServiceDto {
  name: string;
  status: ServiceHealthStatus;
  responseTimeMs: number | null;
  details: string;
  checkedAt: Date;
}

export class DashboardHealthResponseDto {
  overallStatus: ServiceHealthStatus;
  services: DashboardHealthServiceDto[];
  generatedAt: Date;
}

export class DashboardOverviewResponseDto {
  summary: DashboardSummaryDto;
  orderStatusDistribution: DashboardStatusCountDto[];
  paymentStatusDistribution: DashboardStatusCountDto[];
  shipmentStatusDistribution: DashboardStatusCountDto[];
  notificationStatusDistribution: DashboardStatusCountDto[];
  orderTrend: DashboardTrendPointDto[];
  lowStockItems: DashboardInventoryAlertDto[];
  recentOrders: DashboardRecentOrderDto[];
  recentActivity: DashboardActivityDto[];
  health: DashboardHealthResponseDto;
  generatedAt: Date;
}

export class DashboardPaginationDto {
  total: number;
  limit: number;
}

export class DashboardOrderListItemDto {
  id: string;
  customerId: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  shippingAddress: string;
  createdAt: Date;
}

export class DashboardOrderDetailItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  totalPrice: number;
}

export class DashboardPaymentReferenceDto {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export class DashboardShipmentReferenceDto {
  id: string;
  orderId: string;
  status: string;
  trackingNumber: string | null;
  carrierName: string | null;
  estimatedDelivery: Date | null;
  createdAt: Date;
}

export class DashboardOrderDetailDto {
  id: string;
  customerId: string;
  status: string;
  totalAmount: number;
  currency: string;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
  items: DashboardOrderDetailItemDto[];
  payment: DashboardPaymentReferenceDto | null;
  shipment: DashboardShipmentReferenceDto | null;
}

export class DashboardOrderListResponseDto {
  data: DashboardOrderListItemDto[];
  meta: DashboardPaginationDto;
}

export class DashboardInventoryListItemDto {
  id: string;
  sku: string;
  productName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  stockState: StockState;
}

export class DashboardInventoryListResponseDto {
  data: DashboardInventoryListItemDto[];
  meta: DashboardPaginationDto;
}

export class DashboardPaymentListItemDto {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export class DashboardPaymentListResponseDto {
  data: DashboardPaymentListItemDto[];
  meta: DashboardPaginationDto;
}

export class DashboardShipmentListItemDto {
  id: string;
  orderId: string;
  status: string;
  trackingNumber: string | null;
  carrierName: string | null;
  estimatedDelivery: Date | null;
  shippingAddress: string;
  createdAt: Date;
}

export class DashboardShipmentListResponseDto {
  data: DashboardShipmentListItemDto[];
  meta: DashboardPaginationDto;
}

export class DashboardNotificationListItemDto {
  id: string;
  recipientId: string;
  channel: string;
  type: string;
  status: string;
  subject: string;
  body: string;
  failureReason: string | null;
  createdAt: Date;
}

export class DashboardNotificationListResponseDto {
  data: DashboardNotificationListItemDto[];
  meta: DashboardPaginationDto;
}

export class DashboardActivityResponseDto {
  data: DashboardActivityDto[];
  meta: DashboardPaginationDto;
}
