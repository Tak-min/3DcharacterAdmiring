# /app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import interact

app = FastAPI(
    title="3D AI Companion Backend",
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_ORIGIN_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(interact.router, prefix="/api", tags=["Interaction"])

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {"status": "ok"}
