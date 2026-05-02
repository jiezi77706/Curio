import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PgService } from '../../database/pg.service';
import { TrackDto } from './dto/track.dto';

@Processor('interactions')
export class InteractionsProcessor extends WorkerHost {
  constructor(private readonly db: PgService) {
    super();
  }

  async process(job: Job<TrackDto>) {
    const d = job.data;
    const geo =
      d.geo?.lng !== undefined && d.geo?.lat !== undefined
        ? `ST_MakePoint(${d.geo.lng}, ${d.geo.lat})::geography`
        : 'NULL';

    await this.db.query(
      `INSERT INTO user_event_interactions
         (user_id, anon_id, event_id, action, weight, referrer, geo, created_at)
       VALUES ($1,$2,$3,$4,$5,$6, ${geo}, COALESCE($7, now()))`,
      [
        d.user_id ?? null,
        d.anon_id ?? null,
        d.event_id,
        d.action,
        d.weight ?? 1,
        d.referrer ?? null,
        d.ts ?? null,
      ],
    );
    return { ok: true };
  }
}
