import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Roles, Role } from '@shared/infrastructure/auth';
import { CreateShipmentUseCase } from '@shipping/application/use-cases/create-shipment/create-shipment.use-case';
import { GetShipmentUseCase } from '@shipping/application/use-cases/get-shipment/get-shipment.use-case';
import { UpdateShipmentStatusUseCase } from '@shipping/application/use-cases/update-shipment-status/update-shipment-status.use-case';
import { SHIPPING_USE_CASE_TOKENS } from '@shipping/application/injection-tokens';
import { ShipmentResponseDto } from '@shipping/application/dtos/shipment-response.dto';
import { CreateShipmentRequest } from '../dto/create-shipment.request';
import { UpdateShipmentStatusRequest } from '../dto/update-shipment-status.request';

@ApiTags('Shipments')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SERVICE)
@Controller('api/v1/shipments')
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(
    @Inject(SHIPPING_USE_CASE_TOKENS.CREATE)
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    @Inject(SHIPPING_USE_CASE_TOKENS.GET)
    private readonly getShipmentUseCase: GetShipmentUseCase,
    @Inject(SHIPPING_USE_CASE_TOKENS.UPDATE_STATUS)
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a shipment' })
  @ApiResponse({ status: 201, description: 'Shipment created', type: ShipmentResponseDto })
  async createShipment(
    @Body() request: CreateShipmentRequest,
  ): Promise<ShipmentResponseDto> {
    this.logger.log(`Creating shipment for order ${request.orderId}`);

    return this.createShipmentUseCase.execute({
      orderId: request.orderId,
      address: {
        street: request.address.street,
        city: request.address.city,
        state: request.address.state,
        zipCode: request.address.zipCode,
        country: request.address.country,
      },
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiResponse({ status: 200, description: 'Shipment retrieved', type: ShipmentResponseDto })
  async getShipment(@Param('id') id: string): Promise<ShipmentResponseDto> {
    this.logger.log(`Getting shipment for order ${id}`);
    return this.getShipmentUseCase.execute({ orderId: id });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shipment status' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateShipmentStatus(
    @Param('id') id: string,
    @Body() request: UpdateShipmentStatusRequest,
  ): Promise<{ message: string }> {
    this.logger.log(`Updating shipment ${id} status to ${request.status}`);

    await this.updateShipmentStatusUseCase.execute({
      shipmentId: id,
      status: request.status,
    });

    return { message: `Shipment ${id} status updated to ${request.status}` };
  }
}
