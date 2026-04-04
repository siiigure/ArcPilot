import re
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func as sa_func
from sqlmodel import Field, Session, SQLModel, col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.models import Post, PostTagLink, Reply, ResponseMessage, Tag, User

# 每用户每日最多新建话题（空间）次数，方案 B
TAG_CREATE_DAILY_LIMIT = 5

# 删帖限流（单进程内存；多 worker 时每实例独立计数）
_DELETE_WINDOW_SEC = 60.0
_DELETE_MAX_PER_WINDOW = 30
_delete_times: dict[int, deque[float]] = defaultdict(deque)


def _enforce_delete_rate_limit(user_id: int) -> None:
    now = time.monotonic()
    dq = _delete_times[user_id]
    while dq and now - dq[0] > _DELETE_WINDOW_SEC:
        dq.popleft()
    if len(dq) >= _DELETE_MAX_PER_WINDOW:
        raise HTTPException(
            status_code=429,
            detail="删除过于频繁，请稍后再试",
        )
    dq.append(now)


def _escape_ilike_pattern(term: str) -> str:
    """转义 ILIKE 通配符，避免用户输入 % / _ 注入。"""
    return (
        term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    )


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
    # 仅当请求带 limit 分页时出现；全量列表时为默认
    next_cursor: str | None = None
    has_more: bool = False


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


def _resolve_tag_for_filter(
    *,
    session: Session,
    tag_id: uuid.UUID | None,
    tag_slug: str | None,
) -> Tag | None:
    if tag_id is not None:
        return session.exec(select(Tag).where(Tag.public_id == tag_id)).first()
    if tag_slug is not None and tag_slug.strip():
        return session.exec(select(Tag).where(Tag.slug == tag_slug.strip())).first()
    return None


def _tags_by_post_id(*, session: Session, post_ids: list[int]) -> dict[int, list[Tag]]:
    if not post_ids:
        return {}
    stmt = (
        select(PostTagLink, Tag)
        .join(Tag, Tag.id == PostTagLink.tag_id)
        .where(PostTagLink.post_id.in_(post_ids))
        .order_by(Tag.slug.asc())
    )
    rows = session.exec(stmt).all()
    out: dict[int, list[Tag]] = {pid: [] for pid in post_ids}
    for link, tag in rows:
        out[link.post_id].append(tag)
    return out


def _tags_for_single_post(*, session: Session, post_id: int) -> list[TagPublic]:
    stmt = (
        select(Tag)
        .join(PostTagLink, PostTagLink.tag_id == Tag.id)
        .where(PostTagLink.post_id == post_id)
        .order_by(Tag.slug.asc())
    )
    tags = session.exec(stmt).all()
    return [_tag_to_public(t) for t in tags]


# -----------------------------
# Tags
# -----------------------------


@tags_router.get("/nav", response_model=TagsPublic)
def list_tags_nav(*, session: SessionDep, _current_user: CurrentUser) -> TagsPublic:
    """
    左侧导航短列表：配置了 NAV_TAG_PUBLIC_IDS 时按该顺序返回；
    否则按 post_tags 关联帖子数降序返回热门话题（TAG_NAV_LIMIT 条）。
    """
    configured = settings.nav_tag_public_ids()
    if configured:
        tags = session.exec(select(Tag).where(Tag.public_id.in_(configured))).all()
        by_pid = {t.public_id: t for t in tags}
        ordered = [by_pid[pid] for pid in configured if pid in by_pid]
        public_tags = [_tag_to_public(t) for t in ordered]
        return TagsPublic(data=public_tags, count=len(public_tags))

    cnt = func.count(PostTagLink.post_id).label("cnt")  # type: ignore[attr-defined]
    subq = (
        select(PostTagLink.tag_id, cnt)
        .join(Post, Post.id == PostTagLink.post_id)
        .where(Post.is_deleted == False)  # noqa: E712
        .group_by(PostTagLink.tag_id)
        .subquery()
    )
    stmt = (
        select(Tag)
        .join(subq, Tag.id == subq.c.tag_id)
        .order_by(subq.c.cnt.desc(), Tag.slug.asc())
        .limit(settings.TAG_NAV_LIMIT)
    )
    rows = session.exec(stmt).all()
    public_tags = [_tag_to_public(t) for t in rows]
    if not public_tags:
        # 尚无 post_tags 关联时热门为空，回退为按 slug 取若干标签（与种子数据兼容）
        fb = session.exec(
            select(Tag).order_by(Tag.slug.asc()).limit(settings.TAG_NAV_LIMIT)
        ).all()
        public_tags = [_tag_to_public(t) for t in fb]
    return TagsPublic(data=public_tags, count=len(public_tags))


@tags_router.get("/", response_model=TagsPublic)
def list_tags(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    after_slug: str | None = Query(
        default=None,
        description="游标：仅返回 slug 大于该值的标签（按 slug 升序，字典序）",
    ),
    limit: int | None = Query(
        default=None,
        ge=1,
        le=200,
        description="分页条数；不传则返回全量（发帖多选等场景）",
    ),
) -> TagsPublic:
    """
    获取 Tag 列表。

    - 不传 `limit`：返回全部标签（兼容发帖页、composer 全选）。
    - 传 `limit`：按 `slug` 升序分页；`after_slug` 为上一页最后一条的 `slug`（exclusive）。
    """

    if limit is None:
        statement = select(Tag).order_by(Tag.slug.asc())
        tags = session.exec(statement).all()
        public_tags = [_tag_to_public(t) for t in tags]
        return TagsPublic(data=public_tags, count=len(public_tags))

    stmt = select(Tag).order_by(Tag.slug.asc())
    cursor = (after_slug or "").strip()
    if cursor:
        stmt = stmt.where(col(Tag.slug) > cursor)
    stmt = stmt.limit(limit + 1)
    rows = session.exec(stmt).all()
    has_more = len(rows) > limit
    page_rows = rows[:limit]
    public_tags = [_tag_to_public(t) for t in page_rows]
    next_c = page_rows[-1].slug if has_more and page_rows else None
    return TagsPublic(
        data=public_tags,
        count=len(public_tags),
        next_cursor=next_c,
        has_more=has_more,
    )


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
    tag_id: uuid.UUID | None = Query(default=None),
    tag_slug: str | None = Query(default=None),
) -> list[PostPublic]:
    """
    获取帖子列表（首页 Feed）。

    可选 `tag_id`（推荐）或 `tag_slug` 筛选关联了该标签的帖子；若同时传，以 `tag_id` 为准
    （`tag_slug` 仅当未传 `tag_id` 时生效）。标签不存在时 404。

    每条帖子返回 `tags`（批量查询，避免 N+1）。
    """
    _ = current_user

    filter_tag: Tag | None = None
    if tag_id is not None or (tag_slug is not None and tag_slug.strip()):
        filter_tag = _resolve_tag_for_filter(
            session=session, tag_id=tag_id, tag_slug=tag_slug
        )
        if filter_tag is None:
            raise HTTPException(status_code=404, detail="Tag not found")

    if filter_tag is not None:
        posts_stmt = (
            select(Post)
            .join(PostTagLink, PostTagLink.post_id == Post.id)
            .where(PostTagLink.tag_id == filter_tag.id)
            .where(Post.is_deleted == False)  # noqa: E712
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    else:
        posts_stmt = (
            select(Post)
            .where(Post.is_deleted == False)  # noqa: E712
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

    posts = session.exec(posts_stmt).all()
    post_ids = [p.id for p in posts if p.id is not None]
    tags_map = _tags_by_post_id(session=session, post_ids=post_ids)

    results: list[PostPublic] = []
    for p in posts:
        if p.id is None:
            continue
        comments = _get_reply_count(session=session, post_id=p.id)
        tag_rows = tags_map.get(p.id, [])
        tags_public = [_tag_to_public(t) for t in tag_rows]
        results.append(_post_to_public(post=p, comments=comments, tags=tags_public))
    return results


@router.get("/search", response_model=list[PostPublic])
def search_posts(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    q: str = Query(..., min_length=1, max_length=200),
    skip: int = 0,
    limit: int = Query(20, ge=1, le=50),
) -> list[PostPublic]:
    """
    论坛帖子搜索（S1）：仅在**标题**上做 ILIKE 子串匹配，未删除帖；与文档「搜索分级」一致。

    不支持分词、语序颠倒；后续可扩展正文 / FTS。
    """
    _ = current_user
    term = q.strip()
    if not term:
        return []

    pattern = f"%{_escape_ilike_pattern(term)}%"
    posts_stmt = (
        select(Post)
        .where(Post.is_deleted == False)  # noqa: E712
        .where(col(Post.title).ilike(pattern, escape="\\"))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = session.exec(posts_stmt).all()
    post_ids = [p.id for p in posts if p.id is not None]
    tags_map = _tags_by_post_id(session=session, post_ids=post_ids)

    results: list[PostPublic] = []
    for p in posts:
        if p.id is None:
            continue
        comments = _get_reply_count(session=session, post_id=p.id)
        tag_rows = tags_map.get(p.id, [])
        tags_public = [_tag_to_public(t) for t in tag_rows]
        results.append(_post_to_public(post=p, comments=comments, tags=tags_public))
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
    tags_public = _tags_for_single_post(session=session, post_id=post.id)
    return _post_to_public(post=post, comments=comments, tags=tags_public)


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


@router.delete("/{post_id}", response_model=ResponseMessage)
def delete_post(
    *,
    session: SessionDep,
    post_id: uuid.UUID,
    current_user: CurrentUser,
) -> ResponseMessage:
    """
    作者软删自己的帖子（`is_deleted=True`）。非作者 403；已删或不存在 404。
    """
    uid = current_user.id
    if uid is None:
        raise HTTPException(status_code=500, detail="Invalid user state")

    _enforce_delete_rate_limit(uid)

    post = session.exec(select(Post).where(Post.public_id == post_id)).first()
    if not post or post.is_deleted:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this post")

    post.is_deleted = True
    session.add(post)
    session.commit()
    return ResponseMessage(message="Post deleted")
