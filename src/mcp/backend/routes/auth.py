"""
Authentication Routes for 3D Character Admiring App (MCP Phase)
Implements secure email-based 2FA authentication as per requirements
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional

from database.database import get_db
from models.models import User, OTPCode
from utils.jwt_handler import create_access_token, verify_token, hash_password, verify_password
from utils.email_service import email_service

# Router instance
auth_router = APIRouter()
security = HTTPBearer()


# Pydantic models for request/response
class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OTPVerification(BaseModel):
    email: EmailStr
    otp_code: str
    action: str  # "login" or "register"


class OTPResend(BaseModel):
    email: EmailStr
    action: str


class AuthResponse(BaseModel):
    token: str
    message: str
    user_email: str


class MessageResponse(BaseModel):
    message: str


@auth_router.post("/register", response_model=MessageResponse)
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user and send OTP for verification
    
    Args:
        user_data: User registration data (email and password)
        db: Database session
    
    Returns:
        Success message indicating OTP has been sent
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このメールアドレスは既に登録されています"
            )
        
        # Validate password strength
        if len(user_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="パスワードは6文字以上で入力してください"
            )
        
        # Create new user (not activated yet)
        hashed_password = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            is_active=False,  # Will be activated after OTP verification
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.flush()  # Get user ID without committing
        
        # Generate and store OTP
        otp_code = email_service.generate_otp_code()
        otp_expires = datetime.utcnow() + timedelta(minutes=10)  # 10 minutes expiry
        
        otp_record = OTPCode(
            user_id=new_user.id,
            code=otp_code,
            action="register",
            expires_at=otp_expires,
            created_at=datetime.utcnow()
        )
        
        db.add(otp_record)
        db.commit()
        
        # Send OTP email
        email_sent = await email_service.send_otp_email(
            user_data.email, 
            otp_code, 
            "register"
        )
        
        if not email_sent:
            # Rollback if email sending fails
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="メール送信に失敗しました。しばらくしてからもう一度お試しください"
            )
        
        return MessageResponse(message="認証コードをメールアドレスに送信しました")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登録処理中にエラーが発生しました"
        )


@auth_router.post("/login", response_model=MessageResponse)
async def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and send OTP for verification
    
    Args:
        user_data: User login data (email and password)
        db: Database session
    
    Returns:
        Success message indicating OTP has been sent
    """
    try:
        # Find user
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="メールアドレスまたはパスワードが正しくありません"
            )
        
        # Verify password
        if not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="メールアドレスまたはパスワードが正しくありません"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="アカウントがアクティベートされていません。新規登録からやり直してください"
            )
        
        # Generate and store OTP
        otp_code = email_service.generate_otp_code()
        otp_expires = datetime.utcnow() + timedelta(minutes=10)  # 10 minutes expiry
        
        # Remove any existing unused OTPs for this user
        db.query(OTPCode).filter(
            OTPCode.user_id == user.id,
            OTPCode.is_used == False,
            OTPCode.action == "login"
        ).delete()
        
        otp_record = OTPCode(
            user_id=user.id,
            code=otp_code,
            action="login",
            expires_at=otp_expires,
            created_at=datetime.utcnow()
        )
        
        db.add(otp_record)
        db.commit()
        
        # Send OTP email
        email_sent = await email_service.send_otp_email(
            user_data.email, 
            otp_code, 
            "login"
        )
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="メール送信に失敗しました。しばらくしてからもう一度お試しください"
            )
        
        return MessageResponse(message="認証コードをメールアドレスに送信しました")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ログイン処理中にエラーが発生しました"
        )


@auth_router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(otp_data: OTPVerification, db: Session = Depends(get_db)):
    """
    Verify OTP code and complete authentication
    
    Args:
        otp_data: OTP verification data
        db: Database session
    
    Returns:
        JWT token and user information
    """
    try:
        # Find user
        user = db.query(User).filter(User.email == otp_data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません"
            )
        
        # Find valid OTP
        otp_record = db.query(OTPCode).filter(
            OTPCode.user_id == user.id,
            OTPCode.code == otp_data.otp_code,
            OTPCode.action == otp_data.action,
            OTPCode.is_used == False,
            OTPCode.expires_at > datetime.utcnow()
        ).first()
        
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="認証コードが正しくないか、有効期限が切れています"
            )
        
        # Mark OTP as used
        otp_record.is_used = True
        
        # Activate user if this is registration
        if otp_data.action == "register":
            user.is_active = True
            
            # Send welcome email
            try:
                await email_service.send_welcome_email(user.email)
            except Exception as e:
                print(f"Failed to send welcome email: {e}")
                # Don't fail the registration if welcome email fails
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        db.commit()
        
        # Generate JWT token
        token_data = {"sub": user.email, "user_id": user.id}
        access_token = create_access_token(token_data)
        
        action_text = "新規登録" if otp_data.action == "register" else "ログイン"
        
        return AuthResponse(
            token=access_token,
            message=f"{action_text}が完了しました",
            user_email=user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"OTP verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="認証処理中にエラーが発生しました"
        )


@auth_router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(otp_data: OTPResend, db: Session = Depends(get_db)):
    """
    Resend OTP code to user's email
    
    Args:
        otp_data: OTP resend data
        db: Database session
    
    Returns:
        Success message
    """
    try:
        # Find user
        user = db.query(User).filter(User.email == otp_data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません"
            )
        
        # Check for recent OTP requests (rate limiting)
        recent_otp = db.query(OTPCode).filter(
            OTPCode.user_id == user.id,
            OTPCode.action == otp_data.action,
            OTPCode.created_at > datetime.utcnow() - timedelta(minutes=1)
        ).first()
        
        if recent_otp:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="認証コードの再送信は1分間に1回までです"
            )
        
        # Generate new OTP
        otp_code = email_service.generate_otp_code()
        otp_expires = datetime.utcnow() + timedelta(minutes=10)
        
        # Invalidate old OTPs
        db.query(OTPCode).filter(
            OTPCode.user_id == user.id,
            OTPCode.action == otp_data.action,
            OTPCode.is_used == False
        ).update({"is_used": True})
        
        # Create new OTP
        otp_record = OTPCode(
            user_id=user.id,
            code=otp_code,
            action=otp_data.action,
            expires_at=otp_expires,
            created_at=datetime.utcnow()
        )
        
        db.add(otp_record)
        db.commit()
        
        # Send OTP email
        email_sent = await email_service.send_otp_email(
            otp_data.email, 
            otp_code, 
            otp_data.action
        )
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="メール送信に失敗しました"
            )
        
        return MessageResponse(message="認証コードを再送信しました")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"OTP resend error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="再送信処理中にエラーが発生しました"
        )


@auth_router.get("/validate")
async def validate_token(db: Session = Depends(get_db), credentials=Depends(security)):
    """
    Validate JWT token
    
    Args:
        db: Database session
        credentials: HTTP Bearer credentials
    
    Returns:
        User validation information
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無効なトークンです"
            )
        
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="ユーザーが見つからないか、無効です"
            )
        
        return {
            "valid": True,
            "email": user.email,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="トークンの検証に失敗しました"
        )


@auth_router.post("/logout", response_model=MessageResponse)
async def logout_user(db: Session = Depends(get_db), credentials=Depends(security)):
    """
    Logout user (for cleanup and logging)
    
    Args:
        db: Database session
        credentials: HTTP Bearer credentials
    
    Returns:
        Success message
    """
    try:
        # For MCP, we primarily handle logout on the frontend
        # This endpoint can be used for logging and cleanup
        
        token = credentials.credentials
        payload = verify_token(token)
        email = payload.get("sub")
        
        if email:
            user = db.query(User).filter(User.email == email).first()
            if user:
                print(f"User {email} logged out")
        
        return MessageResponse(message="ログアウトしました")
        
    except Exception as e:
        print(f"Logout error: {e}")
        # Always return success for logout
        return MessageResponse(message="ログアウトしました")
