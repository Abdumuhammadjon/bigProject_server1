import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis.service';
import { Param } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('redis/set')
  async setRedis(@Body() data: { key: string; value: string }) {
    await this.redisService.set(data.key, data.value);
    return { message: 'Set successfully', key: data.key, value: data.value };
  }

  @Get('redis/get/:key')
  async getRedis(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    return { key, value };
  }
}