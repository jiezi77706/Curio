-- 初始化必备扩展，docker 启动 postgres 时自动执行
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "postgis";
-- 如果安装了 pgvector image，可启用：
-- CREATE EXTENSION IF NOT EXISTS "vector";
