"""
协作空间知识库 HTTP API。

路由前缀与现有 spaces 一致：`/api/v1/spaces/{space_public_id}/knowledge/...`
鉴权：所有接口需登录；读操作要求空间成员；写操作要求 owner/editor（与协作空间上传角色一致）。

存储：正文为 UTF-8 文本，路径使用与 space_assets 相同的本机根目录（settings.SPACE_ASSETS_LOCAL_ROOT），
通过 core.space_asset_upload.absolute_path_for_storage_key 落盘，避免路径穿越。
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Field, SQLModel, select

from app.api.deps import CurrentUser, SessionDep
from app.core.collab_permissions import (
    SPACE_UPLOAD_ROLES,
    ensure_space_member_role,
    get_current_space_member,
)
from app.core.space_asset_upload import absolute_path_for_storage_key
from app.models import CollabSpace, WikiCategory, WikiDocument
from app.models.common import get_datetime_utc

router = APIRouter(prefix="/spaces", tags=["knowledge"])

# URL 段 slug：小写字母数字与连字符，便于与路由参数兼容
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _get_space_by_public_id_or_404(session: SessionDep, space_id: uuid.UUID) -> CollabSpace:
    space = session.exec(select(CollabSpace).where(CollabSpace.public_id == space_id)).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


def _assert_slug(name: str, field: str = "slug") -> str:
    s = name.strip()
    if not s or len(s) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field}",
        )
    if not _SLUG_RE.match(s):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field} must match pattern [a-z0-9-] (no spaces)",
        )
    return s


def _excerpt_from_markdown(markdown: str, max_len: int = 1200) -> str:
    """
    生成存入 DB 的摘要字段：去掉围栏代码块后截断，供 ILIKE 搜索与列表预览。
    非完整 Markdown 解析，保持实现轻量。
    """
    text = markdown
    # 去掉 ``` ... ``` 块（简化版）
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1] + "…"


def _wiki_storage_key(*, space_public_id: uuid.UUID, doc_id: int, version: int) -> str:
    """与方案文档一致：wiki/{space_uuid}/{doc_id}/v{version}.md"""
    return f"wiki/{space_public_id}/{doc_id}/v{version}.md"


# --------------------------------------------------------------------------- 响应模型


class WikiCategoryPublic(SQLModel):
    id: int
    parent_id: int | None
    slug: str
    title: str
    sort_order: int


class WikiDocumentPublic(SQLModel):
    id: int
    category_id: int | None
    slug: str
    title: str
    content_version: int
    updated_at: datetime | None


class WikiTreeResponse(SQLModel):
    """前端可自行组树：扁平列表 + parent 关系。"""

    categories: list[WikiCategoryPublic]
    documents: list[WikiDocumentPublic]


class WikiDocumentDetailResponse(SQLModel):
    slug: str
    title: str
    markdown: str
    content_version: int
    updated_at: datetime | None


class WikiSearchHit(SQLModel):
    slug: str
    title: str
    excerpt: str | None


class WikiSearchResponse(SQLModel):
    hits: list[WikiSearchHit]


class WikiDocCreateBody(SQLModel):
    title: str = Field(min_length=1, max_length=500)
    slug: str = Field(min_length=1, max_length=200)
    markdown: str = Field(min_length=1, max_length=2_000_000)
    category_id: int | None = None


class WikiCategoryCreateBody(SQLModel):
    title: str = Field(min_length=1, max_length=500)
    slug: str = Field(min_length=1, max_length=200)
    parent_id: int | None = None


# --------------------------------------------------------------------------- 路由


@router.get("/{space_id}/knowledge/tree", response_model=WikiTreeResponse)
def get_knowledge_tree(
    session: SessionDep,
    current_user: CurrentUser,
    space_id: uuid.UUID,
) -> WikiTreeResponse:
    """返回当前空间下分类与文档列表（成员可读）。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    get_current_space_member(session, current_user, space.id)

    cats = session.exec(
        select(WikiCategory)
        .where(WikiCategory.space_id == space.id)
        .order_by(WikiCategory.sort_order, WikiCategory.id)  # type: ignore
    ).all()
    docs = session.exec(
        select(WikiDocument)
        .where(WikiDocument.space_id == space.id)
        .order_by(WikiDocument.updated_at.desc())  # type: ignore
    ).all()

    return WikiTreeResponse(
        categories=[
            WikiCategoryPublic(
                id=c.id,  # type: ignore
                parent_id=c.parent_id,
                slug=c.slug,
                title=c.title,
                sort_order=c.sort_order,
            )
            for c in cats
            if c.id is not None
        ],
        documents=[
            WikiDocumentPublic(
                id=d.id,  # type: ignore
                category_id=d.category_id,
                slug=d.slug,
                title=d.title,
                content_version=d.content_version,
                updated_at=d.updated_at,
            )
            for d in docs
            if d.id is not None
        ],
    )


@router.get("/{space_id}/knowledge/docs/{slug}", response_model=WikiDocumentDetailResponse)
def get_knowledge_document(
    session: SessionDep,
    current_user: CurrentUser,
    space_id: uuid.UUID,
    slug: str,
) -> WikiDocumentDetailResponse:
    """按 slug 读取单篇文档：元数据 + 磁盘正文（成员可读）。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    get_current_space_member(session, current_user, space.id)

    doc = session.exec(
        select(WikiDocument).where(
            WikiDocument.space_id == space.id,
            WikiDocument.slug == slug,
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    path = absolute_path_for_storage_key(doc.storage_key)
    if not path.is_file():
        raise HTTPException(
            status_code=500,
            detail="Document content missing on storage",
        )
    markdown = path.read_text(encoding="utf-8")

    return WikiDocumentDetailResponse(
        slug=doc.slug,
        title=doc.title,
        markdown=markdown,
        content_version=doc.content_version,
        updated_at=doc.updated_at,
    )


@router.get("/{space_id}/knowledge/search", response_model=WikiSearchResponse)
def search_knowledge(
    session: SessionDep,
    current_user: CurrentUser,
    space_id: uuid.UUID,
    q: str,
) -> WikiSearchResponse:
    """
    简单关键词检索（P0）：在标题与 body_excerpt 上做 ILIKE。
    后续可替换为 Meilisearch / FTS，接口形态保持不变。
    """
    space = _get_space_by_public_id_or_404(session, space_id)
    get_current_space_member(session, current_user, space.id)

    term = q.strip()
    if not term or len(term) > 200:
        return WikiSearchResponse(hits=[])

    # PostgreSQL ILIKE；使用 sqlmodel.col 得到可参与 SQL 表达式的列对象
    from sqlalchemy import or_
    from sqlmodel import col

    pattern = f"%{term}%"
    docs = session.exec(
        select(WikiDocument).where(
            WikiDocument.space_id == space.id,
            or_(
                col(WikiDocument.title).ilike(pattern),
                col(WikiDocument.body_excerpt).ilike(pattern),
            ),
        )
    ).all()

    hits = [
        WikiSearchHit(
            slug=d.slug,
            title=d.title,
            excerpt=(d.body_excerpt[:240] + "…") if d.body_excerpt and len(d.body_excerpt) > 240 else d.body_excerpt,
        )
        for d in docs
    ]
    return WikiSearchResponse(hits=hits)


@router.post("/{space_id}/knowledge/docs", response_model=WikiDocumentPublic)
def create_knowledge_document(
    session: SessionDep,
    current_user: CurrentUser,
    space_id: uuid.UUID,
    body: WikiDocCreateBody,
) -> WikiDocumentPublic:
    """新建文档：owner/editor；写入 DB + 本地存储。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(session, current_user, space.id)
    ensure_space_member_role(member, SPACE_UPLOAD_ROLES, action="create wiki documents")

    slug = _assert_slug(body.slug)
    title = body.title.strip()

    if body.category_id is not None:
        cat = session.get(WikiCategory, body.category_id)
        if not cat or cat.space_id != space.id:
            raise HTTPException(status_code=400, detail="Invalid category_id")

    existing = session.exec(
        select(WikiDocument).where(WikiDocument.space_id == space.id, WikiDocument.slug == slug)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Document slug already exists in this space")

    now = get_datetime_utc()
    excerpt = _excerpt_from_markdown(body.markdown)

    doc = WikiDocument(
        space_id=space.id,
        category_id=body.category_id,
        slug=slug,
        title=title,
        author_id=current_user.id,  # type: ignore
        content_version=1,
        storage_key="pending",
        body_excerpt=excerpt,
        created_at=now,
        updated_at=now,
    )
    session.add(doc)
    session.flush()

    if doc.id is None:
        raise HTTPException(status_code=500, detail="Failed to allocate document id")

    key = _wiki_storage_key(space_public_id=space.public_id, doc_id=doc.id, version=doc.content_version)
    doc.storage_key = key
    path = absolute_path_for_storage_key(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        path.write_text(body.markdown, encoding="utf-8")
    except OSError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to write wiki content to storage",
        ) from None

    session.commit()
    session.refresh(doc)

    return WikiDocumentPublic(
        id=doc.id,  # type: ignore
        category_id=doc.category_id,
        slug=doc.slug,
        title=doc.title,
        content_version=doc.content_version,
        updated_at=doc.updated_at,
    )


@router.post("/{space_id}/knowledge/categories", response_model=WikiCategoryPublic)
def create_knowledge_category(
    session: SessionDep,
    current_user: CurrentUser,
    space_id: uuid.UUID,
    body: WikiCategoryCreateBody,
) -> WikiCategoryPublic:
    """新建分类（可选功能）：owner/editor。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(session, current_user, space.id)
    ensure_space_member_role(member, SPACE_UPLOAD_ROLES, action="create wiki categories")

    slug = _assert_slug(body.slug)
    title = body.title.strip()

    if body.parent_id is not None:
        parent = session.get(WikiCategory, body.parent_id)
        if not parent or parent.space_id != space.id:
            raise HTTPException(status_code=400, detail="Invalid parent_id")

    dup = session.exec(
        select(WikiCategory).where(
            WikiCategory.space_id == space.id,
            WikiCategory.parent_id == body.parent_id,
            WikiCategory.slug == slug,
        )
    ).first()
    if dup:
        raise HTTPException(status_code=409, detail="Category slug already exists at this level")

    now = get_datetime_utc()
    cat = WikiCategory(
        space_id=space.id,
        parent_id=body.parent_id,
        slug=slug,
        title=title,
        sort_order=0,
        created_at=now,
        updated_at=now,
    )
    session.add(cat)
    session.commit()
    session.refresh(cat)

    if cat.id is None:
        raise HTTPException(status_code=500, detail="Failed to allocate category id")

    return WikiCategoryPublic(
        id=cat.id,
        parent_id=cat.parent_id,
        slug=cat.slug,
        title=cat.title,
        sort_order=cat.sort_order,
    )
