"""
backend/services/gradcam_service.py

Memory-efficient Grad-CAM generation.

Key optimisations vs. the original class-based approach:
- No persistent singleton holding model / target-layer refs.
- GradCAM input is downscaled to GRADCAM_SIZE (128) — the heatmap
  is only a visualisation overlay, so this has zero effect on
  prediction accuracy while cutting activation-tensor memory ~3×.
- Every tensor and the GradCAM object itself are deleted within
  the function scope so the GC can reclaim memory immediately.
"""

from pathlib import Path
from uuid import uuid4
import time
import gc
import ctypes
import os

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
from backend.services.model_loader import get_model_loader
from backend.utils.logger import logger

# Heatmap-only resolution — keeps activation tensors small.
# Does NOT affect the prediction model's 224×224 input.
GRADCAM_SIZE = 128


# ----------------------------------------------------------
# Helpers
# ----------------------------------------------------------

def _release_memory():
    """Force Python + glibc to actually give memory back to the OS."""
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    try:
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except Exception:
        pass  # not on glibc/Linux, safe to ignore


def _log_memory(stage: str):
    """Log current RAM usage of this process (optional, low-cost)."""
    try:
        import psutil
        ram_mb = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024
        logger.info("[MEMORY] %-35s %.2f MB", stage, ram_mb)
    except ImportError:
        pass


# ----------------------------------------------------------
# Public API
# ----------------------------------------------------------

def generate_gradcam(image_path: str, class_index: int) -> str:
    """
    Generate a Grad-CAM visualisation.

    Args:
        image_path: Path to the original chest X-ray.
        class_index: Predicted class index.

    Returns:
        Absolute path to the saved Grad-CAM PNG.
    """

    start_time = time.perf_counter()
    cam = None
    input_tensor = None

    _log_memory("GradCAM Started")

    try:
        image_path = Path(image_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        logger.info(
            "Generating Grad-CAM | Image=%s | Class=%d",
            image_path.name,
            class_index,
        )

        # --------------------------------------------------
        # Load & downscale for GradCAM only
        # --------------------------------------------------
        image = Image.open(image_path).convert("RGB")
        image = image.resize((GRADCAM_SIZE, GRADCAM_SIZE))
        _log_memory("Image Loaded & Resized")

        rgb_img = np.array(image).astype(np.float32) / 255.0

        input_tensor = preprocess_image(
            rgb_img,
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        )
        _log_memory("Input Tensor Created")

        # --------------------------------------------------
        # Get model from lazy loader
        # --------------------------------------------------
        loader = get_model_loader()
        model = loader.get_model()
        device = loader.get_device()
        input_tensor = input_tensor.to(device)

        # Last conv layer of EfficientNet-B0
        target_layers = [model.features[-1]]
        targets = [ClassifierOutputTarget(class_index)]

        # --------------------------------------------------
        # Run GradCAM
        # --------------------------------------------------
        _log_memory("Before GradCAM Object")
        cam = GradCAM(model=model, target_layers=target_layers)
        _log_memory("After GradCAM Object")

        grayscale_cam = cam(
            input_tensor=input_tensor,
            targets=targets,
        )[0]
        _log_memory("After CAM Forward/Backward")

        # Release hooks + activation buffers immediately
        if hasattr(cam, "release"):
            cam.release()
        _log_memory("After CAM Release")
        del cam
        cam = None
        del input_tensor
        input_tensor = None
        _release_memory()
        _log_memory("After Garbage Collection")

        # --------------------------------------------------
        # Build overlay
        # --------------------------------------------------
        visualization = show_cam_on_image(
            rgb_img,
            grayscale_cam,
            use_rgb=True,
        )
        del rgb_img, grayscale_cam
        _log_memory("After Visualization")

        # --------------------------------------------------
        # Save
        # --------------------------------------------------
        Path(settings.GRADCAM_DIR).mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}.png"
        output_path = Path(settings.GRADCAM_DIR) / filename

        success = cv2.imwrite(
            str(output_path),
            cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR),
        )
        del visualization
        _log_memory("After Image Saved")

        if not success:
            raise RuntimeError("Failed to save Grad-CAM image.")

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
        # Belt-and-suspenders: guarantee hooks/tensors are
        # gone even if an exception fired mid-way.
        if cam is not None:
            try:
                cam.release()
            except Exception:
                pass
        del cam, input_tensor
        _release_memory()