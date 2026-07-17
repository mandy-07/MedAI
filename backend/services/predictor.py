"""
backend/services/predictor.py

Full prediction pipeline: preprocess → infer → postprocess → GradCAM.

Memory-optimised: uses lazy model loader, functional gradcam,
and aggressive tensor cleanup between stages.
"""

import os
import gc
import ctypes

import torch

from backend.config import settings
from backend.schemas.prediction import PredictionResponse
from backend.services.gradcam_service import (
    generate_gradcam,
    _log_memory,
)
from backend.services.model_loader import get_model_loader
from backend.services.postprocessing import postprocessor
from backend.services.preprocessing import preprocessor
from backend.utils.logger import logger


def _release_memory():
    """Force Python + glibc to actually give memory back to the OS."""
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    try:
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except Exception:
        pass


class Predictor:
    """
    Handles the complete prediction pipeline.
    """

    def __init__(self):
        # Defer model loading — the lazy loader handles it.
        self._model = None
        self._device = None

    def _ensure_model(self):
        """Load model on first predict call, not at import time."""
        if self._model is None:
            loader = get_model_loader()
            self._model = loader.get_model()
            self._device = loader.get_device()
            self._model.eval()

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

            self._ensure_model()

            # ------------------------------------------------------
            # Preprocess image
            # ------------------------------------------------------
            image_tensor = preprocessor.preprocess(image_path)

            if image_tensor.dim() == 3:
                image_tensor = image_tensor.unsqueeze(0)

            image_tensor = image_tensor.to(self._device)

            logger.info("Image preprocessing completed: %s",
                        os.path.basename(image_path))

            _log_memory("Predictor: After Preprocessing")

            # ------------------------------------------------------
            # Model inference
            # ------------------------------------------------------
            with torch.no_grad():
                logits = self._model(image_tensor)

            logger.info("Model inference completed.")
            _log_memory("Predictor: After Inference")

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
            # Free predict-pass tensors BEFORE Grad-CAM's own
            # forward+backward pass starts — otherwise both
            # passes' memory overlaps at peak.
            # ------------------------------------------------------
            _log_memory("Predictor: Before Cleanup")

            del image_tensor, logits
            _release_memory()
            _log_memory("Predictor: After Cleanup")

            # ------------------------------------------------------
            # Grad-CAM
            # ------------------------------------------------------
            prediction.gradcam_url = None

            try:
                _log_memory("Predictor: Before GradCAM")

                logger.info(
                    "Generating Grad-CAM | Image=%s | Class=%d",
                    os.path.basename(image_path),
                    predicted_index,
                )

                gradcam_path = generate_gradcam(
                    image_path=image_path,
                    class_index=predicted_index,
                )
                _log_memory("Predictor: After GradCAM")

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
                _log_memory("Predictor: GradCAM Exception")
                logger.exception("Grad-CAM generation failed.")
                prediction.gradcam_url = None
            finally:
                # Grad-CAM's own tensors/hooks are cleaned up
                # inside generate_gradcam now, but trim again here
                # since this is the highest-water-mark point in
                # the whole request.
                _release_memory()
                _log_memory("Predictor: Final Cleanup")

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