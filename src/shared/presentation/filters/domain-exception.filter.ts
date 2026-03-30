import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
  BadRequestException,
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

    // Handle NestJS HttpException (including BadRequestException from validation)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      this.logger.warn(
        `HTTP exception [${status}]: ${JSON.stringify(exceptionResponse)}`,
      );

      // Handle validation errors (BadRequestException with message array)
      if (exception instanceof BadRequestException) {
        const responseBody = exceptionResponse as Record<string, unknown>;
        
        response.status(status).json({
          statusCode: status,
          error: 'ValidationError',
          message: responseBody.message || 'Validation failed',
          details: Array.isArray(responseBody.message) ? responseBody.message : undefined,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Other HTTP exceptions
      response.status(status).json({
        statusCode: status,
        error: exception.name,
        message: typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : (exceptionResponse as Record<string, unknown>).message || exception.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle domain errors
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

    // For unrecognized errors, return 500
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      `Unhandled exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : message,
      timestamp: new Date().toISOString(),
    });
  }
}
