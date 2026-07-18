from datetime import date, datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


class PatientInfo(BaseModel):
    """
    Patient information included in the medical report.
    """

    patient_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Patient's full name.",
        example="John Doe",
    )

    age: int = Field(
        ...,
        ge=0,
        le=120,
        description="Patient's age in years.",
        example=35,
    )

    gender: Literal[
        "Male",
        "Female",
        "Other",
    ] = Field(
        ...,
        description="Patient's gender.",
        example="Male",
    )

    examination_date: date = Field(
        default_factory=date.today,
        description="Date of examination.",
    )


class PredictionInfo(BaseModel):
    """
    AI prediction details used in the report.
    """

    diagnosis: str = Field(
        ...,
        description="Final diagnosis displayed to the patient.",
        example="Pneumonia",
    )

    predicted_class: str = Field(
        ...,
        description="Original class predicted by the AI model.",
        example="Bacterial Pneumonia",
    )

    confidence: float = Field(
        ...,
        ge=0,
        le=100,
        description="Prediction confidence (0-100%).",
        example=96.74,
    )

    risk_level: str = Field(
        ...,
        description="Medical risk assessment.",
        example="High",
    )

    recommendation: str = Field(
        ...,
        description="Recommended medical action.",
        example="Consult a healthcare professional immediately.",
    )

    bacterial_probability: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
        description="Probability of Bacterial Pneumonia.",
        example=81.32,
    )

    viral_probability: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
        description="Probability of Viral Pneumonia.",
        example=18.68,
    )


class ReportRequest(BaseModel):
    """
    Request payload for generating a medical report.
    """

    patient: PatientInfo

    prediction: PredictionInfo

    original_image_path: Optional[str] = Field(
        default=None,
        description="Optional path or URL of the uploaded X-ray image.",
        example="https://medai-0w3x.onrender.com/uploads/sample_xray.png",
    )

    gradcam_url: Optional[str] = Field(
        default=None,
        description="Optional URL of the generated Grad-CAM image.",
        example="https://medai-0w3x.onrender.com/gradcam/a5d18ed6443a4da78c327bdc35629b55.png",
    )

    notes: Optional[str] = Field(
        default=None,
        description="Additional notes to include in the report.",
        example="Patient reports mild chest pain for three days.",
    )


class ReportResponse(BaseModel):
    """
    Response returned after successful report generation.
    """

    success: bool = Field(
        ...,
        description="Whether report generation was successful.",
        example=True,
    )

    message: str = Field(
        ...,
        description="Status message.",
        example="Report generated successfully.",
    )

    report_url: str = Field(
        ...,
        description="Frontend-accessible URL of the generated PDF report.",
        example="https://medai-0w3x.onrender.com/reports/report_a7b93c.pdf",
    )

    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp when the report was generated.",
    )