import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, Role } from '@shared/infrastructure/auth';
import { DashboardService } from '../../application/dashboard.service';
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

@ApiTags('Dashboard')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview metrics and widgets' })
  async getOverview(
    @Query('limit') limit?: string,
  ): Promise<DashboardOverviewResponseDto> {
    return this.dashboardService.getOverview(this.parseNumber(limit, 10));
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
    return this.dashboardService.listOrders({
      q,
      status,
      limit: this.parseNumber(limit, 50),
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get detailed dashboard order view' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderDetail(@Param('id') id: string): Promise<DashboardOrderDetailDto> {
    return this.dashboardService.getOrderDetail(id);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'List inventory for the dashboard' })
  async listInventory(
    @Query('q') q?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('limit') limit?: string,
  ): Promise<DashboardInventoryListResponseDto> {
    return this.dashboardService.listInventory({
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
    return this.dashboardService.listPayments({
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
    return this.dashboardService.listShipments({
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
    return this.dashboardService.listNotifications({
      q,
      status,
      channel,
      limit: this.parseNumber(limit, 100),
    });
  }

  @Get('health')
  @ApiOperation({ summary: 'Get normalized dashboard infrastructure health' })
  async getHealth(): Promise<DashboardHealthResponseDto> {
    return this.dashboardService.getHealth();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent cross-system activity feed' })
  async getActivity(
    @Query('limit') limit?: string,
  ): Promise<DashboardActivityResponseDto> {
    return this.dashboardService.listActivity(this.parseNumber(limit, 20));
  }

  private parseNumber(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
}
