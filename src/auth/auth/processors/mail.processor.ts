import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Processor('mail-queue') // Faqat 'mail-queue' dagi vazifalarni kuzatadi
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    super();
    // Nodemailer orqali Gmail (yoki boshqa) SMTP serveriga ulanish
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false, 
      auth: {
        user: this.configService.get('MAIL_USER'), // Email manzilingiz
        pass: this.configService.get('MAIL_PASS'), // Maxsus app password
      },
    });
  }

  // Redis-dan vazifa kelganda ushbu process() metodi avtomatik ishlaydi
  async process(job: Job<{ email: string; otp: string }>): Promise<any> {
    if (job.name === 'send-otp') {
      const { email, otp } = job.data;
      this.logger.log(`Email yuborish boshlandi: ${email}`);

      try {
        await this.transporter.sendMail({
          from: `"${this.configService.get('MAIL_NAME')}" <${this.configService.get('MAIL_USER')}>`,
          to: email,
          subject: 'Tasdiqlash kodi',
          // BU YERDA O'ZGARTIRISH KIRITILDI:
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 15px; text-align: center;">
              <h2 style="color: #333;">Tasdiqlash kodi</h2>
              <p style="color: #666; font-size: 16px;">Xizmatdan foydalanish uchun quyidagi 6 xonali kodni kiriting:</p>
              <div style="background-color: #f4f7ff; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
                  ${otp} 
                </span>
              </div>
              <p style="color: #999; font-size: 12px;">Bu kod 3 daqiqa davomida amal qiladi. Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xatga e'tibor bermang.</p>
            </div>
          `,
        });

        this.logger.log(`Email muvaffaqiyatli yuborildi: ${email}`);
        return { status: 'sent' };
      } catch (error) {
        this.logger.error("SMTP Xatosi:", error.message);
        throw error; 
      }
    }
  }
}