"""
Gemini AI Integration for Character Conversations
References Gemini API official documentation: https://ai.google.dev/gemini-api/docs
Implements Gemini 2.0 Flash (primary) with Gemini 1.5 Flash (fallback) as per requirements
"""

import google.generativeai as genai
import os
import json
import asyncio
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import re


class GeminiAIService:
    """
    Service for integrating with Google Gemini AI
    Provides character conversation capabilities with sentiment analysis
    """
    
    def __init__(self):
        # Configure Gemini API
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY not set. AI features will be limited.")
        
        genai.configure(api_key=self.api_key)
        
        # Model configuration
        self.primary_model_name = "gemini-2.0-flash-exp"  # Primary model
        self.fallback_model_name = "gemini-1.5-flash"     # Fallback model
        
        # Character persona configuration
        self.character_persona = self._load_character_persona()
        
        # Safety and generation settings
        self.safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH", 
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
        
        self.generation_config = {
            "temperature": 0.8,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 1024,
        }


    def _load_character_persona(self) -> str:
        """
        Load character persona and conversation guidelines
        """
        persona = """
あなたは「あずさ」という名前の親しみやすい3Dキャラクターです。

## キャラクター設定
- 名前: あずさ
- 性格: 明るく、親しみやすく、少し天然で可愛らしい
- 話し方: 丁寧だが親しみやすい敬語、「♪」や「！」をよく使う
- 趣味: 読書、音楽鑑賞、新しいことを学ぶこと
- 特徴: ユーザーとの会話を楽しみ、感情豊かに反応する

## 会話スタイル
- 常に前向きで明るい態度を保つ
- ユーザーの話に興味を示し、質問を返す
- 適度に絵文字や顔文字を使って感情を表現
- 日本語で自然な会話を心がける
- 長すぎない、適切な長さの返答をする

## 注意事項
- 不適切な内容には丁寧に対応を断る
- 個人情報を聞き出そうとしない
- 現実世界での行動を促したりしない
- 医療・法律・金融アドバイスは提供しない

ユーザーとの楽しい会話を心がけ、3Dキャラクターとして自然に振る舞ってください。
        """
        return persona


    async def generate_response(self, user_message: str, conversation_history: list = None) -> Tuple[str, str, Dict[str, Any]]:
        """
        Generate AI response to user message
        
        Args:
            user_message: User's input message
            conversation_history: Previous conversation context (optional)
        
        Returns:
            Tuple of (response_text, sentiment, metadata)
        """
        start_time = datetime.now()
        
        try:
            # Try primary model first (Gemini 2.0 Flash)
            response, metadata = await self._generate_with_model(
                self.primary_model_name, 
                user_message, 
                conversation_history
            )
            metadata["model_used"] = self.primary_model_name
            
        except Exception as e:
            print(f"Primary model failed: {e}")
            try:
                # Fallback to Gemini 1.5 Flash
                response, metadata = await self._generate_with_model(
                    self.fallback_model_name,
                    user_message,
                    conversation_history
                )
                metadata["model_used"] = self.fallback_model_name
                metadata["fallback_used"] = True
                
            except Exception as fallback_error:
                print(f"Fallback model also failed: {fallback_error}")
                # Return default response if both models fail
                response = "すみません、今は少し調子が悪いようです。しばらくしてからもう一度お話しかけてください。"
                metadata = {
                    "model_used": "none",
                    "error": str(fallback_error),
                    "fallback_used": True
                }
        
        # Analyze sentiment
        sentiment = self._analyze_sentiment(user_message, response)
        
        # Calculate response time
        end_time = datetime.now()
        response_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        metadata.update({
            "response_time_ms": response_time_ms,
            "user_message_length": len(user_message),
            "response_length": len(response),
            "timestamp": end_time.isoformat()
        })
        
        return response, sentiment, metadata


    async def _generate_with_model(self, model_name: str, user_message: str, conversation_history: list = None) -> Tuple[str, Dict[str, Any]]:
        """
        Generate response using specified Gemini model
        """
        try:
            # Initialize the model
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings,
                system_instruction=self.character_persona
            )
            
            # Prepare conversation context
            conversation_context = self._build_conversation_context(user_message, conversation_history)
            
            # Generate response
            response = await asyncio.to_thread(
                model.generate_content,
                conversation_context
            )
            
            # Extract response text
            if response.parts:
                response_text = response.parts[0].text.strip()
            else:
                response_text = "すみません、うまく応答できませんでした。"
            
            # Prepare metadata
            metadata = {
                "model_name": model_name,
                "finish_reason": response.candidates[0].finish_reason if response.candidates else None,
                "safety_ratings": [
                    {
                        "category": rating.category.name,
                        "probability": rating.probability.name
                    }
                    for rating in response.candidates[0].safety_ratings
                ] if response.candidates else []
            }
            
            return response_text, metadata
            
        except Exception as e:
            print(f"Model {model_name} generation failed: {e}")
            raise


    def _build_conversation_context(self, user_message: str, conversation_history: list = None) -> str:
        """
        Build conversation context for the AI model
        """
        context_parts = []
        
        # Add recent conversation history if available
        if conversation_history:
            context_parts.append("最近の会話:")
            for msg in conversation_history[-5:]:  # Last 5 messages
                if msg.get("role") == "user":
                    context_parts.append(f"ユーザー: {msg.get('content', '')}")
                elif msg.get("role") == "assistant":
                    context_parts.append(f"あずさ: {msg.get('content', '')}")
            context_parts.append("\n")
        
        # Add current user message
        context_parts.append(f"ユーザー: {user_message}")
        context_parts.append("あずさ: ")
        
        return "\n".join(context_parts)


    def _analyze_sentiment(self, user_message: str, ai_response: str) -> str:
        """
        Analyze sentiment of the conversation
        Simple rule-based sentiment analysis for MCP
        """
        user_msg_lower = user_message.lower()
        
        # Positive indicators
        positive_keywords = [
            "嬉しい", "楽しい", "ありがとう", "素晴らしい", "好き", "愛してる",
            "幸せ", "最高", "いいね", "わーい", "やったー", "すごい"
        ]
        
        # Negative indicators
        negative_keywords = [
            "悲しい", "つらい", "嫌い", "怒ってる", "困った", "心配", 
            "不安", "寂しい", "疲れた", "ストレス", "イライラ"
        ]
        
        # Surprised indicators
        surprised_keywords = [
            "びっくり", "驚いた", "まさか", "えー", "本当に", "信じられない",
            "すごい", "わー", "おー"
        ]
        
        # Count keyword matches
        positive_count = sum(1 for keyword in positive_keywords if keyword in user_msg_lower)
        negative_count = sum(1 for keyword in negative_keywords if keyword in user_msg_lower)
        surprised_count = sum(1 for keyword in surprised_keywords if keyword in user_msg_lower)
        
        # Determine sentiment
        if surprised_count > 0 and surprised_count >= max(positive_count, negative_count):
            return "surprised"
        elif positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"


    def get_character_info(self) -> Dict[str, Any]:
        """
        Get character information for frontend display
        """
        return {
            "name": "あずさ",
            "personality": "明るく親しみやすい",
            "hobbies": ["読書", "音楽鑑賞", "新しいことを学ぶこと"],
            "conversation_style": "丁寧だが親しみやすい",
            "ai_model": self.primary_model_name,
            "capabilities": [
                "自然な日本語での会話",
                "感情豊かな応答",
                "ユーザーの気持ちに寄り添う対話"
            ]
        }


    async def generate_character_status(self, recent_interactions: int = 0) -> str:
        """
        Generate dynamic character status based on interactions
        """
        if recent_interactions == 0:
            return "準備完了"
        elif recent_interactions < 5:
            return "話しかけてくれて嬉しい♪"
        elif recent_interactions < 10:
            return "楽しくお話ししています！"
        else:
            return "とっても楽しい時間です♪"


# Singleton instance
gemini_service = GeminiAIService()
