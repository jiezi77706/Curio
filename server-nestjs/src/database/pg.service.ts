import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * 轻量 PG 连接池封装。
 * 业务层既可以直接走 query()，也可以替换成 Prisma / Drizzle。
 */
@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgService.name);
  pool!: Pool;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      connectionString: this.config.get<string>('DATABASE_URL'),
      max: this.config.get<number>('DATABASE_POOL_SIZE') ?? 10,
    });
    this.pool.on('error', (err) =>
      this.logger.error('Unexpected PG pool error', err),
    );
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params as unknown as unknown[]);
  }

  async one<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<T | null> {
    const r = await this.query<T>(text, params);
    return r.rows[0] ?? null;
  }

  async many<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<T[]> {
    const r = await this.query<T>(text, params);
    return r.rows;
  }

  async withTransaction<T>(fn: (client: Pool) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client as unknown as Pool);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
