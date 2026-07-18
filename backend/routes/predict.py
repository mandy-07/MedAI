from pathlib import Path
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.config import settings
from backend.schemas.prediction import PredictionResponse
from backend.services.predictor import predictor
from backend.services.history_service import history_service
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

    logger.info("=" * 80)
    logger.info("PREDICT ENDPOINT HIT")
    logger.info("Filename: %s", file.filename)
    logger.info("Content-Type: %s", file.content_type)

    if not file.filename:
        logger.error("No filename received.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded.",
        )

    logger.info("Validating file extension...")

    suffix = Path(file.filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        logger.error("Invalid extension: %s", suffix)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, and PNG images are supported.",
        )

    logger.info("Extension validation passed.")

    logger.info("Validating content type...")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        logger.error("Invalid content type: %s", file.content_type)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format.",
        )

    logger.info("Content type validation passed.")

    # --------------------------------------------------
    # Validate upload size
    # --------------------------------------------------

    # --------------------------------------------------
    # Stream upload to disk and validate size on-the-fly
    # --------------------------------------------------

    filename = f"{uuid.uuid4().hex}{suffix}"
    image_path = Path(settings.UPLOAD_DIR) / filename

    logger.info("Streaming uploaded file to disk...")

    try:
        total_size = 0
        with open(image_path, "wb") as buffer:
            # Read in chunks of 64 KB
            while chunk := await file.read(64 * 1024):
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    logger.error("Uploaded file exceeds 10 MB limit.")
                    # Clean up the partial file
                    buffer.close()
                    if image_path.exists():
                        image_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Image size exceeds the 10 MB limit.",
                    )
                buffer.write(chunk)

        logger.info(
            "Uploaded file saved successfully (size: %.2f MB): %s",
            total_size / (1024 * 1024),
            image_path,
        )

        # --------------------------------------------------
        # Run prediction
        # --------------------------------------------------

        logger.info("Calling predictor.predict()...")

        prediction = predictor.predict(str(image_path))

        logger.info("Prediction completed successfully.")

        # --------------------------------------------------
        # Auto-save to history (patient info added when report is generated)
        # --------------------------------------------------
        try:
            gradcam_url = prediction.gradcam_url if hasattr(prediction, "gradcam_url") else None
            full_gradcam_url = (
                f"{settings.BASE_URL}{gradcam_url}" if gradcam_url else None
            )
            await history_service.save_prediction(
                patient={
                    "patient_name": "Unknown",
                    "age": 0,
                    "gender": "Other",
                    "examination_date": None,
                },
                prediction={
                    "diagnosis": prediction.diagnosis,
                    "predicted_class": prediction.predicted_class,
                    "confidence": prediction.confidence,
                    "risk_level": prediction.risk_level,
                    "recommendation": prediction.recommendation,
                    "bacterial_probability": prediction.subtypes.bacterial if prediction.subtypes else None,
                    "viral_probability": prediction.subtypes.viral if prediction.subtypes else None,
                },
                report_path=None,
                gradcam_path=full_gradcam_url,
            )
            logger.info("Prediction auto-saved to history.")
        except Exception as hist_err:
            logger.warning("Could not auto-save to history: %s", hist_err)

        logger.info("Returning API response.")

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
        logger.info("Cleaning up uploaded file...")

        await file.close()

        try:
            if image_path.exists():
                image_path.unlink()
                logger.info("Temporary upload removed.")
        except Exception as cleanup_error:
            logger.warning(
                "Failed to remove temporary upload %s: %s",
                image_path,
                cleanup_error,
            )

        logger.info("=" * 80)