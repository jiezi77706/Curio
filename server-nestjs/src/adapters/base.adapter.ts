/**
 * 数据源 Adapter 抽象。
 * 每个第三方平台一个实现，集中处理：
 *  - 列表页 → 详情页 URL 抽取
 *  - 详情页 HTML/JSON → 标准化 payload
 *  - 自定义请求头 / cookie / 速率
 */
export interface RawEventPayload {
  external_id: string;
  url: string;
  title: string;
  description?: string;
  cover_image?: string;
  images?: string[];
  starts_at: string;        // ISO8601, 已折算为 UTC
  ends_at?: string;
  timezone?: string;
  is_online?: boolean;
  online_url?: string;
  price_min?: number;
  price_max?: number;
  currency?: string;
  is_free?: boolean;
  category?: string;
  tags?: string[];
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    lng?: number;
    lat?: number;
  };
  organizer?: {
    name?: string;
    slug?: string;
    website?: string;
  };
  raw?: unknown;
}

export interface AdapterContext {
  sourceId: string;
  baseUrl: string;
  authConfig?: Record<string, unknown>;
  rateLimitQps?: number;
}

export abstract class BaseAdapter {
  abstract readonly slug: string;

  constructor(protected readonly ctx: AdapterContext) {}

  /** 列出本次抓取要访问的详情页 URL */
  abstract listUrls(params: Record<string, unknown>): Promise<string[]>;

  /** 解析单条详情页，返回标准化 payload */
  abstract parseDetail(url: string): Promise<RawEventPayload>;
}
