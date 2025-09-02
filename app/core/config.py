# /app/core/config.py
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    AUTH0_DOMAIN: str = os.getenv("AUTH0_DOMAIN")
    AUTH0_API_AUDIENCE: str = os.getenv("AUTH0_API_AUDIENCE")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    ASSEMBLYAI_API_KEY: str = os.getenv("ASSEMBLYAI_API_KEY")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY")
    
    # Frontend URL for CORS
    CLIENT_ORIGIN_URL: str = os.getenv("CLIENT_ORIGIN_URL", "http://localhost:3000")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
