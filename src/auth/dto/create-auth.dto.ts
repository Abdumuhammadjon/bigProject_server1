import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: "Email noto'g'ri formatda1" })
  @IsNotEmpty({ message: "Email bo'sh bo'lmasligi kerak" })
  email: string;

  @IsString()
  @MinLength(6, { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" })
  password: string;
}