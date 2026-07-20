from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from backend.schemas.report import (
    ReportRequest,
    ReportResponse,
)
from backend.database import mongodb
from backend.services.history_service import history_service
from backend.services.report_generator import ReportGenerator
from backend.utils.logger import logger

router = APIRouter(
    prefix="/report",
    tags=["Medical Report"],
)

report_generator = ReportGenerator()


@router.post(
    "/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Medical Report",
    description=(
        "Generate a professional PDF medical report based on patient "
        "information and AI prediction results. The report is saved "
        "to the server and the prediction history."
    ),
    response_description="Medical report generated successfully.",
)
async def generate_medical_report(
    request: ReportRequest,
):
    """
    Generate a professional PDF medical report
    and save it to prediction history.
    """

    try:
        # --------------------------------------------------
        # Generate PDF Report
        # --------------------------------------------------
        report_path = report_generator.generate_report(request)

        logger.info(
            "Medical report generated successfully: %s",
            report_path,
        )

        # --------------------------------------------------
        # Upload to GridFS
        # --------------------------------------------------
        if report_path:
            report_filename = Path(report_path).name
            try:
                await mongodb.upload_file(str(report_path), report_filename)
            except Exception as pdf_err:
                logger.warning("Could not upload PDF report to GridFS: %s", pdf_err)

        # --------------------------------------------------
        # Save Prediction History
        # --------------------------------------------------
        await history_service.save_prediction(
            patient=request.patient.model_dump(mode="json"),
            prediction=request.prediction.model_dump(mode="json"),
            report_path=report_path,
            gradcam_path=request.gradcam_url,
        )

        logger.info("Prediction history saved successfully.")

        # --------------------------------------------------
        # Create frontend-friendly URL
        # --------------------------------------------------
        report_filename = Path(report_path).name
        report_url = f"/reports/{report_filename}"

        # --------------------------------------------------
        # Return Response
        # --------------------------------------------------
        return ReportResponse(
            success=True,
            message="Medical report generated successfully.",
            report_url=report_url,
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(
            "Report generation failed: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate medical report.",
        )