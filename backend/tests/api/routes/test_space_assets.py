"""
协作空间资源接口测试（直接调用路由函数，避免 TestClient 启动阻塞）。

覆盖：预签名 -> 本机写入 -> complete -> 列表。
"""

from sqlmodel import Session, select

from app import crud
from app.api.routes.space_assets import (
    AssetCompleteRequest,
    AssetPresignRequest,
    complete_space_asset_upload,
    list_space_assets,
    presign_space_asset_upload,
)
from app.api.routes.spaces import SpaceCreate, create_space
from app.core.space_asset_upload import absolute_path_for_storage_key
from app.models import CollabSpace, SpaceAsset, User, UserCreate
from tests.utils.utils import random_email


def _user(db: Session) -> User:
    return crud.create_user(
        session=db,
        user_create=UserCreate(email=random_email(), password="testpassword123"),
    )


def test_presign_manual_upload_complete_and_list(db: Session) -> None:
    owner = _user(db)
    space_pub = create_space(
        session=db,
        body=SpaceCreate(name="资源测试空间"),
        current_user=owner,
    )

    presign = presign_space_asset_upload(
        session=db,
        space_id=space_pub.id,
        body=AssetPresignRequest(
            logical_name="规范.pdf",
            mime_type="application/pdf",
            size=12,
        ),
        current_user=owner,
    )
    assert presign.asset_meta.version == 1
    assert presign.upload_token

    path = absolute_path_for_storage_key(presign.asset_meta.storage_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"0" * 12)

    completed = complete_space_asset_upload(
        session=db,
        space_id=space_pub.id,
        body=AssetCompleteRequest(upload_token=presign.upload_token),
        current_user=owner,
    )
    assert completed.logical_name == "规范.pdf"
    assert completed.size == 12

    listed = list_space_assets(
        session=db,
        space_id=space_pub.id,
        current_user=owner,
        all_versions=False,
    )
    assert listed.count == 1
    assert listed.data[0].logical_name == "规范.pdf"

    row = db.exec(select(SpaceAsset).where(SpaceAsset.id == completed.id)).first()
    assert row
    assert row.size == 12

    sp = db.exec(select(CollabSpace).where(CollabSpace.public_id == space_pub.id)).first()
    assert sp
    assert sp.used_storage == 12
