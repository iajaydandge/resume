from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SESSION_SECRET_KEY: str
    ENVIRONMENT: Literal["development", "production"] = "production"
    RSA_PRIVATE_KEY: str | None = None
    RSA_PUBLIC_KEY: str | None = None
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_CONF_URL: str = (
        "https://accounts.google.com/.well-known/openid-configuration"
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    @model_validator(mode="after")
    def validate_keys_in_production(self) -> Settings:
        if self.is_production:
            if not self.RSA_PRIVATE_KEY or not self.RSA_PRIVATE_KEY.strip():
                raise ValueError("RSA_PRIVATE_KEY must be configured in production mode.")
            if not self.RSA_PUBLIC_KEY or not self.RSA_PUBLIC_KEY.strip():
                raise ValueError("RSA_PUBLIC_KEY must be configured in production mode.")
        return self

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
