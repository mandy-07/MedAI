"""
backend/services/report_generator.py

Professional PDF report generator for MedAI.
"""

from pathlib import Path
from datetime import datetime
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from backend.config import settings
from backend.schemas.report import ReportRequest
from backend.services.report_templates import (
    confidence_interpretation,
    get_report_template,
    pneumonia_subtype_summary,
    risk_statement,
)
from backend.utils.logger import logger


class ReportGenerator:
    """Generates professional PDF medical reports."""

    def __init__(self, output_dir: str | None = None):
        self.output_dir = Path(output_dir or settings.REPORTS_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.styles = getSampleStyleSheet()

        self.heading_style = self.styles["Heading2"]
        self.body_style = self.styles["BodyText"]
        self.title_style = self.styles["Heading1"]
        self.title_style.alignment = TA_CENTER

    def generate_report(self, request: ReportRequest) -> str:
        """Generate a PDF medical report."""

        try:
            filename = (
                f"medical_report_"
                f"{datetime.now():%Y%m%d_%H%M%S}_"
                f"{uuid4().hex[:8]}.pdf"
            )

            pdf_path = self.output_dir / filename

            logger.info(
                "Generating medical report: %s",
                pdf_path.name,
            )

            doc = SimpleDocTemplate(str(pdf_path))
            elements = []

            elements.append(
                Paragraph(
                    "Medical AI Chest X-ray Report",
                    self.title_style,
                )
            )
            elements.append(Spacer(1, 0.25 * inch))

            # --------------------------------------------------
            # Patient Information
            # --------------------------------------------------

            elements.append(
                Paragraph(
                    "<b>Patient Information</b>",
                    self.heading_style,
                )
            )

            patient_data = [
                ["Patient Name", request.patient.name],
                ["Patient ID", request.patient.patient_id or "N/A"],
                ["Age", str(request.patient.age)],
                ["Gender", request.patient.gender],
                ["Examination Date", str(request.patient.examination_date)],
            ]

            patient_table = Table(
                patient_data,
                colWidths=[2.5 * inch, 3.5 * inch],
            )

            patient_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ])
            )

            elements.append(patient_table)
            elements.append(Spacer(1, 0.3 * inch))

            # --------------------------------------------------
            # Prediction Summary
            # --------------------------------------------------

            elements.append(
                Paragraph(
                    "<b>Prediction Summary</b>",
                    self.heading_style,
                )
            )

            prediction_data = [
                ["Diagnosis", request.prediction.diagnosis],
                ["Predicted Class", request.prediction.predicted_class],
                ["Confidence", f"{request.prediction.confidence:.2f}%"],
                ["Risk Level", request.prediction.risk_level],
                ["Recommendation", request.prediction.recommendation],
            ]

            if request.prediction.bacterial_probability is not None:
                prediction_data.append([
                    "Bacterial Probability",
                    f"{request.prediction.bacterial_probability:.2f}%"
                ])

            if request.prediction.viral_probability is not None:
                prediction_data.append([
                    "Viral Probability",
                    f"{request.prediction.viral_probability:.2f}%"
                ])

            prediction_table = Table(
                prediction_data,
                colWidths=[2.5 * inch, 3.5 * inch],
            )

            prediction_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (0, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ])
            )

            elements.append(prediction_table)
            elements.append(Spacer(1, 0.3 * inch))

            # --------------------------------------------------
            # Clinical Interpretation
            # --------------------------------------------------

            template = get_report_template(
                request.prediction.diagnosis
            )

            sections = [
                ("Clinical Description", template["description"]),
                ("Radiographic Findings", template["findings"]),
                ("Impression", template["impression"]),
                ("Recommendation", template["recommendation"]),
            ]

            for heading, text in sections:
                elements.append(
                    Paragraph(
                        f"<b>{heading}</b>",
                        self.heading_style,
                    )
                )
                elements.append(
                    Paragraph(text, self.body_style)
                )
                elements.append(Spacer(1, 0.12 * inch))

            elements.append(
                Paragraph(
                    f"<b>Confidence Interpretation:</b> "
                    f"{confidence_interpretation(request.prediction.confidence)}",
                    self.body_style,
                )
            )

            elements.append(
                Paragraph(
                    f"<b>Risk Assessment:</b> "
                    f"{risk_statement(request.prediction.risk_level)}",
                    self.body_style,
                )
            )

            elements.append(Spacer(1, 0.2 * inch))

            if request.prediction.diagnosis == "Pneumonia":
                subtype = pneumonia_subtype_summary(
                    request.prediction.bacterial_probability,
                    request.prediction.viral_probability,
                )

                if subtype:
                    elements.append(
                        Paragraph(
                            "<b>Pneumonia Subtype Analysis</b>",
                            self.heading_style,
                        )
                    )
                    elements.append(
                        Paragraph(
                            subtype.replace("\n", "<br/>"),
                            self.body_style,
                        )
                    )
                    elements.append(Spacer(1, 0.2 * inch))

            # --------------------------------------------------
            # Images
            # --------------------------------------------------

            if (
                request.original_image_path
                and Path(request.original_image_path).exists()
            ):
                elements.append(
                    Paragraph("<b>Chest X-ray</b>", self.heading_style)
                )
                elements.append(
                    Image(
                        request.original_image_path,
                        width=4 * inch,
                        height=4 * inch,
                    )
                )
                elements.append(Spacer(1, 0.2 * inch))

            if (
                request.gradcam_path
                and Path(request.gradcam_path).exists()
            ):
                elements.append(
                    Paragraph(
                        "<b>Grad-CAM Visualization</b>",
                        self.heading_style,
                    )
                )
                elements.append(
                    Image(
                        request.gradcam_path,
                        width=4 * inch,
                        height=4 * inch,
                    )
                )
                elements.append(Spacer(1, 0.2 * inch))

            if request.notes:
                elements.append(
                    Paragraph(
                        "<b>Clinical Notes</b>",
                        self.heading_style,
                    )
                )
                elements.append(
                    Paragraph(request.notes, self.body_style)
                )
                elements.append(Spacer(1, 0.2 * inch))

            elements.append(
                Paragraph(
                    "<b>Medical Disclaimer</b>",
                    self.heading_style,
                )
            )

            elements.append(
                Paragraph(
                    "This report has been generated by the MedAI "
                    "decision-support system. It is intended for "
                    "educational and clinical assistance purposes only "
                    "and must not replace professional medical judgment, "
                    "diagnosis, or treatment. All AI-generated findings "
                    "should be reviewed by a qualified healthcare professional.",
                    self.body_style,
                )
            )

            doc.build(elements)

            logger.info(
                "Medical report generated successfully: %s",
                pdf_path,
            )

            return str(pdf_path)

        except Exception:
            logger.exception(
                "Failed to generate medical report."
            )
            raise
