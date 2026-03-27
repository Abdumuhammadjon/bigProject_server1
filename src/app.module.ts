import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './redis.service';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    // 1. Konfiguratsiyani yuklash (.env fayli uchun)
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Redis Cloud ulanishi (IORedis uchun)
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: `redis://default:${config.get('REDIS_PASSWORD')}@${config.get('REDIS_HOST')}:${config.get('REDIS_PORT')}`,
      }),
    }),

    // 3. BullMQ asosiy sozlamasi (Workerlar ulanishi uchun shart)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          username: config.get('REDIS_USERNAME'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),

    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule {}