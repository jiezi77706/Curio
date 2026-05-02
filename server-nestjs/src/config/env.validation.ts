import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default('info'),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  AMAP_KEY: z.string().optional(),
  GOOGLE_MAPS_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  OSS_ENDPOINT: z.string().optional(),
  OSS_ACCESS_KEY: z.string().optional(),
  OSS_SECRET_KEY: z.string().optional(),
  OSS_BUCKET: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function envValidation(input: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.errors
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n  ');
    throw new Error(`Invalid environment variables:\n  ${issues}`);
  }
  return parsed.data;
}
