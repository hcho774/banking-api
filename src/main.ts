import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:'],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
        },
      },
    }),
  );
  app.enableCors({
    credentials: true,
    origin: app.get(ConfigService).get('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 200,
  });
  app.use(compression({ encodings: ['gzip', 'deflate'] }));
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'version',
    defaultVersion: ['1', VERSION_NEUTRAL],
  });
  if (app.get(ConfigService).get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Banking API')
      .setDescription('Production-grade Banking REST API')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'apiKey', in: 'header' }, 'apiKey')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
  app.enableShutdownHooks();

  await app.listen(app.get(ConfigService).getOrThrow('PORT'));
}
bootstrap();
