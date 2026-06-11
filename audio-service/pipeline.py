"""
Multi-engine analysis pipeline.
Runs engines sequentially to keep memory usage flat on free-tier instances.
"""
import gc
import logging
import tempfile
import threading
import time
import urllib.request
from pathlib import Path

from engines.registry import EngineRegistry, DEFAULT_ENGINES
from models import (
    AnalyzeRequest, AnalyzeResponse, StandardizedMetrics,
    TempoMetrics, DynamicsMetrics, OnsetMetrics, TimingMetrics, SpectralMetrics,
    PitchMetrics, NoteMetrics, TimbreMetrics,
)

logger = logging.getLogger(__name__)

# Allow only 1 analysis at a time — prevents two concurrent requests from doubling peak memory
_analysis_semaphore = threading.Semaphore(1)


def _download_audio(url: str) -> Path:
    import re
    # Extract file extension from URL path before query string
    match = re.search(r'\.(\w+)(?:\?|$)', url.split('?')[0])
    ext = match.group(1).lower() if match else "audio"
    # Normalise common aliases
    ext = {"mpeg": "mp3", "x-m4a": "m4a", "x-wav": "wav"}.get(ext, ext)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
    tmp.close()
    dest = Path(tmp.name)
    logger.info("Downloading audio (%s) from %s", ext, url[:80])
    urllib.request.urlretrieve(url, dest)  # noqa: S310
    logger.info("Download complete: %.1f KB", dest.stat().st_size / 1024)
    return dest


def _run_single_engine(engine_name: str, audio_path: Path) -> tuple[str, StandardizedMetrics]:
    """Run one engine. Returns (engine_name, metrics). Never raises."""
    try:
        engine = EngineRegistry.get(engine_name)
        logger.info("Starting engine: %s", engine_name)
        t0 = time.perf_counter()
        metrics = engine.analyze(audio_path)
        elapsed = round(time.perf_counter() - t0, 2)
        logger.info("Engine %s finished in %.2fs", engine_name, elapsed)
        return engine_name, metrics
    except Exception as exc:
        logger.error("Engine %s failed: %s", engine_name, exc)
        return engine_name, _empty_metrics(engine_name)


def merge_metrics(results: dict[str, StandardizedMetrics]) -> StandardizedMetrics:
    """
    Merge per-engine metrics into one StandardizedMetrics.
    librosa provides the base structure; other engines fill in their fields.
    """
    librosa = results.get("librosa")
    crepe = results.get("crepe")
    basic_pitch = results.get("basic_pitch")
    essentia = results.get("essentia")

    if librosa is None:
        # Fallback: use any available result as base
        librosa = next(iter(results.values())) if results else _empty_metrics("none")

    engines_used = [
        name for name, m in results.items()
        if not m.error and (m.duration_seconds > 0 or name == "librosa")
    ]

    # Build merged scores
    scores: dict[str, float] = dict(librosa.scores)
    if crepe and crepe.pitch.available:
        if crepe.pitch.intonation_score is not None:
            scores["intonation_score"] = crepe.pitch.intonation_score
        if crepe.pitch.pitch_stability is not None:
            scores["pitch_stability_score"] = round(crepe.pitch.pitch_stability * 100, 1)
    if essentia and essentia.timbre.available:
        if essentia.timbre.articulation_quality_score is not None:
            scores["articulation_quality_score"] = essentia.timbre.articulation_quality_score

    return StandardizedMetrics(
        engine="multi-engine" if len(engines_used) > 1 else engines_used[0] if engines_used else "librosa",
        engine_version=librosa.engine_version,
        analysis_version="1.0",
        engines_used=engines_used,

        duration_seconds=librosa.duration_seconds,
        sample_rate=librosa.sample_rate,

        # librosa fields (always present)
        tempo=librosa.tempo,
        dynamics=librosa.dynamics,
        onsets=librosa.onsets,
        timing=librosa.timing,
        spectral=librosa.spectral,

        # CREPE pitch (if available)
        pitch=crepe.pitch if (crepe and crepe.pitch.available) else PitchMetrics(),

        # Basic Pitch notes (if available)
        notes=basic_pitch.notes if (basic_pitch and basic_pitch.notes.available) else NoteMetrics(),

        # Essentia timbre (if available)
        timbre=essentia.timbre if (essentia and essentia.timbre.available) else TimbreMetrics(),

        scores=scores,
    )


def run_analysis(request: AnalyzeRequest, engine_name: str = "librosa") -> AnalyzeResponse:
    """Single-engine interface (backwards-compatible). Wraps run_full_pipeline."""
    engines_to_run = [engine_name]
    result = run_full_pipeline(request, engines_to_run)
    return result


def run_full_pipeline(
    request: AnalyzeRequest,
    engines: list[str] | None = None,
) -> AnalyzeResponse:
    """
    Multi-engine pipeline:
    1. Download audio
    2. Run all requested engines in parallel (thread pool)
    3. Merge results
    4. Return AnalyzeResponse with merged StandardizedMetrics

    On error: never raises — sets metrics.error on failure.
    """
    t0 = time.perf_counter()
    audio_path: Path | None = None

    # Determine which engines to run
    if engines is None:
        engines = request.engines or DEFAULT_ENGINES

    # Filter to available engines
    available = EngineRegistry.available_engines()
    engines_to_run = [e for e in engines if e in available]

    if not engines_to_run:
        logger.warning("No available engines in requested list: %s", engines)
        engines_to_run = ["librosa"]  # fallback

    engines_attempted = list(engines_to_run)
    logger.info("Pipeline: recording=%s engines=%s", request.recording_id, engines_to_run)

    with _analysis_semaphore:
        try:
            audio_path = _download_audio(request.audio_url)

            results: dict[str, StandardizedMetrics] = {}

            # Run engines sequentially to keep peak memory flat
            for name in engines_to_run:
                engine_name, metrics = _run_single_engine(name, audio_path)
                results[engine_name] = metrics
                gc.collect()  # free engine memory before starting next

            engines_succeeded = [name for name, m in results.items() if not m.error]
            merged = merge_metrics(results)

        except Exception as exc:
            logger.exception("Pipeline failure for recording %s", request.recording_id)
            merged = _empty_metrics("pipeline", error=str(exc))
            engines_succeeded = []

        finally:
            if audio_path and audio_path.exists():
                try:
                    audio_path.unlink()
                except OSError:
                    pass
            gc.collect()

    elapsed = round(time.perf_counter() - t0, 3)
    return AnalyzeResponse(
        recording_id=request.recording_id,
        metrics=merged,
        processing_time_s=elapsed,
        engines_attempted=engines_attempted,
        engines_succeeded=engines_succeeded,
    )


# ── Helpers ────────────────────────────────────────────────────────────────

def _empty_metrics(engine: str, error: str | None = None) -> StandardizedMetrics:
    return StandardizedMetrics(
        engine=engine,
        engine_version="unknown",
        engines_used=[],
        duration_seconds=0.0,
        sample_rate=22050,
        tempo=TempoMetrics(bpm=0, stability=0, beats=[], downbeats=[]),
        dynamics=DynamicsMetrics(avg_db=0, max_db=0, min_db=0, dynamic_range_db=0),
        onsets=OnsetMetrics(count=0, times=[], strengths=[]),
        timing=TimingMetrics(avg_onset_interval_s=0, timing_consistency=0, rushing_tendency=0, dragging_tendency=0),
        spectral=SpectralMetrics(centroid_mean_hz=0, centroid_std_hz=0, bandwidth_mean_hz=0, rolloff_mean_hz=0, zero_crossing_rate_mean=0),
        error=error,
    )
