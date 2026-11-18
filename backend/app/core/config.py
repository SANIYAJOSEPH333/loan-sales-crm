from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
import os
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Loan Sales & Call Centre CRM"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "crm-super-secret-jwt-key-cloudhouse-2026-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/loan_sales_crm"
    UPLOAD_DIR: str = "storage/documents"
    MAX_FILE_SIZE_MB: int = 15

    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
