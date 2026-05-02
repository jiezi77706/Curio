import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [CrawlerModule],
  controllers: [AdminController],
})
export class AdminModule {}
