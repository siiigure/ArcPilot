"""
协作空间资源「方案 A」上传辅助逻辑。

说明：
- 生产环境可对接对象存储预签名 URL；当前实现用短期 JWT + 本机落盘模拟同一流程。
- JWT 载荷与登录 JWT 区分：使用固定 typ，避免误用。
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import ALGORITHM

# 与登录 access token 区分的声明类型，防止 token 混用
_UPLOAD_TOKEN_TYP = "space_asset_staging"


@dataclass(frozen=True, slots=True)
class SpaceAssetUploadClaims:
    """预签名上传 JWT 解码后的业务字段。"""

    space_id: int
    space_public_id: uuid.UUID
    storage_key: str
    logical_name: str
    version: int
    expected_size: int
    uploader_id: int
    mime_type: str


def _sanitize_logical_filename(name: str) -> str:
    """
    将用户文件名整理为可放入对象 key 的片段（保留中英文与常见符号）。
    """
    base = name.strip().replace("\\", "/").split("/")[-1]
    if not base:
        return "unnamed"
    # 去掉路径穿越与危险字符，避免写入奇怪路径
    base = re.sub(r"[^\w\u4e00-\u9fff.\-]", "_", base, flags=re.UNICODE)
    return base[:200] if len(base) > 200 else base


def build_storage_key(*, space_public_id: uuid.UUID, logical_name: str, version: int) -> str:
    """
    生成对象存储 key（本地模拟同样使用该字符串作为相对路径）。
    """
    safe_name = _sanitize_logical_filename(logical_name)
    folder = uuid.uuid4().hex
    return f"spaces/{space_public_id}/{folder}/v{version}-{safe_name}"


def absolute_path_for_storage_key(storage_key: str) -> Path:
    """将 storage_key 映射到本机根目录下的绝对路径。"""
    root = Path(settings.SPACE_ASSETS_LOCAL_ROOT).resolve()
    target = (root / storage_key).resolve()
    if not str(target).startswith(str(root)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid storage key",
        )
    return target


def create_staging_upload_token(
    *,
    space_internal_id: int,
    space_public_id: uuid.UUID,
    storage_key: str,
    logical_name: str,
    version: int,
    expected_size: int,
    uploader_id: int,
    mime_type: str,
) -> str:
    """签发短期上传 JWT（客户端 PUT 到 upload_url 时使用）。"""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {
        "typ": _UPLOAD_TOKEN_TYP,
        "space_id": space_internal_id,
        "space_public_id": str(space_public_id),
        "storage_key": storage_key,
        "logical_name": logical_name,
        "version": version,
        "expected_size": expected_size,
        "uploader_id": uploader_id,
        "mime_type": mime_type,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_staging_upload_token(token: str) -> SpaceAssetUploadClaims:
    """校验并解析上传 JWT。"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload token",
        ) from None
    if payload.get("typ") != _UPLOAD_TOKEN_TYP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload token type",
        )
    try:
        space_public_id = uuid.UUID(str(payload["space_public_id"]))
    except (KeyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload token payload",
        ) from exc
    try:
        return SpaceAssetUploadClaims(
            space_id=int(payload["space_id"]),
            space_public_id=space_public_id,
            storage_key=str(payload["storage_key"]),
            logical_name=str(payload["logical_name"]),
            version=int(payload["version"]),
            expected_size=int(payload["expected_size"]),
            uploader_id=int(payload["uploader_id"]),
            mime_type=str(payload["mime_type"]),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload token payload",
        ) from exc


def mime_to_asset_type(mime_type: str) -> str:
    """将 MIME 粗分为文档约定的 type 枚举。"""
    m = (mime_type or "").lower().strip()
    if m == "application/pdf":
        return "pdf"
    if m.startswith("image/"):
        return "image"
    if m in ("application/x-python", "text/x-python") or m.endswith("python"):
        return "python"
    if "geojson" in m or m in ("application/vnd.google-earth.kml+xml",):
        return "gis"
    return "other"
