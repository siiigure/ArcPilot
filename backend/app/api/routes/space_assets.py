"""
协作空间资源接口（方案 A：预签名 + 直传 + 完成落库）。

当前实现：
- 预签名返回短期 JWT 与 PUT 上传地址（本机落盘模拟对象存储）。
- 完成接口校验文件大小与成员身份后写入 `SpaceAsset` 并更新配额。
"""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlmodel import Field, SQLModel, select

from app.api.deps import CurrentUser, SessionDep
from app.core.collab_permissions import (
    SPACE_UPLOAD_ROLES,
    can_delete_asset,
    ensure_space_member_role,
    get_current_space_member,
)
from app.core.config import settings
from app.core.space_asset_upload import (
    SpaceAssetUploadClaims,
    absolute_path_for_storage_key,
    build_storage_key,
    create_staging_upload_token,
    decode_staging_upload_token,
    mime_to_asset_type,
)
from app.models import CollabSpace, SpaceAsset, User
from app.models.common import get_datetime_utc

router = APIRouter(prefix="/spaces", tags=["spaces"])


class AssetPresignRequest(SQLModel):
    """预签名请求：与文档约定一致。"""

    logical_name: str = Field(min_length=1, max_length=500)
    mime_type: str = Field(min_length=1, max_length=255)
    size: int = Field(ge=1, le=50 * 1024 * 1024 * 1024)  # 单文件上限 50GiB（可按产品调整）


class AssetMeta(SQLModel):
    logical_name: str
    version: int
    storage_key: str
    size: int


class AssetPresignResponse(SQLModel):
    """预签名响应：前端用 upload_url 发起 PUT，再调用 complete。"""

    upload_url: str
    upload_method: str = "PUT"
    upload_token: str
    asset_meta: AssetMeta


class AssetCompleteRequest(SQLModel):
    """完成上传：携带与预签名相同的 JWT，用于二次校验与防篡改。"""

    upload_token: str = Field(min_length=10)
    type: str | None = Field(default=None, max_length=50)


class AssetPublic(SQLModel):
    """列表/详情返回给前端的资源结构。"""

    id: int
    logical_name: str
    version: int
    type: str
    size: int
    storage_key: str
    uploader_id: uuid.UUID
    created_at: datetime | None = None


class AssetsPublic(SQLModel):
    data: list[AssetPublic]
    count: int


def _get_space_by_public_id_or_404(session: SessionDep, space_id: uuid.UUID) -> CollabSpace:
    space = session.exec(select(CollabSpace).where(CollabSpace.public_id == space_id)).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


def _asset_to_public(asset: SpaceAsset, uploader: User) -> AssetPublic:
    if asset.id is None:
        raise HTTPException(status_code=500, detail="Asset id not set")
    return AssetPublic(
        id=asset.id,
        logical_name=asset.logical_name,
        version=asset.version,
        type=asset.type,
        size=asset.size,
        storage_key=asset.storage_key,
        uploader_id=uploader.public_id,
        created_at=asset.created_at,
    )


@router.put("/assets/upload/{token}")
async def upload_staged_asset(request: Request, token: str) -> Response:
    """
    直传落盘（模拟对象存储 PUT）。

    注意：此路由使用 JWT 鉴权，不依赖登录 Bearer；请勿在日志中打印完整 token。
    """
    claims = decode_staging_upload_token(token)
    body = await request.body()
    if len(body) != claims.expected_size:
        raise HTTPException(
            status_code=400,
            detail="Uploaded size does not match declared size",
        )

    path = absolute_path_for_storage_key(claims.storage_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return Response(status_code=204)


@router.post("/{space_id}/assets/presign", response_model=AssetPresignResponse)
def presign_space_asset_upload(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    body: AssetPresignRequest,
    current_user: CurrentUser,
) -> AssetPresignResponse:
    """为指定空间生成上传预检信息（配额 + 版本号 + 上传 JWT）。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    ensure_space_member_role(
        member,
        SPACE_UPLOAD_ROLES,
        action="upload assets",
    )

    if space.used_storage + body.size > space.storage_quota:
        raise HTTPException(status_code=413, detail="Storage quota exceeded")

    max_version = session.exec(
        select(func.max(SpaceAsset.version)).where(
            SpaceAsset.space_id == space.id,
            SpaceAsset.logical_name == body.logical_name,
            SpaceAsset.is_deleted == False,  # noqa: E712
        )
    ).first()
    next_version = int(max_version or 0) + 1

    storage_key = build_storage_key(
        space_public_id=space.public_id,
        logical_name=body.logical_name,
        version=next_version,
    )

    token = create_staging_upload_token(
        space_internal_id=space.id,
        space_public_id=space.public_id,
        storage_key=storage_key,
        logical_name=body.logical_name,
        version=next_version,
        expected_size=body.size,
        uploader_id=current_user.id,
        mime_type=body.mime_type,
    )

    upload_url = f"{settings.API_V1_STR}/spaces/assets/upload/{token}"
    return AssetPresignResponse(
        upload_url=upload_url,
        upload_method="PUT",
        upload_token=token,
        asset_meta=AssetMeta(
            logical_name=body.logical_name,
            version=next_version,
            storage_key=storage_key,
            size=body.size,
        ),
    )


@router.post("/{space_id}/assets/complete", response_model=AssetPublic)
def complete_space_asset_upload(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    body: AssetCompleteRequest,
    current_user: CurrentUser,
) -> AssetPublic:
    """上传完成后写入数据库并扣减配额（服务端二次校验）。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )
    ensure_space_member_role(
        member,
        SPACE_UPLOAD_ROLES,
        action="complete asset upload",
    )

    claims = decode_staging_upload_token(body.upload_token)
    if claims.space_public_id != space.public_id:
        raise HTTPException(status_code=400, detail="Upload token does not match space")
    if claims.uploader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Upload token does not match current user")

    path = absolute_path_for_storage_key(claims.storage_key)
    if not path.is_file():
        raise HTTPException(status_code=400, detail="Uploaded file not found on server")
    actual_size = path.stat().st_size
    if actual_size != claims.expected_size:
        raise HTTPException(status_code=400, detail="Uploaded file size mismatch")

    if space.used_storage + actual_size > space.storage_quota:
        raise HTTPException(status_code=413, detail="Storage quota exceeded")

    asset_type = (
        body.type.strip().lower()
        if body.type
        else mime_to_asset_type(claims.mime_type)
    )

    asset = SpaceAsset(
        space_id=space.id,
        uploader_id=current_user.id,
        logical_name=claims.logical_name,
        version=claims.version,
        type=asset_type,
        storage_key=claims.storage_key,
        size=actual_size,
        is_deleted=False,
        created_at=get_datetime_utc(),
    )
    session.add(asset)

    space.used_storage += actual_size
    space.updated_at = get_datetime_utc()
    session.add(space)
    session.commit()
    session.refresh(asset)

    uploader = session.get(User, current_user.id)
    if not uploader:
        raise HTTPException(status_code=404, detail="User not found")
    return _asset_to_public(asset, uploader)


@router.get("/{space_id}/assets", response_model=AssetsPublic)
def list_space_assets(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    current_user: CurrentUser,
    all_versions: bool = False,
) -> AssetsPublic:
    """列出空间资源；默认仅返回每个 logical_name 的最新版本。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    _ = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )

    rows = session.exec(
        select(SpaceAsset)
        .where(
            SpaceAsset.space_id == space.id,
            SpaceAsset.is_deleted == False,  # noqa: E712
        )
        .order_by(SpaceAsset.logical_name.asc(), SpaceAsset.version.desc())
    ).all()

    if all_versions:
        picked = list(rows)
    else:
        picked_map: dict[str, SpaceAsset] = {}
        for a in rows:
            if a.logical_name not in picked_map:
                picked_map[a.logical_name] = a
        picked = list(picked_map.values())

    data: list[AssetPublic] = []
    for asset in picked:
        uploader = session.get(User, asset.uploader_id) if asset.uploader_id else None
        if not uploader:
            continue
        data.append(_asset_to_public(asset, uploader))
    return AssetsPublic(data=data, count=len(data))


@router.get("/{space_id}/assets/{asset_id}")
def download_space_asset(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    asset_id: int,
    current_user: CurrentUser,
) -> FileResponse:
    """下载/预览资源（本机文件返回）。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    _ = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )

    asset = session.get(SpaceAsset, asset_id)
    if (
        not asset
        or asset.space_id != space.id
        or asset.is_deleted
    ):
        raise HTTPException(status_code=404, detail="Asset not found")

    path = absolute_path_for_storage_key(asset.storage_key)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Asset file missing on server")

    return FileResponse(
        path=str(path),
        filename=asset.logical_name,
    )


@router.delete("/{space_id}/assets/{asset_id}")
def delete_space_asset(
    *,
    session: SessionDep,
    space_id: uuid.UUID,
    asset_id: int,
    current_user: CurrentUser,
) -> dict[str, str]:
    """软删除资源并尽量物理删除文件，扣减配额。"""
    space = _get_space_by_public_id_or_404(session, space_id)
    member = get_current_space_member(
        session,
        current_user,
        space.id,
        raise_as_not_found=True,
    )

    asset = session.get(SpaceAsset, asset_id)
    if (
        not asset
        or asset.space_id != space.id
        or asset.is_deleted
    ):
        raise HTTPException(status_code=404, detail="Asset not found")

    if not can_delete_asset(
        role=member.role,
        current_user_id=current_user.id,
        uploader_id=asset.uploader_id,
    ):
        raise HTTPException(status_code=403, detail="Current role cannot delete this asset")

    now = get_datetime_utc()
    asset.is_deleted = True
    asset.deleted_at = now
    asset.deleted_by_user_id = current_user.id
    session.add(asset)

    path = absolute_path_for_storage_key(asset.storage_key)
    try:
        if path.is_file():
            path.unlink()
    except OSError:
        # 物理删除失败时仍保留软删与配额扣减，生产环境可记录日志/异步重试
        pass

    space.used_storage = max(space.used_storage - asset.size, 0)
    space.updated_at = now
    session.add(space)
    session.commit()
    return {"message": "Asset deleted"}
