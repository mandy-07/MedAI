import os
import sys

# Ensure the project root is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import gradio as gr
from backend.app import app as fastapi_app

# Create a simple, clean Gradio interface to display Space status
with gr.Blocks(title="MedAI Backend") as demo:
    gr.Markdown("# 🏥 MedAI Radiology AI API Backend")
    gr.Markdown("This Hugging Face Space hosts the FastAPI backend for the MedAI radiology assistant application.")
    gr.Markdown("### API Status: `🟢 Running & Healthy`")
    gr.Markdown(
        "The frontend is connected to this API. To view the API interactive docs, "
        "visit the [Swagger docs](/docs) endpoint."
    )

# Mount the Gradio interface onto our FastAPI app.
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    # On Hugging Face Spaces, the Node proxy runs on 7860 and forwards to Python on 7861.
    # Locally, we run on port 8000.
    is_hf = "SPACE_ID" in os.environ
    port = 7861 if is_hf else 8000
    
    uvicorn.run(app, host="0.0.0.0", port=port)
