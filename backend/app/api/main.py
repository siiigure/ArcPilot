from fastapi import APIRouter

from app.api.routes import login, posts, private, profile, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(profile.router)
api_router.include_router(utils.router)
api_router.include_router(posts.tags_router)
api_router.include_router(posts.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
