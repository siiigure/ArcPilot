import uuid

from app.core.collab_invite_token import (
    mint_stateless_invite_token,
    parse_stateless_invite_token,
)


def test_mint_and_parse_roundtrip() -> None:
    sid = uuid.uuid4()
    token, _exp = mint_stateless_invite_token(
        space_public_id=sid,
        role="viewer",
        invite_version=1,
        expires_in_days=7,
    )
    assert token.startswith("cs1")
    parsed = parse_stateless_invite_token(token)
    assert parsed is not None
    assert parsed.space_public_id == sid
    assert parsed.role == "viewer"
    assert parsed.ver == 1


def test_tampered_token_rejected() -> None:
    sid = uuid.uuid4()
    token, _exp = mint_stateless_invite_token(
        space_public_id=sid,
        role="viewer",
        invite_version=1,
        expires_in_days=7,
    )
    assert parse_stateless_invite_token(token[:-3] + "xxx") is None


def test_random_string_not_stateless() -> None:
    assert parse_stateless_invite_token("abcdef123456") is None


def test_db_style_invite_code_not_stateless() -> None:
    assert parse_stateless_invite_token("63b1970bd8f1") is None
