"""
Medical Chatbot API Route
"""

from fastapi import APIRouter, HTTPException, status, UploadFile, File

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


@router.post(
    "/extract-text",
    status_code=status.HTTP_200_OK,
    summary="Extract Text from File",
    description=(
        "Upload a text, JSON, markdown, CSV, or PDF file to extract its "
        "text contents for the medical AI chatbot context."
    ),
)
async def extract_text_from_file(
    file: UploadFile = File(...),
):
    import io
    from pathlib import Path
    import pypdf

    try:
        filename = file.filename or "uploaded_file"
        suffix = Path(filename).suffix.lower()
        contents = await file.read()

        if suffix == ".pdf":
            try:
                pdf_file = io.BytesIO(contents)
                reader = pypdf.PdfReader(pdf_file)
                text_parts = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                text = "\n".join(text_parts)
            except Exception as pdf_err:
                logger.error("Failed to parse PDF file: %s", pdf_err)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to parse the uploaded PDF file. Ensure it is not corrupted or password-protected.",
                )
        else:
            try:
                text = contents.decode("utf-8")
            except UnicodeDecodeError:
                try:
                    text = contents.decode("latin-1")
                except Exception as dec_err:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to read file text. Ensure it is a valid text encoding. Error: {str(dec_err)}",
                    )

        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file contains no readable text content.",
            )

        # Truncate to avoid context window issues
        if len(text) > 80000:
            text = text[:80000] + "\n\n...[Content truncated due to length]..."

        return {
            "success": True,
            "filename": filename,
            "text": text,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Text extraction route failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process and extract text from the file.",
        )