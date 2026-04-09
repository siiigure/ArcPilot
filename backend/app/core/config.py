# 数据库连接配置（SQLALCHEMY_DATABASE_URI）
import secrets
import uuid
import warnings
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


def database_url_to_psycopg(dsn: str) -> str:
    """Render 等托管方常用 postgres:// 或 postgresql://，SQLAlchemy+psycopg3 需 postgresql+psycopg://。"""
    s = dsn.strip()
    if s.startswith("postgres://"):
        s = "postgresql://" + s[len("postgres://") :]
    scheme, sep, rest = s.partition("://")
    if not sep:
        raise ValueError("Invalid DATABASE_URL: missing ://")
    if scheme == "postgresql+psycopg":
        return s
    if scheme == "postgresql":
        return f"postgresql+psycopg://{rest}"
    raise ValueError(
        f"Unsupported DATABASE_URL scheme {scheme!r}; expected postgres or postgresql"
    )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    FRONTEND_HOST: str = "http://localhost:5173"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None
    # 与 Render PostgreSQL 的「Internal Database URL」一致时可只设此项，无需再拆 POSTGRES_*。
    DATABASE_URL: str | None = None
    POSTGRES_SERVER: str = ""
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            return PostgresDsn(database_url_to_psycopg(self.DATABASE_URL))
        return PostgresDsn.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    @model_validator(mode="after")
    def _require_database_config(self) -> Self:
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            return self
        if not self.POSTGRES_SERVER or not self.POSTGRES_USER or not self.POSTGRES_DB:
            raise ValueError(
                "数据库未配置：请设置环境变量 DATABASE_URL（托管平台常用），"
                "或同时设置 POSTGRES_SERVER、POSTGRES_USER、POSTGRES_DB。"
            )
        return self

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    EMAIL_TEST_USER: EmailStr = "test@example.com"
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: str

    # 协作空间资源本机落盘根目录（方案 A 本地模拟；对象存储接入后可改为仅元数据）
    SPACE_ASSETS_LOCAL_ROOT: str = "data/space_assets"

    # 协作空间无状态邀请 HMAC；未设置时回退为与 SECRET_KEY 派生的子密钥（见 collab_invite_token）
    COLLAB_INVITE_HMAC_SECRET: str | None = None

    # 左侧导航话题：逗号分隔的 Tag.public_id（UUID）。非空时 GET /tags/nav 仅返回这些标签（按列表顺序）。
    # 为空时按 post_tags 关联数降序取热门，条数见 TAG_NAV_LIMIT。
    NAV_TAG_PUBLIC_IDS: str = ""
    TAG_NAV_LIMIT: int = 10

    def nav_tag_public_ids(self) -> list[uuid.UUID]:
        raw = self.NAV_TAG_PUBLIC_IDS.strip()
        if not raw:
            return []
        out: list[uuid.UUID] = []
        for part in raw.split(","):
            p = part.strip()
            if p:
                out.append(uuid.UUID(p))
        return out

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        if not (self.DATABASE_URL and self.DATABASE_URL.strip()):
            self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self


settings = Settings()  # type: ignore
