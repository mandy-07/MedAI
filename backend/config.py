from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ==========================================================
    # Project Configuration
    # ==========================================================
    PROJECT_NAME: str
    PROJECT_VERSION: str
    ENVIRONMENT: str
    DEBUG: bool

    # ==========================================================
    # API Configuration
    # ==========================================================
    API_V1_PREFIX: str
    HOST: str
    PORT: int

    # ==========================================================
    # Database
    # ==========================================================
    MONGODB_URI: str
    DATABASE_NAME: str
    GRIDFS_BUCKET: str

    # ==========================================================
    # LLM Configuration
    # ==========================================================
    GROQ_API_KEY: str
    LLM_MODEL: str

    # ==========================================================
    # Model Configuration
    # ==========================================================
    MODEL_PATH: Path
    CLASS_NAMES_PATH: Path
    DEVICE: str

    # ==========================================================
    # Image Configuration
    # ==========================================================
    IMAGE_SIZE: int
    MAX_UPLOAD_SIZE: int

    # ==========================================================
    # Storage Directories
    # ==========================================================
    UPLOAD_DIR: Path
    GRADCAM_DIR: Path
    TEMP_DIR: Path
    REPORTS_DIR: Path

    # ==========================================================
    # Prediction Configuration
    # ==========================================================
    CONFIDENCE_THRESHOLD: float
    TOP_K_PREDICTIONS: int

    # ==========================================================
    # Report Generation
    # ==========================================================
    REPORT_TEMPLATE: Path

    # ==========================================================
    # Logging
    # ==========================================================
    LOG_LEVEL: str
    LOG_FILE: Path

    # ==========================================================
    # Pydantic Settings Configuration
    # ==========================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,
    )


# ==========================================================
# Safe Settings Initialization
# ==========================================================

try:
    settings = Settings()
except Exception as e:
    raise RuntimeError(
        f"[CONFIG ERROR] Failed to load environment variables: {e}"
    )


# ==========================================================
# Runtime Directory Initialization
# ==========================================================

def initialize_directories() -> None:
    """
    Create required runtime directories if they do not exist.
    Safe to call multiple times.
    """

    directories = [
        settings.UPLOAD_DIR,
        settings.GRADCAM_DIR,
        settings.REPORTS_DIR,
        settings.TEMP_DIR,
        settings.LOG_FILE.parent,
    ]

    for directory in directories:
        if directory:
            directory.mkdir(parents=True, exist_ok=True)