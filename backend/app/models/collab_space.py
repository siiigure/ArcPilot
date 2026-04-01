import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlmodel import Field, Relationship, SQLModel

from app.models.common import get_datetime_utc


class CollabSpace(SQLModel, table=True):
    """
    协作空间主表。

    - 每个协作空间由一个唯一的所有者（owner）创建。
    - 通过 storage_quota / used_storage 字段做基础配额控制。
    """

    __tablename__ = "collab_spaces"

    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PGUUID(as_uuid=True), unique=True, nullable=False, index=True),
    )
    name: str = Field(max_length=255, index=True)
    description: str | None = Field(default=None, max_length=2000)

    owner_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)

    # 单位：Byte。默认配额可以由业务层在创建时注入。
    storage_quota: int = Field(default=0)
    used_storage: int = Field(default=0)

    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    members: list["CollabSpaceMember"] = Relationship(
        back_populates="space", cascade_delete=True
    )
    assets: list["SpaceAsset"] = Relationship(
        back_populates="space", cascade_delete=True
    )


class CollabSpaceMember(SQLModel, table=True):
    """
    协作空间成员表。

    - 记录用户在某个协作空间中的角色（owner/editor/viewer）。
    - 使用 space_id + user_id 唯一约束，防止重复加入。
    """

    __tablename__ = "collab_space_members"
    __table_args__ = (
        UniqueConstraint("space_id", "user_id", name="uq_space_member_pair"),
    )

    id: int | None = Field(default=None, primary_key=True)
    space_id: int = Field(
        foreign_key="collab_spaces.id", ondelete="CASCADE", index=True
    )
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)

    # 角色枚举：owner / editor / viewer
    role: str = Field(max_length=20, index=True)

    joined_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )

    space: CollabSpace | None = Relationship(back_populates="members")


class SpaceAsset(SQLModel, table=True):
    """
    协作空间资源表（文件 / 脚本等）。

    - 通过 (space_id, logical_name, version) 实现同名文件的版本控制。
    - 存储路径以 storage_key/url 的形式保存，不直接绑定具体存储实现。
    """

    __tablename__ = "space_assets"
    __table_args__ = (
        UniqueConstraint(
            "space_id", "logical_name", "version", name="uq_space_asset_version"
        ),
    )

    id: int | None = Field(default=None, primary_key=True)

    space_id: int = Field(
        foreign_key="collab_spaces.id", ondelete="CASCADE", index=True
    )
    uploader_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        index=True,
    )

    logical_name: str = Field(max_length=500, index=True)
    version: int = Field(default=1, index=True)

    type: str = Field(
        default="other",
        max_length=50,
        description="资源类型：pdf/image/gis/python/other 等",
    )

    # 对象存储 key 或完整 URL，由上层上传流程决定格式。
    storage_key: str = Field(max_length=1000)
    size: int = Field(default=0)

    is_deleted: bool = Field(default=False, index=True)
    deleted_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    deleted_by_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        index=True,
    )

    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )

    space: CollabSpace | None = Relationship(back_populates="assets")


class SpaceInvite(SQLModel, table=True):
    """
    协作空间邀请码表。

    - 采用邀请码方式加入协作空间，暂不依赖邮件发送。
    - 保留 email 字段，后续如需邮件邀请可以直接扩展使用。
    """

    __tablename__ = "space_invites"
    __table_args__ = (
        UniqueConstraint("space_id", "invite_code", name="uq_space_invite_code"),
    )

    id: int | None = Field(default=None, primary_key=True)

    space_id: int = Field(
        foreign_key="collab_spaces.id", ondelete="CASCADE", index=True
    )

    # 可选的邮箱字段，方便未来扩展成邮件邀请。
    email: str | None = Field(default=None, max_length=255)

    # 目前约定使用邀请码字符串（对用户可见），同时也可作为后续 token 的一部分。
    invite_code: str = Field(max_length=64, index=True)
    role: str = Field(
        default="viewer", max_length=20, description="受邀后加入空间的角色：editor/viewer"
    )

    inviter_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        index=True,
    )

    status: str = Field(
        default="pending", max_length=20, description="pending/accepted/expired/cancelled"
    )

    expires_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )

    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

