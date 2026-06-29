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
# Install System Dependencies
# ==========================================================
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

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