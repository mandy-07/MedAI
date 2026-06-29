"""
Groq LLM Service

Handles communication with the Groq API.
"""

from groq import Groq

from backend.config import settings
from backend.utils.logger import logger


class LLMService:
    """
    Service for interacting with the Groq LLM.
    """

    def __init__(self):
        """
        Initialize the Groq client.
        """

        if not settings.GROQ_API_KEY:
            raise ValueError(
                "GROQ_API_KEY is not configured."
            )

        self.client = Groq(
            api_key=settings.GROQ_API_KEY
        )

        self.model = settings.LLM_MODEL

        logger.info(
            "LLM Service initialized with model: %s",
            self.model,
        )

    def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """
        Generate a response using the configured Groq model.

        Args:
            system_prompt: System instruction for the model.
            user_prompt: User query.
            temperature: Sampling temperature.
            max_tokens: Maximum completion length.

        Returns:
            Generated response text.
        """

        try:

            # --------------------------------------------------
            # Validate Input
            # --------------------------------------------------

            if not system_prompt.strip():
                raise ValueError(
                    "System prompt cannot be empty."
                )

            if not user_prompt.strip():
                raise ValueError(
                    "User prompt cannot be empty."
                )

            logger.info(
                "Generating LLM response using model: %s",
                self.model,
            )

            # --------------------------------------------------
            # Call Groq API
            # --------------------------------------------------

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
                ],
                temperature=temperature,
                max_completion_tokens=max_tokens,
            )

            # --------------------------------------------------
            # Validate Response
            # --------------------------------------------------

            if (
                not response.choices
                or response.choices[0].message.content is None
            ):
                raise RuntimeError(
                    "LLM returned an empty response."
                )

            generated_text = (
                response.choices[0]
                .message.content.strip()
            )

            logger.info(
                "LLM response generated successfully."
            )

            return generated_text

        except Exception:

            logger.exception(
                "LLM response generation failed."
            )

            raise


# ==========================================================
# Singleton Instance
# ==========================================================

llm_service = LLMService()