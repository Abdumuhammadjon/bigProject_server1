import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global() // Bu modulni hamma joyda ishlatish imkonini beradi (har safar import qilish shart emas)
@Module({
  imports: [
    BullModule.forRootAsync({ // Redis bilan ulanishni asinxron sozlash
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { // Redis server manzillari .env fayldan olinadi
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          // Agar Redis bulutda bo'lsa, xavfsiz ulanish (TLS) ni yoqadi
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
          // Agar ulanish uzilsa, qayta ulanish strategiyasi (kutish vaqti)
          retryStrategy: (times) => Math.min(times * 50, 2000),
        },
      }),
      inject: [ConfigService],
    }),
    // 'mail-queue' nomli navbatni yaratish. Vazifalar shu nom ostida yig'iladi
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  exports: [BullModule], // Boshqa modullar ham bu navbatdan foydalana olishi uchun eksport qilinadi
})
export class JobsModule {}