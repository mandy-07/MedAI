from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ==========================================================
    # Project Configuration
    # ==========================================================
    PROJECT_NAME: str = "MedAI"
    PROJECT_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    # ==========================================================
    # API Configuration
    # ==========================================================
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 7860

    BASE_URL: str = "http://127.0.0.1:7860"

    # ==========================================================
    # Database
    # ==========================================================
    MONGODB_URI: str
    DATABASE_NAME: str = "medai"
    GRIDFS_BUCKET: str = "reports"

    # ==========================================================
    # LLM Configuration
    # ==========================================================
    GROQ_API_KEY: str
    LLM_MODEL: str = "openai/gpt-oss-120b"

    # ==========================================================
    # Model Configuration
    # ==========================================================
    MODEL_PATH: Path = Path("models/Transfer_1/efficientnet_head_best.pth")
    CLASS_NAMES_PATH: Path = Path("models/Transfer_1/class_names.json")
    DEVICE: str = "cpu"

    # ==========================================================
    # Image Configuration
    # ==========================================================
    IMAGE_SIZE: int = 224
    MAX_UPLOAD_SIZE: int = 10485760

    # ==========================================================
    # Storage Directories
    # ==========================================================
    UPLOAD_DIR: Path = Path("uploads")
    GRADCAM_DIR: Path = Path("gradcam")
    TEMP_DIR: Path = Path("temp")
    REPORTS_DIR: Path = Path("generated_reports")

    # ==========================================================
    # Prediction Configuration
    # ==========================================================
    CONFIDENCE_THRESHOLD: float = 0.60
    TOP_K_PREDICTIONS: int = 3

    # ==========================================================
    # Report Generation
    # ==========================================================
    REPORT_TEMPLATE: Path = Path("templates/report_template.html")

    # ==========================================================
    # Logging
    # ==========================================================
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Path = Path("logs/medai.log")

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