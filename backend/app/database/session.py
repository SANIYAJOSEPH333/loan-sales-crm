import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Normalize database URL (e.g. Render/Heroku postgres:// -> postgresql://)
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Detect production environment (e.g. Render, or explicit ENVIRONMENT=production)
is_production = bool(
    os.getenv("RENDER")
    or os.getenv("ENVIRONMENT", "").lower() in ("production", "prod")
)

# Connect to PostgreSQL with fallback to SQLite only for local development
try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL database.")
except Exception as e:
    if is_production:
        logger.critical(f"FATAL: Could not connect to PostgreSQL in production ({e}). SQLite fallback is disabled in production.")
        raise RuntimeError(f"Production database connection to PostgreSQL failed: {e}") from e

    logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite local database.")
    engine = create_engine("sqlite:///./loan_sales_crm.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
