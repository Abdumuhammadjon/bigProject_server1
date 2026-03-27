import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { ConfigService } from '@nestjs/config';

@Processor('email-queue')
export class MailProcessor extends WorkerHost {
  private mailerSend: MailerSend;

  constructor(private configService: ConfigService) {
    super();
    this.mailerSend = new MailerSend({
      apiKey: this.configService.get<string>('MAILERSEND_API_KEY')!,
    });
  }

  async process(job: Job<{ email: string; otp: string }>): Promise<any> {
    const { email, otp } = job.data;
    const sentFrom = new Sender(
      this.configService.get<string>('MAIL_FROM')!,
      this.configService.get<string>('MAIL_NAME')!,
    );
    const recipients = [new Recipient(email, 'Foydalanuvchi')];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Tasdiqlash kodi')
      .setHtml(`<h1>Kodingiz: ${otp}</h1>`)
      .setText(`Kodingiz: ${otp}`);

    await this.mailerSend.email.send(emailParams);
    return { success: true };
  }
}