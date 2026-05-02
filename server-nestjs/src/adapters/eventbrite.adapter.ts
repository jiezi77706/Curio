import { BaseAdapter, RawEventPayload } from './base.adapter';
import * as cheerio from 'cheerio';

/**
 * Eventbrite 适配器骨架。仅作为示例 —— 真实接入请遵守目标方 ToS 与 robots.txt，
 * 优先用其官方 API；这里展示最常见的 list+detail HTML 解析路径。
 */
export class EventbriteAdapter extends BaseAdapter {
  readonly slug = 'eventbrite';

  async listUrls(params: { city?: string; category?: string }): Promise<string[]> {
    const url = `${this.ctx.baseUrl}/d/${encodeURIComponent(
      params.city ?? 'online',
    )}/${encodeURIComponent(params.category ?? 'all-events')}/`;
    const html = await this.fetch(url);
    const $ = cheerio.load(html);
    const urls: string[] = [];
    $('a[href*="/e/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) urls.push(href.split('?')[0]);
    });
    return [...new Set(urls)];
  }

  async parseDetail(url: string): Promise<RawEventPayload> {
    const html = await this.fetch(url);
    const $ = cheerio.load(html);

    const ld = $('script[type="application/ld+json"]')
      .map((_, el) => $(el).contents().text())
      .get()
      .map(safeParse)
      .find((j) => j && (j['@type'] === 'Event' || j.type === 'Event'));

    if (!ld) {
      throw new Error(`No JSON-LD Event found in ${url}`);
    }

    const externalId = url.match(/-(\d+)\/?$/)?.[1] ?? url;

    return {
      external_id: externalId,
      url,
      title: ld.name as string,
      description: stripHtml(ld.description ?? ''),
      cover_image: pickImage(ld.image),
      starts_at: new Date(ld.startDate).toISOString(),
      ends_at: ld.endDate ? new Date(ld.endDate).toISOString() : undefined,
      timezone: ld.timezone,
      is_online: ld.eventAttendanceMode?.includes('Online'),
      online_url: ld.location?.url,
      currency: ld.offers?.priceCurrency,
      price_min: ld.offers?.lowPrice ? Number(ld.offers.lowPrice) : undefined,
      price_max: ld.offers?.highPrice ? Number(ld.offers.highPrice) : undefined,
      is_free: ld.isAccessibleForFree === true,
      venue: ld.location
        ? {
            name: ld.location.name,
            address:
              typeof ld.location.address === 'string'
                ? ld.location.address
                : ld.location.address?.streetAddress,
            city: ld.location.address?.addressLocality,
            country: ld.location.address?.addressCountry,
            lng: ld.location.geo?.longitude,
            lat: ld.location.geo?.latitude,
          }
        : undefined,
      organizer: ld.organizer
        ? { name: ld.organizer.name, website: ld.organizer.url }
        : undefined,
      raw: ld,
    };
  }

  private async fetch(url: string): Promise<string> {
    const r = await fetch(url, {
      headers: {
        'user-agent':
          'CurioBot/0.1 (+https://example.com/curio-bot; respects robots.txt)',
        'accept-language': 'en-US,en;q=0.9',
        ...((this.ctx.authConfig?.headers as Record<string, string>) ?? {}),
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.text();
  }
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function pickImage(img: unknown): string | undefined {
  if (!img) return undefined;
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) return typeof img[0] === 'string' ? img[0] : undefined;
  return undefined;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}
