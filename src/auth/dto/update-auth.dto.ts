import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: "Email noto'g'ri formatda" })
  @IsNotEmpty({ message: "Email bo'sh bo'lmasligi kerak" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Kod kiritilishi shart" })
  @Length(6, 6, { message: "Kod 6 ta raqamdan iborat bo'lishi kerak" })
  code: string;
}