from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PredictionHistory(BaseModel):
    """
    Prediction History Schema
    """

    id: Optional[str] = None

    patient_name: str

    diagnosis: str

    predicted_class: str

    confidence: float = Field(
        ...,
        ge=0,
        le=100,
    )

    risk_level: str

    recommendation: str

    image_path: str

    gradcam_path: Optional[str] = None

    report_path: Optional[str] = None

    # Future enhancement if reports move to GridFS
    report_file_id: Optional[str] = None

    created_at: datetime