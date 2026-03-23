import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# lee de la variable de entorno DATABASE_URL que Docker inyecta.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@catalog-db:5432/catalogdb"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()