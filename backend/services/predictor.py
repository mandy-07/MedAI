import os

import torch

from backend.schemas.prediction import PredictionResponse
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
        Run complete prediction pipeline.
        """

        try:
            # ------------------------------------------------------
            # Validate input
            # ------------------------------------------------------
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")

            logger.info("Prediction started.")

            # ------------------------------------------------------
            # Preprocess
            # ------------------------------------------------------
            image_tensor = preprocessor.preprocess(image_path)

            if image_tensor.dim() == 3:
                image_tensor = image_tensor.unsqueeze(0)

            image_tensor = image_tensor.to(self.device)

            logger.info(
                "Image preprocessing completed: %s",
                os.path.basename(image_path),
            )

            # ------------------------------------------------------
            # Inference
            # ------------------------------------------------------
            with torch.no_grad():
                logits = self.model(image_tensor)

            logger.info("Model inference completed.")

            # ------------------------------------------------------
            # Post Processing
            # ------------------------------------------------------
            prediction: PredictionResponse = postprocessor.process(logits)

            predicted_index = torch.argmax(logits, dim=1).item()

            logger.info(
                "Predicted class index: %d",
                predicted_index,
            )

            # ======================================================
            # TEMPORARILY DISABLE GRAD-CAM
            # ======================================================

            logger.warning(
                "Grad-CAM temporarily disabled for Render debugging."
            )

            prediction.gradcam_url = None

            # ======================================================

            logger.info(
                "Prediction completed successfully."
            )

            return prediction

        except Exception:
            logger.exception("Prediction pipeline failed.")
            raise


predictor = Predictor()