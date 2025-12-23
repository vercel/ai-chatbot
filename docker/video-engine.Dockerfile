# TiQology Video Engine
# Replaces: Pika ($588/mo)
# Tech: Stable Video Diffusion
# Cost: $330/mo (g5.2xlarge spot)

FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Stable Video Diffusion model
RUN python3 -c "from diffusers import StableVideoDiffusionPipeline; \
    StableVideoDiffusionPipeline.from_pretrained('stabilityai/stable-video-diffusion-img2vid-xt', torch_dtype='float16')"

# Copy application code
COPY video_engine.py .
COPY health_check.py .

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD python3 health_check.py || exit 1

# Start server
CMD ["python3", "video_engine.py"]
