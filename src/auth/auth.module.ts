import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/auth.entity'; // Yo'lni tekshiring
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis'; // Buni qo'shing
import { MailProcessor } from './auth/processors/mail.processor'; // MailProcessor-ni import qiling

@Module({
  imports: [
    // 1. Ma'lumotlar bazasi uchun
    TypeOrmModule.forFeature([User]),

    // 2. Redis ulanishini AuthModule ichiga ham olib kirish
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379', // Redis manzilingiz
    }),

    // 3. BullMQ navbatini ro'yxatdan o'tkazish
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailProcessor],
})
export class AuthModule {}