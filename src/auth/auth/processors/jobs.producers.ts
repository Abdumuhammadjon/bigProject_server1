 import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailProducerService {
  private readonly logger = new Logger(MailProducerService.name);

  constructor(
    // 'mail-queue' navbatiga kirish huquqini olamiz
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) {}

  async sendOtpEmail(email: string, otp: string) {
    try {
      // .add() metodi vazifani Redis-ga joylaydi
      const job = await this.mailQueue.add(
        'send-otp', // Vazifa nomi (Processor'dagi nom bilan bir xil bo'lishi kerak)
        { email, otp }, // Processor'ga yuboriladigan ma'lumotlar
        {
          attempts: 3, // Agar email ketmasa, 3 marta qayta urinib ko'r
          backoff: {
            type: 'exponential', // Har urinish orasidagi vaqtni ko'paytirib boradi
            delay: 1000, // 1-urinish 1s, 2-si 2s, 3-si 4s dan keyin
          },
          removeOnComplete: true, // Muvaffaqiyatli bo'lsa, Redis-dan o'chir (xotira tejash)
          removeOnFail: { count: 100 }, // Xato bo'lsa, oxirgi 100 tasini tarixda qoldir
        },
      );

      this.logger.log(`Vazifa navbatga qo'shildi: ID ${job.id}`);
    } catch (error) {
      this.logger.error("Navbatga qo'shishda xatolik:", error);
      throw error;
    }
  }
}