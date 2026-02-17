// src/email/email.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {

  constructor(private readonly emailService: EmailService) {}

  @Post()
  async send(@Body('email') email: string) {
    return this.emailService.sendEmail(email);
  }

}