import torch

from backend.schemas.prediction import (
    PredictionItem,
    PredictionResponse,
    PneumoniaSubtype,
)
from backend.services.model_loader import model_loader


class PostProcessor:
    """
    Converts raw model output into a structured PredictionResponse.
    """

    def __init__(self):
        self.class_names = model_loader.get_class_names()

    # ==========================================================
    # Risk Assessment
    # ==========================================================

    @staticmethod
    def determine_risk(
        diagnosis: str,
        confidence: float,
    ) -> str:
        """
        Determine clinical risk level based on diagnosis
        and model confidence.
        """

        # Healthy patient
        if diagnosis == "Normal":
            return "Low"

        # High-risk diseases
        if diagnosis in (
            "Tuberculosis",
            "Corona Virus Disease",
        ):
            return "High"

        # Pneumonia severity
        if diagnosis == "Pneumonia":

            if confidence >= 90:
                return "High"

            if confidence >= 70:
                return "Moderate"

            return "Low"

        return "Moderate"

    # ==========================================================
    # Recommendation
    # ==========================================================

    @staticmethod
    def get_recommendation(diagnosis: str) -> str:

        if diagnosis == "Normal":
            return (
                "No obvious abnormalities detected. "
                "Consult a healthcare professional if symptoms persist."
            )

        if diagnosis == "Pneumonia":
            return (
                "Possible pneumonia detected. "
                "Clinical correlation and further evaluation are recommended."
            )

        if diagnosis == "Tuberculosis":
            return (
                "Possible Tuberculosis detected. "
                "Immediate medical evaluation is recommended."
            )

        if diagnosis == "Corona Virus Disease":
            return (
                "Possible COVID-19 related findings detected. "
                "Please consult a healthcare professional."
            )

        return (
            "Consult a qualified radiologist or physician "
            "for further evaluation."
        )

    # ==========================================================
    # Main Processing
    # ==========================================================

    def process(
        self,
        logits: torch.Tensor,
    ) -> PredictionResponse:

        probabilities = torch.softmax(
            logits,
            dim=1,
        )[0]

        probability_dict = {
            cls: round(prob.item() * 100, 2)
            for cls, prob in zip(
                self.class_names,
                probabilities,
            )
        }

        # ------------------------------------------------------
        # Original Model Prediction
        # ------------------------------------------------------

        predicted_index = torch.argmax(
            probabilities
        ).item()

        predicted_class = self.class_names[
            predicted_index
        ]

        predicted_confidence = round(
            probabilities[predicted_index].item() * 100,
            2,
        )

        # ------------------------------------------------------
        # Pneumonia Aggregation
        # ------------------------------------------------------

        bacterial_prob = probability_dict.get(
            "Bacterial Pneumonia",
            0.0,
        )

        viral_prob = probability_dict.get(
            "Viral Pneumonia",
            0.0,
        )

        pneumonia_probability = round(
            bacterial_prob + viral_prob,
            2,
        )

        if predicted_class in (
            "Bacterial Pneumonia",
            "Viral Pneumonia",
        ):

            diagnosis = "Pneumonia"

            confidence = pneumonia_probability

            subtype = PneumoniaSubtype(
                bacterial=bacterial_prob,
                viral=viral_prob,
            )

        else:

            diagnosis = predicted_class

            confidence = predicted_confidence

            subtype = None

        # ------------------------------------------------------
        # Top Predictions
        # ------------------------------------------------------

        top_values, top_indices = torch.topk(
            probabilities,
            k=min(
                3,
                len(self.class_names),
            ),
        )

        top_predictions = []

        for value, index in zip(
            top_values,
            top_indices,
        ):

            top_predictions.append(
                PredictionItem(
                    disease=self.class_names[
                        index.item()
                    ],
                    confidence=round(
                        value.item() * 100,
                        2,
                    ),
                )
            )

        # ------------------------------------------------------
        # Final Response
        # ------------------------------------------------------

        return PredictionResponse(

            success=True,

            diagnosis=diagnosis,

            predicted_class=predicted_class,

            confidence=confidence,

            risk_level=self.determine_risk(
                diagnosis,
                confidence,
            ),

            requires_medical_attention=(
                diagnosis != "Normal"
            ),

            recommendation=self.get_recommendation(
                diagnosis
            ),

            probabilities=probability_dict,

            top_predictions=top_predictions,

            subtypes=subtype,

            gradcam_path=None,

            explanation=None,

            
        )


# ==========================================================
# Singleton
# ==========================================================

postprocessor = PostProcessor()