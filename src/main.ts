import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from '@shared/presentation/filters/domain-exception.filter';
import { LoggingInterceptor } from '@shared/presentation/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const allowedOrigins = config.get<string[]>('app.corsOrigins')!;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Flowmerce API')
    .setDescription('Distributed Order & Fulfillment Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('orders', 'Order management')
    .addTag('payments', 'Payment processing')
    .addTag('inventory', 'Inventory management')
    .addTag('shipping', 'Shipping & fulfillment')
    .addTag('notifications', 'Notification services')
    .addTag('dashboard', 'Dashboard analytics')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('app.port')!;
  await app.listen(port);

  logger.log(`Distributed Order Platform running on port ${port}`);
  logger.log(`Swagger UI available at http://localhost:${port}/api/docs`);
}

bootstrap();
