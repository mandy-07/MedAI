import os

import torch

from backend.config import settings
from backend.schemas.prediction import PredictionResponse
from backend.services.gradcam_service import gradcam_service
from backend.services.model_loader import model_loader
from backend.services.postprocessing import postprocessor
from backend.services.preprocessing import preprocessor
from backend.utils.logger import logger


class Predictor:
    """
    Handles the complete prediction pipeline.
    """

    def __init__(self):
        self.model = model_loader.get_model()
        self.device = model_loader.get_device()
        self.model.eval()

    def predict(self, image_path: str) -> PredictionResponse:
        """
        Run the complete prediction pipeline.

        Args:
            image_path: Path to uploaded chest X-ray.

        Returns:
            PredictionResponse
        """

        try:
            # ------------------------------------------------------
            # Validate input
            # ------------------------------------------------------
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")

            # ------------------------------------------------------
            # Preprocess image
            # ------------------------------------------------------
            image_tensor = preprocessor.preprocess(image_path)

            if image_tensor.dim() == 3:
                image_tensor = image_tensor.unsqueeze(0)

            image_tensor = image_tensor.to(self.device)

            logger.info("Image preprocessing completed: %s",
                        os.path.basename(image_path))

            # ------------------------------------------------------
            # Model inference
            # ------------------------------------------------------
            with torch.no_grad():
                logits = self.model(image_tensor)

            logger.info("Model inference completed.")

            # ------------------------------------------------------
            # Post-processing
            # ------------------------------------------------------
            prediction: PredictionResponse = postprocessor.process(logits)

            # ------------------------------------------------------
            # Predicted class
            # ------------------------------------------------------
            predicted_index = torch.argmax(logits, dim=1).item()

            logger.info(
                "Predicted class index: %d",
                predicted_index,
            )

            # ------------------------------------------------------
            # Grad-CAM
            # ------------------------------------------------------
            prediction.gradcam_url = None

            try:
                logger.info(
                    "Generating Grad-CAM | Image=%s | Class=%d",
                    os.path.basename(image_path),
                    predicted_index,
                )

                gradcam_path = gradcam_service.generate(
                    image_path=image_path,
                    class_index=predicted_index,
                )

                if gradcam_path and os.path.exists(gradcam_path):
                    filename = os.path.basename(gradcam_path)

                    prediction.gradcam_url = (
                        f"{settings.BASE_URL}/gradcam/{filename}"
                    )

                    logger.info(
                        "Grad-CAM generated successfully: %s",
                        prediction.gradcam_url,
                    )

                else:
                    logger.warning(
                        "Grad-CAM generation returned None."
                    )

            except Exception:
                logger.exception("Grad-CAM generation failed.")
                prediction.gradcam_url = None

            logger.info(
                "Prediction completed successfully. Diagnosis=%s Confidence=%.2f%%",
                prediction.diagnosis,
                prediction.confidence,
            )

            return prediction

        except Exception:
            logger.exception("Prediction pipeline failed.")
            raise


# Singleton instance
predictor = Predictor()