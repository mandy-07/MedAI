import os

import torch

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
            image_path: Path to the uploaded chest X-ray image.

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

            # Ensure batch dimension exists
            if image_tensor.dim() == 3:
                image_tensor = image_tensor.unsqueeze(0)

            image_tensor = image_tensor.to(self.device)

            # ------------------------------------------------------
            # Model inference
            # ------------------------------------------------------
            with torch.no_grad():
                logits = self.model(image_tensor)

            # ------------------------------------------------------
            # Post-processing
            # ------------------------------------------------------
            prediction: PredictionResponse = postprocessor.process(logits)

            # ------------------------------------------------------
            # Predicted class index
            # ------------------------------------------------------
            predicted_index = torch.argmax(logits, dim=1).item()

            # ------------------------------------------------------
            # Generate Grad-CAM
            # ------------------------------------------------------
            try:
                gradcam_path = gradcam_service.generate(
                    image_path=image_path,
                    class_index=predicted_index,
                )

                if gradcam_path:
                    filename = os.path.basename(gradcam_path)
                    prediction.gradcam_url = f"/gradcam/{filename}"
                else:
                    prediction.gradcam_url = None

            except Exception as e:
                logger.warning("Grad-CAM generation failed: %s", e)
                prediction.gradcam_url = None

            logger.info(
                "Prediction completed successfully. Diagnosis: %s",
                prediction.diagnosis,
            )

            return prediction

        except Exception as e:
            logger.exception("Prediction failed: %s", e)
            raise


# Singleton instance
predictor = Predictor()