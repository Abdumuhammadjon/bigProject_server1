import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    super();
    // Gmail SMTP sozlamalari
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false, // 587 port uchun har doim false
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async process(job: Job<{ email: string; otp: string }>): Promise<any> {
    if (job.name === 'send-otp') {
      const { email, otp } = job.data;
      this.logger.log(`Gmail orqali yuborilmoqda: ${email}`);

      try {
        await this.transporter.sendMail({
          from: `"${this.configService.get('MAIL_NAME')}" <${this.configService.get('MAIL_USER')}>`,
          to: email,
          subject: 'Tasdiqlash kodi',
          html: `
            <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #333;">Salom!</h2>
              <p>Ro'yxatdan o'tish uchun tasdiqlash kodingiz:</p>
              <div style="background: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">
                ${otp}
              </div>
              <p style="margin-top: 20px; color: #777; font-size: 12px;">Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xatga e'tibor bermang.</p>
            </div>
          `,
        });

        this.logger.log(`Email muvaffaqiyatli yuborildi: ${email}`);
        return { status: 'sent' };
      } catch (error) {
        this.logger.error("GMAIL SMTP XATOSI:", error.message);
        throw error; // BullMQ qayta urinishi (retry) uchun xatoni otamiz
      }
    }
  }
}