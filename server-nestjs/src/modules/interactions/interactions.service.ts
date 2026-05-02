import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TrackDto } from './dto/track.dto';

@Injectable()
export class InteractionsService {
  constructor(@InjectQueue('interactions') private readonly q: Queue) {}

  async enqueue(dto: TrackDto) {
    await this.q.add('track', dto, { attempts: 3, removeOnComplete: 1000 });
    return { ok: true };
  }
}
