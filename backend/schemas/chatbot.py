from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """
    User message sent to the medical chatbot.
    """

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User question."
    )

    prediction_context: Optional[dict] = Field(
        default=None,
        description="Prediction result returned by the AI model."
    )

    report_context: Optional[str] = Field(
        default=None,
        description="Optional medical report text."
    )

    conversation_id: Optional[str] = Field(
        default=None,
        description="Conversation identifier."
    )


class ChatResponse(BaseModel):
    """
    Chatbot response.
    """

    success: bool = True

    response: str

    conversation_id: Optional[str] = None

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )