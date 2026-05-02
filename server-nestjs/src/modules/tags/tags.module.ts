import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PgService } from '../../database/pg.service';

@ApiTags('tags')
@Controller('tags')
class TagsController {
  constructor(private readonly db: PgService) {}

  @Get('popular')
  popular(@Query('limit') limit = '30') {
    const n = Number(limit);
    return this.db.many(
      `SELECT t.slug, t.name, count(et.event_id)::int AS cnt
       FROM tags t
       LEFT JOIN event_tags et ON et.tag_id=t.id
       GROUP BY t.id
       ORDER BY cnt DESC
       LIMIT $1`,
      [n],
    );
  }
}

@Module({ controllers: [TagsController] })
export class TagsModule {}
