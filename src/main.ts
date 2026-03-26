import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from '@shared/presentation/filters/domain-exception.filter';
import { LoggingInterceptor } from '@shared/presentation/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);

  logger.log(`Distributed Order Platform running on port ${port}`);
}

bootstrap();
