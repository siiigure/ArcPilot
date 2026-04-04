"""
协作空间无状态邀请令牌：HMAC-SHA256 + 传输编码（cs1 前缀 + URL-safe Base64）。

与 `collab_spaces.invite_version` 配合：重置邀请时版本递增，旧令牌作废。
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.core.config import settings

TOKEN_TYP = "cs_inv_v1"
TOKEN_PREFIX = "cs1"
CLOCK_SKEW_SECONDS = 120


def _invite_hmac_secret() -> bytes:
    if settings.COLLAB_INVITE_HMAC_SECRET:
        return settings.COLLAB_INVITE_HMAC_SECRET.encode("utf-8")
    return hashlib.sha256(
        (settings.SECRET_KEY + ":collab-invite-hmac").encode("utf-8")
    ).digest()


def _canonical_payload(
    *,
    sid: uuid.UUID,
    role: str,
    exp: int,
    ver: int,
) -> str:
    obj = {
        "exp": exp,
        "role": role,
        "sid": str(sid),
        "typ": TOKEN_TYP,
        "ver": ver,
    }
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


@dataclass(frozen=True)
class StatelessInvitePayload:
    space_public_id: uuid.UUID
    role: str
    ver: int
    expires_at: datetime


def mint_stateless_invite_token(
    *,
    space_public_id: uuid.UUID,
    role: str,
    invite_version: int,
    expires_in_days: int,
) -> tuple[str, datetime]:
    """
    签发无状态邀请令牌。expires_in_days 与现有表驱动邀请上限一致（1–30）。
    """
    secret = _invite_hmac_secret()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=expires_in_days)
    exp = int(expires_at.timestamp())
    body = _canonical_payload(
        sid=space_public_id, role=role, exp=exp, ver=invite_version
    ).encode("utf-8")
    sig = hmac.new(secret, body, hashlib.sha256).digest()
    raw = body + sig
    token = f"{TOKEN_PREFIX}{_b64url_encode(raw)}"
    return token, expires_at


def parse_stateless_invite_token(token: str) -> StatelessInvitePayload | None:
    """
    校验无状态邀请令牌。失败返回 None（调用方再尝试表驱动邀请码）。
    """
    t = token.strip()
    if not t.startswith(TOKEN_PREFIX):
        return None
    b64 = t[len(TOKEN_PREFIX) :]
    if not b64:
        return None
    try:
        raw = _b64url_decode(b64)
    except Exception:
        return None
    if len(raw) < 33:
        return None
    body, sig = raw[:-32], raw[-32:]
    secret = _invite_hmac_secret()
    expected = hmac.new(secret, body, hashlib.sha256).digest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        obj = json.loads(body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    if obj.get("typ") != TOKEN_TYP:
        return None
    try:
        sid = uuid.UUID(str(obj.get("sid")))
    except (ValueError, TypeError):
        return None
    role = obj.get("role")
    if not isinstance(role, str):
        return None
    ver = obj.get("ver")
    if type(ver) is not int:
        return None
    exp = obj.get("exp")
    if type(exp) is not int:
        return None

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if now_ts > exp + CLOCK_SKEW_SECONDS:
        return None

    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
    return StatelessInvitePayload(
        space_public_id=sid,
        role=role.lower(),
        ver=ver,
        expires_at=expires_at,
    )
