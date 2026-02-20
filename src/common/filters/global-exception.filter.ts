import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Validation errors from ValidationPipe
    const validationErrors =
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'message' in errorResponse
        ? (errorResponse as any).message
        : undefined;

    this.logger.error(
      {
        statusCode,
        path: request.url,
        method: request.method,
        ...(exception instanceof Error && { stack: exception.stack }),
      },
      message,
    );

    response.status(statusCode).json({
      success: false,
      error: {
        code: HttpStatus[statusCode] || 'UNKNOWN_ERROR',
        message,
        statusCode,
        ...(Array.isArray(validationErrors) && {
          details: validationErrors,
        }),
      },
      timestamp: new Date().toISOString(),
      requestId:
        (request as any).id ||
        (request.headers['x-request-id'] as string) ||
        null,
    });
  }
}
