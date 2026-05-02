import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlerService } from './crawler.service';
import { CrawlerScheduler } from './crawler.scheduler';
import { CrawlerProcessor } from './crawler.processor';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'crawler' }, { name: 'normalize' }),
    IngestionModule,
  ],
  providers: [CrawlerService, CrawlerScheduler, CrawlerProcessor],
  exports: [CrawlerService],
})
export class CrawlerModule {}
