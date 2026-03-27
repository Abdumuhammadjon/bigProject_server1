// auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/auth.entity'; // Entity yo'lingiz

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('mail-queue') private mailQueue: Queue,
  ) {}

  async register(registerDto: any) {
    const { email, password } = registerDto;

    // 1. Email band emasligini tekshirish
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) throw new BadRequestException('Bu email allaqachon mavjud');

    // 2. Parolni hash qilish va foydalanuvchini yaratish (verify: false)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      isVerified: false,
    });
    await this.userRepo.save(user);

    // 3. 6 xonali OTP yaratish va Redis-ga 3 minutga saqlash
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${email}`, otp, 'EX', 180); // 180 sekund = 3 minut

    // 4. BullMQ navbatiga xat yuborish vazifasini qo'shish
    await this.mailQueue.add('send-otp', { email, otp });

    return { message: "Emailingizga tasdiqlash kodi yuborildi. 3 daqiqa vaqtingiz bor." };
  }

  async verifyOtp(email: string, code: string) {
    // 1. Redis-dan kodni olish
    const savedOtp = await this.redis.get(`otp:${email}`);

    if (!savedOtp) {
      throw new BadRequestException('Kod muddati tugagan yoki noto‘g‘ri');
    }

    if (savedOtp !== code) {
      throw new BadRequestException('Kod xato kiritildi');
    }

    // 2. Kod to'g'ri bo'lsa, DB-da isVerified-ni true qilish
    await this.userRepo.update({ email }, { isVerified: true });

    // 3. Ishlatilgan kodni Redis-dan o'chirish
    await this.redis.del(`otp:${email}`);

    return { message: "Akkauntingiz muvaffaqiyatli tasdiqlandi!" };

  }
  // auth.service.ts ichida

async resendOtp(email: string) {
  // 1. Foydalanuvchi borligini tekshiramiz
  const user = await this.userRepo.findOne({ where: { email } });
  if (!user) {
    throw new BadRequestException('Foydalanuvchi topilmadi');
  }

  // 2. Yangi 6 xonali OTP yaratamiz
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Redis-ga yangitdan 3 minutga (180 sekund) saqlaymiz
  // Bu eski kod bo'lsa uni o'chirib, yangisini yozadi (overwrite)
  await this.redis.set(`otp:${email}`, otp, 'EX', 180);

  // 4. BullMQ orqali yana navbatga qo'shamiz
  await this.mailQueue.add('send-otp', { email, otp });

  return { message: "Yangi tasdiqlash kodi yuborildi!" };
}
}

