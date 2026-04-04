import { 
  Injectable, 
  BadRequestException, 
  UnauthorizedException  // <--- SHU SO'ZNI QO'SHING
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { User } from './entities/auth.entity';
import { RegisterDto, LoginDto   } from './dto/create-auth.dto';

import { JwtService } from '@nestjs/jwt';
import { log } from 'console';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('mail-queue') private mailQueue: Queue,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // 1. Email va parolni mavjudligini tekshirish (Double-check)
    if (!email || !password) {
      throw new BadRequestException('Email va parol yuborilishi shart');
    }

    try {
      const existingUser = await this.userRepo.findOne({ where: { email } });
      if (existingUser) throw new BadRequestException('Email mavjud');

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepo.create({
        email,
        password: hashedPassword,
        isVerified: false,
      });
      await this.userRepo.save(user);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.redis.set(`otp:${email}`, otp, 'EX', 180);

      await this.mailQueue.add('send-otp', { email, otp }, { attempts: 3 });

      return { message: "Kod yuborildi.", email };
    } catch (error) {
      // Agar kutilmagan xato bo'lsa, serverni to'xtatmasdan xato qaytaramiz
      throw new BadRequestException(error.message || 'Roʻyxatdan oʻtishda xatolik yuz berdi');
    }
  }

  async verifyOtp(email: string, code: string) {
    log('verifyOtp called with:', { email, code }); // Debug log  
    if (!email || !code) {
      throw new BadRequestException('Email va kod yuborilishi shart');
    }

    const savedOtp = await this.redis.get(`otp:${email}`);
    if (!savedOtp || savedOtp !== code) {
      throw new BadRequestException('Kod xato yoki muddati o\'tgan');
    }

    await this.userRepo.update({ email }, { isVerified: true });
    await this.redis.del(`otp:${email}`);

    return { message: "Tasdiqlandi!" };
  }

async resendOtp(email: string) {
  if (!email) {
    throw new BadRequestException('Email yuborilishi shart');
  }

  // 1. Foydalanuvchini tekshirish
  const user = await this.userRepo.findOne({ where: { email } });
  if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');

  // 2. Limitni tekshirish (3 minutlik cheklov)
  // 'limit:otp:email' kaliti borligini tekshiramiz
  const isLimited = await this.redis.get(`limit:${email}`);
  if (isLimited) {
    // Qolgan vaqtni hisoblash (ixtiyoriy)
    const ttl = await this.redis.ttl(`limit:${email}`);
    throw new BadRequestException(`Siz yana ${ttl} soniyadan keyin qayta kod so'rashingiz mumkin`);
  }

  // 3. Yangi OTP yaratish
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 4. Redis'ga saqlash
  // OTP kodining o'zi 3 minut amal qiladi
  await this.redis.set(`otp:${email}`, otp, 'EX', 180);
  
  // 5. Qayta yuborishni cheklash (3 minutga bloklash)
  // Bu kalit foydalanuvchiga 3 minut ichida qayta tugmani bosishga yo'l qo'ymaydi
  await this.redis.set(`limit:${email}`, 'true', 'EX', 180);

  // 6. Navbatga qo'shish
  await this.mailQueue.add('send-otp', { email, otp });

  return { 
    message: "Yangi kod yuborildi.", 
    email: email 
  };
}

async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Foydalanuvchini tekshirish
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email yoki parol noto‘g‘ri');
    }

    // 2. Parolni bcrypt orqali tekshirish
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email yoki parol noto‘g‘ri');
    }

    // 3. Tasdiqlanganini tekshirish
    if (!user.isVerified) {
      throw new UnauthorizedException('Hisobingiz tasdiqlanmagan. Emailingizni tekshiring.');
    }

    // 4. JWT Token yaratish
    const payload = { sub: user.id, email: user.email };
    
    return {
      message: "Tizimga kirdingiz",
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      }
    };
  }


}