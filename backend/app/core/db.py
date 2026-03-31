#数据库引擎（engine）
from sqlmodel import Session, SQLModel, create_engine, select

from app import crud
from app.core.config import settings
from app.core.migrate_plan_b import run_plan_b_migrations
from app.models import User, UserCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # B 方案：不依赖 Alembic，启动时按模型自动建表
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
