import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyReply, FastifyRequest } from 'fastify';

// Generic error messages for client
const GENERIC_ERRORS: Record<string, string> = {
  EMAIL_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  PLACE_NOT_FOUND: 'Place not found',
  POST_NOT_FOUND: 'Post not found',
  COMMENT_NOT_FOUND: 'Comment not found',
  FRIEND_REQUEST_NOT_FOUND: 'Friend request not found',
  ALREADY_FRIENDS: 'Users are already friends',
  CANNOT_SELF_FRIEND: 'Cannot send friend request to yourself',
  NOT_FRIENDS: 'Users are not friends',
  UNAUTHORIZED: 'You do not have permission to perform this action',
  INVALID_TOKEN: 'Invalid or expired token',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // Check if it's a GraphQL request
    let isGraphQL = false;
    try {
      const ctx = GqlExecutionContext.create(host as ExecutionContext);
      const info = ctx.getInfo();
      isGraphQL = info?.fieldName !== undefined;
    } catch {
      // Not a GraphQL context
      isGraphQL = false;
    }

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || 'Error';
      } else {
        message = exceptionResponse as string;
        error = 'Error';
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
      
      // Log the actual error for debugging
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
    }

    // Sanitize error messages - map Vietnamese to English or generic
    const sanitizedMessage = this.sanitizeErrorMessage(message);

    // Prepare response
    const responseBody = {
      statusCode: status,
      error,
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
    };

    if (isGraphQL) {
      // For GraphQL, throw a standardized error
      const graphqlError = new Error(sanitizedMessage);
      (graphqlError as any).extensions = {
        statusCode: status,
        code: error,
      };
      throw graphqlError;
    }

    // For REST (Fastify)
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<FastifyReply>();
    const request = httpContext.getRequest<FastifyRequest>();

    this.logger.warn(
      `${request.method} ${request.url} - ${status}: ${sanitizedMessage}`,
    );

    response.status(status).send(responseBody);
  }

  private sanitizeErrorMessage(message: string | string[]): string {
    // Convert array to string if needed
    const msgString = Array.isArray(message) ? message[0] : message;

    // Check if it's a known error and return generic message
    for (const [key, genericMsg] of Object.entries(GENERIC_ERRORS)) {
      if (msgString.toLowerCase().includes(key.toLowerCase())) {
        return genericMsg;
      }
    }

    // For internal errors, return generic message
    if (msgString.toLowerCase().includes('không thể') ||
        msgString.toLowerCase().includes('lỗi') ||
        msgString.toLowerCase().includes('failed')) {
      return 'An error occurred while processing your request';
    }

    return msgString;
  }
}

