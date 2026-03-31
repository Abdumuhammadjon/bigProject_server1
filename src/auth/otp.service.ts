 import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global() // Bu modulni loyihadagi barcha boshqa modullar (Auth, User va h.k.) import qilmasdan ishlata olishi uchun
@Module({
  imports: [
    BullModule.forRootAsync({ // Redis ulanishini asinxron (ConfigService orqali) sozlash
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { // Redis serveri ma'lumotlari
          host: config.get('REDIS_HOST'), // Server manzili (localhost yoki IP)
          port: config.get<number>('REDIS_PORT'), // Port (odatda 6379)
          password: config.get('REDIS_PASSWORD'), // Redis paroli
          // TLS — ma'lumotlarni shifrlash (Cloud Redis ishlatilsa 'true' bo'ladi)
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
          // Agar Redis o'chib qolsa, qayta ulanish vaqti (har safar biroz ko'payib boradi)
          retryStrategy: (times) => Math.min(times * 50, 2000),
        },
      }),
      inject: [ConfigService],
    }),
    // 'email-queue' nomli "vazifalar qutisi"ni yaratish
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  exports: [BullModule], // Boshqa modullar ham shu navbatga xabar yoza olishi uchun eksport qilamiz
})
export class JobsModule {}