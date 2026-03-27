import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Resend } from 'resend'; // Resend-ni import qilamiz
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    super();
    // Resend-ni sozlaymiz
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async process(job: Job<{ email: string; otp: string }>): Promise<any> {
    if (job.name === 'send-otp') {
      const { email, otp } = job.data;
      this.logger.log(`Email yuborilmoqda (Resend): ${email}`);

      try {
        const { data, error } = await this.resend.emails.send({
          from: `${this.configService.get('MAIL_NAME')} <${this.configService.get('MAIL_FROM')}>`,
          to: [email],
          subject: 'Tasdiqlash kodi',
          html: `<strong>Sizning tasdiqlash kodingiz: ${otp}</strong>`,
        });

        if (error) {
          this.logger.error("RESEND XATOSI:", error);
          throw new Error(error.message);
        }

        this.logger.log(`Email muvaffaqiyatli ketdi! ID: ${data?.id}`);
        return { status: 'sent', id: data?.id };
      } catch (error) {
        this.logger.error("YUBORISHDA XATOLIK:", error.message);
        throw error;
      }
    }
  }
}