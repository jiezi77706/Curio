import { Injectable, NotFoundException } from '@nestjs/common';
import { PgService } from '../../database/pg.service';
import { ListEventsDto, EventSort, PriceFilter } from './dto/list-events.dto';
import { Paginated } from '../../common/dto/pagination.dto';

export interface EventListItem {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  cover_image: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  is_free: boolean;
  city: string | null;
  venue_name: string | null;
  category: string | null;
  distance_km?: number;
}

@Injectable()
export class EventsService {
  constructor(private readonly db: PgService) {}

  /**
   * 多条件搜索 + 分页。
   * 支持：关键词、城市、分类、tags、地理半径、价格、时间窗、排序。
   */
  async list(q: ListEventsDto): Promise<Paginated<EventListItem>> {
    const params: unknown[] = [];
    const where: string[] = [
      `e.status = 'published'`,
      `e.deleted_at IS NULL`,
      `e.starts_at >= COALESCE($${push(params, q.date_from ?? null)}, now())`,
    ];

    if (q.date_to) {
      where.push(`e.starts_at <= $${push(params, q.date_to)}`);
    }
    if (q.q) {
      const idx = push(params, q.q);
      where.push(
        `(e.search_tsv @@ plainto_tsquery('simple', unaccent($${idx}))
          OR e.title ILIKE '%' || $${idx} || '%')`,
      );
    }
    if (q.category) {
      where.push(`c.slug = $${push(params, q.category)}`);
    }
    if (q.city) {
      where.push(`v.city = $${push(params, q.city)}`);
    }
    if (q.tags?.length) {
      where.push(
        `EXISTS (
            SELECT 1 FROM event_tags et JOIN tags t ON t.id=et.tag_id
            WHERE et.event_id = e.id AND t.slug = ANY($${push(params, q.tags)}::text[])
          )`,
      );
    }
    if (q.price === PriceFilter.Free) {
      where.push(`e.is_free = TRUE`);
    } else if (q.price === PriceFilter.Paid) {
      where.push(`e.is_free = FALSE`);
    }

    let geoSelect = '';
    let geoOrder = '';
    if (q.lng !== undefined && q.lat !== undefined) {
      const lngIdx = push(params, q.lng);
      const latIdx = push(params, q.lat);
      geoSelect = `, ST_Distance(v.geo, ST_MakePoint($${lngIdx},$${latIdx})::geography)/1000 AS distance_km`;
      if (q.radius_km) {
        where.push(
          `ST_DWithin(v.geo, ST_MakePoint($${lngIdx},$${latIdx})::geography, $${push(
            params,
            q.radius_km * 1000,
          )})`,
        );
      }
      if (q.sort === EventSort.Distance) geoOrder = `distance_km ASC,`;
    }

    const orderBy =
      q.sort === EventSort.Popularity
        ? 'e.popularity_score DESC,'
        : q.sort === EventSort.Relevance && q.q
          ? 'ts_rank(e.search_tsv, plainto_tsquery(\'simple\', unaccent($1))) DESC,'
          : geoOrder;

    const limit = q.page_size;
    const offset = q.offset;

    const sql = `
      SELECT e.id, e.slug, e.title, e.starts_at, e.ends_at, e.cover_image,
             e.price_min, e.price_max, e.currency, e.is_free,
             v.city AS city, v.name AS venue_name,
             c.slug AS category
             ${geoSelect}
      FROM events e
      LEFT JOIN venues v ON v.id = e.venue_id
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy} e.starts_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const list = await this.db.many<EventListItem>(sql, params);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM events e
      LEFT JOIN venues v ON v.id = e.venue_id
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE ${where.join(' AND ')}
    `;
    const totalRow = await this.db.one<{ total: number }>(countSql, params);

    return {
      list,
      page: q.page,
      page_size: q.page_size,
      total: totalRow?.total ?? 0,
    };
  }

  async detail(idOrSlug: string) {
    const row = await this.db.one(
      `SELECT e.*, v.name AS venue_name, v.address AS venue_address, v.city,
              c.slug AS category_slug, c.name AS category_name,
              o.name AS organizer_name, o.slug AS organizer_slug,
              (SELECT json_agg(json_build_object(
                  'source', s.slug, 'url', es.external_url, 'is_primary', es.is_primary))
               FROM event_sources es JOIN sources s ON s.id=es.source_id
               WHERE es.event_id=e.id) AS sources,
              (SELECT json_agg(t.slug)
               FROM event_tags et JOIN tags t ON t.id=et.tag_id
               WHERE et.event_id=e.id) AS tags
       FROM events e
       LEFT JOIN venues v ON v.id=e.venue_id
       LEFT JOIN categories c ON c.id=e.category_id
       LEFT JOIN organizers o ON o.id=e.organizer_id
       WHERE (e.id::text=$1 OR e.slug=$1) AND e.deleted_at IS NULL`,
      [idOrSlug],
    );
    if (!row) throw new NotFoundException();
    // 异步累计浏览数；在生产环境改为入队减压
    this.db
      .query(`UPDATE events SET view_count=view_count+1 WHERE id=$1`, [
        (row as { id: string }).id,
      ])
      .catch(() => undefined);
    return row;
  }

  /** "你可能也喜欢"：按标签重叠度 + 时间窗 */
  async related(id: string, limit = 10) {
    return this.db.many(
      `SELECT e2.id, e2.slug, e2.title, e2.starts_at, e2.cover_image,
              v.city, c.slug AS category,
              count(*) AS overlap
       FROM event_tags et1
       JOIN event_tags et2 ON et2.tag_id = et1.tag_id AND et2.event_id <> et1.event_id
       JOIN events e2 ON e2.id = et2.event_id
       LEFT JOIN venues v ON v.id = e2.venue_id
       LEFT JOIN categories c ON c.id = e2.category_id
       WHERE et1.event_id = $1
         AND e2.status='published' AND e2.deleted_at IS NULL
         AND e2.starts_at >= now()
       GROUP BY e2.id, v.city, c.slug
       ORDER BY overlap DESC, e2.starts_at ASC
       LIMIT ${limit}`,
      [id],
    );
  }

  async featured(limit = 12) {
    return this.db.many(
      `SELECT id, slug, title, starts_at, cover_image, popularity_score
       FROM events
       WHERE status='published' AND deleted_at IS NULL AND starts_at >= now()
       ORDER BY popularity_score DESC, starts_at ASC
       LIMIT ${limit}`,
    );
  }
}

function push<T>(arr: T[], v: T): number {
  arr.push(v);
  return arr.length;
}
