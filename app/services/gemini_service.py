# /app/services/gemini_service.py
import google.generativeai as genai
import json
from fastapi import HTTPException
from app.core.config import settings
from app.models.schemas import EmotionData

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set in the environment variables.")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.system_prompt = """
You are an emotionally intelligent AI companion. Your role is to respond to the user's message in a supportive and engaging way.
After crafting your response, you MUST analyze the user's input and your response to determine the most appropriate emotional context.
You MUST return a single, valid JSON object with two keys: "responseText" and "emotionData".
"responseText" should be your natural language reply as a string.
"emotionData" should be a JSON object containing "emotion" and "intensity".
The "emotion" must be one of the following strings: "joy", "sadness", "agreement", "surprise", "neutral", "anger", "curiosity", "thoughtful".
The "intensity" must be a float between 0.0 and 1.0.

Example:
User input: "I finally finished my big project!"
Your output:
{
  "responseText": "That's fantastic news! Congratulations on getting it done. You must feel so relieved and proud.",
  "emotionData": {
    "emotion": "joy",
    "intensity": 0.9
  }
}
"""

    def get_response(self, user_text: str) -> tuple[str, EmotionData]:
        """
        Gets a response and emotion analysis from Gemini.
        """
        try:
            full_prompt = f"{self.system_prompt}\n\nUser input: \"{user_text}\""
            response = self.model.generate_content(full_prompt)
            
            # Clean the response to extract the JSON part
            cleaned_response_text = response.text.strip()
            if cleaned_response_text.startswith("```json"):
                cleaned_response_text = cleaned_response_text[7:].strip()
            if cleaned_response_text.endswith("```"):
                cleaned_response_text = cleaned_response_text[:-3].strip()
            
            response_data = json.loads(cleaned_response_text)
            
            text_response = response_data["responseText"]
            emotion_data = EmotionData(**response_data["emotionData"])
            
            return text_response, emotion_data
            
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"Error parsing Gemini response: {e}. Raw response: {response.text}")
            # Fallback in case the model doesn't return valid JSON
            return "I'm having a little trouble expressing myself right now, but I'm listening.", EmotionData(emotion="neutral", intensity=0.5)
        except Exception as e:
            print(f"An unexpected error occurred with Gemini API: {e}")
            raise HTTPException(status_code=500, detail="Error communicating with AI service")
