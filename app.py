import os
import sys

# Disable Gradio SSR (Server-Side Rendering) mode.
# This prevents Gradio from starting a Node.js proxy on port 7860,
# allowing our Uvicorn server to bind directly to port 7860.
os.environ["GRADIO_SSR_MODE"] = "false"

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
    # On Hugging Face Spaces, we bind directly to port 7860 (since SSR Node proxy is disabled).
    # Locally, we run on port 8000.
    is_hf = "SPACE_ID" in os.environ
    port = 7860 if is_hf else 8000
    
    uvicorn.run(app, host="0.0.0.0", port=port)
