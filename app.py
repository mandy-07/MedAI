import os
import sys
import traceback

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

if __name__ == "__main__":
    is_hf = "SPACE_ID" in os.environ
    port = 7860 if is_hf else 8000
    
    # Launch standard Gradio (non-blocking)
    print("Launching Gradio interface...")
    demo.launch(server_name="0.0.0.0", server_port=port, prevent_thread_lock=True)
    print("Gradio interface launched.")
    sys.stdout.flush()
    
    try:
        # Intercept Gradio's internal FastAPI app
        app = demo.app
        if app is None:
            raise ValueError("Gradio app instance (demo.app) is None!")
            
        print("Registering custom API routes and database lifespan handlers...")
        sys.stdout.flush()
        
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

        # Register database connection events
        from backend.database import mongodb

        @app.on_event("startup")
        async def startup_event():
            print("Connecting to MongoDB...")
            sys.stdout.flush()
            await mongodb.connect()
            print("Connected to MongoDB successfully.")
            sys.stdout.flush()

        @app.on_event("shutdown")
        async def shutdown_event():
            await mongodb.disconnect()
            
        # Since startup events of demo.app already ran during launch(),
        # we need to trigger our MongoDB connection manually for the running app!
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(mongodb.connect())
        else:
            loop.run_until_complete(mongodb.connect())
            
        print("Initialization complete. Serving API and UI.")
        sys.stdout.flush()

    except Exception as e:
        print("Error during backend initialization:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()

    # Keep the main thread alive
    import time
    while True:
        time.sleep(1)
