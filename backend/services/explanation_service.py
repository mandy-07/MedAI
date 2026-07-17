from typing import Optional

from backend.services.gradcam_service import generate_gradcam
from backend.utils.logger import logger


class ExplanationService:
    """
    Service responsible for generating explainability outputs
    using Grad-CAM.
    """

    def generate_explanation(
        self,
        image_path: str,
        class_index: int,
    ) -> Optional[str]:
        """
        Generate a Grad-CAM visualization.

        Args:
            image_path: Path to the uploaded chest X-ray.
            class_index: Predicted class index.

        Returns:
            Path to the generated Grad-CAM image if successful,
            otherwise None.
        """

        try:

            gradcam_path = generate_gradcam(
                image_path=image_path,
                class_index=class_index,
            )

            logger.info(
                "Grad-CAM generated successfully."
            )

            return gradcam_path

        except Exception:

            logger.exception(
                "Grad-CAM generation failed."
            )

            return None


# ==========================================================
# Singleton
# ==========================================================

explanation_service = ExplanationService()