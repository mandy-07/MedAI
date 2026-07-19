"""
Health Check Routes
"""

from fastapi import APIRouter, status

from backend.database import mongodb
from backend.services.model_loader import _model_loader as _ml_ref

router = APIRouter(
    tags=["Health"],
)


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="API Information",
    description="Returns basic information about the MedAI backend service.",
    response_description="API metadata.",
)
async def root():
    """
    Root endpoint.
    """

    return {
        "message": "Welcome to MedAI API",
        "service": "Medical Chest X-ray Analysis",
        "version": "1.0.0",
    }


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description=(
        "Checks whether the backend service, database connection, "
        "and AI model are available."
    ),
    response_description="Current health status of the backend.",
)
async def health():
    """
    Health check endpoint.
    """

    database_status = (
        "connected"
        if mongodb.client is not None
        else "disconnected"
    )

    model_status = (
        "EfficientNet-B0 (Loaded)"
        if (
            _ml_ref is not None
            and _ml_ref.model is not None
        )
        else "EfficientNet-B0 (Standby)"
    )

    overall_status = (
        "healthy"
        if database_status == "connected"
        else "unhealthy"
    )

    return {
        "status": overall_status,
        "database": database_status,
        "model": model_status,
    }