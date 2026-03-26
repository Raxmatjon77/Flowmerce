import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// Domain error name -> HTTP status mapping
const ERROR_STATUS_MAP: Record<string, HttpStatus> = {
  // 404 Not Found
  OrderNotFoundError: HttpStatus.NOT_FOUND,
  PaymentNotFoundError: HttpStatus.NOT_FOUND,
  InventoryNotFoundError: HttpStatus.NOT_FOUND,
  ShipmentNotFoundError: HttpStatus.NOT_FOUND,
  NotificationNotFoundError: HttpStatus.NOT_FOUND,

  // 400 Bad Request
  InvalidOrderError: HttpStatus.BAD_REQUEST,
  InvalidReservationError: HttpStatus.BAD_REQUEST,

  // 409 Conflict
  InvalidOrderTransitionError: HttpStatus.CONFLICT,
  InvalidPaymentTransitionError: HttpStatus.CONFLICT,
  InvalidShipmentTransitionError: HttpStatus.CONFLICT,
  InsufficientInventoryError: HttpStatus.CONFLICT,
  NotificationAlreadySentError: HttpStatus.CONFLICT,
};

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Error) {
      const errorName = exception.name || exception.constructor.name;
      const httpStatus = ERROR_STATUS_MAP[errorName];

      if (httpStatus) {
        this.logger.warn(
          `Domain error [${errorName}]: ${exception.message}`,
        );

        response.status(httpStatus).json({
          statusCode: httpStatus,
          error: errorName,
          message: exception.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // For unrecognized errors, let NestJS default handling take over
    // by returning 500
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(`Unhandled exception: ${message}`, exception instanceof Error ? exception.stack : undefined);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
}
