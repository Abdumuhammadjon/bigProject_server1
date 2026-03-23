import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // Rasmda ko'rsatilgan aniq Host:
      host: 'aws-1-eu-central-1.pooler.supabase.com', 
      port: 6543, 
      // Rasmda ko'rsatilgan aniq User:
      username: 'postgres.pzelfekjkolyxyrgmsgb', 
      password: 'Baliq06011991.', // O'zingizning parolingiz
      database: 'postgres',
      entities: [User],
      synchronize: true, 
      logging: true,
      ssl: {
        rejectUnauthorized: false, 
      },
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
export class DatabaseModule {}