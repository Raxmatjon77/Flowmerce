import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, Role } from '@shared/infrastructure/auth';
import {
  DashboardActivityResponseDto,
  DashboardHealthResponseDto,
  DashboardInventoryListResponseDto,
  DashboardNotificationListResponseDto,
  DashboardOrderDetailDto,
  DashboardOrderListResponseDto,
  DashboardOverviewResponseDto,
  DashboardPaymentListResponseDto,
  DashboardShipmentListResponseDto,
} from '../../application/dtos/dashboard-response.dto';
import { DASHBOARD_USE_CASE_TOKENS } from '../../application/injection-tokens';
import { ListDashboardActivityUseCase } from '../../application/use-cases/list-dashboard-activity/list-dashboard-activity.use-case';
import { GetDashboardHealthUseCase } from '../../application/use-cases/get-dashboard-health/get-dashboard-health.use-case';
import { ListDashboardInventoryUseCase } from '../../application/use-cases/list-dashboard-inventory/list-dashboard-inventory.use-case';
import { ListDashboardNotificationsUseCase } from '../../application/use-cases/list-dashboard-notifications/list-dashboard-notifications.use-case';
import { GetDashboardOrderDetailUseCase } from '../../application/use-cases/get-dashboard-order-detail/get-dashboard-order-detail.use-case';
import { GetDashboardOverviewUseCase } from '../../application/use-cases/get-dashboard-overview/get-dashboard-overview.use-case';
import { ListDashboardOrdersUseCase } from '../../application/use-cases/list-dashboard-orders/list-dashboard-orders.use-case';
import { ListDashboardPaymentsUseCase } from '../../application/use-cases/list-dashboard-payments/list-dashboard-payments.use-case';
import { ListDashboardShipmentsUseCase } from '../../application/use-cases/list-dashboard-shipments/list-dashboard-shipments.use-case';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(
    @Inject(DASHBOARD_USE_CASE_TOKENS.GET_OVERVIEW)
    private readonly getDashboardOverviewUseCase: GetDashboardOverviewUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.LIST_ORDERS)
    private readonly listDashboardOrdersUseCase: ListDashboardOrdersUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.GET_ORDER_DETAIL)
    private readonly getDashboardOrderDetailUseCase: GetDashboardOrderDetailUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.LIST_INVENTORY)
    private readonly listDashboardInventoryUseCase: ListDashboardInventoryUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.LIST_PAYMENTS)
    private readonly listDashboardPaymentsUseCase: ListDashboardPaymentsUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.LIST_SHIPMENTS)
    private readonly listDashboardShipmentsUseCase: ListDashboardShipmentsUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.LIST_NOTIFICATIONS)
    private readonly listDashboardNotificationsUseCase: ListDashboardNotificationsUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.GET_HEALTH)
    private readonly getDashboardHealthUseCase: GetDashboardHealthUseCase,
    @Inject(DASHBOARD_USE_CASE_TOKENS.LIST_ACTIVITY)
    private readonly listDashboardActivityUseCase: ListDashboardActivityUseCase,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview metrics and widgets' })
  async getOverview(
    @Query('limit') limit?: string,
  ): Promise<DashboardOverviewResponseDto> {
    return this.getDashboardOverviewUseCase.execute({
      limit: this.parseNumber(limit, 10),
    });
  }

  @Get('orders')
  @ApiOperation({ summary: 'List dashboard orders' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listOrders(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<DashboardOrderListResponseDto> {
    return this.listDashboardOrdersUseCase.execute({
      q,
      status,
      limit: this.parseNumber(limit, 50),
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get detailed dashboard order view' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderDetail(@Param('id') id: string): Promise<DashboardOrderDetailDto> {
    return this.getDashboardOrderDetailUseCase.execute({ orderId: id });
  }

  @Get('inventory')
  @ApiOperation({ summary: 'List inventory for the dashboard' })
  async listInventory(
    @Query('q') q?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('limit') limit?: string,
  ): Promise<DashboardInventoryListResponseDto> {
    return this.listDashboardInventoryUseCase.execute({
      q,
      lowStockOnly: lowStockOnly === 'true',
      limit: this.parseNumber(limit, 100),
    });
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payments for the dashboard' })
  async listPayments(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<DashboardPaymentListResponseDto> {
    return this.listDashboardPaymentsUseCase.execute({
      q,
      status,
      limit: this.parseNumber(limit, 100),
    });
  }

  @Get('shipments')
  @ApiOperation({ summary: 'List shipments for the dashboard' })
  async listShipments(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<DashboardShipmentListResponseDto> {
    return this.listDashboardShipmentsUseCase.execute({
      q,
      status,
      limit: this.parseNumber(limit, 100),
    });
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List notifications for the dashboard' })
  async listNotifications(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('limit') limit?: string,
  ): Promise<DashboardNotificationListResponseDto> {
    return this.listDashboardNotificationsUseCase.execute({
      q,
      status,
      channel,
      limit: this.parseNumber(limit, 100),
    });
  }

  @Get('health')
  @ApiOperation({ summary: 'Get normalized dashboard infrastructure health' })
  async getHealth(): Promise<DashboardHealthResponseDto> {
    return this.getDashboardHealthUseCase.execute();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent cross-system activity feed' })
  async getActivity(
    @Query('limit') limit?: string,
  ): Promise<DashboardActivityResponseDto> {
    return this.listDashboardActivityUseCase.execute({
      limit: this.parseNumber(limit, 20),
    });
  }

  private parseNumber(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
}
