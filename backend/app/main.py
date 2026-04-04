import asyncio
import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.initial_data import init as init_initial_data

logger = logging.getLogger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)


def _run_db_init_sync() -> None:
    """在线程中执行阻塞式 init（建表、迁移、种子用户）。"""
    init_initial_data()
    logger.info("Database init (create_all + migrations + seed) completed")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    必须在对外处理任何业务请求（含登录）之前完成 DB 初始化。
    若 init 放在后台线程里先 yield，用户可能在表/超管尚未就绪时请求 → 登录 500。

    使用 asyncio.to_thread 把阻塞的 init 放到线程池，避免长时间占用事件循环；
    lifespan 会 await 完成后再 yield，故首包请求前库已就绪。
    建表/迁移已设 lock_timeout（见 db.py、migrate_plan_b.py），降低长时间卡死风险。
    """
    try:
        await asyncio.to_thread(_run_db_init_sync)
    except Exception:
        logger.exception("Database init failed — startup aborted")
        raise
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
