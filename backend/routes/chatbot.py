"""
Medical Chatbot API Route
"""

from fastapi import APIRouter, HTTPException, status

from backend.schemas.chatbot import (
    ChatRequest,
    ChatResponse,
)
from backend.services.chatbot_service import chatbot_service
from backend.utils.logger import logger

router = APIRouter(
    prefix="/chat",
    tags=["Medical Chatbot"],
)


@router.post(
    "/",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Medical AI Chatbot",
    description=(
        "Ask MedAI questions about chest X-rays, AI predictions, "
        "medical reports, lung diseases, and related healthcare topics. "
        "The chatbot can also use prediction and report context to "
        "provide more personalized responses."
    ),
    response_description="AI-generated chatbot response.",
)
async def chat(request: ChatRequest):
    """
    Ask the MedAI chatbot a question.
    """

    try:
        logger.info("Received chatbot request.")

        response = chatbot_service.chat(
            message=request.message,
            prediction_context=request.prediction_context,
            report_context=request.report_context,
        )

        logger.info("Chatbot response generated successfully.")

        return ChatResponse(
            success=True,
            response=response,
            conversation_id=request.conversation_id,
        )

    except Exception as e:
        logger.exception(
            "Chatbot request failed: %s",
            e,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The chatbot is temporarily unavailable. Please try again later.",
        )