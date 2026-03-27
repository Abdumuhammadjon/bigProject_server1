import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { User } from './entities/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('mail-queue') private mailQueue: Queue,
  ) {}

  async register(registerDto: any) {
    const { email, password } = registerDto;

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) throw new BadRequestException('Email mavjud');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      isVerified: false,
    });
    await this.userRepo.save(user);

    // OTP yaratish va Redis-ga (3 min)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${email}`, otp, 'EX', 180);

    // Navbatga qo'shish (Vazifa nomi: 'send-otp')
    await this.mailQueue.add('send-otp', { email, otp }, { attempts: 3 });

    return { message: "Kod yuborildi." };
  }

  async verifyOtp(email: string, code: string) {
    const savedOtp = await this.redis.get(`otp:${email}`);
    if (!savedOtp || savedOtp !== code) {
      throw new BadRequestException('Kod xato yoki muddati o\'tgan');
    }

    await this.userRepo.update({ email }, { isVerified: true });
    await this.redis.del(`otp:${email}`);

    return { message: "Tasdiqlandi!" };
  }

  async resendOtp(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Foydalanuvchi yo\'q');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${email}`, otp, 'EX', 180);
    await this.mailQueue.add('send-otp', { email, otp });

    return { message: "Yangi kod yuborildi." };
  }
}