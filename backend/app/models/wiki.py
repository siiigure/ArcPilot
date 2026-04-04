"""
协作空间知识库（Knowledge / Wiki）领域模型。

设计对齐 backend/docs/知识库设计方案.md：
- 元数据在 PostgreSQL；正文落在本机 data 根目录下（与协作空间资源同一套根路径语义，key 以 wiki/ 前缀区分）。
- 多租户：所有行绑定 collab_spaces.id；读写在 API 层校验成员身份与编辑权限。

注意：不在此模块执行任何会修改「非知识库表」数据的逻辑；新建表仅影响 create_all 时追加结构。
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Text, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

from app.models.collab_space import CollabSpace
from app.models.common import get_datetime_utc
from app.models.user import User


class WikiCategory(SQLModel, table=True):
    """
    知识库分类（树形，可选）。

    - 同一空间下 (parent_id, slug) 组合唯一，便于 URL 与导航稳定。
    - parent_id 为空表示顶层分类。
    """

    __tablename__ = "wiki_categories"
    __table_args__ = (
        UniqueConstraint("space_id", "parent_id", "slug", name="uq_wiki_category_space_parent_slug"),
    )

    id: int | None = Field(default=None, primary_key=True)
    space_id: int = Field(foreign_key="collab_spaces.id", ondelete="CASCADE", index=True)
    parent_id: int | None = Field(
        default=None,
        foreign_key="wiki_categories.id",
        ondelete="CASCADE",
        index=True,
    )

    slug: str = Field(max_length=200, index=True)
    title: str = Field(max_length=500)
    sort_order: int = Field(default=0, index=True)

    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    space: CollabSpace | None = Relationship()
    documents: list["WikiDocument"] = Relationship(back_populates="category")


class WikiDocument(SQLModel, table=True):
    """
    知识库文档元数据。

    - storage_key：正文文件相对根目录的路径（见知识库方案 §4.2），由服务在创建/更新时写入。
    - body_excerpt：从正文截取的纯文本片段，用于列表与 PostgreSQL 侧关键词检索（P0），避免每次搜索都读盘全文。
    """

    __tablename__ = "wiki_documents"
    __table_args__ = (UniqueConstraint("space_id", "slug", name="uq_wiki_doc_space_slug"),)

    id: int | None = Field(default=None, primary_key=True)
    space_id: int = Field(foreign_key="collab_spaces.id", ondelete="CASCADE", index=True)
    category_id: int | None = Field(
        default=None,
        foreign_key="wiki_categories.id",
        ondelete="SET NULL",
        index=True,
    )

    slug: str = Field(max_length=200, index=True)
    title: str = Field(max_length=500)
    # SET NULL 要求列可为空（作者账号删除后文档仍可保留）
    author_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        index=True,
    )

    content_version: int = Field(default=1, ge=1)
    storage_key: str = Field(max_length=1000)

    body_excerpt: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="用于搜索与列表摘要的纯文本片段",
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

    space: CollabSpace | None = Relationship()
    category: WikiCategory | None = Relationship(back_populates="documents")
    author: User | None = Relationship()
