import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { RecommendationProcessor } from './recommendations.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'recommendations' })],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RecommendationProcessor],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
