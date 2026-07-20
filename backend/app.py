from contextlib import asynccontextmanager
from pathlib import Path
from io import BytesIO

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse

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
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
]

if _extra_origin:
    ALLOWED_ORIGINS.append(_extra_origin)

# In development allow ALL origins so any localhost port works.
# In production, only the explicit list above + FRONTEND_URL is used.
if settings.DEBUG:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # must be False when allow_origins=["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )



# ==========================================================
# Dynamic GridFS Fallback Route Handlers
# ==========================================================

@app.get("/reports/{filename}")
async def get_report_file(filename: str):
    """
    Serve a generated PDF report. Checks local cache first,
    falling back to MongoDB GridFS if not found.
    """
    local_path = Path(settings.REPORTS_DIR) / filename
    if local_path.exists():
        return FileResponse(local_path, media_type="application/pdf")

    # Retrieve from GridFS
    grid_out = await mongodb.get_file_stream(filename)
    if grid_out is not None:
        try:
            content = await grid_out.read()
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(content)
            return FileResponse(local_path, media_type="application/pdf")
        except Exception as e:
            logger.error("Failed to cache report %s from GridFS: %s", filename, e)
            return StreamingResponse(BytesIO(content), media_type="application/pdf")

    raise HTTPException(status_code=404, detail="Medical report not found")


@app.get("/gradcam/{filename}")
async def get_gradcam_file(filename: str):
    """
    Serve a Grad-CAM visualization image. Checks local cache first,
    falling back to MongoDB GridFS if not found.
    """
    local_path = Path(settings.GRADCAM_DIR) / filename
    if local_path.exists():
        return FileResponse(local_path, media_type="image/png")

    # Retrieve from GridFS
    grid_out = await mongodb.get_file_stream(filename)
    if grid_out is not None:
        try:
            content = await grid_out.read()
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(content)
            return FileResponse(local_path, media_type="image/png")
        except Exception as e:
            logger.error("Failed to cache Grad-CAM %s from GridFS: %s", filename, e)
            return StreamingResponse(BytesIO(content), media_type="image/png")

    raise HTTPException(status_code=404, detail="Grad-CAM visualization not found")


# ==========================================================
# Static Files
# ==========================================================

# ----------------------------------------------------------
# Grad-CAM Images
# URL:
# http://127.0.0.1:8000/gradcam/<image_name>.png
# ----------------------------------------------------------

app.mount(
    "/uploads",
    StaticFiles(
        directory=str(settings.UPLOAD_DIR),
    ),
    name="uploads",
)


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
app.include_router(predict_router, prefix=settings.API_V1_PREFIX)
app.include_router(report_router, prefix=settings.API_V1_PREFIX)
app.include_router(history_router, prefix=settings.API_V1_PREFIX)
app.include_router(chatbot_router, prefix=settings.API_V1_PREFIX)


# ==========================================================
# Startup Log
# ==========================================================

logger.info("MedAI API initialized.")