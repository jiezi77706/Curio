import { Controller, Get, Module, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PgService } from '../../database/pg.service';

@ApiTags('venues')
@Controller('venues')
class VenuesController {
  constructor(private readonly db: PgService) {}

  @Get(':id')
  async detail(@Param('id') id: string) {
    const v = await this.db.one(
      `SELECT id, name, address, city, country, capacity,
              ST_X(geo::geometry) AS lng, ST_Y(geo::geometry) AS lat
       FROM venues WHERE id=$1`,
      [id],
    );
    if (!v) throw new NotFoundException();
    const upcoming = await this.db.many(
      `SELECT id, slug, title, starts_at, cover_image
       FROM events
       WHERE venue_id=$1 AND status='published' AND deleted_at IS NULL
         AND starts_at >= now()
       ORDER BY starts_at ASC
       LIMIT 20`,
      [id],
    );
    return { ...v, upcoming };
  }
}

@Module({ controllers: [VenuesController] })
export class VenuesModule {}
