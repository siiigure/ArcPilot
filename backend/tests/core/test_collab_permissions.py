from fastapi import HTTPException
from sqlmodel import Session

from app.core.collab_permissions import (
    SPACE_ROLE_EDITOR,
    SPACE_ROLE_OWNER,
    SPACE_ROLE_VIEWER,
    can_delete_asset,
    ensure_space_member_role,
    get_current_space_member,
)
from app.crud import create_user
from app.models import CollabSpace, CollabSpaceMember, UserCreate
from tests.utils.utils import random_email


def test_get_current_space_member_success(db: Session) -> None:
    owner = create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password="testpassword123",
            full_name="Space Owner",
        ),
    )
    space = CollabSpace(
        name="协作空间A",
        description="测试空间",
        owner_id=owner.id,
        storage_quota=1024,
        used_storage=0,
    )
    db.add(space)
    db.commit()
    db.refresh(space)

    member = CollabSpaceMember(
        space_id=space.id,
        user_id=owner.id,
        role=SPACE_ROLE_OWNER,
    )
    db.add(member)
    db.commit()

    result = get_current_space_member(db, owner, space.id)
    assert result.user_id == owner.id
    assert result.role == SPACE_ROLE_OWNER


def test_get_current_space_member_raises_403_when_not_member(db: Session) -> None:
    owner = create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password="testpassword123",
            full_name="Space Owner",
        ),
    )
    stranger = create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password="testpassword123",
            full_name="Space Stranger",
        ),
    )
    space = CollabSpace(
        name="协作空间B",
        owner_id=owner.id,
        storage_quota=1024,
        used_storage=0,
    )
    db.add(space)
    db.commit()
    db.refresh(space)

    db.add(
        CollabSpaceMember(
            space_id=space.id,
            user_id=owner.id,
            role=SPACE_ROLE_OWNER,
        )
    )
    db.commit()

    try:
        get_current_space_member(db, stranger, space.id)
        raise AssertionError("Expected HTTPException was not raised")
    except HTTPException as exc:
        assert exc.status_code == 403


def test_ensure_space_member_role_raises_403_for_viewer(db: Session) -> None:
    viewer = create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password="testpassword123",
            full_name="Space Viewer",
        ),
    )
    space = CollabSpace(
        name="协作空间C",
        owner_id=viewer.id,
        storage_quota=1024,
        used_storage=0,
    )
    db.add(space)
    db.commit()
    db.refresh(space)

    member = CollabSpaceMember(
        space_id=space.id,
        user_id=viewer.id,
        role=SPACE_ROLE_VIEWER,
    )

    try:
        ensure_space_member_role(
            member,
            allowed_roles={SPACE_ROLE_OWNER, SPACE_ROLE_EDITOR},
            action="upload assets",
        )
        raise AssertionError("Expected HTTPException was not raised")
    except HTTPException as exc:
        assert exc.status_code == 403


def test_can_delete_asset_by_role_rules() -> None:
    assert can_delete_asset(
        role=SPACE_ROLE_OWNER,
        current_user_id=1,
        uploader_id=2,
    )
    assert can_delete_asset(
        role=SPACE_ROLE_EDITOR,
        current_user_id=1,
        uploader_id=1,
    )
    assert not can_delete_asset(
        role=SPACE_ROLE_EDITOR,
        current_user_id=1,
        uploader_id=2,
    )
    assert not can_delete_asset(
        role=SPACE_ROLE_VIEWER,
        current_user_id=1,
        uploader_id=1,
    )
