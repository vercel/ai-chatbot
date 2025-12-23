"""
TiQology Voice Engine Server
Provides Text-to-Speech and Speech-to-Text services
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from TTS.api import TTS
import whisper
import torch
import os
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="TiQology Voice Engine", version="1.0.0")

# Load models on startup
logger.info("Loading TTS model...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
logger.info("TTS model loaded successfully")

logger.info("Loading Whisper model...")
stt = whisper.load_model("large-v3")
logger.info("Whisper model loaded successfully")

# Check for GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    speed: float = 1.0
    speaker_wav: str | None = None

class STTRequest(BaseModel):
    language: str | None = None
    task: str = "transcribe"  # or "translate"

@app.get("/")
async def root():
    return {
        "service": "TiQology Voice Engine",
        "status": "operational",
        "features": ["tts", "stt", "voice_cloning"]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "tts": "loaded",
        "stt": "loaded",
        "device": device
    }

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech"""
    try:
        logger.info(f"TTS request: {len(request.text)} characters, language: {request.language}")
        
        # Generate audio
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            output_path = temp_file.name
            
            tts.tts_to_file(
                text=request.text,
                file_path=output_path,
                language=request.language,
                speed=request.speed
            )
            
            logger.info(f"TTS generated: {output_path}")
            return FileResponse(
                output_path,
                media_type="audio/wav",
                filename="tts_output.wav"
            )
    
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str | None = None,
    task: str = "transcribe"
):
    """Convert speech to text"""
    try:
        logger.info(f"STT request: {audio.filename}, task: {task}")
        
        # Save uploaded file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Transcribe
        result = stt.transcribe(
            temp_path,
            language=language,
            task=task
        )
        
        # Clean up
        os.unlink(temp_path)
        
        logger.info(f"STT completed: {len(result['text'])} characters")
        
        return {
            "text": result["text"],
            "language": result["language"],
            "segments": result.get("segments", [])
        }
    
    except Exception as e:
        logger.error(f"STT error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clone")
async def voice_clone(
    sample_audio: UploadFile = File(...),
    text: str = "",
    language: str = "en"
):
    """Clone voice from sample audio"""
    try:
        logger.info(f"Voice cloning request: {sample_audio.filename}")
        
        # Save sample audio
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            content = await sample_audio.read()
            temp_file.write(content)
            sample_path = temp_file.name
        
        # Generate with cloned voice
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as output_file:
            output_path = output_file.name
            
            tts.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=sample_path,
                language=language
            )
            
            # Clean up
            os.unlink(sample_path)
            
            logger.info(f"Voice cloning completed: {output_path}")
            return FileResponse(
                output_path,
                media_type="audio/wav",
                filename="cloned_voice.wav"
            )
    
    except Exception as e:
        logger.error(f"Voice cloning error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
