import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from './crawler.service';

@Injectable()
export class CrawlerScheduler {
  private readonly logger = new Logger(CrawlerScheduler.name);
  constructor(private readonly crawler: CrawlerService) {}

  /** 每 10 分钟扫一遍启用中的 crawl_jobs，把符合 cron 时间点的入队 */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async tick() {
    const jobs = await this.crawler.enabledJobs();
    for (const j of jobs) {
      // 这里简化：不解析 cron，每次 tick 都触发一次。
      // 生产请使用 cron-parser 校验 j.cron_expr 与上次执行时间。
      await this.crawler.triggerSource(j.source_id);
    }
    this.logger.log(`tick scanned ${jobs.length} jobs`);
  }
}
