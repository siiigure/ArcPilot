import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

from app import crud
from app.api.routes.spaces import (
    AcceptInviteRequest,
    SpaceCreate,
    SpaceInviteCreate,
    SpaceMemberRoleUpdate,
    accept_space_invite,
    create_space,
    create_space_invite,
    create_space_invite_link,
    get_space_detail,
    list_space_members,
    list_spaces,
    remove_space_member,
    reset_space_invites,
    update_space_member_role,
)
from app.models import CollabSpace, CollabSpaceMember, SpaceInvite, User, UserCreate
from tests.utils.utils import random_email


def _create_user(db: Session) -> User:
    user = crud.create_user(
        session=db,
        user_create=UserCreate(email=random_email(), password="testpassword123"),
    )
    return user


def test_create_and_list_spaces(db: Session) -> None:
    user = _create_user(db)
    created = create_space(
        session=db,
        body=SpaceCreate(name="苏州古城保护调研", description="资料协作空间"),
        current_user=user,
    )
    assert created.name == "苏州古城保护调研"
    assert created.current_user_role == "owner"
    assert created.used_storage == 0

    listed = list_spaces(session=db, current_user=user)
    assert listed.count >= 1
    assert any(item.id == created.id for item in listed.data)


def test_get_space_detail_and_members(db: Session) -> None:
    owner = _create_user(db)
    created = create_space(
        session=db,
        body=SpaceCreate(name="仅成员可见空间"),
        current_user=owner,
    )
    detail = get_space_detail(session=db, space_id=created.id, current_user=owner)
    assert detail.id == created.id
    assert detail.owner_id == owner.public_id

    members = list_space_members(session=db, space_id=created.id, current_user=owner)
    assert members.count == 1
    assert members.data[0].role == "owner"

    # 确认 owner 成员记录被创建（数据库级检查）
    space = db.exec(
        select(CollabSpace).where(CollabSpace.public_id == created.id)
    ).first()
    assert space
    member = db.exec(
        select(CollabSpaceMember).where(
            CollabSpaceMember.space_id == space.id,
            CollabSpaceMember.user_id == owner.id,
        )
    ).first()
    assert member
    assert member.role == "owner"


def test_invite_and_accept_by_code(db: Session) -> None:
    owner = _create_user(db)
    invited_user = _create_user(db)

    created = create_space(
        session=db,
        body=SpaceCreate(name="邀请码空间"),
        current_user=owner,
    )
    invite_payload = create_space_invite(
        session=db,
        space_id=created.id,
        body=SpaceInviteCreate(role="editor", expires_in_days=7),
        current_user=owner,
    )
    assert invite_payload.role == "editor"
    invite_code = invite_payload.invite_code

    accepted = accept_space_invite(
        session=db,
        body=AcceptInviteRequest(invite_code=invite_code),
        current_user=invited_user,
    )
    assert accepted.space_id == created.id
    assert accepted.role == "editor"

    members = list_space_members(session=db, space_id=created.id, current_user=invited_user)
    assert any(m.email == invited_user.email and m.role == "editor" for m in members.data)

    invite = db.exec(select(SpaceInvite).where(SpaceInvite.invite_code == invite_code)).first()
    assert invite
    assert invite.status == "accepted"


def test_stateless_invite_link_and_accept(db: Session) -> None:
    owner = _create_user(db)
    invited_user = _create_user(db)

    created = create_space(
        session=db,
        body=SpaceCreate(name="无状态邀请空间"),
        current_user=owner,
    )
    link = create_space_invite_link(
        session=db,
        space_id=created.id,
        body=SpaceInviteCreate(role="editor", expires_in_days=7),
        current_user=owner,
    )
    assert link.invite_code.startswith("cs1")
    assert link.status == "active"

    accepted = accept_space_invite(
        session=db,
        body=AcceptInviteRequest(invite_code=link.invite_code),
        current_user=invited_user,
    )
    assert accepted.space_id == created.id
    assert accepted.role == "editor"

    members = list_space_members(session=db, space_id=created.id, current_user=invited_user)
    assert any(m.email == invited_user.email and m.role == "editor" for m in members.data)


def test_stateless_invite_same_link_multi_member(db: Session) -> None:
    owner = _create_user(db)
    u1 = _create_user(db)
    u2 = _create_user(db)
    created = create_space(
        session=db,
        body=SpaceCreate(name="多用途链接"),
        current_user=owner,
    )
    link = create_space_invite_link(
        session=db,
        space_id=created.id,
        body=SpaceInviteCreate(role="viewer", expires_in_days=7),
        current_user=owner,
    )
    _ = accept_space_invite(
        session=db,
        body=AcceptInviteRequest(invite_code=link.invite_code),
        current_user=u1,
    )
    _ = accept_space_invite(
        session=db,
        body=AcceptInviteRequest(invite_code=link.invite_code),
        current_user=u2,
    )
    members = list_space_members(session=db, space_id=created.id, current_user=owner)
    assert members.count == 3


def test_reset_invites_invalidates_stateless_token(db: Session) -> None:
    owner = _create_user(db)
    invited = _create_user(db)
    created = create_space(
        session=db,
        body=SpaceCreate(name="重置后失效"),
        current_user=owner,
    )
    link = create_space_invite_link(
        session=db,
        space_id=created.id,
        body=SpaceInviteCreate(role="viewer", expires_in_days=7),
        current_user=owner,
    )
    _ = reset_space_invites(session=db, space_id=created.id, current_user=owner)

    with pytest.raises(HTTPException) as exc:
        accept_space_invite(
            session=db,
            body=AcceptInviteRequest(invite_code=link.invite_code),
            current_user=invited,
        )
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid or expired invite"


def test_owner_can_update_and_remove_member(db: Session) -> None:
    owner = _create_user(db)
    invited_user = _create_user(db)

    created = create_space(
        session=db,
        body=SpaceCreate(name="成员管理空间"),
        current_user=owner,
    )
    invite_payload = create_space_invite(
        session=db,
        space_id=created.id,
        body=SpaceInviteCreate(role="viewer", expires_in_days=7),
        current_user=owner,
    )
    _ = accept_space_invite(
        session=db,
        body=AcceptInviteRequest(invite_code=invite_payload.invite_code),
        current_user=invited_user,
    )

    msg = update_space_member_role(
        session=db,
        space_id=created.id,
        member_user_id=invited_user.public_id,
        body=SpaceMemberRoleUpdate(role="editor"),
        current_user=owner,
    )
    assert msg.message == "Member role updated"

    members = list_space_members(session=db, space_id=created.id, current_user=owner)
    assert any(m.user_id == invited_user.public_id and m.role == "editor" for m in members.data)

    removed = remove_space_member(
        session=db,
        space_id=created.id,
        member_user_id=invited_user.public_id,
        current_user=owner,
    )
    assert removed.message == "Member removed"

    members_after = list_space_members(session=db, space_id=created.id, current_user=owner)
    assert all(m.user_id != invited_user.public_id for m in members_after.data)
