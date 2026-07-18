from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import (
    initialize_directories,
    settings,
)
from backend.database import mongodb
from backend.routes.health import router as health_router
from backend.routes.predict import router as predict_router
from backend.routes.report import router as report_router
from backend.routes.history import router as history_router
from backend.utils.logger import logger
from backend.routes.chatbot import router as chatbot_router

# ==========================================================
# Initialize Runtime Directories
# ==========================================================

# Create all required directories BEFORE mounting static files
initialize_directories()


# ==========================================================
# Application Lifespan
# ==========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    """

    # ------------------------------------------------------
    # Startup
    # ------------------------------------------------------

    logger.info("Initializing MedAI Backend...")

    await mongodb.connect()

    logger.info("Application startup completed.")

    yield

    # ------------------------------------------------------
    # Shutdown
    # ------------------------------------------------------

    await mongodb.disconnect()

    logger.info("Application shutdown completed.")


# ==========================================================
# FastAPI App
# ==========================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
)


# ==========================================================
# CORS
# ==========================================================

# NOTE: Frontend is not deployed yet (will go on Vercel).
# For now, only local dev origins are allowed.
# TODO: add the Vercel URL here once the frontend is deployed, e.g.
#       "https://your-app.vercel.app"
import os as _os

_extra_origin = _os.environ.get("FRONTEND_URL", "")  # e.g. https://medai.vercel.app

ALLOWED_ORIGINS = [
    "http://localhost:8080",   # TanStack Start dev port
    "http://localhost:5173",   # Vite default
    "http://localhost:3000",   # common alternate
    "http://localhost:4173",   # Vite preview
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

if _extra_origin:
    ALLOWED_ORIGINS.append(_extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# Static Files
# ==========================================================

# ----------------------------------------------------------
# Grad-CAM Images
# URL:
# http://127.0.0.1:8000/gradcam/<image_name>.png
# ----------------------------------------------------------

app.mount(
    "/gradcam",
    StaticFiles(
        directory=str(settings.GRADCAM_DIR),
    ),
    name="gradcam",
)


# ----------------------------------------------------------
# Generated PDF Reports
# URL:
# http://127.0.0.1:8000/reports/<report_name>.pdf
# ----------------------------------------------------------

app.mount(
    "/reports",
    StaticFiles(
        directory=str(settings.REPORTS_DIR),
    ),
    name="reports",
)


# ==========================================================
# API Routes
# ==========================================================

app.include_router(health_router)
app.include_router(predict_router)
app.include_router(report_router)
app.include_router(history_router)
app.include_router(chatbot_router)


# ==========================================================
# Startup Log
# ==========================================================

logger.info("MedAI API initialized.")