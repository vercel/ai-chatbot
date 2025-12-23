# TiQology Voice Engine
# Replaces: ElevenLabs ($330/mo)
# Tech: Coqui TTS + Whisper STT
# Cost: $120/mo (c5.2xlarge)

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models (this will take time)
RUN python3 -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')"
RUN python3 -c "import whisper; whisper.load_model('large-v3')"

# Copy application code
COPY voice_engine.py .
COPY health_check.py .

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python health_check.py || exit 1

# Start server
CMD ["python", "voice_engine.py"]
