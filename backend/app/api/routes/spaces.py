import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import EmailStr
from sqlmodel import Field, SQLModel, select

from app.api.deps import CurrentUser, SessionDep
from app.core.collab_invite_token import (
    StatelessInvitePayload,
    mint_stateless_invite_token,
    parse_stateless_invite_token,
)
from app.core.collab_permissions import (
    SPACE_INVITE_ROLES,
    SPACE_ROLE_OWNER,
    SPACE_VALID_ROLES,
    get_current_space_member,
)
from app.models import CollabSpace, CollabSpaceMember, SpaceInvite, User
from app.models.common import get_datetime_utc

INT32_MAX = 2_147_483_647
DEFAULT_SPACE_STORAGE_QUOTA = 2_000_000_000  # Keep under int32 max for current schema

router = APIRouter(prefix="/spaces", tags=["spaces"])
invite_router = APIRouter(prefix="/invites", tags=["spaces"])


class SpaceCreate(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    storage_quota: int | None = Field(default=None, ge=0, le=INT32_MAX)


class SpacePublic(SQLModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    owner_id: uuid.UUID
    storage_quota: int
    used_storage: int
    current_user_role: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SpacesPublic(SQLModel):
    data: list[SpacePublic]
    count: int


class SpaceMemberPublic(SQLModel):
    user_id: uuid.UUID
    email: str
    full_name: str | None = None
    role: str
    joined_at: datetime | None = None


class SpaceMembersPublic(SQLModel):
    data: list[SpaceMemberPublic]
    count: int


class SpaceInviteCreate(SQLModel):
    role: str = Field(default="viewer", min_length=1, max_length=20)
    email: EmailStr | None = None
    expires_in_days: int = Field(default=7, ge=1, le=30)


class SpaceInvitePublic(SQLModel):
    invite_code: str
    role: str
    status: str
    expires_at: datetime | None = None


class AcceptInviteRequest(SQLModel):
    invite_code: str = Field(min_length=4, max_length=2048)


class AcceptInviteResponse(SQLModel):
    message: str
    space_id: uuid.UUID
    role: str


class SpaceMemberRoleUpdate(SQLModel):
    role: str = Field(min_length=1, max_length=20)


class ResponseMessage(SQLModel):
    message: str


def _space_to_public(space: CollabSpace, *, current_user_role: str, owner: User) -> SpacePublic:
    return SpacePublic(
        id=space.public_id,
        name=space.name,
        description=space.description,
        owner_id=owner.public_id,
        storage_quota=space.storage_quota,
        used_storage=space.used_storage,
        current_user_role=current_user_role,
        created_at=space.created_at,
        updated_at=space.updated_at,
    )


def _get_space_by_public_id_or_404(session: SessionDep, space_id: uuid.UUID) -> CollabSpace:
    space = session.exec(select(CollabSpace).where(CollabSpace.public_id == space_id)).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


def _generate_unique_invite_code(session: SessionDep, *, space_internal_id: int) -> str:
    for _ in range(20):
        invite_code = uuid.uuid4().hex[:12]
        existing = session.exec(
            select(SpaceInvite).where(
                SpaceInvite.space_id == space_internal_id,
                SpaceInvite.invite_code == invite_code,
            )
        ).first()
        if not existing:
            return invite_code
    raise HTTPException(status_code=500, detail="Failed to generate unique invite code")


def _accept_invite_from_db_row(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    invite_code: str,
) -> AcceptInviteResponse:
    invite = session.exec(
        select(SpaceInvite).where(SpaceInvite.invite_code == invite_code)
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite is not pending")

    now = datetime.now(timezone.utc)
    if invite.expires_at and invite.expires_at <= now:
        invite.status = "expired"
        invite.updated_at = get_datetime_utc()
        session.add(invite)
        session.commit()
        raise HTTPException(status_code=400, detail="Invite is expired")

    existing_member = session.exec(
        select(CollabSpaceMember).where(
            CollabSpaceMember.space_id == invite.space_id,
            CollabSpaceMember.user_id == current_user.id,
        )
    ).first()
    if not existing_member:
        member = CollabSpaceMember(
            space_id=invite.space_id,
            user_id=current_user.id,
            role=invite.role,
        )
        session.add(member)

    invite.status = "accepted"
    invite.updated_at = get_datetime_utc()
    session.add(invite)
    session.commit()

    space = session.get(CollabSpace, invite.space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return AcceptInviteResponse(
        message="Invite accepted",
        space_id=space.public_id,
        role=invite.role,
    )


def _accept_stateless_invite_parsed(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    parsed: StatelessInvitePayload,
) -> AcceptInviteResponse:
    space = session.exec(
        select(CollabSpace).where(CollabSpace.public_id == parsed.space_public_id)
    ).first()
    if not space:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")
    if space.invite_version != parsed.ver:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")

    role = parsed.role.strip().lower()
    if role not in SPACE_VALID_ROLES or role == SPACE_ROLE_OWNER:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")

    existing_member = session.exec(
        select(CollabSpaceMember).where(
            CollabSpaceMember.space_id == space.id,
            CollabSpaceMember.user_id == current_user.id,
        )
    ).first()
    if existing_member:
        return AcceptInviteResponse(
            message="Already a member",
            space_id=space.public_id,
            role=existing_member.role,
        )

    member = CollabSpaceMember(
        space_id=space.id,
        user_id=current_user.id,
        role=role,
    )
    session.add(member)
    session.commit()
    return AcceptInviteResponse(
        message="Invite accepted",
        space_id=space.public_id,
        role=role,
    )


@router.post("/", response_model=SpacePublic)
def create_space(
    *,
    session: SessionDep,
    body: SpaceCreate,
    current_user: CurrentUser,
) -> SpacePublic:
    quota = (
        body.storage_quota
        if body.storage_quota is not None
        else DEFAULT_SPACE_STORAGE_QUOTA
    )

    now = get_datetime_utc()
    space = CollabSpace(
        name=body.name.strip(),
        description=(body.description or "").strip() or None,
        owner_id=current_user.id,
        storage_quota=quota,
        used_storage=0,
        created_at=now,
        updated_at=now,
    )
    session.add(space)
    session.commit()
    session.refresh(space)

    owner_member = CollabSpaceMember(
        space_id=space.id,
        user_id=current_user.id,
        role=SPACE_ROLE_OWNER,
    )
    session.add(owner_member)
    session.commit()

    return _space_to_public(space, current_user_role=SPACE_ROLE_OWNER, owner=current_user)


@router.get("/", response_model=SpacesPublic)
def list_spaces(
    *,
    session: SessionDep,
    current_user: CurrentUser,
) -> SpacesPublic:
    memberships = session.exec(
        select(CollabSpaceMember).where(CollabSpaceMember.user_id == current_user.id)
    ).all()

    results: list[SpacePublic] = []
    for member in memberships:
        space = session.get(CollabSpace, member.space_id)
        if not space:
            continue
        owner = session.get(User, space.owner_id)
        if not owner:
            continue
        results.append(
            _space_to_public(space, current_user_role=member.role, owner=owner)
        )
    return SpacesPublic(data=results, count=len(results))


@router.get("/{space_id}", response_model=SpacePublic)
def get_space_detail(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    current_user: CurrentUser,
) -> SpacePublic:
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    owner = session.get(User, space.owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Space owner not found")
    return _space_to_public(space, current_user_role=member.role, owner=owner)


@router.get("/{space_id}/members", response_model=SpaceMembersPublic)
def list_space_members(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    current_user: CurrentUser,
) -> SpaceMembersPublic:
    space = _get_space_by_public_id_or_404(session, space_id)
    _ = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )

    members = session.exec(
        select(CollabSpaceMember).where(CollabSpaceMember.space_id == space.id)
    ).all()
    data: list[SpaceMemberPublic] = []
    for m in members:
        user = session.get(User, m.user_id)
        if not user:
            continue
        data.append(
            SpaceMemberPublic(
                user_id=user.public_id,
                email=user.email,
                full_name=user.full_name,
                role=m.role,
                joined_at=m.joined_at,
            )
        )
    return SpaceMembersPublic(data=data, count=len(data))


@router.post("/{space_id}/invite", response_model=SpaceInvitePublic)
def create_space_invite(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    body: SpaceInviteCreate,
    current_user: CurrentUser,
) -> SpaceInvitePublic:
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    if member.role not in SPACE_INVITE_ROLES:
        raise HTTPException(status_code=403, detail="Current role cannot invite members")

    role = body.role.strip().lower()
    if role not in SPACE_VALID_ROLES or role == SPACE_ROLE_OWNER:
        raise HTTPException(status_code=400, detail="Invite role must be editor or viewer")

    now = get_datetime_utc()
    expires_at = now + timedelta(days=body.expires_in_days)
    invite_code = _generate_unique_invite_code(session, space_internal_id=space.id)

    invite = SpaceInvite(
        space_id=space.id,
        email=body.email,
        invite_code=invite_code,
        role=role,
        inviter_id=current_user.id,
        status="pending",
        expires_at=expires_at,
        created_at=now,
        updated_at=now,
    )
    session.add(invite)
    session.commit()
    return SpaceInvitePublic(
        invite_code=invite.invite_code,
        role=invite.role,
        status=invite.status,
        expires_at=invite.expires_at,
    )


@router.post("/{space_id}/invite/link", response_model=SpaceInvitePublic)
def create_space_invite_link(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    body: SpaceInviteCreate,
    current_user: CurrentUser,
) -> SpaceInvitePublic:
    """
    生成无状态邀请令牌（不写 space_invites 表）；适合高频分享链接。
    """
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    if member.role not in SPACE_INVITE_ROLES:
        raise HTTPException(status_code=403, detail="Current role cannot invite members")

    role = body.role.strip().lower()
    if role not in SPACE_VALID_ROLES or role == SPACE_ROLE_OWNER:
        raise HTTPException(status_code=400, detail="Invite role must be editor or viewer")

    token, expires_at = mint_stateless_invite_token(
        space_public_id=space.public_id,
        role=role,
        invite_version=space.invite_version,
        expires_in_days=body.expires_in_days,
    )
    return SpaceInvitePublic(
        invite_code=token,
        role=role,
        status="active",
        expires_at=expires_at,
    )


@router.post("/{space_id}/invite/reset", response_model=ResponseMessage)
def reset_space_invites(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    current_user: CurrentUser,
) -> ResponseMessage:
    """
    Owner：递增 invite_version（使旧无状态令牌失效），并将本空间 pending 表邀请置为 cancelled。
    """
    space = _get_space_by_public_id_or_404(session, space_id)
    actor = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    if actor.role != SPACE_ROLE_OWNER:
        raise HTTPException(status_code=403, detail="Only owner can reset invites")

    now = get_datetime_utc()
    space.invite_version = space.invite_version + 1
    space.updated_at = now
    session.add(space)

    pending = session.exec(
        select(SpaceInvite).where(
            SpaceInvite.space_id == space.id,
            SpaceInvite.status == "pending",
        )
    ).all()
    for inv in pending:
        inv.status = "cancelled"
        inv.updated_at = now
        session.add(inv)

    session.commit()
    return ResponseMessage(message="Invites reset")


@invite_router.post("/accept", response_model=AcceptInviteResponse)
def accept_space_invite(
    *,
    session: SessionDep,
    body: AcceptInviteRequest,
    current_user: CurrentUser,
) -> AcceptInviteResponse:
    code = body.invite_code.strip()
    parsed = parse_stateless_invite_token(code)
    if parsed is not None:
        return _accept_stateless_invite_parsed(
            session=session,
            current_user=current_user,
            parsed=parsed,
        )
    return _accept_invite_from_db_row(
        session=session,
        current_user=current_user,
        invite_code=code,
    )


@router.patch(
    "/{space_id}/members/{member_user_id}",
    response_model=ResponseMessage,
)
def update_space_member_role(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    member_user_id: uuid.UUID,
    body: SpaceMemberRoleUpdate,
    current_user: CurrentUser,
) -> ResponseMessage:
    """
    Owner 修改空间成员角色（仅 editor/viewer）。
    """
    space = _get_space_by_public_id_or_404(session, space_id)
    actor_member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    if actor_member.role != SPACE_ROLE_OWNER:
        raise HTTPException(status_code=403, detail="Current role cannot manage members")

    target_user = session.exec(select(User).where(User.public_id == member_user_id)).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_member = session.exec(
        select(CollabSpaceMember).where(
            CollabSpaceMember.space_id == space.id,
            CollabSpaceMember.user_id == target_user.id,
        )
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Space member not found")

    new_role = body.role.strip().lower()
    if new_role not in SPACE_VALID_ROLES or new_role == SPACE_ROLE_OWNER:
        raise HTTPException(status_code=400, detail="Role must be editor or viewer")
    if target_member.role == SPACE_ROLE_OWNER:
        raise HTTPException(status_code=400, detail="Owner role cannot be updated")

    target_member.role = new_role
    session.add(target_member)
    session.commit()
    return ResponseMessage(message="Member role updated")


@router.delete(
    "/{space_id}/members/{member_user_id}",
    response_model=ResponseMessage,
)
def remove_space_member(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    member_user_id: uuid.UUID,
    current_user: CurrentUser,
) -> ResponseMessage:
    """
    Owner 移除空间成员。
    """
    space = _get_space_by_public_id_or_404(session, space_id)
    actor_member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    if actor_member.role != SPACE_ROLE_OWNER:
        raise HTTPException(status_code=403, detail="Current role cannot manage members")

    target_user = session.exec(select(User).where(User.public_id == member_user_id)).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_member = session.exec(
        select(CollabSpaceMember).where(
            CollabSpaceMember.space_id == space.id,
            CollabSpaceMember.user_id == target_user.id,
        )
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Space member not found")
    if target_member.role == SPACE_ROLE_OWNER:
        raise HTTPException(status_code=400, detail="Owner cannot be removed")

    session.delete(target_member)
    session.commit()
    return ResponseMessage(message="Member removed")
