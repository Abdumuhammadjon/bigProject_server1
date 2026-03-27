import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Processor('mail-queue') // JobsModule bilan bir xil bo'lishi shart
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private mailerSend: MailerSend;

  constructor(private configService: ConfigService) {
    super();
    this.mailerSend = new MailerSend({
      apiKey: this.configService.get<string>('MAILERSEND_API_KEY')!,
    });
  }

  async process(job: Job<{ email: string; otp: string }>): Promise<any> {
    // Faqat 'send-otp' nomli vazifalar uchun ishlaydi
    if (job.name === 'send-otp') {
      const { email, otp } = job.data;
      this.logger.log(`Email yuborilmoqda: ${email}`);

      try {
        const sentFrom = new Sender(
          this.configService.get<string>('MAIL_FROM')!,
          this.configService.get<string>('MAIL_NAME')!,
        );
        const recipients = [new Recipient(email, 'Foydalanuvchi')];

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject('Tasdiqlash kodi')
          .setHtml(`<strong>Sizning kodingiz: ${otp}</strong>`)
          .setText(`Sizning kodingiz: ${otp}`);

        await this.mailerSend.email.send(emailParams);
        return { status: 'sent' };
      } catch (error) {
        this.logger.error(`Xatolik: ${error.message}`);
        throw error; // BullMQ qayta urinishi (retry) uchun
      }
    }
  }
}