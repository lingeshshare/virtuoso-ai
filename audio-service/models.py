"""
Standardized Metrics JSON — the contract between audio engines and the rest of the app.
No other part of the system should import from engine-specific modules.
"""
from typing import Optional
from pydantic import BaseModel, Field


class TempoMetrics(BaseModel):
    bpm: float
    stability: float = Field(ge=0, le=1, description="1.0 = perfectly metronomic")
    beats: list[float] = Field(default_factory=list, description="Beat timestamps in seconds")
    downbeats: list[float] = Field(default_factory=list)


class DynamicsMetrics(BaseModel):
    avg_db: float
    max_db: float
    min_db: float
    dynamic_range_db: float
    rms_curve: list[float] = Field(default_factory=list, description="RMS energy over time (0.1s frames)")
    rms_times: list[float] = Field(default_factory=list)


class OnsetMetrics(BaseModel):
    count: int
    times: list[float] = Field(default_factory=list, description="Onset timestamps in seconds")
    strengths: list[float] = Field(default_factory=list, description="Onset strength 0–1")


class TimingMetrics(BaseModel):
    avg_onset_interval_s: float
    timing_consistency: float = Field(ge=0, le=1, description="1.0 = perfectly even note spacing")
    rushing_tendency: float = Field(ge=0, le=1, description="Fraction of intervals shorter than expected")
    dragging_tendency: float = Field(ge=0, le=1, description="Fraction of intervals longer than expected")
    longest_gap_s: float = Field(default=0.0)
    longest_gap_time_s: float = Field(default=0.0, description="Timestamp where longest gap occurs")


class SpectralMetrics(BaseModel):
    centroid_mean_hz: float
    centroid_std_hz: float
    bandwidth_mean_hz: float
    rolloff_mean_hz: float
    zero_crossing_rate_mean: float


# ── CREPE pitch metrics ────────────────────────────────────────────────────

class PitchMetrics(BaseModel):
    """Populated by CREPE in Phase 6."""
    available: bool = False
    avg_confidence: Optional[float] = None
    median_pitch_hz: Optional[float] = None
    pitch_stability: Optional[float] = Field(default=None, ge=0, le=1, description="1.0 = no pitch deviation")

    # Intonation deviation from equal temperament (cents)
    avg_intonation_deviation_cents: Optional[float] = None
    intonation_score: Optional[float] = Field(default=None, ge=0, le=100)

    # Vibrato (if detected)
    vibrato_detected: bool = False
    vibrato_rate_hz: Optional[float] = None
    vibrato_extent_cents: Optional[float] = None

    # Raw arrays (downsampled for storage)
    pitch_times: list[float] = Field(default_factory=list)
    pitch_hz: list[float] = Field(default_factory=list)
    pitch_confidence: list[float] = Field(default_factory=list)
    pitch_cents_deviation: list[float] = Field(
        default_factory=list,
        description="Cents deviation from nearest equal-temperament pitch per frame"
    )


# ── Basic Pitch note metrics ───────────────────────────────────────────────

class NoteEvent(BaseModel):
    """A single detected note event from Basic Pitch."""
    start_time: float
    end_time: float
    duration_s: float
    pitch_midi: int          # MIDI note number 0–127
    pitch_hz: float          # frequency in Hz
    amplitude: float         # 0–1
    confidence: float = 1.0


class NoteMetrics(BaseModel):
    """Populated by Basic Pitch in Phase 6."""
    available: bool = False
    note_count: int = 0
    avg_note_duration_s: Optional[float] = None
    avg_amplitude: Optional[float] = None
    pitch_range_midi: Optional[int] = None    # highest - lowest MIDI note
    lowest_pitch_midi: Optional[int] = None
    highest_pitch_midi: Optional[int] = None
    notes: list[NoteEvent] = Field(default_factory=list)


# ── Essentia timbre metrics ────────────────────────────────────────────────

class TimbreMetrics(BaseModel):
    """Populated by Essentia in Phase 6."""
    available: bool = False

    # MFCCs (first 13 coefficients, mean across time)
    mfcc_mean: list[float] = Field(default_factory=list)
    mfcc_std: list[float] = Field(default_factory=list)

    # Spectral flux — how quickly the spectrum changes (articulation proxy)
    spectral_flux_mean: Optional[float] = None
    spectral_flux_std: Optional[float] = None

    # Articulation quality derived from spectral flux + onset alignment
    articulation_quality_score: Optional[float] = Field(
        default=None, ge=0, le=100,
        description="0–100 score based on attack clarity and spectral consistency"
    )

    # Loudness (EBUR128-style, more accurate than RMS)
    integrated_loudness_lufs: Optional[float] = None
    loudness_range_lu: Optional[float] = None


# ── Combined StandardizedMetrics ──────────────────────────────────────────

class StandardizedMetrics(BaseModel):
    """
    The universal output contract of the audio analysis pipeline.
    All downstream components (diagnosis engine, Claude coaching) consume this.
    Fields from each engine are populated by that engine; others are None/empty.
    """
    engine: str
    engine_version: str
    analysis_version: str = "1.0"
    engines_used: list[str] = Field(default_factory=list, description="All engines that contributed to this result")

    duration_seconds: float
    sample_rate: int

    # ── librosa ──
    tempo: TempoMetrics
    dynamics: DynamicsMetrics
    onsets: OnsetMetrics
    timing: TimingMetrics
    spectral: SpectralMetrics

    # ── CREPE (Phase 6) ──
    pitch: PitchMetrics = Field(default_factory=PitchMetrics)

    # ── Basic Pitch (Phase 6) ──
    notes: NoteMetrics = Field(default_factory=NoteMetrics)

    # ── Essentia (Phase 6) ──
    timbre: TimbreMetrics = Field(default_factory=TimbreMetrics)

    # Derived scores (0–100) computed after all metrics are gathered
    scores: dict[str, float] = Field(
        default_factory=dict,
        description="timing_score, dynamics_score, intonation_score, articulation_score, etc."
    )

    error: Optional[str] = None


class AnalyzeRequest(BaseModel):
    recording_id: str
    audio_url: str
    instrument: Optional[str] = None
    duration_hint_s: Optional[float] = None
    engines: Optional[list[str]] = Field(
        default=None,
        description="Which engines to run. Null = all available. e.g. ['librosa', 'crepe']"
    )


class AnalyzeResponse(BaseModel):
    recording_id: str
    metrics: StandardizedMetrics
    processing_time_s: float
    engines_attempted: list[str] = Field(default_factory=list)
    engines_succeeded: list[str] = Field(default_factory=list)
