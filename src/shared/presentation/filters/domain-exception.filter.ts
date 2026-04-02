import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../../domain/domain-error.base';
import { ERROR_CODES } from '../../domain/error-codes';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request?.url;
    const timestamp = new Date().toISOString();

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
        const messages = responseBody.message;

        response.status(status).json({
          statusCode: status,
          code: ERROR_CODES.VALIDATION_ERROR,
          error: 'ValidationError',
          message: Array.isArray(messages) ? 'Validation failed' : messages || 'Validation failed',
          ...(Array.isArray(messages) ? { details: messages } : {}),
          timestamp,
          path,
        });
        return;
      }

      // Other HTTP exceptions
      response.status(status).json({
        statusCode: status,
        code: ERROR_CODES.INTERNAL_ERROR,
        error: exception.name,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as Record<string, unknown>).message ||
              exception.message,
        timestamp,
        path,
      });
      return;
    }

    // Handle domain errors (extends DomainError with code and httpStatus)
    if (exception instanceof DomainError) {
      this.logger.warn(
        `Domain error [${exception.name}]: ${exception.message}`,
      );

      response.status(exception.httpStatus).json({
        statusCode: exception.httpStatus,
        code: exception.code,
        error: exception.name,
        message: exception.message,
        timestamp,
        path,
      });
      return;
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
      code: ERROR_CODES.INTERNAL_ERROR,
      error: 'InternalServerError',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : message,
      timestamp,
      path,
    });
  }
}
