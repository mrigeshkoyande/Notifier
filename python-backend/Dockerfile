# ── Backend Dockerfile ─────────────────────────────────────────────────────────
# Google Cloud Run — Python Flask Backend
# Uses python:3.11-slim for a minimal image size (~150 MB)

# Stage 1: Build (install Python deps)
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system build dependencies needed by OpenCV headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# Stage 2: Runtime (lean final image)
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy only the installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY server.py .

# Cloud Run requires the container to listen on $PORT (default 8080)
# Gunicorn will bind to 0.0.0.0:$PORT
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV FLASK_DEBUG=false

# Create writable directories for runtime data
# NOTE: Cloud Run is ephemeral — data here is lost on restart.
# For persistence, mount a Cloud Storage FUSE bucket or use Firestore.
RUN mkdir -p /app/captured_images /app/attendance_records

EXPOSE 8080

# Use Gunicorn as the production WSGI server
# --workers 1: Cloud Run scales by launching new container instances, not threads
# --timeout 120: generous timeout for image-processing requests
CMD exec gunicorn \
    --bind "0.0.0.0:${PORT}" \
    --workers 1 \
    --threads 8 \
    --timeout 120 \
    server:app
