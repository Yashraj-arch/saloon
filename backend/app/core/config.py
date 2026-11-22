import os
import urllib.parse
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lux Multi-Tenant CRM SaaS"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_jwt_key_salon_crm_2026_x92837482_luxe_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour for secure sessions
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Environment & Security
    ENVIRONMENT: str = "development"  # development, production
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    
    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_GLOBAL_PER_MINUTE: int = 120

    # MySQL / TiDB Cloud Database Config
    MYSQL_USER: str = "2yaWXp5KdkviUv2.root"
    MYSQL_PASSWORD: str = "G7pCxOYxaabCeN0O"
    MYSQL_HOST: str = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
    MYSQL_PORT: int = 4000
    MYSQL_DB: str = "saloon_db"

    # Default to production TiDB Cloud Serverless URI
    DATABASE_URL: Optional[str] = "mysql+aiomysql://2yaWXp5KdkviUv2.root:G7pCxOYxaabCeN0O@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/saloon_db"

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(__file__), "../../../backend/.env"),
            os.path.join(os.path.dirname(__file__), "../../.env"),
            ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            # Normalize driver for async engine
            if url.startswith("mysql://"):
                url = "mysql+aiomysql://" + url[len("mysql://"):]
            elif url.startswith("mysql+pymysql://"):
                url = "mysql+aiomysql://" + url[len("mysql+pymysql://"):]
            return url
        # URL encode password to handle special characters such as '@', ':', '/' safely
        encoded_password = urllib.parse.quote_plus(self.MYSQL_PASSWORD) if self.MYSQL_PASSWORD else ""
        pwd_part = f":{encoded_password}" if encoded_password else ""
        return f"mysql+aiomysql://{self.MYSQL_USER}{pwd_part}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

settings = Settings()
