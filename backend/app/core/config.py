from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SCRUMS"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    backend_cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    backend_cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    database_url: str = "postgresql+psycopg://scrums:scrums@db:5432/scrums"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
