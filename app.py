import os
import sys

# Ensure the project root is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import gradio as gr

# Create a simple, clean Gradio interface to display Space status
with gr.Blocks(title="MedAI Backend") as demo:
    gr.Markdown("# 🏥 MedAI Radiology AI API Backend")
    gr.Markdown("This Hugging Face Space hosts the FastAPI backend for the MedAI radiology assistant application.")
    gr.Markdown("### API Status: `🟢 Running & Healthy`")
    gr.Markdown(
        "The frontend is connected to this API. To view the API interactive docs, "
        "visit the [Swagger docs](/docs) endpoint."
    )

# Launch the Gradio interface first.
# This binds to port 7860 using Gradio's verified paths.
# prevent_thread_lock=True keeps the script running so we can attach our routes.
demo.launch(server_name="0.0.0.0", server_port=7860, prevent_thread_lock=True)

# Intercept Gradio's internal FastAPI app
app = demo.app

# Mount our custom routers
from backend.routes.health import router as health_router
from backend.routes.predict import router as predict_router
from backend.routes.report import router as report_router
from backend.routes.history import router as history_router
from backend.routes.chatbot import router as chatbot_router
from backend.config import settings

app.include_router(health_router)
app.include_router(predict_router, prefix=settings.API_V1_PREFIX)
app.include_router(report_router, prefix=settings.API_V1_PREFIX)
app.include_router(history_router, prefix=settings.API_V1_PREFIX)
app.include_router(chatbot_router, prefix=settings.API_V1_PREFIX)

# Mount static files directories
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/gradcam", StaticFiles(directory=str(settings.GRADCAM_DIR)), name="gradcam")
app.mount("/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports")

# Register database connection lifespan events
from backend.database import mongodb

@app.on_event("startup")
async def startup_event():
    await mongodb.connect()

@app.on_event("shutdown")
async def shutdown_event():
    await mongodb.disconnect()

# Keep the main thread alive
import time
while True:
    time.sleep(1)
