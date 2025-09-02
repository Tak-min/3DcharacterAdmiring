# /app/models/schemas.py
from pydantic import BaseModel, Field
from typing import Literal, Optional

# --- API Request Models ---

class InteractRequest(BaseModel):
    inputType: Literal["text", "audio"]
    data: str  # Text or base64 encoded audio data
    sessionId: Optional[str] = None

# --- API Response Models ---

class EmotionData(BaseModel):
    emotion: Literal["joy", "sadness", "agreement", "surprise", "neutral", "anger", "curiosity", "thoughtful"]
    intensity: float = Field(..., ge=0.0, le=1.0)

class InteractResponse(BaseModel):
    responseText: str
    audioContent: str  # base64 encoded audio data
    emotionData: EmotionData
    animationName: str
    sessionId: str

class HealthCheckResponse(BaseModel):
    status: str = "ok"
