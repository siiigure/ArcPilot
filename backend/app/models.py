import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import EmailStr
from sqlalchemy import JSON, Column, DateTime
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    posts: list["Post"] = Relationship(back_populates="author")
    replies: list["Reply"] = Relationship(back_populates="author")
    ai_sessions: list["AiSession"] = Relationship(
        back_populates="user", cascade_delete=True
    )


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# --- Tag & Post (M2M via PostTagLink) ---


class PostTagLink(SQLModel, table=True):
    __tablename__ = "post_tag_link"

    post_id: uuid.UUID = Field(foreign_key="post.id", primary_key=True, ondelete="CASCADE")
    tag_id: uuid.UUID = Field(foreign_key="tag.id", primary_key=True, ondelete="CASCADE")


class Tag(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, max_length=50)
    slug: str = Field(unique=True, max_length=50, index=True)
    category: str | None = Field(default=None, max_length=30, index=True)

    posts: list["Post"] = Relationship(back_populates="tags", link_model=PostTagLink)


class Post(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    author_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="user.id",
        nullable=True,
        ondelete="SET NULL",
        index=True,
    )
    title: str = Field(max_length=200)
    body: str = Field()
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    is_deleted: bool = Field(default=False, index=True)
    # GeoJSON 等结构化几何预留；PostGIS Geometry 可后续替换此列
    project_geom: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )

    author: User | None = Relationship(back_populates="posts")
    replies: list["Reply"] = Relationship(
        back_populates="post", cascade_delete=True
    )
    tags: list["Tag"] = Relationship(back_populates="posts", link_model=PostTagLink)


class Reply(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    post_id: uuid.UUID = Field(foreign_key="post.id", ondelete="CASCADE", index=True)
    author_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="user.id",
        nullable=True,
        ondelete="SET NULL",
        index=True,
    )
    body: str = Field()
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    is_deleted: bool = Field(default=False, index=True)

    post: Post = Relationship(back_populates="replies")
    author: User | None = Relationship(back_populates="replies")


# --- AI session & messages ---


class AiSession(SQLModel, table=True):
    __tablename__ = "ai_session"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    title: str = Field(default="", max_length=200)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    environment_preset: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )

    user: User = Relationship(back_populates="ai_sessions")
    messages: list["Message"] = Relationship(
        back_populates="session", cascade_delete=True
    )


class Message(SQLModel, table=True):
    """AI 会话中的消息记录（user / assistant / system）。"""

    __tablename__ = "ai_message"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(
        foreign_key="ai_session.id", ondelete="CASCADE", index=True
    )
    role: str = Field(max_length=20, index=True)
    content: str = Field()
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    instant_override: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )

    session: AiSession = Relationship(back_populates="messages")


# API 通用短响应（避免与 ORM 实体 Message 混淆）
class ResponseMessage(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
