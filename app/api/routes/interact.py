# /app/api/routes/interact.py
from fastapi import APIRouter, Depends, HTTPException, status
import uuid
import base64

from app.models.schemas import InteractRequest, InteractResponse, EmotionData
from app.core.security import get_current_user
from app.services.assemblyai_service import AssemblyAIService
from app.services.gemini_service import GeminiService
from app.services.elevenlabs_service import ElevenLabsService
from app.core.animation_mapper import get_animation_for_emotion

router = APIRouter()

# Initialize services (consider dependency injection for better testing)
assemblyai_service = AssemblyAIService()
gemini_service = GeminiService()
elevenlabs_service = ElevenLabsService()

@router.post("/interact", response_model=InteractResponse)
async def handle_interaction(
    request: InteractRequest,
    user: dict = Depends(get_current_user)
):
    """
    Handles user interaction, processing text or audio input and returning
    an AI-generated response with emotion and animation data.
    """
    session_id = request.sessionId or str(uuid.uuid4())
    
    try:
        # 1. Transcribe audio if necessary
        if request.inputType == "audio":
            # The data is expected to be base64 encoded.
            user_text = assemblyai_service.transcribe_base64(request.data)
        else:
            user_text = request.data

        if not user_text:
            raise HTTPException(status_code=400, detail="Input text is empty after processing.")

        # 2. Get response and emotion from Gemini
        response_text, emotion = gemini_service.get_response(user_text)

        # 3. Map emotion to animation
        animation_name = get_animation_for_emotion(emotion.dict())

        # 4. Synthesize audio for the response
        audio_content = elevenlabs_service.synthesize(response_text)
        
        if not audio_content:
             # Handle failure in audio synthesis gracefully
            print("Warning: ElevenLabs service returned empty audio content.")
            # You might want to send a specific error or a silent response
            # For now, we send an empty string, and the frontend should handle it.

        return InteractResponse(
            responseText=response_text,
            audioContent=audio_content,
            emotionData=emotion,
            animationName=animation_name,
            sessionId=session_id,
        )

    except ValueError as e:
        # Catches errors like invalid base64
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Generic error handler for other unexpected issues
        print(f"An unexpected error occurred in /interact endpoint: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
