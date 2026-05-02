# Curio — Event Aggregation Backend

NestJS + PostgreSQL(+PostGIS+pg_trgm+pgvector) + Redis(BullMQ) 实现的活动聚合后端。

## 本地启动

```bash
# 1. 启动数据库 / 缓存
docker compose up -d

# 2. 安装依赖
npm install

# 3. 复制环境变量
cp .env.example .env

# 4. 跑迁移（migrations/*.sql）
npm run migrate

# 5. 启动 API
npm run start:dev

# 6. 启动 Worker（爬虫 / ingestion / 推荐刷新）
npm run start:worker:dev
```

## 目录速览

```
src/
  main.ts              API 入口
  app.module.ts        根模块
  config/              环境变量校验
  common/              过滤器/拦截器/管道/Guard/Decorator/通用 DTO
  database/            PrismaService / PG 连接池
  modules/
    auth users events search recommendations favorites
    interactions categories tags venues organizers
    admin crawler ingestion
  workers/             BullMQ Processor，独立进程入口 main.ts
  adapters/            每个数据源一个解析器，插拔式
migrations/            原生 SQL 迁移
scripts/               一次性 / 运维脚本
```

## 关键约定

- 所有时间字段使用 `TIMESTAMPTZ`，存 UTC，展示时再按 `event.timezone` 转换。
- 事件主键使用 UUID（`gen_random_uuid()`）。
- 跨源去重通过 `events.canonical_hash` + 标题模糊匹配双保险。
- 全文检索 MVP 走 `tsvector + pg_trgm`；进阶接 OpenSearch。
- 推荐 MVP 走"多路召回 + 线性融合"，离线写入 `user_recommendations`。

## 接口文档

启动后访问 `http://localhost:3000/docs` 查看 Swagger。
