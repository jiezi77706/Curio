import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PgService } from '../../database/pg.service';

/**
 * 离线召回 + 排序 → 写入 user_recommendations
 *
 * 公式（v0.1，可调参）：
 *   final = 0.35*tag_overlap + 0.20*cf + 0.20*vector_sim
 *         + 0.10*time_decay + 0.10*geo_decay + 0.05*popularity
 */
@Processor('recommendations')
export class RecommendationProcessor extends WorkerHost {
  private readonly logger = new Logger(RecommendationProcessor.name);
  constructor(private readonly db: PgService) {
    super();
  }

  async process(job: Job<{ userId: string }>) {
    const { userId } = job.data;
    this.logger.log(`refresh recommendations for ${userId}`);

    // 1) 召回：标签重叠 + 时间窗 + 地理近邻（这里仅写出标签召回示例）
    const candidates = await this.db.many<{
      event_id: string;
      tag_overlap: number;
      popularity: number;
      starts_at: string;
    }>(
      `WITH user_tags AS (
          SELECT tag_id, weight FROM user_interests WHERE user_id=$1
       )
       SELECT e.id AS event_id,
              COALESCE(SUM(ut.weight),0)::float AS tag_overlap,
              e.popularity_score AS popularity,
              e.starts_at
       FROM events e
       JOIN event_tags et ON et.event_id = e.id
       JOIN user_tags ut ON ut.tag_id = et.tag_id
       WHERE e.status='published' AND e.deleted_at IS NULL
         AND e.starts_at >= now() AND e.starts_at <= now() + INTERVAL '60 days'
       GROUP BY e.id
       ORDER BY tag_overlap DESC
       LIMIT 500`,
      [userId],
    );

    if (!candidates.length) return { written: 0 };

    // 2) 简单线性融合
    const now = Date.now();
    const scored = candidates.map((c) => {
      const days = Math.max(
        0,
        (new Date(c.starts_at).getTime() - now) / (1000 * 60 * 60 * 24),
      );
      const time_decay = Math.exp(-days / 14); // 半衰期约两周
      const score =
        0.55 * Math.tanh(c.tag_overlap) +
        0.10 * time_decay +
        0.05 * (c.popularity ?? 0);
      return { event_id: c.event_id, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 200);

    // 3) 落库
    await this.db.withTransaction(async (cli) => {
      await cli.query(`DELETE FROM user_recommendations WHERE user_id=$1`, [userId]);
      for (const r of top) {
        await cli.query(
          `INSERT INTO user_recommendations (user_id, event_id, score, reason, generated_at)
           VALUES ($1,$2,$3,$4,now())
           ON CONFLICT (user_id,event_id) DO UPDATE
             SET score=EXCLUDED.score, generated_at=EXCLUDED.generated_at`,
          [userId, r.event_id, r.score, { v: 1 }],
        );
      }
    });

    return { written: top.length };
  }
}
