import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PgService } from '../../database/pg.service';
import { RawEventPayload } from '../../adapters/base.adapter';

@Injectable()
export class IngestionService {
  constructor(private readonly db: PgService) {}

  /** 计算去重指纹：标题归一化 + 起始时间(ISO到分钟) + 场地名归一化 */
  canonicalHash(payload: RawEventPayload): string {
    const normTitle = (payload.title ?? '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const normVenue = (payload.venue?.name ?? '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const t = new Date(payload.starts_at).toISOString().slice(0, 16);
    return createHash('sha256')
      .update(`${normTitle}|${t}|${normVenue}`)
      .digest('hex');
  }

  /** 主入口：把一条 raw_events 标准化、去重，落到 events */
  async ingest(rawId: number) {
    const raw = await this.db.one<{
      id: number;
      source_id: string;
      url: string;
      payload: RawEventPayload;
    }>(
      `SELECT id, source_id, url, payload FROM raw_events WHERE id=$1`,
      [rawId],
    );
    if (!raw) return { ok: false, reason: 'raw not found' };

    const p = raw.payload;
    const hash = this.canonicalHash(p);

    return this.db.withTransaction(async (cli) => {
      // venue
      let venueId: string | null = null;
      if (p.venue?.name) {
        const geoExpr =
          p.venue.lng !== undefined && p.venue.lat !== undefined
            ? `ST_MakePoint(${p.venue.lng}, ${p.venue.lat})::geography`
            : 'NULL';
        const v = await cli.query<{ id: string }>(
          `INSERT INTO venues (name, address, city, country, geo)
           VALUES ($1,$2,$3,$4, ${geoExpr})
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [
            p.venue.name,
            p.venue.address ?? null,
            p.venue.city ?? null,
            p.venue.country ?? null,
          ],
        );
        if (v.rowCount && v.rows[0]) {
          venueId = v.rows[0].id;
        } else {
          const found = await cli.query<{ id: string }>(
            `SELECT id FROM venues WHERE name=$1
             AND coalesce(city,'')=coalesce($2,'') LIMIT 1`,
            [p.venue.name, p.venue.city ?? null],
          );
          venueId = found.rows[0]?.id ?? null;
        }
      }

      // organizer
      let organizerId: string | null = null;
      if (p.organizer?.name) {
        const o = await cli.query<{ id: string }>(
          `INSERT INTO organizers (name, slug, website)
           VALUES ($1, lower(regexp_replace($1,'[^a-zA-Z0-9]+','-','g')), $2)
           ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
           RETURNING id`,
          [p.organizer.name, p.organizer.website ?? null],
        );
        organizerId = o.rows[0]?.id ?? null;
      }

      // category
      let categoryId: string | null = null;
      if (p.category) {
        const c = await cli.query<{ id: string }>(
          `INSERT INTO categories (slug, name)
           VALUES ($1, $1)
           ON CONFLICT (slug) DO UPDATE SET name=categories.name
           RETURNING id`,
          [p.category.toLowerCase()],
        );
        categoryId = c.rows[0]?.id ?? null;
      }

      // upsert event by canonical_hash
      const slug = `${slugify(p.title)}-${hash.slice(0, 8)}`;
      const upserted = await cli.query<{ id: string; created: boolean }>(
        `INSERT INTO events
           (slug, title, description, cover_image, images,
            category_id, organizer_id, venue_id,
            starts_at, ends_at, timezone, is_online, online_url,
            price_min, price_max, currency, is_free,
            primary_source_id, last_seen_at, canonical_hash)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,now(),$19)
         ON CONFLICT (canonical_hash) DO UPDATE SET
           title=EXCLUDED.title,
           description=EXCLUDED.description,
           cover_image=COALESCE(EXCLUDED.cover_image, events.cover_image),
           images=COALESCE(EXCLUDED.images, events.images),
           starts_at=EXCLUDED.starts_at,
           ends_at=EXCLUDED.ends_at,
           price_min=EXCLUDED.price_min,
           price_max=EXCLUDED.price_max,
           is_free=EXCLUDED.is_free,
           last_seen_at=now(),
           updated_at=now()
         RETURNING id, (xmax = 0) AS created`,
        [
          slug,
          p.title,
          p.description ?? null,
          p.cover_image ?? null,
          p.images ? JSON.stringify(p.images.map((u) => ({ url: u }))) : null,
          categoryId,
          organizerId,
          venueId,
          p.starts_at,
          p.ends_at ?? null,
          p.timezone ?? 'Asia/Shanghai',
          p.is_online ?? false,
          p.online_url ?? null,
          p.price_min ?? null,
          p.price_max ?? null,
          p.currency ?? 'CNY',
          p.is_free ?? false,
          raw.source_id,
          hash,
        ],
      );

      const eventId = upserted.rows[0].id;

      // event_sources
      await cli.query(
        `INSERT INTO event_sources (event_id, source_id, external_id, external_url, is_primary, last_seen_at)
         VALUES ($1,$2,$3,$4,TRUE, now())
         ON CONFLICT (source_id, external_id) DO UPDATE
           SET event_id=EXCLUDED.event_id,
               external_url=EXCLUDED.external_url,
               last_seen_at=now()`,
        [eventId, raw.source_id, p.external_id, p.url],
      );

      // tags
      if (p.tags?.length) {
        for (const tag of p.tags) {
          const t = await cli.query<{ id: string }>(
            `INSERT INTO tags (slug, name)
             VALUES (lower(regexp_replace($1,'[^a-zA-Z0-9]+','-','g')), $1)
             ON CONFLICT (slug) DO UPDATE SET name=tags.name
             RETURNING id`,
            [tag],
          );
          await cli.query(
            `INSERT INTO event_tags (event_id, tag_id)
             VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [eventId, t.rows[0].id],
          );
        }
      }

      return { ok: true, eventId, created: upserted.rows[0].created };
    });
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
