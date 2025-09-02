"""
Database Models for 3D Character Admiring App (MCP Phase)
Using SQLAlchemy ORM as per requirements specification
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """
    User model for authentication and user management
    Implements secure user storage for email-based 2FA authentication
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationship with OTP codes
    otp_codes = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")
    
    # Relationship with chat messages
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class OTPCode(Base):
    """
    OTP (One-Time Password) model for email-based 2FA
    Stores temporary verification codes sent via email
    """
    __tablename__ = "otp_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(6), nullable=False)  # 6-digit numeric code
    action = Column(String(50), nullable=False)  # 'login' or 'register'
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with user
    user = relationship("User", back_populates="otp_codes")


class ChatMessage(Base):
    """
    Chat message model for storing conversation history
    Supports text-based conversations with AI character (MCP phase)
    """
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_id = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Message content
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)
    
    # Metadata
    sentiment = Column(String(50), nullable=True)  # AI-detected sentiment
    response_time_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    ai_model = Column(String(100), default="gemini-2.0-flash")  # AI model used
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    
    # Relationship with user
    user = relationship("User", back_populates="chat_messages")


class UserSession(Base):
    """
    User session model for tracking active sessions
    Helps with security and session management
    """
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    
    # Session metadata
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(Text, nullable=True)
    
    # Session lifecycle
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)


# Future models for subsequent phases (commented out for MCP)
"""
class Character(Base):
    # Character model for Phase 2+
    # Will include character parameters, 3D model references, etc.
    pass

class UserCharacterRelation(Base):
    # User-Character relationship for Phase 3+
    # Will track affinity, interactions, etc.
    pass

class ShopItem(Base):
    # Shop items for Phase 3+
    pass

class UserInventory(Base):
    # User inventory for Phase 3+
    pass

class Achievement(Base):
    # Achievement system for Phase 4+
    pass
"""
