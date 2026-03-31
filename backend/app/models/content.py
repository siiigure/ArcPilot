import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Column, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlmodel import Field, Relationship, SQLModel

from app.models.common import get_datetime_utc

class PostTagLink(SQLModel, table=True):
    __tablename__ = "post_tags"

    post_id: int = Field(foreign_key="posts.id", primary_key=True, ondelete="CASCADE")
    tag_id: int = Field(foreign_key="tags.id", primary_key=True, ondelete="CASCADE")


class Post(SQLModel, table=True):
    __tablename__ = "posts"

    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True),
    )
    author_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        nullable=True,
        ondelete="SET NULL",
        index=True,
    )
    title: str = Field(max_length=200)
    body: str = Field(sa_column=Column(Text, nullable=False))
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
    project_geom: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )

    author: Optional["User"] = Relationship(back_populates="posts")
    replies: list["Reply"] = Relationship(
        back_populates="post", cascade_delete=True
    )
    tags: list["Tag"] = Relationship(
        back_populates="posts", link_model=PostTagLink
    )


class Reply(SQLModel, table=True):
    __tablename__ = "replies"

    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True),
    )
    post_id: int = Field(foreign_key="posts.id", ondelete="CASCADE", index=True)
    author_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        nullable=True,
        ondelete="SET NULL",
        index=True,
    )
    body: str = Field(sa_column=Column(Text, nullable=False))
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

    post: "Post" = Relationship(back_populates="replies")
    author: Optional["User"] = Relationship(back_populates="replies")


class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True),
    )
    name: str = Field(unique=True, max_length=50)
    slug: str = Field(unique=True, max_length=50, index=True)
    category: str | None = Field(default=None, max_length=30, index=True)
    # 方案 C 预留：空间/话题的扩展字段（方案 B 已落库，默认不启用高级能力）
    description: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )
    is_official: bool = Field(default=False, index=True)
    owner_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        nullable=True,
        ondelete="SET NULL",
        index=True,
    )
    created_by_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        nullable=True,
        ondelete="SET NULL",
        index=True,
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )

    posts: list["Post"] = Relationship(
        back_populates="tags", link_model=PostTagLink
    )
