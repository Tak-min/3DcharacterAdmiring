# /app/services/assemblyai_service.py
import base64
import requests
import time
from app.core.config import settings

class AssemblyAIService:
    def __init__(self):
        self.api_key = settings.ASSEMBLYAI_API_KEY
        if not self.api_key:
            raise ValueError("ASSEMBLYAI_API_KEY is not set in the environment variables.")
        self.headers = {"authorization": self.api_key}
        self.upload_endpoint = "https://api.assembly.com/v2/upload"
        self.transcript_endpoint = "https://api.assembly.com/v2/transcript"

    def transcribe_audio_url(self, audio_url: str) -> str:
        """Transcribes audio from a URL."""
        json_data = {"audio_url": audio_url}
        response = requests.post(self.transcript_endpoint, json=json_data, headers=self.headers)
        response.raise_for_status()
        transcript_id = response.json()['id']
        
        while True:
            transcript_response = requests.get(f"{self.transcript_endpoint}/{transcript_id}", headers=self.headers)
            transcript_response.raise_for_status()
            transcript_data = transcript_response.json()
            if transcript_data['status'] == 'completed':
                return transcript_data['text']
            elif transcript_data['status'] == 'failed':
                raise Exception(f"Transcription failed: {transcript_data.get('error', 'Unknown error')}")
            time.sleep(3)

    def transcribe_audio_bytes(self, audio_bytes: bytes) -> str:
        """Transcribes audio from raw bytes."""
        upload_response = requests.post(self.upload_endpoint, headers=self.headers, data=audio_bytes)
        upload_response.raise_for_status()
        audio_url = upload_response.json()["upload_url"]
        return self.transcribe_audio_url(audio_url)

    def transcribe_base64(self, audio_base64: str) -> str:
        """Decodes base64 audio and transcribes it."""
        try:
            # Add padding if missing
            missing_padding = len(audio_base64) % 4
            if missing_padding:
                audio_base64 += '=' * (4 - missing_padding)
            audio_bytes = base64.b64decode(audio_base64)
            return self.transcribe_audio_bytes(audio_bytes)
        except (base64.binascii.Error, ValueError) as e:
            raise ValueError(f"Invalid base64 audio data: {e}")
        except Exception as e:
            print(f"An error occurred during transcription: {e}")
            raise
