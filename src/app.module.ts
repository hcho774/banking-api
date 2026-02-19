import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ServiceModules } from './services';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            genReqId: (req) =>
              (req.headers['x-request-id'] as string) || crypto.randomUUID(),
            redact: {
              paths: [
                'req.headers.apikey',
                'req.headers.authorization',
                'req.body.password',
              ],
              remove: true,
            },
            serializers: {
              err: (err) => ({
                id: err.id,
                type: err.type,
                message: err.message,
                stack: err.stack,
              }),
            },
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                  },
                },
            level: isProduction ? 'info' : 'debug',
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000, // ms 단위
        limit: parseInt(process.env.THROTTLE_LIMIT || '30', 10),
      },
    ]),
    ...ServiceModules,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
