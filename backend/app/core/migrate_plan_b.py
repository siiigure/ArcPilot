"""
为已有 PostgreSQL 库追加方案 B / 方案 C 预留列。

`create_all` 不会修改已存在的表结构；启动时执行这些 DDL 以兼容旧库。
若遇到锁等待，不应阻塞整个应用启动。
"""

import logging

from sqlalchemy import text

from app.core.config import settings

logger = logging.getLogger(__name__)


def run_plan_b_migrations(engine) -> None:
    if not str(settings.SQLALCHEMY_DATABASE_URI).startswith("postgresql"):
        return

    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(160);",
        "ALTER TABLE tags ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;",
        "ALTER TABLE tags ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
        "ALTER TABLE tags ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
        "ALTER TABLE tags ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;",
        "CREATE INDEX IF NOT EXISTS ix_tags_is_official ON tags (is_official);",
        "CREATE INDEX IF NOT EXISTS ix_tags_created_at ON tags (created_at);",
        "CREATE INDEX IF NOT EXISTS ix_tags_created_by_user_id ON tags (created_by_user_id);",
        "ALTER TABLE collab_spaces ADD COLUMN IF NOT EXISTS invite_version INTEGER NOT NULL DEFAULT 1;",
    ]

    for sql in statements:
        # 每条语句单独事务，避免某条失败后把整批迁移事务打入 aborted 状态。
        with engine.connect() as conn:
            try:
                conn.execute(text("SET lock_timeout = '2000ms';"))
                # ALTER / CREATE INDEX 在数据量大时可能超过 5s；锁等待仍由 lock_timeout 限制
                conn.execute(text("SET statement_timeout = '30000ms';"))
                conn.execute(text(sql))
                conn.commit()
            except Exception as exc:
                # 除 SQLAlchemy 包装异常外，底层 psycopg 也可能直接抛出，需全部捕获以免 startup 卡死
                try:
                    conn.rollback()
                except Exception:
                    pass
                logger.warning(
                    "Skipped migration SQL due to timeout/lock/error: %s; err=%s",
                    sql,
                    exc,
                )
