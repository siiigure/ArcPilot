from __future__ import annotations

import os
from typing import Iterator

from sqlmodel import Session, SQLModel, create_engine

from . import models  # noqa: F401  确保模型在 metadata 中注册


def _build_default_database_url() -> str:
    """
    构建默认的 Postgres/PostGIS 连接串。

    - 默认连接到本地 Docker 中的 PostGIS：
      数据库名: arcpilot_db
      用户名: arcpilot_admin
      端口: 5432
    - 密码通过环境变量 ARCPILOT_DB_PASSWORD 提供（可为空）
    """

    user = os.getenv("ARCPILOT_DB_USER", "arcpilot_admin")
    password = os.getenv("ARCPILOT_DB_PASSWORD", "")
    host = os.getenv("ARCPILOT_DB_HOST", "localhost")
    port = os.getenv("ARCPILOT_DB_PORT", "5432")
    db_name = os.getenv("ARCPILOT_DB_NAME", "arcpilot_db")

    # 允许密码为空
    if password:
        auth_part = f"{user}:{password}"
    else:
        auth_part = user

    return f"postgresql+psycopg2://{auth_part}@{host}:{port}/{db_name}"


DATABASE_URL: str = os.getenv("DATABASE_URL", _build_default_database_url())

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)


def init_db() -> None:
    """
    初始化数据库：创建所有表。

    注意：
    - 需要 Postgres 已启用 PostGIS 扩展（通常在数据库中执行：CREATE EXTENSION IF NOT EXISTS postgis;）
    """

    SQLModel.metadata.create_all(bind=engine)


def get_session() -> Iterator[Session]:
    """
    FastAPI 依赖注入使用：

    ```python
    from fastapi import Depends
    from sqlmodel import Session
    from .database import get_session

    @router.get("/posts")
    def list_posts(session: Session = Depends(get_session)):
        ...
    ```
    """

    with Session(engine) as session:
        yield session

