# TiQology Inference Engine
# Replaces: DeepInfra ($800/mo) + 90% of OpenAI/Anthropic
# Tech: vLLM + Llama 3.1
# Cost: $330/mo (g5.4xlarge spot)

FROM nvidia/cuda:12.1.0-devel-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install vLLM
RUN pip install vllm==0.2.7 torch==2.1.0

# Download Llama 3.1 8B model
RUN pip install huggingface-hub
RUN python3 -c "from huggingface_hub import snapshot_download; \
    snapshot_download('meta-llama/Meta-Llama-3.1-8B-Instruct', local_dir='/models/llama-3.1-8b')"

# Copy health check
COPY health_check.py .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
  CMD python3 health_check.py || exit 1

# Start vLLM server with OpenAI-compatible API
CMD ["python3", "-m", "vllm.entrypoints.openai.api_server", \
     "--model", "/models/llama-3.1-8b", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--gpu-memory-utilization", "0.9", \
     "--max-model-len", "8192", \
     "--dtype", "auto"]
