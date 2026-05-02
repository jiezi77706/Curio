import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PgService } from '../../database/pg.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly db: PgService,
    @InjectQueue('recommendations') private readonly q: Queue,
  ) {}

  /** 在线读：直接读 user_recommendations 缓存表，过滤已结束/已收藏 */
  async forUser(userId: string, limit = 20) {
    const cached = await this.db.many(
      `SELECT e.id, e.slug, e.title, e.starts_at, e.cover_image,
              v.city, c.slug AS category, ur.score, ur.reason
       FROM user_recommendations ur
       JOIN events e ON e.id=ur.event_id
       LEFT JOIN venues v ON v.id=e.venue_id
       LEFT JOIN categories c ON c.id=e.category_id
       WHERE ur.user_id=$1
         AND e.status='published' AND e.deleted_at IS NULL
         AND e.starts_at >= now()
         AND NOT EXISTS (
            SELECT 1 FROM user_favorites f WHERE f.user_id=$1 AND f.event_id=e.id
         )
       ORDER BY ur.score DESC
       LIMIT $2`,
      [userId, limit],
    );
    if (cached.length) return cached;

    // 冷启动 fallback：城市热门
    return this.db.many(
      `SELECT e.id, e.slug, e.title, e.starts_at, e.cover_image,
              v.city, c.slug AS category, e.popularity_score AS score
       FROM events e
       LEFT JOIN venues v ON v.id=e.venue_id
       LEFT JOIN categories c ON c.id=e.category_id
       WHERE e.status='published' AND e.deleted_at IS NULL AND e.starts_at >= now()
       ORDER BY e.popularity_score DESC
       LIMIT $1`,
      [limit],
    );
  }

  /** 触发离线刷新某用户的推荐 */
  enqueueRefresh(userId: string) {
    return this.q.add('refresh-user', { userId }, { attempts: 3 });
  }
}
