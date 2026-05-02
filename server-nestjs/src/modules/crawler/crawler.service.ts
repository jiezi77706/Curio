import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PgService } from '../../database/pg.service';

export interface CrawlJobRow {
  id: string;
  source_id: string;
  name: string | null;
  cron_expr: string | null;
  seed_urls: unknown;
  params: Record<string, unknown> | null;
  enabled: boolean;
}

@Injectable()
export class CrawlerService {
  constructor(
    private readonly db: PgService,
    @InjectQueue('crawler') private readonly q: Queue,
  ) {}

  async enabledJobs(): Promise<CrawlJobRow[]> {
    return this.db.many<CrawlJobRow>(
      `SELECT * FROM crawl_jobs WHERE enabled=TRUE`,
    );
  }

  async triggerSource(sourceId: string) {
    const jobs = await this.db.many<CrawlJobRow>(
      `SELECT * FROM crawl_jobs WHERE enabled=TRUE AND source_id=$1`,
      [sourceId],
    );
    for (const j of jobs) {
      await this.q.add(
        'crawl',
        { jobId: j.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
      );
    }
    return { triggered: jobs.length };
  }

  async startCrawlRun(jobId: string) {
    const r = await this.db.one<{ id: number }>(
      `INSERT INTO crawl_runs (job_id, status) VALUES ($1,'running') RETURNING id`,
      [jobId],
    );
    return r!.id;
  }

  async finishCrawlRun(
    runId: number,
    status: 'success' | 'failed' | 'partial',
    counters: {
      fetched_count?: number;
      new_count?: number;
      updated_count?: number;
      failed_count?: number;
      error_summary?: string;
    },
  ) {
    await this.db.query(
      `UPDATE crawl_runs SET status=$2, finished_at=now(),
         fetched_count=COALESCE($3,0),
         new_count=COALESCE($4,0),
         updated_count=COALESCE($5,0),
         failed_count=COALESCE($6,0),
         error_summary=$7
       WHERE id=$1`,
      [
        runId,
        status,
        counters.fetched_count,
        counters.new_count,
        counters.updated_count,
        counters.failed_count,
        counters.error_summary ?? null,
      ],
    );
  }
}
