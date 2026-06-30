import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base

# Defaults to a local SQLite file so this runs with ZERO extra setup.
# For production, set DATABASE_URL to a Postgres connection string, e.g.:
#   postgresql://user:password@localhost:5432/linkedpilot
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./linkedpilot.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
