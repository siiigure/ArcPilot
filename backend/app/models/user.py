import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlalchemy import JSON, Column, DateTime, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlmodel import Field, Relationship, SQLModel

from app.models.common import get_datetime_utc
from app.models.content import Post, Reply


class UserBase(SQLModel):
    email: EmailStr = Field(max_length=255, index=True)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=150, index=True)
    phone_number: str | None = Field(default=None, max_length=255, index=True)
    display_name: str | None = Field(default=None, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=500)
    bio: str | None = Field(default=None, max_length=160)
    profile_metadata: dict[str, object] = Field(
        default_factory=dict, sa_column=Column(JSON, nullable=False)
    )


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=150)
    phone_number: str | None = Field(default=None, max_length=255)
    display_name: str | None = Field(default=None, max_length=150)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=150)
    phone_number: str | None = Field(default=None, max_length=255)
    display_name: str | None = Field(default=None, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=500)
    bio: str | None = Field(default=None, max_length=160)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True),
    )
    hashed_password: str = Field(sa_column=Column("password", String(255), nullable=True))
    date_joined: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    posts: list[Post] = Relationship(back_populates="author")
    replies: list[Reply] = Relationship(back_populates="author")
    ai_sessions: list["AiSession"] = Relationship(
        back_populates="user", cascade_delete=True
    )


class UserFollow(SQLModel, table=True):
    """
    关注关系：follower 关注 following（多对多自关联 users）。
    """

    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_user_follow_pair"),
    )

    id: int | None = Field(default=None, primary_key=True)
    follower_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    following_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )


class UserPublic(UserBase):
    id: uuid.UUID
    date_joined: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
