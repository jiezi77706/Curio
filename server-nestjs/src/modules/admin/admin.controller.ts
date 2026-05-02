import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { PgService } from '../../database/pg.service';
import { CrawlerService } from '../crawler/crawler.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'ops')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly db: PgService,
    private readonly crawler: CrawlerService,
  ) {}

  @Get('sources')
  listSources() {
    return this.db.many(
      `SELECT id, slug, name, base_url, enabled, rate_limit_qps
       FROM sources ORDER BY name`,
    );
  }

  @Post('sources/:id/crawl')
  triggerCrawl(@Param('id') sourceId: string) {
    return this.crawler.triggerSource(sourceId);
  }

  @Get('crawl/runs')
  recentRuns() {
    return this.db.many(
      `SELECT cr.*, cj.name AS job_name, s.slug AS source_slug
       FROM crawl_runs cr
       JOIN crawl_jobs cj ON cj.id = cr.job_id
       JOIN sources s ON s.id = cj.source_id
       ORDER BY cr.started_at DESC
       LIMIT 100`,
    );
  }

  @Post('events/:id/hide')
  hide(@Param('id') id: string) {
    return this.db.query(
      `UPDATE events SET status='hidden', updated_at=now() WHERE id=$1`,
      [id],
    );
  }

  @Post('events/:id/merge')
  async merge(
    @Param('id') survivorId: string,
    @Body() body: { duplicate_id: string },
  ) {
    const dup = body.duplicate_id;
    return this.db.withTransaction(async (cli) => {
      // 把 dup 的所有外链挂到 survivor
      await cli.query(
        `UPDATE event_sources SET event_id=$1 WHERE event_id=$2`,
        [survivorId, dup],
      );
      await cli.query(
        `UPDATE user_favorites SET event_id=$1 WHERE event_id=$2 ON CONFLICT DO NOTHING`,
        [survivorId, dup],
      );
      await cli.query(`DELETE FROM events WHERE id=$1`, [dup]);
      return { ok: true };
    });
  }
}
