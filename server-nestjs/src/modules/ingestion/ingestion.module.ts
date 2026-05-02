import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NormalizeProcessor } from './normalize.processor';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'normalize' })],
  providers: [NormalizeProcessor, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
