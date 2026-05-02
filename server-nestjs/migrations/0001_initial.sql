-- ============================================================
-- Curio initial schema
-- ============================================================
-- 扩展（也可由 docker-compose 中的 init-extensions.sql 提前装好）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "postgis";
-- pgvector 在没装的环境下注释掉
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- 用户域
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE,
    phone           VARCHAR(32) UNIQUE,
    password_hash   TEXT,
    nickname        VARCHAR(64),
    avatar_url      TEXT,
    city            VARCHAR(64),
    geo             GEOGRAPHY(Point, 4326),
    locale          VARCHAR(10) DEFAULT 'zh-CN',
    role            VARCHAR(16) DEFAULT 'user',
    status          VARCHAR(16) DEFAULT 'active',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_geo ON users USING GIST (geo);

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(32) NOT NULL,
    provider_uid    VARCHAR(128) NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (provider, provider_uid)
);

-- ============================================================
-- 分类 / 标签
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID REFERENCES categories(id),
    slug        VARCHAR(64) UNIQUE NOT NULL,
    name        VARCHAR(64) NOT NULL,
    icon        TEXT,
    sort_order  INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(64) UNIQUE NOT NULL,
    name        VARCHAR(64) NOT NULL,
    -- embedding   VECTOR(384),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_interests (
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    tag_id      UUID REFERENCES tags(id) ON DELETE CASCADE,
    weight      REAL DEFAULT 1.0,
    source      VARCHAR(16) DEFAULT 'explicit',
    updated_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, tag_id)
);

-- ============================================================
-- 主办方 / 场馆
-- ============================================================
CREATE TABLE IF NOT EXISTS organizers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(128) UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url  TEXT,
    website     TEXT,
    verified    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    address     TEXT,
    city        VARCHAR(64),
    country     VARCHAR(64),
    geo         GEOGRAPHY(Point, 4326),
    timezone    VARCHAR(64),
    capacity    INT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_venues_geo  ON venues USING GIST (geo);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues (city);

-- ============================================================
-- 数据源 / 抓取任务 / 原始数据
-- ============================================================
CREATE TABLE IF NOT EXISTS sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(128) NOT NULL,
    base_url        TEXT NOT NULL,
    adapter_class   VARCHAR(128) NOT NULL,
    crawl_strategy  VARCHAR(32),
    rate_limit_qps  REAL DEFAULT 0.5,
    auth_config     JSONB,
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crawl_jobs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id    UUID REFERENCES sources(id) ON DELETE CASCADE,
    name         VARCHAR(128),
    cron_expr    VARCHAR(64),
    seed_urls    JSONB,
    params       JSONB,
    enabled      BOOLEAN DEFAULT TRUE,
    last_run_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crawl_runs (
    id              BIGSERIAL PRIMARY KEY,
    job_id          UUID REFERENCES crawl_jobs(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ DEFAULT now(),
    finished_at     TIMESTAMPTZ,
    status          VARCHAR(16),
    fetched_count   INT DEFAULT 0,
    new_count       INT DEFAULT 0,
    updated_count   INT DEFAULT 0,
    failed_count    INT DEFAULT 0,
    error_summary   TEXT,
    log_url         TEXT
);
CREATE INDEX IF NOT EXISTS idx_crawl_runs_job_started
  ON crawl_runs (job_id, started_at DESC);

CREATE TABLE IF NOT EXISTS raw_events (
    id              BIGSERIAL PRIMARY KEY,
    source_id       UUID REFERENCES sources(id) ON DELETE CASCADE,
    crawl_run_id    BIGINT REFERENCES crawl_runs(id),
    external_id     VARCHAR(255),
    url             TEXT NOT NULL,
    payload         JSONB NOT NULL,
    payload_hash    CHAR(64),
    fetched_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (source_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_raw_events_url_trgm
  ON raw_events USING GIN (url gin_trgm_ops);

-- ============================================================
-- 活动主表
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(160) UNIQUE NOT NULL,
    title               VARCHAR(255) NOT NULL,
    subtitle            VARCHAR(255),
    description         TEXT,
    cover_image         TEXT,
    images              JSONB,

    category_id         UUID REFERENCES categories(id),
    organizer_id        UUID REFERENCES organizers(id),
    venue_id            UUID REFERENCES venues(id),

    starts_at           TIMESTAMPTZ NOT NULL,
    ends_at             TIMESTAMPTZ,
    timezone            VARCHAR(64) DEFAULT 'Asia/Shanghai',
    is_online           BOOLEAN DEFAULT FALSE,
    online_url          TEXT,

    price_min           NUMERIC(10, 2),
    price_max           NUMERIC(10, 2),
    currency            VARCHAR(8) DEFAULT 'CNY',
    is_free             BOOLEAN DEFAULT FALSE,

    language            VARCHAR(16),
    age_restriction     VARCHAR(16),

    status              VARCHAR(16) DEFAULT 'published',
    visibility          VARCHAR(16) DEFAULT 'public',

    view_count          INT DEFAULT 0,
    favorite_count      INT DEFAULT 0,
    quality_score       REAL DEFAULT 0,
    popularity_score    REAL DEFAULT 0,

    search_tsv          TSVECTOR,
    -- embedding           VECTOR(384),

    primary_source_id   UUID REFERENCES sources(id),
    last_seen_at        TIMESTAMPTZ,
    canonical_hash      CHAR(64),

    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at
  ON events (starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_category_time
  ON events (category_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_status_time
  ON events (status, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_search_tsv
  ON events USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm
  ON events USING GIN (title gin_trgm_ops);
CREATE UNIQUE INDEX IF NOT EXISTS uq_events_canonical_hash
  ON events (canonical_hash);
-- 装了 pgvector 后再加：
-- CREATE INDEX idx_events_embedding_hnsw ON events USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION events_tsv_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.title, ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.subtitle, ''))), 'B') ||
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.description, ''))), 'C');
    NEW.updated_at := now();
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_tsv ON events;
CREATE TRIGGER trg_events_tsv
BEFORE INSERT OR UPDATE OF title, subtitle, description ON events
FOR EACH ROW EXECUTE FUNCTION events_tsv_update();

CREATE TABLE IF NOT EXISTS event_tags (
    event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
    tag_id      UUID REFERENCES tags(id)   ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag ON event_tags (tag_id);

CREATE TABLE IF NOT EXISTS event_sources (
    event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
    source_id    UUID REFERENCES sources(id) ON DELETE CASCADE,
    external_id  VARCHAR(255) NOT NULL,
    external_url TEXT NOT NULL,
    is_primary   BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (source_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_event_sources_event ON event_sources (event_id);

-- ============================================================
-- 收藏 / 行为埋点 / 推荐缓存
-- ============================================================
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id     UUID REFERENCES users(id)  ON DELETE CASCADE,
    event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event ON user_favorites (event_id);

-- 按月分区的行为埋点表
CREATE TABLE IF NOT EXISTS user_event_interactions (
    id              BIGSERIAL,
    user_id         UUID,
    anon_id         VARCHAR(64),
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    action          VARCHAR(16) NOT NULL,
    weight          REAL DEFAULT 1.0,
    referrer        TEXT,
    geo             GEOGRAPHY(Point, 4326),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 兜底分区，避免插入失败；正式环境用调度脚本提前创建月分区
CREATE TABLE IF NOT EXISTS user_event_interactions_default
  PARTITION OF user_event_interactions DEFAULT;

CREATE INDEX IF NOT EXISTS idx_uei_user_time
  ON user_event_interactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uei_event_time
  ON user_event_interactions (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uei_action
  ON user_event_interactions (action);

CREATE TABLE IF NOT EXISTS user_recommendations (
    user_id      UUID REFERENCES users(id)  ON DELETE CASCADE,
    event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
    score        REAL NOT NULL,
    reason       JSONB,
    generated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_user_reco_user_score
  ON user_recommendations (user_id, score DESC);

CREATE TABLE IF NOT EXISTS search_logs (
    id                BIGSERIAL PRIMARY KEY,
    user_id           UUID,
    anon_id           VARCHAR(64),
    query             TEXT NOT NULL,
    filters           JSONB,
    result_cnt        INT,
    clicked_event_id  UUID,
    created_at        TIMESTAMPTZ DEFAULT now()
);
