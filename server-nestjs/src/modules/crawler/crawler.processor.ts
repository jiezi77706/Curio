import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { createHash } from 'crypto';
import { PgService } from '../../database/pg.service';
import { CrawlerService } from './crawler.service';
import { createAdapter } from '../../adapters';

interface CrawlPayload {
  jobId: string;
}

/**
 * 抓取 Worker：
 * 1) 取 crawl_jobs / sources
 * 2) 用对应 Adapter list+detail
 * 3) 写入 raw_events
 * 4) 投递 normalize 队列
 */
@Processor('crawler', { concurrency: 4 })
export class CrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlerProcessor.name);

  constructor(
    private readonly db: PgService,
    private readonly crawler: CrawlerService,
    @InjectQueue('normalize') private readonly normalizeQ: Queue,
  ) {
    super();
  }

  async process(job: Job<CrawlPayload>) {
    const { jobId } = job.data;
    const meta = await this.db.one<{
      source_id: string;
      params: Record<string, unknown>;
      base_url: string;
      adapter_class: string;
      auth_config: Record<string, unknown> | null;
      rate_limit_qps: number;
    }>(
      `SELECT cj.source_id, cj.params,
              s.base_url, s.adapter_class, s.auth_config, s.rate_limit_qps
       FROM crawl_jobs cj JOIN sources s ON s.id=cj.source_id
       WHERE cj.id=$1`,
      [jobId],
    );
    if (!meta) throw new Error(`crawl_job ${jobId} not found`);

    const adapter = createAdapter(meta.adapter_class, {
      sourceId: meta.source_id,
      baseUrl: meta.base_url,
      authConfig: meta.auth_config ?? undefined,
      rateLimitQps: meta.rate_limit_qps,
    });

    const runId = await this.crawler.startCrawlRun(jobId);

    let fetched = 0,
      created = 0,
      updated = 0,
      failed = 0,
      lastError = '';

    try {
      const urls = await adapter.listUrls(meta.params ?? {});
      this.logger.log(`[${meta.adapter_class}] list -> ${urls.length} urls`);

      for (const url of urls) {
        try {
          const payload = await adapter.parseDetail(url);
          const hash = sha256(JSON.stringify(payload));
          const existing = await this.db.one<{ id: number; payload_hash: string }>(
            `SELECT id, payload_hash FROM raw_events
             WHERE source_id=$1 AND external_id=$2`,
            [meta.source_id, payload.external_id],
          );

          if (!existing) {
            const r = await this.db.one<{ id: number }>(
              `INSERT INTO raw_events
                 (source_id, crawl_run_id, external_id, url, payload, payload_hash)
               VALUES ($1,$2,$3,$4,$5,$6)
               RETURNING id`,
              [meta.source_id, runId, payload.external_id, url, payload, hash],
            );
            await this.normalizeQ.add('normalize', { rawId: r!.id });
            created++;
          } else if (existing.payload_hash !== hash) {
            await this.db.query(
              `UPDATE raw_events
                 SET payload=$2, payload_hash=$3, fetched_at=now(), crawl_run_id=$4
               WHERE id=$1`,
              [existing.id, payload, hash, runId],
            );
            await this.normalizeQ.add('normalize', { rawId: existing.id });
            updated++;
          }
          fetched++;

          // 速率控制
          await sleep(1000 / Math.max(meta.rate_limit_qps ?? 0.5, 0.1));
        } catch (e) {
          failed++;
          lastError = (e as Error).message;
          this.logger.warn(`detail fail ${url}: ${lastError}`);
        }
      }

      await this.crawler.finishCrawlRun(
        runId,
        failed === 0 ? 'success' : failed === fetched ? 'failed' : 'partial',
        {
          fetched_count: fetched,
          new_count: created,
          updated_count: updated,
          failed_count: failed,
          error_summary: lastError || undefined,
        },
      );
      return { fetched, created, updated, failed };
    } catch (e) {
      await this.crawler.finishCrawlRun(runId, 'failed', {
        fetched_count: fetched,
        new_count: created,
        updated_count: updated,
        failed_count: failed,
        error_summary: (e as Error).message,
      });
      throw e;
    }
  }
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
