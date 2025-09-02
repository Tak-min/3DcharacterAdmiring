@echo off
REM 3D Character Admiring - Development Startup Script for Windows
REM このスクリプトはMCPフェーズの開発環境を簡単に起動するためのものです

echo ===================================
echo 3D Character Admiring (MCP)
echo Development Environment Startup
echo ===================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9+ and try again
    pause
    exit /b 1
)

echo [INFO] Python found
echo.

REM Navigate to backend directory
cd /d "%~dp0src\mcp\backend"

REM Check if virtual environment exists
if not exist "venv\" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created
    echo.
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

echo [SUCCESS] Virtual environment activated
echo.

REM Check if requirements are installed
pip list | findstr "fastapi" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
    echo.
) else (
    echo [INFO] Dependencies already installed
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found
    echo [INFO] Creating .env from template...
    copy ".env.template" ".env" >nul
    echo [IMPORTANT] Please edit .env file with your API keys:
    echo   - GEMINI_API_KEY (from Google AI Studio)
    echo   - SMTP settings (Gmail recommended)
    echo   - JWT_SECRET_KEY (32+ characters)
    echo.
    echo Press any key to open .env file for editing...
    pause >nul
    notepad .env
    echo.
)

REM Start the backend server
echo [INFO] Starting FastAPI backend server...
echo [INFO] Backend will be available at: http://127.0.0.1:8000
echo [INFO] API Documentation: http://127.0.0.1:8000/api/docs
echo.
echo [INFO] Frontend should be served from: src/mcp/frontend/
echo [INFO] Recommended: Use VSCode Live Server Extension
echo [INFO] Frontend URL: http://localhost:5500 or http://127.0.0.1:5500
echo.
echo ===================================
echo Server Starting...
echo Press Ctrl+C to stop the server
echo ===================================
echo.

REM Start uvicorn server
uvicorn main:app --reload --host 127.0.0.1 --port 8000

echo.
echo [INFO] Server stopped
pause
