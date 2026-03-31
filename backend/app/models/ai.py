import uuid
from datetime import datetime
from sqlalchemy import JSON, Column, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlmodel import Field, Relationship, SQLModel

from app.models.common import get_datetime_utc


class AiSession(SQLModel, table=True):
    __tablename__ = "ai_sessions"

    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True),
    )
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
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
    environment_preset: dict[str, object] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )

    user: "User" = Relationship(back_populates="ai_sessions")
    messages: list["Message"] = Relationship(
        back_populates="session", cascade_delete=True
    )


class Message(SQLModel, table=True):
    __tablename__ = "ai_messages"

    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True),
    )
    session_id: int = Field(
        foreign_key="ai_sessions.id", ondelete="CASCADE", index=True
    )
    sequence_number: int | None = Field(
        default=None, sa_column=Column(Integer, nullable=True)
    )
    role: str = Field(max_length=20, index=True)
    content: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    instant_override: dict[str, object] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )

    session: "AiSession" = Relationship(back_populates="messages")
