"""
backend/services/report_templates.py

Clinical report templates and helper functions for MedAI.
"""

from typing import Dict, Optional

# ==========================================================
# Clinical Report Templates
# ==========================================================

REPORT_TEMPLATES: Dict[str, Dict[str, str]] = {
    "Normal": {
        "description": (
            "No radiographic evidence of acute cardiopulmonary abnormality."
        ),
        "findings": (
            "The lungs are clear without focal consolidation, pleural effusion, "
            "or pneumothorax. Cardiomediastinal silhouette is within normal limits."
        ),
        "impression": (
            "Normal chest radiograph."
        ),
        "recommendation": (
            "No acute abnormality detected. Continue routine clinical follow-up "
            "if symptoms persist or worsen."
        ),
    },

    "Pneumonia": {
        "description": (
            "Chest radiograph demonstrates findings suggestive of pneumonia."
        ),
        "findings": (
            "Patchy or focal pulmonary opacities are identified, consistent with "
            "an infectious pulmonary process."
        ),
        "impression": (
            "Radiographic findings are compatible with pneumonia."
        ),
        "recommendation": (
            "Clinical evaluation, laboratory correlation, and appropriate "
            "treatment are recommended based on physician assessment."
        ),
    },

    "Tuberculosis": {
        "description": (
            "Radiographic abnormalities raise suspicion for pulmonary tuberculosis."
        ),
        "findings": (
            "Upper lung zone infiltrates and/or cavitary lesions may be present."
        ),
        "impression": (
            "Findings are suspicious for pulmonary tuberculosis."
        ),
        "recommendation": (
            "Recommend microbiological confirmation, sputum examination, and "
            "consultation with a pulmonary specialist."
        ),
    },

    "Corona Virus Disease": {
        "description": (
            "Chest imaging demonstrates features that may be compatible with "
            "COVID-19 pneumonia."
        ),
        "findings": (
            "Bilateral peripheral ground-glass opacities and patchy infiltrates "
            "are identified."
        ),
        "impression": (
            "Imaging findings are compatible with COVID-19 pneumonia."
        ),
        "recommendation": (
            "Clinical correlation and confirmatory laboratory testing are advised."
        ),
    },
}


# ==========================================================
# Confidence Thresholds
# ==========================================================

VERY_HIGH_CONFIDENCE = 95.0
HIGH_CONFIDENCE = 90.0
MODERATE_CONFIDENCE = 80.0


# ==========================================================
# Template Functions
# ==========================================================

def get_report_template(diagnosis: str) -> Dict[str, str]:
    """
    Return the clinical report template for a diagnosis.

    Falls back to the Normal template if the diagnosis
    is not found.
    """

    return REPORT_TEMPLATES.get(
        diagnosis,
        REPORT_TEMPLATES["Normal"],
    )


def confidence_interpretation(confidence: float) -> str:
    """
    Convert prediction confidence into a human-readable level.

    Parameters
    ----------
    confidence : float
        Prediction confidence in percentage (0–100).

    Returns
    -------
    str
    """

    if confidence >= VERY_HIGH_CONFIDENCE:
        return "Very High Confidence"

    if confidence >= HIGH_CONFIDENCE:
        return "High Confidence"

    if confidence >= MODERATE_CONFIDENCE:
        return "Moderate Confidence"

    return "Low Confidence (Clinical confirmation recommended)"


def risk_statement(risk_level: str) -> str:
    """
    Return a descriptive explanation for the predicted risk level.
    """

    mapping = {
        "Low": (
            "The predicted findings indicate a low level of clinical concern."
        ),
        "Medium": (
            "The findings warrant medical evaluation and follow-up."
        ),
        "High": (
            "The findings suggest a significant abnormality requiring prompt "
            "clinical attention."
        ),
    }

    return mapping.get(
        risk_level,
        "Clinical assessment is recommended."
    )


def pneumonia_subtype_summary(
    bacterial_probability: Optional[float],
    viral_probability: Optional[float],
) -> Optional[str]:
    """
    Generate a pneumonia subtype probability summary.

    Parameters
    ----------
    bacterial_probability : float | None
    viral_probability : float | None

    Returns
    -------
    str | None
    """

    if bacterial_probability is None or viral_probability is None:
        return None

    return (
        "Pneumonia Subtype Analysis\n"
        "----------------------------\n"
        f"Bacterial Pneumonia : {bacterial_probability:.2f}%\n"
        f"Viral Pneumonia     : {viral_probability:.2f}%"
    )