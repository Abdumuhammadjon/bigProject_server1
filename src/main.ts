import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe-ni sozlash
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da yo'q fieldlarni o'chirib tashlaydi
      forbidNonWhitelisted: true, // DTO'da yo'q field kelsa, 400 xato qaytaradi
      transform: true, // Kelayotgan ma'lumotni DTO klassi tipiga o'tkazadi
    }),
  );

  // Portni .env dan oladi, bo'lmasa 3000-da ishlaydi
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
