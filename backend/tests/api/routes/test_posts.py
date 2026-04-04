import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import random_email


def test_search_posts_title_only(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    title = f"SearchUnique-{uuid.uuid4().hex[:8]}"
    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        headers=normal_user_token_headers,
        json={"title": title, "body": "body text no match here"},
    )
    assert r.status_code == 200
    post_id = r.json()["id"]

    s = client.get(
        f"{settings.API_V1_STR}/posts/search",
        headers=normal_user_token_headers,
        params={"q": "SearchUnique", "skip": 0, "limit": 20},
    )
    assert s.status_code == 200
    ids = [p["id"] for p in s.json()]
    assert post_id in ids


def test_delete_own_post_soft(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        headers=normal_user_token_headers,
        json={"title": "ToDelete", "body": "x"},
    )
    assert r.status_code == 200
    post_id = r.json()["id"]

    d = client.delete(
        f"{settings.API_V1_STR}/posts/{post_id}",
        headers=normal_user_token_headers,
    )
    assert d.status_code == 200

    g = client.get(
        f"{settings.API_V1_STR}/posts/{post_id}",
        headers=normal_user_token_headers,
    )
    assert g.status_code == 404


def test_delete_other_user_post_forbidden(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
) -> None:
    owner_headers = authentication_token_from_email(
        client=client, email=random_email(), db=db
    )
    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        headers=owner_headers,
        json={"title": "OwnerOnly", "body": "y"},
    )
    assert r.status_code == 200
    post_id = r.json()["id"]

    d = client.delete(
        f"{settings.API_V1_STR}/posts/{post_id}",
        headers=normal_user_token_headers,
    )
    assert d.status_code == 403


def test_search_not_in_body_s1(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """S1：正文命中不应出现（仅标题）。"""
    only_in_body = f"BodyOnlyWord-{uuid.uuid4().hex[:8]}"
    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        headers=normal_user_token_headers,
        json={"title": "OtherTitle", "body": only_in_body},
    )
    assert r.status_code == 200

    s = client.get(
        f"{settings.API_V1_STR}/posts/search",
        headers=normal_user_token_headers,
        params={"q": only_in_body, "skip": 0, "limit": 20},
    )
    assert s.status_code == 200
    assert s.json() == []
