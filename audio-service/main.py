"""
Virtuoso AI — Audio Analysis Service
FastAPI app. Receives analyze requests from the Next.js backend.
Never called directly by the browser.
"""
import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from models import AnalyzeRequest, AnalyzeResponse
from pipeline import run_full_pipeline
from engines.registry import EngineRegistry, DEFAULT_ENGINES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

API_KEY = os.getenv("AUDIO_SERVICE_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    available = EngineRegistry.available_engines()
    all_engines = EngineRegistry.all_names()
    missing = [e for e in all_engines if e not in available]
    logger.info("Audio Analysis Service starting")
    logger.info("  Available engines: %s", available)
    if missing:
        logger.info("  Engines not installed (optional): %s", missing)
    yield
    logger.info("Audio Analysis Service shutting down.")


app = FastAPI(
    title="Virtuoso AI Audio Analysis Service",
    version="2.0.0",
    description="Multi-engine audio analysis pipeline. Outputs StandardizedMetrics JSON.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_URL", "http://localhost:3000")],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _check_api_key(key: str | None):
    if API_KEY and key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health():
    available = EngineRegistry.available_engines()
    return {
        "status": "ok",
        "engines_available": available,
        "engines_all": EngineRegistry.all_names(),
        "default_engines": DEFAULT_ENGINES,
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    x_api_key: Optional[str] = Header(default=None),
):
    """
    Analyze an audio file. Runs all available engines in parallel.

    - recording_id: Supabase recording UUID (echoed back in response)
    - audio_url: Signed URL to the audio file
    - engines: Optional list to restrict which engines run (default: all available)
    """
    _check_api_key(x_api_key)

    if request.engines:
        unknown = [e for e in request.engines if e not in EngineRegistry.all_names()]
        if unknown:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown engines: {unknown}. All: {EngineRegistry.all_names()}",
            )

    logger.info(
        "Analyze request: recording=%s engines=%s",
        request.recording_id,
        request.engines or "all-available",
    )

    t0 = time.perf_counter()
    result = await asyncio.get_event_loop().run_in_executor(
        None, lambda: run_full_pipeline(request, request.engines)
    )

    elapsed = round(time.perf_counter() - t0, 3)
    logger.info(
        "Analysis complete: recording=%s duration=%.1fs engines=%s total=%.3fs",
        request.recording_id,
        result.metrics.duration_seconds,
        result.engines_succeeded,
        elapsed,
    )
    return result


@app.get("/engines")
def list_engines():
    available = EngineRegistry.available_engines()
    return {
        "available": available,
        "all": EngineRegistry.all_names(),
        "details": {
            name: {
                "available": name in available,
                "phase": {"librosa": 4, "crepe": 6, "basic_pitch": 6, "essentia": 6}.get(name, 0),
            }
            for name in EngineRegistry.all_names()
        },
    }
