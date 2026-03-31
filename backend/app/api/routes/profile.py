import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import Session, SQLModel, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.routes.posts import PostPublic, _get_reply_count, _post_to_public
from app.models import Post, Reply, User, UserFollow

router = APIRouter(prefix="/users", tags=["users"])


class UserPublicPreview(SQLModel):
    """对外展示的用户资料（不含邮箱等敏感字段）。"""

    id: uuid.UUID
    full_name: str | None
    display_name: str | None
    username: str | None
    avatar_url: str | None
    bio: str | None
    date_joined: datetime | None


class UserProfileOut(SQLModel):
    user: UserPublicPreview
    followers_count: int
    following_count: int
    is_following: bool | None


class FollowStatus(SQLModel):
    following: bool


def _user_preview(user: User) -> UserPublicPreview:
    return UserPublicPreview(
        id=user.public_id,
        full_name=user.full_name,
        display_name=user.display_name,
        username=user.username,
        avatar_url=user.avatar_url,
        bio=user.bio,
        date_joined=user.date_joined,
    )


def _get_user_by_public_id(session: Session, user_id: uuid.UUID) -> User | None:
    return session.exec(select(User).where(User.public_id == user_id)).first()


def _followers_count(*, session: Session, user_id: int) -> int:
    stmt = (
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.following_id == user_id)
    )
    return int(session.exec(stmt).one())


def _following_count(*, session: Session, user_id: int) -> int:
    stmt = (
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.follower_id == user_id)
    )
    return int(session.exec(stmt).one())


@router.get("/{user_id}/profile", response_model=UserProfileOut)
def get_user_profile(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    current_user: CurrentUser,
) -> Any:
    user = _get_user_by_public_id(session, user_id)
    if user is None or user.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    followers = _followers_count(session=session, user_id=user.id)
    following = _following_count(session=session, user_id=user.id)

    if current_user.id == user.id:
        is_following: bool | None = None
    else:
        row = session.exec(
            select(UserFollow).where(
                UserFollow.follower_id == current_user.id,
                UserFollow.following_id == user.id,
            )
        ).first()
        is_following = row is not None

    return UserProfileOut(
        user=_user_preview(user),
        followers_count=followers,
        following_count=following,
        is_following=is_following,
    )


@router.post("/{user_id}/follow", response_model=FollowStatus)
def follow_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    current_user: CurrentUser,
) -> Any:
    target = _get_user_by_public_id(session, user_id)
    if target is None or target.id is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    existing = session.exec(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == target.id,
        )
    ).first()
    if existing is None:
        session.add(
            UserFollow(follower_id=current_user.id, following_id=target.id)
        )
        session.commit()

    return FollowStatus(following=True)


@router.delete("/{user_id}/follow", response_model=FollowStatus)
def unfollow_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    current_user: CurrentUser,
) -> Any:
    target = _get_user_by_public_id(session, user_id)
    if target is None or target.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    row = session.exec(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == target.id,
        )
    ).first()
    if row is not None:
        session.delete(row)
        session.commit()

    return FollowStatus(following=False)


@router.get("/{user_id}/posts", response_model=list[PostPublic])
def list_user_posts(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
) -> Any:
    _ = current_user
    target = _get_user_by_public_id(session, user_id)
    if target is None or target.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    posts_stmt = (
        select(Post)
        .where(Post.author_id == target.id)
        .where(Post.is_deleted == False)  # noqa: E712
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = session.exec(posts_stmt).all()

    results: list[PostPublic] = []
    for p in posts:
        if p.id is None:
            continue
        comments = _get_reply_count(session=session, post_id=p.id)
        results.append(_post_to_public(post=p, comments=comments, tags=[]))
    return results


@router.get("/{user_id}/answered-posts", response_model=list[PostPublic])
def list_user_answered_posts(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
) -> Any:
    _ = current_user
    target = _get_user_by_public_id(session, user_id)
    if target is None or target.id is None:
        raise HTTPException(status_code=404, detail="User not found")

    replied_post_ids = select(Reply.post_id).where(
        Reply.author_id == target.id,
        Reply.is_deleted == False,  # noqa: E712
    )

    posts_stmt = (
        select(Post)
        .where(Post.id.in_(replied_post_ids))
        .where(Post.is_deleted == False)  # noqa: E712
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = session.exec(posts_stmt).all()

    results: list[PostPublic] = []
    for p in posts:
        if p.id is None:
            continue
        comments = _get_reply_count(session=session, post_id=p.id)
        results.append(_post_to_public(post=p, comments=comments, tags=[]))
    return results
