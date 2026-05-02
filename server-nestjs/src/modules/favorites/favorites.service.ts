import { Injectable } from '@nestjs/common';
import { PgService } from '../../database/pg.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly db: PgService) {}

  async add(userId: string, eventId: string) {
    await this.db.withTransaction(async (cli) => {
      await cli.query(
        `INSERT INTO user_favorites (user_id, event_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [userId, eventId],
      );
      await cli.query(
        `UPDATE events SET favorite_count=favorite_count+1 WHERE id=$1`,
        [eventId],
      );
    });
    return { ok: true };
  }

  async remove(userId: string, eventId: string) {
    await this.db.withTransaction(async (cli) => {
      const r = await cli.query(
        `DELETE FROM user_favorites WHERE user_id=$1 AND event_id=$2`,
        [userId, eventId],
      );
      if (r.rowCount) {
        await cli.query(
          `UPDATE events SET favorite_count=GREATEST(favorite_count-1,0) WHERE id=$1`,
          [eventId],
        );
      }
    });
    return { ok: true };
  }

  async list(userId: string, p: PaginationDto) {
    const list = await this.db.many(
      `SELECT e.id, e.slug, e.title, e.starts_at, e.cover_image,
              v.city, f.created_at AS favorited_at
       FROM user_favorites f
       JOIN events e ON e.id=f.event_id
       LEFT JOIN venues v ON v.id=e.venue_id
       WHERE f.user_id=$1 AND e.deleted_at IS NULL
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, p.page_size, p.offset],
    );
    return { list, page: p.page, page_size: p.page_size };
  }
}
