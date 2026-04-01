from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models import CollabSpaceMember, User

SPACE_ROLE_OWNER = "owner"
SPACE_ROLE_EDITOR = "editor"
SPACE_ROLE_VIEWER = "viewer"

SPACE_VALID_ROLES = {
    SPACE_ROLE_OWNER,
    SPACE_ROLE_EDITOR,
    SPACE_ROLE_VIEWER,
}

# 具备上传能力的角色（用于 presign/complete 等接口）
SPACE_UPLOAD_ROLES = {
    SPACE_ROLE_OWNER,
    SPACE_ROLE_EDITOR,
}

# 具备成员邀请能力的角色（当前按需求仅 owner）
SPACE_INVITE_ROLES = {
    SPACE_ROLE_OWNER,
}


def get_current_space_member(
    session: Session,
    current_user: User,
    space_id: int,
    *,
    raise_as_not_found: bool = False,
) -> CollabSpaceMember:
    """
    查询当前用户在指定协作空间中的成员记录。

    - 默认返回 403，表示「你不是该空间成员」。
    - 如 raise_as_not_found=True，则返回 404，用于隐藏资源存在性。
    """
    member = session.exec(
        select(CollabSpaceMember).where(
            CollabSpaceMember.space_id == space_id,
            CollabSpaceMember.user_id == current_user.id,
        )
    ).first()

    if member:
        return member

    if raise_as_not_found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not a member of this space",
    )


def ensure_space_member_role(
    member: CollabSpaceMember,
    allowed_roles: set[str],
    *,
    action: str = "perform this action",
) -> None:
    """
    校验成员角色是否具备目标操作权限，不满足则抛 403。
    """
    if member.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Current role does not have permission to {action}",
        )


def can_delete_asset(
    *,
    role: str,
    current_user_id: int,
    uploader_id: int | None,
) -> bool:
    """
    资源删除策略：
    - owner 可以删除任意资源
    - editor 仅可删除自己上传的资源
    - viewer 不可删除
    """
    if role == SPACE_ROLE_OWNER:
        return True
    if role == SPACE_ROLE_EDITOR and uploader_id is not None:
        return current_user_id == uploader_id
    return False
