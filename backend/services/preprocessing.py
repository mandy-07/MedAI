from pathlib import Path

import torch
from PIL import Image

from backend.services.model_loader import get_model_loader
from backend.utils.logger import logger


class ImagePreprocessor:
    """
    Handles image preprocessing for inference.
    """

    def __init__(self):
        self.transform = None

    def preprocess(self, image_path: str) -> torch.Tensor:
        """
        Load image from disk and convert it into a model-ready tensor.

        Args:
            image_path: Path to input image.

        Returns:
            Tensor of shape (1, 3, H, W)
        """

        try:
            image_path = Path(image_path)

            if not image_path.exists():
                raise FileNotFoundError(f"Image not found: {image_path}")

            image = Image.open(image_path).convert("RGB")

            if self.transform is None:
                self.transform = get_model_loader().get_transform()

            tensor = self.transform(image)

            if tensor.ndim != 3:
                raise ValueError(
                    f"Expected tensor shape (C, H, W), got {tuple(tensor.shape)}"
                )

            tensor = tensor.unsqueeze(0)

            logger.info(
                "Image preprocessing completed: %s",
                image_path.name,
            )

            return tensor

        except Exception:
            logger.exception(
                "Image preprocessing failed for '%s'.",
                image_path,
            )
            raise


preprocessor = ImagePreprocessor()