#数据库引擎（engine）
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine, select

from app import crud
from app.core.config import settings
from app.core.migrate_plan_b import run_plan_b_migrations
from app.models import User, UserCreate

database_url = str(settings.SQLALCHEMY_DATABASE_URI)
engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}
if not database_url.startswith("sqlite"):
    engine_kwargs.update(
        {
            "pool_size": 5,
            "max_overflow": 10,
        }
    )

engine = create_engine(database_url, **engine_kwargs)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # B 方案：不依赖 Alembic，启动时按模型自动建表。
    # 与 migrate_plan_b 一致：create_all 也会跑 DDL，若库上有长事务/锁，不设 lock_timeout 会无限等待，
    # 导致 FastAPI 卡在 startup、前端「加载失败」（见 docs/故障复盘日志 2026-03-31）。
    uri = str(settings.SQLALCHEMY_DATABASE_URI)
    if uri.startswith("postgresql"):
        with engine.begin() as conn:
            conn.execute(text("SET LOCAL lock_timeout = '2000ms'"))
            # 表多或 IO 慢时略放宽；主要防「等锁」而非卡死单条语句
            conn.execute(text("SET LOCAL statement_timeout = '90000ms'"))
            SQLModel.metadata.create_all(bind=conn)
    else:
        SQLModel.metadata.create_all(engine)

    run_plan_b_migrations(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)
