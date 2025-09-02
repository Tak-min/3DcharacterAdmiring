#!/bin/bash
# 3D Character Admiring - Development Startup Script for Unix/Linux/macOS
# このスクリプトはMCPフェーズの開発環境を簡単に起動するためのものです

echo "==================================="
echo "3D Character Admiring (MCP)"
echo "Development Environment Startup"
echo "==================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in PATH"
    echo "Please install Python 3.9+ and try again"
    exit 1
fi

echo "[INFO] Python 3 found"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/src/mcp/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        exit 1
    fi
    echo "[SUCCESS] Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "[INFO] Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to activate virtual environment"
    exit 1
fi

echo "[SUCCESS] Virtual environment activated"
echo ""

# Check if requirements are installed
if ! pip list | grep -q "fastapi"; then
    echo "[INFO] Installing Python dependencies..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        exit 1
    fi
    echo "[SUCCESS] Dependencies installed"
    echo ""
else
    echo "[INFO] Dependencies already installed"
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "[WARNING] .env file not found"
    echo "[INFO] Creating .env from template..."
    cp ".env.template" ".env"
    echo "[IMPORTANT] Please edit .env file with your API keys:"
    echo "  - GEMINI_API_KEY (from Google AI Studio)"
    echo "  - SMTP settings (Gmail recommended)"
    echo "  - JWT_SECRET_KEY (32+ characters)"
    echo ""
    echo "Press any key to continue after editing .env file..."
    read -n 1 -s
    echo ""
fi

# Start the backend server
echo "[INFO] Starting FastAPI backend server..."
echo "[INFO] Backend will be available at: http://127.0.0.1:8000"
echo "[INFO] API Documentation: http://127.0.0.1:8000/api/docs"
echo ""
echo "[INFO] Frontend should be served from: src/mcp/frontend/"
echo "[INFO] Recommended: Use VSCode Live Server Extension"
echo "[INFO] Frontend URL: http://localhost:5500 or http://127.0.0.1:5500"
echo ""
echo "==================================="
echo "Server Starting..."
echo "Press Ctrl+C to stop the server"
echo "==================================="
echo ""

# Start uvicorn server
uvicorn main:app --reload --host 127.0.0.1 --port 8000

echo ""
echo "[INFO] Server stopped"
echo "Press any key to exit..."
read -n 1 -s
