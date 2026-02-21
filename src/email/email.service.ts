// src/email/email.service.ts

// import { Injectable } from '@nestjs/common';
// import axios from 'axios';

// @Injectable()
// export class EmailService {

//   async sendEmail(email: string) {
//     const response = await axios.post(
//       'http://localhost:3001/send_email',
//       { email }
//     );

//     return response.data;
//   }

// }

import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@Inject('EMAIL_QUEUE') private queue: Queue) {}

  async login(email: string, password: string) {
    // ❌ Bu yerda siz haqiqiy foydalanuvchi tekshirish qo'shasiz
    const userExists = email === 'test@example.com' && password === '123456';
    if (!userExists) return { message: 'Email yoki parol xato' };

    // ✅ Random 6 xonali kod
    const code = Math.floor(100000 + Math.random() * 900000);

    // Jobni BullMQ queue-ga yuborish
    await this.queue.add('sendEmail', { email, code });

    return { message: 'Login muvaffaqiyatli, kod yuborilmoqda...' };
  }
}