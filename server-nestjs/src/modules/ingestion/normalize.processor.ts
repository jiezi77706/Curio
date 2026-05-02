import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IngestionService } from './ingestion.service';

@Processor('normalize', { concurrency: 8 })
export class NormalizeProcessor extends WorkerHost {
  private readonly logger = new Logger(NormalizeProcessor.name);
  constructor(private readonly ingestion: IngestionService) {
    super();
  }

  async process(job: Job<{ rawId: number }>) {
    const r = await this.ingestion.ingest(job.data.rawId);
    if (r.ok) {
      this.logger.log(
        `normalized raw=${job.data.rawId} → event=${r.eventId} ${r.created ? '[NEW]' : '[UPD]'}`,
      );
    } else {
      this.logger.warn(`normalize failed: ${r.reason}`);
    }
    return r;
  }
}
