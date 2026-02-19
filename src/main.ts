import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));
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
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableShutdownHooks();

  await app.listen(app.get(ConfigService).getOrThrow('PORT'));
}
bootstrap();
