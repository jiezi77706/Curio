import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { InteractionsProcessor } from './interactions.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'interactions' })],
  controllers: [InteractionsController],
  providers: [InteractionsService, InteractionsProcessor],
})
export class InteractionsModule {}
