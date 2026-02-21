import { Provider } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const EmailQueueProvider: Provider = {
  provide: 'EMAIL_QUEUE',
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL');
    let connection: any;

    if (redisUrl) {
      const skipTlsVerify = configService.get<string>('REDIS_SKIP_TLS_VERIFY') === 'true';
      const redisOpts: any = {};
      if (skipTlsVerify) redisOpts.tls = { rejectUnauthorized: false };
      connection = new Redis(redisUrl, redisOpts);
    } else {
      const host = configService.get<string>('REDIS_HOST', '127.0.0.1');
      const port = parseInt(configService.get<string>('REDIS_PORT', '6379'), 10);
      const password = configService.get<string>('REDIS_PASSWORD');
      const useTls = configService.get<string>('REDIS_TLS') === 'true';
      const opts: any = { host, port };
      if (password) opts.password = password;
      if (useTls) opts.tls = { rejectUnauthorized: true };
      connection = new Redis(opts);
    }

    return new Queue('emailQueue', { connection });
  },
  inject: [ConfigService],
};
