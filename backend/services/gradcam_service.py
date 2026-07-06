from pathlib import Path
from uuid import uuid4
import time
import gc
import ctypes

import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import (
    preprocess_image,
    show_cam_on_image,
)
from pytorch_grad_cam.utils.model_targets import (
    ClassifierOutputTarget,
)

from backend.config import settings
from backend.services.model_loader import model_loader
from backend.utils.logger import logger


def _release_memory():
    """Force Python + glibc to actually give memory back to the OS."""
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    try:
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except Exception:
        pass  # not on glibc/Linux, safe to ignore


class GradCAMService:
    """
    Service for generating Grad-CAM visualizations
    for model predictions.
    """

    def __init__(self):
        self.model = model_loader.get_model()
        self.device = model_loader.get_device()
        self.model.eval()

        # Last convolutional layer of EfficientNet-B0
        self.target_layers = [
            self.model.features[-1]
        ]

        Path(settings.GRADCAM_DIR).mkdir(
            parents=True,
            exist_ok=True,
        )

    def generate(
        self,
        image_path: str,
        class_index: int,
    ) -> str:
        """
        Generate a Grad-CAM visualization.

        Args:
            image_path: Path to the original image.
            class_index: Predicted class index.

        Returns:
            Path to the generated Grad-CAM image.
        """

        start_time = time.perf_counter()
        cam = None
        input_tensor = None

        try:
            image_path = Path(image_path)

            if not image_path.exists():
                raise FileNotFoundError(
                    f"Image not found: {image_path}"
                )

            logger.info(
                "Generating Grad-CAM | Image=%s | Class=%d",
                image_path.name,
                class_index,
            )

            image = Image.open(image_path).convert("RGB")
            image = image.resize(
                (settings.IMAGE_SIZE, settings.IMAGE_SIZE)
            )

            rgb_img = (
                np.array(image).astype(np.float32) / 255.0
            )

            input_tensor = preprocess_image(
                rgb_img,
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ).to(self.device)

            targets = [ClassifierOutputTarget(class_index)]

            cam = GradCAM(
                model=self.model,
                target_layers=self.target_layers,
            )
            grayscale_cam = cam(
                input_tensor=input_tensor,
                targets=targets,
            )[0]

            # release hooks + internal activation/gradient
            # buffers as early as possible, before the
            # (also memory-heavy) image-writing step below
            cam.release()
            del cam
            cam = None
            del input_tensor
            input_tensor = None
            _release_memory()

            visualization = show_cam_on_image(
                rgb_img,
                grayscale_cam,
                use_rgb=True,
            )

            filename = f"{uuid4().hex}.png"
            output_path = Path(settings.GRADCAM_DIR) / filename

            success = cv2.imwrite(
                str(output_path),
                cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR),
            )

            if not success:
                raise RuntimeError(
                    "Failed to save Grad-CAM image."
                )

            logger.info(
                "Grad-CAM saved: %s (%.2fs)",
                output_path,
                time.perf_counter() - start_time,
            )

            return str(output_path)

        except Exception:
            logger.exception("Grad-CAM generation failed.")
            raise
        finally:
            # belt-and-suspenders: guarantee hooks/tensors are
            # gone even if an exception fired mid-way
            if cam is not None:
                try:
                    cam.release()
                except Exception:
                    pass
            del cam, input_tensor
            _release_memory()


gradcam_service = GradCAMService()