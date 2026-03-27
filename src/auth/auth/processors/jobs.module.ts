import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          // Cloud Redis uchun TLS shart
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
          retryStrategy: (times) => Math.min(times * 50, 2000),
        },
      }),
      inject: [ConfigService],
    }),
    // Navbat nomi: 'mail-queue'
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  exports: [BullModule],
})
export class JobsModule {}