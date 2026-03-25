from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel


class LikeTargetType(str, Enum):
    POST = "post"
    REPLY = "reply"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(
        sa_column=Column(
            String(150),
            unique=True,
            index=True,
            nullable=False,
        )
    )
    email: str = Field(
        sa_column=Column(
            String(254),
            unique=True,
            index=True,
            nullable=False,
        )
    )
    password_hash: str = Field(
        sa_column=Column(String(255), nullable=False),
        description="Password hash (应用层负责加密)",
    )
    display_name: Optional[str] = Field(
        default=None,
        sa_column=Column(String(150), nullable=True),
    )
    avatar_url: Optional[str] = Field(
        default=None,
        sa_column=Column(String(500), nullable=True),
    )
    is_active: bool = Field(
        default=True,
        sa_column=Column(Boolean, default=True, index=True, nullable=False),
    )
    is_staff: bool = Field(
        default=False,
        sa_column=Column(Boolean, default=False, nullable=False),
    )
    date_joined: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    last_login: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    profile_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
    )

    # Relationships
    posts: List["Post"] = Relationship(back_populates="author")
    replies: List["Reply"] = Relationship(back_populates="author")
    sessions: List["AiSession"] = Relationship(back_populates="user")
    usage_quotas: List["AiUsageQuota"] = Relationship(back_populates="user")


class InviteStatus(str, Enum):
    PENDING = "pending"
    USED = "used"
    EXPIRED = "expired"


class Invite(SQLModel, table=True):
    __tablename__ = "invites"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(
        sa_column=Column(String(64), unique=True, index=True, nullable=False)
    )
    created_by_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("users.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
    used_by_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("users.id", ondelete="SET NULL"),
            index=True,
            nullable=True,
        ),
    )
    status: InviteStatus = Field(
        sa_column=Column(
            SAEnum(InviteStatus, name="invite_status"),
            index=True,
            nullable=False,
        )
    )
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), index=True, nullable=False)
    )
    max_uses: int = Field(
        default=1,
        sa_column=Column(Integer, nullable=False),
    )
    used_count: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(50), unique=True, nullable=False))
    slug: str = Field(
        sa_column=Column(String(50), unique=True, index=True, nullable=False)
    )
    category: Optional[str] = Field(
        default=None,
        sa_column=Column(String(30), index=True, nullable=True),
    )

    posts: List["Post"] = Relationship(
        back_populates="tags",
        link_model="PostTagLink",  # type: ignore[arg-type]
    )


class PostTagLink(SQLModel, table=True):
    __tablename__ = "post_tags"
    __table_args__ = (
        UniqueConstraint("post_id", "tag_id", name="uq_post_tag_unique"),
    )

    post_id: int = Field(
        primary_key=True,
        sa_column=Column(
            Integer,
            ForeignKey("posts.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    tag_id: int = Field(
        primary_key=True,
        sa_column=Column(
            Integer,
            ForeignKey("tags.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )


class Post(SQLModel, table=True):
    __tablename__ = "posts"

    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("users.id", ondelete="SET NULL"),
            index=True,
            nullable=True,
        ),
    )
    title: str = Field(sa_column=Column(String(200), nullable=False))
    body: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), index=True, nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    is_deleted: bool = Field(
        default=False,
        sa_column=Column(Boolean, default=False, index=True, nullable=False),
    )
    project_geom: Optional[Any] = Field(
        default=None,
        sa_column=Column(
            Geometry(geometry_type="GEOMETRY", srid=4326),
            nullable=True,
        ),
        description="PostGIS Geometry 字段，SRID=4326",
    )

    author: Optional[User] = Relationship(back_populates="posts")
    tags: List[Tag] = Relationship(
        back_populates="posts",
        link_model=PostTagLink,
    )
    replies: List["Reply"] = Relationship(back_populates="post")


class Reply(SQLModel, table=True):
    __tablename__ = "replies"

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("posts.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
    author_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("users.id", ondelete="SET NULL"),
            index=True,
            nullable=True,
        ),
    )
    body: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), index=True, nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    is_deleted: bool = Field(
        default=False,
        sa_column=Column(Boolean, default=False, index=True, nullable=False),
    )

    post: Post = Relationship(back_populates="replies")
    author: Optional[User] = Relationship(back_populates="replies")


class Like(SQLModel, table=True):
    """
    通用点赞表，通过 (target_type, target_id) 代替 Django GenericForeignKey。
    """

    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "target_type",
            "target_id",
            name="unique_like_per_user_target",
        ),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("users.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
    target_type: LikeTargetType = Field(
        sa_column=Column(
            SAEnum(LikeTargetType, name="like_target_type"),
            index=True,
            nullable=False,
        )
    )
    target_id: int = Field(
        sa_column=Column(Integer, index=True, nullable=False)
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class AiSession(SQLModel, table=True):
    __tablename__ = "ai_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("users.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
    title: Optional[str] = Field(
        default=None,
        sa_column=Column(String(200), nullable=True),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), index=True, nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    environment_preset: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
        description="会话级环境预设 metadata",
    )

    user: User = Relationship(back_populates="sessions")
    messages: List["AiMessage"] = Relationship(back_populates="session")


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class AiMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("ai_sessions.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
    role: MessageRole = Field(
        sa_column=Column(
            SAEnum(MessageRole, name="message_role"),
            index=True,
            nullable=False,
        )
    )
    content: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), index=True, nullable=False),
    )
    instant_override: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
        description="即时修正 metadata，覆盖 Session.environment_preset 同名字段",
    )

    session: AiSession = Relationship(back_populates="messages")
    answer: Optional["AiAnswer"] = Relationship(back_populates="message")


class AiAnswer(SQLModel, table=True):
    __tablename__ = "ai_answers"

    id: Optional[int] = Field(default=None, primary_key=True)
    message_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("ai_messages.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        )
    )
    raw_answer: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    validated_answer: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    risk_flags: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
    )
    ragflow_trace_id: Optional[str] = Field(
        default=None,
        sa_column=Column(String(64), index=True, nullable=True),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    message: AiMessage = Relationship(back_populates="answer")
    citations: List["AiCitation"] = Relationship(back_populates="answer")


class SourceKind(str, Enum):
    URL = "url"
    OBJECT_STORAGE = "object_storage"


class AiCitation(SQLModel, table=True):
    __tablename__ = "ai_citations"

    id: Optional[int] = Field(default=None, primary_key=True)
    answer_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("ai_answers.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
    doc_id: str = Field(
        sa_column=Column(String(128), index=True, nullable=False)
    )
    title: str = Field(
        default="",
        sa_column=Column(String(500), nullable=False, server_default=""),
    )
    source_type: str = Field(
        sa_column=Column(String(30), index=True, nullable=False)
    )
    source_kind: SourceKind = Field(
        sa_column=Column(
            SAEnum(SourceKind, name="source_kind"),
            index=True,
            nullable=False,
        )
    )
    url: Optional[str] = Field(
        default=None,
        sa_column=Column(String(1000), nullable=True),
    )
    storage_backend: Optional[str] = Field(
        default=None,
        sa_column=Column(String(32), index=True, nullable=True),
    )
    bucket: Optional[str] = Field(
        default=None,
        sa_column=Column(String(255), nullable=True),
    )
    object_key: Optional[str] = Field(
        default=None,
        sa_column=Column(String(1024), index=True, nullable=True),
    )
    file_name: Optional[str] = Field(
        default=None,
        sa_column=Column(String(255), nullable=True),
    )
    content_type: Optional[str] = Field(
        default=None,
        sa_column=Column(String(128), nullable=True),
    )
    standard_code: Optional[str] = Field(
        default=None,
        sa_column=Column(String(100), index=True, nullable=True),
    )
    region: Optional[str] = Field(
        default=None,
        sa_column=Column(String(32), index=True, nullable=True),
    )
    published_at: Optional[date] = Field(
        default=None,
        sa_column=Column(Date, nullable=True),
    )
    version: Optional[str] = Field(
        default=None,
        sa_column=Column(String(64), nullable=True),
    )
    flags: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
    )

    answer: AiAnswer = Relationship(back_populates="citations")

    __table_args__ = (
        CheckConstraint(
            "(source_kind = 'url' AND url IS NOT NULL) "
            "OR (source_kind = 'object_storage' AND object_key IS NOT NULL)",
            name="ck_ai_citation_source_fields_required",
        ),
    )


class AiUsageQuota(SQLModel, table=True):
    __tablename__ = "ai_usage_quotas"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "date",
            name="unique_user_daily_quota",
        ),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("users.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
    date: date = Field(
        sa_column=Column(Date, index=True, nullable=False),
    )
    request_count: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False),
    )
    token_estimate: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False),
    )

    user: User = Relationship(back_populates="usage_quotas")
