import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SentryService } from './common/sentry/sentry.service';
import { StructuredLoggerService } from './common/logger/structured-logger.service';
import { ErrorCode } from './common/enums';
import { json, urlencoded, Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  // Helmet HTTP security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : undefined,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hidePoweredBy: true,
    }),
  );

  // Restrict payload limit for image uploads to a safe 10mb
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  app.use(cookieParser());

  // Request Correlation ID Middleware (OBS-01)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const suppliedId = req.get('X-Correlation-ID') || req.get('X-Request-ID');
    const correlationId =
      suppliedId && /^[a-zA-Z0-9._:-]{1,128}$/.test(suppliedId)
        ? suppliedId
        : randomUUID();
    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS — strict whitelist configuration supporting multiple origins, mobile apps and preflight caching
  const configuredOrigins = configService.get<string>('FRONTEND_URL');
  if (isProduction && !configuredOrigins) {
    throw new Error('FRONTEND_URL is required in production');
  }
  const allowedOrigins = (configuredOrigins || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (!isProduction &&
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Client-Platform',
      'x-client-platform',
      'X-Requested-With',
      'X-Correlation-ID',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Correlation-ID'],
    maxAge: 86400, // 24 hours preflight cache
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const flatMessages: string[] = [];
        const formatErrors = (errs: any[]): any[] => {
          return errs.map((err) => {
            if (err.constraints) {
              flatMessages.push(...Object.values(err.constraints).map(String));
            }
            return {
              field: err.property,
              errors: err.constraints ? Object.values(err.constraints) : [],
              children:
                err.children && err.children.length > 0
                  ? formatErrors(err.children)
                  : undefined,
            };
          });
        };
        const structuredDetails = formatErrors(errors);

        return new BadRequestException({
          message:
            flatMessages.length > 0
              ? flatMessages
              : 'Dữ liệu yêu cầu không hợp lệ',
          errorCode: ErrorCode.ERR_VALIDATION,
          details: structuredDetails,
        });
      },
    }),
  );

  // Observability & Structured Logging (BE-07)
  const sentryService = app.get(SentryService);
  const structuredLogger = app.get(StructuredLoggerService);
  const loggingInterceptor = app.get(LoggingInterceptor);
  app.useLogger(structuredLogger);

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter(sentryService));

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor(), loggingInterceptor);

  // Keep the API explorer out of production unless explicitly enabled.
  const enableSwagger =
    !isProduction || configService.get<string>('ENABLE_SWAGGER') === 'true';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Trường Thành Stationery API')
      .setDescription('API documentation for Trường Thành Stationery Store')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User profile and address management')
      .addTag('products', 'Product management')
      .addTag('categories', 'Category management')
      .addTag('cart', 'Shopping cart management')
      .addTag('orders', 'Order management')
      .addTag('payments', 'Payment processing and gateways')
      .addTag('inventory', 'Inventory management')
      .addTag('reviews', 'Product reviews and ratings')
      .addTag('promotions', 'Promotion and voucher management')
      .addTag('notifications', 'Notification management')
      .addTag('reports', 'Reports & analytics')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(
    `🚀 Server running on http://localhost:${port} [${nodeEnv.toUpperCase()}]`,
  );
  if (enableSwagger) {
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}
bootstrap();
