"""
Medical Chatbot Service

Builds contextual prompts for the LLM using
prediction results and medical report data.
"""

import json
from pathlib import Path

from backend.services.llm_service import llm_service
from backend.utils.logger import logger


class ChatbotService:
    """
    Medical AI Chatbot Service.

    Responsible for:
    - Loading the system prompt.
    - Building the user prompt.
    - Passing prompts to the LLM service.
    """

    def __init__(self):
        """
        Load the system prompt once during service initialization.
        """

        prompt_path = (
            Path(__file__).parent.parent
            / "prompts"
            / "medical_system_prompt.txt"
        )

        self.system_prompt = prompt_path.read_text(
            encoding="utf-8"
        )

        logger.info(
            "Medical chatbot system prompt loaded successfully."
        )

    def build_prompt(
        self,
        message: str,
        prediction_context: dict | None = None,
        report_context: str | None = None,
    ) -> str:
        """
        Build the prompt that will be sent to the LLM.
        """

        sections = []

        # --------------------------------------------------
        # Prediction Context
        # --------------------------------------------------

        if prediction_context:
            sections.append(
                "### AI Prediction\n"
                + json.dumps(
                    prediction_context,
                    indent=2,
                )
            )

        # --------------------------------------------------
        # Medical Report
        # --------------------------------------------------

        if report_context:
            sections.append(
                "### Medical Report\n"
                + report_context
            )

        # --------------------------------------------------
        # User Question
        # --------------------------------------------------

        sections.append(
            f"### User Question\n{message}"
        )

        return "\n\n".join(sections)

    def chat(
        self,
        message: str,
        prediction_context: dict | None = None,
        report_context: str | None = None,
    ) -> str:
        """
        Generate chatbot response.
        """

        try:

            prompt = self.build_prompt(
                message=message,
                prediction_context=prediction_context,
                report_context=report_context,
            )

            logger.info(
                "Sending request to Groq LLM..."
            )

            response = llm_service.generate_response(
                system_prompt=self.system_prompt,
                user_prompt=prompt,
            )

            logger.info(
                "Chatbot response generated successfully."
            )

            return response

        except Exception as e:

            logger.exception(
                "Chatbot service failed: %s",
                e,
            )

            raise


# Singleton instance
chatbot_service = ChatbotService()