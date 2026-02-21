import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailQueueProvider } from './queue.provider';

@Module({
  controllers: [EmailController],
  providers: [EmailService, EmailQueueProvider],
})
export class EmailModule {}


