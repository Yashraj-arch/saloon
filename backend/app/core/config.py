import os
<<<<<<< Updated upstream
import urllib.parse
from typing import List, Optional
=======
from typing import Optional
from urllib.parse import quote_plus
>>>>>>> Stashed changes
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "LuxeSalon Multi-Tenant CRM SaaS"
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

    # MySQL Database Config (loaded from .env)
    MYSQL_USER: str = "root"
<<<<<<< Updated upstream
    MYSQL_PASSWORD: str = ""
=======
    MYSQL_PASSWORD: str = "Kiran@8196"
>>>>>>> Stashed changes
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_DB: str = "saloon_db"

    # Optional override URL
    DATABASE_URL: Optional[str] = None

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
            return self.DATABASE_URL
<<<<<<< Updated upstream
        # URL encode password to handle special characters such as '@', ':', '/' safely
        encoded_password = urllib.parse.quote_plus(self.MYSQL_PASSWORD) if self.MYSQL_PASSWORD else ""
        pwd_part = f":{encoded_password}" if encoded_password else ""
        return f"mysql+aiomysql://{self.MYSQL_USER}{pwd_part}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
=======
        # default to async MySQL with URL-encoded password (handling '@', ':', etc.)
        encoded_pwd = f":{quote_plus(self.MYSQL_PASSWORD)}" if self.MYSQL_PASSWORD else ""
        return f"mysql+aiomysql://{self.MYSQL_USER}{encoded_pwd}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
>>>>>>> Stashed changes

settings = Settings()
