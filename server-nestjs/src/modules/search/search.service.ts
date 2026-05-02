import { Injectable } from '@nestjs/common';
import { PgService } from '../../database/pg.service';

@Injectable()
export class SearchService {
  constructor(private readonly db: PgService) {}

  /**
   * 输入联想：先 trigram 模糊匹配 events.title，再补热门 tags。
   */
  async suggest(q: string, limit = 10) {
    if (!q || q.trim().length < 1) return { events: [], tags: [] };

    const events = await this.db.many<{ id: string; slug: string; title: string }>(
      `SELECT id, slug, title
       FROM events
       WHERE status='published' AND deleted_at IS NULL
         AND title ILIKE '%' || $1 || '%'
       ORDER BY similarity(title, $1) DESC, starts_at ASC
       LIMIT $2`,
      [q, limit],
    );

    const tags = await this.db.many<{ slug: string; name: string }>(
      `SELECT slug, name
       FROM tags
       WHERE name ILIKE '%' || $1 || '%'
       ORDER BY similarity(name, $1) DESC
       LIMIT $2`,
      [q, Math.min(limit, 5)],
    );

    return { events, tags };
  }
}
