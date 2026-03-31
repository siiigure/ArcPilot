import logging

from sqlmodel import Session, select  # type: ignore[import-not-found]

from app.core.db import engine, init_db
from app.models import Tag

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init() -> None:
    with Session(engine) as session:
        init_db(session)

        # Seed tags for community MVP.
        # This is required because the frontend "post/new" page depends on GET /tags
        # returning at least some selectable tags.
        existing_any = session.exec(select(Tag).limit(1)).first()
        if existing_any is None:
            seed_tags: list[dict[str, str | None]] = [
                {"name": "GIS 与空间分析", "slug": "gis", "category": None},
                {"name": "遥感影像", "slug": "remote", "category": None},
                {"name": "数据工程", "slug": "data", "category": None},
            ]

            for t in seed_tags:
                session.add(
                    Tag(
                        name=str(t["name"]),
                        slug=str(t["slug"]),
                        category=t["category"],
                    )
                )
            session.commit()


def main() -> None:
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
