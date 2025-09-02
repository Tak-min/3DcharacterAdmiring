# /app/services/elevenlabs_service.py
import requests
import base64
from app.core.config import settings

class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY is not set in the environment variables.")
        # This is a placeholder voice ID. You should replace it with your actual voice ID.
        self.voice_id = "21m00Tcm4TlvDq8ikWAM" # Example: Rachel
        self.api_url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"

    def synthesize(self, text: str) -> str:
        """
        Synthesizes text into speech and returns it as a base64 encoded string.
        """
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        try:
            response = requests.post(self.api_url, json=data, headers=headers)
            response.raise_for_status()
            
            # Encode the binary audio content to base64
            return base64.b64encode(response.content).decode('utf-8')
            
        except requests.exceptions.RequestException as e:
            print(f"Error calling ElevenLabs API: {e}")
            # Return empty string on failure
            return ""
