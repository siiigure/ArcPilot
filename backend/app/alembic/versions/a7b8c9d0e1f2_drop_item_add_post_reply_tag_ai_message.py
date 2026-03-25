"""Drop item; add tag, post, post_tag_link, reply, ai_session, ai_message

Revision ID: a7b8c9d0e1f2
Revises: fe56fa70289e
Create Date: 2026-03-24

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a7b8c9d0e1f2"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("item")

    op.create_table(
        "tag",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_tag_category"), "tag", ["category"], unique=False)
    op.create_index(op.f("ix_tag_slug"), "tag", ["slug"], unique=False)

    op.create_table(
        "post",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("project_geom", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["author_id"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_post_author_id"), "post", ["author_id"], unique=False)
    op.create_index(op.f("ix_post_created_at"), "post", ["created_at"], unique=False)
    op.create_index(op.f("ix_post_is_deleted"), "post", ["is_deleted"], unique=False)

    op.create_table(
        "post_tag_link",
        sa.Column("post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tag_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["post.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tag.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("post_id", "tag_id"),
    )

    op.create_table(
        "reply",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["user.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["post_id"], ["post.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reply_author_id"), "reply", ["author_id"], unique=False)
    op.create_index(op.f("ix_reply_created_at"), "reply", ["created_at"], unique=False)
    op.create_index(op.f("ix_reply_is_deleted"), "reply", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_reply_post_id"), "reply", ["post_id"], unique=False)

    op.create_table(
        "ai_session",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("environment_preset", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_session_created_at"), "ai_session", ["created_at"], unique=False
    )
    op.create_index(
        op.f("ix_ai_session_user_id"), "ai_session", ["user_id"], unique=False
    )

    op.create_table(
        "ai_message",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("instant_override", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["ai_session.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_message_created_at"), "ai_message", ["created_at"], unique=False
    )
    op.create_index(
        op.f("ix_ai_message_session_id"), "ai_message", ["session_id"], unique=False
    )
    op.create_index(op.f("ix_ai_message_role"), "ai_message", ["role"], unique=False)


def downgrade() -> None:
    op.drop_table("ai_message")
    op.drop_table("ai_session")
    op.drop_table("reply")
    op.drop_table("post_tag_link")
    op.drop_table("post")
    op.drop_table("tag")

    op.create_table(
        "item",
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
