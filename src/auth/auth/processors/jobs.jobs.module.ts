import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global() // Bu modulni hamma joyda ishlatish uchun Global qilamiz
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          // Cloud Redis uchun TLS juda muhim (odatda true bo'ladi)
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
          // Ulanish uzilsa, qayta urinish strategiyasi
          retryStrategy: (times) => Math.min(times * 50, 2000),
        },
      }),
      inject: [ConfigService],
    }),
    // "email-queue" nomli navbatni ro'yxatdan o'tkazamiz
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  exports: [BullModule], // Boshqa modullar ham bu navbatni ko'rishi uchun
})
export class JobsModule {}