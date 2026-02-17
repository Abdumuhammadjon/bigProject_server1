// src/email/email.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmailService {

  async sendEmail(email: string) {
    const response = await axios.post(
      'http://localhost:3001/send-email',
      { email }
    );

    return response.data;
  }

}