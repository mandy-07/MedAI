from typing import Literal, Optional

from pydantic import BaseModel, Field


class PatientInfo(BaseModel):
    """
    Patient Information Schema
    """

    patient_name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    age: int = Field(
        ...,
        ge=0,
        le=120
    )

    gender: Literal["Male", "Female", "Other"]

    referring_doctor: Optional[str] = Field(
        default=None,
        max_length=100
    )

    clinical_history: Optional[str] = Field(
        default=None,
        max_length=1000
    )