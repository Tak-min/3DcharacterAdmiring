"""
3D Character Admiring Web App - FastAPI Backend (MCP Phase)
References FastAPI official documentation: https://fastapi.tiangolo.com/

This is the main FastAPI application for the Minimum Viable Product (MCP) phase.
Implements secure authentication with email 2FA and Gemini 2.0 Flash integration.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from contextlib import asynccontextmanager

# Import route modules
from routes.auth import auth_router
from routes.chat import chat_router
from database.database import init_db, get_database
from models.models import User
from utils.jwt_handler import verify_token


# Application lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting 3D Character Admiring API (MCP)...")
    init_db()
    print("Database initialized")
    yield
    # Shutdown
    print("Shutting down API...")


# Create FastAPI application
app = FastAPI(
    title="3D Character Admiring API",
    description="Backend API for 3D Character interaction web application (MCP Phase)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Security scheme
security = HTTPBearer()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://localhost:5500",  # Live Server default
        "http://127.0.0.1:5500",
        # Add more origins as needed for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])

# Serve static files (frontend)
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Dependency for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to get current authenticated user from JWT token
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)
        email = payload.get("sub")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        db = get_database()
        user = db.query(User).filter(User.email == email).first()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint - serves frontend index.html
    """
    frontend_index = os.path.join(frontend_path, "index.html")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    else:
        return {
            "message": "3D Character Admiring API (MCP)",
            "version": "1.0.0",
            "status": "running",
            "docs": "/api/docs"
        }


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "phase": "MCP"
    }


# Protected endpoint example
@app.get("/api/user/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile (protected endpoint)
    """
    return {
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "is_active": current_user.is_active
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    Custom HTTP exception handler
    """
    return {
        "error": True,
        "message": exc.detail,
        "status_code": exc.status_code
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """
    General exception handler for unexpected errors
    """
    print(f"Unexpected error: {exc}")
    return {
        "error": True,
        "message": "Internal server error",
        "status_code": 500
    }


if __name__ == "__main__":
    # Development server configuration
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
