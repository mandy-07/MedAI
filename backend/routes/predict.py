from pathlib import Path
import shutil
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.config import settings
from backend.schemas.prediction import PredictionResponse
from backend.services.predictor import predictor
from backend.utils.logger import logger

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"],
)

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
}

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Lung Disease",
    description=(
        "Upload a chest X-ray image (JPG, JPEG, or PNG) to receive an AI-based "
        "lung disease prediction, confidence scores, Grad-CAM visualization, "
        "risk assessment, and medical recommendation."
    ),
    response_description="Successful prediction result.",
)
async def predict(
    file: UploadFile = File(
        ...,
        description="Chest X-ray image in JPG, JPEG, or PNG format (maximum size: 10 MB).",
    ),
):
    """
    Predict lung disease from an uploaded chest X-ray.
    """

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded.",
        )

    suffix = Path(file.filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, and PNG images are supported.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format.",
        )

    # --------------------------------------------------
    # Validate upload size
    # --------------------------------------------------
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image size exceeds the 10 MB limit.",
        )

    # Reset file pointer after reading
    file.file.seek(0)

    filename = f"{uuid.uuid4().hex}{suffix}"
    image_path = Path(settings.UPLOAD_DIR) / filename

    try:
        # --------------------------------------------------
        # Save uploaded image
        # --------------------------------------------------
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info("Image uploaded successfully: %s", image_path)

        # --------------------------------------------------
        # Run prediction
        # --------------------------------------------------
        prediction = predictor.predict(str(image_path))

        logger.info("Prediction completed successfully.")

        return prediction

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Prediction failed: %s", e)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal server error.",
        )

    finally:
        await file.close()

        try:
            if image_path.exists():
                image_path.unlink()
        except Exception as cleanup_error:
            logger.warning(
                "Failed to remove temporary upload %s: %s",
                image_path,
                cleanup_error,
            )