import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/create-auth.dto';
import { VerifyOtpDto } from './dto/update-auth.dto';
import { MailProcessor } from './auth/processors/mail.processor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify')
  async verify(@Body() verifyDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyDto.email, verifyDto.code);
  }

  @Post('resend-otp')
  async resend(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }
}