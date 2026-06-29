from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class PredictionItem(BaseModel):
    """
    Single prediction entry.
    """

    disease: str = Field(
        ...,
        description="Predicted disease name.",
        example="Normal",
    )

    confidence: float = Field(
        ...,
        ge=0,
        le=100,
        description="Confidence score for the prediction (0-100%).",
        example=98.75,
    )


class PneumoniaSubtype(BaseModel):
    """
    Pneumonia subtype probabilities.
    """

    bacterial: float = Field(
        ...,
        ge=0,
        le=100,
        description="Probability of Bacterial Pneumonia (0-100%).",
        example=82.45,
    )

    viral: float = Field(
        ...,
        ge=0,
        le=100,
        description="Probability of Viral Pneumonia (0-100%).",
        example=17.55,
    )


class PredictionResponse(BaseModel):
    """
    Final response returned after a successful chest X-ray prediction.
    """

    success: bool = Field(
        ...,
        description="Whether the prediction request completed successfully.",
        example=True,
    )

    diagnosis: str = Field(
        ...,
        description="Final diagnosis displayed to the user.",
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
        description="Confidence score of the displayed diagnosis (0-100%).",
        example=96.83,
    )

    risk_level: str = Field(
        ...,
        description="Overall medical risk assessment.",
        example="High",
    )

    requires_medical_attention: bool = Field(
        ...,
        description="Indicates whether immediate medical attention is recommended.",
        example=True,
    )

    recommendation: str = Field(
        ...,
        description="Medical recommendation based on the prediction.",
        example="Consult a healthcare professional as soon as possible.",
    )

    probabilities: Dict[str, float] = Field(
        ...,
        description="Probability scores for all disease classes.",
        example={
            "Normal": 1.24,
            "Bacterial Pneumonia": 92.61,
            "Viral Pneumonia": 4.85,
            "Tuberculosis": 0.72,
            "Corona Virus Disease": 0.58,
        },
    )

    top_predictions: List[PredictionItem] = Field(
        ...,
        description="Top predicted disease classes sorted by confidence.",
    )

    subtypes: Optional[PneumoniaSubtype] = Field(
        default=None,
        description="Pneumonia subtype probabilities. Present only when the diagnosis is Pneumonia.",
    )

    gradcam_url: Optional[str] = Field(
        default=None,
        description="Frontend-accessible URL of the generated Grad-CAM image.",
        example="/gradcam/8c7e0f4d.png",
    )

    explanation: Optional[str] = Field(
        default=None,
        description="AI-generated explanation of the prediction.",
        example="The highlighted lung regions exhibit opacity patterns consistent with pneumonia.",
    )