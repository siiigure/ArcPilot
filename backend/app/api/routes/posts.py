import re
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy import func as sa_func
from sqlmodel import Field, Session, SQLModel, col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Post, Reply, Tag, User

# 每用户每日最多新建话题（空间）次数，方案 B
TAG_CREATE_DAILY_LIMIT = 5


router = APIRouter(prefix="/posts", tags=["posts"])
tags_router = APIRouter(prefix="/tags", tags=["tags"])


# -----------------------------
# OpenAPI Schema（用于生成前端 client）
# -----------------------------


class TagPublic(SQLModel):
    id: uuid.UUID
    name: str
    slug: str
    category: str | None = None
    description: str | None = None
    is_official: bool = False
    # 方案 C：空间 owner 的 public_id
    owner_public_id: uuid.UUID | None = None


class TagCreate(SQLModel):
    name: str = Field(min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=500)


class TagsSuggest(SQLModel):
    data: list[TagPublic]
    count: int


class AuthorPublic(SQLModel):
    """
    作者信息（按 MVP 字段契约返回）。

    约束/说明：
    - 前端 `PostCard` 直接使用 `author.avatar` 作为图片 URL，因此后端必须返回该字段。
    - 当前 `User` 模型没有头像与 bio 字段：本 MVP 先返回空字符串/None，由前端用 dicebear 兜底。
    - `id` 为作者 public_id，用于跳转 TA 的资料页；已删除用户为 null。
    """

    id: uuid.UUID | None = None
    name: str
    avatar: str = ""
    bio: str | None = None


class TagsPublic(SQLModel):
    data: list[TagPublic]
    count: int


class PostPublic(SQLModel):
    id: uuid.UUID
    title: str
    content: str
    timestamp: str
    comments: int
    author: AuthorPublic
    # MVP 不展示 Tag，但保留字段便于后续扩展；本阶段可返回空数组
    tags: list[TagPublic] = Field(default_factory=list)


class PostCreate(SQLModel):
    title: str
    body: str
    # 前端会传 `tag_ids`（可为空、也可能不传）
    tag_ids: list[uuid.UUID] = Field(default_factory=list)


class ReplyCreate(SQLModel):
    body: str


class ReplyPublic(SQLModel):
    id: uuid.UUID
    content: str
    timestamp: str
    author: AuthorPublic
    # MVP 先不返回更多字段（如 upvotes 等）
    post_id: uuid.UUID | None = None


# -----------------------------
# Helpers
# -----------------------------


def _author_to_public(author: User | None) -> AuthorPublic:
    # `author` 可能因为 ondelete=SET NULL 或历史数据问题为空
    if author is None:
        # 保证前端至少有可渲染的 name（避免 UI 崩溃）
        return AuthorPublic(id=None, name="Deleted user", avatar="", bio=None)

    # 文档契约：name = full_name || email
    name = (author.full_name or author.email or "").strip() or "Unknown user"
    avatar = (author.avatar_url or "").strip() or ""
    bio_raw = (author.bio or "").strip()
    bio = bio_raw if bio_raw else None
    return AuthorPublic(
        id=author.public_id,
        name=name,
        avatar=avatar,
        bio=bio,
    )


def _tag_to_public(tag: Tag, *, owner_user: User | None = None) -> TagPublic:
    owner_public: uuid.UUID | None = None
    if owner_user is not None:
        owner_public = owner_user.public_id
    return TagPublic(
        id=tag.public_id,
        name=tag.name,
        slug=tag.slug,
        category=tag.category,
        description=tag.description,
        is_official=tag.is_official,
        owner_public_id=owner_public,
    )


def _slugify_tag_name(name: str) -> str:
    s = name.strip().lower()
    s = re.sub(r"[^\w\u4e00-\u9fff\-]", "", s, flags=re.UNICODE)
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    if not s:
        return f"t-{uuid.uuid4().hex[:12]}"
    return s[:50]


def _unique_slug(*, session: Session, base: str) -> str:
    slug = base
    n = 2
    while session.exec(select(Tag).where(Tag.slug == slug)).first():
        suffix = f"-{n}"
        slug = f"{base[: max(1, 50 - len(suffix))]}{suffix}"
        n += 1
    return slug


def _post_to_public(*, post: Post, comments: int, tags: list[TagPublic]) -> PostPublic:
    # 字段映射（MVP 约定）：
    # - `content`  <- Post.body
    # - `timestamp` <- Post.created_at（ISO 字符串）
    timestamp = post.created_at.isoformat() if post.created_at else ""
    return PostPublic(
        id=post.public_id,
        title=post.title,
        content=post.body,
        timestamp=timestamp,
        comments=comments,
        author=_author_to_public(post.author),
        tags=tags,
    )


def _reply_to_public(*, reply: Reply) -> ReplyPublic:
    timestamp = reply.created_at.isoformat() if reply.created_at else ""
    return ReplyPublic(
        id=reply.public_id,
        content=reply.body,
        timestamp=timestamp,
        author=_author_to_public(reply.author),
        post_id=reply.post.public_id if reply.post else None,
    )


def _get_reply_count(*, session: Session, post_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(Reply)
        .where(Reply.post_id == post_id)
        .where(Reply.is_deleted == False)  # noqa: E712
    )
    return int(session.exec(statement).one())


# -----------------------------
# Tags
# -----------------------------


@tags_router.get("/", response_model=TagsPublic)
def list_tags(
    *, session: SessionDep, _current_user: CurrentUser
) -> TagsPublic:
    """
    获取 Tag 列表（用于发帖页 Tag 多选）。

    说明：
    - 读取接口按 `auth_required` 处理（前端 layout 已做登录保护，不影响闭环）。
    """

    statement = select(Tag).order_by(Tag.slug.asc())
    tags = session.exec(statement).all()

    public_tags = [_tag_to_public(t) for t in tags]
    return TagsPublic(data=public_tags, count=len(public_tags))


@tags_router.get("/suggest", response_model=TagsSuggest)
def suggest_tags(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    q: str = "",
    limit: int = 10,
) -> TagsSuggest:
    """
    按名称模糊匹配已有话题，用于新建话题前的相似提示（方案 B）。
    """
    q = re.sub(r"[%_\\]", "", q.strip()[:50])
    if not q:
        return TagsSuggest(data=[], count=0)

    statement = (
        select(Tag)
        .where(col(Tag.name).ilike(f"%{q}%"))
        .order_by(Tag.name.asc())
        .limit(min(limit, 30))
    )
    rows = session.exec(statement).all()
    return TagsSuggest(
        data=[_tag_to_public(t) for t in rows],
        count=len(rows),
    )


@tags_router.post("/", response_model=TagPublic)
def create_tag(
    *,
    session: SessionDep,
    body: TagCreate,
    current_user: CurrentUser,
) -> Any:
    """
    用户创建话题（空间）。同一自然日（UTC）每用户最多创建 TAG_CREATE_DAILY_LIMIT 条。
    """
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    dup = session.exec(
        select(Tag).where(sa_func.lower(Tag.name) == name.lower())
    ).first()
    if dup:
        raise HTTPException(
            status_code=400,
            detail="已存在同名或相似话题，请直接选用已有话题",
        )

    start_utc = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    count_row = session.exec(
        select(func.count())
        .select_from(Tag)
        .where(Tag.created_by_user_id == current_user.id)
        .where(col(Tag.created_at) >= start_utc)
    ).one()
    count_today = int(count_row[0]) if isinstance(count_row, tuple) else int(count_row)
    if count_today >= TAG_CREATE_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"今日新建话题已达上限（{TAG_CREATE_DAILY_LIMIT} 个），请明日再试或选用已有话题",
        )

    base_slug = _unique_slug(session=session, base=_slugify_tag_name(name))
    tag = Tag(
        name=name[:50],
        slug=base_slug,
        description=(body.description or "").strip() or None,
        is_official=False,
        created_by_user_id=current_user.id,
    )
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return _tag_to_public(tag)


# -----------------------------
# Posts - list / create / detail
# -----------------------------


@router.post("/", response_model=PostPublic)
def create_post(
    *,
    session: SessionDep,
    post_in: PostCreate,
    current_user: CurrentUser,
) -> Any:
    """
    创建帖子（发帖页提交）。

    行为：
    - 写入 `post.author_id = current_user.id`
    - 若传入 `tag_ids`，写入 M2M 关联（`post_tag_link`）
    """

    post = Post(
        author_id=current_user.id,
        title=post_in.title,
        body=post_in.body,
    )

    # tag_ids -> tags（M2M）
    if post_in.tag_ids:
        tags_stmt = select(Tag).where(Tag.public_id.in_(post_in.tag_ids))
        tags = session.exec(tags_stmt).all()
        if len(tags) != len(post_in.tag_ids):
            raise HTTPException(status_code=400, detail="Some tags do not exist")
        post.tags = tags

    session.add(post)
    session.commit()
    session.refresh(post)

    comments = 0
    # MVP 不展示 tags，但为保持字段契约可返回空数组或已关联 tags（不会影响 MVP UI）
    tags_public = [_tag_to_public(t) for t in (post.tags or [])]
    return _post_to_public(post=post, comments=comments, tags=tags_public)


@router.get("/", response_model=list[PostPublic])
def list_posts(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
) -> list[PostPublic]:
    """
    获取帖子列表（首页 Feed）。

    字段契约（MVP）：
    - `content`：Post.body
    - `timestamp`：Post.created_at（ISO 字符串）
    - `comments`：该帖 replies 条数（过滤 is_deleted=false）
    """
    _ = current_user

    posts_stmt = (
        select(Post)
        .where(Post.is_deleted == False)  # noqa: E712
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = session.exec(posts_stmt).all()

    results: list[PostPublic] = []
    for p in posts:
        comments = _get_reply_count(session=session, post_id=p.id)
        # MVP 不展示 tags，直接返回空数组以减少查询成本
        results.append(_post_to_public(post=p, comments=comments, tags=[]))
    return results


@router.get("/{post_id}", response_model=PostPublic)
def get_post_detail(
    *,
    session: SessionDep,
    post_id: uuid.UUID,
    current_user: CurrentUser,
) -> PostPublic:
    """
    获取帖子详情（详情页首屏：正文优先）。
    """

    post = session.exec(select(Post).where(Post.public_id == post_id)).first()
    if not post or post.is_deleted:
        raise HTTPException(status_code=404, detail="Post not found")

    _ = current_user
    comments = _get_reply_count(session=session, post_id=post.id)
    # 详情页文档允许 tags 先空数组；本 MVP 按成本直接返回空
    return _post_to_public(post=post, comments=comments, tags=[])


@router.get("/{post_id}/replies", response_model=list[ReplyPublic])
def list_replies(
    *,
    session: SessionDep,
    post_id: uuid.UUID,
    current_user: CurrentUser,
) -> list[ReplyPublic]:
    """
    获取帖子回复列表（详情页 replies 区域）。

    MVP 顺序：新 -> 旧（created_at 降序）
    """

    post = session.exec(select(Post).where(Post.public_id == post_id)).first()
    if not post or post.is_deleted:
        return []

    _ = current_user
    replies_stmt = (
        select(Reply)
        .where(Reply.post_id == post.id)
        .where(Reply.is_deleted == False)  # noqa: E712
        .order_by(Reply.created_at.desc())
    )
    replies = session.exec(replies_stmt).all()
    return [_reply_to_public(reply=r) for r in replies]


@router.post("/{post_id}/replies", response_model=ReplyPublic)
def create_reply(
    *,
    session: SessionDep,
    post_id: uuid.UUID,
    reply_in: ReplyCreate,
    current_user: CurrentUser,
) -> ReplyPublic:
    """
    发布回复（详情页提交）。

    行为：
    - 写入 `reply.post_id`
    - 写入 `reply.author_id = current_user.id`
    """

    post = session.exec(select(Post).where(Post.public_id == post_id)).first()
    if not post or post.is_deleted:
        raise HTTPException(status_code=404, detail="Post not found")

    reply = Reply(
        post_id=post.id,
        author_id=current_user.id,
        body=reply_in.body,
    )
    session.add(reply)
    session.commit()
    session.refresh(reply)

    return _reply_to_public(reply=reply)

