 import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailProducerService {
  private readonly logger = new Logger(MailProducerService.name);

  constructor(
    // JobsModule-da yaratgan "email-queue" navbatini chaqiramiz
    @InjectQueue('email-queue') private readonly mailQueue: Queue,
  ) {}

  async sendOtpEmail(email: string, otp: string) {
    try {
      // Navbatga yangi vazifa (job) qo'shamiz
      const job = await this.mailQueue.add(
        'send-otp-job', // Vazifa nomi
        { email, otp }, // Processor-ga boradigan ma'lumotlar
        {
          attempts: 3, // Agar MailerSend xatosi bo'lsa, 3 marta qayta urinib ko'r
          backoff: {
            type: 'exponential',
            delay: 1000, // Har bir urinish orasidagi vaqtni oshirib bor (1s, 2s, 4s...)
          },
          removeOnComplete: true, // Vazifa bajarilgach Redis-dan o'chirib tashla (joy tejash)
          removeOnFail: { count: 100 }, // Faqat oxirgi 100 ta xatolikni saqlab qo'y
        },
      );

      this.logger.log(`OTP vazifasi navbatga qo'shildi: Job ID ${job.id}`);
    } catch (error) {
      this.logger.error("Navbatga qo'shishda xatolik:", error);
      throw error;
    }
  }
}