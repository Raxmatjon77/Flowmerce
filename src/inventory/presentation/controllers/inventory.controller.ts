import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Roles, Role, Public } from '@shared/infrastructure/auth';
import { GetInventoryUseCase } from '@inventory/application/use-cases/get-inventory/get-inventory.use-case';
import { ReserveInventoryUseCase } from '@inventory/application/use-cases/reserve-inventory/reserve-inventory.use-case';
import { ReleaseInventoryUseCase } from '@inventory/application/use-cases/release-inventory/release-inventory.use-case';
import { INVENTORY_USE_CASE_TOKENS } from '@inventory/application/injection-tokens';
import { InventoryResponseDto } from '@inventory/application/dtos/inventory-response.dto';
import { ReserveInventoryRequest } from '../dto/reserve-inventory.request';
import { ReleaseInventoryRequest } from '../dto/release-inventory.request';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('api/v1/inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    @Inject(INVENTORY_USE_CASE_TOKENS.GET)
    private readonly getInventoryUseCase: GetInventoryUseCase,
    @Inject(INVENTORY_USE_CASE_TOKENS.RESERVE)
    private readonly reserveInventoryUseCase: ReserveInventoryUseCase,
    @Inject(INVENTORY_USE_CASE_TOKENS.RELEASE)
    private readonly releaseInventoryUseCase: ReleaseInventoryUseCase,
  ) {}

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved', type: InventoryResponseDto })
  async getInventoryById(
    @Param('id') id: string,
  ): Promise<InventoryResponseDto> {
    this.logger.log(`Getting inventory item ${id}`);
    return this.getInventoryUseCase.execute({ sku: id });
  }

  @Get('sku/:sku')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get inventory item by SKU' })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved', type: InventoryResponseDto })
  async getInventoryBySku(
    @Param('sku') sku: string,
  ): Promise<InventoryResponseDto> {
    this.logger.log(`Getting inventory item by SKU ${sku}`);
    return this.getInventoryUseCase.execute({ sku });
  }

  @Post('reserve')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve inventory for an order' })
  @ApiResponse({ status: 200, description: 'Inventory reserved' })
  async reserveInventory(
    @Body() request: ReserveInventoryRequest,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Reserving inventory for order ${request.orderId}: ${request.items.length} item(s)`,
    );

    await this.reserveInventoryUseCase.execute({
      orderId: request.orderId,
      items: request.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
    });

    return { message: `Inventory reserved for order ${request.orderId}` };
  }

  @Post('release')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release inventory reservation' })
  @ApiResponse({ status: 200, description: 'Inventory released' })
  async releaseInventory(
    @Body() request: ReleaseInventoryRequest,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Releasing inventory for order ${request.orderId}: ${request.items.length} item(s)`,
    );

    await this.releaseInventoryUseCase.execute({
      orderId: request.orderId,
      items: request.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
    });

    return { message: `Inventory released for order ${request.orderId}` };
  }
}
