"""
backend/services/report_generator.py

Professional PDF report generator for MedAI.
"""

from pathlib import Path
from datetime import datetime
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
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

        # Modern clinical palette styles
        self.title_style = ParagraphStyle(
            "ReportTitle",
            parent=self.styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=HexColor("#0f172a"),  # Slate 900
            alignment=TA_CENTER,
            spaceAfter=15,
        )

        self.heading_style = ParagraphStyle(
            "SectionHeading",
            parent=self.styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=HexColor("#0f766e"),  # Teal 700
            spaceBefore=12,
            spaceAfter=6,
            keepWithNext=True,
        )

        self.body_style = ParagraphStyle(
            "ReportBody",
            parent=self.styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=HexColor("#334155"),  # Slate 700
        )

        self.bold_body_style = ParagraphStyle(
            "ReportBodyBold",
            parent=self.body_style,
            fontName="Helvetica-Bold",
        )

        self.disclaimer_style = ParagraphStyle(
            "ReportDisclaimer",
            parent=self.styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=HexColor("#64748b"),  # Slate 500
        )

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

            # Standard Letter size page has 8.5 x 11 inches. 
            # With 0.75-inch margins (left/right/top/bottom), printable width = 7 inches.
            doc = SimpleDocTemplate(
                str(pdf_path),
                rightMargin=0.75 * inch,
                leftMargin=0.75 * inch,
                topMargin=0.75 * inch,
                bottomMargin=0.75 * inch,
            )
            elements = []

            # --------------------------------------------------
            # Header Title Block
            # --------------------------------------------------
            elements.append(
                Paragraph("Medical AI Chest X-ray Report", self.title_style)
            )

            # Elegant thin gray divider line
            divider = Table([[""]], colWidths=[7.0 * inch])
            divider.setStyle(
                TableStyle([
                    ("LINEABOVE", (0, 0), (-1, -1), 1, HexColor("#cbd5e1")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                ])
            )
            elements.append(divider)
            elements.append(Spacer(1, 0.2 * inch))

            # --------------------------------------------------
            # Patient Information
            # --------------------------------------------------
            elements.append(
                Paragraph("Patient Information", self.heading_style)
            )

            patient_data = [
                [
                    Paragraph("<b>Patient Name</b>", self.body_style),
                    Paragraph(request.patient.patient_name, self.body_style),
                ],
                [
                    Paragraph("<b>Age</b>", self.body_style),
                    Paragraph(str(request.patient.age), self.body_style),
                ],
                [
                    Paragraph("<b>Gender</b>", self.body_style),
                    Paragraph(request.patient.gender, self.body_style),
                ],
                [
                    Paragraph("<b>Examination Date</b>", self.body_style),
                    Paragraph(str(request.patient.examination_date), self.body_style),
                ],
            ]

            patient_table = Table(
                patient_data,
                colWidths=[2.2 * inch, 4.8 * inch],
            )
            patient_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (0, -1), HexColor("#f8fafc")),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor("#f1f5f9")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ])
            )
            elements.append(patient_table)
            elements.append(Spacer(1, 0.2 * inch))

            # --------------------------------------------------
            # Prediction Summary
            # --------------------------------------------------
            elements.append(
                Paragraph("Prediction Summary", self.heading_style)
            )

            prediction_data = [
                [
                    Paragraph("<b>Diagnosis</b>", self.body_style),
                    Paragraph(request.prediction.diagnosis, self.body_style),
                ],
                [
                    Paragraph("<b>Predicted Class</b>", self.body_style),
                    Paragraph(request.prediction.predicted_class, self.body_style),
                ],
                [
                    Paragraph("<b>Confidence</b>", self.body_style),
                    Paragraph(f"{request.prediction.confidence:.2f}%", self.body_style),
                ],
                [
                    Paragraph("<b>Risk Level</b>", self.body_style),
                    Paragraph(request.prediction.risk_level, self.body_style),
                ],
                [
                    Paragraph("<b>Recommendation</b>", self.body_style),
                    Paragraph(request.prediction.recommendation, self.body_style),
                ],
            ]

            if request.prediction.bacterial_probability is not None:
                prediction_data.append([
                    Paragraph("<b>Bacterial Probability</b>", self.body_style),
                    Paragraph(f"{request.prediction.bacterial_probability:.2f}%", self.body_style)
                ])

            if request.prediction.viral_probability is not None:
                prediction_data.append([
                    Paragraph("<b>Viral Probability</b>", self.body_style),
                    Paragraph(f"{request.prediction.viral_probability:.2f}%", self.body_style)
                ])

            prediction_table = Table(
                prediction_data,
                colWidths=[2.2 * inch, 4.8 * inch],
            )
            prediction_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (0, -1), HexColor("#f0fdfa")),  # Soft teal tint
                    ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor("#ccfbf1")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ])
            )
            elements.append(prediction_table)
            elements.append(Spacer(1, 0.25 * inch))

            # --------------------------------------------------
            # Clinical Interpretation
            # --------------------------------------------------
            template = get_report_template(request.prediction.diagnosis)

            sections = [
                ("Clinical Description", template["description"]),
                ("Radiographic Findings", template["findings"]),
                ("Impression", template["impression"]),
                ("Recommendation & Action Plan", template["recommendation"]),
            ]

            for heading, text in sections:
                elements.append(
                    Paragraph(heading, self.heading_style)
                )
                elements.append(
                    Paragraph(text, self.body_style)
                )
                elements.append(Spacer(1, 0.08 * inch))

            elements.append(Spacer(1, 0.1 * inch))
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

            if request.prediction.diagnosis == "Pneumonia":
                subtype = pneumonia_subtype_summary(
                    request.prediction.bacterial_probability,
                    request.prediction.viral_probability,
                )

                if subtype:
                    elements.append(Spacer(1, 0.15 * inch))
                    elements.append(
                        Paragraph("Pneumonia Subtype Analysis", self.heading_style)
                    )
                    elements.append(
                        Paragraph(
                            subtype.replace("\n", "<br/>"),
                            self.body_style,
                        )
                    )

            elements.append(Spacer(1, 0.25 * inch))

            # --------------------------------------------------
            # Images (Grad-CAM & original scan if present)
            # --------------------------------------------------
            if request.gradcam_url:
                # Find the filename from the relative URL path
                filename = Path(request.gradcam_url).name
                local_path = settings.GRADCAM_DIR / filename

                if local_path.exists():
                    elements.append(
                        Paragraph("Grad-CAM Visualization", self.heading_style)
                    )
                    # Centers the image nicely inside a padded border
                    img_flowable = Image(
                        str(local_path),
                        width=3.8 * inch,
                        height=3.8 * inch,
                    )
                    img_table = Table([[img_flowable]], colWidths=[7.0 * inch])
                    img_table.setStyle(
                        TableStyle([
                            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                            ("TOPPADDING", (0, 0), (-1, -1), 10),
                        ])
                    )
                    elements.append(img_table)
                    elements.append(Spacer(1, 0.1 * inch))

            if request.notes:
                elements.append(
                    Paragraph("Clinical Notes", self.heading_style)
                )
                elements.append(
                    Paragraph(request.notes, self.body_style)
                )
                elements.append(Spacer(1, 0.2 * inch))

            # --------------------------------------------------
            # Medical Disclaimer (Callout Box)
            # --------------------------------------------------
            elements.append(Spacer(1, 0.15 * inch))
            disclaimer_text = (
                "<b>Medical Disclaimer:</b> This report has been generated by the MedAI "
                "decision-support system. It is intended for educational and clinical assistance "
                "purposes only and must not replace professional medical judgment, diagnosis, or "
                "treatment. All AI-generated findings should be reviewed and verified by a qualified "
                "healthcare professional."
            )
            disclaimer_para = Paragraph(disclaimer_text, self.disclaimer_style)
            
            disclaimer_box = Table([[disclaimer_para]], colWidths=[7.0 * inch])
            disclaimer_box.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fafafa")),  # Very light grey
                    ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),  # Soft border
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ])
            )
            elements.append(disclaimer_box)

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
