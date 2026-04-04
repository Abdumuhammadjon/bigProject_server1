import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/auth.entity'; 
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsModule } from './auth/processors/jobs.module';
import { MailProcessor } from './auth/processors/mail.processor';
import { JwtModule } from '@nestjs/jwt'; // <--- Qo'shildi

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JobsModule,
    // Login ishlashi uchun JWT ni sozlash
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'secretKey', 
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: `redis://:${config.get('REDIS_PASSWORD')}@${config.get('REDIS_HOST')}:${config.get('REDIS_PORT')}`,
        options: {
          tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailProcessor],
})
export class AuthModule {}