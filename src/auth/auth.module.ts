import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/auth.entity'; 
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsModule } from './auth/processors/jobs.module'; // JOBS_MODULE NI QO'SHDIK
import { MailProcessor } from './auth/processors/mail.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JobsModule, // BU NAVBATNI TANITIB BERADI
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