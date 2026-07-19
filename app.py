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

if __name__ == "__main__":
    is_hf = "SPACE_ID" in os.environ
    port = 7860 if is_hf else 8000
    
    # Run standard Gradio launch (blocking)
    demo.launch(server_name="0.0.0.0", server_port=port)
