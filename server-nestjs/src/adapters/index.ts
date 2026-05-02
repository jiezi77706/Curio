import { BaseAdapter, AdapterContext } from './base.adapter';
import { EventbriteAdapter } from './eventbrite.adapter';

const REGISTRY: Record<string, new (ctx: AdapterContext) => BaseAdapter> = {
  EventbriteAdapter,
  // MeetupAdapter,
  // DamaiAdapter,
  // DoubanAdapter,
};

export function createAdapter(
  className: string,
  ctx: AdapterContext,
): BaseAdapter {
  const Cls = REGISTRY[className];
  if (!Cls) throw new Error(`Unknown adapter: ${className}`);
  return new Cls(ctx);
}
