from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import uvicorn
import os
import logging
import uuid
from datetime import datetime
from dotenv import load_dotenv
from gemini_client import process_image_with_gemini
from groq_client import chatbot, filter_fields_generator
from graph_matchmaker import compute_weighted_match

load_dotenv()
app = FastAPI()
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

required_env_vars = ["GEMINI_API_KEY", "GROQ_API_KEY"]
missing_env_vars = [name for name in required_env_vars if not os.getenv(name)]
if missing_env_vars:
    logger.warning("Missing env vars: %s", ", ".join(missing_env_vars))

service_api_key = os.getenv("AI_ENGINE_API_KEY", "").strip()

frontend_origins = (
    os.getenv("FRONTEND_ORIGINS")
    or os.getenv("CORS_ORIGINS")
    or "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://c2net.vercel.app"
)
allowed_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def attach_request_id_and_optional_auth(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    public_paths = {"/", "/health"}

    if service_api_key and request.url.path not in public_paths:
        provided_api_key = request.headers.get("x-api-key", "")
        if provided_api_key != service_api_key:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-engine",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "ai-engine",
        "message": "AI engine is running",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


class ImageRequest(BaseModel):
    image: str
    instruction: str = "concise"


class MatchmakerFilterRequest(BaseModel):
    prompt: str


class GraphMatchRequest(BaseModel):
    currentUser: Dict[str, Any] = {}
    candidates: List[Dict[str, Any]] = []


@app.post("/generate")
async def generate_endpoint(request: ImageRequest):
    try:
        if not request.image:
            raise HTTPException(status_code=400, detail="Image input is missing")

        result = process_image_with_gemini(image_input=request.image, instruction=request.instruction)
        return {"status": "success", "style_used": request.instruction, "caption": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("/generate failed: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/matchmaker-filters")
async def matchmaker_filters_endpoint(request: MatchmakerFilterRequest):
    try:
        if not request.prompt or not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")

        filters = filter_fields_generator(request.prompt)
        return {"status": "success", "filters": filters}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("/matchmaker-filters failed: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/matchmaker")
async def matchmaker_filter(request: MatchmakerFilterRequest):
    try:
        if not request.prompt or not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")

        filters = filter_fields_generator(request.prompt)
        return {"status": "success", "filters": filters}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("/matchmaker failed: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/matchmaker/score")
async def matchmaker_score_endpoint(request: GraphMatchRequest):
    try:
        scored = compute_weighted_match(request.currentUser or {}, request.candidates or [])
        return {"status": "success", "matches": scored}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("/matchmaker/score failed: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    server_host = os.getenv("SERVER_HOST", "0.0.0.0")
    server_port = int(os.getenv("SERVER_PORT", 8000))
    uvicorn.run(app, host=server_host, port=server_port)