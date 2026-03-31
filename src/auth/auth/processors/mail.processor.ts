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
    // Producer'dagi vazifa nomi bilan mosligini tekshiramiz
    if (job.name === 'send-otp') {
      const { email, otp } = job.data;
      this.logger.log(`Email yuborish boshlandi: ${email}`);

      try {
        // Haqiqiy email yuborish buyrug'i
        await this.transporter.sendMail({
          from: `"${this.configService.get('MAIL_NAME')}" <${this.configService.get('MAIL_USER')}>`,
          to: email,
          subject: 'Tasdiqlash kodi',
          html: `...OTP kodli HTML dizayn...`, // Email ichidagi ko'rinish
        });

        this.logger.log(`Email muvaffaqiyatli yuborildi: ${email}`);
        return { status: 'sent' };
      } catch (error) {
        this.logger.error("SMTP Xatosi:", error.message);
        // Agar bu yerda xato otsangiz (throw), BullMQ 'attempts' bo'yicha qayta urinadi
        throw error; 
      }
    }
  }
}