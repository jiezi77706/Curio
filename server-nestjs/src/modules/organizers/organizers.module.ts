import {
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PgService } from '../../database/pg.service';

@ApiTags('organizers')
@Controller('organizers')
class OrganizersController {
  constructor(private readonly db: PgService) {}

  @Get(':idOrSlug')
  async detail(@Param('idOrSlug') key: string) {
    const o = await this.db.one(
      `SELECT * FROM organizers WHERE id::text=$1 OR slug=$1`,
      [key],
    );
    if (!o) throw new NotFoundException();
    const upcoming = await this.db.many(
      `SELECT id, slug, title, starts_at, cover_image
       FROM events
       WHERE organizer_id=$1 AND status='published' AND deleted_at IS NULL
         AND starts_at >= now()
       ORDER BY starts_at ASC
       LIMIT 20`,
      [(o as { id: string }).id],
    );
    return { ...o, upcoming };
  }
}

@Module({ controllers: [OrganizersController] })
export class OrganizersModule {}
