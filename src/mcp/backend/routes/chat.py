"""
Chat Routes for 3D Character Admiring App (MCP Phase)
Implements text-based conversation with Gemini AI integration
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

from database.database import get_db
from models.models import User, ChatMessage
from utils.jwt_handler import verify_token
from utils.gemini_service import gemini_service

# Router instance
chat_router = APIRouter()
security = HTTPBearer()


# Pydantic models for request/response
class ChatMessageRequest(BaseModel):
    message: str
    timestamp: Optional[str] = None


class ChatMessageResponse(BaseModel):
    response: str
    sentiment: str
    metadata: Dict[str, Any]
    message_id: str
    timestamp: str


class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    total_count: int
    character_info: Dict[str, Any]


class CharacterInfoResponse(BaseModel):
    character: Dict[str, Any]
    status: str
    interaction_count: int


# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Get current authenticated user from JWT token
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)
        email = payload.get("sub")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="認証が必要です",
            )
        
        user = db.query(User).filter(User.email == email).first()
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="ユーザーが見つからないか無効です",
            )
        
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
        )


@chat_router.post("/send", response_model=ChatMessageResponse)
async def send_message(
    chat_data: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI character and get response
    
    Args:
        chat_data: Chat message request data
        current_user: Authenticated user
        db: Database session
    
    Returns:
        AI character response with metadata
    """
    try:
        # Validate message length
        if not chat_data.message or len(chat_data.message.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="メッセージは空にできません"
            )
        
        if len(chat_data.message) > 500:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="メッセージは500文字以内で入力してください"
            )
        
        # Get recent conversation history for context
        recent_messages = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        
        # Prepare conversation history for AI
        conversation_history = []
        for msg in reversed(recent_messages):  # Reverse to get chronological order
            conversation_history.append({
                "role": "user",
                "content": msg.user_message
            })
            if msg.ai_response:
                conversation_history.append({
                    "role": "assistant",
                    "content": msg.ai_response
                })
        
        # Generate AI response
        start_time = datetime.now()
        
        ai_response, sentiment, metadata = await gemini_service.generate_response(
            chat_data.message,
            conversation_history
        )
        
        end_time = datetime.now()
        response_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Create chat message record
        chat_message = ChatMessage(
            user_id=current_user.id,
            user_message=chat_data.message.strip(),
            ai_response=ai_response,
            sentiment=sentiment,
            response_time_ms=response_time_ms,
            ai_model=metadata.get("model_used", "unknown"),
            created_at=start_time,
            responded_at=end_time
        )
        
        db.add(chat_message)
        db.commit()
        db.refresh(chat_message)
        
        # Prepare response
        response_data = ChatMessageResponse(
            response=ai_response,
            sentiment=sentiment,
            metadata={
                **metadata,
                "response_time_ms": response_time_ms,
                "conversation_id": chat_message.message_id,
                "user_message_length": len(chat_data.message),
                "response_length": len(ai_response)
            },
            message_id=chat_message.message_id,
            timestamp=end_time.isoformat()
        )
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メッセージの処理中にエラーが発生しました"
        )


@chat_router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat history for the current user
    
    Args:
        limit: Maximum number of messages to return
        offset: Number of messages to skip
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Chat history with character information
    """
    try:
        # Validate pagination parameters
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20
        if offset < 0:
            offset = 0
        
        # Get total message count
        total_count = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).count()
        
        # Get messages with pagination
        messages = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()
        
        # Format messages for response
        formatted_messages = []
        for msg in reversed(messages):  # Show in chronological order
            formatted_messages.extend([
                {
                    "id": f"{msg.message_id}_user",
                    "role": "user",
                    "content": msg.user_message,
                    "timestamp": msg.created_at.isoformat(),
                    "sentiment": None
                },
                {
                    "id": f"{msg.message_id}_ai",
                    "role": "assistant",
                    "content": msg.ai_response,
                    "timestamp": msg.responded_at.isoformat() if msg.responded_at else msg.created_at.isoformat(),
                    "sentiment": msg.sentiment,
                    "response_time_ms": msg.response_time_ms,
                    "ai_model": msg.ai_model
                }
            ])
        
        # Get character information
        character_info = gemini_service.get_character_info()
        
        return ChatHistoryResponse(
            messages=formatted_messages,
            total_count=total_count,
            character_info=character_info
        )
        
    except Exception as e:
        print(f"Chat history error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="チャット履歴の取得中にエラーが発生しました"
        )


@chat_router.get("/character", response_model=CharacterInfoResponse)
async def get_character_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get character information and interaction statistics
    
    Args:
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Character information and user interaction stats
    """
    try:
        # Get user interaction count
        interaction_count = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).count()
        
        # Get character information
        character_info = gemini_service.get_character_info()
        
        # Generate dynamic character status
        character_status = await gemini_service.generate_character_status(interaction_count)
        
        return CharacterInfoResponse(
            character=character_info,
            status=character_status,
            interaction_count=interaction_count
        )
        
    except Exception as e:
        print(f"Character info error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="キャラクター情報の取得中にエラーが発生しました"
        )


@chat_router.delete("/history", response_model=Dict[str, str])
async def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear all chat history for the current user
    
    Args:
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    try:
        # Delete all chat messages for the user
        deleted_count = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).delete()
        
        db.commit()
        
        return {
            "message": f"チャット履歴を削除しました ({deleted_count} 件)",
            "deleted_count": str(deleted_count)
        }
        
    except Exception as e:
        db.rollback()
        print(f"Clear chat history error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="チャット履歴の削除中にエラーが発生しました"
        )


@chat_router.get("/stats", response_model=Dict[str, Any])
async def get_chat_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat statistics for the current user
    
    Args:
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Chat statistics and analytics
    """
    try:
        # Basic stats
        total_messages = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).count()
        
        # Recent activity (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_messages = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.created_at >= seven_days_ago
        ).count()
        
        # Average response time
        avg_response_time = db.query(
            func.avg(ChatMessage.response_time_ms)
        ).filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.response_time_ms.isnot(None)
        ).scalar()
        
        # Sentiment distribution
        sentiment_stats = {}
        sentiments = db.query(ChatMessage.sentiment).filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.sentiment.isnot(None)
        ).all()
        
        for sentiment_tuple in sentiments:
            sentiment = sentiment_tuple[0]
            sentiment_stats[sentiment] = sentiment_stats.get(sentiment, 0) + 1
        
        return {
            "total_messages": total_messages,
            "recent_messages_7d": recent_messages,
            "average_response_time_ms": round(avg_response_time) if avg_response_time else None,
            "sentiment_distribution": sentiment_stats,
            "account_created": current_user.created_at.isoformat() if current_user.created_at else None,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None
        }
        
    except Exception as e:
        print(f"Chat stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="統計情報の取得中にエラーが発生しました"
        )


# Import required for sentiment stats
from sqlalchemy import func
from datetime import timedelta
