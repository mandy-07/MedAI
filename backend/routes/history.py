"""
Prediction History Routes
"""

from fastapi import APIRouter, HTTPException, Query, status

from backend.services.history_service import history_service
from backend.utils.logger import logger

router = APIRouter(
    prefix="/history",
    tags=["Prediction History"],
)


@router.get(
    "",
    summary="Get Prediction History",
)
async def get_prediction_history(
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
):
    """
    Retrieve all prediction history.
    """

    try:
        history = await history_service.get_all_predictions(
            limit=limit,
            skip=skip,
        )

        return {
            "success": True,
            "count": len(history),
            "data": history,
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "Failed to retrieve prediction history: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve prediction history.",
        )


@router.get(
    "/count",
    summary="Prediction Count",
)
async def get_prediction_count():
    """
    Returns total prediction count.
    """

    try:
        count = await history_service.get_prediction_count()

        return {
            "success": True,
            "count": count,
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "Failed to retrieve prediction count: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve prediction count.",
        )


@router.get(
    "/{history_id}",
    summary="Get Prediction by ID",
)
async def get_prediction(history_id: str):
    """
    Retrieve a prediction by ID.
    """

    try:
        prediction = await history_service.get_prediction_by_id(
            history_id
        )

        if prediction is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction not found.",
            )

        return {
            "success": True,
            "data": prediction,
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "Failed to retrieve prediction: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve prediction.",
        )


@router.delete(
    "/{history_id}",
    summary="Delete Prediction",
)
async def delete_prediction(history_id: str):
    """
    Delete a prediction history record.
    """

    try:
        deleted = await history_service.delete_prediction(
            history_id
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction not found.",
            )

        return {
            "success": True,
            "message": "Prediction deleted successfully.",
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "Failed to delete prediction: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete prediction.",
        )


@router.delete(
    "",
    summary="Clear Prediction History",
)
async def clear_prediction_history():
    """
    Delete all prediction history.
    Intended for development/testing.
    """

    try:
        deleted = await history_service.clear_history()

        return {
            "success": True,
            "deleted": deleted,
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "Failed to clear prediction history: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to clear prediction history.",
        )