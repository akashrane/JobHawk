from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # LLM providers
    groq_api_key: str = ""
    google_api_key: str = ""
    openrouter_api_key: str = ""

    # Job sources
    rapidapi_key: str = ""
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""

    # Email
    resend_api_key: str = ""
    notification_email: str = ""

    # App
    environment: str = "development"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
