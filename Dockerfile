# ==========================================================
# Base Image
# ==========================================================
FROM python:3.11-slim

# ==========================================================
# Environment Variables
# ==========================================================
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ==========================================================
# Working Directory
# ==========================================================
WORKDIR /app

# ==========================================================
# ==========================================================
# Install System Dependencies
# ==========================================================
# libcairo, libpango, libgdk-pixbuf, and shared-mime-info are removed
# as they were only needed for WeasyPrint, which has been removed.
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# ==========================================================
# Memory & Optimization Environment Variables
# ==========================================================
ENV MALLOC_TRIM_THRESHOLD_=0 \
    PYTORCH_NO_CUDA_MEMORY_CACHING=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1

# ==========================================================
# Install Python Dependencies
# ==========================================================
COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ==========================================================
# Copy Project
# ==========================================================
COPY . .

# ==========================================================
# Expose Port
# ==========================================================
EXPOSE 8000

# ==========================================================
# Run FastAPI
# ==========================================================
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]