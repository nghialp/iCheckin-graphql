import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cors from '@fastify/cors';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const adapter = new FastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  // Enable validation pipe globally for GraphQL
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on extra properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
      return new BadRequestException(
        errors.map(err => ({
          field: err.property,
          message: Object.values(err.constraints || {}).join(', ')
        }))
      );
    },
    }),
  );

  // Register CORS for frontend access - Security improved
  const corsOrigin = process.env.CORS_ORIGIN;
  const isProduction = process.env.NODE_ENV === 'production';
  
  await app.register(cors, {
    origin: corsOrigin ? corsOrigin.split(',') : !isProduction, // Allow all in dev
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 hours
  });

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
