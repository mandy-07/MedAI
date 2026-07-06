import json
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models, transforms

from backend.config import settings
from backend.utils.logger import logger


class ModelLoader:
    """
    Singleton responsible for loading the trained EfficientNet-B0 model,
    preprocessing transforms, inference device, and class metadata.
    """

    def __init__(self):

        # ---------------------------------------------------------
        # Device
        # ---------------------------------------------------------
        if settings.DEVICE.lower() == "cuda" and torch.cuda.is_available():
            self.device = torch.device("cuda")
        else:
            self.device = torch.device("cpu")

        self.model = None
        self.transform = None
        self.class_names = self._load_class_names()

    # ==========================================================
    # Class Names
    # ==========================================================

    def _load_class_names(self) -> list[str]:
        """
        Load class names from JSON file.
        """

        class_file = Path(settings.CLASS_NAMES_PATH).resolve()

        if not class_file.exists():
            raise FileNotFoundError(
                f"Class names file not found: {class_file}"
            )

        with open(class_file, "r", encoding="utf-8") as f:
            class_names = json.load(f)

        logger.info("Loaded %d class names.", len(class_names))

        return class_names

    # ==========================================================
    # Build Model
    # ==========================================================

    def _build_model(self) -> nn.Module:
        """
        Build EfficientNet-B0 exactly as used during training.
        """

        # weights=None: we immediately overwrite every layer with
        # our own trained state_dict below, so downloading the
        # ImageNet-pretrained weights here is wasted network I/O
        # and slows down every cold start on Render.
        model = models.efficientnet_b0(weights=None)

        in_features = model.classifier[1].in_features

        model.classifier = nn.Sequential(

            nn.Dropout(0.5),

            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),

            nn.Dropout(0.30),

            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),

            nn.Dropout(0.20),

            nn.Linear(
                256,
                len(self.class_names),
            ),
        )

        return model

    # ==========================================================
    # Load Model
    # ==========================================================

    def load_model(self) -> nn.Module:
        """
        Load trained model only once.
        """

        if self.model is not None:
            return self.model

        model_path = Path(settings.MODEL_PATH).resolve()

        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {model_path}"
            )

        logger.info("Loading model from %s", model_path)

        model = self._build_model()

        checkpoint = torch.load(
            model_path,
            map_location=self.device,
            weights_only=True
        )

        # Support both checkpoint formats
        if (
            isinstance(checkpoint, dict)
            and "model_state_dict" in checkpoint
        ):
            state_dict = checkpoint["model_state_dict"]
        else:
            state_dict = checkpoint

        try:
            model.load_state_dict(state_dict)
        except RuntimeError:
            logger.exception("Failed to load model weights.")
            raise

        model.to(self.device)

        model.eval()

        self.model = model

        logger.info(
            "Model loaded successfully on %s.",
            self.device,
        )

        return self.model

    # ==========================================================
    # Image Transform
    # ==========================================================

    def get_transform(self):

        if self.transform is None:

            self.transform = transforms.Compose(
                [
                    transforms.Resize(
                        (
                            settings.IMAGE_SIZE,
                            settings.IMAGE_SIZE,
                        )
                    ),
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ]
            )

        return self.transform

    # ==========================================================
    # Getters
    # ==========================================================

    def get_model(self) -> nn.Module:
        return self.load_model()

    def get_device(self) -> torch.device:
        return self.device

    def get_class_names(self) -> list[str]:
        return self.class_names


# ==========================================================
# Singleton Instance
# ==========================================================

model_loader = ModelLoader()